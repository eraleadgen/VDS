import { Printer } from 'lucide-react';

const LOGO = "https://media.base44.com/images/public/6a191df337222815cd0b1f5e/6a27779cd_1773368635248-a065bd31-ddf6-4b1c-87dc-3a6080dc60f8.png";
const PHONE = "(470) 412-8986";
const qrUrl = (data) => `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(data)}`;

export default function DigitalBusinessCard({ partner }) {
  const referralUrl = `${window.location.origin}/book?ref=${partner.referral_code}`;

  const printCard = () => {
    const w = window.open('', '_blank');
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${partner.name} — VDS Business Card</title>
      <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'Space Grotesk', system-ui, sans-serif; background: #0A0B0D; color: #E2E8F0; display: flex; justify-content: center; padding: 24px; }
        .card { width: 3.5in; max-width: 100%; background: linear-gradient(160deg, #14161A, #0A0B0D); border: 1px solid rgba(212,175,55,0.35); border-radius: 12px; padding: 28px; text-align: center; }
        .logo { height: 40px; margin-bottom: 18px; }
        .photo { width: 84px; height: 84px; border-radius: 50%; object-fit: cover; border: 2px solid #D4AF37; margin: 0 auto 14px; display: block; }
        .name { font-size: 20px; font-weight: 700; color: #D4AF37; }
        .dealership { font-size: 12px; color: #E2E8F099; letter-spacing: 1px; text-transform: uppercase; margin-top: 4px; }
        .qr { width: 140px; height: 140px; background: #fff; padding: 8px; border-radius: 8px; margin: 20px auto 14px; }
        .link { font-size: 11px; color: #D4AF37; word-break: break-all; font-family: 'Space Mono', monospace; }
        .blurb { font-size: 12px; color: #E2E8F0AA; line-height: 1.5; margin: 16px 0 14px; }
        .row { display: flex; justify-content: center; gap: 18px; font-size: 12px; color: #E2E8F0CC; font-family: 'Space Mono', monospace; border-top: 1px solid rgba(212,175,55,0.2); padding-top: 14px; }
        @media print { body { padding: 0; background: #fff; } .card { border-color: #D4AF37; } }
      </style></head>
      <body>
        <div class="card">
          <img class="logo" src="${LOGO}" alt="VDS Mobile" />
          ${partner.photo_url ? `<img class="photo" src="${partner.photo_url}" alt="${partner.name}" />` : ''}
          <div class="name">${partner.name}</div>
          <div class="dealership">${partner.dealership || ''}</div>
          <img class="qr" src="${qrUrl(referralUrl)}" alt="Referral QR" />
          <div class="link">${referralUrl}</div>
          <p class="blurb">VDS Mobile brings premium mobile auto detailing directly to you — ceramic coatings, paint correction, and full detailing services backed by the VDS Gold membership.</p>
          <div class="row"><span>${PHONE}</span><span>VDS Mobile</span></div>
        </div>
        <script>window.onload = () => setTimeout(() => window.print(), 500);</script>
      </body></html>`;
    w.document.write(html); w.document.close(); w.focus();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-grotesk font-bold text-vapor">Digital Business Card</h1>
          <p className="text-sm text-vapor/50 font-mono-tech mt-1">Mobile-friendly and printable. Share your card with any customer.</p>
        </div>
        <button onClick={printCard} className="flex items-center gap-2 text-xs font-mono-tech text-gold border border-gold/30 bg-gold/10 hover:bg-gold/20 px-4 py-2.5 rounded-sm">
          <Printer size={13} /> PRINT CARD
        </button>
      </div>

      <div className="glass-panel border border-gold/20 rounded-sm p-6 max-w-md mx-auto text-center">
        <img src={LOGO} alt="VDS Mobile" className="h-10 mx-auto mb-4" />
        {partner.photo_url && <img src={partner.photo_url} alt={partner.name} className="w-20 h-20 rounded-full object-cover border-2 border-gold mx-auto mb-3" />}
        <p className="text-lg font-grotesk font-bold text-gold">{partner.name}</p>
        <p className="text-xs font-mono-tech tracking-widest text-vapor/50 mt-1">{partner.dealership || ''}</p>
        <div className="bg-white p-2 rounded-sm w-36 h-36 mx-auto my-4">
          <img src={qrUrl(referralUrl)} alt="Referral QR" width={128} height={128} className="w-full h-full" />
        </div>
        <code className="text-[11px] font-mono-tech text-gold break-all">{referralUrl}</code>
        <p className="text-xs text-vapor/50 mt-4 leading-relaxed">VDS Mobile brings premium mobile auto detailing directly to you — ceramic coatings, paint correction, and full detailing services backed by the VDS Gold membership.</p>
        <div className="flex items-center justify-center gap-5 mt-4 pt-4 border-t border-gold/20 text-xs font-mono-tech text-vapor/60">
          <span>{PHONE}</span><span>VDS Mobile</span>
        </div>
      </div>
    </div>
  );
}