import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import XLSX from 'xlsx';
import { Book } from '../types/book';

// ── Column synonym map ────────────────────────────────────────────────────────
// Key = internal field name, Value = list of synonyms (lower-cased match)

const SYNONYMS: Record<string, string[]> = {
  title: [
    '제목', '도서명', '책제목', '책 제목', '책명', '서명', '도서',
    'title', 'book title', 'book', 'name', 'booktitle',
  ],
  author: [
    '저자', '작가', '글쓴이', '지은이', '저작자', '글작가',
    'author', 'writer', 'authors',
  ],
  publisher: [
    '출판사', '출판', '발행사', '발행처',
    'publisher', 'press', 'pub',
  ],
  isbn: [
    'isbn', 'isbn13', 'isbn-13', 'isbn_13', 'isbn10', 'isbn-10', 'isbn_10',
  ],
  totalPages: [
    '전체페이지', '전체 페이지', '총페이지', '총 페이지', '페이지수', '페이지 수',
    '총쪽수', '쪽수', '페이지',
    'total pages', 'pages', 'total_pages', 'pagecount', 'page count',
  ],
  currentPage: [
    '현재페이지', '현재 페이지', '읽은페이지', '읽은 페이지', '마지막페이지',
    'current page', 'current_page', 'lastpage', 'last page',
  ],
  status: [
    '읽은상태', '읽은 상태', '독서상태', '독서 상태', '상태', '읽기상태',
    'status', 'reading status', 'read_status', 'state',
  ],
  memo: [
    '메모', '감상', '리뷰', '코멘트', '노트', '독후감',
    'memo', 'note', 'comment', 'review', 'notes',
  ],
  readingTimeMin: [
    '독서시간', '독서 시간', '읽은시간', '읽은 시간', '시간(분)', '시간(min)',
    'reading time', 'time', 'minutes', 'reading_time',
  ],
  rating: [
    '평점', '별점', '점수', '평가',
    'rating', 'score', 'stars',
  ],
};

type FieldKey = keyof typeof SYNONYMS;

// ── Public types ──────────────────────────────────────────────────────────────

export interface ImportRow {
  title: string;
  author: string;
  publisher?: string;
  isbn?: string;
  totalPages?: number;
  /** Row number in original file (1-indexed, header = row 1) */
  sourceRow: number;
}

export interface ParseError {
  row: number;
  reason: string;
}

export interface ParseResult {
  rows: ImportRow[];
  errors: ParseError[];
  /** Total data rows in file (excluding header) */
  total: number;
  filename: string;
  format: 'XLSX' | 'CSV';
}

export interface ImportSummary {
  imported: number;
  duplicates: number;
  errors: number;
}

// ── Internal helpers ──────────────────────────────────────────────────────────

function normalize(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, ' ');
}

function findField(header: string): FieldKey | null {
  const h = normalize(header);
  for (const [field, synonyms] of Object.entries(SYNONYMS)) {
    if (synonyms.some((s) => normalize(s) === h)) {
      return field as FieldKey;
    }
  }
  return null;
}

function cleanIsbn(raw: string): string {
  return raw.replace(/[^0-9Xx]/g, '');
}

function parseRows(
  rawRows: Record<string, unknown>[],
): { rows: ImportRow[]; errors: ParseError[] } {
  if (rawRows.length === 0) return { rows: [], errors: [] };

  // Build header→field mapping from the first row's keys
  const headerToField: Record<string, FieldKey> = {};
  for (const key of Object.keys(rawRows[0])) {
    const field = findField(key);
    if (field) headerToField[key] = field;
  }

  const rows: ImportRow[] = [];
  const errors: ParseError[] = [];

  rawRows.forEach((raw, idx) => {
    const rowNum = idx + 2; // +1 for 0-index, +1 for header row

    // Skip entirely empty rows
    const allEmpty = Object.values(raw).every((v) => !String(v ?? '').trim());
    if (allEmpty) return;

    // Map each column to its field
    const mapped: Partial<Record<FieldKey, string>> = {};
    for (const [key, field] of Object.entries(headerToField)) {
      const val = String(raw[key] ?? '').trim();
      if (val) mapped[field] = val;
    }

    const title = mapped.title ?? '';
    const author = mapped.author ?? '';

    if (!title && !author) return; // truly empty data row
    if (!title) {
      errors.push({ row: rowNum, reason: 'MISSING TITLE' });
      return;
    }
    if (!author) {
      errors.push({ row: rowNum, reason: 'MISSING AUTHOR' });
      return;
    }

    const row: ImportRow = { title, author, sourceRow: rowNum };

    if (mapped.publisher) row.publisher = mapped.publisher;

    if (mapped.isbn) {
      const clean = cleanIsbn(mapped.isbn);
      if (clean.length >= 10) row.isbn = clean;
    }

    if (mapped.totalPages) {
      const n = parseInt(mapped.totalPages, 10);
      if (!isNaN(n) && n > 0) row.totalPages = n;
    }

    rows.push(row);
  });

  return { rows, errors };
}

// ── Public API ────────────────────────────────────────────────────────────────

/** Pick a file and return its parse result. Returns null if the user cancels. */
export async function pickAndParse(): Promise<ParseResult | null> {
  const result = await DocumentPicker.getDocumentAsync({
    type: ['*/*'],
    copyToCacheDirectory: true,
  });

  if (result.canceled || !result.assets?.[0]) return null;

  const asset = result.assets[0];
  const uri = asset.uri;
  const filename = asset.name ?? 'import';
  const ext = filename.split('.').pop()?.toLowerCase() ?? '';
  const isXlsx = ext === 'xlsx' || ext === 'xls';
  const format: 'XLSX' | 'CSV' = isXlsx ? 'XLSX' : 'CSV';

  let workbook: XLSX.WorkBook;

  if (isXlsx) {
    const base64 = await FileSystem.readAsStringAsync(uri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    workbook = XLSX.read(base64, { type: 'base64' });
  } else {
    const content = await FileSystem.readAsStringAsync(uri, {
      encoding: FileSystem.EncodingType.UTF8,
    });
    workbook = XLSX.read(content, { type: 'string' });
  }

  const firstSheetName = workbook.SheetNames[0];
  if (!firstSheetName || !workbook.Sheets[firstSheetName]) {
    throw new Error('EMPTY WORKBOOK');
  }

  const sheet = workbook.Sheets[firstSheetName];
  const rawRows = XLSX.utils.sheet_to_json(sheet, {
    defval: '',
    raw: false, // format everything as strings
  }) as Record<string, unknown>[];

  const { rows, errors } = parseRows(rawRows);

  return {
    rows,
    errors,
    total: rawRows.length,
    filename,
    format,
  };
}

/** Check if an import row is a duplicate of an existing book. */
export function isDuplicate(row: ImportRow, existingBooks: Book[]): boolean {
  if (row.isbn) {
    const cleanA = cleanIsbn(row.isbn);
    return existingBooks.some((b) => {
      if (!b.isbn) return false;
      return cleanIsbn(b.isbn) === cleanA;
    });
  }
  const t = normalize(row.title);
  const a = normalize(row.author);
  return existingBooks.some(
    (b) => normalize(b.title) === t && normalize(b.author) === a,
  );
}

/** Filter out duplicates (also deduplicates within the batch). */
export function filterDuplicates(
  rows: ImportRow[],
  existingBooks: Book[],
): { unique: ImportRow[]; duplicateCount: number } {
  const seen = new Set<string>();
  const unique: ImportRow[] = [];
  let duplicateCount = 0;

  for (const row of rows) {
    // Key within the batch
    const key = row.isbn
      ? `isbn:${cleanIsbn(row.isbn)}`
      : `ta:${normalize(row.title)}|${normalize(row.author)}`;

    if (seen.has(key) || isDuplicate(row, existingBooks)) {
      duplicateCount++;
    } else {
      seen.add(key);
      unique.push(row);
    }
  }

  return { unique, duplicateCount };
}
