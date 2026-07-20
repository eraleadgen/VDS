// ERA Core — Google Calendar helpers, shared by the scheduler entry and the
// admin handlers module. Business-agnostic (no VDS-specific logic).
export async function gcal(token, method, path, body) {
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
export async function removeGcalEvent(base44, eventId) {
  if (!eventId) return;
  try {
    const { accessToken } = await base44.asServiceRole.connectors.getConnection('googlecalendar');
    await gcal(accessToken, 'DELETE', `/calendars/primary/events/${eventId}`, null);
  } catch (e) { console.error('GCal delete error:', e.message); }
}