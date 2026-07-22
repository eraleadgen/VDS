// Create Quote — ERA Core Phase 4
// POST /functions/createQuote
// Creates a price quote for a customer. Reads pricing from BusinessConfig (never hardcoded).
// GoHighLevel has been fully removed. Links to the Customer entity (find-or-create).
// Logs a quote_generated event via logEvent. SMS consent is snapshotted from the Customer.
// Protected by SCHEDULER_TOKEN — internal calls only (valerieTools, website, admin).

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.39';
import { findOrCreateCustomer } from '../../shared/customer.ts';

function toE164(phone) {
  if (!phone) return '';
  let d = phone.replace(/\D/g, '');
  if (d.length === 10) d = '1' + d;
  return d.length >= 10 ? '+' + d : '';
}

async function loadConfig(base44) {
  const configs = await base44.asServiceRole.entities.BusinessConfig.filter({ is_active: true });
  return configs && configs[0] ? configs[0] : null;
}

function resolvePricingGroup(cfg, classification, legacyType) {
  const map = cfg.classification_to_pricing_group || {};
  if (classification && map[classification]) return map[classification];
  if (legacyType === 'truck_suv') return 'truck_suv';
  return 'sedan_coupe';
}

// Find-or-create a Customer via the shared helper (canonical E.164 + last-10-digit fallback).
async function ensureCustomer(base44, phone, name, email) {
  const firstName = (name || '').split(' ')[0] || '';
  const lastName = (name || '').split(' ').slice(1).join(' ') || '';
  const { customer } = await findOrCreateCustomer(base44, { phone, firstName, lastName, email });
  return customer;
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

    const { customer_name, customer_phone, customer_email, vehicle_year, vehicle_make, vehicle_model,
            vehicle_classification, vehicle_type, services, ai_notes } = body;

    if (!customer_phone || !services || !Array.isArray(services) || services.length === 0) {
      return Response.json({ error: 'customer_phone and services[] are required.' }, { status: 400 });
    }

    const cfg = await loadConfig(base44);
    if (!cfg) return Response.json({ error: 'BusinessConfig not found.' }, { status: 500 });

    const pricingGroup = resolvePricingGroup(cfg, vehicle_classification, vehicle_type);
    const bookingUrl = (cfg.website_links && cfg.website_links.booking_url) || 'https://vdsmobile.com/book';

    let totalPrice = 0;
    const lineItems = [];
    for (const svcKey of services) {
      const svc = (cfg.services || []).find(s => s.key === svcKey);
      if (!svc) continue;
      const tier = (svc.tiers || []).find(t => t.tier === pricingGroup) || (svc.tiers || [])[0];
      if (!tier) continue;
      if (!svc.requires_consultation && tier.price != null) totalPrice += tier.price;
      lineItems.push({ service: svcKey, label: svc.label, price: svc.requires_consultation ? null : tier.price });
    }

    const vehicleDesc = [vehicle_year, vehicle_make, vehicle_model].filter(Boolean).join(' ') || 'Vehicle';
    const summaryLines = lineItems.map(i => i.price != null ? `${i.label} — $${i.price}` : `${i.label} — Consultation Required`);
    const quoteSummary = `Quote for ${vehicleDesc}:\n${summaryLines.join('\n')}\nStarting at $${totalPrice}`;

    // Find-or-create customer, snapshot consent.
    const customer = await ensureCustomer(base44, customer_phone, customer_name, customer_email);
    const customerName = customer ? [customer.first_name, customer.last_name].filter(Boolean).join(' ') : (customer_name || 'Unknown');
    const customerEmail = customer?.email || customer_email || '';
    const smsConsent = customer?.sms_consent ?? true;

    const expiration = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const quote = await base44.asServiceRole.entities.Quote.create({
      customer_name: customerName, customer_phone: toE164(customer_phone), customer_email: customerEmail,
      vehicle_year: vehicle_year || '', vehicle_make: vehicle_make || '', vehicle_model: vehicle_model || '',
      vehicle_type: pricingGroup, requested_services: services,
      starting_price: totalPrice, final_price: totalPrice,
      quote_summary: quoteSummary, booking_url: bookingUrl,
      expiration_date: expiration, status: 'pending', sms_consent: smsConsent,
      ai_notes: ai_notes || '',
    });

    // Log the quote generation event.
    try {
      await base44.asServiceRole.functions.invoke('logEvent', {
        event_type: 'quote_generated', entity_type: 'quote', entity_id: quote.id,
        customer_id: customer?.id || null, description: `Quote generated: ${quoteSummary}`,
        metadata: { pricing_group: pricingGroup, total: totalPrice, services },
        scheduler_token: SCHEDULER_TOKEN,
      });
    } catch (e) { console.error('logEvent error:', e.message); }

    return Response.json({
      success: true, quote_id: quote.id, customer_id: customer?.id || null,
      starting_price: totalPrice, quote_summary: quoteSummary, booking_url: bookingUrl,
    });
  } catch (error) {
    console.error('createQuote error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});