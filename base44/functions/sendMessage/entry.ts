// sendMessage — ERA Core Phase 3
// POST /functions/sendMessage
// The single outbound message dispatcher for ERA Core. Every outbound SMS/email routes
// here. Evaluates through the Communication Rules Engine, then delivers via the decided
// channel (Twilio SMS or SendEmail). All sent messages are logged to ConversationHistory
// (SMS) and SystemEventLog (all channels). Suppressed messages are logged by the engine.
// Protected by SCHEDULER_TOKEN — internal calls only.

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.39';

function toE164(phone) {
  if (!phone) return '';
  let d = phone.replace(/\D/g, '');
  if (d.length === 10) d = '1' + d;
  return d.length >= 10 ? '+' + d : '';
}

const SUBJECTS = {
  booking_confirmation: 'Your VDS Mobile Appointment is Confirmed',
  reminder_24h: 'VDS Mobile — Appointment Reminder',
  reminder_1h: 'VDS Mobile — Your Specialist is Coming',
  review_request: 'How was your VDS detail?',
  quote_delivery: 'Your VDS Mobile Quote',
  valerie_reply: 'VDS Mobile — Valerie',
  cancellation: 'VDS Mobile — Appointment Cancelled',
  completion: 'Your VDS detail is complete!',
  marketing: 'VDS Mobile',
};

async function sendTwilio(to, body) {
  const sid = Deno.env.get('TWILIO_ACCOUNT_SID');
  const token = Deno.env.get('TWILIO_AUTH_TOKEN');
  const from = Deno.env.get('TWILIO_FROM_NUMBER');
  if (!sid || !token || !from) return { sent: false, error: 'Twilio not configured.' };
  try {
    const url = `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`;
    const params = new URLSearchParams({ From: from, To: to, Body: body });
    const res = await fetch(url, {
      method: 'POST',
      headers: { Authorization: 'Basic ' + btoa(`${sid}:${token}`), 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
    });
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      return { sent: false, error: d?.message || `Twilio error ${res.status}` };
    }
    return { sent: true };
  } catch (e) {
    return { sent: false, error: e.message };
  }
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));

    const SCHEDULER_TOKEN = Deno.env.get('SCHEDULER_TOKEN');
    if (!SCHEDULER_TOKEN || body.scheduler_token !== SCHEDULER_TOKEN) {
      return Response.json({ error: 'Unauthorized.' }, { status: 401 });
    }
    delete body.scheduler_token;

    const { customer_id, customer_phone, message_type, content, subject, customer_name, email } = body;
    if (!message_type) return Response.json({ error: 'message_type is required.' }, { status: 400 });
    if (!content) return Response.json({ error: 'content is required.' }, { status: 400 });

    // ── Evaluate through the Communication Rules Engine ──
    const evalRes = await base44.asServiceRole.functions.invoke('communicationRulesEngine', {
      customer_id, customer_phone, message_type, scheduler_token: SCHEDULER_TOKEN,
    });
    const decision = evalRes?.data || evalRes;

    if (!decision || !decision.allowed) {
      return Response.json({ sent: false, channel: 'suppressed', reason: decision?.reason || 'unknown' });
    }

    // ── Deliver via SMS ──
    if (decision.channel === 'sms') {
      const to = toE164(decision.customer_phone || customer_phone);
      if (!to) return Response.json({ sent: false, channel: 'sms', error: 'No valid phone for SMS.' });
      const result = await sendTwilio(to, content);
      // Conversation history (audit trail — always logged, even if Twilio fails)
      try {
        await base44.asServiceRole.entities.ConversationHistory.create({
          customer_phone: to, customer_name: customer_name || '', role: 'assistant', content,
        });
      } catch (e) { console.error('history log error:', e.message); }
      // Delivery event
      try {
        await base44.asServiceRole.functions.invoke('logEvent', {
          event_type: 'message_sent', entity_type: 'customer', entity_id: decision.customer_id || null,
          customer_id: decision.customer_id || null,
          description: `'${message_type}' delivered via SMS`,
          metadata: { channel: 'sms', message_type, sent: result.sent },
          scheduler_token: SCHEDULER_TOKEN,
        });
      } catch (e) { console.error('log event error:', e.message); }
      return Response.json({ sent: result.sent, channel: 'sms', ...(result.sent ? {} : { error: result.error }) });
    }

    // ── Deliver via Email (registered users only — SendEmail limitation) ──
    if (decision.channel === 'email') {
      // When the caller already sent a branded HTML email directly (booking / cancellation /
      // reschedule notifications), suppress the plain-text SMS-to-email fallback so the
      // customer doesn't receive a duplicate, unstyled email.
      if (body.suppress_email_fallback) {
        try {
          await base44.asServiceRole.functions.invoke('logEvent', {
            event_type: 'message_suppressed', entity_type: 'customer',
            entity_id: decision.customer_id || null, customer_id: decision.customer_id || null,
            description: `'${message_type}' SMS email-fallback suppressed (branded email sent directly)`,
            suppression_reason: 'suppressed_email_fallback',
            metadata: { message_type, reason: 'suppressed_email_fallback' },
            scheduler_token: SCHEDULER_TOKEN,
          });
        } catch (e) { console.error('log suppression error:', e.message); }
        return Response.json({ sent: false, channel: 'suppressed', reason: 'suppressed_email_fallback' });
      }
      const to = decision.customer_email || email;
      if (!to) return Response.json({ sent: false, channel: 'email', error: 'No email address available.' });
      const emailSubject = subject || SUBJECTS[message_type] || 'VDS Mobile';
      try {
        await base44.asServiceRole.integrations.Core.SendEmail({
          to, subject: emailSubject, body: content, from_name: 'VDS Mobile',
        });
        await base44.asServiceRole.functions.invoke('logEvent', {
          event_type: 'message_sent', entity_type: 'customer', entity_id: decision.customer_id || null,
          customer_id: decision.customer_id || null,
          description: `'${message_type}' delivered via email`,
          metadata: { channel: 'email', message_type },
          scheduler_token: SCHEDULER_TOKEN,
        });
        return Response.json({ sent: true, channel: 'email' });
      } catch (e) {
        console.error('email send error:', e.message);
        return Response.json({ sent: false, channel: 'email', error: e.message });
      }
    }

    return Response.json({ sent: false, channel: 'unknown', error: 'Unknown delivery channel.' });
  } catch (error) {
    console.error('sendMessage error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});