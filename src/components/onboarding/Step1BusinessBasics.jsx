import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ChevronLeft, ChevronRight, Plus, Trash2 } from 'lucide-react';

const DAYS = [
  { key: 'mon', label: 'Monday' },
  { key: 'tue', label: 'Tuesday' },
  { key: 'wed', label: 'Wednesday' },
  { key: 'thu', label: 'Thursday' },
  { key: 'fri', label: 'Friday' },
  { key: 'sat', label: 'Saturday' },
  { key: 'sun', label: 'Sunday' },
];

const TIMEZONES = ['America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles', 'America/Anchorage', 'Pacific/Hawaii'];

export default function Step1BusinessBasics({ data, onNext, onBack, saving, isFirst }) {
  const [form, setForm] = useState(data || {});

  useEffect(() => { setForm(data || {}); }, [data]);

  const update = (key, val) => setForm((f) => ({ ...f, [key]: val }));
  const updateHours = (dayKey, field, val) => {
    const hours = [...(form.business_hours || [])];
    const idx = hours.findIndex((h) => h.day === dayKey);
    if (idx >= 0) hours[idx] = { ...hours[idx], [field]: val };
    else hours.push({ day: dayKey, [field]: val, closed: false });
    update('business_hours', hours);
  };
  const toggleArea = (area) => {
    const areas = form.service_areas || [];
    update('service_areas', areas.includes(area) ? areas.filter((a) => a !== area) : [...areas, area]);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label className="text-vapor/70 text-xs font-mono-tech tracking-wider">LEGAL ENTITY NAME *</Label>
          <Input value={form.legal_name || ''} onChange={(e) => update('legal_name', e.target.value)} placeholder="Bob's Auto Spa LLC" className="bg-asphalt border-vapor/15 text-vapor mt-1.5" />
        </div>
        <div>
          <Label className="text-vapor/70 text-xs font-mono-tech tracking-wider">DBA / BRAND NAME *</Label>
          <Input value={form.business_name || ''} onChange={(e) => update('business_name', e.target.value)} placeholder="Bob's Auto Spa" className="bg-asphalt border-vapor/15 text-vapor mt-1.5" />
        </div>
        <div>
          <Label className="text-vapor/70 text-xs font-mono-tech tracking-wider">BUSINESS PHONE *</Label>
          <Input value={form.business_phone || ''} onChange={(e) => update('business_phone', e.target.value)} placeholder="(555) 123-4567" className="bg-asphalt border-vapor/15 text-vapor mt-1.5" />
        </div>
        <div>
          <Label className="text-vapor/70 text-xs font-mono-tech tracking-wider">BUSINESS EMAIL *</Label>
          <Input type="email" value={form.business_email || ''} onChange={(e) => update('business_email', e.target.value)} placeholder="info@bobsautospa.com" className="bg-asphalt border-vapor/15 text-vapor mt-1.5" />
        </div>
      </div>

      <div>
        <Label className="text-vapor/70 text-xs font-mono-tech tracking-wider">BUSINESS EIN *</Label>
        <Input value={form.business_ein || ''} onChange={(e) => update('business_ein', e.target.value)} placeholder="12-3456789" className="bg-asphalt border-vapor/15 text-vapor mt-1.5" />
        <p className="text-vapor/40 text-xs mt-1">Required for account verification and website setup.</p>
      </div>

      <div>
        <Label className="text-vapor/70 text-xs font-mono-tech tracking-wider">DISPLAY ADDRESS</Label>
        <Input value={form.business_address || ''} onChange={(e) => update('business_address', e.target.value)} placeholder="Metro Atlanta, GA" className="bg-asphalt border-vapor/15 text-vapor mt-1.5" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <Label className="text-vapor/70 text-xs font-mono-tech tracking-wider">CITY</Label>
          <Input value={form.address_locality || ''} onChange={(e) => update('address_locality', e.target.value)} placeholder="Alpharetta" className="bg-asphalt border-vapor/15 text-vapor mt-1.5" />
        </div>
        <div>
          <Label className="text-vapor/70 text-xs font-mono-tech tracking-wider">STATE</Label>
          <Input value={form.address_region || ''} onChange={(e) => update('address_region', e.target.value)} placeholder="GA" className="bg-asphalt border-vapor/15 text-vapor mt-1.5" />
        </div>
        <div>
          <Label className="text-vapor/70 text-xs font-mono-tech tracking-wider">LEGAL JURISDICTION</Label>
          <Input value={form.legal_jurisdiction || ''} onChange={(e) => update('legal_jurisdiction', e.target.value)} placeholder="Georgia" className="bg-asphalt border-vapor/15 text-vapor mt-1.5" />
        </div>
      </div>

      <div>
        <Label className="text-vapor/70 text-xs font-mono-tech tracking-wider">SERVICE AREAS</Label>
        <p className="text-vapor/40 text-xs mb-2">Enter each area or county you serve, separated by commas.</p>
        <Input
          value={(form.service_areas || []).join(', ')}
          onChange={(e) => update('service_areas', e.target.value.split(',').map((s) => s.trim()).filter(Boolean))}
          placeholder="Fulton County, Cobb County, Dekalb County"
          className="bg-asphalt border-vapor/15 text-vapor mt-1.5"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label className="text-vapor/70 text-xs font-mono-tech tracking-wider">TIMEZONE</Label>
          <select value={form.timezone || 'America/New_York'} onChange={(e) => update('timezone', e.target.value)} className="w-full bg-asphalt border border-vapor/15 text-vapor rounded-sm px-3 py-2 mt-1.5 text-sm">
            {TIMEZONES.map((tz) => <option key={tz} value={tz}>{tz.replace('America/', '').replace('_', ' ')}</option>)}
          </select>
        </div>
        <div>
          <Label className="text-vapor/70 text-xs font-mono-tech tracking-wider">CURRENCY</Label>
          <select value={form.currency || 'USD'} onChange={(e) => update('currency', e.target.value)} className="w-full bg-asphalt border border-vapor/15 text-vapor rounded-sm px-3 py-2 mt-1.5 text-sm">
            <option value="USD">USD ($)</option>
            <option value="EUR">EUR (€)</option>
            <option value="GBP">GBP (£)</option>
            <option value="CAD">CAD ($)</option>
          </select>
        </div>
      </div>

      <div>
        <Label className="text-vapor/70 text-xs font-mono-tech tracking-wider mb-3 block">BUSINESS HOURS</Label>
        <div className="space-y-2">
          {DAYS.map((day) => {
            const hours = (form.business_hours || []).find((h) => h.day === day.key) || { day: day.key, open: '09:00', close: '17:00', closed: false };
            return (
              <div key={day.key} className="flex items-center gap-3 py-2 border-b border-vapor/5">
                <span className="text-sm text-vapor font-grotesk w-24">{day.label}</span>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={!hours.closed} onChange={(e) => updateHours(day.key, 'closed', !e.target.checked)} className="accent-gold" />
                  <span className="text-xs text-vapor/50 font-mono-tech">Open</span>
                </label>
                {!hours.closed && (
                  <>
                    <Input type="time" value={hours.open || '09:00'} onChange={(e) => updateHours(day.key, 'open', e.target.value)} className="bg-asphalt border-vapor/15 text-vapor w-32 text-sm" />
                    <span className="text-vapor/40 text-xs">to</span>
                    <Input type="time" value={hours.close || '17:00'} onChange={(e) => updateHours(day.key, 'close', e.target.value)} className="bg-asphalt border-vapor/15 text-vapor w-32 text-sm" />
                  </>
                )}
                {hours.closed && <span className="text-vapor/40 text-xs font-mono-tech">Closed</span>}
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex items-center justify-between pt-4">
        <Button variant="ghost" onClick={onBack} disabled={isFirst || saving} className="text-vapor/60 hover:text-vapor">
          <ChevronLeft size={18} className="mr-1" /> Back
        </Button>
        <Button onClick={() => onNext(form)} disabled={saving || !form.legal_name || !form.business_name || !form.business_phone || !form.business_email || !form.business_ein} className="bg-gold text-obsidian hover:bg-gold-light font-grotesk font-bold">
          {saving ? 'Saving...' : 'Next'} <ChevronRight size={18} className="ml-1" />
        </Button>
      </div>
    </div>
  );
}