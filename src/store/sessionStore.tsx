import React, {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useCallback,
  useMemo,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ReadingSession, SessionStats } from '../types/session';
import { BookStatus } from '../types/book';
import { sessionPages } from '../utils/sessionMetrics';

const STORAGE_KEY = '@b404k/sessions';

// ── State ─────────────────────────────────────────────────────────────────────

interface SessionState {
  sessions: ReadingSession[];
  loaded: boolean;
}

const initialState: SessionState = { sessions: [], loaded: false };

// ── Normalize loaded data (migration safety) ──────────────────────────────────

const VALID_STATUS: BookStatus[] = ['PRE', 'ING', 'DONE'];

function normalizeNumber(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

function normalizeSession(raw: Partial<ReadingSession>): ReadingSession {
  const savedAt = normalizeNumber(raw.savedAt) ?? Date.now();
  const readingTimeMin = normalizeNumber(raw.readingTimeMin) ?? 0;
  const bookStatus = VALID_STATUS.includes(raw.bookStatus as BookStatus)
    ? (raw.bookStatus as BookStatus)
    : 'ING';

  return {
    id: raw.id ?? `${savedAt}-migrated`,
    bookId: raw.bookId ?? '',
    bookTitle: raw.bookTitle ?? '',
    bookAuthor: raw.bookAuthor ?? '',
    date: raw.date ?? todayStr(),
    bookStatus,
    currentPage: normalizeNumber(raw.currentPage),
    startPage: normalizeNumber(raw.startPage),
    endPage: normalizeNumber(raw.endPage),
    readingTimeMin: Math.max(0, readingTimeMin),
    memo: raw.memo,
    savedAt,
  };
}

// ── Actions ───────────────────────────────────────────────────────────────────

type SessionAction =
  | { type: 'LOAD'; sessions: ReadingSession[] }
  | { type: 'ADD'; session: ReadingSession }
  | { type: 'REMOVE'; id: string };

function reducer(state: SessionState, action: SessionAction): SessionState {
  switch (action.type) {
    case 'LOAD':
      return { sessions: action.sessions, loaded: true };
    case 'ADD':
      return { ...state, sessions: [action.session, ...state.sessions] };
    case 'REMOVE':
      return { ...state, sessions: state.sessions.filter((s) => s.id !== action.id) };
    default:
      return state;
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function daysAgoStr(n: number) {
  const d = new Date(Date.now() - n * 86400000);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function computeStats(sessions: ReadingSession[]): SessionStats {
  const today = todayStr();
  const weekStart = daysAgoStr(6);

  const totalSessions = sessions.length;
  const totalPages = sessions.reduce((s, r) => s + sessionPages(r), 0);
  const totalTimeMin = sessions.reduce((s, r) => s + r.readingTimeMin, 0);
  const uniqueBookCount = new Set(sessions.map((r) => r.bookId)).size;

  const todaySessions = sessions.filter((r) => r.date === today);
  const weekSessions = sessions.filter((r) => r.date >= weekStart);

  return {
    totalSessions,
    totalPages,
    totalTimeMin,
    uniqueBookCount,
    todaySessions: todaySessions.length,
    todayPages: todaySessions.reduce((s, r) => s + sessionPages(r), 0),
    todayTimeMin: todaySessions.reduce((s, r) => s + r.readingTimeMin, 0),
    weekPages: weekSessions.reduce((s, r) => s + sessionPages(r), 0),
    weekTimeMin: weekSessions.reduce((s, r) => s + r.readingTimeMin, 0),
  };
}

// ── Context ───────────────────────────────────────────────────────────────────

interface SessionContextValue {
  sessions: ReadingSession[];
  stats: SessionStats;
  loaded: boolean;
  addSession: (data: Omit<ReadingSession, 'id' | 'savedAt'>) => void;
  removeSession: (id: string) => void;
}

const SessionContext = createContext<SessionContextValue | null>(null);

// ── Provider ──────────────────────────────────────────────────────────────────

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        const parsed = raw ? JSON.parse(raw) : [];
        const sessions = Array.isArray(parsed) ? parsed.map(normalizeSession) : [];
        dispatch({ type: 'LOAD', sessions });
      })
      .catch(() => dispatch({ type: 'LOAD', sessions: [] }));
  }, []);

  useEffect(() => {
    if (!state.loaded) return;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state.sessions)).catch(() => {});
  }, [state.sessions, state.loaded]);

  const addSession = useCallback((data: Omit<ReadingSession, 'id' | 'savedAt'>) => {
    const session: ReadingSession = {
      ...data,
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      savedAt: Date.now(),
    };
    dispatch({ type: 'ADD', session });
  }, []);

  const removeSession = useCallback((id: string) => {
    dispatch({ type: 'REMOVE', id });
  }, []);

  const stats = useMemo(() => computeStats(state.sessions), [state.sessions]);

  return (
    <SessionContext.Provider
      value={{ sessions: state.sessions, stats, loaded: state.loaded, addSession, removeSession }}
    >
      {children}
    </SessionContext.Provider>
  );
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useSessions() {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error('useSessions must be used within SessionProvider');
  return ctx;
}
