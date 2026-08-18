// ERA Core — Admin handlers for the scheduler.
// Extracted from scheduler/entry.ts to keep the main entry thin and reusable across
// service businesses. Contains every admin_* action (contractor, appointment, job,
// invoice, quote management). The only VDS-specific bit is the invoice-number prefix
// ("VDS-"); everything else is generic ERA Core logic.
import { gcal, removeGcalEvent } from './gcal.ts';
import { onInvoicePaid } from './invoicePaid.ts';

function requireAdmin(me) { return !!(me && me.role === 'admin'); }

// Resolve the calling admin's business_id from their User record (auth.me() doesn't
// reliably return custom fields). Falls back to 'vds' for pre-existing users.
async function adminBusinessId(base44, me) {
  if (!me) return 'vds';
  try {
    const u = await base44.asServiceRole.entities.User.get(me.id);
    return (u && u.business_id) || 'vds';
  } catch { return 'vds'; }
}

export async function adminContractors(base44) {
  const me = await base44.auth.me().catch(() => null);
  if (!requireAdmin(me)) return { error: 'Admin only.' };
  const bizId = await adminBusinessId(base44, me);
  const [all, users] = await Promise.all([
    base44.asServiceRole.entities.Contractor.list(),
    base44.asServiceRole.entities.User.list(),
  ]);
  // Filter to the admin's tenant only — the built-in User entity has no RLS, so
  // User.list() returns every user across all tenants.
  const tenantUsers = (users || []).filter(u => (u.business_id || 'vds') === bizId);
  const byId = tenantUsers.reduce((m, u) => { m[u.id] = u; return m; }, {});
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
  const bizId = await adminBusinessId(base44, me);
  const { appointment_id, status } = body;
  const VALID = ['pending', 'confirmed', 'completed', 'cancelled'];
  if (!VALID.includes(status)) return { error: 'Invalid status.' };
  const appt = await base44.asServiceRole.entities.Appointment.get(appointment_id).catch(() => null);
  if (!appt) return { error: 'Appointment not found.' };
  if (appt.business_id && appt.business_id !== bizId) return { error: 'Appointment not found.' };
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
        business_id: bizId,
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
  const bizId = await adminBusinessId(base44, me);
  const { appointment_id } = body;
  if (!appointment_id) return { error: 'appointment_id is required.' };
  const appt = await base44.asServiceRole.entities.Appointment.get(appointment_id).catch(() => null);
  if (!appt) return { error: 'Appointment not found.' };
  if (appt.business_id && appt.business_id !== bizId) return { error: 'Appointment not found.' };
  await removeGcalEvent(base44, appt.google_calendar_event_id);
  await base44.asServiceRole.entities.Appointment.delete(appointment_id);
  return { success: true };
}

// Admin: permanently delete multiple appointments at once (removes GCal events + Base44 records).
export async function adminBulkDeleteAppointments(base44, body) {
  const me = await base44.auth.me().catch(() => null);
  if (!requireAdmin(me)) return { error: 'Admin only.' };
  const bizId = await adminBusinessId(base44, me);
  const ids = Array.isArray(body.appointment_ids) ? body.appointment_ids.filter(Boolean) : [];
  if (!ids.length) return { error: 'appointment_ids is required.' };
  let deleted = 0;
  for (const id of ids) {
    const appt = await base44.asServiceRole.entities.Appointment.get(id).catch(() => null);
    if (!appt) continue;
    if (appt.business_id && appt.business_id !== bizId) continue;
    await removeGcalEvent(base44, appt.google_calendar_event_id);
    try { await base44.asServiceRole.entities.Appointment.delete(id); deleted++; }
    catch (e) { console.error('delete error:', id, e.message); }
  }
  return { success: true, deleted };
}

export async function adminAppointments(base44, body) {
  const me = await base44.auth.me().catch(() => null);
  if (!requireAdmin(me)) return { error: 'Admin only.' };
  const bizId = await adminBusinessId(base44, me);
  let appts;
  if (body.date) appts = await base44.asServiceRole.entities.Appointment.filter({ business_id: bizId, preferred_date: body.date });
  else if (body.status) appts = await base44.asServiceRole.entities.Appointment.filter({ business_id: bizId, status: body.status });
  else appts = await base44.asServiceRole.entities.Appointment.filter({ business_id: bizId });
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
      const me = await base44.auth.me().catch(() => null);
      const bizId = await adminBusinessId(base44, me);
      const [all, existing] = await Promise.all([
        base44.asServiceRole.entities.User.list(),
        base44.asServiceRole.entities.Contractor.get(contractor_id).catch(() => null),
      ]);
      const primaryUserId = existing ? existing.user_id : '';
      // Only link users from the same tenant — prevents cross-tenant privilege escalation.
      allowed.linked_user_ids = (all || [])
        .filter(u => u.email && emails.includes(u.email.toLowerCase()) && u.id !== primaryUserId && (u.business_id || 'vds') === bizId)
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
  const bizId = await adminBusinessId(base44, me);
  const { name, phone, email, skills, service_areas, home_address } = body;
  if (!name || !phone || !email) return { error: 'name, phone and email are required.' };
  // Create the specialist profile only. The specialist sets their own password from the themed
  // invite email link — we intentionally do NOT call inviteUser (that sends a platform invite email).
  const inviteToken = crypto.randomUUID();
  const c = await base44.asServiceRole.entities.Contractor.create({
    business_id: bizId,
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
  const bizId = await adminBusinessId(base44, me);
  const { contractor_id } = body;
  if (!contractor_id) return { error: 'contractor_id is required.' };
  const c = await base44.asServiceRole.entities.Contractor.get(contractor_id).catch(() => null);
  if (!c) return { error: 'Contractor not found.' };
  if (c.business_id && c.business_id !== bizId) return { error: 'Contractor not found.' };
  if (c.account_created) return { error: 'This specialist has already created their account.' };
  const inviteToken = c.invite_token || crypto.randomUUID();
  await base44.asServiceRole.entities.Contractor.update(contractor_id, { invite_token: inviteToken, invite_sent: true });
  try {
    await base44.functions.invoke('sendSpecialistInvite', {
      email: c.email, firstName: (c.name || '').split(' ')[0], invite_token: inviteToken,
      business_id: bizId, scheduler_token: Deno.env.get('SCHEDULER_TOKEN'),
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
  try { await base44.asServiceRole.entities.User.update(me.id, { role: 'contractor', business_id: c.business_id || 'vds' }); }
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
  const bizId = await adminBusinessId(base44, me);
  const { contractor_id } = body;
  if (!contractor_id) return { error: 'contractor_id is required.' };
  const c = await base44.asServiceRole.entities.Contractor.get(contractor_id).catch(() => null);
  if (!c) return { error: 'Contractor not found.' };
  if (c.business_id && c.business_id !== bizId) return { error: 'Contractor not found.' };
  await base44.asServiceRole.entities.Contractor.delete(contractor_id);
  return { success: true };
}

export async function adminMetrics(base44) {
  const me = await base44.auth.me().catch(() => null);
  if (!requireAdmin(me)) return { error: 'Admin only.' };
  const bizId = await adminBusinessId(base44, me);
  const [contractors, appts, quotes] = await Promise.all([
    base44.asServiceRole.entities.Contractor.filter({ business_id: bizId }),
    base44.asServiceRole.entities.Appointment.filter({ business_id: bizId }),
    base44.asServiceRole.entities.Quote.filter({ business_id: bizId }),
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
  const bizId = await adminBusinessId(base44, me);
  let invoices;
  if (body.payment_status) invoices = await base44.asServiceRole.entities.Invoice.filter({ business_id: bizId, payment_status: body.payment_status });
  else invoices = await base44.asServiceRole.entities.Invoice.filter({ business_id: bizId }, '-issued_date', 200);
  return { success: true, invoices: invoices || [] };
}

export async function adminUpdateInvoice(base44, body) {
  const me = await base44.auth.me().catch(() => null);
  if (!requireAdmin(me)) return { error: 'Admin only.' };
  const bizId = await adminBusinessId(base44, me);
  const { invoice_id, payment_status, payment_method } = body;
  if (!invoice_id) return { error: 'invoice_id is required.' };
  const inv = await base44.asServiceRole.entities.Invoice.get(invoice_id).catch(() => null);
  if (!inv) return { error: 'Invoice not found.' };
  if (inv.business_id && inv.business_id !== bizId) return { error: 'Invoice not found.' };
  const updates = {};
  if (payment_status) updates.payment_status = payment_status;
  if (payment_method) updates.payment_method = payment_method;
  if (payment_status === 'paid') updates.paid_date = new Date().toISOString().split('T')[0];
  await base44.asServiceRole.entities.Invoice.update(invoice_id, updates);

  // Shared "invoice paid" side-effects (customer LTV, partner incentive, event log,
  // quote finalize) live in base44/shared/invoicePaid.ts and are also called by the
  // Stripe webhook — so a coating job paid via Stripe credits the partner automatically.
  if (payment_status === 'paid') await onInvoicePaid(base44, invoice_id, bizId);
  return { success: true };
}

// ── Admin: Job management (Phase 8: admin portal operates on the Job entity) ──
// The Job is the operational source of truth; the Appointment mirror is synced where it exists.
export async function adminJobs(base44, body) {
  const me = await base44.auth.me().catch(() => null);
  if (!requireAdmin(me)) return { error: 'Admin only.' };
  const bizId = await adminBusinessId(base44, me);
  let jobs;
  if (body.date) jobs = await base44.asServiceRole.entities.Job.filter({ business_id: bizId, appointment_date: body.date });
  else if (body.status) jobs = await base44.asServiceRole.entities.Job.filter({ business_id: bizId, status: body.status });
  else jobs = await base44.asServiceRole.entities.Job.filter({ business_id: bizId }, '-updated_date', 500);
  return { success: true, jobs: jobs || [] };
}

export async function adminReassignJob(base44, body) {
  const me = await base44.auth.me().catch(() => null);
  if (!requireAdmin(me)) return { error: 'Admin only.' };
  const bizId = await adminBusinessId(base44, me);
  const { job_id, specialist_id } = body;
  if (!job_id || !specialist_id) return { error: 'job_id and specialist_id are required.' };
  const job = await base44.asServiceRole.entities.Job.get(job_id).catch(() => null);
  if (!job) return { error: 'Job not found.' };
  if (job.business_id && job.business_id !== bizId) return { error: 'Job not found.' };
  const contractor = await base44.asServiceRole.entities.Contractor.get(specialist_id).catch(() => null);
  if (!contractor) return { error: 'Specialist not found.' };
  if (contractor.business_id && contractor.business_id !== bizId) return { error: 'Specialist not found.' };
  await base44.asServiceRole.entities.Job.update(job_id, { specialist_id, specialist_name: contractor.name });
  try {
    const linked = await base44.asServiceRole.entities.Appointment.filter({ business_id: bizId, job_id });
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
  const bizId = await adminBusinessId(base44, me);
  const { job_id, status } = body;
  if (!JOB_LIFECYCLE_STATUSES.includes(status)) return { error: 'Invalid status.' };
  const job = await base44.asServiceRole.entities.Job.get(job_id).catch(() => null);
  if (!job) return { error: 'Job not found.' };
  if (job.business_id && job.business_id !== bizId) return { error: 'Job not found.' };
  // Map the lifecycle status to the specialist workflow status so the client-facing
  // Appointment mirror carries the live job state (in_progress / completed) the member sees.
  let jobStatusUpdate = {};
  if (status === 'in_progress') jobStatusUpdate.job_status = 'in_progress';
  else if (status === 'technician_en_route') jobStatusUpdate.job_status = 'driving';
  else if (['completed', 'awaiting_payment', 'review_requested'].includes(status)) jobStatusUpdate.job_status = 'completed';
  await base44.asServiceRole.entities.Job.update(job_id, { status, ...jobStatusUpdate });
  try {
    const linked = await base44.asServiceRole.entities.Appointment.filter({ business_id: bizId, job_id });
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
        customer_id: job.customer_id, business_id: bizId, description: `Job cancelled for ${job.customer_name || 'customer'}`,
        metadata: { job_id }, scheduler_token: Deno.env.get('SCHEDULER_TOKEN'),
      });
    } catch (e) { console.error('logEvent error:', e.message); }
  }
  return { success: true, status };
}

export async function adminDeleteJob(base44, body) {
  const me = await base44.auth.me().catch(() => null);
  if (!requireAdmin(me)) return { error: 'Admin only.' };
  const bizId = await adminBusinessId(base44, me);
  const { job_id } = body;
  if (!job_id) return { error: 'job_id is required.' };
  const job = await base44.asServiceRole.entities.Job.get(job_id).catch(() => null);
  if (!job) return { error: 'Job not found.' };
  if (job.business_id && job.business_id !== bizId) return { error: 'Job not found.' };
  await removeGcalEvent(base44, job.google_calendar_event_id);
  try {
    const linked = await base44.asServiceRole.entities.Appointment.filter({ business_id: bizId, job_id });
    if (linked && linked.length) await base44.asServiceRole.entities.Appointment.delete(linked[0].id);
  } catch (e) { console.error('Appointment mirror delete error:', e.message); }
  await base44.asServiceRole.entities.Job.delete(job_id);
  return { success: true };
}

export async function adminBulkDeleteJobs(base44, body) {
  const me = await base44.auth.me().catch(() => null);
  if (!requireAdmin(me)) return { error: 'Admin only.' };
  const bizId = await adminBusinessId(base44, me);
  const ids = Array.isArray(body.job_ids) ? body.job_ids.filter(Boolean) : [];
  if (!ids.length) return { error: 'job_ids is required.' };
  let deleted = 0;
  for (const id of ids) {
    const job = await base44.asServiceRole.entities.Job.get(id).catch(() => null);
    if (!job) continue;
    if (job.business_id && job.business_id !== bizId) continue;
    await removeGcalEvent(base44, job.google_calendar_event_id);
    try {
      const linked = await base44.asServiceRole.entities.Appointment.filter({ business_id: bizId, job_id: id });
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
  const bizId = await adminBusinessId(base44, me);
  const { quote_id, final_price } = body;
  if (!quote_id) return { error: 'quote_id is required.' };
  const quote = await base44.asServiceRole.entities.Quote.get(quote_id).catch(() => null);
  if (!quote) return { error: 'Quote not found.' };
  if (quote.business_id && quote.business_id !== bizId) return { error: 'Quote not found.' };
  const updates = { status: 'finalized' };
  if (final_price != null) updates.final_price = Number(final_price) || 0;
  await base44.asServiceRole.entities.Quote.update(quote_id, updates);

  // Resolve the customer for the journey entry
  let customerId = quote.customer_id || null;
  if (!customerId && quote.customer_phone) {
    try {
      const byPhone = await base44.asServiceRole.entities.Customer.filter({ business_id: bizId, phone: quote.customer_phone.replace(/\D/g, '') });
      if (byPhone && byPhone[0]) customerId = byPhone[0].id;
    } catch {}
  }
  const amount = updates.final_price != null ? updates.final_price : (quote.final_price ?? quote.starting_price ?? 0);
  try {
    await base44.asServiceRole.functions.invoke('logEvent', {
      event_type: 'quote_finalized', entity_type: 'quote', entity_id: quote_id, customer_id: customerId, business_id: bizId,
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
  const bizId = await adminBusinessId(base44, me);
  const today = new Date().toISOString().split('T')[0];
  try {
    const pending = await base44.asServiceRole.entities.Quote.filter({ business_id: bizId, status: 'pending' });
    const toExpire = (pending || []).filter(q => q.expiration_date && q.expiration_date < today);
    for (const q of toExpire) {
      try { await base44.asServiceRole.entities.Quote.update(q.id, { status: 'expired' }); }
      catch (e) { console.error('expire quote error:', q.id, e.message); }
    }
  } catch (e) { console.error('quote expiry sweep error:', e.message); }
  let quotes;
  if (body.status) quotes = await base44.asServiceRole.entities.Quote.filter({ business_id: bizId, status: body.status });
  else quotes = await base44.asServiceRole.entities.Quote.filter({ business_id: bizId }, '-created_date', 200);
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
  const bizId = await adminBusinessId(base44, me);
  const { partner_id } = body;
  if (!partner_id) return { error: 'partner_id is required.' };
  const p = await base44.asServiceRole.entities.Partner.get(partner_id).catch(() => null);
  if (!p) return { error: 'Partner not found.' };
  if (p.business_id && p.business_id !== bizId) return { error: 'Partner not found.' };
  if (p.account_created) return { error: 'This partner has already created their account.' };
  const inviteToken = p.invite_token || crypto.randomUUID();
  await base44.asServiceRole.entities.Partner.update(partner_id, { invite_token: inviteToken, invite_sent: true });
  try {
    await base44.functions.invoke('sendPartnerInvite', {
      email: p.email, firstName: (p.name || '').split(' ')[0] || 'there', invite_token: inviteToken,
      business_id: bizId, scheduler_token: Deno.env.get('SCHEDULER_TOKEN'),
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
  try { await base44.asServiceRole.entities.User.update(me.id, { role: 'partner', business_id: p.business_id || 'vds' }); }
  catch (e) { console.error('role update error:', e.message); }
  return { success: true, partner_id: p.id };
}

// Partner-authenticated: returns this partner's referrals enriched with the linked job's
// consultation_status + service info, so the partner portal can show referral outcomes and
// incentive earnings. Partners can't read PartnerReferral/Job directly (admin-only RLS), so
// this server-side read is their access path.
export async function partnerMyReferrals(base44) {
  const me = await base44.auth.me().catch(() => null);
  if (!me) return { error: 'Unauthorized.' };
  if (me.role === 'admin') return { success: true, referrals: [] }; // admin preview has no partner profile
  const all = await base44.asServiceRole.entities.Partner.filter({ linked_user_id: me.id });
  const p = all && all[0];
  if (!p) return { error: 'No partner profile is linked to your account.' };
  const bizId = p.business_id || 'vds';
  const refs = await base44.asServiceRole.entities.PartnerReferral.filter({ business_id: bizId, partner_id: p.id });
  const enriched = await Promise.all((refs || []).map(async (r) => {
    let job = r.job_id ? await base44.asServiceRole.entities.Job.get(r.job_id).catch(() => null) : null;
    if (job && job.business_id && job.business_id !== bizId) job = null;
    return {
      id: r.id, status: r.status, revenue: r.revenue || 0, attributed: !!r.attributed,
      incentive_type: r.incentive_type || 'none', incentive_amount: r.incentive_amount || 0,
      service_package: r.service_package || '',
      job_id: r.job_id || null,
      customer_id: r.customer_id || '',
      consultation_status: job?.consultation_status || null,
      job_service_label: job?.service_label || '',
      appointment_date: job?.appointment_date || '',
      customer_name: job?.customer_name || '',
    };
  }));
  enriched.sort((a, b) => (b.appointment_date || '').localeCompare(a.appointment_date || ''));
  return { success: true, referrals: enriched };
}

// ── Admin: Google Calendar events for a date range (calendar grid view) ──
// Fetches live events from the connected Google Calendar and cross-references
// them with Job records so the admin calendar grid shows real-time event data
// (summary, time, customer, service, status) pulled directly from Google Calendar.
export async function adminGcalEvents(base44, body) {
  const me = await base44.auth.me().catch(() => null);
  if (!requireAdmin(me)) return { error: 'Admin only.' };
  const bizId = await adminBusinessId(base44, me);
  const { timeMin, timeMax } = body;
  if (!timeMin || !timeMax) return { error: 'timeMin and timeMax are required (ISO strings).' };
  const { accessToken } = await base44.asServiceRole.connectors.getConnection('googlecalendar');
  const q = `?timeMin=${encodeURIComponent(timeMin)}&timeMax=${encodeURIComponent(timeMax)}&singleEvents=true&orderBy=startTime&maxResults=250`;
  const eventsJson = await gcal(accessToken, 'GET', `/calendars/primary/events${q}`, null);
  const items = (eventsJson.items || []).filter(e => e.start && (e.start.dateTime || e.start.date));
  // Cross-reference with Jobs by google_calendar_event_id for status enrichment.
  const jobs = await base44.asServiceRole.entities.Job.filter({ business_id: bizId }, '-updated_date', 500);
  const jobByEventId = {};
  for (const j of (jobs || [])) { if (j.google_calendar_event_id) jobByEventId[j.google_calendar_event_id] = j; }
  const events = items.map(e => {
    const job = jobByEventId[e.id] || null;
    const isVds = e.extendedProperties && e.extendedProperties.shared && e.extendedProperties.shared.type === 'vds_appointment';
    return {
      id: e.id,
      summary: e.summary || '',
      start: e.start.dateTime || e.start.date,
      end: e.end.dateTime || e.end.date,
      allDay: !e.start.dateTime,
      is_vds: !!isVds,
      html_link: e.htmlLink || '',
      job: job ? {
        id: job.id,
        status: job.status,
        job_status: job.job_status,
        customer_name: job.customer_name,
        customer_phone: job.customer_phone,
        customer_email: job.customer_email,
        service_label: job.service_label,
        service_package: job.service_package,
        vehicle_info: job.vehicle_info,
        address: job.address,
        specialist_name: job.specialist_name,
        specialist_id: job.specialist_id,
        estimated_price: job.estimated_price,
        final_price: job.final_price,
        appointment_date: job.appointment_date,
        appointment_time: job.appointment_time,
      } : null,
    };
  });
  return { success: true, events };
}

// ── Admin: User management (tenant-scoped) ──────────────────────────────
// The built-in User entity has no RLS, so User.list() returns every user across
// all tenants. This function filters by the calling admin's business_id so an
// admin only sees users in their own tenant.
export async function adminUsers(base44) {
  const me = await base44.auth.me().catch(() => null);
  if (!requireAdmin(me)) return { error: 'Admin only.' };
  const bizId = await adminBusinessId(base44, me);
  const all = await base44.asServiceRole.entities.User.list();
  const users = (all || [])
    .filter(u => (u.business_id || 'vds') === bizId)
    .map(u => ({
      id: u.id,
      email: u.email,
      full_name: u.full_name || '',
      role: u.role || 'user',
      business_id: u.business_id || 'vds',
      first_name: u.first_name || '',
      last_name: u.last_name || '',
      phone: u.phone || '',
      created_date: u.created_date || '',
    }));
  return { success: true, users };
}