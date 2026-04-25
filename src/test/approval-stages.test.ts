import { describe, it, expect, vi, beforeEach } from 'vitest';

// Build a flexible chainable mock for the supabase client used by api.ts.
type Resolver = (table: string, op: 'select' | 'insert' | 'update' | 'delete', state: any) => any;

const state = {
  resolver: null as Resolver | null,
  inserts: [] as Array<{ table: string; payload: any }>,
};

function makeChain(table: string, op: 'select' | 'insert' | 'update' | 'delete', extra: any = {}) {
  const ctx: any = { table, op, ...extra };
  const chain: any = {
    select: (cols?: string) => { ctx.select = cols; return chain; },
    insert: (payload: any) => { ctx.payload = payload; state.inserts.push({ table, payload }); return makeChain(table, 'insert', ctx); },
    update: (payload: any) => { ctx.payload = payload; return makeChain(table, 'update', ctx); },
    delete: () => makeChain(table, 'delete', ctx),
    eq: (_c: string, _v: any) => chain,
    order: (_c: string) => chain,
    limit: (_n: number) => Promise.resolve(state.resolver!(table, op, ctx)),
    single: () => Promise.resolve(state.resolver!(table, op, ctx)),
    then: (res: any, rej: any) =>
      Promise.resolve(state.resolver!(table, op, ctx)).then(res, rej),
  };
  return chain;
}

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: (table: string) => makeChain(table, 'select'),
  },
}));

import { fetchApprovalStages, createApprovalStage, rebuildApprovalRelationships } from '@/lib/api';

beforeEach(() => {
  state.resolver = null;
  state.inserts = [];
});

describe('Approval Stages — end-to-end flow', () => {
  it('creates a stage and the next list fetch returns it (full embed path)', async () => {
    const created = {
      id: 'stage-1',
      department_id: 'dept-1',
      stage_name: 'Manager Review',
      stage_order: 1,
      stage_type: 'sequential',
      approver_role: 'agent',
      approver_id: null,
      service_id: null,
      deadline_hours: 24,
      escalation_to: null,
      created_at: new Date().toISOString(),
    };

    const stagesInDb: any[] = [];

    state.resolver = (table, op) => {
      if (table === 'approval_stages' && op === 'insert') {
        stagesInDb.push(created);
        return { data: created, error: null };
      }
      if (table === 'approval_stages' && op === 'select') {
        // Full embed path succeeds
        return {
          data: stagesInDb.map(s => ({
            ...s,
            departments: { name: 'Finance' },
            services: null,
            approver_profile: null, // null profile must NOT break the page
            escalation_profile: null,
          })),
          error: null,
        };
      }
      return { data: null, error: { message: `unexpected ${op} on ${table}` } };
    };

    // 1) Create
    const inserted = await createApprovalStage({
      department_id: 'dept-1',
      stage_name: 'Manager Review',
      stage_order: 1,
      stage_type: 'sequential',
      approver_role: 'agent',
      deadline_hours: 24,
    });
    expect(inserted).toMatchObject({ id: 'stage-1', stage_name: 'Manager Review' });
    expect(state.inserts).toHaveLength(1);
    expect(state.inserts[0].table).toBe('approval_stages');

    // 2) Refetch should now include the stage (toast + invalidate path)
    const list = await fetchApprovalStages();
    expect(list).toHaveLength(1);
    expect(list[0].stage_name).toBe('Manager Review');
    // Null profile fields are tolerated
    expect(list[0].approver_profile).toBeNull();
  });

  it('falls back to embed-less query when the profile join fails', async () => {
    let calls = 0;
    state.resolver = (table, op, ctx) => {
      if (table !== 'approval_stages' || op !== 'select') return { data: null, error: null };
      calls += 1;
      // First call uses the full embed (contains approver_profile) and fails
      if (ctx.select?.includes('approver_profile')) {
        return { data: null, error: { message: 'PGRST200: relation missing' } };
      }
      // Fallback call: stages still returned
      return {
        data: [{ id: 's1', stage_name: 'Fallback Stage', stage_order: 1, departments: null, services: null }],
        error: null,
      };
    };

    const list = await fetchApprovalStages();
    expect(calls).toBe(2);
    expect(list).toHaveLength(1);
    expect(list[0].stage_name).toBe('Fallback Stage');
  });

  it('rebuildApprovalRelationships reports embed/fallback health', async () => {
    state.resolver = (table, _op, ctx) => {
      if (table !== 'approval_stages') return { data: [], error: null };
      if (ctx.select?.includes('approver_profile')) {
        return { data: null, error: { message: 'embed broken' } };
      }
      return { data: [{ id: 's1' }], error: null };
    };

    const result = await rebuildApprovalRelationships();
    expect(result.embedWorks).toBe(false);
    expect(result.fallbackWorks).toBe(true);
    expect(result.ok).toBe(false);
    expect(result.embedError).toBe('embed broken');
    expect(result.stageCount).toBe(1);
  });
});
