import { Clock, CalendarDays, CheckCircle2, TrendingUp } from 'lucide-react';
import JobCard from '@/components/contractor/JobCard';

function Stat({ icon: Icon, label, value }) {
  return (
    <div className="glass-panel border border-vapor/10 rounded-sm p-4">
      <Icon size={18} className="text-gold/60 mb-3" />
      <p className="text-2xl font-grotesk font-bold text-vapor">{value}</p>
      <p className="text-xs font-mono-tech tracking-widest text-vapor/40 mt-1">{label}</p>
    </div>
  );
}

export default function OverviewTab({ profile, todaysJobs, onStart, onComplete, onPhotos, onReview, onSetConsultation, saving }) {
  const metrics = profile?.metrics || {};

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-grotesk font-bold text-vapor">Overview</h1>
        <p className="text-sm text-vapor/50 font-mono-tech mt-1">
          Welcome, {profile?.name?.split(' ')[0] || 'Specialist'}. Here's your day at a glance.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Stat icon={Clock} label="TODAY'S JOBS" value={todaysJobs.length} />
        <Stat icon={CalendarDays} label="UPCOMING" value={profile?._upcomingCount || 0} />
        <Stat icon={CheckCircle2} label="COMPLETED" value={profile?._completedCount || 0} />
        <Stat icon={TrendingUp} label="LIFETIME JOBS" value={metrics.jobs_completed || 0} />
      </div>

      <div>
        <h2 className="text-xs font-mono-tech tracking-widest text-gold/70 mb-3">TODAY'S SCHEDULE</h2>
        {todaysJobs.length ? (
          <div className="space-y-3">
            {todaysJobs.map(j => (
              <JobCard key={j.id} job={j} onStart={onStart} onComplete={onComplete} onPhotos={onPhotos} onReview={onReview} onSetConsultation={onSetConsultation} disabled={saving} />
            ))}
          </div>
        ) : (
          <div className="glass-panel border border-vapor/10 rounded-sm p-8 text-center text-sm text-vapor/40 font-mono-tech">
            No jobs scheduled today.
          </div>
        )}
      </div>
    </div>
  );
}