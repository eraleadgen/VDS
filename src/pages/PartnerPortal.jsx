import { useState, useEffect, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { LayoutDashboard, QrCode, Library } from 'lucide-react';
import PortalShell from '@/components/portal/PortalShell';
import PartnerOverview from '@/components/partner/PartnerOverview';
import ReferralCard from '@/components/partner/ReferralCard';
import ResourceCenter from '@/components/shared/ResourceCenter';

export default function PartnerPortal() {
  const { user, isLoadingAuth, authChecked } = useAuth();
  const [tab, setTab] = useState('overview');
  const [partner, setPartner] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authChecked) return;
    if (!user || (user.role !== 'admin' && user.role !== 'partner')) { window.location.href = '/partner-login'; return; }
  }, [authChecked, user]);

  const load = useCallback(async () => {
    if (user?.role === 'admin') { setPartner(null); setLoading(false); return; }
    try {
      const list = await base44.entities.Partner.filter({ linked_user_id: user.id });
      setPartner(list?.[0] || null);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [user?.role]);

  useEffect(() => { if (authChecked && user && (user.role === 'partner' || user.role === 'admin')) load(); }, [authChecked, user, load]);

  // Realtime: when admin credits an incentive or updates this partner's metrics, the
  // overview stats refresh automatically.
  useEffect(() => {
    if (!user || (user.role !== 'partner' && user.role !== 'admin')) return;
    const unsub = base44.entities.Partner.subscribe(() => { load(); });
    return unsub;
  }, [user, load]);

  if (!authChecked || isLoadingAuth) return <div className="min-h-screen bg-obsidian flex items-center justify-center"><div className="w-8 h-8 border-2 border-gold/20 border-t-gold rounded-full animate-spin" /></div>;

  const navItems = [
    { key: 'overview', label: 'OVERVIEW', icon: LayoutDashboard },
    { key: 'referral', label: 'REFERRAL LINK', icon: QrCode },
    { key: 'resources', label: 'RESOURCES', icon: Library },
  ];

  return (
    <PortalShell title="Partner Portal" navItems={navItems} active={tab} onNavigate={setTab} userLabel={partner?.name || user?.email} onLogout={() => base44.auth.logout('/partner-login')}>
      {loading ? (
        <div className="flex justify-center py-20"><div className="w-8 h-8 border-2 border-gold/20 border-t-gold rounded-full animate-spin" /></div>
      ) : !partner ? (
        <div className="glass-panel border border-gold/20 bg-gold/5 rounded-sm p-6 text-xs font-mono-tech text-gold/80">
          ADMIN PREVIEW — No partner profile is linked to your account. Create a partner in Admin → Partners and link a user (role 'partner') to preview the full partner experience.
        </div>
      ) : (
        <>
          {tab === 'overview' && <PartnerOverview partner={partner} />}
          {tab === 'referral' && <ReferralCard partner={partner} />}
          {tab === 'resources' && <ResourceCenter variant="partner" />}
        </>
      )}
    </PortalShell>
  );
}