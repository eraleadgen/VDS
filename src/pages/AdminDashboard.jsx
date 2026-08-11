import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { LayoutDashboard, Users, CalendarRange, MessageSquare, DollarSign, Route, FileText, Network, LineChart, Library } from 'lucide-react';
import PortalShell from '@/components/portal/PortalShell';
import ContractorsTab from '@/components/admin/ContractorsTab';
import AppointmentsTab from '@/components/admin/AppointmentsTab';
import MessagesTab from '@/components/admin/MessagesTab';
import InvoicesTab from '@/components/admin/InvoicesTab';
import JourneyTab from '@/components/admin/JourneyTab';
import QuotesTab from '@/components/admin/QuotesTab';
import OverviewTab from '@/components/admin/OverviewTab';
import PartnersTab from '@/components/admin/PartnersTab';
import UsersTab from '@/components/admin/UsersTab';
import BusinessDevTab from '@/components/admin/BusinessDevTab';
import ResourceCenter from '@/components/shared/ResourceCenter';

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
  if (error && !metrics) return <div className="min-h-screen bg-obsidian flex items-center justify-center p-6 text-center"><div><p className="text-red-400 text-sm font-mono-tech mb-4">{error}</p><Link to="/admin-login" className="text-gold text-xs font-mono-tech tracking-widest">← BACK TO LOGIN</Link></div></div>;

  const navItems = [
    { key: 'overview', label: 'OVERVIEW', icon: LayoutDashboard },
    { key: 'contractors', label: 'SPECIALISTS', icon: Users },
    { key: 'appointments', label: 'JOBS', icon: CalendarRange },
    { key: 'quotes', label: 'QUOTES', icon: FileText },
    { key: 'invoices', label: 'INVOICES', icon: DollarSign },
    { key: 'journey', label: 'JOURNEY', icon: Route },
    { key: 'partners', label: 'PARTNERS', icon: Network },
    { key: 'users', label: 'USERS', icon: Users },
    { key: 'business', label: 'BUSINESS DEV', icon: LineChart },
    { key: 'resources', label: 'RESOURCES', icon: Library },
    { key: 'messages', label: 'MESSAGES', icon: MessageSquare },
  ];

  return (
    <PortalShell title="Admin Dashboard" navItems={navItems} active={tab} onNavigate={setTab} userLabel={user?.email} onLogout={() => base44.auth.logout('/admin-login')}>
      <>
          {tab === 'overview' && <OverviewTab metrics={metrics} loading={loading} />}
          {tab === 'contractors' && <ContractorsTab />}
          {tab === 'appointments' && <AppointmentsTab />}
          {tab === 'quotes' && <QuotesTab />}
          {tab === 'invoices' && <InvoicesTab />}
          {tab === 'journey' && <JourneyTab />}
          {tab === 'partners' && <PartnersTab />}
          {tab === 'users' && <UsersTab />}
          {tab === 'business' && <BusinessDevTab />}
          {tab === 'resources' && <ResourceCenter variant="admin" />}
          {tab === 'messages' && <MessagesTab />}
        </>
    </PortalShell>
  );
}