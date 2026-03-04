/**
 * Error sanitization utility - prevents internal database/system details
 * from being exposed to end users in toast messages.
 */

const ERROR_MAP: Array<{ test: (msg: string, code?: string) => boolean; message: string }> = [
  { test: (_, code) => code === 'PGRST116', message: 'لم يتم العثور على السجل المطلوب' },
  { test: (_, code) => code === '23505', message: 'هذا السجل موجود بالفعل' },
  { test: (_, code) => code === '23503', message: 'لا يمكن إتمام العملية - توجد بيانات مرتبطة' },
  { test: (_, code) => code === '42501', message: 'ليس لديك صلاحية للقيام بهذا الإجراء' },
  { test: (msg) => /row.level security/i.test(msg), message: 'ليس لديك صلاحية للقيام بهذا الإجراء' },
  { test: (msg) => /foreign key/i.test(msg), message: 'لا يمكن إتمام العملية - توجد بيانات مرتبطة' },
  { test: (msg) => /unique.*constraint|duplicate key/i.test(msg), message: 'هذا السجل موجود بالفعل' },
  { test: (msg) => /not.null|null value/i.test(msg), message: 'يرجى ملء جميع الحقول المطلوبة' },
  { test: (msg) => /invalid.*password|incorrect.*password/i.test(msg), message: 'كلمة المرور غير صحيحة' },
  { test: (msg) => /invalid.*credentials|invalid login/i.test(msg), message: 'بيانات الدخول غير صحيحة' },
  { test: (msg) => /email.*already.*registered|already.*registered/i.test(msg), message: 'البريد الإلكتروني مسجل مسبقاً' },
  { test: (msg) => /email.*not.*confirmed/i.test(msg), message: 'يرجى تأكيد بريدك الإلكتروني أولاً' },
  { test: (msg) => /rate.limit|too many/i.test(msg), message: 'طلبات كثيرة جداً، يرجى المحاولة لاحقاً' },
  { test: (msg) => /network|fetch|timeout|abort/i.test(msg), message: 'خطأ في الاتصال بالخادم، يرجى المحاولة لاحقاً' },
  // Client-side validation messages (Arabic) pass through as-is
  { test: (msg) => /حجم الملف|نوع الملف|الحقل مطلوب/i.test(msg), message: '' },
];

export function sanitizeError(error: unknown): string {
  if (!error) return 'حدث خطأ غير متوقع';

  const err = error as Record<string, any>;
  const message = err?.message || String(error);
  const code = err?.code;

  // Log full error for debugging (only in dev)
  if (import.meta.env.DEV) {
    console.error('[Error Details]:', error);
  }

  for (const mapping of ERROR_MAP) {
    if (mapping.test(message, code)) {
      // Empty message means pass-through (client validation messages)
      return mapping.message || message;
    }
  }

  return 'حدث خطأ غير متوقع. يرجى المحاولة لاحقاً';
}
