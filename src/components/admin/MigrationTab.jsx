import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Database, CheckCircle2, AlertTriangle, Info, FileText, Users, Car, Briefcase, CreditCard } from 'lucide-react';

export default function MigrationTab() {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const events = await base44.entities.SystemEventLog.filter({ event_type: 'migration_completed' }, '-created_date', 1);
        if (events && events.length > 0) {
          setReport({ id: events[0].id, created_date: events[0].created_date, ...events[0].metadata?.report });
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return <div className="flex justify-center py-20"><div className="w-8 h-8 border-2 border-gold/20 border-t-gold rounded-full animate-spin" /></div>;
  }

  if (!report) {
    return (
      <div className="glass-panel border border-vapor/10 rounded-sm p-12 text-center">
        <Database size={32} className="text-vapor/30 mx-auto mb-4" />
        <p className="text-vapor/50 font-mono-tech text-sm">No migration report found.</p>
      </div>
    );
  }

  const fmtDate = (d) => d ? new Date(d).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' }) : '—';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-grotesk font-bold text-vapor">Migration Report</h1>
        <span className="text-xs font-mono-tech tracking-widest text-vapor/40">{fmtDate(report.completed_at)}</span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <SummaryStat icon={Users} label="CUSTOMERS CREATED" value={report.customers_created || 0} />
        <SummaryStat icon={Car} label="VEHICLES MIGRATED" value={report.vehicles_migrated || 0} />
        <SummaryStat icon={Briefcase} label="JOBS CREATED" value={report.jobs_created || 0} />
        <SummaryStat icon={CreditCard} label="MEMBERSHIPS MIGRATED" value={report.subscriptions_migrated || 0} />
      </div>

      <div className="glass-panel border border-gold/25 rounded-sm p-6 bg-gold/[0.03]">
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle size={16} className="text-gold" />
          <h2 className="text-xs font-mono-tech tracking-widest text-gold">RECORDS REQUIRING MANUAL REVIEW ({report.manual_review?.length || 0})</h2>
        </div>
        {report.manual_review?.length ? (
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {report.manual_review.map((item, i) => (
              <div key={i} className="text-xs font-mono-tech bg-asphalt/50 border border-vapor/10 rounded-sm p-3">
                <span className="text-gold/80 uppercase">{item.type}</span>
                <span className="text-vapor/60 ml-2">{item.year} {item.make} {item.model || item.vehicle_id || item.subscription_id}</span>
                <div className="text-vapor/40 mt-1">Flags: {item.flags?.join(', ')}</div>
              </div>
            ))}
          </div>
        ) : <p className="text-vapor/40 font-mono-tech text-sm">None — all records migrated cleanly.</p>}
      </div>

      {report.skipped?.length > 0 && (
        <div className="glass-panel border border-red-500/25 rounded-sm p-6">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle size={16} className="text-red-400" />
            <h2 className="text-xs font-mono-tech tracking-widest text-red-400">SKIPPED RECORDS ({report.skipped.length})</h2>
          </div>
          <div className="space-y-2">
            {report.skipped.map((s, i) => (
              <div key={i} className="text-xs font-mono-tech bg-asphalt/50 border border-vapor/10 rounded-sm p-3">
                <span className="text-red-300/80 uppercase">{s.entity}</span>
                <span className="text-vapor/60 ml-2">{s.id || s.email}</span>
                <div className="text-red-300/40 mt-1">{s.reason}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="glass-panel border border-vapor/10 rounded-sm p-6">
        <div className="flex items-center gap-2 mb-4">
          <Info size={16} className="text-vapor/50" />
          <h2 className="text-xs font-mono-tech tracking-widest text-vapor/60">ASSUMPTIONS MADE DURING MIGRATION</h2>
        </div>
        <ul className="space-y-3">
          {report.assumptions?.map((a, i) => (
            <li key={i} className="flex items-start gap-2 text-xs font-mono-tech text-vapor/50 leading-relaxed">
              <CheckCircle2 size={14} className="text-gold/60 shrink-0 mt-0.5" />
              {a}
            </li>
          ))}
        </ul>
      </div>

      <div className="glass-panel border border-vapor/10 rounded-sm p-4 flex items-center gap-3">
        <FileText size={14} className="text-vapor/40" />
        <span className="text-xs font-mono-tech text-vapor/40">Event ID: {report.id}</span>
      </div>
    </div>
  );
}

function SummaryStat({ icon: Icon, label, value }) {
  return (
    <div className="glass-panel border border-vapor/10 rounded-sm p-4">
      <Icon size={18} className="text-gold/60 mb-3" />
      <p className="text-2xl font-grotesk font-bold text-vapor">{value}</p>
      <p className="text-xs font-mono-tech tracking-widest text-vapor/40 mt-1">{label}</p>
    </div>
  );
}