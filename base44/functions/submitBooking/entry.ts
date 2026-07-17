import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';

// ERA Core booking submission.
// Base44 (Customer + Job entities) is the single source of truth.
// GoHighLevel has been eliminated — ERA Core is now the sole CRM and messaging system.
// Google Calendar remains as a mirror (valid integration via connector).

const SERVICE_LABELS = {
  exterior_detail: 'Exterior Detail',
  interior_detail: 'Interior Detail',
  full_detail: 'Full Interior + Exterior Detail',
  vds_gold_exterior: 'VDS Gold — Exterior Detail',
  vds_gold_full: 'VDS Gold — Full Detail',
  ceramic_coating: 'Ceramic Coating Consultation',
  paint_correction: 'Paint Correction Consultation',
};

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

Deno.serve(async (req) => {
  try {
    // Public endpoint (guests book without login) — strict origin allowlist.
    const originHeader = req.headers.get('Origin') || req.headers.get('Referer') || '';
    let originHost = '';
    try { originHost = new URL(originHeader).host.toLowerCase(); } catch { originHost = ''; }
    const allowed = ['vdsmobile.com', 'www.vdsmobile.com'].includes(originHost)
      || originHost === 'localhost'
      || originHost.endsWith('.localhost')
      || originHost.endsWith('.base44.app')
      || originHost.endsWith('.base44.com');
    if (!allowed) {
      return Response.json({ success: false, error: 'Forbidden — invalid origin.' }, { status: 403 });
    }

    const base44 = createClientFromRequest(req);

    // Auth is optional — guests can book without an account
    let user = null;
    try { user = await base44.auth.me(); } catch (e) { /* guest */ }

    const {
      name, phone, email, address,
      service_type, vehicle_type, vehicle_info,
      vehicle_details, notes,
      preferred_date, preferred_time, sms_consent, quote_id,
    } = await req.json();

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
        const dayJobs = await base44.asServiceRole.entities.Job.filter({ appointment_date: preferred_date });
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
    const isGoldBooking = vehicleEntries.some(e => e.includes('VDS Gold'));

    // ── Find or create Customer (ERA Core CRM — replaces GHL contact) ──────
    let customer = null;
    let customerCreated = false;
    try {
      if (user) {
        const byUser = await base44.asServiceRole.entities.Customer.filter({ linked_user_id: user.id });
        if (byUser && byUser.length > 0) customer = byUser[0];
      }
      if (!customer) {
        const byPhone = await base44.asServiceRole.entities.Customer.filter({ phone: phoneDigits });
        if (byPhone && byPhone.length > 0) customer = byPhone[0];
      }
      if (!customer && email) {
        const byEmail = await base44.asServiceRole.entities.Customer.filter({ email });
        if (byEmail && byEmail.length > 0) customer = byEmail[0];
      }
      if (!customer) {
        customer = await base44.asServiceRole.entities.Customer.create({
          linked_user_id: user ? user.id : null,
          first_name: firstName,
          last_name: lastName,
          email: email || null,
          phone: phoneDigits,
          sms_consent: sms_consent !== false,
          email_consent: true,
          service_addresses: address ? [address] : [],
          customer_since: new Date().toISOString().split('T')[0],
          account_status: 'active',
        });
        customerCreated = true;
        await logEvent(base44, {
          event_type: 'customer_created',
          entity_type: 'customer',
          entity_id: customer.id,
          customer_id: customer.id,
          description: `New customer created: ${name}`,
          metadata: { source: 'website_booking', linked_user_id: user ? user.id : null, email: email || null },
        });
      } else {
        const updates = {};
        if (sms_consent !== false && !customer.sms_consent) updates.sms_consent = true;
        if (email && !customer.email) updates.email = email;
        if (user && !customer.linked_user_id) updates.linked_user_id = user.id;
        if (address && !(customer.service_addresses || []).includes(address)) {
          updates.service_addresses = [...(customer.service_addresses || []), address];
        }
        if (Object.keys(updates).length > 0) {
          await base44.asServiceRole.entities.Customer.update(customer.id, updates);
        }
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
      serviceLabel = SERVICE_LABELS[service_type] || service_type.replace(/_/g, ' ').toUpperCase();
      const servicesNotes = vehicleEntries.length > 0
        ? vehicleEntries.map((entry, idx) => {
            const parts = entry.split(' — ');
            const vehicleInfoClean = parts[0]?.replace(/\([^)]+\)/g, '').trim() || '';
            const service = parts[1] || '';
            return `${idx + 1}. ${vehicleInfoClean} — ${service}`;
          }).join('\n')
        : notes || '';

      job = await base44.asServiceRole.entities.Job.create({
        customer_id: customer ? customer.id : null,
        customer_name: name,
        customer_phone: phone,
        customer_email: email || '',
        vehicle_info: vehicle_info || 'TBD',
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
      });

      await logEvent(base44, {
        event_type: 'job_created',
        entity_type: 'job',
        entity_id: job.id,
        customer_id: customer ? customer.id : null,
        description: `Job created for ${name} — ${serviceLabel}`,
        metadata: { service_type, pricing_group: pricingGroup, preferred_date, preferred_time, is_gold: isGoldBooking },
      });

      await logEvent(base44, {
        event_type: 'appointment_scheduled',
        entity_type: 'job',
        entity_id: job.id,
        customer_id: customer ? customer.id : null,
        description: `Appointment scheduled for ${name} on ${preferred_date} at ${preferred_time}`,
        metadata: { service_type, preferred_date, preferred_time },
      });
    } catch (err) {
      console.error('Failed to create Job:', err.message);
    }

    // ── Link the originating Quote (if this booking came from the pricing page) ──
    if (quote_id) {
      try {
        const q = await base44.asServiceRole.entities.Quote.get(quote_id).catch(() => null);
        if (q) {
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
      let tz = 'America/New_York';
      try {
        const configs = await base44.asServiceRole.entities.BusinessConfig.filter({ is_active: true });
        if (configs && configs[0] && configs[0].timezone) tz = configs[0].timezone;
      } catch {}

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

      const membershipTag = isGoldBooking ? '◆ VDS GOLD MEMBER\n\n' : '';
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
        summary: `VDS — ${name} — ${vehicleCount} Vehicle${vehicleCount > 1 ? 's' : ''}${isGoldBooking ? ' ◆ Gold' : ''}`,
        description,
        location: address || undefined,
        start: { dateTime: startUtc.toISOString(), timeZone: tz },
        end: { dateTime: endUtc.toISOString(), timeZone: tz },
        extendedProperties: { shared: { type: 'vds_appointment' } },
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
        const r = await base44.functions.invoke('scheduler', { action: 'assign_contractor', appointment_id: appt.id, target: 'Noah', scheduler_token: Deno.env.get('SCHEDULER_TOKEN') });
        console.log('Auto-assign result:', JSON.stringify(r?.data || r));

        // Sync specialist info from the updated Appointment to the Job
        if (job) {
          try {
            const updatedAppt = await base44.asServiceRole.entities.Appointment.get(appt.id);
            const jobUpdates = {};
            if (updatedAppt?.contractor_id) {
              jobUpdates.specialist_id = updatedAppt.contractor_id;
              jobUpdates.specialist_name = updatedAppt.contractor_name || 'VDS Founders';
              jobUpdates.status = 'specialist_assigned';
            }
            if (Object.keys(jobUpdates).length > 0) {
              await base44.asServiceRole.entities.Job.update(job.id, jobUpdates);
              await logEvent(base44, {
                event_type: 'job_assigned',
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