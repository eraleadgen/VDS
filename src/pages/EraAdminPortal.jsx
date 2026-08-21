import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Loader2, ShieldAlert } from 'lucide-react';
import EraAdminShell from '@/components/era-admin/EraAdminShell';
import EraAdminOverview from '@/components/era-admin/EraAdminOverview';
import EraAdminClients from '@/components/era-admin/EraAdminClients';

export default function EraAdminPortal() {
  const [tab, setTab] = useState('overview');
  const [auth, setAuth] = useState(null); // null=loading, false=denied, object=ok
  const [staffName, setStaffName] = useState('');

  useEffect(() => {
    // Quick auth check by pinging getEraStaffConsole (which already has the assertEraStaff guard)
    base44.functions.invoke('getEraStaffConsole', {})
      .then(r => {
        const d = r?.data ?? r;
        setAuth(true);
        setStaffName(d?.staff?.name || d?.staff?.email || '');
      })
      .catch(e => {
        const status = e?.response?.status;
        setAuth(status === 403 ? 'forbidden' : status === 401 ? 'unauthenticated' : 'error');
      });
  }, []);

  if (auth === null) {
    return (
      <div className="min-h-screen bg-[#0A0B0D] flex items-center justify-center">
        <Loader2 size={22} className="animate-spin text-[#D4AF37]/60" />
      </div>
    );
  }

  if (auth !== true) {
    return (
      <div className="min-h-screen bg-[#0A0B0D] flex items-center justify-center">
        <div className="max-w-sm text-center space-y-4">
          <ShieldAlert size={36} className="text-red-400 mx-auto" />
          <p className="text-white font-bold text-lg">Access Restricted</p>
          <p className="text-white/40 text-sm font-mono">
            {auth === 'unauthenticated'
              ? 'Please sign in to access the ERA Admin Portal.'
              : 'This portal is restricted to ERA Systems staff.'}
          </p>
          <a href="/era-login" className="inline-block mt-2 text-xs font-mono text-[#D4AF37]/70 hover:text-[#D4AF37] underline">
            Sign in
          </a>
        </div>
      </div>
    );
  }

  return (
    <EraAdminShell active={tab} onNavigate={setTab} staffName={staffName}>
      {tab === 'overview' && <EraAdminOverview />}
      {tab === 'clients' && <EraAdminClients />}
    </EraAdminShell>
  );
}