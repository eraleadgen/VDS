// supportContact — sends a help/support message from an authenticated user
// directly to support@eraleadgen.com (ERA Systems main support channel).
// Used by the Website Designer "Get Help" button and any other admin-facing
// support contact surface. The sender's email + tenant business name are
// included for context so support can reply by email.

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { getUserBusinessId } from '../../shared/tenantContext.ts';

const SUPPORT_EMAIL = 'support@eraleadgen.com';

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const me = await base44.auth.me();
    if (!me || !me.id) return Response.json({ error: 'Authentication required.' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const message = (body.message || '').trim();
    const subject = (body.subject || '').trim();
    const source = (body.source || 'Admin Dashboard').trim();
    if (!message) return Response.json({ error: 'Message is required.' }, { status: 400 });

    const businessId = await getUserBusinessId(base44, me);
    let businessName = '';
    try {
      const configs = await base44.asServiceRole.entities.BusinessConfig.filter({ business_id: businessId, is_active: true });
      if (configs && configs[0]) businessName = configs[0].business_name || '';
    } catch {}

    const emailBody = `New support request from the ${source}.

Business: ${businessName || '(unknown)'} (tenant: ${businessId})
User: ${me.email || me.full_name || me.id}

Message:
${message}

— Sent via the ERA Systems admin dashboard`;

    await base44.asServiceRole.integrations.Core.SendEmail({
      to: SUPPORT_EMAIL,
      subject: subject ? `[${source}] ${subject}` : `[${source}] Support request from ${businessName || me.email || 'admin'}`,
      body: emailBody,
    });

    return Response.json({ success: true });
  } catch (error) {
    console.error('supportContact error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
}