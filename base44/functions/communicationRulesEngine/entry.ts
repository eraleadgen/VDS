// Communication Rules Engine — ERA Core Phase 3
// POST /functions/communicationRulesEngine
// Centralized evaluator for ALL outbound messages in ERA Core. Every outbound message
// must be evaluated here before delivery. Checks: feature flags, customer consent,
// review status, marketing preferences, and message type.
//
// Returns: { allowed, channel: 'sms'|'email'|'suppressed', reason }
// Suppressed messages are logged to SystemEventLog with the suppression reason.
// Protected by SCHEDULER_TOKEN — internal calls only (never callable by end users).

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.39';
import { getInternalBusinessId } from '../../shared/tenantContext.ts';

function toE164(phone) {
  if (!phone) return '';
  let d = phone.replace(/\D/g, '');
  if (d.length === 10) d = '1' + d;
  return d.length >= 10 ? '+' + d : '';
}

async function loadConfig(base44, businessId) {
  const configs = await base44.asServiceRole.entities.BusinessConfig.filter({ business_id: businessId, is_active: true });
  return configs && configs[0] ? configs[0] : null;
}

// Resolve a Customer by id, or by phone (E.164 exact, then last-10-digit match).
async function resolveCustomer(base44, customerId, phone, businessId) {
  if (customerId) {
    const c = await base44.asServiceRole.entities.Customer.get(customerId).catch(() => null);
    // Tenant guard: asServiceRole bypasses RLS — reject cross-tenant customer lookups.
    if (c && c.business_id && c.business_id !== businessId) return null;
    return c;
  }
  if (phone) {
    const e164 = toE164(phone);
    let customers = await base44.asServiceRole.entities.Customer.filter({ business_id: businessId, phone: e164 }).catch(() => []);
    if (!customers.length) {
      const d = phone.replace(/\D/g, '');
      if (d.length >= 10) {
        const all = await base44.asServiceRole.entities.Customer.filter({ business_id: businessId }).catch(() => []);
        customers = (all || []).filter(c => (c.phone || '').replace(/\D/g, '').slice(-10) === d.slice(-10));
      }
    }
    return customers[0] || null;
  }
  return null;
}

async function logSuppression(base44, customer, messageType, reason) {
  try {
    await base44.asServiceRole.functions.invoke('logEvent', {
      event_type: 'message_suppressed',
      entity_type: 'customer',
      entity_id: customer?.id || null,
      customer_id: customer?.id || null,
      description: `Outbound '${messageType}' message suppressed: ${reason}`,
      suppression_reason: reason,
      metadata: { message_type: messageType, reason },
      scheduler_token: Deno.env.get('SCHEDULER_TOKEN'),
    });
  } catch (e) { console.error('log suppression error:', e.message); }
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));

    const SCHEDULER_TOKEN = Deno.env.get('SCHEDULER_TOKEN');
    if (!SCHEDULER_TOKEN || body.scheduler_token !== SCHEDULER_TOKEN) {
      return Response.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    const { customer_id, customer_phone, message_type } = body;
    if (!message_type) return Response.json({ error: 'message_type is required.' }, { status: 400 });

    const businessId = getInternalBusinessId(body);
    const cfg = await loadConfig(base44, businessId);
    const flags = (cfg && cfg.feature_flags) || {};
    const twilioEnabled = flags.twilio_sms_enabled === true;

    const customer = await resolveCustomer(base44, customer_id, customer_phone, businessId);

    // ── Review request suppression ──
    // A customer who already submitted a review or opted out never gets another review request.
    if (message_type === 'review_request') {
      const reviewStatus = customer?.review_status || 'no_review';
      if (reviewStatus === 'review_submitted') {
        await logSuppression(base44, customer, message_type, 'review_already_submitted');
        return Response.json({ allowed: false, channel: 'suppressed', reason: 'review_already_submitted', customer_id: customer?.id || null });
      }
      if (reviewStatus === 'review_opt_out') {
        await logSuppression(base44, customer, message_type, 'review_opt_out');
        return Response.json({ allowed: false, channel: 'suppressed', reason: 'review_opt_out', customer_id: customer?.id || null });
      }
    }

    // ── Marketing suppression ──
    if (message_type === 'marketing') {
      const smsPromo = customer?.marketing_preferences?.sms_promotions;
      if (smsPromo === false) {
        await logSuppression(base44, customer, message_type, 'opted_out_promotions');
        return Response.json({ allowed: false, channel: 'suppressed', reason: 'opted_out_promotions', customer_id: customer?.id || null });
      }
    }

    // ── Feature flag: SMS disabled until A2P 10DLC is approved ──
    // When the flag is off, route to email fallback if the customer is a registered user with email + consent.
    if (!twilioEnabled) {
      if (customer?.email && customer.email_consent !== false && customer.linked_user_id) {
        return Response.json({ allowed: true, channel: 'email', reason: 'flag_disabled_email_fallback', customer_id: customer.id, customer_email: customer.email });
      }
      await logSuppression(base44, customer, message_type, 'flag_disabled');
      return Response.json({ allowed: false, channel: 'suppressed', reason: 'flag_disabled', customer_id: customer?.id || null });
    }

    // ── SMS enabled — check customer consent ──
    if (customer?.sms_consent === false) {
      // No SMS consent — route to email fallback if possible.
      if (customer?.email && customer.email_consent !== false && customer.linked_user_id) {
        return Response.json({ allowed: true, channel: 'email', reason: 'no_sms_consent_email_fallback', customer_id: customer.id, customer_email: customer.email });
      }
      await logSuppression(base44, customer, message_type, 'no_sms_consent');
      return Response.json({ allowed: false, channel: 'suppressed', reason: 'no_sms_consent', customer_id: customer?.id || null });
    }

    // ── All checks passed — SMS allowed ──
    return Response.json({
      allowed: true,
      channel: 'sms',
      reason: 'approved',
      customer_id: customer?.id || null,
      customer_phone: customer?.phone || toE164(customer_phone || ''),
    });
  } catch (error) {
    console.error('communicationRulesEngine error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});