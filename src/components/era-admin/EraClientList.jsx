import { Globe, Building2, ChevronRight, Clock } from 'lucide-react';

const TIER_COLORS = {
  basic: 'text-zinc-400 bg-zinc-800',
  foundation: 'text-blue-300 bg-blue-900/40',
  growth: 'text-purple-300 bg-purple-900/40',
  enterprise: 'text-[#D4AF37] bg-[#D4AF37]/10',
};

const STATUS_COLORS = {
  active: 'text-green-400',
  past_due: 'text-red-400',
  canceled: 'text-white/30',
};

export default function EraClientList({ clients, onSelect, search, onSearch }) {
  const filtered = (clients || []).filter(c => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      c.business_name?.toLowerCase().includes(q) ||
      c.business_id?.toLowerCase().includes(q) ||
      c.business_email?.toLowerCase().includes(q) ||
      c.plan_tier?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-4">
      {/* Search */}
      <input
        value={search}
        onChange={e => onSearch(e.target.value)}
        placeholder="Search clients…"
        className="w-full bg-white/5 border border-white/10 rounded-sm px-4 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[#D4AF37]/40"
      />

      <div className="text-[10px] font-mono tracking-widest text-white/30 px-1">{filtered.length} CLIENT{filtered.length !== 1 ? 'S' : ''}</div>

      <div className="space-y-1">
        {filtered.map(c => (
          <button
            key={c.business_id}
            onClick={() => onSelect(c)}
            className="w-full text-left border border-white/8 rounded-sm bg-white/[0.02] hover:bg-white/[0.05] hover:border-[#D4AF37]/20 transition-all px-4 py-3.5 group"
          >
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                {c.logo_url ? (
                  <img src={c.logo_url} alt="" className="w-7 h-7 rounded-sm object-contain bg-white/5 shrink-0" />
                ) : (
                  <div className="w-7 h-7 rounded-sm bg-white/8 flex items-center justify-center shrink-0">
                    <Building2 size={13} className="text-white/30" />
                  </div>
                )}
                <div className="min-w-0">
                  <p className="text-sm font-medium text-white truncate">{c.business_name}</p>
                  <p className="text-[10px] font-mono text-white/30 truncate">{c.business_id}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                {c.era_account?.provisioning_review_status === 'pending_review' && (
                  <span className="flex items-center gap-1 text-[10px] font-mono tracking-widest text-yellow-400 bg-yellow-900/30 px-2 py-0.5 rounded">
                    <Clock size={9} /> REVIEW
                  </span>
                )}
                <span className={`text-[10px] font-mono tracking-widest px-2 py-0.5 rounded ${TIER_COLORS[c.plan_tier] || 'text-white/40'}`}>
                  {(c.plan_tier || '').toUpperCase()}
                </span>
                <span className={`text-[10px] font-mono ${STATUS_COLORS[c.subscription_status] || 'text-white/30'}`}>
                  {c.is_active ? 'ACTIVE' : 'INACTIVE'}
                </span>
                <ChevronRight size={14} className="text-white/20 group-hover:text-[#D4AF37]/60 transition-colors" />
              </div>
            </div>
          </button>
        ))}
        {filtered.length === 0 && (
          <p className="text-center text-white/30 text-sm py-12 font-mono">No clients found.</p>
        )}
      </div>
    </div>
  );
}