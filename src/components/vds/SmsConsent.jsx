// Reusable A2P 10DLC-compliant SMS opt-in consent block.
// Renders an UNCHECKED affirmative opt-in checkbox with full disclosure language.
export default function SmsConsent({ checked, onChange, id = 'sms_consent', required = true }) {
  return (
    <label htmlFor={id} className="flex items-start gap-3 cursor-pointer group select-none">
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        required={required}
        className="mt-0.5 accent-gold w-4 h-4 shrink-0 cursor-pointer"
      />
      <span className="text-xs text-vapor/40 font-mono-tech leading-relaxed group-hover:text-vapor/60 transition-colors">
        I agree to receive SMS messages from VDS Mobile regarding my quote, appointment, and customer support. Message frequency varies. Message &amp; data rates may apply. Reply STOP to opt out.
      </span>
    </label>
  );
}