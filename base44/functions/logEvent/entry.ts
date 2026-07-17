import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';

// Centralized event logger for ERA Core's event-driven architecture.
// Invoked by other backend functions to record significant platform events
// and suppressed communications to the SystemEventLog entity.
// Protected by the shared SCHEDULER_TOKEN secret — not callable by end users.

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();

    // Validate internal call via shared secret
    if (body.scheduler_token !== Deno.env.get('SCHEDULER_TOKEN')) {
      return Response.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const {
      event_type,
      entity_type,
      entity_id,
      customer_id,
      description,
      metadata,
      suppression_reason,
    } = body;

    if (!event_type) {
      return Response.json({ error: 'event_type is required' }, { status: 400 });
    }

    const entry = await base44.asServiceRole.entities.SystemEventLog.create({
      event_type,
      entity_type: entity_type || null,
      entity_id: entity_id || null,
      customer_id: customer_id || null,
      description: description || null,
      metadata: metadata || null,
      suppression_reason: suppression_reason || null,
    });

    return Response.json({ success: true, event_id: entry.id });
  } catch (error) {
    console.error('logEvent error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});