import { ReadingSession } from '../types/session';

// ── Date helpers ──────────────────────────────────────────────────────────────

function dateToStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function daysAgo(n: number): Date {
  return new Date(Date.now() - n * 86400000);
}

function weeksAgo(n: number): Date {
  return daysAgo(n * 7);
}

// ── Core stat: streak ─────────────────────────────────────────────────────────

/**
 * Consecutive calendar days with at least one session,
 * counting backwards from today. If today has no session,
 * the streak is still valid if yesterday does.
 */
export function computeStreak(sessions: ReadingSession[]): number {
  if (sessions.length === 0) return 0;

  const dates = new Set(sessions.map((s) => s.date));
  const today = dateToStr(new Date());
  const yesterday = dateToStr(daysAgo(1));

  // If neither today nor yesterday has a session, streak is broken
  if (!dates.has(today) && !dates.has(yesterday)) return 0;

  // Walk backwards from today
  let streak = 0;
  let cursor = new Date();

  while (true) {
    const str = dateToStr(cursor);
    if (dates.has(str)) {
      streak++;
      cursor = new Date(cursor.getTime() - 86400000);
    } else {
      break;
    }
  }

  return streak;
}

// ── Weekly trend (last N weeks, Mon-based) ────────────────────────────────────

export interface WeekBucket {
  label: string;   // e.g. "W1", "W2" or "06/01"
  pages: number;
  timeMin: number;
  sessionCount: number;
}

export function computeWeeklyTrend(
  sessions: ReadingSession[],
  weeks = 8
): WeekBucket[] {
  const buckets: WeekBucket[] = [];

  for (let w = weeks - 1; w >= 0; w--) {
    const weekStart = dateToStr(daysAgo(w * 7 + 6));
    const weekEnd = dateToStr(daysAgo(w * 7));

    const inWeek = sessions.filter(
      (s) => s.date >= weekStart && s.date <= weekEnd
    );

    // Label: "MM/DD" of week start
    const startD = daysAgo(w * 7 + 6);
    const label = `${String(startD.getMonth() + 1).padStart(2, '0')}/${String(startD.getDate()).padStart(2, '0')}`;

    buckets.push({
      label,
      pages: inWeek.reduce((sum, s) => sum + Math.max(0, s.endPage - s.startPage), 0),
      timeMin: inWeek.reduce((sum, s) => sum + s.readingTimeMin, 0),
      sessionCount: inWeek.length,
    });
  }

  return buckets;
}

// ── Daily pages for calendar month ───────────────────────────────────────────

export interface DayCell {
  date: string;     // YYYY-MM-DD
  dayOfMonth: number;
  dayOfWeek: number; // 0 = Sun
  pages: number;
  hasSession: boolean;
  isToday: boolean;
  isFuture: boolean;
}

export interface CalendarMonth {
  year: number;
  month: number;    // 1-based
  label: string;   // "JUN 2026"
  days: DayCell[];
  leadingBlanks: number; // blanks before day 1 (0 = Sun)
}

export function computeCalendarMonth(
  sessions: ReadingSession[],
  year: number,
  month: number  // 1-based
): CalendarMonth {
  const today = dateToStr(new Date());

  // Pages by date
  const pagesByDate = new Map<string, number>();
  for (const s of sessions) {
    const pages = Math.max(0, s.endPage - s.startPage);
    pagesByDate.set(s.date, (pagesByDate.get(s.date) ?? 0) + pages);
  }

  const daysInMonth = new Date(year, month, 0).getDate();
  const firstDay = new Date(year, month - 1, 1).getDay(); // 0=Sun

  const MONTHS = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];

  const days: DayCell[] = [];
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const dow = new Date(year, month - 1, d).getDay();
    const pages = pagesByDate.get(dateStr) ?? 0;
    days.push({
      date: dateStr,
      dayOfMonth: d,
      dayOfWeek: dow,
      pages,
      hasSession: pagesByDate.has(dateStr),
      isToday: dateStr === today,
      isFuture: dateStr > today,
    });
  }

  return {
    year,
    month,
    label: `${MONTHS[month - 1]} ${year}`,
    days,
    leadingBlanks: firstDay,
  };
}

// ── Book breakdown ────────────────────────────────────────────────────────────

export interface BookBreakdown {
  bookId: string;
  bookTitle: string;
  bookAuthor: string;
  totalPages: number;
  totalTimeMin: number;
  sessionCount: number;
  lastDate: string;
}

export function computeBookBreakdown(sessions: ReadingSession[]): BookBreakdown[] {
  const map = new Map<string, BookBreakdown>();

  for (const s of sessions) {
    const pages = Math.max(0, s.endPage - s.startPage);
    const existing = map.get(s.bookId);
    if (existing) {
      existing.totalPages += pages;
      existing.totalTimeMin += s.readingTimeMin;
      existing.sessionCount += 1;
      if (s.date > existing.lastDate) existing.lastDate = s.date;
    } else {
      map.set(s.bookId, {
        bookId: s.bookId,
        bookTitle: s.bookTitle,
        bookAuthor: s.bookAuthor,
        totalPages: pages,
        totalTimeMin: s.readingTimeMin,
        sessionCount: 1,
        lastDate: s.date,
      });
    }
  }

  return Array.from(map.values()).sort((a, b) => b.totalPages - a.totalPages);
}

// ── Full reading statistics ───────────────────────────────────────────────────

export interface ReadingStatistics {
  // Headline numbers
  totalBooks: number;
  totalPages: number;
  totalTimeMin: number;
  streak: number;
  longestStreak: number;

  // Averages
  avgPagesPerSession: number;
  avgTimePerSessionMin: number;
  avgPagesPerDay: number;        // over active days

  // Counts
  totalSessions: number;
  activeDays: number;            // unique days with sessions

  // Breakdowns
  weeklyTrend: WeekBucket[];
  bookBreakdown: BookBreakdown[];
  currentMonth: CalendarMonth;
}

export function computeReadingStatistics(sessions: ReadingSession[]): ReadingStatistics {
  const now = new Date();
  const totalSessions = sessions.length;
  const totalPages = sessions.reduce((sum, s) => sum + Math.max(0, s.endPage - s.startPage), 0);
  const totalTimeMin = sessions.reduce((sum, s) => sum + s.readingTimeMin, 0);

  const uniqueDates = new Set(sessions.map((s) => s.date));
  const activeDays = uniqueDates.size;
  const totalBooks = new Set(sessions.map((s) => s.bookId)).size;

  const streak = computeStreak(sessions);
  const longestStreak = computeLongestStreak(sessions);

  const avgPagesPerSession = totalSessions > 0 ? Math.round(totalPages / totalSessions) : 0;
  const avgTimePerSessionMin = totalSessions > 0 ? Math.round(totalTimeMin / totalSessions) : 0;
  const avgPagesPerDay = activeDays > 0 ? Math.round(totalPages / activeDays) : 0;

  return {
    totalBooks,
    totalPages,
    totalTimeMin,
    streak,
    longestStreak,
    avgPagesPerSession,
    avgTimePerSessionMin,
    avgPagesPerDay,
    totalSessions,
    activeDays,
    weeklyTrend: computeWeeklyTrend(sessions, 8),
    bookBreakdown: computeBookBreakdown(sessions),
    currentMonth: computeCalendarMonth(sessions, now.getFullYear(), now.getMonth() + 1),
  };
}

// ── Longest streak (all time) ─────────────────────────────────────────────────

function computeLongestStreak(sessions: ReadingSession[]): number {
  if (sessions.length === 0) return 0;

  const sortedDates = Array.from(new Set(sessions.map((s) => s.date))).sort();
  let best = 1;
  let current = 1;

  for (let i = 1; i < sortedDates.length; i++) {
    const prev = new Date(sortedDates[i - 1]);
    const curr = new Date(sortedDates[i]);
    const diffDays = Math.round((curr.getTime() - prev.getTime()) / 86400000);
    if (diffDays === 1) {
      current++;
      if (current > best) best = current;
    } else {
      current = 1;
    }
  }

  return best;
}

// ── Formatting helpers (exported for use in components) ───────────────────────

export function fmtHM(min: number): string {
  if (min <= 0) return '0m';
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

export function fmtHMDisplay(min: number): string {
  if (min <= 0) return '--:--';
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}
