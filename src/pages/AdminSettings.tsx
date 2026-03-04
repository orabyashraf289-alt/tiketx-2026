import { useState, useEffect } from 'react';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Settings, Palette, Type, Image, Save, RotateCcw } from 'lucide-react';
import { motion } from 'framer-motion';

interface SystemSettings {
  system_name: string;
  system_subtitle: string;
  primary_color: string;
  accent_color: string;
  logo_url: string;
}

const defaultSettings: SystemSettings = {
  system_name: 'TicketFlow',
  system_subtitle: 'HELPDESK',
  primary_color: '217 72% 50%',
  accent_color: '217 72% 55%',
  logo_url: '',
};

const presetThemes = [
  { name: 'أزرق كحلي (افتراضي)', primary: '217 72% 50%', accent: '217 72% 55%' },
  { name: 'أخضر زمردي', primary: '152 55% 42%', accent: '152 55% 48%' },
  { name: 'بنفسجي ملكي', primary: '262 60% 50%', accent: '262 60% 56%' },
  { name: 'برتقالي دافئ', primary: '24 80% 50%', accent: '24 80% 56%' },
  { name: 'أحمر عنابي', primary: '345 60% 42%', accent: '345 60% 48%' },
  { name: 'تركوازي', primary: '180 55% 42%', accent: '180 55% 48%' },
];

function hslToHex(hsl: string): string {
  const parts = hsl.split(' ');
  if (parts.length !== 3) return '#3b82f6';
  const h = parseFloat(parts[0]);
  const s = parseFloat(parts[1]) / 100;
  const l = parseFloat(parts[2]) / 100;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color).toString(16).padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

function hexToHsl(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) * 60; break;
      case g: h = ((b - r) / d + 2) * 60; break;
      case b: h = ((r - g) / d + 4) * 60; break;
    }
  }
  return `${Math.round(h)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

export default function AdminSettings() {
  const [settings, setSettings] = useState<SystemSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    const { data } = await supabase.from('system_settings').select('key, value');
    if (data) {
      const s = { ...defaultSettings };
      data.forEach((row: any) => {
        if (row.key in s) (s as any)[row.key] = row.value || (defaultSettings as any)[row.key];
      });
      setSettings(s);
    }
    setLoading(false);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const entries = Object.entries(settings);
      for (const [key, value] of entries) {
        await supabase
          .from('system_settings')
          .update({ value: value || null, updated_at: new Date().toISOString() })
          .eq('key', key);
      }

      // Apply theme colors live
      const root = document.documentElement;
      root.style.setProperty('--primary', settings.primary_color);
      root.style.setProperty('--accent', settings.accent_color);
      root.style.setProperty('--ring', settings.primary_color);
      root.style.setProperty('--sidebar-primary', settings.primary_color);
      root.style.setProperty('--sidebar-ring', settings.primary_color);

      toast.success('تم حفظ الإعدادات بنجاح');
    } catch {
      toast.error('حدث خطأ أثناء الحفظ');
    }
    setSaving(false);
  };

  const handleReset = () => {
    setSettings(defaultSettings);
    const root = document.documentElement;
    root.style.removeProperty('--primary');
    root.style.removeProperty('--accent');
    root.style.removeProperty('--ring');
    root.style.removeProperty('--sidebar-primary');
    root.style.removeProperty('--sidebar-ring');
    toast.info('تم إعادة ضبط الإعدادات الافتراضية');
  };

  const applyPreset = (primary: string, accent: string) => {
    setSettings(prev => ({ ...prev, primary_color: primary, accent_color: accent }));
    const root = document.documentElement;
    root.style.setProperty('--primary', primary);
    root.style.setProperty('--accent', accent);
    root.style.setProperty('--ring', primary);
    root.style.setProperty('--sidebar-primary', primary);
    root.style.setProperty('--sidebar-ring', primary);
  };

  if (loading) return null;

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        <main className="flex-1 p-6 overflow-auto">
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="max-w-3xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                  <Settings className="h-6 w-6 text-primary" />
                  إعدادات النظام
                </h1>
                <p className="text-sm text-muted-foreground mt-1">تخصيص اسم النظام والشعار وألوان الثيم</p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleReset} size="sm">
                  <RotateCcw className="h-4 w-4 ml-1" />
                  إعادة ضبط
                </Button>
                <Button onClick={handleSave} disabled={saving} size="sm">
                  <Save className="h-4 w-4 ml-1" />
                  {saving ? 'جاري الحفظ...' : 'حفظ'}
                </Button>
              </div>
            </div>

            {/* System Identity */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Type className="h-5 w-5 text-primary" />
                  هوية النظام
                </CardTitle>
                <CardDescription>تخصيص اسم النظام والعنوان الفرعي</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>اسم النظام</Label>
                    <Input
                      value={settings.system_name}
                      onChange={e => setSettings(prev => ({ ...prev, system_name: e.target.value }))}
                      placeholder="مثال: TicketFlow"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>العنوان الفرعي</Label>
                    <Input
                      value={settings.system_subtitle}
                      onChange={e => setSettings(prev => ({ ...prev, system_subtitle: e.target.value }))}
                      placeholder="مثال: HELPDESK"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Logo */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Image className="h-5 w-5 text-primary" />
                  الشعار
                </CardTitle>
                <CardDescription>رابط صورة الشعار (يفضل PNG شفاف)</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>رابط الشعار (URL)</Label>
                  <Input
                    value={settings.logo_url}
                    onChange={e => setSettings(prev => ({ ...prev, logo_url: e.target.value }))}
                    placeholder="https://example.com/logo.png"
                    dir="ltr"
                  />
                </div>
                {settings.logo_url && (
                  <div className="flex items-center gap-4 p-4 bg-muted rounded-lg">
                    <span className="text-sm text-muted-foreground">معاينة:</span>
                    <img src={settings.logo_url} alt="Logo preview" className="h-12 w-12 object-contain rounded" />
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Theme Colors */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Palette className="h-5 w-5 text-primary" />
                  ألوان الثيم
                </CardTitle>
                <CardDescription>اختر من القوالب الجاهزة أو خصص الألوان يدوياً</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Presets */}
                <div>
                  <Label className="mb-3 block">قوالب جاهزة</Label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {presetThemes.map(theme => (
                      <button
                        key={theme.name}
                        onClick={() => applyPreset(theme.primary, theme.accent)}
                        className={`flex items-center gap-3 p-3 rounded-lg border transition-all hover:shadow-md ${
                          settings.primary_color === theme.primary
                            ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                            : 'border-border hover:border-primary/40'
                        }`}
                      >
                        <div
                          className="h-8 w-8 rounded-full shrink-0 shadow-sm"
                          style={{ background: `hsl(${theme.primary})` }}
                        />
                        <span className="text-sm font-medium text-foreground">{theme.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Custom Colors */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>اللون الأساسي (Primary)</Label>
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={hslToHex(settings.primary_color)}
                        onChange={e => {
                          const hsl = hexToHsl(e.target.value);
                          setSettings(prev => ({ ...prev, primary_color: hsl }));
                          document.documentElement.style.setProperty('--primary', hsl);
                          document.documentElement.style.setProperty('--ring', hsl);
                          document.documentElement.style.setProperty('--sidebar-primary', hsl);
                        }}
                        className="h-10 w-14 rounded cursor-pointer border border-border"
                      />
                      <Input
                        value={settings.primary_color}
                        onChange={e => setSettings(prev => ({ ...prev, primary_color: e.target.value }))}
                        className="font-mono text-xs"
                        dir="ltr"
                        placeholder="217 72% 50%"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>لون التمييز (Accent)</Label>
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={hslToHex(settings.accent_color)}
                        onChange={e => {
                          const hsl = hexToHsl(e.target.value);
                          setSettings(prev => ({ ...prev, accent_color: hsl }));
                          document.documentElement.style.setProperty('--accent', hsl);
                          document.documentElement.style.setProperty('--sidebar-ring', hsl);
                        }}
                        className="h-10 w-14 rounded cursor-pointer border border-border"
                      />
                      <Input
                        value={settings.accent_color}
                        onChange={e => setSettings(prev => ({ ...prev, accent_color: e.target.value }))}
                        className="font-mono text-xs"
                        dir="ltr"
                        placeholder="217 72% 55%"
                      />
                    </div>
                  </div>
                </div>

                {/* Live Preview */}
                <div className="p-4 bg-muted rounded-lg space-y-3">
                  <Label className="text-muted-foreground">معاينة مباشرة</Label>
                  <div className="flex flex-wrap gap-3">
                    <Button size="sm">زر أساسي</Button>
                    <Button size="sm" variant="secondary">زر ثانوي</Button>
                    <Button size="sm" variant="outline">زر محدد</Button>
                    <Button size="sm" variant="destructive">زر حذف</Button>
                  </div>
                  <div className="flex gap-2">
                    <div className="h-8 w-8 rounded" style={{ background: `hsl(${settings.primary_color})` }} />
                    <div className="h-8 w-8 rounded" style={{ background: `hsl(${settings.accent_color})` }} />
                    <div className="h-8 flex-1 rounded bg-card border border-border" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </main>
      </div>
    </SidebarProvider>
  );
}
