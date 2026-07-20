// Shared timezone helpers for backend functions.
// The Deno runtime is UTC — these convert local "wall-clock" times (e.g. "10:00 AM"
// on a date string) into real UTC instants for a configured IANA timezone.
// Import as:  import { parseTimeTo24h, zonedToUtc, jobStartMs } from "../../shared/timezone.ts";

// Parse "10:00 AM" / "10:00" → "HH:MM" 24h string, or null.
export function parseTimeTo24h(preferred_time) {
  if (!preferred_time) return null;
  const m = preferred_time.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
  if (!m) return null;
  let h = parseInt(m[1], 10);
  const min = parseInt(m[2], 10);
  const mer = (m[3] || '').toUpperCase();
  if (mer === 'PM' && h !== 12) h += 12;
  if (mer === 'AM' && h === 12) h = 0;
  return `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
}

export function getTzOffsetMs(date, tz) {
  const tzDate = new Date(date.toLocaleString('en-US', { timeZone: tz }));
  const utcDate = new Date(date.toLocaleString('en-US', { timeZone: 'UTC' }));
  return tzDate.getTime() - utcDate.getTime();
}

// dateStr: "yyyy-MM-dd"; timeStr: "HH:MM" 24h. Returns a UTC Date.
export function zonedToUtc(dateStr, timeStr, tz) {
  const wallAsUtc = new Date(`${dateStr}T${timeStr}:00.000Z`);
  return new Date(wallAsUtc.getTime() - getTzOffsetMs(wallAsUtc, tz));
}

// Resolve a Job's scheduled start as a UTC epoch ms, or null.
export function jobStartMs(job, tz) {
  if (!job || !job.appointment_date) return null;
  const t24 = parseTimeTo24h(job.appointment_time);
  if (!t24) return null;
  try { return zonedToUtc(job.appointment_date, t24, tz).getTime(); }
  catch { return null; }
}