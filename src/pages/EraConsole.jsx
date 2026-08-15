import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import Navbar from '../components/vds/Navbar';
import Footer from '../components/vds/Footer';
import { ShieldCheck, ShieldAlert, Building2, Calendar, Mail, Phone, Globe, CreditCard, Loader2 } from 'lucide-react';

const TIER_STYLES = {
  basic: 'bg-zinc-700 text-zinc-200',
  foundation: 'bg-blue-900/60 text-blue-200',
  growth: 'bg-purple-900/60 text-purple-200',
  enterprise: 'bg-gold/20 text-gold',
};

export default function EraConsole() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const res = await base44.functions.invoke('getEraStaffConsole', {});
        setData(res?.data || res);
      } catch (e) {
        const status = e?.response?.status;
        if (status === 403) setError('Access restricted to ERA Systems staff.');
        else if (status === 401) setError('Please sign in to access the staff console.');
        else setError(e?.response?.data?.error || e?.message || 'Unable to load console.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="bg-obsidian min-h-screen">
      <Navbar />
      <section className="pt-28 pb-20 max-w-7xl mx-auto px-6">
        <div className="flex items-center gap-3 mb-2">
          <ShieldCheck className="text-gold" size={22} />
          <p className="text-xs font-mono-tech tracking-[0.3em] text-gold/70">ERA SYSTEMS · INTERNAL</p>
        </div>
        <h1 className="text-4xl font-grotesk font-bold text-vapor mb-2">Staff Console</h1>
        <p className="text-vapor/40 text-sm font-mono-tech mb-8">
          Cross-tenant view of all client businesses · {data?.rows?.length || 0} tenants
        </p>

        {loading && (
          <div className="flex items-center gap-3 text-vapor/50 font-mono-tech text-sm">
            <Loader2 className="animate-spin" size={18} /> Loading tenant data…
          </div>
        )}

        {error && (
          <div className="flex items-center gap-3 border border-red-500/30 bg-red-950/20 px-5 py-4 rounded-sm max-w-xl">
            <ShieldAlert className="text-red-400 shrink-0" size={20} />
            <p className="text-red-200 text-sm font-mono-tech">{error}</p>
          </div>
        )}

        {data && data.rows && (
          <div className="overflow-x-auto border border-gold/10 rounded-sm">
            <table className="w-full text-sm">
              <thead className="bg-asphalt/60 text-gold/70 font-mono-tech text-xs tracking-widest">
                <tr>
                  <th className="text-left px-4 py-3 font-medium">BUSINESS</th>
                  <th className="text-left px-4 py-3 font-medium">TIER</th>
                  <th className="text-left px-4 py-3 font-medium">SIGNED UP</th>
                  <th className="text-left px-4 py-3 font-medium">CONTACT</th>
                  <th className="text-left px-4 py-3 font-medium">DOMAIN</th>
                  <th className="text-left px-4 py-3 font-medium">EMAIL</th>
                  <th className="text-left px-4 py-3 font-medium">BILLING</th>
                  <th className="text-left px-4 py-3 font-medium">STATUS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-vapor/5">
                {data.rows.map(r => (
                  <tr key={r.business_id} className="hover:bg-asphalt/30 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Building2 size={14} className="text-gold/50 shrink-0" />
                        <div>
                          <p className="text-vapor font-medium">{r.business_name}</p>
                          <p className="text-vapor/30 text-xs font-mono-tech">{r.business_id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-block px-2 py-0.5 rounded text-xs font-mono-tech uppercase tracking-wider ${TIER_STYLES[r.plan_tier] || 'bg-zinc-700 text-zinc-200'}`}>{r.plan_tier}</span>
                      {r.ad_management_enabled && <span className="ml-1 text-[10px] text-gold/60 font-mono-tech">+ADS</span>}
                    </td>
                    <td className="px-4 py-3 text-vapor/60 font-mono-tech text-xs">
                      <div className="flex items-center gap-1.5">
                        <Calendar size={12} className="text-vapor/30" />
                        {r.signup_date ? new Date(r.signup_date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '—'}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-vapor/60 text-xs">
                      {r.business_email && <div className="flex items-center gap-1.5"><Mail size={11} className="text-vapor/30" /> {r.business_email}</div>}
                      {r.business_phone && <div className="flex items-center gap-1.5 mt-1"><Phone size={11} className="text-vapor/30" /> {r.business_phone}</div>}
                      {!r.business_email && !r.business_phone && <span className="text-vapor/30">—</span>}
                    </td>
                    <td className="px-4 py-3 text-vapor/60 text-xs">
                      {r.domain ? (
                        <div className="flex items-center gap-1.5"><Globe size={11} className="text-vapor/30" /> {r.domain}</div>
                      ) : <span className="text-vapor/30">—</span>}
                      <span className={`text-[10px] font-mono-tech ${r.domain_status === 'verified' ? 'text-green-400' : r.domain_status === 'pending' ? 'text-yellow-400' : 'text-vapor/30'}`}>{r.domain_status}</span>
                    </td>
                    <td className="px-4 py-3 text-xs">
                      <span className={`font-mono-tech ${r.email_domain_status === 'verified' ? 'text-green-400' : r.email_domain_status === 'pending' ? 'text-yellow-400' : 'text-vapor/40'}`}>{r.email_mode}</span>
                    </td>
                    <td className="px-4 py-3 text-xs">
                      <div className="flex items-center gap-2 font-mono-tech">
                        <CreditCard size={12} className="text-vapor/30" />
                        {r.billing.active > 0 && <span className="text-green-400">{r.billing.active} active</span>}
                        {r.billing.past_due > 0 && <span className="text-red-400">{r.billing.past_due} past due</span>}
                        {r.billing.canceled > 0 && <span className="text-vapor/40">{r.billing.canceled} canceled</span>}
                        {r.billing.active === 0 && r.billing.past_due === 0 && r.billing.canceled === 0 && <span className="text-vapor/30">—</span>}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {r.is_active ? <span className="text-green-400 text-xs font-mono-tech">ACTIVE</span> : <span className="text-vapor/40 text-xs font-mono-tech">INACTIVE</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
      <Footer />
    </div>
  );
}