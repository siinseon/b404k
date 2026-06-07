import { ReadingSession } from '../types/session';

function finiteNumber(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

export function sessionPages(session: Pick<ReadingSession, 'startPage' | 'endPage' | 'currentPage'>): number {
  const start = finiteNumber(session.startPage);
  const end = finiteNumber(session.endPage);
  const current = finiteNumber(session.currentPage);

  if (start != null && end != null) return Math.max(0, end - start);
  if (current != null) return Math.max(0, current);
  return 0;
}

export function sessionPageLabel(session: Pick<ReadingSession, 'startPage' | 'endPage' | 'currentPage'>): string {
  const start = finiteNumber(session.startPage);
  const end = finiteNumber(session.endPage);
  const current = finiteNumber(session.currentPage);

  if (start != null && end != null) return `p.${start}->${end}`;
  if (current != null) return `p.${current}`;
  return 'p.--';
}
