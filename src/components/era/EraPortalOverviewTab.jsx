import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { ArrowRight, ShieldCheck, Clock, Globe } from 'lucide-react';

function timeLeft(deadline) {
  if (!deadline) return null;
  const ms = new Date(deadline).getTime() - Date.now();
  if (ms <= 0) return 'Review window elapsed';
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  return h > 0 ? `${h}h ${m}m remaining` : `${m}m remaining`;
}

export default function EraPortalOverviewTab({ account, summary, reviewStatus, reviewDeadline, siteUrl, planTier, onNavigate }) {
  const [me, setMe] = useState(null);
  useEffect(() => { base44.auth.me().then(setMe).catch(() => {}); }, []);
  const firstName = (me?.full_name || account?.email || 'there').split(' ')[0] || 'there';
  const pending = reviewStatus === 'pending_review';
  const rejected = reviewStatus === 'rejected';
  const business = summary?.business;

  return (
    <div className="space-y-6">
      <div>
        <p className="text-[10px] font-mono-tech tracking-[0.3em] text-gold/70 mb-1">ERA MEMBER PORTAL</p>
        <h1 className="text-3xl font-grotesk font-bold text-vapor">WELCOME, {firstName.toUpperCase()}</h1>
        <p className="text-sm font-mono-tech text-vapor/40 mt-1">{account?.email}</p>
      </div>

      {pending && (
        <div className="rounded-md border border-gold/30 bg-gold/5 p-5">
          <div className="flex items-center gap-2 mb-2">
            <Clock size={16} className="text-gold" />
            <p className="text-xs font-mono-tech tracking-widest text-gold">PENDING ERA REVIEW</p>
          </div>
          <p className="text-vapor text-sm">
            Your site is live and being audited by ERA Systems. Operational tools unlock once approved — usually within 24 hours.
          </p>
          <p className="text-vapor/50 text-xs font-mono-tech mt-2">{timeLeft(reviewDeadline)}</p>
        </div>
      )}
      {rejected && (
        <div className="rounded-md border border-red-500/30 bg-red-500/5 p-5">
          <p className="text-xs font-mono-tech tracking-widest text-red-400 mb-2">REVIEW NEEDS ATTENTION</p>
          <p className="text-vapor text-sm">{account?.review_notes || 'ERA Systems found items that need attention before your tools unlock. Please contact support.'}</p>
        </div>
      )}
      {reviewStatus === 'approved' && (
        <div className="rounded-md border border-gold/20 bg-asphalt/40 p-5 flex items-center gap-3">
          <ShieldCheck size={18} className="text-gold" />
          <p className="text-vapor text-sm">Your ERA Core site is reviewed and fully live. All tools for your tier are unlocked.</p>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-4">
        <div className="rounded-md border border-vapor/10 bg-asphalt/40 p-5">
          <p className="text-[10px] font-mono-tech tracking-widest text-vapor/40 mb-2">PLAN</p>
          <p className="text-2xl font-grotesk font-bold text-gold capitalize">{planTier}</p>
          <button onClick={() => onNavigate('plan')} className="mt-3 text-xs font-mono-tech tracking-widest text-gold/80 hover:text-gold flex items-center gap-1">
            MANAGE PLAN <ArrowRight size={12} />
          </button>
        </div>
        <div className="rounded-md border border-vapor/10 bg-asphalt/40 p-5">
          <p className="text-[10px] font-mono-tech tracking-widest text-vapor/40 mb-2">YOUR WEBSITE</p>
          {siteUrl ? (
            <>
              <p className="text-sm font-mono-tech text-vapor truncate">{siteUrl.replace('https://', '')}</p>
              <a href={`${siteUrl}/admin`} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-1 text-xs font-mono-tech tracking-widest text-gold/80 hover:text-gold">
                OPEN DASHBOARD <ArrowRight size={12} />
              </a>
            </>
          ) : (
            <p className="text-sm text-vapor/40">Provisioning…</p>
          )}
        </div>
      </div>

      {business && (
        <div className="rounded-md border border-vapor/10 bg-asphalt/40 p-5">
          <p className="text-[10px] font-mono-tech tracking-widest text-vapor/40 mb-3">BUSINESS</p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
            <div><p className="text-vapor/40 text-xs font-mono-tech">NAME</p><p className="text-vapor">{business.business_name}</p></div>
            <div><p className="text-vapor/40 text-xs font-mono-tech">DOMAIN</p><p className="text-vapor">{business.custom_domain || 'Temp subdomain'}</p></div>
            <div><p className="text-vapor/40 text-xs font-mono-tech">EMAIL</p><p className="text-vapor capitalize">{business.email_mode}</p></div>
          </div>
        </div>
      )}
    </div>
  );
}