// Hybrid customer email delivery — closes the guest-confirmation gap.
// The platform's built-in Core.SendEmail only reaches REGISTERED app users; guests
// (non-registered) receive nothing, and SMS is suppressed until Twilio A2P 10DLC is
// approved. This helper auto-routes each customer email:
//   1. Registered recipient → platform Core.SendEmail (existing member behavior).
//   2. Guest recipient → external ESP (Resend) via the RESEND_API_KEY secret, which
//      delivers to any address, independent of Twilio.
// SMS remains the primary channel once Twilio is approved (handled elsewhere by the
// Communication Rules Engine); this guarantees guests still get their booking
// confirmation, reminders, and review requests even while SMS is off.
//
// Returns { channel: 'platform'|'esp'|'none', sent: boolean, error?: string } so callers
// can log outcomes to the System Event Log without parsing exceptions.

export async function sendCustomerEmail(base44, { to, subject, html, fromName }) {
  if (!to) return { channel: 'none', sent: false, error: 'no recipient' };

  // 1) Registered app user → platform SendEmail (reaches the member's inbox, no ESP quota used).
  let registered = false;
  try {
    const users = await base44.asServiceRole.entities.User.filter({ email: to });
    registered = !!(users && users.length > 0);
  } catch (_e) {
    // If the User lookup fails, treat as guest and fall through to the ESP path so the
    // message still goes out rather than silently dropping.
  }

  if (registered) {
    try {
      await base44.asServiceRole.integrations.Core.SendEmail({
        to,
        subject,
        body: html,
        from_name: fromName || undefined,
      });
      return { channel: 'platform', sent: true };
    } catch (e) {
      // Rare platform failure — fall through to ESP as a safety net.
      console.error('platform SendEmail failed, falling back to ESP:', e.message);
    }
  }

  // 2) Guest (or platform failure) → external ESP (Resend).
  const apiKey = Deno.env.get('RESEND_API_KEY');
  if (!apiKey) {
    return { channel: 'esp', sent: false, error: 'RESEND_API_KEY not set' };
  }
  const fromAddress = Deno.env.get('RESEND_FROM_EMAIL') || 'no-reply@detailing.app';
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: fromAddress, to, subject, html }),
    });
    if (!res.ok) {
      const text = await res.text();
      return { channel: 'esp', sent: false, error: `Resend ${res.status}: ${text}` };
    }
    return { channel: 'esp', sent: true };
  } catch (e) {
    return { channel: 'esp', sent: false, error: e.message };
  }
}