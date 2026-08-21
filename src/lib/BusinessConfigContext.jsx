import { createContext, useContext, useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';

// App-wide active BusinessConfig. Loaded once at the root via getBusinessConfig
// (public endpoint, no auth needed) so every component can read business identity,
// dictionary, concierge, and catalog without re-fetching. Defaults keep the VDS
// automotive voice while the config loads (or if a field is unset), so components
// can call the hooks unconditionally without null-checking every render.

const BusinessConfigContext = createContext(null);

const DEFAULT_DICT = {
  item_noun: 'Vehicle',
  item_plural: 'Vehicles',
  item_category_noun: 'Classification',
  item_category_label: 'Vehicle Classification',
  service_noun: 'Detail',
  service_verb: 'detail',
  service_area_noun: 'Service Area',
  before_photo_label: 'Before',
  after_photo_label: 'After',
  appointment_noun: 'Appointment',
};

const DEFAULT_CONCIERGE = { name: 'Valerie' };

export function BusinessConfigProvider({ children }) {
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        // Dev/preview: ?tenant=era_systems overrides hostname resolution so ERA pages
        // can be previewed on the shared Base44 preview domain. In production,
        // eraleadgen.com resolves via TenantMapping automatically.
        const urlParams = new URLSearchParams(window.location.search);
        const tenant = urlParams.get('tenant') || '';
        const res = await base44.functions.invoke('getBusinessConfig', { tenant });
        if (mounted) setConfig(res?.data ?? res);
      } catch (e) {
        console.error('BusinessConfig load failed:', e?.message || e);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  // Design preview: when this page is loaded inside the admin Website Designer
  // iframe (?design_preview=1), accept an override config posted from the parent
  // so the preview reflects staged (unpublished) changes without writing to the DB.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('design_preview') !== '1') return;
    window.parent?.postMessage({ type: 'designPreviewReady' }, '*');
    const handler = (e) => {
      if (e.data?.type === 'designPreviewConfig' && e.data.config) {
        setConfig(e.data.config);
      }
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, []);

  // Inject brand colors as CSS variables at runtime for white-label theming.
  // Drives BOTH the custom RGB tokens (--gold, --obsidian, etc. used by VDS components)
  // AND the HSL semantic tokens (--primary, --background, etc. used by shadcn/AuthLayout)
  // so every component picks up the tenant's theme automatically.
  useEffect(() => {
    if (!config?.brand_colors) return;
    const root = document.documentElement;
    const bc = config.brand_colors;

    const hexToRgb = (hex) => {
      const h = (hex || '').replace('#', '');
      if (h.length !== 6) return null;
      return `${parseInt(h.slice(0, 2), 16)} ${parseInt(h.slice(2, 4), 16)} ${parseInt(h.slice(4, 6), 16)}`;
    };

    const hexToHsl = (hex) => {
      const h = (hex || '').replace('#', '');
      if (h.length !== 6) return null;
      let r = parseInt(h.slice(0, 2), 16) / 255;
      let g = parseInt(h.slice(2, 4), 16) / 255;
      let b = parseInt(h.slice(4, 6), 16) / 255;
      const max = Math.max(r, g, b), min = Math.min(r, g, b);
      let hue = 0, sat = 0;
      const light = (max + min) / 2;
      if (max !== min) {
        const d = max - min;
        sat = light > 0.5 ? d / (2 - max - min) : d / (max + min);
        if (max === r) hue = ((g - b) / d + (g < b ? 6 : 0));
        else if (max === g) hue = ((b - r) / d + 2);
        else hue = ((r - g) / d + 4);
        hue *= 60;
      }
      return `${Math.round(hue)} ${Math.round(sat * 100)}% ${Math.round(light * 100)}%`;
    };

    const darken = (hslStr, amt) => {
      const p = hslStr.split(' ');
      return `${p[0]} ${p[1]} ${Math.max(0, parseInt(p[2]) - amt)}%`;
    };

    // Custom RGB tokens (VDS components: bg-obsidian, text-gold, etc.)
    if (bc.primary) {
      const v = hexToRgb(bc.primary);
      if (v) {
        root.style.setProperty('--gold', v);
        // Dark variant for gradient stops (65% of each channel)
        const parts = v.split(' ');
        root.style.setProperty('--gold-dark', parts.map((p) => Math.round(parseInt(p) * 0.65)).join(' '));
      }
    }
    if (bc.secondary) { const v = hexToRgb(bc.secondary); if (v) root.style.setProperty('--gold-light', v); }
    if (bc.background) { const v = hexToRgb(bc.background); if (v) root.style.setProperty('--obsidian', v); }
    if (bc.surface) { const v = hexToRgb(bc.surface); if (v) root.style.setProperty('--asphalt', v); }
    if (bc.text) { const v = hexToRgb(bc.text); if (v) root.style.setProperty('--vapor', v); }

    // HSL semantic tokens (shadcn / AuthLayout / ERA pages: bg-background, text-primary, etc.)
    const bgHsl = bc.background ? hexToHsl(bc.background) : null;
    const surfHsl = bc.surface ? hexToHsl(bc.surface) : null;
    const textHsl = bc.text ? hexToHsl(bc.text) : null;
    const priHsl = bc.primary ? hexToHsl(bc.primary) : null;

    if (priHsl) {
      root.style.setProperty('--primary', priHsl);
      root.style.setProperty('--ring', priHsl);
      root.style.setProperty('--accent', priHsl);
    }
    if (bgHsl) root.style.setProperty('--background', bgHsl);
    if (surfHsl) {
      root.style.setProperty('--card', surfHsl);
      root.style.setProperty('--popover', surfHsl);
      root.style.setProperty('--secondary', surfHsl);
      root.style.setProperty('--muted', surfHsl);
      root.style.setProperty('--border', darken(surfHsl, 5));
      root.style.setProperty('--input', darken(surfHsl, 5));
    }
    if (textHsl) {
      root.style.setProperty('--foreground', textHsl);
      root.style.setProperty('--card-foreground', textHsl);
      root.style.setProperty('--popover-foreground', textHsl);
      root.style.setProperty('--secondary-foreground', textHsl);
      root.style.setProperty('--muted-foreground', textHsl);
    }
    // primary-foreground / accent-foreground: dark (background) for contrast on light primary
    if (bgHsl) {
      root.style.setProperty('--primary-foreground', bgHsl);
      root.style.setProperty('--accent-foreground', bgHsl);
    }
  }, [config]);

  return (
    <BusinessConfigContext.Provider value={{ config, loading }}>
      {children}
    </BusinessConfigContext.Provider>
  );
}

export function useBusinessConfig() {
  const ctx = useContext(BusinessConfigContext);
  return ctx?.config ?? null;
}

export function useBusinessConfigLoading() {
  const ctx = useContext(BusinessConfigContext);
  return ctx?.loading ?? true;
}

// Domain vocabulary merged over defaults — always returns a complete dictionary.
export function useDictionary() {
  const ctx = useContext(BusinessConfigContext);
  return { ...DEFAULT_DICT, ...(ctx?.config?.dictionary || {}) };
}

export function useConcierge() {
  const ctx = useContext(BusinessConfigContext);
  return { ...DEFAULT_CONCIERGE, ...(ctx?.config?.concierge || {}) };
}

// Convenience: the active business name, with a fallback so titles render before
// the config resolves.
export function useBusinessName() {
  const ctx = useContext(BusinessConfigContext);
  return ctx?.config?.business_name || 'Valet Detailing Service';
}

// The first (primary) membership plan, with safe fallbacks so components can read
// label / short_label / benefits / pricing_by_group before the config resolves.
export function useMembershipPlan() {
  const ctx = useContext(BusinessConfigContext);
  const plan = ctx?.config?.membership_plans?.[0];
  const fallback = { label: 'VDS Gold Membership', short_label: 'VDS Gold', benefits: [], pricing_by_group: [] };
  if (!plan) return fallback;
  return {
    ...fallback,
    ...plan,
    short_label: plan.short_label || plan.label || fallback.short_label,
  };
}