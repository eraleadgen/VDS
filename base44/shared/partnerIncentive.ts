// ERA Core — Partner Network incentive credit for a VDS Gold membership signup.
//
// A Gold signup is a revenue event that earns the referring partner the one-time
// $30 "initial_detail" incentive — the SAME one-time-per-client incentive paid on a
// referred client's first paid detail job. So a client who books a detail first (credited
// via onInvoicePaid) and later signs up for Gold does NOT earn a second $30, and vice versa.
// Idempotency is enforced by the one-time-per-client check on incentive_type 'initial_detail'.
//
// Called from the Stripe webhook on checkout.session.completed for a Gold subscription.

import { findOrCreateCustomer } from './customer.ts';

export async function creditPartnerGoldSignup(base44, { userId, partnerRefCode, email, fullName, businessId = 'vds' }) {
  if (!partnerRefCode) return { credited: false, reason: 'no_code' };
  const code = String(partnerRefCode).trim();
  const partners = await base44.asServiceRole.entities.Partner.filter({ business_id: businessId, referral_code: code }).catch(() => []);
  const partner = partners && partners[0];
  if (!partner) return { credited: false, reason: 'no_partner' };

  // Resolve the customer by linked_user_id (the Gold checkout is authenticated). If the
  // member signed up for Gold before ever booking, no Customer record exists yet —
  // find-or-create one so the partner is still credited for the account/signup.
  let customer = null;
  if (userId) {
    const byUser = await base44.asServiceRole.entities.Customer.filter({ business_id: businessId, linked_user_id: userId }).catch(() => []);
    customer = byUser && byUser[0];
  }
  let created = false;
  if (!customer && userId) {
    try {
      const firstName = (fullName || '').split(' ')[0] || '';
      const lastName = (fullName || '').split(' ').slice(1).join(' ') || '';
      const result = await findOrCreateCustomer(base44, {
        phone: '', firstName, lastName, email: email || null, linkedUserId: userId,
      });
      customer = result.customer; created = result.created;
    } catch (e) { console.error('Gold signup customer find/create failed:', e.message); }
  }
  if (!customer) return { credited: false, reason: 'no_customer' };

  // Stamp the acquisition source first-touch (a Gold signup via a partner link).
  if (!customer.referral_source) {
    try {
      await base44.asServiceRole.entities.Customer.update(customer.id, { referral_source: 'Partner Referral' });
    } catch (e) { console.error('referral_source stamp failed:', e.message); }
  }

  // First-touch: tag the customer with the referring partner + bump referral_count.
  if (!customer.referred_by_partner_id) {
    await base44.asServiceRole.entities.Customer.update(customer.id, { referred_by_partner_id: partner.id });
    await base44.asServiceRole.entities.Partner.update(partner.id, {
      referral_count: (partner.referral_count || 0) + 1,
    });
  }

  // Resolve the one-time incentive amount from BusinessConfig (default $30).
  let incentiveAmount = 30;
  try {
    const cfgs = await base44.asServiceRole.entities.BusinessConfig.filter({ business_id: businessId, is_active: true });
    incentiveAmount = Number(cfgs?.[0]?.referral_program?.incentives?.initial_detail ?? 30) || 30;
  } catch (e) { console.error('Gold incentive config read failed:', e.message); }

  // One-time per client: skip if this partner+customer already earned the initial_detail incentive.
  const prior = await base44.asServiceRole.entities.PartnerReferral.filter({
    business_id: businessId, partner_id: partner.id, customer_id: customer.id, incentive_type: 'initial_detail',
  }).catch(() => []);
  const alreadyCredited = (prior || []).some(r => r.attributed);
  if (alreadyCredited) {
    // Still count the Gold membership generation even when no new cash incentive is due.
    await base44.asServiceRole.entities.Partner.update(partner.id, {
      gold_members_generated: (partner.gold_members_generated || 0) + 1,
    });
    return { credited: false, reason: 'already_credited', partnerId: partner.id };
  }

  await base44.asServiceRole.entities.PartnerReferral.create({
    business_id: businessId,
    partner_id: partner.id,
    customer_id: customer.id,
    job_id: null,
    service_package: 'vds_gold',
    status: 'converted',
    revenue: 0,
    attributed: true,
    incentive_type: 'initial_detail',
    incentive_amount: incentiveAmount,
  });

  await base44.asServiceRole.entities.Partner.update(partner.id, {
    conversions_count: (partner.conversions_count || 0) + 1,
    incentives_earned: (partner.incentives_earned || 0) + incentiveAmount,
    gold_members_generated: (partner.gold_members_generated || 0) + 1,
  });

  return { credited: true, partnerId: partner.id, customerId: customer.id, amount: incentiveAmount };
}