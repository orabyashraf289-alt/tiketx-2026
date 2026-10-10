import { describe, it, expect } from 'vitest';
import { canAccess } from '@/lib/access';

describe('route access by role', () => {
  it('only admins open admin pages', () => {
    expect(canAccess('admin', '/admin/users')).toBe(true);
    expect(canAccess('agent', '/admin/users')).toBe(false);
    expect(canAccess('requester', '/admin/security')).toBe(false);
    expect(canAccess('developer', '/admin/settings')).toBe(false);
  });

  it('approval board is open to staff but not clients', () => {
    expect(canAccess('agent', '/admin/approval-kanban')).toBe(true);
    expect(canAccess('developer', '/admin/approval-kanban')).toBe(true);
    expect(canAccess('requester', '/admin/approval-kanban')).toBe(false);
  });

  it('developer board is for developers and admins only', () => {
    expect(canAccess('developer', '/developer')).toBe(true);
    expect(canAccess('admin', '/developer')).toBe(true);
    expect(canAccess('agent', '/developer')).toBe(false);
    expect(canAccess('requester', '/developer')).toBe(false);
  });

  it('no role means no access to restricted pages', () => {
    expect(canAccess(null, '/admin/users')).toBe(false);
  });
});
