import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { LayoutDashboard, Users, CalendarRange, MessageSquare, DollarSign, Route, FileText, Network, LineChart, Library, BarChart3, Settings, Palette } from 'lucide-react';
import PortalShell from '@/components/portal/PortalShell';
import ContractorsTab from '@/components/admin/ContractorsTab';
import AppointmentsTab from '@/components/admin/AppointmentsTab';
import MessagesTab from '@/components/admin/MessagesTab';
import InvoicesTab from '@/components/admin/InvoicesTab';
import JourneyTab from '@/components/admin/JourneyTab';
import QuotesTab from '@/components/admin/QuotesTab';
import OverviewTab from '@/components/admin/OverviewTab';
import AnalyticsTab from '@/components/admin/AnalyticsTab';
import PartnersTab from '@/components/admin/PartnersTab';
import UsersTab from '@/components/admin/UsersTab';
import BusinessDevTab from '@/components/admin/BusinessDevTab';
import ResourceCenter from '@/components/shared/ResourceCenter';
import SettingsTab from '@/components/admin/SettingsTab';
import WebsiteTab from '@/components/admin/WebsiteTab';
import { usePlanFeatures } from '@/lib/usePlanFeatures';
import { isPreviewMode } from '@/lib/previewMode';
import { DEMO_METRICS } from '@/lib/demoAnalytics';

const invoke = (payload) => base44.functions.invoke('scheduler', payload).then(r => r.data ?? r);

export default function AdminDashboard() {
  const { user, isLoadingAuth, authChecked } = useAuth();
  // Read the initial tab from ?tab= so the era-portal SSO handoff can deep-link
  // directly to a specific tab (e.g. /admin?tab=settings). Absent → 'overview',
  // so existing in-app navigation is unchanged.
  const [tab, setTab] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    const t = params.get('tab');
    const valid = ['overview','contractors','appointments','quotes','invoices','journey','partners','users','business','resources','website','analytics','messages','settings'];
    return valid.includes(t) ? t : 'overview';
  });
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [appointmentsFilter, setAppointmentsFilter] = useState({});
  const { hasFeature } = usePlanFeatures();

  const handleNavigate = (newTab, filter) => {
    setTab(newTab);
    if (newTab === 'appointments' && filter) setAppointmentsFilter(filter);
    else if (newTab !== 'overview') setAppointmentsFilter({});
  };

  useEffect(() => {
    if (isPreviewMode()) return; // builder preview: render the shell without a session
    if (authChecked && (!user || user.role !== 'admin')) window.location.href = '/admin-login';
  }, [authChecked, user]);

  const loadMetrics = useCallback(async () => {
    setLoading(true);
    try { const r = await invoke({ action: 'admin_metrics' }); if (r.error) setError(r.error); else setMetrics(r); }
    catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    if (isPreviewMode()) { setMetrics(DEMO_METRICS); setLoading(false); return; }
    if (authChecked && user?.role === 'admin') loadMetrics();
  }, [authChecked, user, loadMetrics]);

  if (!isPreviewMode() && (!authChecked || isLoadingAuth)) return <div className="min-h-screen bg-obsidian flex items-center justify-center"><div className="w-8 h-8 border-2 border-gold/20 border-t-gold rounded-full animate-spin" /></div>;
  if (error && !metrics) return <div className="min-h-screen bg-obsidian flex items-center justify-center p-6 text-center"><div><p className="text-red-400 text-sm font-mono-tech mb-4">{error}</p><Link to="/admin-login" className="text-gold text-xs font-mono-tech tracking-widest">← BACK TO LOGIN</Link></div></div>;

  const navItems = [
    { key: 'overview', label: 'OVERVIEW', icon: LayoutDashboard },
    { key: 'contractors', label: 'SPECIALISTS', icon: Users },
    { key: 'appointments', label: 'JOBS', icon: CalendarRange },
    { key: 'quotes', label: 'QUOTES', icon: FileText },
    { key: 'invoices', label: 'INVOICES', icon: DollarSign },
    { key: 'journey', label: 'JOURNEY', icon: Route },
    hasFeature('partner_engine') && { key: 'partners', label: 'PARTNERS', icon: Network },
    { key: 'users', label: 'USERS', icon: Users },
    hasFeature('partner_engine') && { key: 'business', label: 'BUSINESS DEV', icon: LineChart },
    { key: 'resources', label: 'RESOURCES', icon: Library },
    { key: 'website', label: 'WEBSITE', icon: Palette },
    hasFeature('advanced_analytics') && { key: 'analytics', label: 'ANALYTICS', icon: BarChart3 },
    hasFeature('ai_sms_agent') && { key: 'messages', label: 'MESSAGES', icon: MessageSquare },
    { key: 'settings', label: 'SETTINGS', icon: Settings },
  ].filter(Boolean);

  return (
    <PortalShell title="Admin Dashboard" navItems={navItems} active={tab} onNavigate={handleNavigate} userLabel={user?.email} onLogout={() => base44.auth.logout('/admin-login')}>
      <>
          {tab === 'overview' && <OverviewTab metrics={metrics} loading={loading} onNavigate={handleNavigate} />}
          {tab === 'contractors' && <ContractorsTab />}
          {tab === 'appointments' && <AppointmentsTab initialStatusFilter={appointmentsFilter.statusFilter} initialDateFilter={appointmentsFilter.dateFilter} />}
          {tab === 'quotes' && <QuotesTab />}
          {tab === 'invoices' && <InvoicesTab />}
          {tab === 'journey' && <JourneyTab />}
          {tab === 'partners' && hasFeature('partner_engine') && <PartnersTab />}
          {tab === 'users' && <UsersTab />}
          {tab === 'business' && hasFeature('partner_engine') && <BusinessDevTab />}
          {tab === 'resources' && <ResourceCenter variant="admin" />}
          {tab === 'website' && <WebsiteTab />}
          {tab === 'analytics' && hasFeature('advanced_analytics') && <AnalyticsTab />}
          {tab === 'messages' && hasFeature('ai_sms_agent') && <MessagesTab />}
          {tab === 'settings' && <SettingsTab />}
        </>
    </PortalShell>
  );
}