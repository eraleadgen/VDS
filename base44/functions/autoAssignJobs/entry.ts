// Auto-Assign Scanner — scheduled function (runs every 10 min via automation).
// Scans the Job entity (source of truth) for upcoming jobs that have NO specialist
// assigned yet and auto-assigns the best available contractor using the same
// availability-based equal-distribution logic as the live booking flow.
// Catches jobs left unassigned at booking time (e.g. no contractor was available
// that moment, or the job was created outside the booking flow).
// Idempotent: only touches jobs where specialist_id is empty; skips past/cancelled.
// Runs unattended under the platform's admin context (base44.auth.me() = admin); internal
// function-to-function callers may instead present the shared SCHEDULER_TOKEN. See
// base44/shared/authGate.ts.

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.39';
import { jobStartMs } from '../../shared/timezone.ts';
import { autoAssign, loadConfig } from '../../shared/autoAssign.ts';
import { gcal } from '../../shared/gcal.ts';
import { requireAdminOrSchedulerToken } from '../../shared/authGate.ts';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    // Authorization: scheduled/admin task — requires an authenticated admin (the platform
    // runs scheduled automations under an admin context) or a valid SCHEDULER_TOKEN for
    // internal function-to-function calls. Anonymous/external callers are rejected (CWE-306).
    const gate = await requireAdminOrSchedulerToken(base44, req);
    if (gate) return gate;
    const cfg = await loadConfig(base44);
    if (!cfg) return Response.json({ error: 'Business configuration not found.' }, { status: 500 });
    const tz = cfg.timezone || 'America/New_York';
    const now = Date.now();

    // Scan recent jobs for upcoming, unassigned, non-cancelled work.
    const allJobs = await base44.asServiceRole.entities.Job.list('-updated_date', 500);
    const candidates = (allJobs || []).filter(j =>
      !j.specialist_id &&
      j.status !== 'cancelled' &&
      j.status !== 'completed' &&
      j.appointment_date
    );

    let assigned = 0, skipped = 0, noContractor = 0;
    for (const job of candidates) {
      const startMs = jobStartMs(job, tz);
      if (startMs == null) { skipped++; continue; }
      // Skip past appointments.
      if (startMs <= now) { skipped++; continue; }
      const dur = job.estimated_duration_minutes || 60;
      const endMs = startMs + dur * 60000;

      const contractor = await autoAssign(base44, cfg, job.appointment_date, job.service_package, startMs, endMs);
      if (!contractor) { noContractor++; continue; }

      // Update the Job (source of truth).
      await base44.asServiceRole.entities.Job.update(job.id, {
        specialist_id: contractor.id,
        specialist_name: contractor.name,
        job_status: 'assigned',
      });

      // Sync the linked Appointment mirror + Google Calendar event (if present).
      try {
        const linked = await base44.asServiceRole.entities.Appointment.filter({ job_id: job.id });
        if (linked && linked.length) {
          await base44.asServiceRole.entities.Appointment.update(linked[0].id, {
            contractor_id: contractor.id,
            contractor_name: contractor.name,
            job_status: 'assigned',
            status: 'confirmed',
          });
          if (linked[0].google_calendar_event_id) {
            const { accessToken } = await base44.asServiceRole.connectors.getConnection('googlecalendar');
            await gcal(accessToken, 'PATCH', `/calendars/primary/events/${linked[0].google_calendar_event_id}`, {
              summary: `VDS — ${job.service_label || 'Appointment'} — ${job.customer_name} — ${contractor.name}`,
              extendedProperties: { shared: { type: 'vds_appointment', service: job.service_package || '', contractor_id: contractor.id } },
            });
          }
        }
      } catch (e) { console.error('Appointment/GCal sync error:', e.message); }

      assigned++;
    }

    return Response.json({ success: true, scanned: candidates.length, assigned, skipped, no_contractor: noContractor });
  } catch (error) {
    console.error('autoAssignJobs error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});