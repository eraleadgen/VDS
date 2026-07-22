import { Printer, Gift, Network, Wrench, Share2, CreditCard, Phone } from 'lucide-react';
import printHtml from '@/components/shared/printHtml';

// Context-aware printable Welcome Packet.
// variant: 'partner' | 'specialist' | 'admin'
// admin renders a partner-preview packet so admins can see what partners receive.
const PACKETS = {
  partner: {
    eyebrow: 'VDS Partner Network · Welcome Packet',
    title: 'Welcome to the VDS Partner Network',
    sub: 'Everything you need to start earning from every referral',
    icon: Network,
    heading: 'Your Partner Welcome Packet',
    intro: 'As a VDS Partner, you earn attribution on every customer who books through your referral link — including future ceramic coatings and paint corrections, for the life of the customer relationship.',
    sections: [
      { h: 'How Referrals Work', body: 'Every partner receives a unique referral code and referral link. When a customer books through your link, they are tagged to you in our system. Attribution lasts for the lifetime of that customer — even if they purchase a coating months later.', icon: Share2 },
      { h: 'Your Referral Link', body: 'Visit the Referral Link tab to view, copy, and share your unique referral link and QR code. Share the link via text or display the QR code at the dealership. Every scan routes to the booking page with your code baked in.', icon: CreditCard },
      { h: 'What Counts as a Conversion', body: 'A referral converts when the customer pays for a service. Conversions, total revenue, Gold memberships generated, and ceramic coatings generated all appear on your Overview dashboard.', icon: Gift },
      { h: 'Founding Partners', body: 'Founding Partners are the earliest members of the VDS Partner Network. As a Founding Partner, you receive priority communication from VDS, early access to new features, and a permanent badge recognizing your role in building the network.', icon: Network },
      { h: 'Support', body: 'For questions about referrals, payouts, or your card, contact the VDS team at Valetdetailingservice@gmail.com or (470) 412-8986.', icon: Phone },
    ],
  },
  specialist: {
    eyebrow: 'VDS Specialist Portal · Welcome Packet',
    title: 'Welcome to the VDS Specialist Team',
    sub: 'Your guide to the portal, jobs & completion workflow',
    icon: Wrench,
    heading: 'Your Specialist Welcome Packet',
    intro: 'As an independent VDS specialist, you control your schedule, service areas, and availability. The portal is your command center for every job.',
    sections: [
      { h: 'Set Your Availability', body: 'In the Availability tab, set your recurring weekly hours and any blocked dates. The scheduling engine uses these to auto-assign jobs that match your skills and service area.', icon: Wrench },
      { h: 'Job Lifecycle', body: 'Assigned → Accepted → Driving → Arrived → In Progress → Quality Check → Completed → Photos Uploaded. Update your job status from the Jobs tab as you progress; customers are notified at key milestones.', icon: Share2 },
      { h: 'Completion & Photos', body: 'When you finish a job, submit before/after photos and completion notes. These power customer deliverables and your performance metrics.', icon: Gift },
      { h: 'Reviews & Upsells', body: 'Request a review after a quality job, and recommend upsells (coatings, Gold membership) where appropriate. These drive your conversion metrics.', icon: Network },
      { h: 'Support', body: 'For scheduling issues or account help, contact the VDS team at Valetdetailingservice@gmail.com or (470) 412-8986.', icon: Phone },
    ],
  },
  admin: null, // admins see the partner packet as a preview
};

const buildPrintHtml = (variant) => {
  const p = PACKETS[variant] || PACKETS.partner;
  return `
    <div class="eyebrow">${p.eyebrow}</div>
    <h1>${p.title}</h1>
    <div class="sub">${p.sub}</div>
    <div class="callout"><p>${p.intro}</p></div>
    ${p.sections.map(s => `
      <h2>${s.h}</h2>
      <p>${s.body}</p>
    `).join('<div class="sep"></div>')}
    <div class="foot">Valet Detailing Service LLC · (470) 412-8986 · vdsmobile.com</div>
  `;
};

export default function WelcomePacket({ variant }) {
  const isAdmin = variant === 'admin';
  const p = isAdmin ? PACKETS.partner : (PACKETS[variant] || PACKETS.partner);
  const Icon = p.icon;

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="w-11 h-11 rounded-sm flex items-center justify-center border border-gold/40 text-gold bg-gold/10 shrink-0">
            <Icon size={18} />
          </div>
          <div>
            <h2 className="text-xl font-grotesk font-bold text-vapor">{p.heading}</h2>
            <p className="text-sm text-vapor/50 font-mono-tech mt-1">{p.sub}</p>
          </div>
        </div>
        <button onClick={() => printHtml(p.title, buildPrintHtml(isAdmin ? 'partner' : variant))} className="flex items-center gap-2 text-xs font-mono-tech text-gold border border-gold/30 bg-gold/10 hover:bg-gold/20 px-4 py-2.5 rounded-sm transition-colors shrink-0">
          <Printer size={13} /> PRINT PACKET
        </button>
      </div>

      {isAdmin && (
        <div className="glass-panel border border-gold/20 bg-gold/5 rounded-sm p-3 text-xs font-mono-tech text-gold/80">
          ADMIN PREVIEW — This is the welcome packet your partners see in their portal.
        </div>
      )}

      <div className="glass-panel border border-gold/15 rounded-sm p-6">
        <div className="h-px mb-5" style={{ background: 'linear-gradient(90deg, transparent, rgba(212,175,55,0.45), transparent)' }} />
        <p className="text-sm text-vapor/75 leading-relaxed mb-5">{p.intro}</p>
        <div className="space-y-5">
          {p.sections.map((s) => {
            const SIcon = s.icon;
            return (
              <div key={s.h} className="flex gap-4">
                <div className="w-8 h-8 rounded-sm flex items-center justify-center border border-vapor/15 text-gold/80 shrink-0 mt-0.5">
                  <SIcon size={14} />
                </div>
                <div>
                  <h3 className="text-sm font-grotesk font-semibold text-vapor mb-1">{s.h}</h3>
                  <p className="text-sm text-vapor/60 leading-relaxed">{s.body}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}