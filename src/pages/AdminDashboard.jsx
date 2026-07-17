import { useState, useEffect, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { LayoutDashboard, Users, CalendarRange, Clock, CheckCircle2, XCircle, MessageSquare, DollarSign, Database, Route, FileText } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import PortalShell from '@/components/portal/PortalShell';
import ContractorsTab from '@/components/admin/ContractorsTab';
import AppointmentsTab from '@/components/admin/AppointmentsTab';
import MessagesTab from '@/components/admin/MessagesTab';
import MigrationTab from '@/components/admin/MigrationTab';
import InvoicesTab from '@/components/admin/InvoicesTab';
import JourneyTab from '@/components/admin/JourneyTab';
import QuotesTab from '@/components/admin/QuotesTab';

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
    { key: 'contractors', label: 'SPECIALISTS', icon: Users },
    { key: 'appointments', label: 'JOBS', icon: CalendarRange },
    { key: 'quotes', label: 'QUOTES', icon: FileText },
    { key: 'invoices', label: 'INVOICES', icon: DollarSign },
    { key: 'journey', label: 'JOURNEY', icon: Route },
    { key: 'messages', label: 'MESSAGES', icon: MessageSquare },
    { key: 'migration', label: 'MIGRATION', icon: Database },
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
          {tab === 'quotes' && <QuotesTab />}
          {tab === 'invoices' && <InvoicesTab />}
          {tab === 'journey' && <JourneyTab />}
          {tab === 'messages' && <MessagesTab />}
          {tab === 'migration' && <MigrationTab />}
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
      <div className="glass-panel border border-gold/25 rounded-sm p-6 flex items-center gap-5 bg-gold/[0.03]">
        <DollarSign size={28} className="text-gold shrink-0" />
        <div>
          <p className="text-3xl font-grotesk font-bold text-gold">${(m.total_revenue || 0).toLocaleString()}</p>
          <p className="text-xs font-mono-tech tracking-widest text-vapor/50 mt-1">TOTAL REVENUE — {m.revenue_jobs || 0} COMPLETED DETAILS</p>
        </div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <Stat icon={Users} label="SPECIALISTS" value={m.total_contractors} />
        <Stat icon={Users} label="ACTIVE" value={m.active_contractors} />
        <Stat icon={Clock} label="TODAY'S JOBS" value={m.todays_jobs} />
        <Stat icon={CalendarRange} label="UPCOMING" value={m.upcoming_jobs} />
        <Stat icon={CheckCircle2} label="COMPLETED" value={m.completed_jobs} />
        <Stat icon={XCircle} label="CANCELLED" value={m.cancelled_jobs} />
      </div>
      <div className="glass-panel border border-vapor/10 rounded-sm p-6">
        <h2 className="text-xs font-mono-tech tracking-widest text-gold/70 mb-4">JOBS COMPLETED BY SPECIALIST</h2>
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