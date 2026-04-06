import { useState, useMemo } from 'react';
import { useLanguage } from '@/i18n';
import { PageLayout } from '@/components/layout/PageLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { motion } from 'framer-motion';
import {
  Search, BookOpen, LayoutDashboard, Inbox, Plus, Users, Timer, BarChart3,
  ShieldCheck, Building2, Zap, Globe, Webhook, Settings, Star, Award,
  FileSearch, Mail, MessageSquare, Columns, Plug, Rocket, Activity,
  FormInput, Download, CheckCircle2, ArrowRight, Lightbulb, HelpCircle,
  BookMarked, Monitor, Lock, Bell, Layers, FileText
} from 'lucide-react';

interface GuideSection {
  id: string;
  titleAr: string;
  titleEn: string;
  icon: any;
  category: 'basics' | 'tickets' | 'admin' | 'reports' | 'integrations' | 'security';
  steps: { titleAr: string; titleEn: string; descAr: string; descEn: string }[];
  tipsAr?: string[];
  tipsEn?: string[];
}

const guideSections: GuideSection[] = [
  // === BASICS ===
  {
    id: 'dashboard',
    titleAr: 'لوحة التحكم الرئيسية',
    titleEn: 'Main Dashboard',
    icon: LayoutDashboard,
    category: 'basics',
    steps: [
      { titleAr: 'نظرة عامة', titleEn: 'Overview', descAr: 'تعرض لوحة التحكم ملخصاً شاملاً لحالة التذاكر ومؤشرات الأداء الرئيسية (KPIs) بما في ذلك التذاكر غير المحلولة والمعلقة والمتأخرة وخروقات SLA ونسبة الامتثال.', descEn: 'The dashboard displays a comprehensive summary of ticket status and KPIs including unresolved, pending, overdue tickets, SLA breaches, and compliance rate.' },
      { titleAr: 'الفلاتر الزمنية', titleEn: 'Time Filters', descAr: 'استخدم الفلاتر الزمنية المرنة لتحديد الفترة المطلوبة (اليوم، الأسبوع، الشهر، مخصص) لعرض البيانات ذات الصلة.', descEn: 'Use flexible time filters to specify the desired period (today, week, month, custom) to display relevant data.' },
      { titleAr: 'الرسوم البيانية', titleEn: 'Charts', descAr: 'تتضمن اللوحة رسوماً بيانية تفاعلية (Bar, Pie, Line) لتحليل اتجاهات التذاكر وتوزيعها حسب الحالة والأولوية والقسم.', descEn: 'The dashboard includes interactive charts (Bar, Pie, Line) for analyzing ticket trends and distribution by status, priority, and department.' },
      { titleAr: 'التصدير', titleEn: 'Export', descAr: 'يمكنك تصدير البيانات بصيغة CSV مع دعم الترميز العربي (BOM) أو توليد تقارير PDF جاهزة للطباعة.', descEn: 'You can export data in CSV format with Arabic encoding (BOM) support or generate print-ready PDF reports.' },
    ],
    tipsAr: ['اضغط على أي بطاقة KPI للتنقل مباشرة إلى التذاكر ذات الصلة', 'استخدم اختصار لوحة المفاتيح للتبديل بين الفلاتر'],
    tipsEn: ['Click any KPI card to navigate directly to related tickets', 'Use keyboard shortcuts to switch between filters'],
  },
  {
    id: 'profile',
    titleAr: 'الملف الشخصي',
    titleEn: 'Profile',
    icon: Users,
    category: 'basics',
    steps: [
      { titleAr: 'تعديل البيانات', titleEn: 'Edit Information', descAr: 'يمكنك تعديل اسمك الكامل، المسمى الوظيفي، رقم الجوال، المدينة، والدولة من صفحة الملف الشخصي.', descEn: 'You can edit your full name, job title, phone number, city, and country from the profile page.' },
      { titleAr: 'تفضيلات الإشعارات', titleEn: 'Notification Preferences', descAr: 'تحكم في أنواع الإشعارات التي تريد تلقيها: إنشاء تذاكر، تعيين، تغيير حالة، إضافة تعليق، خرق SLA، والموافقات.', descEn: 'Control the types of notifications you want to receive: ticket creation, assignment, status change, comment added, SLA breach, and approvals.' },
      { titleAr: 'تغيير اللغة', titleEn: 'Change Language', descAr: 'اختر لغتك المفضلة (عربي/إنجليزي) من الشريط الجانبي أو صفحة الملف الشخصي.', descEn: 'Choose your preferred language (Arabic/English) from the sidebar or profile page.' },
    ],
  },
  {
    id: 'notifications',
    titleAr: 'نظام الإشعارات',
    titleEn: 'Notification System',
    icon: Bell,
    category: 'basics',
    steps: [
      { titleAr: 'إشعارات فورية', titleEn: 'Real-time Notifications', descAr: 'يستلم النظام إشعارات لحظية عند حدوث أي تغيير على التذاكر المتعلقة بك مع صوت تنبيه.', descEn: 'The system receives real-time notifications when any change occurs on tickets related to you with an alert sound.' },
      { titleAr: 'صندوق الإشعارات', titleEn: 'Notifications Inbox', descAr: 'اعرض جميع إشعاراتك مع إمكانية تصفيتها (مقروءة/غير مقروءة) ووضع علامة كمقروء.', descEn: 'View all your notifications with filtering options (read/unread) and mark as read.' },
    ],
  },

  // === TICKETS ===
  {
    id: 'create-ticket',
    titleAr: 'إنشاء تذكرة جديدة',
    titleEn: 'Create New Ticket',
    icon: Plus,
    category: 'tickets',
    steps: [
      { titleAr: 'اختيار النظام', titleEn: 'Select System', descAr: 'ابدأ باختيار النظام المصدر (مثل: ERP, LMS, CPAY, SIS) الذي تواجه فيه المشكلة أو تحتاج خدمة منه.', descEn: 'Start by selecting the source system (e.g., ERP, LMS, CPAY, SIS) where you encounter the issue or need service from.' },
      { titleAr: 'اختيار الخدمة', titleEn: 'Select Service', descAr: 'اختر الخدمة المحددة (الموديول) ضمن النظام المختار، ثم حدد التصنيف الفرعي (الشاشة/الفئة).', descEn: 'Choose the specific service (module) within the selected system, then specify the sub-category (screen/category).' },
      { titleAr: 'تعبئة التفاصيل', titleEn: 'Fill Details', descAr: 'أدخل عنوان التذكرة ووصفاً تفصيلياً للمشكلة أو الطلب. حدد مستوى الأولوية (منخفض، متوسط، عالي، عاجل).', descEn: 'Enter the ticket title and a detailed description of the issue or request. Set the priority level (low, medium, high, urgent).' },
      { titleAr: 'إرفاق الملفات', titleEn: 'Attach Files', descAr: 'أرفق لقطات شاشة أو ملفات توضيحية تساعد فريق الدعم في فهم المشكلة بشكل أسرع.', descEn: 'Attach screenshots or supporting files to help the support team understand the issue faster.' },
      { titleAr: 'الحقول المخصصة', titleEn: 'Custom Fields', descAr: 'قد تظهر حقول إضافية مخصصة حسب الخدمة المختارة (مثل: رقم الفاتورة، اسم الطالب). قم بتعبئتها إن وجدت.', descEn: 'Additional custom fields may appear based on the selected service (e.g., invoice number, student name). Fill them if present.' },
    ],
    tipsAr: ['استخدم القوالب الجاهزة لتسريع إنشاء التذاكر المتكررة', 'كلما كان الوصف أدق، زادت سرعة الحل'],
    tipsEn: ['Use ready-made templates to speed up creating recurring tickets', 'The more detailed the description, the faster the resolution'],
  },
  {
    id: 'ticket-lifecycle',
    titleAr: 'دورة حياة التذكرة',
    titleEn: 'Ticket Lifecycle',
    icon: Inbox,
    category: 'tickets',
    steps: [
      { titleAr: 'جديدة (New)', titleEn: 'New', descAr: 'التذكرة المُنشأة حديثاً تظهر بحالة "جديدة" وتنتظر التعيين لوكيل دعم.', descEn: 'A newly created ticket appears with "New" status and awaits assignment to a support agent.' },
      { titleAr: 'مفتوحة (Open)', titleEn: 'Open', descAr: 'بعد تعيين الوكيل، تتحول التذكرة إلى "مفتوحة" لبدء العمل عليها.', descEn: 'After agent assignment, the ticket changes to "Open" to begin work on it.' },
      { titleAr: 'قيد التنفيذ (In Progress)', titleEn: 'In Progress', descAr: 'الوكيل يعمل فعلياً على حل المشكلة.', descEn: 'The agent is actively working on solving the issue.' },
      { titleAr: 'بانتظار العميل', titleEn: 'Waiting on Customer', descAr: 'التذكرة معلقة بانتظار رد أو معلومات إضافية من مقدم الطلب.', descEn: 'The ticket is pending awaiting a response or additional information from the requester.' },
      { titleAr: 'تم الحل (Resolved)', titleEn: 'Resolved', descAr: 'الوكيل أكمل حل المشكلة ويمكن لمقدم الطلب تأكيد الحل أو إعادة فتح التذكرة.', descEn: 'The agent has completed the resolution and the requester can confirm or reopen the ticket.' },
      { titleAr: 'مغلقة (Closed)', titleEn: 'Closed', descAr: 'التذكرة أُغلقت نهائياً بعد تأكيد الحل أو انتهاء فترة المتابعة.', descEn: 'The ticket is permanently closed after confirming the resolution or expiry of the follow-up period.' },
    ],
    tipsAr: ['يمكنك تقييم تجربتك بعد حل التذكرة عبر ويدجت CSAT'],
    tipsEn: ['You can rate your experience after ticket resolution via the CSAT widget'],
  },
  {
    id: 'ticket-management',
    titleAr: 'إدارة التذاكر',
    titleEn: 'Ticket Management',
    icon: Inbox,
    category: 'tickets',
    steps: [
      { titleAr: 'صندوق الوارد', titleEn: 'Inbox', descAr: 'يعرض جميع التذاكر مع فلاتر متقدمة (حسب الحالة، الأولوية، القسم، النظام، الوكيل) وبحث نصي شامل.', descEn: 'Displays all tickets with advanced filters (by status, priority, department, system, agent) and full-text search.' },
      { titleAr: 'عرض جدول/بطاقات', titleEn: 'Table/Card View', descAr: 'بدّل بين عرض الجدول التفصيلي وعرض البطاقات حسب تفضيلك.', descEn: 'Switch between detailed table view and card view according to your preference.' },
      { titleAr: 'تفاصيل التذكرة', titleEn: 'Ticket Details', descAr: 'اعرض كافة تفاصيل التذكرة: المحادثة، المرفقات، سجل التغييرات، مسار الموافقات، وتتبع الوقت.', descEn: 'View all ticket details: conversation, attachments, change log, approval path, and time tracking.' },
      { titleAr: 'التعليقات', titleEn: 'Comments', descAr: 'أضف تعليقات عامة (يراها العميل) أو ملاحظات خاصة (يراها فريق الدعم فقط) على التذاكر.', descEn: 'Add public comments (visible to customer) or private notes (visible to support team only) on tickets.' },
      { titleAr: 'تتبع الوقت', titleEn: 'Time Tracking', descAr: 'سجّل الوقت المستغرق في العمل على كل تذكرة عبر المؤقت المدمج.', descEn: 'Record time spent working on each ticket via the built-in timer.' },
    ],
  },

  // === ADMIN ===
  {
    id: 'service-catalog',
    titleAr: 'كتالوج الخدمات',
    titleEn: 'Service Catalog',
    icon: BookOpen,
    category: 'admin',
    steps: [
      { titleAr: 'هيكل الكتالوج', titleEn: 'Catalog Structure', descAr: 'يعتمد النظام هيكلاً هرمياً: النظام (System) ← الخدمة/الموديول (Service) ← التصنيف/الشاشة (Category).', descEn: 'The system uses a hierarchical structure: System ← Service/Module ← Category/Screen.' },
      { titleAr: 'إدارة الأنظمة', titleEn: 'Manage Systems', descAr: 'أنشئ الأنظمة المصدرية (ERP, LMS, CPAY, SIS, HR, Edumalls) وعدّل أوصافها وحالتها.', descEn: 'Create source systems (ERP, LMS, CPAY, SIS, HR, Edumalls) and edit their descriptions and status.' },
      { titleAr: 'إدارة الخدمات', titleEn: 'Manage Services', descAr: 'أضف خدمات (موديولات) لكل نظام مع ربط سياسات SLA مخصصة وفرق الدعم.', descEn: 'Add services (modules) for each system with custom SLA policies and support teams.' },
      { titleAr: 'الحقول المخصصة', titleEn: 'Custom Fields', descAr: 'أنشئ حقولاً مخصصة لكل خدمة (نص، رقم، قائمة منسدلة، تاريخ) لجمع معلومات إضافية.', descEn: 'Create custom fields per service (text, number, dropdown, date) to collect additional information.' },
    ],
  },
  {
    id: 'departments-users',
    titleAr: 'إدارة الأقسام والمستخدمين',
    titleEn: 'Departments & Users Management',
    icon: Building2,
    category: 'admin',
    steps: [
      { titleAr: 'إدارة الأقسام', titleEn: 'Manage Departments', descAr: 'أنشئ أقسام الدعم (مثل: الدعم التقني، خدمة العملاء) وعيّن مديرين لكل قسم.', descEn: 'Create support departments (e.g., Technical Support, Customer Service) and assign managers to each.' },
      { titleAr: 'إدارة المستخدمين', titleEn: 'Manage Users', descAr: 'تتبع إجمالي المستخدمين والحسابات النشطة وتوزيع الأدوار. ابحث وصفّي حسب الدور والقسم.', descEn: 'Track total users, active accounts, and role distribution. Search and filter by role and department.' },
      { titleAr: 'الأدوار', titleEn: 'Roles', descAr: 'يدعم النظام 4 أدوار: مدير (Admin)، وكيل دعم (Agent)، مقدم طلب (Requester)، مطوّر (Developer).', descEn: 'The system supports 4 roles: Admin, Agent, Requester, and Developer.' },
    ],
  },
  {
    id: 'approval-stages',
    titleAr: 'مراحل الاعتماد والموافقات',
    titleEn: 'Approval Stages',
    icon: ShieldCheck,
    category: 'admin',
    steps: [
      { titleAr: 'إنشاء مراحل', titleEn: 'Create Stages', descAr: 'حدد مراحل الاعتماد لكل قسم مع تحديد نوع المرحلة (تسلسلي أو متوازي) والمعتمدين.', descEn: 'Define approval stages per department with stage type (sequential or parallel) and approvers.' },
      { titleAr: 'المخطط الانسيابي', titleEn: 'Flowchart', descAr: 'اعرض مسارات الاعتماد بصرياً عبر المخطط الانسيابي مع مسارات التصعيد.', descEn: 'View approval paths visually via the flowchart with escalation paths.' },
      { titleAr: 'لوحة كانبان', titleEn: 'Kanban Board', descAr: 'تابع حالة الموافقات (معلقة/مقبولة/مرفوضة) في عرض كانبان تفاعلي.', descEn: 'Track approval status (pending/approved/rejected) in an interactive Kanban view.' },
      { titleAr: 'التصعيد التلقائي', titleEn: 'Auto Escalation', descAr: 'عيّن مواعيد نهائية للموافقات مع تصعيد تلقائي عند التأخر.', descEn: 'Set deadlines for approvals with auto-escalation when overdue.' },
    ],
  },
  {
    id: 'sla-management',
    titleAr: 'إدارة اتفاقيات مستوى الخدمة (SLA)',
    titleEn: 'SLA Management',
    icon: Timer,
    category: 'admin',
    steps: [
      { titleAr: 'تعريف السياسات', titleEn: 'Define Policies', descAr: 'حدد أوقات الاستجابة الأولى والحل لكل مستوى أولوية (منخفض، متوسط، عالي، عاجل).', descEn: 'Set first response and resolution times for each priority level (low, medium, high, urgent).' },
      { titleAr: 'مراقبة الالتزام', titleEn: 'Monitor Compliance', descAr: 'تابع معدلات الالتزام (ممتاز/جيد/يحتاج تحسين) والتذاكر المتجاوزة والمعرضة للخطر.', descEn: 'Monitor compliance rates (excellent/good/needs improvement) and overdue/at-risk tickets.' },
      { titleAr: 'مصفوفة التصعيد', titleEn: 'Escalation Matrix', descAr: 'نظام تصعيد من 4 مستويات (L0–L3) يرفع الأولوية تلقائياً ويخطر المسؤولين.', descEn: 'A 4-level escalation system (L0-L3) that automatically raises priority and notifies managers.' },
      { titleAr: 'العداد التنازلي', titleEn: 'Countdown', descAr: 'شريط تقدم مرئي مع عد تنازلي يظهر للمستخدمين الوقت المتبقي قبل خرق SLA.', descEn: 'A visual progress bar with countdown showing users the time remaining before SLA breach.' },
    ],
  },
  {
    id: 'automation',
    titleAr: 'قواعد الأتمتة',
    titleEn: 'Automation Rules',
    icon: Zap,
    category: 'admin',
    steps: [
      { titleAr: 'إنشاء قاعدة', titleEn: 'Create Rule', descAr: 'حدد اسم القاعدة والحدث المُشغّل (مثل: إنشاء تذكرة، تغيير حالة، تغيير أولوية).', descEn: 'Define rule name and trigger event (e.g., ticket created, status changed, priority changed).' },
      { titleAr: 'الشروط', titleEn: 'Conditions', descAr: 'أضف شروطاً (حسب الأولوية، القسم، النظام) لتحديد متى تُنفَّذ القاعدة.', descEn: 'Add conditions (by priority, department, system) to determine when the rule executes.' },
      { titleAr: 'الإجراءات', titleEn: 'Actions', descAr: 'حدد الإجراءات التلقائية: تعيين وكيل، تغيير أولوية، إرسال إشعار، تحويل قسم.', descEn: 'Define automatic actions: assign agent, change priority, send notification, transfer department.' },
    ],
  },
  {
    id: 'tenants',
    titleAr: 'إدارة المستأجرين (Multi-Tenant)',
    titleEn: 'Tenant Management (Multi-Tenant)',
    icon: Building2,
    category: 'admin',
    steps: [
      { titleAr: 'إنشاء مستأجر', titleEn: 'Create Tenant', descAr: 'أنشئ كيانات (مستأجرين) جدد مع تخصيص الخطة وحدود الاستخدام (عدد المستخدمين والتذاكر).', descEn: 'Create new tenants with custom plans and usage limits (users and tickets count).' },
      { titleAr: 'الهوية البصرية', titleEn: 'White-Label', descAr: 'خصص لكل مستأجر هويته البصرية: الشعار، الألوان الأساسية، والنطاق المخصص.', descEn: 'Customize each tenant branding: logo, primary colors, and custom domain.' },
      { titleAr: 'إدارة الأعضاء', titleEn: 'Manage Members', descAr: 'أضف أعضاء للمستأجر وحدد أدوارهم (مالك/عضو).', descEn: 'Add members to tenant and assign roles (owner/member).' },
    ],
  },
  {
    id: 'settings',
    titleAr: 'إعدادات النظام',
    titleEn: 'System Settings',
    icon: Settings,
    category: 'admin',
    steps: [
      { titleAr: 'الإعدادات العامة', titleEn: 'General Settings', descAr: 'عدّل اسم النظام، العنوان الفرعي، والشعار. هذه التغييرات تظهر في الشريط الجانبي لجميع المستخدمين.', descEn: 'Edit system name, subtitle, and logo. These changes appear in the sidebar for all users.' },
      { titleAr: 'إدارة البريد', titleEn: 'Email Management', descAr: 'تحكم في إعدادات إشعارات البريد الإلكتروني وقوالب الرسائل.', descEn: 'Control email notification settings and message templates.' },
    ],
  },

  // === REPORTS ===
  {
    id: 'reports-analytics',
    titleAr: 'التقارير والتحليلات',
    titleEn: 'Reports & Analytics',
    icon: BarChart3,
    category: 'reports',
    steps: [
      { titleAr: 'لوحة المدير التنفيذي', titleEn: 'Executive Dashboard', descAr: 'نظرة شاملة على مؤشرات الأداء الرئيسية مع رسوم بيانية تفاعلية وفلاتر زمنية.', descEn: 'Comprehensive overview of KPIs with interactive charts and time filters.' },
      { titleAr: 'أداء الوكلاء', titleEn: 'Agent Performance', descAr: 'تتبع KPIs لكل وكيل: عدد التذاكر المحلولة، متوسط وقت الحل، تقييم CSAT.', descEn: 'Track KPIs per agent: resolved tickets count, average resolution time, CSAT rating.' },
      { titleAr: 'تحليلات CSAT', titleEn: 'CSAT Analytics', descAr: 'تتبع متوسط التقييمات وتوزيعها وترتيب الوكلاء والخدمات حسب رضا العملاء.', descEn: 'Track average ratings, distribution, and ranking of agents and services by customer satisfaction.' },
      { titleAr: 'التزام SLA', titleEn: 'SLA Compliance', descAr: 'تقارير تفصيلية لنسب الامتثال والخروقات والتأخيرات حسب القسم والخدمة.', descEn: 'Detailed reports on compliance rates, breaches, and delays by department and service.' },
      { titleAr: 'منشئ التقارير', titleEn: 'Report Builder', descAr: 'أنشئ تقارير مخصصة بالفلاتر والأبعاد التي تحتاجها مع إمكانية التصدير.', descEn: 'Create custom reports with the filters and dimensions you need with export capability.' },
    ],
  },
  {
    id: 'audit-log',
    titleAr: 'سجل المراجعة',
    titleEn: 'Audit Log',
    icon: FileSearch,
    category: 'reports',
    steps: [
      { titleAr: 'تتبع التغييرات', titleEn: 'Track Changes', descAr: 'سجل شامل لجميع العمليات على التذاكر: إنشاء، تعديل، تعيين، تغيير حالة، إضافة تعليق.', descEn: 'Comprehensive log of all ticket operations: create, edit, assign, status change, comment added.' },
      { titleAr: 'البحث والفلترة', titleEn: 'Search & Filter', descAr: 'ابحث في السجل بالمستخدم أو التذكرة أو نوع الحدث مع فلاتر زمنية.', descEn: 'Search the log by user, ticket, or event type with time filters.' },
    ],
  },

  // === INTEGRATIONS ===
  {
    id: 'classera-integration',
    titleAr: 'تكامل كلاسيرا',
    titleEn: 'Classera Integration',
    icon: Plug,
    category: 'integrations',
    steps: [
      { titleAr: 'ربط الأنظمة', titleEn: 'Connect Systems', descAr: 'اربط أنظمة كلاسيرا (ERP, LMS, CPAY, SIS, HR, Edumalls) لاستقبال التذاكر تلقائياً.', descEn: 'Connect Classera systems (ERP, LMS, CPAY, SIS, HR, Edumalls) to receive tickets automatically.' },
      { titleAr: 'اتجاه المزامنة', titleEn: 'Sync Direction', descAr: 'حدد اتجاه المزامنة: وارد فقط، صادر فقط، أو ثنائي الاتجاه.', descEn: 'Define sync direction: inbound only, outbound only, or bidirectional.' },
      { titleAr: 'مراقبة الحالة', titleEn: 'Monitor Status', descAr: 'تتبع حالة المزامنة وعدد التذاكر المستلمة والمرسلة لكل نظام.', descEn: 'Track sync status and number of received and sent tickets per system.' },
    ],
  },
  {
    id: 'channels',
    titleAr: 'القنوات المتعددة',
    titleEn: 'Omni-Channel',
    icon: Globe,
    category: 'integrations',
    steps: [
      { titleAr: 'واتساب', titleEn: 'WhatsApp', descAr: 'استقبل وأرسل رسائل واتساب مع ربطها بالتذاكر تلقائياً.', descEn: 'Receive and send WhatsApp messages with automatic ticket linking.' },
      { titleAr: 'سلاك', titleEn: 'Slack', descAr: 'اربط قنوات سلاك لإرسال إشعارات التذاكر وتحديثاتها.', descEn: 'Connect Slack channels to send ticket notifications and updates.' },
      { titleAr: 'البريد الإلكتروني', titleEn: 'Email', descAr: 'تحكم في إشعارات البريد الإلكتروني وقوالبها لكل نوع حدث.', descEn: 'Control email notifications and templates for each event type.' },
    ],
  },
  {
    id: 'webhooks-api',
    titleAr: 'الويب هوكس وAPI الخارجي',
    titleEn: 'Webhooks & External API',
    icon: Webhook,
    category: 'integrations',
    steps: [
      { titleAr: 'إنشاء ويب هوك', titleEn: 'Create Webhook', descAr: 'أنشئ نقاط اتصال (Webhooks) لإرسال إشعارات تلقائية لأنظمة خارجية عند أحداث محددة.', descEn: 'Create webhook endpoints to send automatic notifications to external systems on specific events.' },
      { titleAr: 'واجهة API', titleEn: 'API Interface', descAr: 'استخدم واجهة API الخارجية لاستقبال تذاكر من أنظمة خارجية مع توثيق شامل.', descEn: 'Use the external API to receive tickets from external systems with comprehensive documentation.' },
    ],
  },

  // === SECURITY ===
  {
    id: 'security',
    titleAr: 'الأمان والحوكمة',
    titleEn: 'Security & Governance',
    icon: Lock,
    category: 'security',
    steps: [
      { titleAr: 'لوحة الأمان', titleEn: 'Security Dashboard', descAr: 'نظرة عامة على حالة الأمان: المستخدمين النشطين، محاولات الوصول، والتنبيهات.', descEn: 'Security status overview: active users, access attempts, and alerts.' },
      { titleAr: 'سياسات كلمة المرور', titleEn: 'Password Policies', descAr: 'تحكم في سياسات كلمات المرور: الحد الأدنى للطول، التعقيد، وفترة الانتهاء.', descEn: 'Control password policies: minimum length, complexity, and expiration period.' },
      { titleAr: 'التحكم بالوصول', titleEn: 'Access Control', descAr: 'يعتمد النظام سياسات RLS لضمان وصول كل مستخدم للبيانات المسموح بها فقط.', descEn: 'The system uses RLS policies to ensure each user accesses only authorized data.' },
    ],
  },
  {
    id: 'knowledge-base',
    titleAr: 'قاعدة المعرفة',
    titleEn: 'Knowledge Base',
    icon: BookMarked,
    category: 'basics',
    steps: [
      { titleAr: 'المقالات العامة', titleEn: 'Public Articles', descAr: 'أنشئ مقالات معرفية تظهر للعملاء في بوابتهم. تدعم تنسيق Markdown مع تصنيفات ووسوم.', descEn: 'Create knowledge articles visible to customers in their portal. Supports Markdown with categories and tags.' },
      { titleAr: 'المقالات الداخلية', titleEn: 'Internal Articles', descAr: 'وثائق تقنية داخلية لفريق الدعم فقط لا يراها العملاء.', descEn: 'Internal technical docs for support team only, not visible to customers.' },
      { titleAr: 'التقييم والمشاهدات', titleEn: 'Ratings & Views', descAr: 'يمكن للمستخدمين تقييم المقالات (مفيد/غير مفيد) مع عداد مشاهدات لقياس الفائدة.', descEn: 'Users can rate articles (helpful/not helpful) with a views counter to measure usefulness.' },
    ],
  },
  {
    id: 'customer-portal',
    titleAr: 'بوابة العملاء',
    titleEn: 'Customer Portal',
    icon: Monitor,
    category: 'basics',
    steps: [
      { titleAr: 'لوحة التحكم', titleEn: 'Dashboard', descAr: 'يرى مقدم الطلب لوحة تحكم مصغرة بإحصائيات تذاكره واتجاهاتها.', descEn: 'The requester sees a mini dashboard with their ticket stats and trends.' },
      { titleAr: 'إنشاء ومتابعة', titleEn: 'Create & Track', descAr: 'إنشاء تذاكر جديدة ومتابعة حالة التذاكر الحالية والتفاعل عبر التعليقات.', descEn: 'Create new tickets, track current ticket status, and interact via comments.' },
      { titleAr: 'المحادثة الفورية', titleEn: 'Live Chat', descAr: 'تواصل مباشر مع الذكاء الاصطناعي أو فريق الدعم عبر شات فوري مع دعم المرفقات.', descEn: 'Direct communication with AI or support team via live chat with attachment support.' },
    ],
  },
];

const categoryConfig = {
  basics: { labelAr: 'الأساسيات', labelEn: 'Basics', icon: BookOpen, color: 'bg-primary/10 text-primary' },
  tickets: { labelAr: 'إدارة التذاكر', labelEn: 'Ticket Management', icon: Inbox, color: 'bg-info/10 text-info' },
  admin: { labelAr: 'الإدارة', labelEn: 'Administration', icon: Settings, color: 'bg-warning/10 text-warning' },
  reports: { labelAr: 'التقارير', labelEn: 'Reports', icon: BarChart3, color: 'bg-success/10 text-success' },
  integrations: { labelAr: 'التكاملات', labelEn: 'Integrations', icon: Plug, color: 'bg-accent/30 text-accent-foreground' },
  security: { labelAr: 'الأمان', labelEn: 'Security', icon: Lock, color: 'bg-destructive/10 text-destructive' },
};

export default function SystemGuide() {
  const { t, lang, isRTL } = useLanguage();
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('all');

  const filteredSections = useMemo(() => {
    let sections = guideSections;
    if (activeTab !== 'all') {
      sections = sections.filter(s => s.category === activeTab);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      sections = sections.filter(s => {
        const title = lang === 'ar' ? s.titleAr : s.titleEn;
        const stepsText = s.steps.map(st => `${lang === 'ar' ? st.titleAr : st.titleEn} ${lang === 'ar' ? st.descAr : st.descEn}`).join(' ');
        return title.toLowerCase().includes(q) || stepsText.toLowerCase().includes(q);
      });
    }
    return sections;
  }, [search, activeTab, lang]);

  const handleExportPDF = () => {
    // Generate a printable version of the current page
    window.print();
  };

  return (
    <PageLayout>
      <div className="flex-1 p-4 md:p-6 max-w-6xl mx-auto w-full" dir={isRTL ? 'rtl' : 'ltr'}>
        <PageHeader
          title={lang === 'ar' ? 'دليل النظام الشامل' : 'Comprehensive System Guide'}
          icon={<BookOpen className="h-5 w-5" />}
          actions={
            <Button onClick={handleExportPDF} className="gap-2 rounded-xl">
              <Download className="h-4 w-4" />
              {lang === 'ar' ? 'تحميل PDF' : 'Download PDF'}
            </Button>
          }
        />

        {/* Search */}
        <div className="relative mt-6">
          <Search className={`absolute ${isRTL ? 'right-4' : 'left-4'} top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground`} />
          <Input
            placeholder={lang === 'ar' ? 'ابحث في الدليل...' : 'Search the guide...'}
            value={search}
            onChange={e => setSearch(e.target.value)}
            className={`${isRTL ? 'pr-11' : 'pl-11'} h-12 rounded-2xl text-base border-border/40 focus:border-primary/40`}
          />
        </div>

        {/* Category Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-6">
          <TabsList className="flex flex-wrap h-auto gap-1 bg-muted/30 p-1 rounded-2xl">
            <TabsTrigger value="all" className="rounded-xl text-xs px-4 py-2">
              {lang === 'ar' ? 'الكل' : 'All'}
            </TabsTrigger>
            {Object.entries(categoryConfig).map(([key, config]) => (
              <TabsTrigger key={key} value={key} className="rounded-xl text-xs px-4 py-2 gap-1.5">
                <config.icon className="h-3.5 w-3.5" />
                {lang === 'ar' ? config.labelAr : config.labelEn}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value={activeTab} className="mt-6">
            {filteredSections.length === 0 ? (
              <div className="text-center py-20 text-muted-foreground">
                <HelpCircle className="h-12 w-12 mx-auto mb-4 opacity-30" />
                <p className="font-medium">{lang === 'ar' ? 'لم يتم العثور على نتائج' : 'No results found'}</p>
              </div>
            ) : (
              <Accordion type="multiple" className="space-y-3">
                {filteredSections.map((section, idx) => {
                  const catConfig = categoryConfig[section.category];
                  return (
                    <motion.div
                      key={section.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.03 }}
                    >
                      <AccordionItem value={section.id} className="border rounded-2xl overflow-hidden bg-card shadow-sm">
                        <AccordionTrigger className="px-5 py-4 hover:no-underline hover:bg-muted/30 transition-colors">
                          <div className="flex items-center gap-3 text-start">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${catConfig.color}`}>
                              <section.icon className="h-5 w-5" />
                            </div>
                            <div>
                              <h3 className="text-sm font-bold text-foreground">
                                {lang === 'ar' ? section.titleAr : section.titleEn}
                              </h3>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge variant="secondary" className="text-[10px] rounded-lg">
                                  {lang === 'ar' ? catConfig.labelAr : catConfig.labelEn}
                                </Badge>
                                <span className="text-[11px] text-muted-foreground">
                                  {section.steps.length} {lang === 'ar' ? 'خطوات' : 'steps'}
                                </span>
                              </div>
                            </div>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="px-5 pb-5">
                          <div className="space-y-4 mt-2">
                            {section.steps.map((step, i) => (
                              <div key={i} className="flex gap-3">
                                <div className="flex flex-col items-center shrink-0">
                                  <div className="w-7 h-7 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center">
                                    {i + 1}
                                  </div>
                                  {i < section.steps.length - 1 && (
                                    <div className="w-px flex-1 bg-border/60 mt-1" />
                                  )}
                                </div>
                                <div className="pb-4 min-w-0">
                                  <h4 className="text-sm font-semibold text-foreground">
                                    {lang === 'ar' ? step.titleAr : step.titleEn}
                                  </h4>
                                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                                    {lang === 'ar' ? step.descAr : step.descEn}
                                  </p>
                                </div>
                              </div>
                            ))}

                            {/* Tips */}
                            {((lang === 'ar' ? section.tipsAr : section.tipsEn)?.length ?? 0) > 0 && (
                              <Card className="border-primary/20 bg-primary/[0.03] rounded-xl">
                                <CardContent className="p-4">
                                  <div className="flex items-center gap-2 mb-2">
                                    <Lightbulb className="h-4 w-4 text-primary" />
                                    <span className="text-xs font-bold text-primary">
                                      {lang === 'ar' ? 'نصائح' : 'Tips'}
                                    </span>
                                  </div>
                                  <ul className="space-y-1.5">
                                    {(lang === 'ar' ? section.tipsAr : section.tipsEn)?.map((tip, i) => (
                                      <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                                        <CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
                                        {tip}
                                      </li>
                                    ))}
                                  </ul>
                                </CardContent>
                              </Card>
                            )}
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    </motion.div>
                  );
                })}
              </Accordion>
            )}
          </TabsContent>
        </Tabs>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-8">
          {[
            { labelAr: 'قسم في الدليل', labelEn: 'Guide Sections', value: guideSections.length, icon: Layers },
            { labelAr: 'خطوة مفصلة', labelEn: 'Detailed Steps', value: guideSections.reduce((acc, s) => acc + s.steps.length, 0), icon: FileText },
            { labelAr: 'تصنيف', labelEn: 'Categories', value: Object.keys(categoryConfig).length, icon: BookOpen },
            { labelAr: 'نصيحة مهنية', labelEn: 'Pro Tips', value: guideSections.reduce((acc, s) => acc + ((lang === 'ar' ? s.tipsAr : s.tipsEn)?.length || 0), 0), icon: Lightbulb },
          ].map((stat, i) => (
            <Card key={i} className="rounded-2xl border-border/40">
              <CardContent className="p-4 text-center">
                <stat.icon className="h-5 w-5 text-primary mx-auto mb-2" />
                <div className="text-2xl font-bold text-foreground">{stat.value}</div>
                <div className="text-[11px] text-muted-foreground">{lang === 'ar' ? stat.labelAr : stat.labelEn}</div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </PageLayout>
  );
}
