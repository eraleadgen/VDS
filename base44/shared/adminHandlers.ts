// ERA Core — Admin handlers for the scheduler.
// Extracted from scheduler/entry.ts to keep the main entry thin and reusable across
// service businesses. Contains every admin_* action (contractor, appointment, job,
// invoice, quote management). The only VDS-specific bit is the invoice-number prefix
// ("VDS-"); everything else is generic ERA Core logic.
import { gcal, removeGcalEvent } from './gcal.ts';

function requireAdmin(me) { return !!(me && me.role === 'admin'); }

export async function adminContractors(base44) {
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

// Admin: change an appointment's lifecycle status and keep Google Calendar in sync.
export async function adminChangeStatus(base44, body) {
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
  // ── Internal cancellation notification email ──
  if (status === 'cancelled') {
    try {
      await base44.functions.invoke('sendCancellationNotification', {
        appointment_id,
        scheduler_token: Deno.env.get('SCHEDULER_TOKEN'),
      });
    } catch (e) { console.error('Cancellation notification failed:', e.message); }
  }
  return { success: true, status };
}

// Admin: permanently delete an appointment (removes the Google Calendar event + the Base44 record).
export async function adminDeleteAppointment(base44, body) {
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
export async function adminBulkDeleteAppointments(base44, body) {
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

export async function adminAppointments(base44, body) {
  const me = await base44.auth.me().catch(() => null);
  if (!requireAdmin(me)) return { error: 'Admin only.' };
  let appts;
  if (body.date) appts = await base44.asServiceRole.entities.Appointment.filter({ preferred_date: body.date });
  else if (body.status) appts = await base44.asServiceRole.entities.Appointment.filter({ status: body.status });
  else appts = await base44.asServiceRole.entities.Appointment.list();
  return { success: true, appointments: appts || [] };
}

export async function adminUpdateContractor(base44, body) {
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

export async function adminCreateContractor(base44, body) {
  const me = await base44.auth.me().catch(() => null);
  if (!requireAdmin(me)) return { error: 'Admin only.' };
  const { name, phone, email, skills, service_areas, home_address } = body;
  if (!name || !phone || !email) return { error: 'name, phone and email are required.' };
  // Create the specialist profile only. The specialist sets their own password from the themed
  // invite email link — we intentionally do NOT call inviteUser (that sends a platform invite email).
  const inviteToken = crypto.randomUUID();
  const c = await base44.asServiceRole.entities.Contractor.create({
    name, phone, email, user_id: '',
    skills: skills || [], service_areas: service_areas || { counties: [], max_travel_distance_miles: 0 },
    home_address: home_address || '', status: 'active', is_enabled: true,
    invite_token: inviteToken, invite_sent: false, account_created: false,
  });
  return { success: true, contractor_id: c.id };
}

// Admin: send the themed specialist invite email (with a private set-password link).
export async function adminSendSpecialistInvite(base44, body) {
  const me = await base44.auth.me().catch(() => null);
  if (!requireAdmin(me)) return { error: 'Admin only.' };
  const { contractor_id } = body;
  if (!contractor_id) return { error: 'contractor_id is required.' };
  const c = await base44.asServiceRole.entities.Contractor.get(contractor_id).catch(() => null);
  if (!c) return { error: 'Contractor not found.' };
  if (c.account_created) return { error: 'This specialist has already created their account.' };
  const inviteToken = c.invite_token || crypto.randomUUID();
  await base44.asServiceRole.entities.Contractor.update(contractor_id, { invite_token: inviteToken, invite_sent: true });
  try {
    await base44.functions.invoke('sendSpecialistInvite', {
      email: c.email, firstName: (c.name || '').split(' ')[0], invite_token: inviteToken,
      scheduler_token: Deno.env.get('SCHEDULER_TOKEN'),
    });
  } catch (e) { console.error('invite email error:', e.message); return { error: 'Failed to send the invite email.' }; }
  return { success: true, invite_sent: true };
}

// Public: validate a setup token from the invite email link (returns the specialist name + email).
export async function validateSpecialistToken(base44, body) {
  const { token } = body;
  if (!token) return { error: 'Missing invite token.' };
  const all = await base44.asServiceRole.entities.Contractor.filter({ invite_token: token });
  const c = (all && all[0]) || null;
  if (!c) return { error: 'This invite link is invalid or no longer active.' };
  if (c.account_created) return { error: 'This invite has already been used. Please log in to your Specialist Portal.', alreadyUsed: true };
  if (c.is_enabled === false) return { error: 'This specialist account is disabled. Please contact your administrator.' };
  return { success: true, name: c.name, email: c.email };
}

// Authenticated: after the specialist verifies their email, link the new account to the
// specialist profile, elevate the role to contractor, and send the themed welcome email.
export async function finalizeSpecialistSetup(base44, body) {
  const me = await base44.auth.me().catch(() => null);
  if (!me) return { error: 'Unauthorized.' };
  const { invite_token } = body;
  if (!invite_token) return { error: 'Missing invite token.' };
  const all = await base44.asServiceRole.entities.Contractor.filter({ invite_token });
  const c = (all && all[0]) || null;
  if (!c) return { error: 'This invite link is invalid or no longer active.' };
  if (c.account_created) return { error: 'This invite has already been used.' };
  if (!me.email || !c.email || me.email.toLowerCase() !== c.email.toLowerCase()) {
    return { error: 'The verified email does not match this specialist invite.' };
  }
  await base44.asServiceRole.entities.Contractor.update(c.id, {
    user_id: me.id, account_created: true, invite_token: '',
  });
  try { await base44.asServiceRole.entities.User.update(me.id, { role: 'contractor' }); }
  catch (e) { console.error('role update error:', e.message); }
  try {
    await base44.functions.invoke('sendContractorWelcomeEmail', {
      email: c.email, firstName: (c.name || '').split(' ')[0],
      scheduler_token: Deno.env.get('SCHEDULER_TOKEN'),
    });
  } catch (e) { console.error('welcome email error:', e.message); }
  return { success: true, contractor_id: c.id };
}

export async function adminDeleteContractor(base44, body) {
  const me = await base44.auth.me().catch(() => null);
  if (!requireAdmin(me)) return { error: 'Admin only.' };
  const { contractor_id } = body;
  if (!contractor_id) return { error: 'contractor_id is required.' };
  await base44.asServiceRole.entities.Contractor.delete(contractor_id);
  return { success: true };
}

export async function adminMetrics(base44) {
  const me = await base44.auth.me().catch(() => null);
  if (!requireAdmin(me)) return { error: 'Admin only.' };
  const [contractors, appts, quotes] = await Promise.all([
    base44.asServiceRole.entities.Contractor.list(),
    base44.asServiceRole.entities.Appointment.list(),
    base44.asServiceRole.entities.Quote.list(),
  ]);
  const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/New_York' }).format(new Date());
  const cs = contractors || [];
  const as = appts || [];
  // Revenue: match completed appointments to their quote by customer phone, sum the final_price.
  const normPhone = (p) => (p || '').replace(/\D/g, '').slice(-10);
  const quoteByPhone = {};
  for (const q of (quotes || [])) {
    const key = normPhone(q.customer_phone);
    if (!key) continue;
    const existing = quoteByPhone[key];
    if (!existing || (q.final_price || 0) >= (existing.final_price || 0)) quoteByPhone[key] = q;
  }
  let total_revenue = 0;
  let revenue_jobs = 0;
  for (const a of as) {
    if (a.status !== 'completed') continue;
    const key = normPhone(a.customer_phone);
    const q = key ? quoteByPhone[key] : null;
    const amt = q ? (q.final_price || q.starting_price || 0) : 0;
    if (amt > 0) { total_revenue += amt; revenue_jobs++; }
  }
  return {
    success: true,
    metrics: {
      total_contractors: cs.length,
      active_contractors: cs.filter(c => c.status === 'active' && c.is_enabled !== false).length,
      todays_jobs: as.filter(a => a.preferred_date === today && a.status !== 'cancelled').length,
      upcoming_jobs: as.filter(a => a.status === 'confirmed' && a.preferred_date >= today).length,
      completed_jobs: as.filter(a => a.status === 'completed').length,
      cancelled_jobs: as.filter(a => a.status === 'cancelled').length,
      total_revenue: Math.round(total_revenue),
      revenue_jobs,
    },
    jobs_by_contractor: cs.map(c => ({ name: c.name, jobs: (c.metrics && c.metrics.jobs_completed) || 0 })),
  };
}

// ── Admin: Invoice management (Phase 6) ───────────────────────────────────────
export async function adminInvoices(base44, body) {
  const me = await base44.auth.me().catch(() => null);
  if (!requireAdmin(me)) return { error: 'Admin only.' };
  let invoices;
  if (body.payment_status) invoices = await base44.asServiceRole.entities.Invoice.filter({ payment_status: body.payment_status });
  else invoices = await base44.asServiceRole.entities.Invoice.list('-issued_date', 200);
  return { success: true, invoices: invoices || [] };
}

export async function adminUpdateInvoice(base44, body) {
  const me = await base44.auth.me().catch(() => null);
  if (!requireAdmin(me)) return { error: 'Admin only.' };
  const { invoice_id, payment_status, payment_method } = body;
  if (!invoice_id) return { error: 'invoice_id is required.' };
  const updates = {};
  if (payment_status) updates.payment_status = payment_status;
  if (payment_method) updates.payment_method = payment_method;
  if (payment_status === 'paid') updates.paid_date = new Date().toISOString().split('T')[0];
  await base44.asServiceRole.entities.Invoice.update(invoice_id, updates);

  // Update customer lifetime revenue + log event when an invoice is marked paid.
  if (payment_status === 'paid') {
    try {
      const invoice = await base44.asServiceRole.entities.Invoice.get(invoice_id);
      if (invoice && invoice.customer_id) {
        const customer = await base44.asServiceRole.entities.Customer.get(invoice.customer_id).catch(() => null);
        if (customer) {
          await base44.asServiceRole.entities.Customer.update(customer.id, {
            lifetime_revenue: (customer.lifetime_revenue || 0) + (invoice.final_amount || invoice.amount || 0),
            total_jobs: (customer.total_jobs || 0) + 1,
          });
        }
      }
      // ── Partner Network: attribute conversion + revenue to the referring partner ──
      // Attribution is keyed off the Customer's referred_by_partner_id (set at first referral
      // booking). This correctly credits a partner when a customer books a coating CONSULTATION
      // via their link and later PURCHASES the coating — the coating job's invoice payment
      // credits the partner's conversions, revenue, and ceramic_coatings_generated. Idempotent
      // via the PartnerReferral.attributed flag.
      try {
        if (invoice?.customer_id) {
          const cust = await base44.asServiceRole.entities.Customer.get(invoice.customer_id).catch(() => null);
          const partnerId = cust?.referred_by_partner_id;
          if (partnerId) {
            const job = invoice.job_id ? await base44.asServiceRole.entities.Job.get(invoice.job_id).catch(() => null) : null;
            const svcLower = ((job?.service_package || '') + ' ' + (job?.service_label || '')).toLowerCase();
            const revenue = invoice.final_amount || invoice.amount || 0;
            let referral = null;
            if (invoice.job_id) {
              const existing = await base44.asServiceRole.entities.PartnerReferral.filter({ job_id: invoice.job_id }).catch(() => []);
              referral = existing && existing[0];
            }
            let credit = false;
            if (!referral) {
              await base44.asServiceRole.entities.PartnerReferral.create({
                partner_id: partnerId, customer_id: invoice.customer_id, job_id: invoice.job_id || null,
                service_package: job?.service_package || '', status: 'converted', revenue, attributed: true,
              });
              credit = true;
            } else if (!referral.attributed) {
              await base44.asServiceRole.entities.PartnerReferral.update(referral.id, { status: 'converted', revenue, attributed: true });
              credit = true;
            }
            if (credit) {
              const partner = await base44.asServiceRole.entities.Partner.get(partnerId).catch(() => null);
              if (partner) {
                const inc = {
                  conversions_count: (partner.conversions_count || 0) + 1,
                  revenue_generated: (partner.revenue_generated || 0) + revenue,
                };
                if (svcLower.includes('coating') || svcLower.includes('ceramic')) inc.ceramic_coatings_generated = (partner.ceramic_coatings_generated || 0) + 1;
                if (svcLower.includes('paint correction') || svcLower.includes('correction')) inc.paint_corrections_generated = (partner.paint_corrections_generated || 0) + 1;
                await base44.asServiceRole.entities.Partner.update(partnerId, inc);
              }
            }
          }
        }
      } catch (e) { console.error('Partner attribution error:', e.message); }

      await base44.asServiceRole.functions.invoke('logEvent', {
        event_type: 'invoice_paid', entity_type: 'invoice', entity_id: invoice_id,
        customer_id: invoice?.customer_id, description: `Invoice ${invoice?.invoice_number} marked as paid`,
        metadata: { amount: invoice?.final_amount, payment_method },
        scheduler_token: Deno.env.get('SCHEDULER_TOKEN'),
      });

      // ── Auto-finalize the linked quote when the invoice is paid ──
      // The quote's status moves to 'finalized' (kept visible in the Quotes tab);
      // details are also preserved in the SystemEventLog + CustomerJourney.
      if (invoice?.job_id) {
        try {
          const job = await base44.asServiceRole.entities.Job.get(invoice.job_id).catch(() => null);
          if (job && job.quote_id) {
            const quote = await base44.asServiceRole.entities.Quote.get(job.quote_id).catch(() => null);
            if (quote) {
              await base44.asServiceRole.entities.Quote.update(job.quote_id, { status: 'finalized', final_price: invoice.final_amount || invoice.amount || quote.final_price || 0 });
              await base44.asServiceRole.functions.invoke('logEvent', {
                event_type: 'quote_finalized', entity_type: 'quote', entity_id: job.quote_id,
                customer_id: job.customer_id || invoice.customer_id,
                description: `Quote finalized (invoice paid): ${job.service_label || (quote.requested_services || []).join(', ')} — $${invoice.final_amount || invoice.amount || 0}`,
                metadata: { quote_id: job.quote_id, job_id: job.id, invoice_id: invoice.id, amount: invoice.final_amount || invoice.amount },
                scheduler_token: Deno.env.get('SCHEDULER_TOKEN'),
              });
              // Finalized quotes stay visible in the Quotes tab (also preserved in the history log).
            }
          }
        } catch (e) { console.error('Quote auto-finalize on payment failed:', e.message); }
      }
    } catch (e) { console.error('Invoice payment update error:', e.message); }
  }
  return { success: true };
}

// ── Admin: Job management (Phase 8: admin portal operates on the Job entity) ──
// The Job is the operational source of truth; the Appointment mirror is synced where it exists.
export async function adminJobs(base44, body) {
  const me = await base44.auth.me().catch(() => null);
  if (!requireAdmin(me)) return { error: 'Admin only.' };
  let jobs;
  if (body.date) jobs = await base44.asServiceRole.entities.Job.filter({ appointment_date: body.date });
  else if (body.status) jobs = await base44.asServiceRole.entities.Job.filter({ status: body.status });
  else jobs = await base44.asServiceRole.entities.Job.list('-updated_date', 500);
  return { success: true, jobs: jobs || [] };
}

export async function adminReassignJob(base44, body) {
  const me = await base44.auth.me().catch(() => null);
  if (!requireAdmin(me)) return { error: 'Admin only.' };
  const { job_id, specialist_id } = body;
  if (!job_id || !specialist_id) return { error: 'job_id and specialist_id are required.' };
  const job = await base44.asServiceRole.entities.Job.get(job_id).catch(() => null);
  if (!job) return { error: 'Job not found.' };
  const contractor = await base44.asServiceRole.entities.Contractor.get(specialist_id).catch(() => null);
  if (!contractor) return { error: 'Specialist not found.' };
  await base44.asServiceRole.entities.Job.update(job_id, { specialist_id, specialist_name: contractor.name });
  try {
    const linked = await base44.asServiceRole.entities.Appointment.filter({ job_id });
    if (linked && linked.length) await base44.asServiceRole.entities.Appointment.update(linked[0].id, { contractor_id: specialist_id, contractor_name: contractor.name });
  } catch (e) { console.error('Appointment mirror sync error:', e.message); }
  if (job.google_calendar_event_id) {
    try {
      const { accessToken } = await base44.asServiceRole.connectors.getConnection('googlecalendar');
      await gcal(accessToken, 'PATCH', `/calendars/primary/events/${job.google_calendar_event_id}`, {
        summary: `VDS — ${job.service_label || 'Appointment'} — ${job.customer_name} — ${contractor.name}`,
      });
    } catch (e) { console.error('GCal reassign patch error:', e.message); }
  }
  return { success: true };
}

const JOB_LIFECYCLE_STATUSES = ['quote_requested','quote_generated','awaiting_approval','appointment_scheduled','specialist_assigned','appointment_confirmed','rescheduled','technician_en_route','in_progress','awaiting_payment','completed','review_requested','membership_recommended','cancelled'];

export async function adminChangeJobStatus(base44, body) {
  const me = await base44.auth.me().catch(() => null);
  if (!requireAdmin(me)) return { error: 'Admin only.' };
  const { job_id, status } = body;
  if (!JOB_LIFECYCLE_STATUSES.includes(status)) return { error: 'Invalid status.' };
  const job = await base44.asServiceRole.entities.Job.get(job_id).catch(() => null);
  if (!job) return { error: 'Job not found.' };
  // Map the lifecycle status to the specialist workflow status so the client-facing
  // Appointment mirror carries the live job state (in_progress / completed) the member sees.
  let jobStatusUpdate = {};
  if (status === 'in_progress') jobStatusUpdate.job_status = 'in_progress';
  else if (status === 'technician_en_route') jobStatusUpdate.job_status = 'driving';
  else if (['completed', 'awaiting_payment', 'review_requested'].includes(status)) jobStatusUpdate.job_status = 'completed';
  await base44.asServiceRole.entities.Job.update(job_id, { status, ...jobStatusUpdate });
  try {
    const linked = await base44.asServiceRole.entities.Appointment.filter({ job_id });
    if (linked && linked.length) {
      let apptStatus;
      let apptJobStatus;
      if (status === 'cancelled') { apptStatus = 'cancelled'; }
      else if (['completed', 'awaiting_payment', 'review_requested'].includes(status)) { apptStatus = 'completed'; apptJobStatus = 'completed'; }
      else if (status === 'in_progress') { apptStatus = 'confirmed'; apptJobStatus = 'in_progress'; }
      else if (status === 'technician_en_route') { apptStatus = 'confirmed'; apptJobStatus = 'driving'; }
      else { apptStatus = 'confirmed'; }
      const apptUpdates = { status: apptStatus };
      if (apptJobStatus) apptUpdates.job_status = apptJobStatus;
      await base44.asServiceRole.entities.Appointment.update(linked[0].id, apptUpdates);
    }
  } catch (e) { console.error('Appointment mirror sync error:', e.message); }
  if (['cancelled','completed','awaiting_payment','review_requested'].includes(status)) {
    await removeGcalEvent(base44, job.google_calendar_event_id);
  }
  if (status === 'cancelled') {
    try {
      await base44.asServiceRole.functions.invoke('logEvent', {
        event_type: 'appointment_cancelled', entity_type: 'job', entity_id: job_id,
        customer_id: job.customer_id, description: `Job cancelled for ${job.customer_name || 'customer'}`,
        metadata: { job_id }, scheduler_token: Deno.env.get('SCHEDULER_TOKEN'),
      });
    } catch (e) { console.error('logEvent error:', e.message); }
  }
  return { success: true, status };
}

export async function adminDeleteJob(base44, body) {
  const me = await base44.auth.me().catch(() => null);
  if (!requireAdmin(me)) return { error: 'Admin only.' };
  const { job_id } = body;
  if (!job_id) return { error: 'job_id is required.' };
  const job = await base44.asServiceRole.entities.Job.get(job_id).catch(() => null);
  if (!job) return { error: 'Job not found.' };
  await removeGcalEvent(base44, job.google_calendar_event_id);
  try {
    const linked = await base44.asServiceRole.entities.Appointment.filter({ job_id });
    if (linked && linked.length) await base44.asServiceRole.entities.Appointment.delete(linked[0].id);
  } catch (e) { console.error('Appointment mirror delete error:', e.message); }
  await base44.asServiceRole.entities.Job.delete(job_id);
  return { success: true };
}

export async function adminBulkDeleteJobs(base44, body) {
  const me = await base44.auth.me().catch(() => null);
  if (!requireAdmin(me)) return { error: 'Admin only.' };
  const ids = Array.isArray(body.job_ids) ? body.job_ids.filter(Boolean) : [];
  if (!ids.length) return { error: 'job_ids is required.' };
  let deleted = 0;
  for (const id of ids) {
    const job = await base44.asServiceRole.entities.Job.get(id).catch(() => null);
    if (!job) continue;
    await removeGcalEvent(base44, job.google_calendar_event_id);
    try {
      const linked = await base44.asServiceRole.entities.Appointment.filter({ job_id: id });
      if (linked && linked.length) await base44.asServiceRole.entities.Appointment.delete(linked[0].id);
    } catch (e) { console.error('Appointment mirror delete error:', e.message); }
    try { await base44.asServiceRole.entities.Job.delete(id); deleted++; }
    catch (e) { console.error('delete error:', id, e.message); }
  }
  return { success: true, deleted };
}

// ── Admin: Finalize a quote (set status 'finalized' + log to history) ──
// Finalized quotes stay visible in the Quotes tab; details are also preserved in the
// SystemEventLog + CustomerJourney as the "service history" record.
export async function adminArchiveQuote(base44, body) {
  const me = await base44.auth.me().catch(() => null);
  if (!requireAdmin(me)) return { error: 'Admin only.' };
  const { quote_id, final_price } = body;
  if (!quote_id) return { error: 'quote_id is required.' };
  const quote = await base44.asServiceRole.entities.Quote.get(quote_id).catch(() => null);
  if (!quote) return { error: 'Quote not found.' };
  const updates = { status: 'finalized' };
  if (final_price != null) updates.final_price = Number(final_price) || 0;
  await base44.asServiceRole.entities.Quote.update(quote_id, updates);

  // Resolve the customer for the journey entry
  let customerId = quote.customer_id || null;
  if (!customerId && quote.customer_phone) {
    try {
      const byPhone = await base44.asServiceRole.entities.Customer.filter({ phone: quote.customer_phone.replace(/\D/g, '') });
      if (byPhone && byPhone[0]) customerId = byPhone[0].id;
    } catch {}
  }
  const amount = updates.final_price != null ? updates.final_price : (quote.final_price ?? quote.starting_price ?? 0);
  try {
    await base44.asServiceRole.functions.invoke('logEvent', {
      event_type: 'quote_finalized', entity_type: 'quote', entity_id: quote_id, customer_id: customerId,
      description: `Quote finalized: ${quote.quote_summary || (quote.requested_services || []).join(', ')} — $${amount}`,
      metadata: { quote_id, final_price: amount, vehicle_classification: quote.vehicle_classification, job_id: quote.job_id },
      scheduler_token: Deno.env.get('SCHEDULER_TOKEN'),
    });
  } catch (e) { console.error('logEvent error:', e.message); }

  // Keep the finalized quote visible in the Quotes tab — details are also logged to history.
  return { success: true, finalized: true };
}

// ── Admin: Quotes list with automatic expiry sweep ──
// Pending quotes past their expiration_date are auto-marked 'expired' on read,
// so the admin Quotes tab always reflects the 7-day quote validity window.
export async function adminQuotes(base44, body) {
  const me = await base44.auth.me().catch(() => null);
  if (!requireAdmin(me)) return { error: 'Admin only.' };
  const today = new Date().toISOString().split('T')[0];
  try {
    const pending = await base44.asServiceRole.entities.Quote.filter({ status: 'pending' });
    const toExpire = (pending || []).filter(q => q.expiration_date && q.expiration_date < today);
    for (const q of toExpire) {
      try { await base44.asServiceRole.entities.Quote.update(q.id, { status: 'expired' }); }
      catch (e) { console.error('expire quote error:', q.id, e.message); }
    }
  } catch (e) { console.error('quote expiry sweep error:', e.message); }
  let quotes;
  if (body.status) quotes = await base44.asServiceRole.entities.Quote.filter({ status: body.status });
  else quotes = await base44.asServiceRole.entities.Quote.list('-created_date', 200);
  return { success: true, quotes: quotes || [] };
}

// ── Partner Network (ERA Core growth module) ────────────────────────────────
// Invite / setup flow mirrors the specialist invite flow (adminSendSpecialistInvite,
// validateSpecialistToken, finalizeSpecialistSetup) but targets the Partner entity and
// elevates the verified user to role 'partner'.

// Admin: send the themed partner invite email (with a private set-password link).
export async function adminSendPartnerInvite(base44, body) {
  const me = await base44.auth.me().catch(() => null);
  if (!requireAdmin(me)) return { error: 'Admin only.' };
  const { partner_id } = body;
  if (!partner_id) return { error: 'partner_id is required.' };
  const p = await base44.asServiceRole.entities.Partner.get(partner_id).catch(() => null);
  if (!p) return { error: 'Partner not found.' };
  if (p.account_created) return { error: 'This partner has already created their account.' };
  const inviteToken = p.invite_token || crypto.randomUUID();
  await base44.asServiceRole.entities.Partner.update(partner_id, { invite_token: inviteToken, invite_sent: true });
  try {
    await base44.functions.invoke('sendPartnerInvite', {
      email: p.email, firstName: (p.name || '').split(' ')[0] || 'there', invite_token: inviteToken,
      scheduler_token: Deno.env.get('SCHEDULER_TOKEN'),
    });
  } catch (e) { console.error('partner invite email error:', e.message); return { error: 'Failed to send the invite email.' }; }
  return { success: true, invite_sent: true };
}

// Public: validate a setup token from the invite email link (returns the partner name + email).
export async function validatePartnerToken(base44, body) {
  const { token } = body;
  if (!token) return { error: 'Missing invite token.' };
  const all = await base44.asServiceRole.entities.Partner.filter({ invite_token: token });
  const p = (all && all[0]) || null;
  if (!p) return { error: 'This invite link is invalid or no longer active.' };
  if (p.account_created) return { error: 'This invite has already been used. Please log in to your Partner Portal.', alreadyUsed: true };
  return { success: true, name: p.name, email: p.email, phone: p.phone };
}

// Authenticated: after the partner verifies their email, link the new account to the partner
// profile, elevate the role to 'partner'.
export async function finalizePartnerSetup(base44, body) {
  const me = await base44.auth.me().catch(() => null);
  if (!me) return { error: 'Unauthorized.' };
  const { invite_token } = body;
  if (!invite_token) return { error: 'Missing invite token.' };
  const all = await base44.asServiceRole.entities.Partner.filter({ invite_token });
  const p = (all && all[0]) || null;
  if (!p) return { error: 'This invite link is invalid or no longer active.' };
  if (p.account_created) return { error: 'This invite has already been used.' };
  if (!me.email || !p.email || me.email.toLowerCase() !== p.email.toLowerCase()) {
    return { error: 'The verified email does not match this partner invite.' };
  }
  // Merge the profile the partner filled in on the setup form (dealership, type, phone) and
  // stamp their signup date.
  const profile = body.profile || {};
  const updates = {
    linked_user_id: me.id, account_created: true, invite_token: '',
    signup_date: new Date().toISOString().split('T')[0],
  };
  if (profile.dealership !== undefined) updates.dealership = profile.dealership;
  if (profile.partner_type) updates.partner_type = profile.partner_type;
  if (profile.phone) updates.phone = profile.phone;
  if (profile.photo_url !== undefined) updates.photo_url = profile.photo_url;
  await base44.asServiceRole.entities.Partner.update(p.id, updates);
  try { await base44.asServiceRole.entities.User.update(me.id, { role: 'partner' }); }
  catch (e) { console.error('role update error:', e.message); }
  return { success: true, partner_id: p.id };
}