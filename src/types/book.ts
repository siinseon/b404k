export type BookStatus = 'PRE' | 'ING' | 'DONE';

export interface Book {
  id: string;
  title: string;
  author: string;
  isbn?: string;        // ISBN-13 우선
  publisher?: string;
  year?: string;
  coverUrl?: string;    // 알라딘 표지 이미지 URL
  totalPages?: number;  // 전체 페이지 수 (진행률 계산용)
  status: BookStatus;   // 독서 상태 (기본값: PRE)
  updatedAt: number;    // 상태 마지막 변경 Unix ms
  addedAt: number;      // 등록 Unix ms
}
