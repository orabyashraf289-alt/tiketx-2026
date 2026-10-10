export interface ErrorRow { message: string; url: string | null; created_at: string }
export interface ErrorGroup { message: string; count: number; lastAt: string; urls: string[] }

/** A message repeated this many times is flagged as a repeated error. */
export const REPEAT_THRESHOLD = 5;

export function groupErrors(rows: ErrorRow[]): ErrorGroup[] {
  const map = new Map<string, ErrorGroup>();
  for (const r of rows) {
    const g = map.get(r.message) ?? { message: r.message, count: 0, lastAt: r.created_at, urls: [] };
    g.count++;
    if (r.created_at > g.lastAt) g.lastAt = r.created_at;
    if (r.url && !g.urls.includes(r.url)) g.urls.push(r.url);
    map.set(r.message, g);
  }
  return [...map.values()].sort((a, b) => b.count - a.count);
}
