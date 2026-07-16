import { Link } from 'react-router-dom';

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
        I consent to receive SMS text messages from Valet Detailing Service LLC (VDS Mobile) at the phone number provided, including appointment confirmations, reminders, service updates, and promotional offers. Message frequency varies. Reply <span className="text-vapor">STOP</span> to opt out or <span className="text-vapor">HELP</span> for help. Message &amp; data rates may apply. I am 18 years of age or older. Mobile carriers are not liable for delayed or undelivered messages. Consent is not a condition of any purchase. See our{' '}
        <Link to="/terms" className="text-gold/60 hover:text-gold underline">Terms</Link>{' '}and{' '}
        <Link to="/privacy" className="text-gold/60 hover:text-gold underline">Privacy Policy</Link>.
      </span>
    </label>
  );
}