import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';
import { findOrCreateCustomer } from '../../shared/customer.ts';

// ── Per-IP rate limiter (per-isolate) — protects public booking from spam / resource exhaustion ──
const _rlHits = new Map();
function rateLimit(key, max, windowMs) {
  const now = Date.now();
  const hits = (_rlHits.get(key) || []).filter(ts => now - ts < windowMs);
  if (hits.length >= max) return false;
  hits.push(now);
  _rlHits.set(key, hits);
  return true;
}
function clientIp(req) {
  const fwd = req.headers.get('x-forwarded-for');
  if (fwd) return fwd.split(',')[0].trim();
  return req.headers.get('x-real-ip') || 'unknown';
}

// ERA Core booking submission.
// Base44 (Customer + Job entities) is the single source of truth.
// GoHighLevel has been eliminated — ERA Core is now the sole CRM and messaging system.
// Google Calendar remains as a mirror (valid integration via connector).

// Fallback service labels (no brand-specific text — live labels come from BusinessConfig.services).
const SERVICE_LABELS_FALLBACK = {
  exterior_detail: 'Exterior Detail',
  interior_detail: 'Interior Detail',
  full_detail: 'Full Interior + Exterior Detail',
  ceramic_coating: 'Ceramic Coating Consultation',
  paint_correction: 'Paint Correction Consultation',
};

function resolveServiceLabel(cfg, serviceType) {
  const svc = (cfg?.services || []).find(s => s.key === serviceType);
  if (svc && svc.label) return svc.label;
  return SERVICE_LABELS_FALLBACK[serviceType] || serviceType.replace(/_/g, ' ').toUpperCase();
}

function parseTimeTo24h(preferred_time) {
  if (!preferred_time) return { hours: 8, minutes: 0 };
  const [timePart, meridiem] = preferred_time.split(' ');
  let [hours, minutes] = timePart.split(':').map(Number);
  if (meridiem === 'PM' && hours !== 12) hours += 12;
  if (meridiem === 'AM' && hours === 12) hours = 0;
  return { hours, minutes };
}

function getTzOffsetMs(date, tz) {
  const tzDate = new Date(date.toLocaleString('en-US', { timeZone: tz }));
  const utcDate = new Date(date.toLocaleString('en-US', { timeZone: 'UTC' }));
  return tzDate.getTime() - utcDate.getTime();
}

function zonedToUtc(dateStr, timeStr, tz) {
  const wallAsUtc = new Date(`${dateStr}T${timeStr}:00.000Z`);
  return new Date(wallAsUtc.getTime() - getTzOffsetMs(wallAsUtc, tz));
}

async function gcalCreate(accessToken, event) {
  const res = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(event),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`GCal create ${res.status}: ${text}`);
  return text ? JSON.parse(text) : null;
}

// Helper: log an event to the centralized SystemEventLog
async function logEvent(base44, event) {
  try {
    await base44.functions.invoke('logEvent', {
      scheduler_token: Deno.env.get('SCHEDULER_TOKEN'),
      ...event,
    });
  } catch (e) {
    console.error('logEvent failed:', e.message);
  }
}

// Compute a job's estimated price server-side from BusinessConfig — never trust client input.
// When a quote_id is supplied, use the quote's final_price (quotes are priced server-side by
// saveQuote, so the value is trusted). Otherwise compute the starting price for the service +
// pricing group from the active BusinessConfig catalog.
async function computeJobPrice(base44, serviceType, pricingGroup, quoteId, businessId) {
  try {
    if (quoteId) {
      const q = await base44.asServiceRole.entities.Quote.get(quoteId).catch(() => null);
      if (q && q.final_price != null) {
        // Tenant guard: asServiceRole bypasses RLS — reject cross-tenant quote lookups.
        if (q.business_id && q.business_id !== businessId) return null;
        return q.final_price;
      }
    }
    const configs = await base44.asServiceRole.entities.BusinessConfig.filter({ business_id: businessId, is_active: true });
    const cfg = configs && configs[0];
    if (!cfg) return null;
    const svc = (cfg.services || []).find(s => s.key === serviceType);
    if (!svc) return null;
    const tier = (svc.tiers || []).find(t => t.tier === pricingGroup) || (svc.tiers || [])[0];
    return tier ? (tier.price || 0) : null;
  } catch (e) {
    console.error('computeJobPrice failed:', e.message);
    return null;
  }
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Parse body early — internal calls (webChat via scheduler_token) bypass the origin check.
    const body = await req.json().catch(() => ({}));
    const SCHEDULER_TOKEN = Deno.env.get('SCHEDULER_TOKEN');
    const isInternalCall = !!(SCHEDULER_TOKEN && body.scheduler_token === SCHEDULER_TOKEN);

    // Load active BusinessConfig early — drives the origin allowlist, service labels,
    // gold membership label, and Google Calendar branding (all dynamic for multi-tenant).
    let cfg = null;
    try {
      const configs = await base44.asServiceRole.entities.BusinessConfig.filter({ is_active: true });
      cfg = configs && configs[0];
    } catch (e) { console.error('Config load failed:', e.message); }

    // Single-tenant stopgap: derive business_id from the active BusinessConfig.
    // Phase 4: replace with origin → BusinessConfig resolution.
    const businessId = cfg?.business_id || 'vds';

    // Public endpoint (guests book without login) — strict origin allowlist.
    // Internal calls (webChat via scheduler_token) bypass the origin check and rate limit.
    // Tenant domains are derived from BusinessConfig website_links so a second tenant's
    // domain is automatically allowed without code changes.
    if (!isInternalCall) {
      const originHeader = req.headers.get('Origin') || req.headers.get('Referer') || '';
      let originHost = '';
      try { originHost = new URL(originHeader).host.toLowerCase(); } catch { originHost = ''; }
      const tenantHosts = [];
      if (cfg && cfg.website_links) {
        for (const url of Object.values(cfg.website_links)) {
          if (url) { try { tenantHosts.push(new URL(url).host.toLowerCase()); } catch {} }
        }
      }
      const allowed = tenantHosts.includes(originHost)
        || originHost === 'localhost'
        || originHost.endsWith('.localhost')
        || originHost.endsWith('.base44.app')
        || originHost.endsWith('.base44.com');
      if (!allowed) {
        return Response.json({ success: false, error: 'Forbidden — invalid origin.' }, { status: 403 });
      }

      // Per-IP rate limit — the origin allowlist is client-controlled; this is the real anti-spam control.
      const ip = clientIp(req);
      if (!rateLimit('submitBooking:' + ip, 8, 15 * 60 * 1000)) {
        return Response.json({ success: false, error: 'Too many booking attempts. Please try again later.' }, { status: 429 });
      }
    }

    // Auth is optional — guests can book without an account
    let user = null;
    try { user = await base44.auth.me(); } catch (e) { /* guest */ }

    const {
      name, phone, email, address,
      service_type, vehicle_type, vehicle_info, vehicle_classification,
      vehicle_details, notes,
      preferred_date, preferred_time, sms_consent, quote_id, partner_referral_code,
      referral_source,
    } = body;

    if (!name || !phone || !address || !service_type) {
      return Response.json({ success: false, error: 'Missing required fields.' }, { status: 400 });
    }

    const phoneDigits = phone.replace(/\D/g, '');
    if (phoneDigits.length < 7) {
      return Response.json({ success: false, error: 'Please enter a valid phone number.' }, { status: 400 });
    }

    // ── Duplicate booking check — same customer phone + same date, non-cancelled job ──
    if (preferred_date) {
      try {
        const dayJobs = await base44.asServiceRole.entities.Job.filter({ business_id: businessId, appointment_date: preferred_date });
        const dup = (dayJobs || []).find(j => j.status !== 'cancelled' &&
          (j.customer_phone || '').replace(/\D/g, '').slice(-10) === phoneDigits.slice(-10));
        if (dup) {
          return Response.json({ success: false, error: 'You already have an appointment booked for this date. To reschedule, please cancel your existing appointment first.' }, { status: 409 });
        }
      } catch (e) { console.error('Duplicate check error:', e.message); }
    }

    const firstName = name.split(' ')[0];
    const lastName = name.split(' ').slice(1).join(' ') || '';

    const vehicleEntries = vehicle_details
      ? vehicle_details.split(' | ').map(v => v.trim()).filter(Boolean)
      : [];
    const goldLabel = (cfg?.membership_plans?.[0]?.short_label) || (cfg?.membership_plans?.[0]?.label) || 'Gold';
    const isGoldBooking = vehicleEntries.some(e => e.toLowerCase().includes(goldLabel.toLowerCase()));

    // ── Find or create Customer (ERA Core CRM — shared helper) ────────────
    // Uses canonical E.164 phone + last-10-digit fallback so a customer who first
    // contacted via Valerie (E.164) isn't duplicated when booking on the website.
    let customer = null;
    let customerCreated = false;
    try {
      const result = await findOrCreateCustomer(base44, {
        phone: phoneDigits,
        firstName,
        lastName,
        email: email || null,
        linkedUserId: user ? user.id : null,
        address,
        smsConsent: sms_consent !== false,
        businessId,
      });
      customer = result.customer;
      customerCreated = result.created;
      if (customerCreated) {
        await logEvent(base44, {
          event_type: 'customer_created',
          business_id: businessId,
          entity_type: 'customer',
          entity_id: customer.id,
          customer_id: customer.id,
          description: `New customer created: ${name}`,
          metadata: { source: 'website_booking', linked_user_id: user ? user.id : null, email: email || null },
        });
      }
    } catch (e) {
      console.error('Customer find/create failed:', e.message);
    }

    // ── Resolve pricing group ─────────────────────────────────────────────
    const pricingGroup = (vehicle_type === 'truck_suv') ? 'truck_suv' : 'sedan_coupe';

    // ── Create Job (the operational hub — source of truth) ────────────────
    let job = null;
    let serviceLabel = '';
    try {
      serviceLabel = resolveServiceLabel(cfg, service_type);
      const servicesNotes = vehicleEntries.length > 0
        ? vehicleEntries.map((entry, idx) => {
            const parts = entry.split(' — ');
            const vehicleInfoClean = parts[0]?.replace(/\([^)]+\)/g, '').trim() || '';
            const service = parts[1] || '';
            return `${idx + 1}. ${vehicleInfoClean} — ${service}`;
          }).join('\n')
        : notes || '';

      // Compute the estimated price server-side from BusinessConfig (or the linked quote) —
      // never trust client-supplied pricing (prevents $0 / forged-price bookings).
      const estimatedPrice = await computeJobPrice(base44, service_type, pricingGroup, quote_id, businessId);

      job = await base44.asServiceRole.entities.Job.create({
        business_id: businessId,
        customer_id: customer ? customer.id : null,
        customer_name: name,
        customer_phone: phone,
        customer_email: email || '',
        vehicle_info: vehicle_info || 'TBD',
        vehicle_classification: vehicle_classification || null,
        pricing_group: pricingGroup,
        service_package: service_type,
        service_label: serviceLabel,
        appointment_date: preferred_date || null,
        appointment_time: preferred_time || null,
        address: address,
        status: 'appointment_scheduled',
        job_status: 'assigned',
        notes: servicesNotes,
        sms_consent: sms_consent !== false,
        estimated_duration_minutes: vehicleEntries.length > 0 ? Math.min(vehicleEntries.length, 4) * 120 : 120,
        estimated_price: estimatedPrice,
      });

      await logEvent(base44, {
        event_type: 'job_created',
        business_id: businessId,
        entity_type: 'job',
        entity_id: job.id,
        customer_id: customer ? customer.id : null,
        description: `Job created for ${name} — ${serviceLabel}`,
        metadata: { service_type, pricing_group: pricingGroup, preferred_date, preferred_time, is_gold: isGoldBooking },
      });

      await logEvent(base44, {
        event_type: 'appointment_scheduled',
        business_id: businessId,
        entity_type: 'job',
        entity_id: job.id,
        customer_id: customer ? customer.id : null,
        description: `Appointment scheduled for ${name} on ${preferred_date} at ${preferred_time}`,
        metadata: { service_type, preferred_date, preferred_time },
      });
    } catch (err) {
      console.error('Failed to create Job:', err.message);
    }

    // ── Partner Network: capture referral attribution + acquisition source ──
    // The customer is tagged with the referring partner the FIRST time they book via a partner
    // link. Attribution lives on the Customer record, so any later job for the same customer —
    // including a ceramic-coating purchase made after a consultation — automatically credits the
    // partner when its invoice is paid (see adminUpdateInvoice). The acquisition source
    // (Google, Partner Referral, etc.) is stamped first-touch on Customer.referral_source so
    // admins can see where each client came from in the Client Journey tab.
    try {
      const refCode = (partner_referral_code || '').trim();
      const source = refCode ? 'Partner Referral' : (referral_source || 'Website');
      if (customer && !customer.referral_source) {
        await base44.asServiceRole.entities.Customer.update(customer.id, { referral_source: source });
      }
      if (refCode && customer) {
        const partners = await base44.asServiceRole.entities.Partner.filter({ business_id: businessId, referral_code: refCode });
        const partner = partners && partners[0];
        if (partner) {
          if (!customer.referred_by_partner_id) {
            await base44.asServiceRole.entities.Customer.update(customer.id, { referred_by_partner_id: partner.id });
            await base44.asServiceRole.entities.Partner.update(partner.id, { referral_count: (partner.referral_count || 0) + 1 });
          }
          if (job) {
            const existing = await base44.asServiceRole.entities.PartnerReferral.filter({ business_id: businessId, job_id: job.id }).catch(() => []);
            if (!existing || !existing.length) {
              await base44.asServiceRole.entities.PartnerReferral.create({
                business_id: businessId,
                partner_id: partner.id, customer_id: customer.id, job_id: job.id,
                service_package: job.service_package || '', status: 'referred', revenue: 0, attributed: false,
              });
            }
          }
        }
      }
    } catch (e) { console.error('Partner referral capture failed:', e.message); }

    // ── Link the originating Quote (if this booking came from the pricing page) ──
    if (quote_id) {
      try {
        const q = await base44.asServiceRole.entities.Quote.get(quote_id).catch(() => null);
        // Tenant guard: asServiceRole bypasses RLS — only link quotes from the same tenant.
        if (q && (!q.business_id || q.business_id === businessId)) {
          await base44.asServiceRole.entities.Quote.update(q.id, {
            status: 'booked',
            customer_name: name,
            customer_phone: phone,
            customer_email: email || q.customer_email,
            job_id: job ? job.id : null,
          });
        }
      } catch (e) { console.error('Quote link failed:', e.message); }
    }

    // ── Create Appointment (DEPRECATED mirror — linked to Job) ────────────
    // Retained temporarily for scheduler + specialist portal compatibility.
    // Scheduled for removal once those systems migrate to the Job entity.
    let appt = null;
    try {
      const servicesNotes = vehicleEntries.length > 0
        ? vehicleEntries.map((entry, idx) => {
            const parts = entry.split(' — ');
            const vehicleInfoClean = parts[0]?.replace(/\([^)]+\)/g, '').trim() || '';
            const service = parts[1] || '';
            return `${idx + 1}. ${vehicleInfoClean} — ${service}`;
          }).join('\n')
        : notes || '';

      appt = await base44.asServiceRole.entities.Appointment.create({
        business_id: businessId,
        service_type,
        service_label: serviceLabel,
        vehicle_info: vehicle_info || 'TBD',
        preferred_date,
        preferred_time,
        status: 'confirmed',
        notes: servicesNotes,
        customer_name: name,
        customer_phone: phone,
        customer_email: email || '',
        service_address: address,
        sms_consent: sms_consent !== false,
        job_id: job ? job.id : null,
      });

      // Link the Job back to the Appointment
      if (job && appt) {
        try {
          await base44.asServiceRole.entities.Job.update(job.id, {});
        } catch (e) { console.error('Failed to link appointment to job:', e.message); }
      }
    } catch (err) {
      console.error('Failed to create Appointment entity:', err.message);
    }

    // ── Google Calendar mirror ────────────────────────────────────────────
    let gcalEventId = null;
    try {
      const tz = cfg?.timezone || 'America/New_York';

      const vehicleCount = Math.min(vehicleEntries.length || 1, 4);
      const durationHours = vehicleEntries.length > 0 ? vehicleCount * 2 : 2;
      const { hours, minutes } = parseTimeTo24h(preferred_time);
      const startUtc = zonedToUtc(preferred_date, `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`, tz);
      const endUtc = new Date(startUtc.getTime() + durationHours * 3600000);

      const vehicleLines = vehicleEntries.length > 0
        ? vehicleEntries.map((entry, i) => {
            const parts = entry.split(' — ');
            const vehicleInfoClean = parts[0]?.replace(/\([^)]+\)/g, '').trim();
            const serviceInfo = parts[1] || '';
            return `${i + 1}. ${vehicleInfoClean} — ${serviceInfo}`;
          }).join('\n')
        : (vehicle_info || 'N/A');

      const membershipTag = isGoldBooking ? `◆ ${goldLabel.toUpperCase()} MEMBER\n\n` : '';
      const description = [
        `${membershipTag}CLIENT:`,
        `Name: ${name}`,
        `Phone: ${phone}`,
        email ? `Email: ${email}` : null,
        `Address: ${address || 'N/A'}`,
        '',
        `APPOINTMENT:`,
        `Date: ${preferred_date}`,
        `Start: ${preferred_time}`,
        `Duration: ~${durationHours} hours`,
        `Service: ${serviceLabel}`,
        '',
        `VEHICLES (${vehicleCount}):`,
        vehicleLines,
        '',
        notes ? `Notes / Add-ons / Quote: ${notes}` : null,
      ].filter(v => v !== null).join('\n');

      const { accessToken } = await base44.asServiceRole.connectors.getConnection('googlecalendar');
      const created = await gcalCreate(accessToken, {
        summary: `${cfg?.business_name || 'Appointment'} — ${name} — ${vehicleCount} Vehicle${vehicleCount > 1 ? 's' : ''}${isGoldBooking ? ` ◆ ${goldLabel}` : ''}`,
        description,
        location: address || undefined,
        start: { dateTime: startUtc.toISOString(), timeZone: tz },
        end: { dateTime: endUtc.toISOString(), timeZone: tz },
        extendedProperties: { shared: { type: 'appointment' } },
      });
      gcalEventId = created?.id || null;

      if (gcalEventId) {
        if (job) {
          try {
            await base44.asServiceRole.entities.Job.update(job.id, { google_calendar_event_id: gcalEventId });
          } catch (e) { console.error('Failed to link GCal event to job:', e.message); }
        }
        if (appt) {
          try {
            await base44.asServiceRole.entities.Appointment.update(appt.id, {
              google_calendar_event_id: gcalEventId,
              estimated_duration_minutes: durationHours * 60,
            });
          } catch (e) { console.error('Failed to link GCal event to appointment:', e.message); }
        }
      }
    } catch (e) {
      console.error('Google Calendar mirror failed (non-blocking):', e.message);
    }

    // ── Auto-assign specialist via scheduler ──────────────────────────────
    if (appt) {
      try {
        const r = await base44.functions.invoke('scheduler', { action: 'auto_assign', business_id: businessId, appointment_id: appt.id, scheduler_token: Deno.env.get('SCHEDULER_TOKEN') });
        console.log('Auto-assign result:', JSON.stringify(r?.data || r));

        // Sync specialist info from the updated Appointment to the Job
        if (job) {
          try {
            const updatedAppt = await base44.asServiceRole.entities.Appointment.get(appt.id);
            const jobUpdates = {};
            if (updatedAppt?.contractor_id) {
              jobUpdates.specialist_id = updatedAppt.contractor_id;
              jobUpdates.specialist_name = updatedAppt.contractor_name || (cfg?.business_name || 'Specialist');
              jobUpdates.status = 'specialist_assigned';
            }
            if (Object.keys(jobUpdates).length > 0) {
              await base44.asServiceRole.entities.Job.update(job.id, jobUpdates);
              await logEvent(base44, {
                event_type: 'job_assigned',
                business_id: businessId,
                entity_type: 'job',
                entity_id: job.id,
                customer_id: customer ? customer.id : null,
                description: `Specialist assigned to job: ${jobUpdates.specialist_name}`,
                metadata: { specialist_id: jobUpdates.specialist_id },
              });
            }
          } catch (e) { console.error('Failed to sync specialist to job:', e.message); }
        }
      } catch (e) { console.error('Auto-assign contractor failed:', e.message); }
    }

    // ── Booking notifications ──────────────────────────────────────────────
    if (appt) {
      try {
        await base44.functions.invoke('sendBookingNotifications', {
          appointment_id: appt.id,
          business_id: businessId,
          scheduler_token: Deno.env.get('SCHEDULER_TOKEN'),
        });
      } catch (e) { console.error('Booking notifications failed:', e.message); }
    }

    return Response.json({ success: true, job_id: job?.id, customer_id: customer?.id, customer_created: customerCreated, google_calendar_event_id: gcalEventId });

  } catch (error) {
    console.error('submitBooking error:', error.message);
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
});