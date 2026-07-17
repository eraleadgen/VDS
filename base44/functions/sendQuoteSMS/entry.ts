// Send quote via SMS through GoHighLevel workflow trigger.
// Called by Retell AI after customer confirms they want the quote texted.

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const RETELL_API_KEY = Deno.env.get('RETELL_API_KEY');
    const auth = req.headers.get('Authorization') || '';
    const provided = auth.replace(/^Bearer\s+/i, '').trim();
    if (!RETELL_API_KEY || !provided || provided !== RETELL_API_KEY) return Response.json({ error: 'Unauthorized.' }, { status: 401 });

    const base44 = createClientFromRequest(req);
    const { quote_id, call_id } = await req.json();

    if (!quote_id) {
      return Response.json({ error: 'quote_id is required.' }, { status: 400 });
    }

    const quote = await base44.asServiceRole.entities.Quote.get(quote_id);
    if (!quote) {
      return Response.json({ error: 'Quote not found.' }, { status: 404 });
    }

    // No SMS consent → deliver quote via email instead of SMS
    if (quote.sms_consent === false) {
      if (!quote.customer_email) {
        return Response.json({ success: false, error: 'Customer did not consent to SMS and has no email on file — cannot deliver quote.' }, { status: 400 });
      }
      try {
        const FONT = "'Space Grotesk','Segoe UI',Roboto,Helvetica,Arial,sans-serif";
        const MONO = "'Space Mono','Courier New',monospace";
        const firstName = (quote.customer_name || '').split(' ')[0] || 'there';
        const html = `<!DOCTYPE html><html lang="en" style="margin:0;padding:0;"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background-color:#0A0B0D;font-family:${FONT};color:#E2E8F0;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#0A0B0D;">
<tr><td align="center" style="padding:32px 16px;">
<table role="presentation" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background-color:#14161A;border-radius:14px;overflow:hidden;border:1px solid rgba(212,175,55,0.15);box-shadow:0 8px 30px rgba(0,0,0,0.5);">
  <tr><td style="background-color:#0A0B0D;padding:22px 28px;border-bottom:2px solid #D4AF37;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
    <td style="font-size:18px;font-weight:700;letter-spacing:3px;color:#FFFFFF;">VDS&nbsp;MOBILE</td>
    <td align="right" style="font-family:${MONO};font-size:11px;letter-spacing:2px;color:#D4AF37;font-weight:700;text-transform:uppercase;">Your Quote</td>
  </tr></table></td></tr>
  <tr><td style="padding:28px 28px 6px 28px;">
    <p style="margin:0 0 6px 0;font-family:${MONO};font-size:12px;letter-spacing:2px;text-transform:uppercase;color:#D4AF37;font-weight:700;">Quote from VDS Mobile</p>
    <h1 style="margin:0;font-size:24px;line-height:32px;color:#E2E8F0;font-weight:700;">Hi ${firstName},</h1>
  </td></tr>
  <tr><td style="padding:14px 28px 0 28px;">
    <p style="margin:0 0 16px 0;font-size:15px;line-height:25px;color:#CBD5E1;">Here's your detailing quote from VDS Mobile:</p>
  </td></tr>
  <tr><td style="padding:16px 28px 8px 28px;background-color:#0F1115;">
    <p style="margin:0 0 12px 0;padding-top:14px;font-family:${MONO};font-size:12px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#D4AF37;">Quote Summary</p>
    <p style="margin:0;font-size:15px;line-height:25px;color:#E2E8F0;white-space:pre-wrap;">${(quote.quote_summary || '').replace(/</g, '&lt;')}</p>
  </td></tr>
  <tr><td style="padding:20px 28px 8px 28px;">
    <p style="margin:0 0 8px 0;font-size:15px;line-height:25px;color:#CBD5E1;">Ready to book? Visit <a href="${quote.booking_url || '#'}" style="color:#D4AF37;text-decoration:none;">our booking page</a> or call/text us at <strong style="color:#D4AF37;">(470) 412-8986</strong>.</p>
  </td></tr>
  <tr><td style="background-color:#0A0B0D;padding:22px 28px;border-top:2px solid #D4AF37;">
    <p style="margin:0 0 6px 0;font-size:15px;color:#E2E8F0;font-weight:600;">&mdash; The VDS Mobile Team</p>
    <p style="margin:0 0 4px 0;font-family:${MONO};font-size:13px;line-height:22px;color:#94A3B8;"><a href="mailto:support@vdsmobile.com" style="color:#D4AF37;text-decoration:none;">support@vdsmobile.com</a></p>
    <p style="margin:0;font-family:${MONO};font-size:11px;color:#64748B;letter-spacing:0.5px;">&copy; ${new Date().getUTCFullYear()} VALET DETAILING SERVICE LLC. ALL RIGHTS RESERVED.</p>
  </td></tr>
</table></td></tr></table></body></html>`;
        await base44.asServiceRole.integrations.Core.SendEmail({
          to: quote.customer_email,
          subject: 'Your VDS Mobile Detailing Quote',
          body: html,
          from_name: 'VDS Mobile',
        });
        await base44.asServiceRole.entities.Quote.update(quote_id, { status: 'sent', sms_sent: false });
        return Response.json({ success: true, sms_sent: false, email: true });
      } catch (e) {
        console.error('Quote email failed:', e.message);
        return Response.json({ success: false, error: e.message }, { status: 500 });
      }
    }

    const GHL_API_KEY = Deno.env.get('GHL_API_KEY');
    const GHL_LOCATION_ID = Deno.env.get('GHL_LOCATION_ID');

    if (!GHL_API_KEY || !GHL_LOCATION_ID) {
      console.log('GHL not configured — SMS skipped for quote:', quote_id);
      await base44.asServiceRole.entities.Quote.update(quote_id, { status: 'sent', sms_sent: false });
      return Response.json({ success: true, sms_sent: false, note: 'GHL not configured' });
    }

    // Find GHL contact by phone
    let contactId = null;
    const phone = quote.customer_phone;
    if (phone) {
      const searchRes = await fetch(
        `https://services.leadconnectorhq.com/contacts/?locationId=${GHL_LOCATION_ID}&phone=${encodeURIComponent(phone)}`,
        { headers: { 'Authorization': `Bearer ${GHL_API_KEY}`, 'Version': '2021-07-28' } }
      );
      if (searchRes.ok) {
        const d = await searchRes.json();
        contactId = d?.contacts?.[0]?.id || null;
      }
    }

    if (!contactId) {
      console.error('GHL contact not found for phone:', phone);
      return Response.json({ success: false, error: 'GHL contact not found. Cannot send SMS.' }, { status: 404 });
    }

    // Send SMS via GHL conversations
    const message = `Hi ${quote.customer_name || 'there'}! Here's your VDS quote:\n\n${quote.quote_summary}\n\nReady to book? ${quote.booking_url}`;
    const smsRes = await fetch('https://services.leadconnectorhq.com/conversations/messages', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${GHL_API_KEY}`, 'Content-Type': 'application/json', 'Version': '2021-07-28' },
      body: JSON.stringify({
        type: 'SMS',
        contactId,
        message,
      }),
    });

    const smsSent = smsRes.ok;
    if (!smsSent) {
      console.error('GHL SMS failed:', smsRes.status, await smsRes.text());
    }

    // Update quote status
    await base44.asServiceRole.entities.Quote.update(quote_id, { status: 'sent', sms_sent: smsSent });

    // Log interaction
    try {
      await base44.asServiceRole.entities.AILog.create({
        call_id: call_id || '',
        action: 'send_quote_sms',
        customer_phone: quote.customer_phone,
        customer_name: quote.customer_name || '',
        outcome: smsSent ? 'info_provided' : 'error',
        quote_id,
        raw_request: JSON.stringify({ quote_id }),
        raw_response: JSON.stringify({ sms_sent: smsSent }),
      });
    } catch (e) { console.error('AILog error:', e.message); }

    return Response.json({ success: true, sms_sent: smsSent });

  } catch (error) {
    console.error('sendQuoteSMS error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});