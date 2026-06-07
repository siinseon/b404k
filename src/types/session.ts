import { BookStatus } from './book';

export interface ReadingSession {
  id: string;
  bookId: string;
  bookTitle: string;
  bookAuthor: string;
  date: string;              // YYYY-MM-DD
  bookStatus: BookStatus;    // 이 세션에서 변경된 상태
  currentPage?: number;      // 현재 읽은 페이지 (선택)
  startPage?: number;        // 세션 시작 페이지 (선택)
  endPage?: number;          // 세션 종료 페이지 (선택)
  readingTimeMin: number;    // 독서 시간 (분)
  memo?: string;
  savedAt: number;           // Unix ms
}

export interface SessionStats {
  totalSessions: number;
  totalPages: number;
  totalTimeMin: number;
  uniqueBookCount: number;
  todaySessions: number;
  todayPages: number;
  todayTimeMin: number;
  weekPages: number;
  weekTimeMin: number;
}
