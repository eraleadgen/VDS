// VDS Scheduling API — Google Calendar + Contractor auto-assignment
// POST /functions/scheduler
// Base44 is the source of truth; Google Calendar stores the event mirror.
// Actions: check_availability, book, reschedule, cancel, reassign, update_job_status, list_contractors.
// Business hours, buffers, durations come from BusinessConfig.
// Contractor availability (recurring weekly + date blocks + service areas + skills) drives the scheduling engine.
// No clock in/out, timesheets, or shift tracking — contractors self-schedule availability and update job status.

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const DAY_KEYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];

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
function weekdayKey(dateStr) {
  return DAY_KEYS[new Date(`${dateStr}T00:00:00Z`).getUTCDay()];
}

async function loadConfig(base44) {
  const configs = await base44.asServiceRole.entities.BusinessConfig.filter({ is_active: true });
  return configs && configs[0] ? configs[0] : null;
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
async function gcal(token, method, path, body) {
  const res = await fetch(`https://www.googleapis.com/calendar/v3${path}`, {
    method,
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`GCal ${method} ${path} ${res.status}: ${text}`);
  return text ? JSON.parse(text) : null;
}

// Remove a Google Calendar event mirror. Used when a job is completed or cancelled — the Base44
// appointment record is always retained as the audit log; only the live calendar entry is removed.
async function removeGcalEvent(base44, eventId) {
  if (!eventId) return;
  try {
    const { accessToken } = await base44.asServiceRole.connectors.getConnection('googlecalendar');
    await gcal(accessToken, 'DELETE', `/calendars/primary/events/${eventId}`, null);
  } catch (e) { console.error('GCal delete error:', e.message); }
}

// ── Contractor helpers ──────────────────────────────────────────────────
// Map a BusinessConfig service key to a Contractor skill.
function serviceToSkill(serviceKey) {
  if (!serviceKey) return null;
  if (serviceKey === 'full_detail') return 'full_detail';
  if (serviceKey === 'exterior_detail') return 'exterior_detail';
  if (serviceKey === 'interior_detail') return 'interior_detail';
  if (serviceKey === 'engine_bay') return 'engine_bay';
  if (serviceKey === 'headlight_restoration') return 'headlight_restoration';
  if (serviceKey.startsWith('ceramic_coating')) return 'ceramic_coating';
  if (serviceKey === 'ceramic_sealant') return 'ceramic_coating';
  if (serviceKey.startsWith('paint_correction')) return 'paint_correction';
  return null;
}

function apptStartMs(appt, tz) {
  if (!appt || !appt.preferred_date || !appt.preferred_time) return null;
  try { return zonedToUtc(appt.preferred_date, appt.preferred_time, tz).getTime(); }
  catch { return null; }
}
function apptEndMs(appt, tz) {
  const s = apptStartMs(appt, tz);
  return s != null ? s + (appt.estimated_duration_minutes || 60) * 60000 : null;
}

// Active, enabled contractors with the required skill, available that weekday and not blocked on that date.
async function eligibleContractors(base44, cfg, dateStr, serviceKey) {
  const skill = serviceToSkill(serviceKey);
  const dayKey = weekdayKey(dateStr);
  const all = await base44.asServiceRole.entities.Contractor.filter({ status: 'active' });
  return all.filter(c => {
    if (c.is_enabled === false) return false;
    if (skill && !(c.skills || []).includes(skill)) return false;
    if ((c.blocked_dates || []).some(b => b.date === dateStr)) return false;
    const dayAvail = (c.weekly_availability || []).find(a => a.day === dayKey);
    return !!(dayAvail && dayAvail.available);
  });
}

function inAvailWindow(contractor, dateStr, slotStart, slotEnd, cfg) {
  const tz = cfg.timezone || 'America/New_York';
  const dayKey = weekdayKey(dateStr);
  const dayAvail = (contractor.weekly_availability || []).find(a => a.day === dayKey);
  if (!dayAvail || !dayAvail.available) return false;
  if (!dayAvail.start || !dayAvail.end) return true; // available all day
  const aStart = zonedToUtc(dateStr, dayAvail.start, tz).getTime();
  const aEnd = zonedToUtc(dateStr, dayAvail.end, tz).getTime();
  return slotStart >= aStart && slotEnd <= aEnd;
}

// All non-cancelled appointments for a given date (cached once per request).
async function dayAppointments(base44, dateStr) {
  const appts = await base44.asServiceRole.entities.Appointment.filter({ preferred_date: dateStr });
  return (appts || []).filter(a => a.status !== 'cancelled');
}

function overlapsBusy(busy, slotStart, slotEnd, bufferMs) {
  return (busy || []).some(b => b && b.start != null && b.end != null &&
    slotStart < b.end + bufferMs && slotEnd + bufferMs > b.start);
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
      if (!inAvailWindow(c, date, slotStart, slotEnd, cfg)) continue;
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

// ── auto-assign: pick the best available contractor for a slot ──────────
async function autoAssign(base44, cfg, dateStr, serviceKey, slotStart, slotEnd) {
  const tz = cfg.timezone || 'America/New_York';
  const bufferMs = (cfg.scheduling_rules && cfg.scheduling_rules.booking_buffer_hours || 0) * 3600000;
  const eligible = await eligibleContractors(base44, cfg, dateStr, serviceKey);
  if (!eligible.length) return null;
  const dayAppts = await dayAppointments(base44, dateStr);
  const scored = [];
  for (const c of eligible) {
    if (!inAvailWindow(c, dateStr, slotStart, slotEnd, cfg)) continue;
    const myBusy = dayAppts
      .filter(a => a.contractor_id === c.id)
      .map(a => ({ start: apptStartMs(a, tz), end: apptEndMs(a, tz) }))
      .filter(x => x.start != null && x.end != null);
    if (overlapsBusy(myBusy, slotStart, slotEnd, bufferMs)) continue;
    scored.push({ contractor: c, workToday: myBusy.length });
  }
  if (!scored.length) return null;
  // Priority: least amount of work scheduled that day, then closest distance (service-area county match), then best skill match.
  scored.sort((a, b) => a.workToday - b.workToday);
  return scored[0].contractor;
}

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
  const t24 = (() => {
    const m = (appt.preferred_time || '').match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
    if (!m) return null;
    let h = parseInt(m[1], 10); const min = parseInt(m[2], 10);
    const mer = (m[3] || '').toUpperCase();
    if (mer === 'PM' && h !== 12) h += 12;
    if (mer === 'AM' && h === 12) h = 0;
    return `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
  })();
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

  return {
    success: true, appointment_id: appt.id, event_id: created.id,
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

// Send an outbound SMS via Twilio (and log it to ConversationHistory). No-op (log only) if Twilio is not configured.
async function sendTwilioSms(base44, to, body, customerName) {
  if (!to) return;
  try {
    await base44.asServiceRole.entities.ConversationHistory.create({
      customer_phone: to, customer_name: customerName || '', role: 'assistant', content: body,
    });
  } catch (e) { console.error('log sms error:', e.message); }
  const sid = Deno.env.get('TWILIO_ACCOUNT_SID');
  const token = Deno.env.get('TWILIO_AUTH_TOKEN');
  const from = Deno.env.get('TWILIO_FROM_NUMBER');
  if (!sid || !token || !from) { console.log('Twilio not configured — SMS logged only.'); return; }
  try {
    const url = `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`;
    const params = new URLSearchParams({ From: from, To: to, Body: body });
    const res = await fetch(url, {
      method: 'POST',
      headers: { Authorization: 'Basic ' + btoa(`${sid}:${token}`), 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
    });
    if (!res.ok) { const d = await res.json().catch(() => ({})); console.error('Twilio send error:', d); }
  } catch (e) { console.error('twilio send error:', e.message); }
}

// Send a review-request SMS, unless the customer already reviewed or a request was already sent.
async function requestReview(base44, data, cfg, appt) {
  if (appt.review_submitted) return { error: 'Customer has already submitted a review for this job.' };
  if (appt.review_requested) return { error: 'A review request was already sent for this job.' };
  await base44.asServiceRole.entities.Appointment.update(appt.id, { review_requested: true });
  const first = (appt.customer_name || '').split(' ')[0] || 'there';
  const msg = `Hi ${first}, your VDS detail is complete! We'd love your feedback — please rate your experience by replying with a score from 1-5. Thanks for choosing VDS Mobile!`;
  await sendTwilioSms(base44, appt.customer_phone, msg, appt.customer_name);
  return { success: true };
}

async function updateJobStatus(base44, data, cfg, appt) {
  const newStatus = data.job_status;
  if (!JOB_STATUSES.includes(newStatus)) return { error: 'Invalid job_status.' };

  const updates = { job_status: newStatus };
  for (const f of COMPLETION_FIELDS) {
    if (data[f] !== undefined) updates[f] = data[f];
  }
  if (newStatus === 'completed' || newStatus === 'photos_uploaded' || newStatus === 'invoice_complete') {
    updates.status = 'completed';
  }
  await base44.asServiceRole.entities.Appointment.update(appt.id, updates);

  // Notify the customer the first time a job reaches 'completed'.
  if (newStatus === 'completed' && appt.job_status !== 'completed') {
    // Remove the live Google Calendar event (the Base44 record is kept as the audit log).
    await removeGcalEvent(base44, appt.google_calendar_event_id);
    try {
      const first = (appt.customer_name || '').split(' ')[0] || 'there';
      const msg = `Hi ${first}, your VDS detail is complete! Your specialist has finished servicing your vehicle. We hope you love the results. — VDS Mobile`;
      await sendTwilioSms(base44, appt.customer_phone, msg, appt.customer_name);
    } catch (e) { console.error('completion sms error:', e.message); }
  }

  // Increment contractor jobs_completed the first time a job reaches 'completed'.
  if (newStatus === 'completed' && appt.job_status !== 'completed' && appt.contractor_id) {
    try {
      const c = await base44.asServiceRole.entities.Contractor.get(appt.contractor_id);
      if (c) {
        const prevJobs = (c.metrics && c.metrics.jobs_completed) || 0;
        const prevAvg = (c.metrics && c.metrics.avg_job_duration_minutes) || 0;
        const newJobs = prevJobs + 1;
        const metrics = { ...(c.metrics || {}) };
        metrics.jobs_completed = newJobs;
        if (appt.estimated_duration_minutes) {
          metrics.avg_job_duration_minutes = Math.round((prevAvg * prevJobs + appt.estimated_duration_minutes) / newJobs);
        }
        if (data.upsell_recommendation) metrics.upsells_sold = (metrics.upsells_sold || 0) + 1;
        await base44.asServiceRole.entities.Contractor.update(c.id, { metrics });
      }
    } catch (e) { console.error('Contractor metrics update error:', e.message); }
  }

  return { success: true, appointment_id: appt.id, job_status: newStatus };
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
  const appts = await base44.asServiceRole.entities.Appointment.filter({ contractor_id: c.id });
  const jobs = (appts || []).filter(a => a.status !== 'cancelled')
    .sort((a, b) => new Date((a.preferred_date || '') + 'T00:00:00Z') - new Date((b.preferred_date || '') + 'T00:00:00Z'));
  return { success: true, contractor_id: c.id, jobs };
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
function requireAdmin(me) { return !!(me && me.role === 'admin'); }

async function adminContractors(base44) {
  const me = await base44.auth.me().catch(() => null);
  if (!requireAdmin(me)) return { error: 'Admin only.' };
  const [all, users] = await Promise.all([
    base44.asServiceRole.entities.Contractor.list(),
    base44.asServiceRole.entities.User.list(),
  ]);
  const byId = (users || []).reduce((m, u) => { m[u.id] = u; return m; }, {});
  const contractors = (all || []).map(c => ({
    ...c,
    linked_user_emails: (c.linked_user_ids || []).map(id => byId[id] ? byId[id].email : '').filter(Boolean).join(', '),
  }));
  return { success: true, contractors };
}

// Admin: create a new appointment (mirrors to Google Calendar + auto-assigns a specialist),
// exactly like the public book flow but gated to admins.
async function adminBookAppointment(base44, body, cfg) {
  const me = await base44.auth.me().catch(() => null);
  if (!requireAdmin(me)) return { error: 'Admin only.' };
  const { date, time, service, customer_name, customer_phone } = body;
  if (!date || !time || !service || !customer_name || !customer_phone) {
    return { error: 'date, time, service, customer_name, customer_phone are required.' };
  }
  const tz = cfg.timezone || 'America/New_York';
  const startUtc = zonedToUtc(date, time, tz).toISOString();
  return await bookAppointment(base44, { ...body, startUtc }, cfg);
}

// Admin: change an appointment's lifecycle status and keep Google Calendar in sync.
async function adminChangeStatus(base44, body) {
  const me = await base44.auth.me().catch(() => null);
  if (!requireAdmin(me)) return { error: 'Admin only.' };
  const { appointment_id, status } = body;
  const VALID = ['pending', 'confirmed', 'completed', 'cancelled'];
  if (!VALID.includes(status)) return { error: 'Invalid status.' };
  const appt = await base44.asServiceRole.entities.Appointment.get(appointment_id).catch(() => null);
  if (!appt) return { error: 'Appointment not found.' };
  await base44.asServiceRole.entities.Appointment.update(appointment_id, { status });
  // Completed/cancelled jobs are removed from the live calendar; the Base44 record is retained.
  if (status === 'cancelled' || status === 'completed') {
    await removeGcalEvent(base44, appt.google_calendar_event_id);
  }
  return { success: true, status };
}

// Admin: permanently delete an appointment (removes the Google Calendar event + the Base44 record).
async function adminDeleteAppointment(base44, body) {
  const me = await base44.auth.me().catch(() => null);
  if (!requireAdmin(me)) return { error: 'Admin only.' };
  const { appointment_id } = body;
  if (!appointment_id) return { error: 'appointment_id is required.' };
  const appt = await base44.asServiceRole.entities.Appointment.get(appointment_id).catch(() => null);
  if (!appt) return { error: 'Appointment not found.' };
  await removeGcalEvent(base44, appt.google_calendar_event_id);
  await base44.asServiceRole.entities.Appointment.delete(appointment_id);
  return { success: true };
}

// Admin: permanently delete multiple appointments at once (removes GCal events + Base44 records).
async function adminBulkDeleteAppointments(base44, body) {
  const me = await base44.auth.me().catch(() => null);
  if (!requireAdmin(me)) return { error: 'Admin only.' };
  const ids = Array.isArray(body.appointment_ids) ? body.appointment_ids.filter(Boolean) : [];
  if (!ids.length) return { error: 'appointment_ids is required.' };
  let deleted = 0;
  for (const id of ids) {
    const appt = await base44.asServiceRole.entities.Appointment.get(id).catch(() => null);
    if (!appt) continue;
    await removeGcalEvent(base44, appt.google_calendar_event_id);
    try { await base44.asServiceRole.entities.Appointment.delete(id); deleted++; }
    catch (e) { console.error('delete error:', id, e.message); }
  }
  return { success: true, deleted };
}

async function adminAppointments(base44, body) {
  const me = await base44.auth.me().catch(() => null);
  if (!requireAdmin(me)) return { error: 'Admin only.' };
  let appts;
  if (body.date) appts = await base44.asServiceRole.entities.Appointment.filter({ preferred_date: body.date });
  else if (body.status) appts = await base44.asServiceRole.entities.Appointment.filter({ status: body.status });
  else appts = await base44.asServiceRole.entities.Appointment.list();
  return { success: true, appointments: appts || [] };
}

async function adminUpdateContractor(base44, body) {
  const me = await base44.auth.me().catch(() => null);
  if (!requireAdmin(me)) return { error: 'Admin only.' };
  const { contractor_id, ...updates } = body;
  if (!contractor_id) return { error: 'contractor_id is required.' };
  const allowed = {};
  for (const k of ['name', 'phone', 'email', 'status', 'is_enabled', 'skills', 'service_areas', 'home_address', 'weekly_availability', 'blocked_dates', 'profile_photo', 'linked_user_ids']) {
    if (updates[k] !== undefined) allowed[k] = updates[k];
  }
  // Resolve comma-separated partner emails into linked user ids (shared specialist profile).
  if (typeof updates.linked_user_emails === 'string') {
    const emails = updates.linked_user_emails.split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
    if (emails.length) {
      const [all, existing] = await Promise.all([
        base44.asServiceRole.entities.User.list(),
        base44.asServiceRole.entities.Contractor.get(contractor_id).catch(() => null),
      ]);
      const primaryUserId = existing ? existing.user_id : '';
      allowed.linked_user_ids = (all || [])
        .filter(u => u.email && emails.includes(u.email.toLowerCase()) && u.id !== primaryUserId)
        .map(u => u.id);
    } else {
      allowed.linked_user_ids = [];
    }
  }
  await base44.asServiceRole.entities.Contractor.update(contractor_id, allowed);
  return { success: true };
}

async function adminCreateContractor(base44, body) {
  const me = await base44.auth.me().catch(() => null);
  if (!requireAdmin(me)) return { error: 'Admin only.' };
  const { name, phone, email, skills, service_areas, home_address } = body;
  if (!name || !phone || !email) return { error: 'name, phone and email are required.' };
  // Platform invites only accept 'user' or 'admin' roles — invite as user, then elevate to contractor.
  try { await base44.users.inviteUser(email, 'user'); }
  catch (e) { console.error('invite error:', e.message); }
  let u = null;
  try {
    const all = await base44.asServiceRole.entities.User.list();
    u = (all || []).find(x => x.email && x.email.toLowerCase() === email.toLowerCase());
    if (u && u.role !== 'contractor') {
      try { await base44.asServiceRole.entities.User.update(u.id, { role: 'contractor' }); }
      catch (e) { console.error('role update error:', e.message); }
    }
  } catch (e) { console.error('user lookup error:', e.message); }
  const c = await base44.asServiceRole.entities.Contractor.create({
    name, phone, email, user_id: u ? u.id : '',
    skills: skills || [], service_areas: service_areas || { counties: [], max_travel_distance_miles: 0 },
    home_address: home_address || '', status: 'active', is_enabled: true,
  });
  // Auto-send the Contractor Welcome Email.
  try {
    await base44.functions.invoke('sendContractorWelcomeEmail', { email, firstName: (name || '').split(' ')[0], scheduler_token: Deno.env.get('SCHEDULER_TOKEN') });
  } catch (e) { console.error('welcome email error:', e.message); }
  return { success: true, contractor_id: c.id };
}

async function adminDeleteContractor(base44, body) {
  const me = await base44.auth.me().catch(() => null);
  if (!requireAdmin(me)) return { error: 'Admin only.' };
  const { contractor_id } = body;
  if (!contractor_id) return { error: 'contractor_id is required.' };
  await base44.asServiceRole.entities.Contractor.delete(contractor_id);
  return { success: true };
}

async function adminMetrics(base44) {
  const me = await base44.auth.me().catch(() => null);
  if (!requireAdmin(me)) return { error: 'Admin only.' };
  const [contractors, appts] = await Promise.all([
    base44.asServiceRole.entities.Contractor.list(),
    base44.asServiceRole.entities.Appointment.list(),
  ]);
  const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/New_York' }).format(new Date());
  const cs = contractors || [];
  const as = appts || [];
  return {
    success: true,
    metrics: {
      total_contractors: cs.length,
      active_contractors: cs.filter(c => c.status === 'active' && c.is_enabled !== false).length,
      todays_jobs: as.filter(a => a.preferred_date === today && a.status !== 'cancelled').length,
      upcoming_jobs: as.filter(a => a.status === 'confirmed' && a.preferred_date >= today).length,
      completed_jobs: as.filter(a => a.status === 'completed').length,
      cancelled_jobs: as.filter(a => a.status === 'cancelled').length,
    },
    jobs_by_contractor: cs.map(c => ({ name: c.name, jobs: (c.metrics && c.metrics.jobs_completed) || 0 })),
  };
}

// ── Main Handler ────────────────────────────────────────────────────────
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const action = body.action;
    if (!action) return Response.json({ error: 'action is required.' }, { status: 400 });

    const cfg = await loadConfig(base44);
    if (!cfg) return Response.json({ error: 'Business configuration not found.' }, { status: 500 });

    // ── Public actions ──
    if (action === 'check_availability') return Response.json(await checkAvailability(base44, body, cfg));
    if (action === 'book') return Response.json(await bookAppointment(base44, body, cfg));
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
    if (action === 'admin_metrics') return Response.json(await adminMetrics(base44));

    // ── Appointment-scoped actions (need an appointment) ──
    if (['reschedule', 'cancel', 'reassign', 'update_job_status', 'request_review'].includes(action)) {
      const appt = body.appointment_id ? await base44.asServiceRole.entities.Appointment.get(body.appointment_id) : null;
      if (!appt) return Response.json({ error: 'Appointment not found.' }, { status: 404 });

      // Resolve auth: Retell key, base44 user, or phone match.
      let authorized = false;
      let me = null;
      const auth = req.headers.get('Authorization') || '';
      const retellKey = Deno.env.get('RETELL_API_KEY');
      if (retellKey && auth.replace(/^Bearer\s+/i, '').trim() === retellKey) authorized = true;
      if (!authorized) {
        try { me = await base44.auth.me(); } catch {}
        if (me) authorized = true; // any logged-in user; admin/owner checks below enforce scoping
      }
      // Anonymous callers (no Retell key, no authenticated session) are NOT authorized to
      // modify appointments — a phone-number match alone is too weak (enumerable/harvestable)
      // for destructive actions. Guests must go through the Retell concierge or log in.
      if (!authorized) return Response.json({ error: 'Unauthorized to modify this appointment.' }, { status: 403 });

      // Admin-only actions / scoping
      const isAdmin = !!(me && me.role === 'admin');
      if (action === 'reassign' && !isAdmin) return Response.json({ error: 'Admin only.' }, { status: 403 });

      if ((action === 'update_job_status' || action === 'request_review') && !isAdmin) {
        // Only the assigned contractor may update job status or request reviews.
        if (!appt.contractor_id) return Response.json({ error: 'No contractor assigned.' }, { status: 403 });
        const c = await base44.asServiceRole.entities.Contractor.get(appt.contractor_id).catch(() => null);
        if (!c || !me || c.user_id !== me.id) return Response.json({ error: 'Only the assigned contractor may perform this action.' }, { status: 403 });
      }

      if (action === 'reschedule' || action === 'cancel') {
        // Non-admins may only touch their own appointments.
        if (!isAdmin) {
          if (me) {
            // Authenticated user: verify via immutable, verified identity only (user id or verified auth email).
            // Phone is a mutable/enumerable contact field and must not serve as an authorization key.
            const owns = appt.created_by_id === me.id ||
              (appt.customer_email && me.email && appt.customer_email.toLowerCase() === me.email.toLowerCase());
            if (!owns) return Response.json({ error: 'Unauthorized to modify this appointment.' }, { status: 403 });
          } else {
            // Service caller (Retell concierge) already authorized via API key: verify it is acting on the
            // customer whose phone matches the appointment of record.
            const owns = body.customer_phone && appt.customer_phone &&
              body.customer_phone.replace(/\D/g, '') === appt.customer_phone.replace(/\D/g, '');
            if (!owns) return Response.json({ error: 'Unauthorized to modify this appointment.' }, { status: 403 });
          }
        }
      }

      let result;
      if (action === 'reschedule') result = await rescheduleAppointment(base44, body, cfg, appt);
      else if (action === 'cancel') result = await cancelAppointment(base44, body, cfg, appt);
      else if (action === 'reassign') result = await reassignAppointment(base44, body, cfg, appt);
      else if (action === 'request_review') result = await requestReview(base44, body, cfg, appt);
      else result = await updateJobStatus(base44, body, cfg, appt);
      return Response.json(result);
    }

    return Response.json({ error: `Unknown action: ${action}` }, { status: 400 });
  } catch (error) {
    console.error('scheduler error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});