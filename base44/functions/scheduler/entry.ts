// VDS Scheduling API — Google Calendar + Contractor auto-assignment
// POST /functions/scheduler
// Base44 is the source of truth; Google Calendar stores the event mirror.
// Actions: check_availability, book, reschedule, cancel, reassign, update_job_status, list_contractors.
// Business hours, buffers, durations come from BusinessConfig.
// Contractor availability (recurring weekly + date blocks + service areas + skills) drives the scheduling engine.
// No clock in/out, timesheets, or shift tracking — contractors self-schedule availability and update job status.

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';
import { parseTimeTo24h } from '../../shared/timezone.ts';
import { gcal, removeGcalEvent } from '../../shared/gcal.ts';
import { autoAssign, weekdayKey, serviceToSkill, loadConfig, inAvailWindow, overlapsBusy, apptStartMs, apptEndMs } from '../../shared/autoAssign.ts';
import {
  adminContractors, adminChangeStatus, adminDeleteAppointment, adminBulkDeleteAppointments,
  adminAppointments, adminUpdateContractor, adminCreateContractor, adminSendSpecialistInvite,
  validateSpecialistToken, finalizeSpecialistSetup, adminDeleteContractor, adminMetrics,
  adminInvoices, adminUpdateInvoice, adminJobs, adminReassignJob, adminChangeJobStatus,
  adminDeleteJob, adminBulkDeleteJobs, adminArchiveQuote, adminQuotes,
} from '../../shared/adminHandlers.ts';

// weekdayKey, serviceToSkill, loadConfig, inAvailWindow, overlapsBusy, apptStartMs, apptEndMs,
// and autoAssign now live in base44/shared/autoAssign.ts (imported above).

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

// ── Timezone helpers (Deno runtime is UTC, so we convert wall times explicitly) ──
function getTzOffsetMs(date, tz) {
  const tzDate = new Date(date.toLocaleString('en-US', { timeZone: tz }));
  const utcDate = new Date(date.toLocaleString('en-US', { timeZone: 'UTC' }));
  return tzDate.getTime() - utcDate.getTime();
}
function zonedToUtc(dateStr, timeStr, tz) {
  const wallAsUtc = new Date(`${dateStr}T${timeStr}:00.000Z`);
  return new Date(wallAsUtc.getTime() - getTzOffsetMs(wallAsUtc, tz));
}
function utcToZonedTime(utcIso, tz) {
  return new Intl.DateTimeFormat('en-US', { timeZone: tz, hour12: false, hour: '2-digit', minute: '2-digit' }).format(new Date(utcIso));
}

function serviceInfo(cfg, serviceKey, tier) {
  for (const svc of (cfg.services || [])) {
    if (svc.key === serviceKey) {
      const t = (svc.tiers || []).find(x => x.tier === tier) || (svc.tiers || [])[0];
      return { duration: (t && t.duration_minutes) || 60, label: svc.label, price: t ? t.price : null };
    }
  }
  return { duration: 60, label: serviceKey || 'Service', price: null };
}
function dayHours(cfg, dateStr) {
  return (cfg.business_hours || []).find(h => h.day === weekdayKey(dateStr));
}
// gcal() + removeGcalEvent() now live in base44/shared/gcal.ts (imported above).

// ── Contractor helpers ──────────────────────────────────────────────────

// Active, enabled contractors with the required skill, available that weekday and not blocked on that date.
async function eligibleContractors(base44, cfg, dateStr, serviceKey) {
  const skill = serviceToSkill(serviceKey);
  const dayKey = weekdayKey(dateStr);
  const all = await base44.asServiceRole.entities.Contractor.filter({ status: 'active' });
  return all.filter(c => {
    if (c.is_enabled === false) return false;
    // A specialist with no skills listed is treated as a generalist (eligible for any service),
    // matching the auto-assignment logic so availability never under-reports bookable slots.
    if (skill && (c.skills || []).length && !(c.skills || []).includes(skill)) return false;
    if ((c.blocked_dates || []).some(b => b.date === dateStr)) return false;
    const dayAvail = (c.weekly_availability || []).find(a => a.day === dayKey);
    return !!(dayAvail && dayAvail.available);
  });
}

// All non-cancelled appointments for a given date (cached once per request).
async function dayAppointments(base44, dateStr) {
  const appts = await base44.asServiceRole.entities.Appointment.filter({ preferred_date: dateStr });
  return (appts || []).filter(a => a.status !== 'cancelled');
}

// ── check_availability (contractor-aware) ───────────────────────────────
async function checkAvailability(base44, data, cfg) {
  const { date } = data;
  if (!date) return { error: 'date is required (YYYY-MM-DD).' };
  const tz = cfg.timezone || 'America/New_York';
  const rules = cfg.scheduling_rules || {};
  const hours = dayHours(cfg, date);
  if (!hours || hours.closed) return { date, available: false, slots: [], reason: 'closed' };

  const tier = data.vehicle_type || 'sedan_coupe';
  const { duration } = serviceInfo(cfg, data.service, tier);
  const interval = rules.slot_interval_minutes || 60;
  const bufferMs = (rules.booking_buffer_hours || 0) * 3600000;
  const minNoticeMs = (rules.min_notice_hours || 24) * 3600000;
  const now = Date.now();

  const dayStart = zonedToUtc(date, hours.open, tz);
  const dayEnd = zonedToUtc(date, hours.close, tz);

  // Google Calendar busy intervals (shared business calendar)
  const { accessToken } = await base44.asServiceRole.connectors.getConnection('googlecalendar');
  const q = `?timeMin=${encodeURIComponent(dayStart.toISOString())}&timeMax=${encodeURIComponent(dayEnd.toISOString())}&singleEvents=true&orderBy=startTime`;
  const eventsJson = await gcal(accessToken, 'GET', `/calendars/primary/events${q}`, null);
  const items = eventsJson.items || [];
  const gcalBusy = items.filter(e => e.start && e.start.dateTime).map(e => ({
    start: new Date(e.start.dateTime).getTime(),
    end: new Date(e.end.dateTime).getTime(),
  }));

  const maxPerDay = rules.max_bookings_per_day || 99;
  const vdsBookings = items.filter(e => e.extendedProperties && e.extendedProperties.shared && e.extendedProperties.shared.type === 'vds_appointment').length;
  if (vdsBookings >= maxPerDay) return { date, available: false, slots: [], reason: 'fully_booked' };

  // Contractor eligibility — availability is now the scheduling engine.
  const eligible = await eligibleContractors(base44, cfg, date, data.service);
  if (!eligible.length) return { date, available: false, slots: [], reason: 'no_contractors' };

  // Preload appointments for the day, grouped by contractor.
  const dayAppts = await dayAppointments(base44, date);
  const contractorBusy = {};
  for (const c of eligible) {
    contractorBusy[c.id] = dayAppts
      .filter(a => a.contractor_id === c.id)
      .map(a => ({ start: apptStartMs(a, tz), end: apptEndMs(a, tz) }))
      .filter(x => x.start != null && x.end != null);
  }

  const slots = [];
  for (let t = dayStart.getTime(); t + duration * 60000 <= dayEnd.getTime(); t += interval * 60000) {
    const slotStart = t, slotEnd = t + duration * 60000;
    if (slotStart < now + minNoticeMs) continue;
    if (overlapsBusy(gcalBusy, slotStart, slotEnd, bufferMs)) continue;
    let bookable = false;
    let availableCount = 0;
    for (const c of eligible) {
      if (!inAvailWindow(c, date, slotStart, slotEnd, tz)) continue;
      if (overlapsBusy(contractorBusy[c.id], slotStart, slotEnd, bufferMs)) continue;
      bookable = true;
      availableCount++;
    }
    if (bookable) {
      slots.push({
        time: utcToZonedTime(new Date(slotStart).toISOString(), tz),
        startUtc: new Date(slotStart).toISOString(),
        endUtc: new Date(slotEnd).toISOString(),
        contractors_available: availableCount,
      });
    }
  }
  return { date, available: slots.length > 0, slots, contractor_pool: eligible.length };
}

// autoAssign() now lives in base44/shared/autoAssign.ts (imported above).

// ── assign_contractor (internal: auto-assign a named contractor by portal availability) ──
// Used by the website booking flow to assign a specific contractor (e.g. Noah)
// to a job already mirrored to Google Calendar, gated by their weekly_availability + blocked_dates.
async function assignContractor(base44, data, cfg) {
  const { appointment_id, target } = data;
  if (!appointment_id) return { error: 'appointment_id is required.' };
  const appt = await base44.asServiceRole.entities.Appointment.get(appointment_id);
  if (!appt) return { error: 'Appointment not found.' };

  const all = await base44.asServiceRole.entities.Contractor.list();
  const targetName = (target || '').toLowerCase().trim();
  const contractor = (targetName ? all.find(c => (c.name || '').toLowerCase().includes(targetName)) : null) ||
    all.find(c => c.id === target);
  if (!contractor) return { assigned: false, reason: 'contractor_not_found' };
  if (contractor.is_enabled === false) return { assigned: false, reason: 'disabled', contractor: contractor.name };
  if (contractor.status !== 'active') return { assigned: false, reason: 'inactive', contractor: contractor.name };

  const tz = cfg.timezone || 'America/New_York';
  const dateStr = appt.preferred_date;
  if (!dateStr) return { assigned: false, reason: 'no_date', contractor: contractor.name };
  if ((contractor.blocked_dates || []).some(b => b.date === dateStr)) return { assigned: false, reason: 'blocked_date', contractor: contractor.name };

  const dayKey = weekdayKey(dateStr);
  const dayAvail = (contractor.weekly_availability || []).find(a => a.day === dayKey);
  if (!dayAvail || !dayAvail.available) return { assigned: false, reason: 'not_available_day', contractor: contractor.name };

  // Parse preferred_time ("9:00 AM" or "09:00") → 24h "HH:MM"
  const t24 = parseTimeTo24h(appt.preferred_time);
  if (!t24) return { assigned: false, reason: 'no_start_time', contractor: contractor.name };

  const dur = appt.estimated_duration_minutes || 120;
  const startMs = zonedToUtc(dateStr, t24, tz).getTime();
  if (!Number.isFinite(startMs)) return { assigned: false, reason: 'no_start_time', contractor: contractor.name };
  const endMs = startMs + dur * 60000;

  if (dayAvail.start && dayAvail.end) {
    const aStart = zonedToUtc(dateStr, dayAvail.start, tz).getTime();
    const aEnd = zonedToUtc(dateStr, dayAvail.end, tz).getTime();
    if (startMs < aStart || endMs > aEnd) return { assigned: false, reason: 'outside_window', contractor: contractor.name };
  }

  await base44.asServiceRole.entities.Appointment.update(appt.id, {
    contractor_id: contractor.id,
    contractor_name: contractor.name,
    job_status: 'assigned',
    status: 'confirmed',
  });

  // Mirror the assignment onto the Google Calendar event so the assigned contractor + full job details appear there too.
  if (appt.google_calendar_event_id) {
    try {
      const { accessToken } = await base44.asServiceRole.connectors.getConnection('googlecalendar');
      await gcal(accessToken, 'PATCH', `/calendars/primary/events/${appt.google_calendar_event_id}`, {
        summary: `VDS — ${appt.service_label || 'Appointment'} — ${appt.customer_name} — ${contractor.name}`,
        extendedProperties: { shared: { type: 'vds_appointment', service: appt.service_type || '', contractor_id: contractor.id } },
      });
    } catch (e) { console.error('GCal assign patch error:', e.message); }
  }

  return { success: true, assigned: true, contractor: { id: contractor.id, name: contractor.name } };
}

// ── auto_assign (internal: availability-based equal-distribution auto-assignment) ──
// Used by the website booking flow to assign the best available registered specialist
// to a job already mirrored to Google Calendar, instead of hardcoding a name.
async function autoAssignContractor(base44, data, cfg) {
  const { appointment_id } = data;
  if (!appointment_id) return { error: 'appointment_id is required.' };
  const appt = await base44.asServiceRole.entities.Appointment.get(appointment_id);
  if (!appt) return { error: 'Appointment not found.' };

  const tz = cfg.timezone || 'America/New_York';
  const dateStr = appt.preferred_date;
  if (!dateStr) return { assigned: false, reason: 'no_date' };

  const t24 = parseTimeTo24h(appt.preferred_time);
  if (!t24) return { assigned: false, reason: 'no_start_time' };

  const dur = appt.estimated_duration_minutes || 120;
  const startMs = zonedToUtc(dateStr, t24, tz).getTime();
  if (!Number.isFinite(startMs)) return { assigned: false, reason: 'no_start_time' };
  const endMs = startMs + dur * 60000;

  const contractor = await autoAssign(base44, cfg, dateStr, appt.service_type, startMs, endMs);
  if (!contractor) return { assigned: false, reason: 'no_available_contractor' };

  await base44.asServiceRole.entities.Appointment.update(appt.id, {
    contractor_id: contractor.id,
    contractor_name: contractor.name,
    job_status: 'assigned',
    status: 'confirmed',
  });

  if (appt.google_calendar_event_id) {
    try {
      const { accessToken } = await base44.asServiceRole.connectors.getConnection('googlecalendar');
      await gcal(accessToken, 'PATCH', `/calendars/primary/events/${appt.google_calendar_event_id}`, {
        summary: `VDS — ${appt.service_label || 'Appointment'} — ${appt.customer_name} — ${contractor.name}`,
        extendedProperties: { shared: { type: 'vds_appointment', service: appt.service_type || '', contractor_id: contractor.id } },
      });
    } catch (e) { console.error('GCal auto-assign patch error:', e.message); }
  }

  return { success: true, assigned: true, contractor: { id: contractor.id, name: contractor.name } };
}

// ── book ────────────────────────────────────────────────────────────────
async function bookAppointment(base44, data, cfg) {
  const { date, startUtc, service, customer_name, customer_phone } = data;
  if (!date || !startUtc || !service || !customer_name || !customer_phone) {
    return { error: 'date, startUtc, service, customer_name, customer_phone are required.' };
  }
  const tz = cfg.timezone || 'America/New_York';
  const tier = data.vehicle_type || 'sedan_coupe';
  const { duration, label, price } = serviceInfo(cfg, service, tier);
  const start = new Date(startUtc);
  const end = new Date(start.getTime() + duration * 60000);
  const rules = cfg.scheduling_rules || {};

  // Re-check availability against the shared calendar
  const hours = dayHours(cfg, date);
  if (!hours || hours.closed) return { error: 'We are closed that day.' };
  const { accessToken } = await base44.asServiceRole.connectors.getConnection('googlecalendar');
  const dayStart = zonedToUtc(date, hours.open, tz);
  const dayEnd = zonedToUtc(date, hours.close, tz);
  const q = `?timeMin=${encodeURIComponent(dayStart.toISOString())}&timeMax=${encodeURIComponent(dayEnd.toISOString())}&singleEvents=true&orderBy=startTime`;
  const eventsJson = await gcal(accessToken, 'GET', `/calendars/primary/events${q}`, null);
  const bufferMs = (rules.booking_buffer_hours || 0) * 3600000;
  const conflict = (eventsJson.items || []).some(e => e.start && e.start.dateTime &&
    new Date(e.start.dateTime).getTime() < end.getTime() + bufferMs &&
    new Date(e.end.dateTime).getTime() + bufferMs > start.getTime());
  if (conflict) return { error: 'That time slot is no longer available.' };

  // Auto-assign the best available contractor
  const contractor = await autoAssign(base44, cfg, date, service, start.getTime(), end.getTime());

  const event = {
    summary: `VDS — ${label} — ${customer_name}${contractor ? ` — ${contractor.name}` : ''}`,
    description: `Customer: ${customer_name}\nPhone: ${customer_phone}\nEmail: ${data.customer_email || 'N/A'}\nVehicle: ${data.vehicle_info || 'N/A'}\nAddress: ${data.service_address || 'N/A'}\nContractor: ${contractor ? contractor.name : 'Unassigned'}\nNotes: ${data.notes || 'N/A'}`,
    start: { dateTime: start.toISOString(), timeZone: tz },
    end: { dateTime: end.toISOString(), timeZone: tz },
    extendedProperties: { shared: { type: 'vds_appointment', service, contractor_id: contractor ? contractor.id : '' } },
  };
  const created = await gcal(accessToken, 'POST', '/calendars/primary/events', event);

  const appt = await base44.asServiceRole.entities.Appointment.create({
    service_type: service, service_label: label,
    vehicle_info: data.vehicle_info || '',
    preferred_date: date, preferred_time: utcToZonedTime(start.toISOString(), tz),
    estimated_duration_minutes: duration,
    google_calendar_event_id: created.id,
    status: 'confirmed', job_status: 'assigned',
    contractor_id: contractor ? contractor.id : '',
    contractor_name: contractor ? contractor.name : '',
    service_county: data.service_county || '',
    notes: data.notes || '', customer_name, customer_phone,
    customer_email: data.customer_email || '', service_address: data.service_address || '',
  });

  // ── Phase 8: Also create a Job (the operational source of truth) linked to this Appointment ──
  let job = null;
  try {
    let customer = null;
    const phoneDigits = customer_phone.replace(/\D/g, '');
    const byPhone = await base44.asServiceRole.entities.Customer.filter({ phone: phoneDigits });
    if (byPhone && byPhone.length) customer = byPhone[0];
    if (!customer) {
      const firstName = customer_name.split(' ')[0] || '';
      const lastName = customer_name.split(' ').slice(1).join(' ') || '';
      customer = await base44.asServiceRole.entities.Customer.create({
        first_name: firstName, last_name: lastName, phone: phoneDigits,
        email: data.customer_email || null, sms_consent: data.sms_consent !== false,
        customer_since: new Date().toISOString().split('T')[0], account_status: 'active',
      });
    }
    job = await base44.asServiceRole.entities.Job.create({
      customer_id: customer.id, customer_name, customer_phone, customer_email: data.customer_email || '',
      vehicle_info: data.vehicle_info || '', pricing_group: tier,
      service_package: service, service_label: label,
      appointment_date: date, appointment_time: utcToZonedTime(start.toISOString(), tz),
      address: data.service_address || '', status: 'appointment_scheduled', job_status: 'assigned',
      specialist_id: contractor ? contractor.id : null, specialist_name: contractor ? contractor.name : '',
      estimated_duration_minutes: duration, estimated_price: price,
      google_calendar_event_id: created.id, sms_consent: data.sms_consent !== false,
      notes: data.notes || '',
    });
    await base44.asServiceRole.entities.Appointment.update(appt.id, { job_id: job.id });
  } catch (e) { console.error('Job creation failed:', e.message); }

  // ── Booking notifications: customer SMS + email + internal email ──
  try {
    await base44.functions.invoke('sendBookingNotifications', {
      appointment_id: appt.id,
      scheduler_token: Deno.env.get('SCHEDULER_TOKEN'),
    });
  } catch (e) { console.error('Booking notifications failed:', e.message); }

  return {
    success: true, appointment_id: appt.id, job_id: job?.id, event_id: created.id,
    date, time: utcToZonedTime(start.toISOString(), tz),
    end_time: utcToZonedTime(end.toISOString(), tz), service_label: label, starting_price: price,
    contractor: contractor ? { id: contractor.id, name: contractor.name } : null,
  };
}

async function rescheduleAppointment(base44, data, cfg, appt) {
  const { new_startUtc, new_date } = data;
  if (!new_startUtc) return { error: 'new_startUtc is required.' };
  const tz = cfg.timezone || 'America/New_York';
  const dur = appt.estimated_duration_minutes || 60;
  const start = new Date(new_startUtc);
  const end = new Date(start.getTime() + dur * 60000);

  const { accessToken } = await base44.asServiceRole.connectors.getConnection('googlecalendar');
  if (appt.google_calendar_event_id) {
    await gcal(accessToken, 'PATCH', `/calendars/primary/events/${appt.google_calendar_event_id}`, {
      start: { dateTime: start.toISOString(), timeZone: tz },
      end: { dateTime: end.toISOString(), timeZone: tz },
    });
  }
  await base44.asServiceRole.entities.Appointment.update(appt.id, {
    preferred_date: new_date || appt.preferred_date,
    preferred_time: utcToZonedTime(start.toISOString(), tz),
    status: 'confirmed',
  });
  return { success: true, appointment_id: appt.id, date: new_date || appt.preferred_date, time: utcToZonedTime(start.toISOString(), tz) };
}

async function cancelAppointment(base44, data, cfg, appt) {
  const { accessToken } = await base44.asServiceRole.connectors.getConnection('googlecalendar');
  if (appt.google_calendar_event_id) {
    try { await gcal(accessToken, 'DELETE', `/calendars/primary/events/${appt.google_calendar_event_id}`, null); }
    catch (e) { console.error('GCal delete error:', e.message); }
  }
  await base44.asServiceRole.entities.Appointment.update(appt.id, { status: 'cancelled' });
  // ── Phase 8: Cancel the linked Job (the operational source of truth) ──
  if (appt.job_id) {
    try {
      await base44.asServiceRole.entities.Job.update(appt.job_id, { status: 'cancelled' });
      await base44.asServiceRole.functions.invoke('logEvent', {
        event_type: 'appointment_cancelled', entity_type: 'job', entity_id: appt.job_id,
        customer_id: null, description: `Appointment cancelled for ${appt.customer_name || 'customer'}`,
        metadata: { appointment_id: appt.id }, scheduler_token: Deno.env.get('SCHEDULER_TOKEN'),
      });
    } catch (e) { console.error('Linked Job cancellation failed:', e.message); }
  }
  // ── Internal cancellation notification email ──
  try {
    await base44.functions.invoke('sendCancellationNotification', {
      appointment_id: appt.id,
      scheduler_token: Deno.env.get('SCHEDULER_TOKEN'),
    });
  } catch (e) { console.error('Cancellation notification failed:', e.message); }
  return { success: true, appointment_id: appt.id };
}

// ── reassign (admin) ─────────────────────────────────────────────────────
async function reassignAppointment(base44, data, cfg, appt) {
  const contractorId = data.contractor_id;
  if (!contractorId) return { error: 'contractor_id is required.' };
  const contractor = await base44.asServiceRole.entities.Contractor.get(contractorId);
  if (!contractor) return { error: 'Contractor not found.' };

  await base44.asServiceRole.entities.Appointment.update(appt.id, {
    contractor_id: contractorId,
    contractor_name: contractor.name,
    job_status: appt.job_status === 'assigned' ? 'assigned' : (appt.job_status || 'assigned'),
  });

  const { accessToken } = await base44.asServiceRole.connectors.getConnection('googlecalendar');
  if (appt.google_calendar_event_id) {
    try {
      await gcal(accessToken, 'PATCH', `/calendars/primary/events/${appt.google_calendar_event_id}`, {
        summary: `VDS — ${appt.service_label || 'Appointment'} — ${appt.customer_name} — ${contractor.name}`,
        description: `Customer: ${appt.customer_name}\nPhone: ${appt.customer_phone}\nContractor: ${contractor.name}`,
        extendedProperties: { shared: { type: 'vds_appointment', service: appt.service_type || '', contractor_id: contractorId } },
      });
    } catch (e) { console.error('GCal reassign patch error:', e.message); }
  }
  return { success: true, appointment_id: appt.id, contractor: { id: contractor.id, name: contractor.name } };
}

// ── update_job_status (contractor or admin) ─────────────────────────────
const JOB_STATUSES = ['assigned', 'accepted', 'driving', 'arrived', 'in_progress', 'quality_check', 'completed', 'photos_uploaded', 'invoice_complete'];
const COMPLETION_FIELDS = ['before_photos', 'after_photos', 'services_completed', 'products_used', 'completion_notes', 'upsell_recommendation', 'recommended_next_detail_date', 'damage_notes', 'customer_feedback'];

// Send an outbound SMS — routed through sendMessage → Communication Rules Engine.
// The engine evaluates consent + the twilio_sms_enabled feature flag before delivery,
// logs suppressions to SystemEventLog, and handles the email fallback when SMS is off.
async function sendTwilioSms(base44, to, body, customerName, messageType) {
  if (!to) return;
  try {
    await base44.asServiceRole.functions.invoke('sendMessage', {
      customer_phone: to, message_type: messageType || 'valerie_reply', content: body,
      customer_name: customerName || '', scheduler_token: Deno.env.get('SCHEDULER_TOKEN'),
    });
  } catch (e) { console.error('sendMessage error:', e.message); }
}

// Send a review-request SMS, unless the customer already reviewed or a request was already sent.
async function requestReview(base44, data, cfg, job) {
  if (job.review_submitted) return { error: 'Customer has already submitted a review for this job.' };
  if (job.review_requested) return { error: 'A review request was already sent for this job.' };
  await base44.asServiceRole.entities.Job.update(job.id, { review_requested: true });
  // Sync the review flag to the linked Appointment mirror (deprecated — admin portal compat).
  try {
    const linked = await base44.asServiceRole.entities.Appointment.filter({ job_id: job.id });
    if (linked && linked.length) await base44.asServiceRole.entities.Appointment.update(linked[0].id, { review_requested: true });
  } catch (e) { console.error('Appointment mirror sync error:', e.message); }
  const first = (job.customer_name || '').split(' ')[0] || 'there';
  const reviewUrl = (cfg && cfg.website_links && cfg.website_links.google_review_url) || '';
  const msg = reviewUrl
    ? `Hi ${first}, your VDS detail is complete! We'd love your feedback — please take a moment to leave us a review: ${reviewUrl} Thanks for choosing VDS Mobile!`
    : `Hi ${first}, your VDS detail is complete! We'd love your feedback — please rate your experience by replying with a score from 1-5. Thanks for choosing VDS Mobile!`;
  await sendTwilioSms(base44, job.customer_phone, msg, job.customer_name, 'review_request');
  return { success: true };
}

// ── Phase 6: Auto-create an Invoice when a job reaches 'invoice_complete' ──
// Idempotent: skips if an invoice already exists for the job. Skips if no price is set
// (the admin must set a final_price on the job first).
async function createInvoiceForJob(base44, job) {
  const existing = await base44.asServiceRole.entities.Invoice.filter({ job_id: job.id });
  if (existing && existing.length) return existing[0];
  const amount = job.final_price ?? job.estimated_price ?? 0;
  if (!amount) return null;
  const year = new Date().getFullYear();
  const all = await base44.asServiceRole.entities.Invoice.list();
  const seq = String((all || []).filter(i => (i.invoice_number || '').startsWith(`VDS-${year}-`)).length + 1).padStart(4, '0');
  const invoiceNumber = `VDS-${year}-${seq}`;
  const invoice = await base44.asServiceRole.entities.Invoice.create({
    invoice_number: invoiceNumber, job_id: job.id, customer_id: job.customer_id, customer_name: job.customer_name,
    amount, tax: 0, discounts: 0, final_amount: amount, payment_status: 'pending',
    issued_date: new Date().toISOString().split('T')[0],
  });
  await base44.asServiceRole.entities.Job.update(job.id, { invoice_id: invoice.id, status: 'awaiting_payment' });
  try {
    await base44.asServiceRole.functions.invoke('logEvent', {
      event_type: 'invoice_created', entity_type: 'invoice', entity_id: invoice.id, customer_id: job.customer_id,
      description: `Invoice ${invoiceNumber} created for ${job.customer_name}`,
      metadata: { job_id: job.id, amount }, scheduler_token: Deno.env.get('SCHEDULER_TOKEN'),
    });
  } catch (e) { console.error('logEvent error:', e.message); }
  return invoice;
}

async function updateJobStatus(base44, data, cfg, job) {
  const newStatus = data.job_status;
  if (!JOB_STATUSES.includes(newStatus)) return { error: 'Invalid job_status.' };

  const updates = { job_status: newStatus };
  for (const f of COMPLETION_FIELDS) {
    if (data[f] !== undefined) updates[f] = data[f];
  }
  if (newStatus === 'completed' || newStatus === 'photos_uploaded' || newStatus === 'invoice_complete') {
    updates.status = 'completed';
  } else if (['driving', 'arrived', 'in_progress', 'quality_check'].includes(newStatus)) {
    // Reflect active work in the lifecycle status so the admin portal and client see
    // "In Progress" the moment the specialist starts, not just on completion.
    updates.status = 'in_progress';
  }
  await base44.asServiceRole.entities.Job.update(job.id, updates);

  // Sync to the linked Appointment mirror (deprecated — retained for admin portal compat).
  try {
    const linked = await base44.asServiceRole.entities.Appointment.filter({ job_id: job.id });
    if (linked && linked.length) {
      const apptUpdates = {};
      if (['completed', 'photos_uploaded', 'invoice_complete'].includes(newStatus)) {
        apptUpdates.status = 'completed';
        apptUpdates.job_status = newStatus;
      } else {
        apptUpdates.job_status = newStatus;
      }
      for (const f of COMPLETION_FIELDS) {
        if (data[f] !== undefined) apptUpdates[f] = data[f];
      }
      await base44.asServiceRole.entities.Appointment.update(linked[0].id, apptUpdates);
    }
  } catch (e) { console.error('Appointment mirror sync error:', e.message); }

  // Notify the customer the first time a job moves to 'in_progress' ("we're getting started").
  if (newStatus === 'in_progress' && job.job_status !== 'in_progress') {
    try {
      const first = (job.customer_name || '').split(' ')[0] || 'there';
      const msg = `Hi ${first}, your VDS specialist is getting started on your vehicle now! — VDS Mobile`;
      await sendTwilioSms(base44, job.customer_phone, msg, job.customer_name, 'job_started');
    } catch (e) { console.error('start sms error:', e.message); }
  }

  // Notify the customer the first time a job reaches 'completed'.
  if (newStatus === 'completed' && job.job_status !== 'completed') {
    await removeGcalEvent(base44, job.google_calendar_event_id);
    try {
      const first = (job.customer_name || '').split(' ')[0] || 'there';
      const msg = `Hi ${first}, your VDS detail is complete! Your specialist has finished servicing your vehicle. We hope you love the results. — VDS Mobile`;
      await sendTwilioSms(base44, job.customer_phone, msg, job.customer_name, 'completion');
    } catch (e) { console.error('completion sms error:', e.message); }
  }

  // Auto-finalize the originating quote when the job completes (booked → finalized).
  if (newStatus === 'completed' && job.job_status !== 'completed' && job.quote_id) {
    try {
      const quote = await base44.asServiceRole.entities.Quote.get(job.quote_id).catch(() => null);
      if (quote && quote.status !== 'finalized') {
        const finalizePrice = job.final_price ?? quote.final_price ?? job.estimated_price ?? 0;
        await base44.asServiceRole.entities.Quote.update(job.quote_id, { status: 'finalized', final_price: finalizePrice });
        await base44.asServiceRole.functions.invoke('logEvent', {
          event_type: 'quote_finalized', entity_type: 'quote', entity_id: job.quote_id, customer_id: job.customer_id,
          description: `Quote finalized (job completed): ${quote.quote_summary || (quote.requested_services || []).join(', ')}`,
          metadata: { quote_id: job.quote_id, job_id: job.id, final_price: finalizePrice },
          scheduler_token: Deno.env.get('SCHEDULER_TOKEN'),
        });
      }
    } catch (e) { console.error('quote auto-finalize error:', e.message); }
  }

  // Increment contractor jobs_completed the first time a job reaches 'completed'.
  if (newStatus === 'completed' && job.job_status !== 'completed' && job.specialist_id) {
    try {
      const c = await base44.asServiceRole.entities.Contractor.get(job.specialist_id);
      if (c) {
        const prevJobs = (c.metrics && c.metrics.jobs_completed) || 0;
        const prevAvg = (c.metrics && c.metrics.avg_job_duration_minutes) || 0;
        const newJobs = prevJobs + 1;
        const metrics = { ...(c.metrics || {}) };
        metrics.jobs_completed = newJobs;
        if (job.estimated_duration_minutes) {
          metrics.avg_job_duration_minutes = Math.round((prevAvg * prevJobs + job.estimated_duration_minutes) / newJobs);
        }
        if (data.upsell_recommendation) metrics.upsells_sold = (metrics.upsells_sold || 0) + 1;
        await base44.asServiceRole.entities.Contractor.update(c.id, { metrics });
      }
    } catch (e) { console.error('Contractor metrics update error:', e.message); }
  }

  // Phase 6: Auto-create an invoice when the specialist marks the job invoice_complete.
  if (newStatus === 'invoice_complete' && job.job_status !== 'invoice_complete') {
    try { await createInvoiceForJob(base44, job); }
    catch (e) { console.error('Invoice creation error:', e.message); }
  }

  return { success: true, job_id: job.id, job_status: newStatus };
}

// ── Contractor self-service (auth required) ────────────────────────────
// A specialist profile may be shared by business partners: user_id is the primary owner and
// linked_user_ids holds additional partners who all see the same jobs/availability/metrics.
function findMyContractor(all, meId) {
  return (all || []).find(c => c.user_id === meId || (c.linked_user_ids || []).includes(meId));
}

async function getMyProfile(base44) {
  const me = await base44.auth.me().catch(() => null);
  if (!me) return { error: 'Unauthorized.' };
  const all = await base44.asServiceRole.entities.Contractor.list();
  const c = findMyContractor(all, me.id);
  if (!c) return { error: 'No contractor profile is linked to your account.' };
  return { success: true, contractor: c };
}

async function myJobs(base44) {
  const me = await base44.auth.me().catch(() => null);
  if (!me) return { error: 'Unauthorized.' };
  const all = await base44.asServiceRole.entities.Contractor.list();
  const c = findMyContractor(all, me.id);
  if (!c) return { error: 'No contractor profile is linked to your account.' };
  // Phase 7: Specialist portal now reads from the Job entity (source of truth),
  // not the deprecated Appointment mirror.
  const jobs = await base44.asServiceRole.entities.Job.filter({ specialist_id: c.id });
  const active = (jobs || [])
    .sort((a, b) => new Date((a.appointment_date || '') + 'T00:00:00Z') - new Date((b.appointment_date || '') + 'T00:00:00Z'));
  return { success: true, contractor_id: c.id, jobs: active };
}

async function updateMyProfile(base44, data) {
  const me = await base44.auth.me().catch(() => null);
  if (!me) return { error: 'Unauthorized.' };
  const all = await base44.asServiceRole.entities.Contractor.list();
  const c = findMyContractor(all, me.id);
  if (!c) return { error: 'No contractor profile is linked to your account.' };
  const allowed = {};
  for (const k of ['weekly_availability', 'blocked_dates', 'status', 'phone', 'email', 'home_address', 'profile_photo']) {
    if (data[k] !== undefined) allowed[k] = data[k];
  }
  await base44.asServiceRole.entities.Contractor.update(c.id, allowed);
  return { success: true };
}

// ── Admin actions ───────────────────────────────────────────────────────
// Admin handlers (adminContractors, adminChangeStatus, adminJobs, adminQuotes, etc.) live in
// base44/shared/adminHandlers.ts and are imported above. adminBookAppointment stays here because
// it delegates to bookAppointment() below.

// Admin: create a new appointment (mirrors to Google Calendar + auto-assigns a specialist),
// exactly like the public book flow but gated to admins.
async function adminBookAppointment(base44, body, cfg) {
  const me = await base44.auth.me().catch(() => null);
  if (!(me && me.role === 'admin')) return { error: 'Admin only.' };
  const { date, time, service, customer_name, customer_phone } = body;
  if (!date || !time || !service || !customer_name || !customer_phone) {
    return { error: 'date, time, service, customer_name, customer_phone are required.' };
  }
  const tz = cfg.timezone || 'America/New_York';
  const startUtc = zonedToUtc(date, time, tz).toISOString();
  return await bookAppointment(base44, { ...body, startUtc }, cfg);
}

// ── Main Handler ────────────────────────────────────────────────────────
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const action = body.action;
    if (!action) return Response.json({ error: 'action is required.' }, { status: 400 });

    // Centralized admin guard: every admin_ action requires an authenticated admin.
    // (Individual admin handlers also enforce this; this gate guarantees it for all current
    // and future admin_ actions — defense-in-depth behind the client-side route gate.)
    if (typeof action === 'string' && action.startsWith('admin_')) {
      const adminMe = await base44.auth.me().catch(() => null);
      if (!adminMe || adminMe.role !== 'admin') return Response.json({ error: 'Admin only.' }, { status: 403 });
    }

    const cfg = await loadConfig(base44);
    if (!cfg) return Response.json({ error: 'Business configuration not found.' }, { status: 500 });

    // ── Public actions ──
    if (action === 'check_availability') return Response.json(await checkAvailability(base44, body, cfg));
    if (action === 'book') {
      const ip = clientIp(req);
      if (!rateLimit('book:' + ip, 8, 15 * 60 * 1000)) {
        return Response.json({ error: 'Too many booking attempts. Please try again later.' }, { status: 429 });
      }
      return Response.json(await bookAppointment(base44, body, cfg));
    }
    if (action === 'list_contractors') {
      const all = await base44.asServiceRole.entities.Contractor.filter({ status: 'active' });
      return Response.json({ contractors: all.map(c => ({ id: c.id, name: c.name, skills: c.skills || [], status: c.status, is_enabled: c.is_enabled !== false })) });
    }
    if (action === 'assign_contractor') {
      // Internal auto-assignment used by the website booking flow (server-to-server via SCHEDULER_TOKEN)
      // or an authenticated admin. Never exposed to anonymous callers.
      const schedulerToken = Deno.env.get('SCHEDULER_TOKEN');
      const tokenOk = !!(schedulerToken && body.scheduler_token && body.scheduler_token === schedulerToken);
      if (!tokenOk) {
        const me = await base44.auth.me().catch(() => null);
        if (!me || me.role !== 'admin') return Response.json({ error: 'Admin only.' }, { status: 403 });
      }
      return Response.json(await assignContractor(base44, body, cfg));
    }
    if (action === 'auto_assign') {
      // Internal availability-based auto-assignment used by the website booking flow
      // (server-to-server via SCHEDULER_TOKEN) or an authenticated admin.
      const schedulerToken = Deno.env.get('SCHEDULER_TOKEN');
      const tokenOk = !!(schedulerToken && body.scheduler_token && body.scheduler_token === schedulerToken);
      if (!tokenOk) {
        const me = await base44.auth.me().catch(() => null);
        if (!me || me.role !== 'admin') return Response.json({ error: 'Admin only.' }, { status: 403 });
      }
      return Response.json(await autoAssignContractor(base44, body, cfg));
    }
    if (action === 'get_my_profile') return Response.json(await getMyProfile(base44));
    if (action === 'my_jobs') return Response.json(await myJobs(base44));
    if (action === 'update_my_profile') return Response.json(await updateMyProfile(base44, body));
    if (action === 'admin_contractors') return Response.json(await adminContractors(base44));
    if (action === 'admin_appointments') return Response.json(await adminAppointments(base44, body));
    if (action === 'admin_update_contractor') return Response.json(await adminUpdateContractor(base44, body));
    if (action === 'admin_create_contractor') return Response.json(await adminCreateContractor(base44, body));
    if (action === 'admin_delete_contractor') return Response.json(await adminDeleteContractor(base44, body));
    if (action === 'admin_add_appointment') return Response.json(await adminBookAppointment(base44, body, cfg));
    if (action === 'admin_change_status') return Response.json(await adminChangeStatus(base44, body));
    if (action === 'admin_delete_appointment') return Response.json(await adminDeleteAppointment(base44, body));
    if (action === 'admin_bulk_delete_appointments') return Response.json(await adminBulkDeleteAppointments(base44, body));
    if (action === 'send_specialist_invite') return Response.json(await adminSendSpecialistInvite(base44, body));
    if (action === 'validate_specialist_token') return Response.json(await validateSpecialistToken(base44, body));
    if (action === 'finalize_specialist_setup') return Response.json(await finalizeSpecialistSetup(base44, body));
    if (action === 'admin_metrics') return Response.json(await adminMetrics(base44));
    if (action === 'admin_invoices') return Response.json(await adminInvoices(base44, body));
    if (action === 'admin_update_invoice') return Response.json(await adminUpdateInvoice(base44, body));
    if (action === 'admin_jobs') return Response.json(await adminJobs(base44, body));
    if (action === 'admin_reassign_job') return Response.json(await adminReassignJob(base44, body));
    if (action === 'admin_change_job_status') return Response.json(await adminChangeJobStatus(base44, body));
    if (action === 'admin_delete_job') return Response.json(await adminDeleteJob(base44, body));
    if (action === 'admin_bulk_delete_jobs') return Response.json(await adminBulkDeleteJobs(base44, body));
    if (action === 'admin_archive_quote') return Response.json(await adminArchiveQuote(base44, body));
    if (action === 'admin_quotes') return Response.json(await adminQuotes(base44, body));

    // ── Job-scoped actions (Phase 7+8: specialist portal operates on the Job entity) ──
    if (['update_job_status', 'request_review'].includes(action)) {
      const job = body.job_id ? await base44.asServiceRole.entities.Job.get(body.job_id) : null;
      if (!job) return Response.json({ error: 'Job not found.' }, { status: 404 });

      let me = null;
      try { me = await base44.auth.me(); } catch {}
      // Require explicit authentication before any ownership logic — an anonymous request
      // (me null) must never reach the specialist-ownership branch (CWE-639).
      if (!me) return Response.json({ error: 'Unauthorized.' }, { status: 403 });
      const isAdmin = !!(me.role === 'admin');
      if (!isAdmin) {
        if (!job.specialist_id) return Response.json({ error: 'No specialist assigned.' }, { status: 403 });
        const c = await base44.asServiceRole.entities.Contractor.get(job.specialist_id).catch(() => null);
        const owns = c && (c.user_id === me.id || (c.linked_user_ids || []).includes(me.id));
        if (!owns) return Response.json({ error: 'Only the assigned specialist may perform this action.' }, { status: 403 });
      }

      let result;
      if (action === 'request_review') result = await requestReview(base44, body, cfg, job);
      else result = await updateJobStatus(base44, body, cfg, job);
      return Response.json(result);
    }

    // ── Appointment-scoped actions (need an appointment) ──
    if (['reschedule', 'cancel', 'reassign'].includes(action)) {
      const appt = body.appointment_id ? await base44.asServiceRole.entities.Appointment.get(body.appointment_id) : null;
      if (!appt) return Response.json({ error: 'Appointment not found.' }, { status: 404 });

      // Authorization for appointment modifications:
      //  (a) Trusted internal service callers (e.g. valerieTools) presenting SCHEDULER_TOKEN —
      //      a high-entropy server-side secret. These have already verified the customer through
      //      their own flow; the appointment_id is the scoping key.
      //  (b) Authenticated base44 users — scoped to their own appointments (admins do anything).
      // The previous Retell-API-key + caller-supplied-phone-match path was removed: a phone
      // number is enumerable/harvestable and must not authorize destructive actions (CWE-639).
      const schedulerToken = Deno.env.get('SCHEDULER_TOKEN');
      const tokenCaller = !!(schedulerToken && body.scheduler_token && body.scheduler_token === schedulerToken);

      let me = null;
      if (!tokenCaller) {
        try { me = await base44.auth.me(); } catch {}
        if (!me) return Response.json({ error: 'Unauthorized to modify this appointment.' }, { status: 403 });
      }

      const isAdmin = !!(me && me.role === 'admin');
      if (action === 'reassign' && !isAdmin) return Response.json({ error: 'Admin only.' }, { status: 403 });

      if (action === 'reschedule' || action === 'cancel') {
        // Non-admin, non-service callers may only touch their own appointments.
        if (!isAdmin && !tokenCaller) {
          // Authorize via the verified user id → the member's Customer record → the
          // appointment's stored customer phone. Never trust the caller's email directly:
          // emails are enumerable, and a user could register with a victim's email to
          // hijack their appointments (CWE-639).
          let owns = !!(appt.created_by_id && appt.created_by_id === me.id);
          if (!owns) {
            const myCustomers = await base44.asServiceRole.entities.Customer.filter({ linked_user_id: me.id }).catch(() => []);
            const c = myCustomers && myCustomers[0];
            if (c && c.phone && appt.customer_phone) {
              owns = appt.customer_phone.replace(/\D/g, '').slice(-10) === c.phone.replace(/\D/g, '').slice(-10);
            }
          }
          if (!owns) return Response.json({ error: 'Unauthorized to modify this appointment.' }, { status: 403 });
        }
      }

      let result;
      if (action === 'reschedule') result = await rescheduleAppointment(base44, body, cfg, appt);
      else if (action === 'cancel') result = await cancelAppointment(base44, body, cfg, appt);
      else result = await reassignAppointment(base44, body, cfg, appt);
      return Response.json(result);
    }

    return Response.json({ error: `Unknown action: ${action}` }, { status: 400 });
  } catch (error) {
    console.error('scheduler error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});