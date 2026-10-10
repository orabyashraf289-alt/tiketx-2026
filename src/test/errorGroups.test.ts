import { describe, it, expect } from 'vitest';
import { groupErrors, REPEAT_THRESHOLD } from '@/lib/errorGroups';

describe('groupErrors', () => {
  it('groups by message and counts, most frequent first', () => {
    const g = groupErrors([
      { message: 'A', url: '/x', created_at: '2026-01-01' },
      { message: 'B', url: '/y', created_at: '2026-01-02' },
      { message: 'B', url: '/z', created_at: '2026-01-03' },
    ]);
    expect(g[0]).toMatchObject({ message: 'B', count: 2, lastAt: '2026-01-03', urls: ['/y', '/z'] });
    expect(g[1].count).toBe(1);
  });
  it('repeat threshold is 5', () => expect(REPEAT_THRESHOLD).toBe(5));
});
