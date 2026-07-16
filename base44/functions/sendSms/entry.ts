import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') return Response.json({ error: 'Admin only.' }, { status: 403 });

    const body = await req.json();
    const { to, content, customer_name } = body || {};
    if (!to || !content) return Response.json({ error: 'to and content are required.' }, { status: 400 });

    // Always log the outbound reply in conversation history
    await base44.asServiceRole.entities.ConversationHistory.create({
      customer_phone: to,
      customer_name: customer_name || '',
      role: 'assistant',
      content,
    });

    const sid = Deno.env.get('TWILIO_ACCOUNT_SID');
    const token = Deno.env.get('TWILIO_AUTH_TOKEN');
    const from = Deno.env.get('TWILIO_FROM_NUMBER');
    if (!sid || !token || !from) {
      return Response.json({ stored: true, sent: false, message: 'Message logged. Twilio not configured — SMS not sent.' });
    }

    const url = `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`;
    const params = new URLSearchParams({ From: from, To: to, Body: content });
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: 'Basic ' + btoa(`${sid}:${token}`),
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      console.error('Twilio send error:', data);
      return Response.json({ stored: true, sent: false, message: 'Message logged but Twilio send failed: ' + (data?.message || res.status) });
    }
    return Response.json({ stored: true, sent: true });
  } catch (error) {
    console.error('sendSms error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});