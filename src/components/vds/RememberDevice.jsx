export default function RememberDevice({ checked, onChange }) {
  return (
    <label className="flex items-center gap-2.5 cursor-pointer select-none group">
      <input
        type="checkbox"
        checked={checked}
        onChange={e => onChange(e.target.checked)}
        className="w-4 h-4 accent-[#D4AF37] bg-asphalt border border-vapor/20 rounded-sm cursor-pointer"
      />
      <span className="text-xs font-mono-tech text-vapor/50 group-hover:text-vapor/70 transition-colors">
        Remember this device for 30 days
      </span>
    </label>
  );
}