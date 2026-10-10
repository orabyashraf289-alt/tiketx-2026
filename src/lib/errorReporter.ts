import { supabase } from '@/integrations/supabase/client';

let lastKey = '';
let lastAt = 0;

/** Stores a client-side error so admins can review it on System Health. */
export async function reportClientError(message: string, stack?: string) {
  try {
    const key = message.slice(0, 200);
    if (key === lastKey && Date.now() - lastAt < 10_000) return; // throttle duplicates
    lastKey = key; lastAt = Date.now();
    const { data } = await supabase.auth.getSession();
    const uid = data.session?.user.id;
    if (!uid) return;
    await supabase.from('client_error_logs').insert({
      user_id: uid,
      message: message.slice(0, 2000),
      stack: stack?.slice(0, 8000) ?? null,
      url: window.location.pathname,
      user_agent: navigator.userAgent.slice(0, 300),
    });
  } catch { /* never throw from the reporter */ }
}

export function installGlobalErrorReporting() {
  window.addEventListener('error', (e) => reportClientError(e.message || 'Unknown error', e.error?.stack));
  window.addEventListener('unhandledrejection', (e) => {
    const r: any = e.reason;
    reportClientError(r?.message || String(r), r?.stack);
  });
}
