import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, Check, Calendar, CreditCard, AlertCircle } from 'lucide-react';

export default function Step5Integrations({ data, onNext, onBack, saving, isLast }) {
  const [form, setForm] = useState(data || {});

  useEffect(() => { setForm(data || {}); }, [data]);

  return (
    <div className="space-y-6">
      <p className="text-vapor/50 text-sm">Your core integrations are ready to go. Domain, email domain, and phone number setup are handled by ERA Systems after provisioning — you'll be contacted within 24 hours.</p>

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
            <p className="text-vapor/50 text-xs mb-3">Google Calendar is connected at the platform level. Appointments will sync automatically once your account is provisioned. You can connect a different calendar later from your admin dashboard if needed.</p>
            <div className="flex items-center gap-2 text-xs font-mono-tech text-gold">
              <Check size={14} /> Connected
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 text-vapor/40 text-xs">
        <AlertCircle size={14} className="shrink-0" />
        <span>Domain, email domain, and phone number setup are handled by ERA Systems within 24 hours of provisioning.</span>
      </div>

      <div className="flex items-center justify-between pt-4">
        <Button variant="ghost" onClick={onBack} disabled={saving} className="text-vapor/60 hover:text-vapor">
          <ChevronLeft size={18} className="mr-1" /> Back
        </Button>
        <Button onClick={() => onNext(form)} disabled={saving} className="bg-gold text-obsidian hover:bg-gold-light font-grotesk font-bold">
          {saving ? 'Saving...' : 'Complete Setup'}
        </Button>
      </div>
    </div>
  );
}