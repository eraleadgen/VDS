import { useState } from 'react';
import { Copy, Check, Download, Printer } from 'lucide-react';

const qrUrl = (data, fmt = 'png') => `https://api.qrserver.com/v1/create-qr-code/?size=600x600&data=${encodeURIComponent(data)}&format=${fmt}`;

async function downloadImage(url, filename) {
  try {
    const res = await fetch(url);
    const blob = await res.blob();
    const objUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = objUrl; a.download = filename; document.body.appendChild(a); a.click(); a.remove();
    URL.revokeObjectURL(objUrl);
  } catch (e) { window.open(url, '_blank'); }
}

export default function ReferralCard({ partner }) {
  const [copied, setCopied] = useState(false);
  const referralUrl = `${window.location.origin}/book?ref=${partner.referral_code}`;

  const copy = () => { navigator.clipboard?.writeText(referralUrl); setCopied(true); setTimeout(() => setCopied(false), 1500); };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-grotesk font-bold text-vapor">Your Referral QR Code</h1>
        <p className="text-sm text-vapor/50 font-mono-tech mt-1">Every customer who scans this code is automatically attributed to you. No manual entry.</p>
      </div>

      <div className="glass-panel border border-gold/20 rounded-sm p-6 flex flex-col sm:flex-row items-center gap-6">
        <div className="bg-white p-3 rounded-sm shrink-0">
          <img src={qrUrl(referralUrl)} alt="Referral QR Code" width={180} height={180} className="w-[180px] h-[180px]" />
        </div>
        <div className="flex-1 min-w-0 w-full space-y-3">
          <div>
            <p className="text-[10px] font-mono-tech tracking-widest text-vapor/40 mb-1">YOUR REFERRAL LINK</p>
            <div className="flex items-center gap-2">
              <code className="text-xs font-mono-tech text-gold bg-gold/5 border border-gold/20 px-3 py-2 rounded-sm break-all flex-1">{referralUrl}</code>
              <button onClick={copy} className="flex items-center gap-1.5 text-xs font-mono-tech text-vapor/70 hover:text-gold border border-vapor/20 px-3 py-2 rounded-sm shrink-0">
                {copied ? <Check size={13} /> : <Copy size={13} />}
              </button>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => downloadImage(qrUrl(referralUrl, 'png'), `${partner.referral_code}-qr.png`)} className="flex items-center gap-2 text-xs font-mono-tech text-gold border border-gold/30 bg-gold/10 hover:bg-gold/20 px-4 py-2.5 rounded-sm">
              <Download size={13} /> DOWNLOAD PNG
            </button>
            <button onClick={() => downloadImage(qrUrl(referralUrl, 'svg'), `${partner.referral_code}-qr.svg`)} className="flex items-center gap-2 text-xs font-mono-tech text-vapor/70 hover:text-gold border border-vapor/20 px-4 py-2.5 rounded-sm">
              <Download size={13} /> DOWNLOAD SVG
            </button>
            <button onClick={() => window.open(qrUrl(referralUrl), '_blank')} className="flex items-center gap-2 text-xs font-mono-tech text-vapor/70 hover:text-gold border border-vapor/20 px-4 py-2.5 rounded-sm">
              <Printer size={13} /> PRINT
            </button>
          </div>
          <p className="text-[11px] text-vapor/40 font-mono-tech">Printable on business cards, brochures, table displays, and digital materials.</p>
        </div>
      </div>
    </div>
  );
}