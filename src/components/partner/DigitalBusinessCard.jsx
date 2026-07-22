import { Printer, Phone, Star, Share2, Download } from 'lucide-react';
import GoldShimmer from '@/components/vds/GoldShimmer';

const LOGO = "https://media.base44.com/images/public/6a191df337222815cd0b1f5e/6a27779cd_1773368635248-a065bd31-ddf6-4b1c-87dc-3a6080dc60f8.png";
const PHONE = "(470) 412-8986";
const qrUrl = (data) => `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(data)}`;

const initials = (name) => (name || '')
  .split(' ').filter(Boolean).slice(0, 2).map(s => s[0]?.toUpperCase() || '').join('') || '◆';

export default function DigitalBusinessCard({ partner }) {
  const referralUrl = `${window.location.origin}/${partner.referral_code}`;
  const isFounding = partner.is_founding_partner;

  const printCard = () => {
    const w = window.open('', '_blank');
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${partner.name} — VDS Partner Card</title>
      <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&family=Space+Mono:wght@400;700&display=swap" rel="stylesheet">
      <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'Space Grotesk', system-ui, sans-serif; background: #0A0B0D; color: #E2E8F0; display: flex; justify-content: center; padding: 24px; }
        .card { position: relative; width: 3.5in; max-width: 100%; background: linear-gradient(165deg, #14161A 0%, #0A0B0D 100%); border: 1px solid rgba(212,175,55,0.45); border-radius: 14px; padding: 30px 28px 26px; text-align: center; overflow: hidden; box-shadow: 0 20px 60px rgba(0,0,0,0.6); }
        .card::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 3px; background: linear-gradient(90deg, transparent, #D4AF37, transparent); }
        .eyebrow { font-family: 'Space Mono', monospace; font-size: 10px; letter-spacing: 4px; color: #D4AF37; text-transform: uppercase; margin-bottom: 14px; }
        .logo { height: 42px; margin: 0 auto 18px; display: block; }
        .photo { width: 88px; height: 88px; border-radius: 50%; object-fit: cover; border: 2px solid #D4AF37; margin: 0 auto 14px; display: block; box-shadow: 0 0 24px rgba(212,175,55,0.25); }
        .mono { width: 88px; height: 88px; border-radius: 50%; margin: 0 auto 14px; display: flex; align-items: center; justify-content: center; border: 2px solid #D4AF37; font-family: 'Space Grotesk', sans-serif; font-size: 30px; font-weight: 700; color: #D4AF37; background: rgba(212,175,55,0.06); }
        .name { font-size: 21px; font-weight: 700; color: #D4AF37; letter-spacing: 0.5px; }
        .dealership { font-size: 10px; color: #E2E8F0; opacity: 0.55; letter-spacing: 2.5px; text-transform: uppercase; margin-top: 6px; font-family: 'Space Mono', monospace; }
        .founder { display: inline-block; margin-top: 10px; font-family: 'Space Mono', monospace; font-size: 9px; letter-spacing: 2px; color: #D4AF37; border: 1px solid rgba(212,175,55,0.5); padding: 3px 8px; border-radius: 999px; text-transform: uppercase; }
        .divider { height: 1px; background: linear-gradient(90deg, transparent, rgba(212,175,55,0.4), transparent); margin: 18px 0; }
        .qr-wrap { width: 150px; height: 150px; margin: 0 auto 12px; padding: 9px; background: #fff; border-radius: 10px; border: 1px solid rgba(212,175,55,0.4); box-shadow: 0 0 30px rgba(212,175,55,0.15); }
        .qr-wrap img { width: 100%; height: 100%; }
        .link { font-size: 11px; color: #D4AF37; word-break: break-all; font-family: 'Space Mono', monospace; letter-spacing: 0.5px; }
        .blurb { font-size: 11px; color: #E2E8F0; opacity: 0.6; line-height: 1.6; margin: 16px 0 0; }
        .row { display: flex; justify-content: center; align-items: center; gap: 14px; font-size: 11px; color: #E2E8F0; opacity: 0.75; font-family: 'Space Mono', monospace; border-top: 1px solid rgba(212,175,55,0.25); padding-top: 14px; margin-top: 18px; }
        .dot { width: 3px; height: 3px; border-radius: 50%; background: #D4AF37; }
        @media print { body { padding: 0; background: #fff; } }
      </style></head>
      <body>
        <div class="card">
          <div class="eyebrow">VDS Partner Network</div>
          <img class="logo" src="${LOGO}" alt="VDS Mobile" />
          ${partner.photo_url ? `<img class="photo" src="${partner.photo_url}" alt="${partner.name}" />` : `<div class="mono">${initials(partner.name)}</div>`}
          <div class="name">${partner.name}</div>
          <div class="dealership">${partner.dealership || 'VDS Partner'}</div>
          ${isFounding ? `<div class="founder">★ Founding Partner</div>` : ''}
          <div class="divider"></div>
          <div class="qr-wrap"><img src="${qrUrl(referralUrl)}" alt="Referral QR" /></div>
          <div class="link">${referralUrl}</div>
          <p class="blurb">Premium mobile auto detailing — ceramic coatings, paint correction & full detailing, brought directly to you and backed by the VDS Gold membership.</p>
          <div class="row"><span>${PHONE}</span><span class="dot"></span><span>vdsmobile.com</span></div>
        </div>
        <script>window.onload = () => setTimeout(() => window.print(), 600);</script>
      </body></html>`;
    w.document.write(html); w.document.close(); w.focus();
  };

  const shareCard = async () => {
    if (navigator.share) {
      try { await navigator.share({ title: `${partner.name} — VDS Mobile`, text: `Book your VDS Mobile detail through my link:`, url: referralUrl }); }
      catch (_) {}
    } else {
      navigator.clipboard?.writeText(referralUrl);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-grotesk font-bold text-vapor">Digital Business Card</h1>
          <p className="text-sm text-vapor/50 font-mono-tech mt-1">Share your referral link — every booking through your card is attributed to you.</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={shareCard} className="flex items-center gap-2 text-xs font-mono-tech text-vapor/70 hover:text-gold border border-vapor/15 hover:border-gold/40 px-4 py-2.5 rounded-sm transition-colors">
            <Share2 size={13} /> SHARE
          </button>
          <button onClick={printCard} className="flex items-center gap-2 text-xs font-mono-tech text-gold border border-gold/30 bg-gold/10 hover:bg-gold/20 px-4 py-2.5 rounded-sm transition-colors">
            <Printer size={13} /> PRINT
          </button>
        </div>
      </div>

      {/* Premium card */}
      <div className="relative max-w-sm mx-auto">
        <div className="micro-bead-border glass-panel rounded-md overflow-hidden" style={{ boxShadow: '0 24px 70px rgba(0,0,0,0.55), 0 0 0 1px rgba(212,175,55,0.12)' }}>
          {/* Top gold hairline */}
          <div className="h-[2px] w-full" style={{ background: 'linear-gradient(90deg, transparent, #D4AF37 50%, transparent)' }} />

          <div className="px-7 pt-7 pb-7 text-center">
            {/* Eyebrow */}
            <p className="text-[10px] font-mono-tech tracking-[0.4em] text-gold/80 mb-5">VDS PARTNER NETWORK</p>

            {/* Logo */}
            <img src={LOGO} alt="VDS Mobile" className="h-10 mx-auto mb-6 opacity-90" />

            {/* Photo / monogram */}
            {partner.photo_url ? (
              <div className="relative w-[88px] h-[88px] mx-auto mb-4">
                <div className="absolute inset-0 rounded-full" style={{ boxShadow: '0 0 28px rgba(212,175,55,0.35)' }} />
                <img src={partner.photo_url} alt={partner.name} className="w-full h-full rounded-full object-cover border-2 border-gold relative" />
              </div>
            ) : (
              <div className="w-[88px] h-[88px] mx-auto mb-4 rounded-full flex items-center justify-center border-2 border-gold text-3xl font-grotesk font-bold text-gold" style={{ background: 'rgba(212,175,55,0.06)' }}>
                {initials(partner.name)}
              </div>
            )}

            {/* Name */}
            <h2 className="text-xl font-grotesk font-bold tracking-wide">
              <GoldShimmer>{partner.name}</GoldShimmer>
            </h2>
            <p className="text-[10px] font-mono-tech tracking-[0.25em] text-vapor/55 mt-2 uppercase">{partner.dealership || 'VDS Partner'}</p>

            {isFounding && (
              <span className="inline-flex items-center gap-1 mt-3 text-[9px] font-mono-tech tracking-[0.2em] text-gold border border-gold/50 bg-gold/10 px-2.5 py-1 rounded-full uppercase">
                <Star size={9} className="fill-gold" /> Founding Partner
              </span>
            )}

            {/* Divider */}
            <div className="h-px my-5" style={{ background: 'linear-gradient(90deg, transparent, rgba(212,175,55,0.45), transparent)' }} />

            {/* QR */}
            <div className="w-[150px] h-[150px] mx-auto mb-3 p-2 bg-white rounded-lg border border-gold/40" style={{ boxShadow: '0 0 30px rgba(212,175,55,0.18)' }}>
              <img src={qrUrl(referralUrl)} alt="Referral QR" className="w-full h-full" />
            </div>
            <code className="text-[11px] font-mono-tech text-gold/90 break-all tracking-wide">{referralUrl}</code>

            <p className="text-[11px] text-vapor/55 mt-5 leading-relaxed">
              Premium mobile auto detailing — ceramic coatings, paint correction &amp; full detailing, brought directly to you and backed by the VDS Gold membership.
            </p>

            {/* Footer */}
            <div className="flex items-center justify-center gap-3 mt-5 pt-4 border-t border-gold/20 text-[11px] font-mono-tech text-vapor/65">
              <span className="inline-flex items-center gap-1.5"><Phone size={10} className="text-gold/70" /> {PHONE}</span>
              <span className="w-1 h-1 rounded-full bg-gold/70" />
              <span>vdsmobile.com</span>
            </div>
          </div>
        </div>
      </div>

      <p className="text-center text-[10px] font-mono-tech tracking-widest text-vapor/30">
        <Download size={10} className="inline mr-1.5 -translate-y-px" />TAP PRINT FOR A READY-TO-HAND-OUT PHYSICAL CARD
      </p>
    </div>
  );
}