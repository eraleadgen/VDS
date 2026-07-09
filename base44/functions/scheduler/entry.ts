// VDS Scheduling API — Google Calendar (shared business calendar)
// POST /functions/scheduler
// Base44 is the source of truth; Google Calendar only stores the event mirror.
// Actions: check_availability, book, reschedule, cancel.
// Business hours, buffers, durations all come from BusinessConfig — nothing hardcoded.

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

// ── Actions ────────────────────────────────────────────────────────────
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

  const { accessToken } = await base44.asServiceRole.connectors.getConnection('googlecalendar');
  const q = `?timeMin=${encodeURIComponent(dayStart.toISOString())}&timeMax=${encodeURIComponent(dayEnd.toISOString())}&singleEvents=true&orderBy=startTime`;
  const eventsJson = await gcal(accessToken, 'GET', `/calendars/primary/events${q}`, null);
  const items = eventsJson.items || [];
  const busy = items.filter(e => e.start && e.start.dateTime).map(e => ({
    start: new Date(e.start.dateTime).getTime(),
    end: new Date(e.end.dateTime).getTime(),
  }));

  const maxPerDay = rules.max_bookings_per_day || 99;
  const vdsBookings = items.filter(e => e.extendedProperties && e.extendedProperties.shared && e.extendedProperties.shared.type === 'vds_appointment').length;
  if (vdsBookings >= maxPerDay) return { date, available: false, slots: [], reason: 'fully_booked' };

  const slots = [];
  for (let t = dayStart.getTime(); t + duration * 60000 <= dayEnd.getTime(); t += interval * 60000) {
    const slotStart = t, slotEnd = t + duration * 60000;
    if (slotStart < now + minNoticeMs) continue;
    const conflict = busy.some(b => slotStart < b.end + bufferMs && slotEnd + bufferMs > b.start);
    if (conflict) continue;
    slots.push({
      time: utcToZonedTime(new Date(slotStart).toISOString(), tz),
      startUtc: new Date(slotStart).toISOString(),
      endUtc: new Date(slotEnd).toISOString(),
    });
  }
  return { date, available: slots.length > 0, slots };
}

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

  // Re-check availability to prevent double booking
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

  const event = {
    summary: `VDS — ${label} — ${customer_name}`,
    description: `Customer: ${customer_name}\nPhone: ${customer_phone}\nEmail: ${data.customer_email || 'N/A'}\nVehicle: ${data.vehicle_info || 'N/A'}\nAddress: ${data.service_address || 'N/A'}\nNotes: ${data.notes || 'N/A'}`,
    start: { dateTime: start.toISOString(), timeZone: tz },
    end: { dateTime: end.toISOString(), timeZone: tz },
    extendedProperties: { shared: { type: 'vds_appointment', service } },
  };
  const created = await gcal(accessToken, 'POST', '/calendars/primary/events', event);

  const appt = await base44.asServiceRole.entities.Appointment.create({
    service_type: service, service_label: label,
    vehicle_info: data.vehicle_info || '',
    preferred_date: date, preferred_time: utcToZonedTime(start.toISOString(), tz),
    estimated_duration_minutes: duration,
    google_calendar_event_id: created.id,
    status: 'confirmed',
    notes: data.notes || '', customer_name, customer_phone,
    customer_email: data.customer_email || '', service_address: data.service_address || '',
  });

  return {
    success: true, appointment_id: appt.id, event_id: created.id,
    date, time: utcToZonedTime(start.toISOString(), tz),
    end_time: utcToZonedTime(end.toISOString(), tz), service_label: label, starting_price: price,
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

// ── Main Handler ──────────────────────────────────────────────────────
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const action = body.action;
    if (!action) return Response.json({ error: 'action is required.' }, { status: 400 });

    const cfg = await loadConfig(base44);
    if (!cfg) return Response.json({ error: 'Business configuration not found.' }, { status: 500 });

    // Public actions
    if (action === 'check_availability') return Response.json(await checkAvailability(base44, body, cfg));
    if (action === 'book') return Response.json(await bookAppointment(base44, body, cfg));

    // Protected actions — verify ownership
    if (action === 'reschedule' || action === 'cancel') {
      const appt = body.appointment_id ? await base44.asServiceRole.entities.Appointment.get(body.appointment_id) : null;
      if (!appt) return Response.json({ error: 'Appointment not found.' }, { status: 404 });

      let authorized = false;
      const auth = req.headers.get('Authorization') || '';
      const retellKey = Deno.env.get('RETELL_API_KEY');
      if (retellKey && auth.replace(/^Bearer\s+/i, '').trim() === retellKey) authorized = true;

      if (!authorized) {
        try {
          const me = await base44.auth.me();
          if (me) {
            if (me.role === 'admin') authorized = true;
            else if (appt.created_by_id === me.id) authorized = true;
            else if (appt.customer_email && me.email && appt.customer_email.toLowerCase() === me.email.toLowerCase()) authorized = true;
            else if (appt.customer_phone && me.phone && appt.customer_phone.replace(/\D/g, '') === me.phone.replace(/\D/g, '')) authorized = true;
          }
        } catch (e) { /* not logged in */ }
      }
      // Public phone-match verification (booking widget / Valerie)
      if (!authorized && body.customer_phone && appt.customer_phone &&
          body.customer_phone.replace(/\D/g, '') === appt.customer_phone.replace(/\D/g, '')) {
        authorized = true;
      }
      if (!authorized) return Response.json({ error: 'Unauthorized to modify this appointment.' }, { status: 403 });

      const result = action === 'reschedule'
        ? await rescheduleAppointment(base44, body, cfg, appt)
        : await cancelAppointment(base44, body, cfg, appt);
      return Response.json(result);
    }

    return Response.json({ error: `Unknown action: ${action}` }, { status: 400 });
  } catch (error) {
    console.error('scheduler error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});