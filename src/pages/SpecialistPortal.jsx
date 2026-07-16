import { useState, useEffect, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { LayoutDashboard, Briefcase, CalendarDays, UserCircle, Clock, CheckCircle2, TrendingUp } from 'lucide-react';
import PortalShell from '@/components/portal/PortalShell';
import JobCard from '@/components/contractor/JobCard';
import CompletionModal from '@/components/contractor/CompletionModal';
import AvailabilityEditor from '@/components/contractor/AvailabilityEditor';

const invoke = (payload) => base44.functions.invoke('scheduler', payload).then(r => r.data ?? r);
const SKILL_LABELS = {
  interior_detail: 'Interior', exterior_detail: 'Exterior', full_detail: 'Full Detail',
  paint_correction: 'Paint Correction', ceramic_coating: 'Ceramic Coating', engine_bay: 'Engine Bay', headlight_restoration: 'Headlight Restoration',
};
const INPUT = 'w-full bg-asphalt border border-vapor/10 focus:border-gold/50 outline-none text-vapor px-4 py-3 text-sm font-mono-tech rounded-sm transition-colors duration-200';
export default function SpecialistPortal() {
  const { user, isLoadingAuth, authChecked } = useAuth();
  const [tab, setTab] = useState('overview');
  const [profile, setProfile] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [photoJob, setPhotoJob] = useState(null);
  const [saving, setSaving] = useState(false);
  const [pf, setPf] = useState({ phone: '', email: '', home_address: '', status: 'active' });

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      if (user?.role === 'admin') { setProfile(null); setJobs([]); return; }
      const [p, j] = await Promise.all([invoke({ action: 'get_my_profile' }), invoke({ action: 'my_jobs' })]);
      if (p.error) { setError(p.error); return; }
      setProfile(p.contractor);
      setJobs(j.jobs || []);
      setPf({ phone: p.contractor.phone || '', email: p.contractor.email || '', home_address: p.contractor.home_address || '', status: p.contractor.status || 'active' });
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }, [user?.role]);

  // Login wall: only VDS Specialists (role 'contractor') may open this portal.
  useEffect(() => {
    if (!authChecked) return;
    if (!user) { window.location.href = '/specialist-login'; return; }
    if (user.role !== 'admin' && user.role !== 'contractor') { window.location.href = '/specialist-login'; return; }
  }, [authChecked, user]);

  useEffect(() => { if (authChecked && user && (user.role === 'contractor' || user.role === 'admin')) load(); }, [authChecked, user, load]);

  if (!authChecked || isLoadingAuth) return <div className="min-h-screen bg-obsidian flex items-center justify-center"><div className="w-8 h-8 border-2 border-gold/20 border-t-gold rounded-full animate-spin" /></div>;
  if (error && !profile) return <div className="min-h-screen bg-obsidian flex items-center justify-center p-6 text-center"><div><p className="text-red-400 text-sm font-mono-tech mb-4">{error}</p><a href="/specialist-login" className="text-gold text-xs font-mono-tech tracking-widest">← BACK TO LOGIN</a></div></div>;

  const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/New_York' }).format(new Date());
  const todaysJobs = jobs.filter(j => j.preferred_date === today && j.status !== 'completed');
  const upcoming = jobs.filter(j => j.preferred_date > today && j.status !== 'completed');
  const completed = jobs.filter(j => j.status === 'completed');
  const metrics = profile?.metrics || {};

  const startJob = async (appt) => {
    setSaving(true);
    try { const r = await invoke({ action: 'update_job_status', appointment_id: appt.id, job_status: 'in_progress' }); if (r.error) alert(r.error); else await load(); }
    finally { setSaving(false); }
  };
  const completeJob = async (appt) => {
    setSaving(true);
    try { const r = await invoke({ action: 'update_job_status', appointment_id: appt.id, job_status: 'completed' }); if (r.error) alert(r.error); else await load(); }
    finally { setSaving(false); }
  };
  const submitPhotos = async (payload) => {
    setSaving(true);
    try { const r = await invoke({ action: 'update_job_status', appointment_id: photoJob.id, job_status: 'photos_uploaded', ...payload }); if (r.error) { alert(r.error); return false; } setPhotoJob(null); await load(); return true; }
    finally { setSaving(false); }
  };
  const requestReview = async (appt) => {
    setSaving(true);
    try { const r = await invoke({ action: 'request_review', appointment_id: appt.id }); if (r.error) alert(r.error); else await load(); }
    finally { setSaving(false); }
  };
  const saveAvailability = async (patch) => {
    setSaving(true);
    try { const r = await invoke({ action: 'update_my_profile', ...patch }); if (r.error) { alert(r.error); return; } await load(); alert('Availability saved.'); }
    finally { setSaving(false); }
  };
  const saveProfileForm = async (e) => {
    e.preventDefault();
    setSaving(true);
    try { const r = await invoke({ action: 'update_my_profile', phone: pf.phone, email: pf.email, home_address: pf.home_address, status: pf.status }); if (r.error) alert(r.error); else { await load(); alert('Profile updated.'); } }
    finally { setSaving(false); }
  };

  const navItems = [
    { key: 'overview', label: 'OVERVIEW', icon: LayoutDashboard },
    { key: 'jobs', label: 'MY JOBS', icon: Briefcase },
    { key: 'availability', label: 'AVAILABILITY', icon: CalendarDays },
    { key: 'profile', label: 'PROFILE', icon: UserCircle },
  ];

  return (
    <PortalShell title="Specialist Portal" navItems={navItems} active={tab} onNavigate={setTab} userLabel={profile?.name || user?.email} onLogout={() => base44.auth.logout('/specialist-login')}>
      {loading ? (
        <div className="flex justify-center py-20"><div className="w-8 h-8 border-2 border-gold/20 border-t-gold rounded-full animate-spin" /></div>
      ) : (
        <>
          {user?.role === 'admin' && !profile && (
            <div className="glass-panel border border-gold/20 bg-gold/5 rounded-sm p-3 mb-4 text-xs font-mono-tech text-gold/80">
              ADMIN PREVIEW — No specialist profile is linked to your admin account, so jobs and availability appear empty here.
            </div>
          )}
          {tab === 'overview' && (
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-grotesk font-bold text-vapor mb-1">Welcome, {profile?.name?.split(' ')[0] || 'Specialist'}</h1>
                <p className="text-sm text-vapor/50 font-mono-tech">Here's your day at a glance.</p>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Stat icon={Clock} label="TODAY'S JOBS" value={todaysJobs.length} />
                <Stat icon={CalendarDays} label="UPCOMING" value={upcoming.length} />
                <Stat icon={CheckCircle2} label="COMPLETED" value={completed.length} />
                <Stat icon={TrendingUp} label="LIFETIME JOBS" value={metrics.jobs_completed || 0} />
              </div>
              <div>
                <h2 className="text-xs font-mono-tech tracking-widest text-gold/70 mb-3">TODAY'S SCHEDULE</h2>
                {todaysJobs.length ? (
                  <div className="space-y-3">{todaysJobs.map(j => <JobCard key={j.id} job={j} onStart={startJob} onComplete={completeJob} onPhotos={setPhotoJob} onReview={requestReview} disabled={saving} />)}</div>
                ) : (
                  <div className="glass-panel border border-vapor/10 rounded-sm p-8 text-center text-sm text-vapor/40 font-mono-tech">No jobs scheduled today.</div>
                )}
              </div>
            </div>
          )}

          {tab === 'jobs' && (
            <div className="space-y-4">
              <h1 className="text-2xl font-grotesk font-bold text-vapor mb-2">My Jobs</h1>
              {jobs.length ? (
                <div className="space-y-3">{jobs.map(j => <JobCard key={j.id} job={j} onStart={startJob} onComplete={completeJob} onPhotos={setPhotoJob} onReview={requestReview} disabled={saving} />)}</div>
              ) : (
                <div className="glass-panel border border-vapor/10 rounded-sm p-8 text-center text-sm text-vapor/40 font-mono-tech">No jobs assigned yet.</div>
              )}
            </div>
          )}

          {tab === 'availability' && (
            <div className="space-y-4">
              <h1 className="text-2xl font-grotesk font-bold text-vapor mb-2">Availability</h1>
              <p className="text-sm text-vapor/50 font-mono-tech">Set your recurring weekly hours and blocked dates. The scheduling engine uses these to auto-assign jobs to you.</p>
              <AvailabilityEditor contractor={profile} onSave={saveAvailability} saving={saving} />
            </div>
          )}

          {tab === 'profile' && (
            <div className="space-y-6 max-w-xl">
              <h1 className="text-2xl font-grotesk font-bold text-vapor mb-2">Profile</h1>
              <form onSubmit={saveProfileForm} className="glass-panel border border-gold/10 rounded-sm p-6 space-y-4">
                <div>
                  <label className="block text-xs font-mono-tech tracking-widest text-vapor/50 mb-2">STATUS</label>
                  <select value={pf.status} onChange={e => setPf({ ...pf, status: e.target.value })} className={INPUT}>
                    <option value="active">Active</option><option value="vacation">Vacation</option><option value="offline">Offline</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-mono-tech tracking-widest text-vapor/50 mb-2">PHONE</label>
                  <input value={pf.phone} onChange={e => setPf({ ...pf, phone: e.target.value })} className={INPUT} />
                </div>
                <div>
                  <label className="block text-xs font-mono-tech tracking-widest text-vapor/50 mb-2">EMAIL</label>
                  <input value={pf.email} onChange={e => setPf({ ...pf, email: e.target.value })} className={INPUT} />
                </div>
                <div>
                  <label className="block text-xs font-mono-tech tracking-widest text-vapor/50 mb-2">HOME ADDRESS</label>
                  <input value={pf.home_address} onChange={e => setPf({ ...pf, home_address: e.target.value })} className={INPUT} />
                </div>
                <button type="submit" disabled={saving} className="flex items-center gap-2 bg-gold text-obsidian px-6 py-3 text-xs font-mono-tech tracking-widest rounded-sm hover:bg-gold-light disabled:opacity-50">SAVE CHANGES</button>
              </form>
              <div className="glass-panel border border-vapor/10 rounded-sm p-6">
                <h3 className="text-xs font-mono-tech tracking-widest text-gold/70 mb-3">SKILLS & SERVICE AREAS</h3>
                <div className="flex flex-wrap gap-2 mb-4">
                  {(profile.skills || []).map(s => <span key={s} className="text-xs font-mono-tech bg-gold/10 text-gold border border-gold/30 px-3 py-1 rounded-sm">{SKILL_LABELS[s] || s}</span>)}
                  {!profile.skills?.length && <span className="text-xs font-mono-tech text-vapor/30">None set</span>}
                </div>
                <p className="text-xs font-mono-tech text-vapor/50 mb-1">Counties: {(profile.service_areas?.counties || []).join(', ') || 'None set'}</p>
                <p className="text-xs font-mono-tech text-vapor/50">Max travel: {profile.service_areas?.max_travel_distance_miles || 0} mi</p>
                <p className="text-xs text-vapor/30 mt-2">Contact an admin to update skills or service areas.</p>
              </div>
            </div>
          )}
        </>
      )}
      {photoJob && <CompletionModal job={photoJob} onClose={() => setPhotoJob(null)} onSubmit={submitPhotos} saving={saving} />}
    </PortalShell>
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