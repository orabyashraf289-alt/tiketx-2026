import { statusLabels, priorityLabels } from '@/lib/api';

interface ReportData {
  total: number;
  avgResolutionHours: number;
  avgFirstResponseHours: number;
  slaCompliancePercent: number;
  slaBreaches: number;
  slaMet: number;
  overdueCount: number;
  byStatus: Record<string, number>;
  byPriority: Record<string, number>;
  byDepartment: Record<string, number>;
  rawTickets?: any[];
}

export function exportReportPDF(report: ReportData, dateLabel: string) {
  const statusRows = Object.entries(report.byStatus)
    .map(([k, v]) => `<tr><td>${statusLabels[k as keyof typeof statusLabels] || k}</td><td>${v}</td></tr>`)
    .join('');

  const priorityRows = Object.entries(report.byPriority)
    .map(([k, v]) => `<tr><td>${priorityLabels[k as keyof typeof priorityLabels] || k}</td><td>${v}</td></tr>`)
    .join('');

  const deptRows = Object.entries(report.byDepartment)
    .map(([k, v]) => `<tr><td>${k}</td><td>${v}</td></tr>`)
    .join('');

  const ticketRows = (report.rawTickets || []).slice(0, 100)
    .map((t: any) => `<tr>
      <td>${t.ticket_number}</td>
      <td>${t.title?.slice(0, 40) || ''}</td>
      <td>${statusLabels[t.status as keyof typeof statusLabels] || t.status}</td>
      <td>${priorityLabels[t.priority as keyof typeof priorityLabels] || t.priority}</td>
      <td>${t.department || '-'}</td>
      <td>${t.resolutionHours ? t.resolutionHours + 'h' : '-'}</td>
    </tr>`)
    .join('');

  const html = `<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
<meta charset="UTF-8">
<title>تقرير التذاكر - ${dateLabel}</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@400;700;800&display=swap');
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Tajawal', sans-serif; background: #fff; color: #1a2e28; padding: 40px; font-size: 13px; }
  .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 3px solid #2d8b6e; padding-bottom: 20px; margin-bottom: 30px; }
  .header h1 { font-size: 24px; color: #2d8b6e; }
  .header .meta { text-align: left; color: #666; font-size: 11px; }
  .kpi-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 30px; }
  .kpi-card { background: #f0faf5; border: 1px solid #d0e8dd; border-radius: 10px; padding: 16px; text-align: center; }
  .kpi-card .value { font-size: 28px; font-weight: 800; color: #2d8b6e; }
  .kpi-card .label { font-size: 11px; color: #666; margin-top: 4px; }
  .section { margin-bottom: 24px; }
  .section h2 { font-size: 16px; color: #2d8b6e; margin-bottom: 12px; border-bottom: 1px solid #e0e0e0; padding-bottom: 6px; }
  table { width: 100%; border-collapse: collapse; font-size: 12px; }
  th, td { padding: 8px 12px; text-align: right; border-bottom: 1px solid #eee; }
  th { background: #f0faf5; font-weight: 700; color: #2d8b6e; }
  tr:hover { background: #fafffe; }
  .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }
  .footer { margin-top: 40px; text-align: center; color: #999; font-size: 10px; border-top: 1px solid #eee; padding-top: 16px; }
  @media print { body { padding: 20px; } .kpi-grid { grid-template-columns: repeat(3, 1fr); } }
</style>
</head>
<body>
  <div class="header">
    <div>
      <h1>📊 تقرير التذاكر</h1>
      <p style="color:#888;font-size:12px;">الفترة: ${dateLabel}</p>
    </div>
    <div class="meta">
      <p>تاريخ التصدير: ${new Date().toLocaleDateString('ar-SA')}</p>
      <p>TicketFlow System</p>
    </div>
  </div>

  <div class="kpi-grid">
    <div class="kpi-card"><div class="value">${report.total}</div><div class="label">إجمالي التذاكر</div></div>
    <div class="kpi-card"><div class="value">${report.avgResolutionHours}h</div><div class="label">متوسط زمن الحل</div></div>
    <div class="kpi-card"><div class="value">${report.avgFirstResponseHours}h</div><div class="label">متوسط أول رد</div></div>
    <div class="kpi-card"><div class="value">${report.slaCompliancePercent}%</div><div class="label">التزام SLA</div></div>
    <div class="kpi-card"><div class="value" style="color:#e53e3e">${report.slaBreaches}</div><div class="label">تجاوزات SLA</div></div>
    <div class="kpi-card"><div class="value" style="color:#dd6b20">${report.overdueCount}</div><div class="label">متأخرة حالياً</div></div>
  </div>

  <div class="two-col">
    <div class="section">
      <h2>حسب الحالة</h2>
      <table><thead><tr><th>الحالة</th><th>العدد</th></tr></thead><tbody>${statusRows}</tbody></table>
    </div>
    <div class="section">
      <h2>حسب الأولوية</h2>
      <table><thead><tr><th>الأولوية</th><th>العدد</th></tr></thead><tbody>${priorityRows}</tbody></table>
    </div>
  </div>

  <div class="section">
    <h2>حسب القسم</h2>
    <table><thead><tr><th>القسم</th><th>العدد</th></tr></thead><tbody>${deptRows}</tbody></table>
  </div>

  <div class="section" style="page-break-before:always;">
    <h2>تفاصيل التذاكر (أحدث 100)</h2>
    <table>
      <thead><tr><th>#</th><th>العنوان</th><th>الحالة</th><th>الأولوية</th><th>القسم</th><th>زمن الحل</th></tr></thead>
      <tbody>${ticketRows}</tbody>
    </table>
  </div>

  <div class="footer">تم إنشاء هذا التقرير آلياً بواسطة نظام TicketFlow — ${new Date().toISOString()}</div>
</body>
</html>`;

  const win = window.open('', '_blank');
  if (win) {
    win.document.write(html);
    win.document.close();
    setTimeout(() => win.print(), 500);
  }
}
