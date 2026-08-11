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
        const res = await base44.functions.invoke('getBusinessConfig', {});
        if (mounted) setConfig(res?.data ?? res);
      } catch (e) {
        console.error('BusinessConfig load failed:', e?.message || e);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  // Inject brand colors as CSS variables at runtime for white-label theming.
  useEffect(() => {
    if (config?.brand_colors) {
      const root = document.documentElement;
      const bc = config.brand_colors;
      const hexToRgb = (hex) => {
        const h = (hex || '').replace('#', '');
        if (h.length !== 6) return null;
        const r = parseInt(h.slice(0, 2), 16);
        const g = parseInt(h.slice(2, 4), 16);
        const b = parseInt(h.slice(4, 6), 16);
        return `${r} ${g} ${b}`;
      };
      if (bc.primary) { const v = hexToRgb(bc.primary); if (v) root.style.setProperty('--gold', v); }
      if (bc.secondary) { const v = hexToRgb(bc.secondary); if (v) root.style.setProperty('--gold-light', v); }
      if (bc.background) { const v = hexToRgb(bc.background); if (v) root.style.setProperty('--obsidian', v); }
      if (bc.surface) { const v = hexToRgb(bc.surface); if (v) root.style.setProperty('--asphalt', v); }
      if (bc.text) { const v = hexToRgb(bc.text); if (v) root.style.setProperty('--vapor', v); }
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