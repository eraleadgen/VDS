import { Button } from '@/components/ui/button';
import { ChevronLeft, Check, CreditCard, Calendar, Building2, Palette, Briefcase, Users, Plug } from 'lucide-react';

const DAY_LABELS = { mon: 'Mon', tue: 'Tue', wed: 'Wed', thu: 'Thu', fri: 'Fri', sat: 'Sat', sun: 'Sun' };

function Row({ label, value }) {
  if (!value && value !== 0) return null;
  return (
    <div className="flex justify-between gap-4 py-1.5 border-b border-vapor/5">
      <span className="text-vapor/40 text-xs font-mono-tech tracking-wider shrink-0">{label}</span>
      <span className="text-vapor text-sm text-right">{value}</span>
    </div>
  );
}

function Section({ icon: Icon, title, children }) {
  return (
    <div className="glass-panel border border-vapor/10 rounded-sm p-5">
      <div className="flex items-center gap-2 mb-3">
        <Icon size={16} className="text-gold" />
        <h3 className="text-sm font-grotesk font-bold text-vapor">{title}</h3>
      </div>
      <div className="space-y-0">{children}</div>
    </div>
  );
}

export default function OnboardingReview({ wizardData, planTier, onConfirm, onBack, saving }) {
  const s1 = wizardData.business_basics || {};
  const s2 = wizardData.branding || {};
  const s3 = wizardData.service_catalog || {};
  const s4 = wizardData.team_scheduling || {};
  const s5 = wizardData.integrations || {};

  const hoursStr = (s1.business_hours || [])
    .filter((h) => !h.closed)
    .map((h) => `${DAY_LABELS[h.day] || h.day} ${h.open}-${h.close}`)
    .join(', ') || 'Not set';

  const services = (s3.services || []).filter((s) => s.label);
  const classifications = (s3.vehicle_classifications || []).map((v) => v.label).join(', ');
  const pricingGroups = (s3.pricing_groups || []).map((g) => g.label).filter(Boolean).join(', ');
  const memberships = (s3.membership_plans || []).filter((m) => m.label).map((m) => m.label).join(', ');

  const team = s4.specialists || s4.technicians || [];
  const teamLabel = planTier === 'foundation' ? 'Specialists' : 'Technicians';
  const teamStr = team.filter((t) => t.name).map((t) => t.name).join(', ');

  const rules = s4.scheduling_rules || {};

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-mono-tech tracking-widest text-gold/60 mb-1">REVIEW & CONFIRM</p>
        <h1 className="text-2xl font-grotesk font-bold text-vapor">Business Setup Overview</h1>
        <p className="text-vapor/50 text-sm mt-2">Review everything below. Once confirmed, you'll proceed to payment to activate your account.</p>
      </div>

      <Section icon={Building2} title="Business Basics">
        <Row label="LEGAL NAME" value={s1.legal_name} />
        <Row label="DBA / BRAND" value={s1.business_name} />
        <Row label="PHONE" value={s1.business_phone} />
        <Row label="EMAIL" value={s1.business_email} />
        <Row label="EIN" value={s1.business_ein} />
        <Row label="ADDRESS" value={s1.business_address} />
        <Row label="CITY" value={s1.address_locality} />
        <Row label="STATE" value={s1.address_region} />
        <Row label="JURISDICTION" value={s1.legal_jurisdiction} />
        <Row label="SERVICE CITIES" value={(s1.service_areas || []).join(', ')} />
        <Row label="TIMEZONE" value={s1.timezone} />
        <Row label="CURRENCY" value={s1.currency} />
        <Row label="HOURS" value={hoursStr} />
      </Section>

      <Section icon={Palette} title="Branding">
        <div className="flex items-center gap-4 py-2">
          {s2.logo_url ? (
            <img src={s2.logo_url} alt="Logo" className="w-16 h-16 object-contain rounded-sm border border-vapor/15 bg-asphalt" />
          ) : (
            <div className="w-16 h-16 rounded-sm border border-vapor/15 bg-asphalt flex items-center justify-center text-vapor/30 text-xs">No logo</div>
          )}
          <div className="flex-1">
            <Row label="TAGLINE" value={s2.tagline} />
            <Row label="SHORT NAME" value={s2.business_short_name} />
          </div>
        </div>
        {(s2.brand_colors && Object.keys(s2.brand_colors).length > 0) && (
          <div className="flex items-center gap-2 py-2">
            <span className="text-vapor/40 text-xs font-mono-tech tracking-wider">COLORS</span>
            {Object.entries(s2.brand_colors).filter(([, v]) => v).map(([k, v]) => (
              <div key={k} className="flex items-center gap-1">
                <div className="w-4 h-4 rounded-sm border border-vapor/20" style={{ background: v }} />
                <span className="text-vapor/50 text-xs">{k}</span>
              </div>
            ))}
          </div>
        )}
      </Section>

      <Section icon={Briefcase} title="Service Catalog">
        <Row label="CLASSIFICATIONS" value={classifications} />
        <Row label="PRICING GROUPS" value={pricingGroups} />
        <Row label="SERVICES" value={services.length ? `${services.length} service${services.length !== 1 ? 's' : ''}: ${services.map((s) => s.label).join(', ')}` : 'None'} />
        <Row label="MEMBERSHIPS" value={memberships || 'None'} />
        <Row label="CONDITION MULTIPLIERS" value={(s3.condition_multipliers || []).length ? `${s3.condition_multipliers.length} configured` : 'None'} />
      </Section>

      <Section icon={Users} title="Team & Scheduling">
        <Row label={teamLabel.toUpperCase()} value={teamStr || 'None added'} />
        <Row label="BOOKING BUFFER" value={rules.booking_buffer_hours ? `${rules.booking_buffer_hours} hrs` : null} />
        <Row label="MIN NOTICE" value={rules.min_notice_hours ? `${rules.min_notice_hours} hrs` : null} />
        <Row label="CANCELLATION" value={rules.cancellation_hours ? `${rules.cancellation_hours} hrs` : null} />
        <Row label="SLOT INTERVAL" value={rules.slot_interval_minutes ? `${rules.slot_interval_minutes} min` : null} />
        <Row label="MAX/DAY" value={rules.max_bookings_per_day || null} />
      </Section>

      <Section icon={Plug} title="Integrations">
        <div className="flex items-center gap-2 py-1.5">
          <CreditCard size={14} className="text-gold" />
          <span className="text-vapor text-sm">Stripe</span>
          <span className="ml-auto flex items-center gap-1 text-xs font-mono-tech text-gold"><Check size={12} /> Connected</span>
        </div>
        <div className="flex items-center gap-2 py-1.5">
          <Calendar size={14} className="text-gold" />
          <span className="text-vapor text-sm">Google Calendar</span>
          <span className="ml-auto flex items-center gap-1 text-xs font-mono-tech text-gold"><Check size={12} /> Connected</span>
        </div>
      </Section>

      <div className="flex items-center justify-between pt-4">
        <Button variant="ghost" onClick={onBack} disabled={saving} className="text-vapor/60 hover:text-vapor">
          <ChevronLeft size={18} className="mr-1" /> Back
        </Button>
        <Button onClick={onConfirm} disabled={saving} className="bg-gold text-obsidian hover:bg-gold-light font-grotesk font-bold">
          {saving ? 'Processing...' : 'Confirm Setup & Continue to Payment'}
        </Button>
      </div>
    </div>
  );
}