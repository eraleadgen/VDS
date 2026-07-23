import { Star, Users, TrendingUp, DollarSign, Sparkles } from 'lucide-react';
import PartnerReferrals from '@/components/partner/PartnerReferrals';

function Stat({ icon: Icon, label, value }) {
  return (
    <div className="glass-panel border border-vapor/10 rounded-sm p-4">
      <Icon size={18} className="text-gold/60 mb-3" />
      <p className="text-2xl font-grotesk font-bold text-vapor">{value}</p>
      <p className="text-xs font-mono-tech tracking-widest text-vapor/40 mt-1">{label}</p>
    </div>
  );
}

export default function PartnerOverview({ partner }) {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-grotesk font-bold text-vapor">Overview</h1>
        <p className="text-sm text-vapor/50 font-mono-tech mt-1">Welcome, {partner.first_name || partner.name?.split(' ')[0] || 'Partner'}.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Stat icon={Users} label="REFERRALS" value={partner.referral_count || 0} />
        <Stat icon={TrendingUp} label="CONVERSIONS" value={partner.conversions_count || 0} />
        <Stat icon={DollarSign} label="REVENUE" value={`$${(partner.revenue_generated || 0).toLocaleString()}`} />
        <Stat icon={Sparkles} label="INCENTIVES" value={`$${(partner.incentives_earned || 0).toLocaleString()}`} />
      </div>

      <div className="glass-panel border border-vapor/10 rounded-sm p-5">
        <h2 className="text-xs font-mono-tech tracking-widest text-gold/70 mb-3">YOUR PROFILE</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs font-mono-tech">
          <div><p className="text-vapor/40">DEALERSHIP</p><p className="text-vapor/80 mt-0.5">{partner.dealership || '—'}</p></div>
          <div><p className="text-vapor/40">PHONE</p><p className="text-vapor/80 mt-0.5">{partner.phone || '—'}</p></div>
          <div><p className="text-vapor/40">EMAIL</p><p className="text-vapor/80 mt-0.5 break-all">{partner.email || '—'}</p></div>
          <div><p className="text-vapor/40">REFERRAL CODE</p><p className="text-gold mt-0.5">{partner.referral_code}</p></div>
        </div>
      </div>

      <PartnerReferrals partner={partner} />
    </div>
  );
}