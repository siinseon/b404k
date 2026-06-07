import React, {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useCallback,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Book, BookStatus } from '../types/book';

const STORAGE_KEY = '@b404k/books';

// ── State ────────────────────────────────────────────────────────────────────

interface BookState {
  books: Book[];
  loaded: boolean;
}

const initialState: BookState = { books: [], loaded: false };

// ── Normalize loaded data (migration safety) ──────────────────────────────────

function normalize(raw: Partial<Book>): Book {
  const now = raw.addedAt ?? Date.now();
  return {
    id: raw.id ?? `${now}-migrated`,
    title: raw.title ?? '',
    author: raw.author ?? '',
    isbn: raw.isbn,
    publisher: raw.publisher,
    year: raw.year,
    coverUrl: raw.coverUrl,
    totalPages: raw.totalPages,
    status: (raw.status as BookStatus) ?? 'PRE',
    updatedAt: raw.updatedAt ?? now,
    addedAt: now,
  };
}

// ── Actions ──────────────────────────────────────────────────────────────────

type BookAction =
  | { type: 'LOAD'; books: Book[] }
  | { type: 'ADD'; book: Book }
  | { type: 'REMOVE'; id: string }
  | { type: 'UPDATE_STATUS'; id: string; status: BookStatus; updatedAt: number }
  | { type: 'BATCH_ADD'; books: Book[] };

function reducer(state: BookState, action: BookAction): BookState {
  switch (action.type) {
    case 'LOAD':
      return { books: action.books, loaded: true };
    case 'ADD':
      return { ...state, books: [action.book, ...state.books] };
    case 'REMOVE':
      return { ...state, books: state.books.filter((b) => b.id !== action.id) };
    case 'UPDATE_STATUS':
      return {
        ...state,
        books: state.books.map((b) =>
          b.id === action.id
            ? { ...b, status: action.status, updatedAt: action.updatedAt }
            : b
        ),
      };
    case 'BATCH_ADD':
      return { ...state, books: [...action.books, ...state.books] };
    default:
      return state;
  }
}

// ── Context ──────────────────────────────────────────────────────────────────

interface BookContextValue {
  books: Book[];
  loaded: boolean;
  addBook: (book: Omit<Book, 'id' | 'addedAt' | 'updatedAt' | 'status'>) => void;
  removeBook: (id: string) => void;
  updateBookStatus: (id: string, status: BookStatus) => void;
  importBooks: (books: Omit<Book, 'id' | 'addedAt' | 'updatedAt' | 'status'>[]) => Book[];
}

const BookContext = createContext<BookContextValue | null>(null);

// ── Provider ─────────────────────────────────────────────────────────────────

export function BookProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        const parsed: Partial<Book>[] = raw ? JSON.parse(raw) : [];
        dispatch({ type: 'LOAD', books: parsed.map(normalize) });
      })
      .catch(() => dispatch({ type: 'LOAD', books: [] }));
  }, []);

  useEffect(() => {
    if (!state.loaded) return;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state.books)).catch(() => {});
  }, [state.books, state.loaded]);

  const addBook = useCallback(
    (data: Omit<Book, 'id' | 'addedAt' | 'updatedAt' | 'status'>) => {
      const now = Date.now();
      const book: Book = {
        ...data,
        id: `${now}-${Math.random().toString(36).slice(2, 7)}`,
        status: 'PRE',
        updatedAt: now,
        addedAt: now,
      };
      dispatch({ type: 'ADD', book });
    },
    []
  );

  const removeBook = useCallback((id: string) => {
    dispatch({ type: 'REMOVE', id });
  }, []);

  const updateBookStatus = useCallback((id: string, status: BookStatus) => {
    dispatch({ type: 'UPDATE_STATUS', id, status, updatedAt: Date.now() });
  }, []);

  const importBooks = useCallback(
    (data: Omit<Book, 'id' | 'addedAt' | 'updatedAt' | 'status'>[]): Book[] => {
      const now = Date.now();
      const newBooks: Book[] = data.map((d, i) => ({
        ...d,
        id: `${now + i}-${Math.random().toString(36).slice(2, 7)}`,
        status: 'PRE' as BookStatus,
        updatedAt: now + i,
        addedAt: now + i,
      }));
      dispatch({ type: 'BATCH_ADD', books: newBooks });
      return newBooks;
    },
    []
  );

  return (
    <BookContext.Provider
      value={{ books: state.books, loaded: state.loaded, addBook, removeBook, updateBookStatus, importBooks }}
    >
      {children}
    </BookContext.Provider>
  );
}

// ── Hook ─────────────────────────────────────────────────────────────────────

export function useBooks() {
  const ctx = useContext(BookContext);
  if (!ctx) throw new Error('useBooks must be used within BookProvider');
  return ctx;
}
