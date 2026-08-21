import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { DollarSign, Users, Megaphone, TrendingUp, Loader2 } from 'lucide-react';

const TIER_COLORS = {
  basic: 'text-zinc-400 bg-zinc-800',
  foundation: 'text-blue-300 bg-blue-900/40',
  growth: 'text-purple-300 bg-purple-900/40',
  enterprise: 'text-[#D4AF37] bg-[#D4AF37]/10',
};

const invoke = (body) => base44.functions.invoke('eraAdmin', body).then(r => r.data ?? r);

export default function EraAdminOverview() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    invoke({ action: 'get_overview' })
      .then(r => { if (r.success) setData(r.overview); else setError(r.error || 'Failed'); })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex items-center gap-2 text-white/40 text-sm font-mono"><Loader2 size={16} className="animate-spin" /> Loading overview…</div>;
  if (error) return <p className="text-red-400 text-sm font-mono">{error}</p>;
  if (!data) return null;

  const stats = [
    { label: 'Total Clients', value: data.total_clients, icon: Users, color: 'text-white' },
    { label: 'Est. MRR', value: `$${data.mrr_estimate.toLocaleString()}`, icon: DollarSign, color: 'text-[#D4AF37]' },
    { label: 'Ad Clients', value: data.ad_clients, icon: Megaphone, color: 'text-purple-300' },
  ];

  return (
    <div className="space-y-8">
      <div>
        <p className="text-[10px] font-mono tracking-[0.3em] text-[#D4AF37]/60 mb-1">ERA SYSTEMS</p>
        <h1 className="text-3xl font-bold text-white">Overview</h1>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-3 gap-4">
        {stats.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="border border-white/8 rounded-sm bg-white/[0.03] px-5 py-4">
            <div className="flex items-center gap-2 mb-3">
              <Icon size={14} className={color} />
              <span className="text-[10px] font-mono tracking-widest text-white/40">{label.toUpperCase()}</span>
            </div>
            <p className={`text-3xl font-bold ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Tier breakdown */}
      <div className="border border-white/8 rounded-sm bg-white/[0.03] p-5">
        <p className="text-[10px] font-mono tracking-widest text-white/40 mb-4">CLIENTS BY TIER</p>
        <div className="grid grid-cols-4 gap-3">
          {Object.entries(data.tier_counts).map(([tier, count]) => (
            <div key={tier} className="text-center">
              <p className="text-2xl font-bold text-white mb-1">{count}</p>
              <span className={`text-[10px] font-mono tracking-widest px-2 py-0.5 rounded ${TIER_COLORS[tier] || 'text-white/40'}`}>
                {tier.toUpperCase()}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Recent signups */}
      {data.recent_signups?.length > 0 && (
        <div className="border border-white/8 rounded-sm bg-white/[0.03] p-5">
          <p className="text-[10px] font-mono tracking-widest text-white/40 mb-4">RECENT SIGNUPS</p>
          <div className="space-y-2">
            {data.recent_signups.map((s, i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                <span className="text-sm text-white/80">{s.business_name}</span>
                <div className="flex items-center gap-3">
                  <span className={`text-[10px] font-mono tracking-widest px-2 py-0.5 rounded ${TIER_COLORS[s.plan_tier] || ''}`}>{(s.plan_tier || '').toUpperCase()}</span>
                  <span className="text-xs text-white/30 font-mono">{s.created_date ? new Date(s.created_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}