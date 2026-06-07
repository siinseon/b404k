import { Platform } from 'react-native';
import { ALADIN_TTB_KEY } from '../config';

const SEARCH_URL = 'https://www.aladin.co.kr/ttb/api/ItemSearch.aspx';
const LOOKUP_URL = 'https://www.aladin.co.kr/ttb/api/ItemLookUp.aspx';

/**
 * 웹 환경에서는 CORS 정책으로 알라딘 API 직접 호출이 차단됩니다.
 * 웹일 때만 corsproxy.io 를 통해 우회합니다.
 * 네이티브(iOS/Android)에서는 프록시 없이 직접 호출합니다.
 */
function withProxy(url: string): string {
  if (Platform.OS === 'web') {
    return `https://corsproxy.io/?${encodeURIComponent(url)}`;
  }
  return url;
}

// ── Response types ────────────────────────────────────────────────────────────

export interface AladinItem {
  title: string;
  author: string;       // "홍길동 (지은이), 김철수 (그림)" 형태
  pubDate: string;      // "YYYY-MM-DD"
  isbn: string;         // ISBN-10
  isbn13: string;       // ISBN-13
  cover: string;        // HTTPS image URL
  publisher: string;
  categoryName: string;
  description: string;
  subInfo?: {
    itemPage?: number;  // 총 페이지 수
  };
}

interface AladinSearchResponse {
  totalResults: number;
  item: AladinItem[];
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/** "홍길동 (지은이), 김철수 (그림)" → "홍길동" */
export function cleanAuthor(raw: string): string {
  return raw
    .split(',')[0]             // 첫 번째 기여자만
    .replace(/\s*\(.*?\)/g, '') // 역할 괄호 제거
    .trim();
}

/** "YYYY-MM-DD" → "YYYY" */
export function pubYear(pubDate: string): string {
  return pubDate.split('-')[0] ?? '';
}

function baseParams(): Record<string, string> {
  return {
    ttbkey: ALADIN_TTB_KEY,
    MaxResults: '15',
    start: '1',
    SearchTarget: 'Book',
    output: 'js',
    Version: '20131101',
    Cover: 'Big',
    OptResult: 'subInfo',   // totalPages(itemPage) 수신
  };
}

function toQueryString(params: Record<string, string>): string {
  return Object.entries(params)
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join('&');
}

function checkKey() {
  if (!ALADIN_TTB_KEY || ALADIN_TTB_KEY === 'YOUR_TTB_KEY_HERE') {
    throw new Error('API_KEY_NOT_SET');
  }
}

// ── API functions ─────────────────────────────────────────────────────────────

async function aladinFetch(url: string): Promise<AladinSearchResponse> {
  const res = await fetch(withProxy(url));
  if (!res.ok) throw new Error('NETWORK_ERROR');
  const text = await res.text();
  try {
    return JSON.parse(text) as AladinSearchResponse;
  } catch {
    throw new Error('PARSE_ERROR');
  }
}

export async function searchByTitle(query: string): Promise<AladinItem[]> {
  checkKey();
  const qs = toQueryString({ ...baseParams(), Query: query, QueryType: 'Title' });
  const data = await aladinFetch(`${SEARCH_URL}?${qs}`);
  return data.item ?? [];
}

export async function searchByAuthor(query: string): Promise<AladinItem[]> {
  checkKey();
  const qs = toQueryString({ ...baseParams(), Query: query, QueryType: 'Author' });
  const data = await aladinFetch(`${SEARCH_URL}?${qs}`);
  return data.item ?? [];
}

export async function searchByISBN(isbn: string): Promise<AladinItem | null> {
  checkKey();
  const clean = isbn.replace(/[-\s]/g, '');
  const isISBN13 = clean.length === 13;
  const qs = toQueryString({
    ttbkey: ALADIN_TTB_KEY,
    itemId: clean,
    itemIdType: isISBN13 ? 'ISBN13' : 'ISBN',
    output: 'js',
    Version: '20131101',
    Cover: 'Big',
  });
  const data = await aladinFetch(`${LOOKUP_URL}?${qs}`);
  return data.item?.[0] ?? null;
}
