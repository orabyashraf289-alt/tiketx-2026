export type AppRole = 'admin' | 'agent' | 'requester' | 'developer';

const STAFF: AppRole[] = ['admin', 'agent', 'developer'];

/** Which roles may open a given path. Unlisted paths are open to any signed-in user. */
export function allowedRolesFor(path: string): AppRole[] | null {
  if (path === '/admin/approval-kanban') return STAFF;
  if (path.startsWith('/admin')) return ['admin'];
  if (path === '/developer') return ['admin', 'developer'];
  if (path === '/tickets' || path === '/tickets/new' || path === '/') return STAFF;
  return null;
}

export function canAccess(role: AppRole | null | undefined, path: string): boolean {
  const allowed = allowedRolesFor(path);
  if (!allowed) return true;
  return !!role && allowed.includes(role);
}
