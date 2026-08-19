import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Mail, MessageSquare, Loader2, Check, Bell, Sparkles, Star } from 'lucide-react';
import { usePlanFeatures } from '@/lib/usePlanFeatures';

const invoke = (payload) => base44.functions.invoke('tenantSettings', payload).then((r) => r.data ?? r);

// Email automations are Basic+; SMS automations are Growth+. The SMS block is only
// rendered when the tenant's plan includes sms_automations, so a Basic/Foundation
// tenant never sees toggles they can't use.
const EMAIL_TOGGLES = [
  { key: 'welcome_email', label: 'Welcome email', desc: 'Sent to new members right after they register.', icon: Sparkles },
  { key: 'reminder_email', label: 'Appointment reminders (email)', desc: '24-hour and 1-hour email reminders before appointments.', icon: Bell },
  { key: 'review_request_email', label: 'Review requests (email)', desc: 'Ask customers for a review after their detail is complete.', icon: Star },
];

const SMS_TOGGLES = [
  { key: 'reminder_sms', label: 'Appointment reminders (SMS)', desc: '1-hour SMS reminder before appointments. Falls back to email when off or unavailable.', icon: MessageSquare },
  { key: 'review_request_sms', label: 'Review requests (SMS)', desc: 'Text customers a review link after their detail is complete.', icon: Star },
];

export default function AutomationsSection({ settings, onSaved }) {
  const { hasFeature } = usePlanFeatures();
  const [toggles, setToggles] = useState(() => {
    const a = settings?.automation_settings || {};
    return {
      welcome_email: a.welcome_email !== false,
      reminder_email: a.reminder_email !== false,
      review_request_email: a.review_request_email !== false,
      reminder_sms: a.reminder_sms !== false,
      review_request_sms: a.review_request_sms !== false,
    };
  });
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const save = async () => {
    setSaving(true);
    setError('');
    setSuccess(false);
    try {
      const r = await invoke({ action: 'update_automations', settings: toggles });
      if (r.success) {
        setSuccess(true);
        onSaved?.({ automation_settings: toggles });
        setTimeout(() => setSuccess(false), 3000);
      } else {
        setError(r.error || 'Failed to save.');
      }
    } catch (e) {
      setError(e.message || 'Failed to save.');
    } finally {
      setSaving(false);
    }
  };

  const ToggleRow = ({ t }) => (
    <div className="flex items-start justify-between gap-4 py-3 border-b border-vapor/5 last:border-0">
      <div className="flex items-start gap-3">
        <t.icon size={16} className="text-gold/70 mt-0.5" />
        <div>
          <p className="text-vapor text-sm font-grotesk">{t.label}</p>
          <p className="text-vapor/40 text-xs mt-0.5">{t.desc}</p>
        </div>
      </div>
      <Switch checked={toggles[t.key]} onCheckedChange={(v) => setToggles((s) => ({ ...s, [t.key]: v }))} />
    </div>
  );

  return (
    <section className="border border-vapor/10 rounded-sm bg-asphalt/30 p-6">
      <div className="flex items-center gap-2 mb-4">
        <Mail size={18} className="text-gold" />
        <h3 className="font-grotesk text-lg text-vapor">Automations</h3>
        {saving && <Loader2 size={14} className="animate-spin text-gold/60 ml-auto" />}
        {success && <span className="ml-auto text-xs text-green-400 flex items-center gap-1"><Check size={12} /> Saved</span>}
      </div>

      {error && <p className="text-red-400 text-xs mb-3">{error}</p>}

      <div className="mb-2 text-xs font-mono-tech text-gold/60 tracking-widest uppercase">Email automations</div>
      <div className="mb-6">
        {EMAIL_TOGGLES.map((t) => <ToggleRow key={t.key} t={t} />)}
      </div>

      {hasFeature('sms_automations') && (
        <>
          <div className="mb-2 text-xs font-mono-tech text-gold/60 tracking-widest uppercase">SMS automations</div>
          <div className="mb-6">
            {SMS_TOGGLES.map((t) => <ToggleRow key={t.key} t={t} />)}
          </div>
        </>
      )}

      <Button onClick={save} disabled={saving} className="bg-gold text-obsidian hover:bg-gold-light font-grotesk">
        {saving ? <Loader2 size={16} className="animate-spin" /> : 'Save Automations'}
      </Button>
    </section>
  );
}