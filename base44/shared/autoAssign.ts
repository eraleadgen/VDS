// Shared auto-assignment logic for the scheduling engine.
// Used by both the live booking flow (scheduler function) and the periodic
// auto-assign scanner (autoAssignJobs function) so they never drift apart.
// Import as:  import { autoAssign, weekdayKey, serviceToSkill, ... } from "../../shared/autoAssign.ts";

import { zonedToUtc } from './timezone.ts';

const DAY_KEYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];

export function weekdayKey(dateStr) {
  return DAY_KEYS[new Date(`${dateStr}T00:00:00Z`).getUTCDay()];
}

// Map a BusinessConfig service key to a Contractor skill.
export function serviceToSkill(serviceKey) {
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

export async function loadConfig(base44) {
  const configs = await base44.asServiceRole.entities.BusinessConfig.filter({ is_active: true });
  return configs && configs[0] ? configs[0] : null;
}

export function inAvailWindow(contractor, dateStr, slotStart, slotEnd, tz) {
  const dayKey = weekdayKey(dateStr);
  const dayAvail = (contractor.weekly_availability || []).find(a => a.day === dayKey);
  if (!dayAvail || !dayAvail.available) return false;
  if (!dayAvail.start || !dayAvail.end) return true; // available all day
  const aStart = zonedToUtc(dateStr, dayAvail.start, tz).getTime();
  const aEnd = zonedToUtc(dateStr, dayAvail.end, tz).getTime();
  return slotStart >= aStart && slotEnd <= aEnd;
}

export function overlapsBusy(busy, slotStart, slotEnd, bufferMs) {
  return (busy || []).some(b => b && b.start != null && b.end != null &&
    slotStart < b.end + bufferMs && slotEnd + bufferMs > b.start);
}

// Appointment start/end as UTC epoch ms (preferred_time is "HH:MM" 24h, as stored by the booking flow).
export function apptStartMs(appt, tz) {
  if (!appt || !appt.preferred_date || !appt.preferred_time) return null;
  try { return zonedToUtc(appt.preferred_date, appt.preferred_time, tz).getTime(); }
  catch { return null; }
}
export function apptEndMs(appt, tz) {
  const s = apptStartMs(appt, tz);
  return s != null ? s + (appt.estimated_duration_minutes || 60) * 60000 : null;
}

// Availability-based equal-distribution auto-assignment.
// Considers each specialist's weekly_availability, blocked dates, skill, the slot
// window, and current workload. Jobs are distributed equally — the specialist
// carrying the lightest upcoming load is assigned next. A generalist fallback
// (Tier 3) keeps booking working before specialists configure availability.
export async function autoAssign(base44, cfg, dateStr, serviceKey, slotStart, slotEnd) {
  const tz = cfg.timezone || 'America/New_York';
  const bufferMs = ((cfg.scheduling_rules && cfg.scheduling_rules.booking_buffer_hours) || 0) * 3600000;

  const allActive = await base44.asServiceRole.entities.Contractor.filter({ status: 'active' });
  const pool = (allActive || []).filter(c => c.is_enabled !== false);
  if (!pool.length) return null;

  const dayAppts = await base44.asServiceRole.entities.Appointment.filter({ preferred_date: dateStr });

  // Equal-distribution metric: total upcoming (non-cancelled, non-completed) jobs per specialist.
  let upcomingJobs = [];
  try { upcomingJobs = await base44.asServiceRole.entities.Job.list('-updated_date', 500); } catch {}
  const loadByContractor = {};
  for (const j of (upcomingJobs || [])) {
    if (!j.specialist_id || j.status === 'cancelled' || j.status === 'completed') continue;
    loadByContractor[j.specialist_id] = (loadByContractor[j.specialist_id] || 0) + 1;
  }
  const loadOf = (c) => loadByContractor[c.id] || 0;
  const byLoad = (a, b) => loadOf(a) - loadOf(b);

  const skill = serviceToSkill(serviceKey);
  const dayKey = weekdayKey(dateStr);
  // A specialist with no skills listed is treated as a generalist (eligible for any service).
  const hasSkill = (c) => !skill || !(c.skills || []).length || (c.skills || []).includes(skill);
  const notBlocked = (c) => !(c.blocked_dates || []).some(b => b.date === dateStr);
  const availDay = (c) => {
    const da = (c.weekly_availability || []).find(a => a.day === dayKey);
    return !!(da && da.available);
  };

  // Tier 1: available that day, within the slot window, free that slot, skill match, not blocked.
  const dayAvailable = pool.filter(c => hasSkill(c) && notBlocked(c) && availDay(c));
  const tier1 = dayAvailable.filter(c => {
    if (!inAvailWindow(c, dateStr, slotStart, slotEnd, tz)) return false;
    const myBusy = dayAppts
      .filter(a => a.contractor_id === c.id && a.status !== 'cancelled')
      .map(a => ({ start: apptStartMs(a, tz), end: apptEndMs(a, tz) }))
      .filter(x => x.start != null && x.end != null);
    return !overlapsBusy(myBusy, slotStart, slotEnd, bufferMs);
  }).sort(byLoad);
  if (tier1.length) return tier1[0];

  // Tier 2: available that day (skill match, not blocked) but the exact window is taken.
  if (dayAvailable.length) return dayAvailable.slice().sort(byLoad)[0];

  // Tier 3: no specialist has listed availability for this day — fall back to any active,
  // enabled specialist with the skill (generalist) so the booking is never orphaned.
  const generalists = pool.filter(c => hasSkill(c) && notBlocked(c));
  if (generalists.length) return generalists.slice().sort(byLoad)[0];
  return null;
}