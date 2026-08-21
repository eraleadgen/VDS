// ERA's real logo (teal wordmark + metallic silver circular-arrow mark) on its
// native black background. Rendered inside a black rounded chip so the logo's
// own black field becomes the chip — works on any page background.
const LOGO_URL = 'https://media.base44.com/images/public/6a191df337222815cd0b1f5e/b68e16deb_ERALogo-Photoroom.png';

export default function EraLogo({ size = 30, withChip = true, className = '' }) {
  const img = (
    <img src={LOGO_URL} alt="ERA Systems" style={{ height: size }} className="w-auto block" />
  );
  if (!withChip) return <div className={className}>{img}</div>;
  return (
    <div
      className={`inline-flex items-center justify-center bg-black rounded-[7px] ring-1 ring-white/15 shrink-0 ${className}`}
      style={{ padding: Math.round(size * 0.16) }}
    >
      {img}
    </div>
  );
}