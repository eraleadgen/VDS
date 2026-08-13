import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ChevronLeft, ChevronRight, Plus, Trash2 } from 'lucide-react';

const CLASSIFICATION_OPTIONS = [
  { key: 'coupe', label: 'Coupe' },
  { key: 'sedan', label: 'Sedan' },
  { key: 'hatchback', label: 'Hatchback' },
  { key: 'mid_size_suv', label: 'Mid-Size SUV' },
  { key: 'truck_3_row_suv', label: 'Truck / 3-Row SUV' },
  { key: 'other', label: 'Other' },
];

const SERVICE_CATEGORIES = ['detail', 'coating', 'correction', 'addon', 'membership', 'consultation'];

export default function Step3ServiceCatalog({ data, onNext, onBack, saving }) {
  const [form, setForm] = useState(data || {});

  useEffect(() => { setForm(data || {}); }, [data]);

  const update = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  // Classifications
  const toggleClassification = (key) => {
    const list = form.vehicle_classifications || [];
    const exists = list.find((v) => v.key === key);
    const opt = CLASSIFICATION_OPTIONS.find((o) => o.key === key);
    if (exists) {
      update('vehicle_classifications', list.filter((v) => v.key !== key));
    } else {
      update('vehicle_classifications', [...list, { key, label: opt?.label || key }]);
    }
  };

  // Pricing groups
  const updatePricingGroup = (idx, field, val) => {
    const groups = [...(form.pricing_groups || [])];
    groups[idx] = { ...groups[idx], [field]: val };
    update('pricing_groups', groups);
  };
  const addPricingGroup = () => update('pricing_groups', [...(form.pricing_groups || []), { key: '', label: '', stripe_price_id: '' }]);
  const removePricingGroup = (idx) => update('pricing_groups', (form.pricing_groups || []).filter((_, i) => i !== idx));

  // Classification → group map
  const updateMap = (clsKey, groupKey) => {
    update('classification_to_pricing_group', { ...(form.classification_to_pricing_group || {}), [clsKey]: groupKey });
  };

  // Condition multipliers
  const updateCondition = (idx, field, val) => {
    const list = [...(form.condition_multipliers || [])];
    list[idx] = { ...list[idx], [field]: val };
    update('condition_multipliers', list);
  };
  const addCondition = () => update('condition_multipliers', [...(form.condition_multipliers || []), { key: '', label: '', multiplier: 1.0, duration_add_minutes: 0 }]);
  const removeCondition = (idx) => update('condition_multipliers', (form.condition_multipliers || []).filter((_, i) => i !== idx));

  // Services
  const updateService = (idx, field, val) => {
    const list = [...(form.services || [])];
    list[idx] = { ...list[idx], [field]: val };
    update('services', list);
  };
  const addService = () => update('services', [...(form.services || []), { key: '', label: '', description: '', category: 'detail', requires_consultation: false, tiers: [] }]);
  const removeService = (idx) => update('services', (form.services || []).filter((_, i) => i !== idx));

  // Service tiers (pricing per group)
  const updateServiceTier = (svcIdx, tierIdx, field, val) => {
    const list = [...(form.services || [])];
    const tiers = [...list[svcIdx].tiers];
    tiers[tierIdx] = { ...tiers[tierIdx], [field]: val };
    list[svcIdx] = { ...list[svcIdx], tiers };
    update('services', list);
  };
  const addServiceTier = (svcIdx) => {
    const list = [...(form.services || [])];
    const tiers = [...list[svcIdx].tiers, { tier: '', price: 0, duration_minutes: 60 }];
    list[svcIdx] = { ...list[svcIdx], tiers };
    update('services', list);
  };
  const removeServiceTier = (svcIdx, tierIdx) => {
    const list = [...(form.services || [])];
    const tiers = list[svcIdx].tiers.filter((_, i) => i !== tierIdx);
    list[svcIdx] = { ...list[svcIdx], tiers };
    update('services', list);
  };

  // Memberships
  const updateMembership = (idx, field, val) => {
    const list = [...(form.membership_plans || [])];
    list[idx] = { ...list[idx], [field]: val };
    update('membership_plans', list);
  };
  const addMembership = () => update('membership_plans', [...(form.membership_plans || []), { key: '', label: '', short_label: '', benefits: [], pricing_by_group: [] }]);

  const groupKeys = (form.pricing_groups || []).map((g) => g.key).filter(Boolean);

  return (
    <div className="space-y-8">
      {/* Classifications */}
      <div>
        <Label className="text-vapor/70 text-xs font-mono-tech tracking-wider mb-2 block">VEHICLE CLASSIFICATIONS</Label>
        <p className="text-vapor/40 text-xs mb-3">Select the vehicle types you service.</p>
        <div className="flex flex-wrap gap-2">
          {CLASSIFICATION_OPTIONS.map((opt) => {
            const selected = (form.vehicle_classifications || []).some((v) => v.key === opt.key);
            return (
              <button key={opt.key} type="button" onClick={() => toggleClassification(opt.key)} className={`px-3 py-1.5 rounded-sm text-sm font-grotesk border transition-colors ${selected ? 'bg-gold/20 border-gold text-gold' : 'bg-asphalt border-vapor/15 text-vapor/50 hover:border-vapor/30'}`}>
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Pricing Groups */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <Label className="text-vapor/70 text-xs font-mono-tech tracking-wider">PRICING GROUPS</Label>
          <button type="button" onClick={addPricingGroup} className="text-gold text-xs font-mono-tech flex items-center gap-1 hover:text-gold-light"><Plus size={14} /> Add Group</button>
        </div>
        <div className="space-y-2">
          {(form.pricing_groups || []).map((g, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <Input value={g.key || ''} onChange={(e) => updatePricingGroup(idx, 'key', e.target.value.replace(/\s+/g, '_').toLowerCase())} placeholder="sedan_coupe" className="bg-asphalt border-vapor/15 text-vapor text-sm w-40" />
              <Input value={g.label || ''} onChange={(e) => updatePricingGroup(idx, 'label', e.target.value)} placeholder="Sedan/Coupe" className="bg-asphalt border-vapor/15 text-vapor text-sm flex-1" />
              <button type="button" onClick={() => removePricingGroup(idx)} className="text-vapor/30 hover:text-red-400"><Trash2 size={16} /></button>
            </div>
          ))}
        </div>
      </div>

      {/* Classification → Group Map */}
      {groupKeys.length > 0 && (form.vehicle_classifications || []).length > 0 && (
        <div>
          <Label className="text-vapor/70 text-xs font-mono-tech tracking-wider mb-2 block">CLASSIFICATION → PRICING GROUP</Label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {(form.vehicle_classifications || []).map((v) => (
              <div key={v.key} className="flex items-center gap-2">
                <span className="text-sm text-vapor w-32">{v.label}</span>
                <select value={(form.classification_to_pricing_group || {})[v.key] || ''} onChange={(e) => updateMap(v.key, e.target.value)} className="bg-asphalt border border-vapor/15 text-vapor rounded-sm px-2 py-1.5 text-sm flex-1">
                  <option value="">Select group...</option>
                  {groupKeys.map((gk) => <option key={gk} value={gk}>{gk}</option>)}
                </select>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Condition Multipliers */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <Label className="text-vapor/70 text-xs font-mono-tech tracking-wider">CONDITION MULTIPLIERS</Label>
          <button type="button" onClick={addCondition} className="text-gold text-xs font-mono-tech flex items-center gap-1 hover:text-gold-light"><Plus size={14} /> Add Condition</button>
        </div>
        <div className="space-y-2">
          {(form.condition_multipliers || []).map((c, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <Input value={c.key || ''} onChange={(e) => updateCondition(idx, 'key', e.target.value.replace(/\s+/g, '_').toLowerCase())} placeholder="light" className="bg-asphalt border-vapor/15 text-vapor text-sm w-28" />
              <Input value={c.label || ''} onChange={(e) => updateCondition(idx, 'label', e.target.value)} placeholder="Light" className="bg-asphalt border-vapor/15 text-vapor text-sm w-28" />
              <Input type="number" step="0.1" value={c.multiplier || 1} onChange={(e) => updateCondition(idx, 'multiplier', parseFloat(e.target.value))} placeholder="1.0" className="bg-asphalt border-vapor/15 text-vapor text-sm w-20" />
              <Input type="number" value={c.duration_add_minutes || 0} onChange={(e) => updateCondition(idx, 'duration_add_minutes', parseInt(e.target.value) || 0)} placeholder="+min" className="bg-asphalt border-vapor/15 text-vapor text-sm w-20" />
              <button type="button" onClick={() => removeCondition(idx)} className="text-vapor/30 hover:text-red-400"><Trash2 size={16} /></button>
            </div>
          ))}
        </div>
      </div>

      {/* Services */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <Label className="text-vapor/70 text-xs font-mono-tech tracking-wider">SERVICES & PRICING</Label>
          <button type="button" onClick={addService} className="text-gold text-xs font-mono-tech flex items-center gap-1 hover:text-gold-light"><Plus size={14} /> Add Service</button>
        </div>
        <div className="space-y-3">
          {(form.services || []).map((svc, idx) => (
            <div key={idx} className="border border-vapor/10 rounded-sm p-3 bg-asphalt/50 space-y-2">
              <div className="flex items-center gap-2">
                <Input value={svc.key || ''} onChange={(e) => updateService(idx, 'key', e.target.value.replace(/\s+/g, '_').toLowerCase())} placeholder="full_detail" className="bg-asphalt border-vapor/15 text-vapor text-sm w-40" />
                <Input value={svc.label || ''} onChange={(e) => updateService(idx, 'label', e.target.value)} placeholder="Full Detail" className="bg-asphalt border-vapor/15 text-vapor text-sm flex-1" />
                <select value={svc.category || 'detail'} onChange={(e) => updateService(idx, 'category', e.target.value)} className="bg-asphalt border border-vapor/15 text-vapor rounded-sm px-2 py-1.5 text-sm">
                  {SERVICE_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
                <label className="flex items-center gap-1 cursor-pointer text-xs text-vapor/50">
                  <input type="checkbox" checked={svc.requires_consultation || false} onChange={(e) => updateService(idx, 'requires_consultation', e.target.checked)} className="accent-gold" />
                  Consult
                </label>
                <button type="button" onClick={() => removeService(idx)} className="text-vapor/30 hover:text-red-400"><Trash2 size={16} /></button>
              </div>
              <Textarea value={svc.description || ''} onChange={(e) => updateService(idx, 'description', e.target.value)} placeholder="Service description..." className="bg-asphalt border-vapor/15 text-vapor text-sm" rows={2} />
              {/* Tiers */}
              <div className="pl-4 border-l border-vapor/10 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-vapor/50 font-mono-tech">PRICING TIERS</span>
                  <button type="button" onClick={() => addServiceTier(idx)} className="text-gold/70 text-xs flex items-center gap-1 hover:text-gold"><Plus size={12} /> Add Tier</button>
                </div>
                {(svc.tiers || []).map((t, tIdx) => (
                  <div key={tIdx} className="flex items-center gap-2">
                    <select value={t.tier || ''} onChange={(e) => updateServiceTier(idx, tIdx, 'tier', e.target.value)} className="bg-asphalt border border-vapor/15 text-vapor rounded-sm px-2 py-1 text-xs flex-1">
                      <option value="">Select group/class...</option>
                      {groupKeys.map((gk) => <option key={gk} value={gk}>{gk}</option>)}
                      {(form.vehicle_classifications || []).map((v) => <option key={v.key} value={v.key}>{v.label}</option>)}
                    </select>
                    <Input type="number" value={t.price || 0} onChange={(e) => updateServiceTier(idx, tIdx, 'price', parseFloat(e.target.value) || 0)} placeholder="Price" className="bg-asphalt border-vapor/15 text-vapor text-xs w-24" />
                    <Input type="number" value={t.duration_minutes || 60} onChange={(e) => updateServiceTier(idx, tIdx, 'duration_minutes', parseInt(e.target.value) || 60)} placeholder="Min" className="bg-asphalt border-vapor/15 text-vapor text-xs w-20" />
                    <button type="button" onClick={() => removeServiceTier(idx, tIdx)} className="text-vapor/30 hover:text-red-400"><Trash2 size={14} /></button>
                  </div>
                ))}
              </div>
            </div>
          ))}
          {(!form.services || form.services.length === 0) && <p className="text-vapor/40 text-xs text-center py-4">No services added yet. Click "Add Service" to begin.</p>}
        </div>
      </div>

      {/* Memberships */}
      <div>
        <label className="flex items-center gap-2 cursor-pointer mb-3">
          <input type="checkbox" checked={form.offer_memberships || false} onChange={(e) => update('offer_memberships', e.target.checked)} className="accent-gold w-4 h-4" />
          <span className="text-sm text-vapor font-grotesk">Offer membership plans?</span>
        </label>
        {form.offer_memberships && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-vapor/50 font-mono-tech">MEMBERSHIP PLANS</span>
              <button type="button" onClick={addMembership} className="text-gold text-xs font-mono-tech flex items-center gap-1 hover:text-gold-light"><Plus size={14} /> Add Plan</button>
            </div>
            {(form.membership_plans || []).map((m, idx) => (
              <div key={idx} className="border border-vapor/10 rounded-sm p-3 bg-asphalt/50 space-y-2">
                <div className="flex items-center gap-2">
                  <Input value={m.key || ''} onChange={(e) => updateMembership(idx, 'key', e.target.value.replace(/\s+/g, '_').toLowerCase())} placeholder="gold" className="bg-asphalt border-vapor/15 text-vapor text-sm w-28" />
                  <Input value={m.label || ''} onChange={(e) => updateMembership(idx, 'label', e.target.value)} placeholder="Gold Membership" className="bg-asphalt border-vapor/15 text-vapor text-sm flex-1" />
                  <Input value={m.short_label || ''} onChange={(e) => updateMembership(idx, 'short_label', e.target.value)} placeholder="Gold" className="bg-asphalt border-vapor/15 text-vapor text-sm w-24" />
                </div>
                <Input value={(m.benefits || []).join(', ')} onChange={(e) => updateMembership(idx, 'benefits', e.target.value.split(',').map((s) => s.trim()).filter(Boolean))} placeholder="Benefits (comma-separated)" className="bg-asphalt border-vapor/15 text-vapor text-sm" />
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between pt-4">
        <Button variant="ghost" onClick={onBack} disabled={saving} className="text-vapor/60 hover:text-vapor">
          <ChevronLeft size={18} className="mr-1" /> Back
        </Button>
        <Button onClick={() => onNext(form)} disabled={saving} className="bg-gold text-obsidian hover:bg-gold-light font-grotesk font-bold">
          {saving ? 'Saving...' : 'Next'} <ChevronRight size={18} className="ml-1" />
        </Button>
      </div>
    </div>
  );
}