// Reusable A2P 10DLC-compliant SMS opt-in consent block.
// Renders an UNCHECKED affirmative opt-in checkbox with full disclosure language.
// Optional by default (required=false): the form is submittable with it left unchecked,
// in which case the Customer record is tagged sms_consent:false and the Communication
// Rules Engine will not send them SMS. Phone remains a required field independent of this.
import { useBusinessName } from '@/lib/BusinessConfigContext';

export default function SmsConsent({ checked, onChange, id = 'sms_consent', required = false }) {
  const businessName = useBusinessName();
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
        I agree to receive text messages from {businessName}, including appointment confirmations and reminders. Message frequency varies. Msg &amp; data rates may apply. Reply STOP to unsubscribe, HELP for help.
      </span>
    </label>
  );
}