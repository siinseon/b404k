import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Colors, Typography, Spacing, Border, Shadows } from '../constants/theme';
import { RootStackParamList } from '../navigation/RootNavigator';
import { useSessions } from '../store/sessionStore';
import { useBooks } from '../store/bookStore';
import { computeStreak, fmtHM } from '../utils/statsCalculator';

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtDate(dateStr: string) {
  const [y, m, d] = dateStr.split('-');
  return `${y}.${m}.${d}`;
}

function fmtSessionTime(_dateStr: string, savedAt: number) {
  const d = new Date(savedAt);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

// ── Sub-components ────────────────────────────────────────────────────────────

function SectionHeader({ label }: { label: string }) {
  return (
    <View style={sh.row}>
      <Text style={sh.label}>{label}</Text>
      <View style={sh.rule} />
    </View>
  );
}
const sh = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  label: {
    fontFamily: Typography.fontMono,
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 2,
    color: Colors.textMuted,
  },
  rule: { flex: 1, height: 1, backgroundColor: Colors.border },
});

// ── LED indicator with label ──────────────────────────────────────────────────

function LedIndicator({
  label,
  on,
  activeColor = Colors.accentGreen,
}: {
  label: string;
  on: boolean;
  activeColor?: string;
}) {
  return (
    <View style={li.wrap}>
      <View style={[li.dot, { backgroundColor: on ? activeColor : Colors.metalDark }]} />
      <Text style={[li.label, on && { color: Colors.textMuted }]}>{label}</Text>
    </View>
  );
}
const li = StyleSheet.create({
  wrap: { alignItems: 'center', gap: 3 },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: Colors.metalShadow,
  },
  label: {
    fontFamily: Typography.fontMono,
    fontSize: 7,
    letterSpacing: 1,
    color: Colors.textDisabled,
  },
});

// ── Transport button (skip-style) ─────────────────────────────────────────────

function TransportBtn({
  label,
  icon,
  iconRight = false,
  onPress,
}: {
  label: string;
  icon: string;
  iconRight?: boolean;
  onPress?: () => void;
}) {
  return (
    <TouchableOpacity activeOpacity={0.7} onPress={onPress} style={tb.outer}>
      <View style={[tb.face, iconRight && tb.faceRight]}>
        {!iconRight && <Text style={tb.icon}>{icon}</Text>}
        <Text style={tb.label}>{label}</Text>
        {iconRight && <Text style={tb.icon}>{icon}</Text>}
      </View>
    </TouchableOpacity>
  );
}
const tb = StyleSheet.create({
  outer: {
    flex: 1,
    borderWidth: Border.regular,
    borderTopColor: Colors.metalHighlight,
    borderLeftColor: Colors.metalHighlight,
    borderBottomColor: Colors.metalShadow,
    borderRightColor: Colors.metalShadow,
    borderRadius: 4,
    backgroundColor: Colors.metalMid,
    minHeight: 52,
  },
  face: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    margin: 1,
    borderRadius: 3,
    paddingHorizontal: Spacing.sm,
  },
  faceRight: { flexDirection: 'row-reverse' },
  icon: {
    fontFamily: Typography.fontMono,
    fontSize: 11,
    color: Colors.textMuted,
    lineHeight: 14,
  },
  label: {
    fontFamily: Typography.fontMono,
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1.5,
    color: Colors.text,
  },
});

// ── Play / main-action button ─────────────────────────────────────────────────

function PlayBtn({ onPress }: { onPress?: () => void }) {
  return (
    <TouchableOpacity activeOpacity={0.7} onPress={onPress} style={pb.outer}>
      <View style={pb.face}>
        <Text style={pb.icon}>▶</Text>
        <View style={pb.textGroup}>
          <Text style={pb.label}>START</Text>
          <Text style={pb.sub}>SESSION</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}
const pb = StyleSheet.create({
  outer: {
    flex: 2,
    borderWidth: Border.regular,
    borderTopColor: Colors.metalShadow,
    borderLeftColor: Colors.metalShadow,
    borderBottomColor: Colors.metalHighlight,
    borderRightColor: Colors.metalHighlight,
    borderRadius: 4,
    backgroundColor: Colors.metalDark,
    minHeight: 52,
  },
  face: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    margin: 1,
    borderRadius: 3,
    backgroundColor: Colors.metalDark,
  },
  icon: {
    fontSize: 18,
    color: Colors.accentGreen,
    lineHeight: 22,
  },
  textGroup: { alignItems: 'flex-start' },
  label: {
    fontFamily: Typography.fontMono,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 2,
    color: Colors.accentGreen,
  },
  sub: {
    fontFamily: Typography.fontMono,
    fontSize: 8,
    letterSpacing: 1.5,
    color: Colors.accentGreenDim,
  },
});

// ── Function button (small, utility) ─────────────────────────────────────────

function FnBtn({
  label,
  icon,
  onPress,
}: {
  label: string;
  icon: string;
  onPress?: () => void;
}) {
  return (
    <TouchableOpacity activeOpacity={0.7} onPress={onPress} style={fb.outer}>
      <View style={fb.face}>
        <Text style={fb.icon}>{icon}</Text>
        <Text style={fb.label}>{label}</Text>
      </View>
    </TouchableOpacity>
  );
}
const fb = StyleSheet.create({
  outer: {
    flex: 1,
    borderWidth: Border.thin,
    borderTopColor: Colors.metalHighlight,
    borderLeftColor: Colors.metalHighlight,
    borderBottomColor: Colors.metalShadow,
    borderRightColor: Colors.metalShadow,
    borderRadius: 3,
    backgroundColor: Colors.panel,
    minHeight: 40,
  },
  face: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingHorizontal: Spacing.sm,
  },
  icon: {
    fontFamily: Typography.fontMono,
    fontSize: 11,
    color: Colors.textMuted,
  },
  label: {
    fontFamily: Typography.fontMono,
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1.5,
    color: Colors.text,
  },
});

// ── Main screen ───────────────────────────────────────────────────────────────

type HomeNav = NativeStackNavigationProp<RootStackParamList, 'MainTabs'>;

const PROG_SEGS = 24;

export function HomeScreen() {
  const navigation = useNavigation<HomeNav>();
  const { sessions, stats } = useSessions();
  const { books } = useBooks();

  // Current book: ING 상태 책 중 가장 최근에 업데이트된 것
  const { currentBook, currentPage, lastLogDate, progressPct, bookId } =
    useMemo(() => {
      const ingBooks = books.filter((b) => b.status === 'ING');
      if (ingBooks.length === 0) {
        return { currentBook: null, currentPage: 0, lastLogDate: null, progressPct: null, bookId: null };
      }

      // Sort by most recent session date, then by updatedAt
      const ranked = ingBooks.map((book) => {
        const bSessions = sessions.filter((s) => s.bookId === book.id);
        const latestSession = bSessions[0] ?? null;
        return { book, latestSession };
      }).sort((a, b) => {
        const aDate = a.latestSession?.savedAt ?? a.book.updatedAt;
        const bDate = b.latestSession?.savedAt ?? b.book.updatedAt;
        return bDate - aDate;
      });

      const { book, latestSession } = ranked[0];
      const bSessions = sessions.filter((s) => s.bookId === book.id);

      // currentPage = most recent session's currentPage, or max endPage
      const curPage = latestSession?.currentPage
        ?? bSessions.reduce((max, s) => Math.max(max, s.endPage ?? 0), 0);

      const pct = book.totalPages && curPage
        ? Math.round((curPage / book.totalPages) * 100)
        : null;

      return {
        currentBook: book,
        currentPage: curPage,
        lastLogDate: latestSession?.date ?? null,
        progressPct: pct,
        bookId: book.id,
      };
    }, [sessions, books]);

  const streak = useMemo(() => computeStreak(sessions), [sessions]);

  // BOOK ID = 1-based index in books array
  const bookSlot = currentBook
    ? String(books.findIndex((b) => b.id === currentBook.id) + 1).padStart(2, '0')
    : '--';

  // Progress bar segments
  const filledSegs = progressPct != null
    ? Math.round((progressPct / 100) * PROG_SEGS)
    : 0;

  // Recent log (last 4 sessions)
  const recentSessions = sessions.slice(0, 4);

  return (
    <SafeAreaView style={styles.root} edges={['top', 'left', 'right']}>

      {/* ── Top bar ─── */}
      <View style={styles.topBar}>
        <Text style={styles.topBarTitle}>B404K</Text>
        <View style={styles.ledGroup}>
          <LedIndicator label="READY" on={books.length > 0} activeColor={Colors.accentGreen} />
          <LedIndicator label="REC"   on={stats.todaySessions > 0} activeColor={Colors.statusError} />
          <LedIndicator label="SYNC"  on={sessions.length > 0} activeColor={Colors.statusWarning} />
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >

        {/* ── LCD CURRENT BOOK ── */}
        <SectionHeader label="CURRENT BOOK" />
        <View style={styles.lcdOuter}>
          <View style={styles.lcdInner}>

            {/* Row 1 — BOOK ID + LAST DATE */}
            <View style={styles.lcdHeaderRow}>
              <Text style={styles.lcdKey}>BOOK ID</Text>
              <Text style={styles.lcdBookId}>{bookSlot}</Text>
              <View style={styles.lcdFlex} />
              {lastLogDate && (
                <Text style={styles.lcdSmall}>LAST  {fmtDate(lastLogDate)}</Text>
              )}
            </View>

            <View style={styles.lcdDivider} />

            {/* Row 2 — TITLE */}
            <View style={styles.lcdInfoRow}>
              <Text style={styles.lcdKey}>TITLE</Text>
              <Text style={styles.lcdVal} numberOfLines={1}>
                {currentBook?.title ?? '—'}
              </Text>
            </View>

            {/* Row 3 — AUTHOR */}
            <View style={styles.lcdInfoRow}>
              <Text style={styles.lcdKey}>AUTHOR</Text>
              <Text style={styles.lcdVal} numberOfLines={1}>
                {currentBook?.author ?? '—'}
              </Text>
            </View>

            <View style={styles.lcdDivider} />

            {/* Row 4 — PROGRESS bar */}
            <View style={styles.lcdProgressRow}>
              <Text style={styles.lcdKey}>PROG</Text>
              <View style={styles.lcdBarTrack}>
                {Array.from({ length: PROG_SEGS }).map((_, i) => (
                  <View
                    key={i}
                    style={[styles.lcdBarSeg, i < filledSegs && styles.lcdBarSegOn]}
                  />
                ))}
              </View>
              <Text style={styles.lcdPct}>
                {progressPct != null ? `${progressPct}%` : '—'}
              </Text>
            </View>

            {/* Row 5 — PAGE · STREAK · TODAY */}
            <View style={styles.lcdFootRow}>
              <Text style={styles.lcdFootKey}>PAGE</Text>
              <Text style={styles.lcdFootVal}>
                {currentPage > 0 ? `p.${currentPage}` : '—'}
              </Text>
              <Text style={styles.lcdFootSep}>·</Text>
              <Text style={styles.lcdFootKey}>STREAK</Text>
              <Text style={styles.lcdFootVal}>
                {streak > 0 ? `${streak}D` : '—'}
              </Text>
              <Text style={styles.lcdFootSep}>·</Text>
              <Text style={styles.lcdFootKey}>TODAY</Text>
              <Text style={styles.lcdFootVal}>
                {stats.todayTimeMin > 0 ? fmtHM(stats.todayTimeMin) : '—'}
              </Text>
            </View>

          </View>
        </View>

        {/* ── CONTROL PANEL ── */}
        <SectionHeader label="CONTROL PANEL" />
        <View style={styles.ctrlPanel}>

          {/* Transport row: SEARCH — SESSION — ADD */}
          <View style={styles.transportRow}>
            <TransportBtn
              label="SEARCH"
              icon="◀"
              onPress={() => navigation.navigate('BookSearch')}
            />
            <PlayBtn
              onPress={() =>
                navigation.navigate('Session', bookId ? { bookId } : undefined)
              }
            />
            <TransportBtn
              label="ADD"
              icon="▶"
              iconRight
              onPress={() => navigation.navigate('BookSearch')}
            />
          </View>

          {/* Divider */}
          <View style={styles.ctrlDivider} />

          {/* Function row: MONITOR — ARCHIVE */}
          <View style={styles.fnRow}>
            <FnBtn label="MONITOR" icon="◈" onPress={() => navigation.navigate('Stats')} />
            <FnBtn label="ARCHIVE" icon="□" onPress={() => navigation.navigate('MainTabs')} />
          </View>

        </View>

        {/* ── RECENT LOG ── */}
        <SectionHeader label="RECENT LOG" />
        <View style={styles.logPanel}>
          {recentSessions.length === 0 ? (
            <View style={styles.logEmpty}>
              <Text style={styles.logEmptyText}>NO LOG ENTRIES</Text>
            </View>
          ) : (
            recentSessions.map((s, i) => (
              <React.Fragment key={s.id}>
                <View style={styles.logRow}>
                  <Text style={styles.logTime}>{fmtSessionTime(s.date, s.savedAt)}</Text>
                  <View style={styles.logDot} />
                  <Text style={styles.logEvent} numberOfLines={1}>{s.bookTitle}</Text>
                  <Text style={styles.logPage}>p.{s.endPage}</Text>
                </View>
                {i < recentSessions.length - 1 && <View style={styles.logSep} />}
              </React.Fragment>
            ))
          )}
        </View>

        <View style={styles.bottomPad} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.body },

  // Top bar
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.md,
    backgroundColor: Colors.panel,
    borderBottomWidth: Border.thin,
    borderBottomColor: Colors.border,
  },
  topBarTitle: {
    fontFamily: Typography.fontMono,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 4,
    color: Colors.text,
  },
  ledGroup: {
    flexDirection: 'row',
    gap: Spacing.md,
    alignItems: 'flex-start',
  },

  // Scroll
  scroll: { flex: 1 },
  content: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    gap: Spacing.sm,
  },
  bottomPad: { height: Spacing.lg },

  // ── LCD CURRENT BOOK ──────────────────────────────────────────────────────

  lcdOuter: {
    borderWidth: Border.regular,
    borderTopColor: Colors.lcdShadow,
    borderLeftColor: Colors.lcdShadow,
    borderBottomColor: Colors.lcdHighlight,
    borderRightColor: Colors.lcdHighlight,
    borderRadius: 2,
    padding: 2,
    backgroundColor: Colors.lcdBackground,
  },
  lcdInner: {
    borderWidth: Border.thin,
    borderTopColor: Colors.lcdShadow,
    borderLeftColor: Colors.lcdShadow,
    borderBottomColor: Colors.lcdHighlight,
    borderRightColor: Colors.lcdHighlight,
    borderRadius: 1,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    backgroundColor: Colors.lcdBackground,
    gap: 5,
  },

  // LCD rows
  lcdHeaderRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: Spacing.sm,
  },
  lcdInfoRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: Spacing.sm,
  },
  lcdProgressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  lcdFootRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'nowrap',
  },

  lcdKey: {
    fontFamily: Typography.fontMono,
    fontSize: 8,
    letterSpacing: 1,
    color: Colors.lcdTextDim,
    width: 44,
  },
  lcdBookId: {
    fontFamily: Typography.fontMono,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 2,
    color: Colors.lcdText,
  },
  lcdFlex: { flex: 1 },
  lcdSmall: {
    fontFamily: Typography.fontMono,
    fontSize: 8,
    letterSpacing: 1,
    color: Colors.lcdTextDim,
  },
  lcdVal: {
    fontFamily: Typography.fontMono,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.3,
    color: Colors.lcdText,
    flex: 1,
  },
  lcdDivider: {
    height: 1,
    backgroundColor: Colors.lcdShadow,
    marginVertical: 2,
  },
  lcdBarTrack: {
    flex: 1,
    flexDirection: 'row',
    gap: 2,
    height: 9,
  },
  lcdBarSeg: {
    flex: 1,
    backgroundColor: Colors.lcdShadow,
    borderRadius: 1,
    opacity: 0.35,
  },
  lcdBarSegOn: {
    backgroundColor: Colors.lcdText,
    opacity: 1,
  },
  lcdPct: {
    fontFamily: Typography.fontMono,
    fontSize: 9,
    fontWeight: '700',
    color: Colors.lcdText,
    width: 28,
    textAlign: 'right',
  },
  lcdFootKey: {
    fontFamily: Typography.fontMono,
    fontSize: 7,
    letterSpacing: 1,
    color: Colors.lcdTextDim,
  },
  lcdFootVal: {
    fontFamily: Typography.fontMono,
    fontSize: 9,
    fontWeight: '700',
    color: Colors.lcdText,
  },
  lcdFootSep: {
    fontFamily: Typography.fontMono,
    fontSize: 8,
    color: Colors.lcdShadow,
    paddingHorizontal: 1,
  },

  // ── CONTROL PANEL ─────────────────────────────────────────────────────────

  ctrlPanel: {
    borderWidth: Border.regular,
    borderTopColor: Colors.metalShadow,
    borderLeftColor: Colors.metalShadow,
    borderBottomColor: Colors.metalHighlight,
    borderRightColor: Colors.metalHighlight,
    borderRadius: 4,
    backgroundColor: Colors.metalMid,
    padding: Spacing.sm,
    gap: Spacing.sm,
  },
  transportRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  ctrlDivider: {
    height: 1,
    backgroundColor: Colors.metalShadow,
    opacity: 0.4,
    marginHorizontal: 2,
  },
  fnRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },

  // ── RECENT LOG ───────────────────────────────────────────────────────────

  logPanel: {
    borderWidth: Border.regular,
    ...Shadows.inset,
    borderRadius: 2,
    backgroundColor: Colors.panel,
    overflow: 'hidden',
  },
  logRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
  },
  logDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: Colors.textDisabled,
  },
  logTime: {
    fontFamily: Typography.fontMono,
    fontSize: 10,
    color: Colors.textMuted,
    width: 36,
  },
  logEvent: {
    fontFamily: Typography.fontMono,
    fontSize: 10,
    letterSpacing: 0.8,
    color: Colors.text,
    flex: 1,
  },
  logPage: {
    fontFamily: Typography.fontMono,
    fontSize: 10,
    color: Colors.textMuted,
  },
  logSep: {
    height: Border.thin,
    backgroundColor: Colors.border,
    marginHorizontal: Spacing.md,
  },
  logEmpty: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.lg,
    alignItems: 'center',
  },
  logEmptyText: {
    fontFamily: Typography.fontMono,
    fontSize: 10,
    letterSpacing: 1.5,
    color: Colors.textDisabled,
  },
});
