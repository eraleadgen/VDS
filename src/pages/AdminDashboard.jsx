import { useState, useEffect, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { LayoutDashboard, Users, CalendarRange, Clock, CheckCircle2, XCircle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import PortalShell from '@/components/portal/PortalShell';
import ContractorsTab from '@/components/admin/ContractorsTab';
import AppointmentsTab from '@/components/admin/AppointmentsTab';

const invoke = (payload) => base44.functions.invoke('scheduler', payload).then(r => r.data ?? r);

export default function AdminDashboard() {
  const { user, isLoadingAuth, authChecked } = useAuth();
  const [tab, setTab] = useState('overview');
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (authChecked && (!user || user.role !== 'admin')) window.location.href = '/admin-login';
  }, [authChecked, user]);

  const loadMetrics = useCallback(async () => {
    setLoading(true);
    try { const r = await invoke({ action: 'admin_metrics' }); if (r.error) setError(r.error); else setMetrics(r); }
    catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { if (authChecked && user?.role === 'admin') loadMetrics(); }, [authChecked, user, loadMetrics]);

  if (!authChecked || isLoadingAuth) return <div className="min-h-screen bg-obsidian flex items-center justify-center"><div className="w-8 h-8 border-2 border-gold/20 border-t-gold rounded-full animate-spin" /></div>;
  if (error && !metrics) return <div className="min-h-screen bg-obsidian flex items-center justify-center p-6 text-center"><div><p className="text-red-400 text-sm font-mono-tech mb-4">{error}</p><a href="/admin-login" className="text-gold text-xs font-mono-tech tracking-widest">← BACK TO LOGIN</a></div></div>;

  const navItems = [
    { key: 'overview', label: 'OVERVIEW', icon: LayoutDashboard },
    { key: 'contractors', label: 'CONTRACTORS', icon: Users },
    { key: 'appointments', label: 'APPOINTMENTS', icon: CalendarRange },
  ];

  return (
    <PortalShell title="Admin Dashboard" navItems={navItems} active={tab} onNavigate={setTab} userLabel={user?.email} onLogout={() => base44.auth.logout('/admin-login')}>
      {loading && tab === 'overview' ? (
        <div className="flex justify-center py-20"><div className="w-8 h-8 border-2 border-gold/20 border-t-gold rounded-full animate-spin" /></div>
      ) : (
        <>
          {tab === 'overview' && <Overview metrics={metrics} />}
          {tab === 'contractors' && <ContractorsTab />}
          {tab === 'appointments' && <AppointmentsTab />}
        </>
      )}
    </PortalShell>
  );
}

function Overview({ metrics }) {
  const m = metrics?.metrics || {};
  const data = (metrics?.jobs_by_contractor || []).map(j => ({ name: (j.name || '').split(' ')[0], jobs: j.jobs }));
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-grotesk font-bold text-vapor">Overview</h1>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <Stat icon={Users} label="CONTRACTORS" value={m.total_contractors} />
        <Stat icon={Users} label="ACTIVE" value={m.active_contractors} />
        <Stat icon={Clock} label="TODAY'S JOBS" value={m.todays_jobs} />
        <Stat icon={CalendarRange} label="UPCOMING" value={m.upcoming_jobs} />
        <Stat icon={CheckCircle2} label="COMPLETED" value={m.completed_jobs} />
        <Stat icon={XCircle} label="CANCELLED" value={m.cancelled_jobs} />
      </div>
      <div className="glass-panel border border-vapor/10 rounded-sm p-6">
        <h2 className="text-xs font-mono-tech tracking-widest text-gold/70 mb-4">JOBS COMPLETED BY CONTRACTOR</h2>
        {data.length ? (
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={data}>
              <XAxis dataKey="name" stroke="#E2E8F080" fontSize={11} tickLine={false} axisLine={{ stroke: '#E2E8F020' }} />
              <YAxis allowDecimals={false} stroke="#E2E8F080" fontSize={11} tickLine={false} axisLine={{ stroke: '#E2E8F020' }} />
              <Tooltip contentStyle={{ background: '#14161A', border: '1px solid rgba(212,175,55,0.25)', borderRadius: 4, fontSize: 12 }} cursor={{ fill: 'rgba(212,175,55,0.05)' }} />
              <Bar dataKey="jobs" fill="#D4AF37" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : <p className="text-center text-vapor/40 font-mono-tech text-sm py-12">No data yet.</p>}
      </div>
    </div>
  );
}

function Stat({ icon: Icon, label, value }) {
  return (
    <div className="glass-panel border border-vapor/10 rounded-sm p-4">
      <Icon size={18} className="text-gold/60 mb-3" />
      <p className="text-2xl font-grotesk font-bold text-vapor">{value}</p>
      <p className="text-xs font-mono-tech tracking-widest text-vapor/40 mt-1">{label}</p>
    </div>
  );
}