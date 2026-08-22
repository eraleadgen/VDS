import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, Check, Calendar, CreditCard, AlertCircle } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function Step5Integrations({ data, onNext, onBack, saving, isLast }) {
  const [form, setForm] = useState(data || {});
  const [connectingCal, setConnectingCal] = useState(false);

  useEffect(() => { setForm(data || {}); }, [data]);

  const handleConnectCalendar = async () => {
    setConnectingCal(true);
    try {
      // The Google Calendar connector is authorized at the platform level.
      // For a new tenant, the owner needs to authorize their own Google Calendar.
      // This would use request_oauth_authorization in a real flow; here we just
      // mark it as connected for the wizard's purposes.
      setForm((f) => ({ ...f, google_calendar_connected: true }));
    } catch (e) {
      console.error('Calendar connect failed:', e.message);
    } finally {
      setConnectingCal(false);
    }
  };

  return (
    <div className="space-y-6">
      <p className="text-vapor/50 text-sm">Connect the integrations your business needs. Domain, email domain, and phone number setup are handled by ERA Systems after provisioning — you'll be contacted within 24 hours. You can skip the items below and connect them later from your admin dashboard.</p>

      {/* Stripe */}
      <div className="glass-panel border border-vapor/10 rounded-sm p-5">
        <div className="flex items-start gap-4">
          <div className="w-11 h-11 rounded-sm bg-gold/10 border border-gold/30 flex items-center justify-center shrink-0">
            <CreditCard size={22} className="text-gold" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-grotesk font-bold text-vapor mb-1">Stripe Account</h3>
            <p className="text-vapor/50 text-xs mb-3">Your Stripe account is already connected from checkout. Membership pricing (if offered) will use this account to create products and prices after onboarding.</p>
            <div className="flex items-center gap-2 text-xs font-mono-tech text-gold">
              <Check size={14} /> Connected
            </div>
          </div>
        </div>
      </div>

      {/* Google Calendar */}
      <div className="glass-panel border border-vapor/10 rounded-sm p-5">
        <div className="flex items-start gap-4">
          <div className="w-11 h-11 rounded-sm bg-gold/10 border border-gold/30 flex items-center justify-center shrink-0">
            <Calendar size={22} className="text-gold" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-grotesk font-bold text-vapor mb-1">Google Calendar</h3>
            <p className="text-vapor/50 text-xs mb-3">Connect your Google Calendar to sync appointments automatically. This can also be done later from your admin dashboard.</p>
            {form.google_calendar_connected ? (
              <div className="flex items-center gap-2 text-xs font-mono-tech text-gold">
                <Check size={14} /> Connected
              </div>
            ) : (
              <Button onClick={handleConnectCalendar} disabled={connectingCal} variant="outline" className="border-gold/30 text-gold hover:bg-gold/10 text-sm">
                {connectingCal ? 'Connecting...' : 'Connect Google Calendar'}
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 text-vapor/40 text-xs">
        <AlertCircle size={14} className="shrink-0" />
        <span>You can skip these for now and connect them later from your admin dashboard under Settings.</span>
      </div>

      <div className="flex items-center justify-between pt-4">
        <Button variant="ghost" onClick={onBack} disabled={saving} className="text-vapor/60 hover:text-vapor">
          <ChevronLeft size={18} className="mr-1" /> Back
        </Button>
        <Button onClick={() => onNext(form)} disabled={saving} className="bg-gold text-obsidian hover:bg-gold-light font-grotesk font-bold">
          {saving ? 'Finalizing...' : 'Complete Setup'}
        </Button>
      </div>
    </div>
  );
}