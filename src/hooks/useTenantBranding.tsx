import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface TenantBranding {
  tenant_id: string | null;
  tenant_name: string;
  logo_url: string | null;
  favicon_url: string | null;
  primary_color: string;
  accent_color: string;
  plan: string;
  features: Record<string, boolean>;
  loading: boolean;
}

const defaultBranding: TenantBranding = {
  tenant_id: null,
  tenant_name: '',
  logo_url: null,
  favicon_url: null,
  primary_color: '',
  accent_color: '',
  plan: 'free',
  features: {},
  loading: true,
};

function hexToHsl(hex: string): string | null {
  if (!hex || !hex.startsWith('#')) return null;
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
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

export function useTenantBranding(): TenantBranding {
  const { user } = useAuth();
  const [branding, setBranding] = useState<TenantBranding>(defaultBranding);

  useEffect(() => {
    if (!user) {
      setBranding({ ...defaultBranding, loading: false });
      return;
    }

    const fetchTenantBranding = async () => {
      // Find tenant membership for current user
      const { data: membership } = await supabase
        .from('tenant_members')
        .select('tenant_id')
        .eq('user_id', user.id)
        .limit(1)
        .maybeSingle();

      if (!membership?.tenant_id) {
        setBranding({ ...defaultBranding, loading: false });
        return;
      }

      const { data: tenant } = await supabase
        .from('tenants')
        .select('*')
        .eq('id', membership.tenant_id)
        .eq('is_active', true)
        .maybeSingle();

      if (!tenant) {
        setBranding({ ...defaultBranding, loading: false });
        return;
      }

      const primaryHsl = hexToHsl(tenant.primary_color || '#6366f1');
      const accentHsl = hexToHsl(tenant.accent_color || '#8b5cf6');

      // Apply tenant colors to CSS variables
      if (primaryHsl) {
        document.documentElement.style.setProperty('--primary', primaryHsl);
        document.documentElement.style.setProperty('--ring', primaryHsl);
        document.documentElement.style.setProperty('--sidebar-primary', primaryHsl);
      }
      if (accentHsl) {
        document.documentElement.style.setProperty('--accent', accentHsl);
      }

      // Apply favicon
      if (tenant.favicon_url) {
        const link = document.querySelector("link[rel~='icon']") as HTMLLinkElement || document.createElement('link');
        link.rel = 'icon';
        link.href = tenant.favicon_url;
        document.head.appendChild(link);
      }

      setBranding({
        tenant_id: tenant.id,
        tenant_name: tenant.name,
        logo_url: tenant.logo_url,
        favicon_url: tenant.favicon_url,
        primary_color: tenant.primary_color || '#6366f1',
        accent_color: tenant.accent_color || '#8b5cf6',
        plan: tenant.plan,
        features: (tenant.features as Record<string, boolean>) || {},
        loading: false,
      });
    };

    fetchTenantBranding();
  }, [user]);

  return branding;
}
