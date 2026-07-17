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
        I agree to receive SMS messages from Valet Detailing Service LLC (VDS Mobile) regarding quotes, appointment confirmations, reminders, service updates, and customer support.<br /><br />
        Message frequency varies. Message and data rates may apply. Reply STOP to unsubscribe or HELP for assistance. Consent is not a condition of purchase.
      </span>
    </label>
  );
}