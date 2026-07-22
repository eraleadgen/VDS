// Shared printable document helper — opens a styled, brand-matched window and triggers print.
// Used by the Resource Center guides and welcome packets so partners/specialists can save PDFs.
export default function printHtml(title, innerHtml, extraStyles = '') {
  const w = window.open('', '_blank');
  if (!w) { alert('Please allow pop-ups to print this document.'); return; }
  w.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>${title}</title>
    <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&family=Space+Mono:wght@400;700&display=swap" rel="stylesheet">
    <style>
      * { box-sizing: border-box; margin: 0; padding: 0; }
      body { font-family: 'Space Grotesk', system-ui, sans-serif; background: #0A0B0D; color: #E2E8F0; padding: 32px 16px; }
      .doc { position: relative; max-width: 740px; margin: 0 auto; background: linear-gradient(165deg, #14161A 0%, #0A0B0D 100%); border: 1px solid rgba(212,175,55,0.4); border-radius: 14px; padding: 44px 46px; overflow: hidden; box-shadow: 0 24px 70px rgba(0,0,0,0.6); }
      .doc::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 3px; background: linear-gradient(90deg, transparent, #D4AF37 50%, transparent); }
      .eyebrow { font-family: 'Space Mono', monospace; font-size: 10px; letter-spacing: 4px; color: #D4AF37; text-transform: uppercase; margin-bottom: 14px; }
      h1 { color: #D4AF37; font-size: 26px; margin-bottom: 6px; letter-spacing: 0.4px; font-weight: 700; }
      .sub { font-family: 'Space Mono', monospace; font-size: 11px; letter-spacing: 1px; color: #E2E8F0; opacity: 0.5; margin-bottom: 22px; }
      h2 { color: #D4AF37; font-size: 16px; margin: 26px 0 10px; letter-spacing: 0.3px; font-weight: 600; }
      h2:first-of-type { margin-top: 6px; }
      p { color: #E2E8F0; opacity: 0.8; font-size: 13.5px; line-height: 1.7; margin-bottom: 10px; }
      ul { padding-left: 20px; margin: 4px 0 12px; }
      li { color: #E2E8F0; opacity: 0.78; font-size: 13.5px; line-height: 1.7; margin-bottom: 6px; }
      .sep { height: 1px; background: linear-gradient(90deg, transparent, rgba(212,175,55,0.4), transparent); margin: 22px 0; }
      .callout { border: 1px solid rgba(212,175,55,0.35); background: rgba(212,175,55,0.06); border-radius: 10px; padding: 14px 16px; margin: 14px 0; }
      .callout p { opacity: 0.85; margin: 0; }
      .foot { margin-top: 28px; padding-top: 18px; border-top: 1px solid rgba(212,175,55,0.25); font-family: 'Space Mono', monospace; font-size: 10px; letter-spacing: 2px; color: #E2E8F0; opacity: 0.5; text-align: center; text-transform: uppercase; }
      ${extraStyles}
    </style></head><body><div class="doc">${innerHtml}</div>
    <script>window.onload = () => setTimeout(() => window.print(), 600);</script>
  </body></html>`);
  w.document.close(); w.focus();
}