import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';
import { getInternalBusinessId } from '../../shared/tenantContext.ts';

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

    const businessId = getInternalBusinessId(body);

    const entry = await base44.asServiceRole.entities.SystemEventLog.create({
      business_id: businessId,
      event_type,
      entity_type: entity_type || null,
      entity_id: entity_id || null,
      customer_id: customer_id || null,
      description: description || null,
      metadata: metadata || null,
      suppression_reason: suppression_reason || null,
    });

    // ── Auto-generate a CustomerJourney entry for customer-facing events ──
    // The journey tells the story of the customer's relationship with the business.
    // Message-level events (sent/suppressed) are audit-only and excluded to keep the
    // journey timeline focused on meaningful milestones, not every notification.
    if (customer_id) {
      const JOURNEY_MAP = {
        customer_created: { entry_type: 'account_created', title: 'Customer account created' },
        quote_requested: { entry_type: 'quote_requested', title: 'Quote requested' },
        quote_generated: { entry_type: 'quote_requested', title: 'Quote generated' },
        quote_approved: { entry_type: 'quote_approved', title: 'Quote approved' },
        job_created: { entry_type: 'quote_approved', title: 'Job created' },
        appointment_scheduled: { entry_type: 'appointment_scheduled', title: 'Appointment scheduled' },
        appointment_rescheduled: { entry_type: 'appointment_rescheduled', title: 'Appointment rescheduled' },
        appointment_cancelled: { entry_type: 'appointment_cancelled', title: 'Appointment cancelled' },
        job_assigned: { entry_type: 'specialist_assigned', title: 'Specialist assigned' },
        job_completed: { entry_type: 'service_completed', title: 'Service completed' },
        invoice_paid: { entry_type: 'invoice_paid', title: 'Invoice paid' },
        review_requested: { entry_type: 'review_requested', title: 'Review requested' },
        review_submitted: { entry_type: 'review_submitted', title: 'Review submitted' },
        membership_activated: { entry_type: 'membership_started', title: 'VDS Gold membership started' },
        membership_renewed: { entry_type: 'membership_renewed', title: 'VDS Gold membership renewed' },
        membership_cancelled: { entry_type: 'membership_cancelled', title: 'VDS Gold membership cancelled' },
      };
      const journey = JOURNEY_MAP[event_type];
      if (journey) {
        try {
          await base44.asServiceRole.entities.CustomerJourney.create({
            business_id: businessId,
            customer_id,
            entry_type: journey.entry_type,
            title: journey.title,
            description: description || journey.title,
            related_entity_type: entity_type || null,
            related_entity_id: entity_id || null,
            metadata: metadata || null,
          });
        } catch (e) { console.error('CustomerJourney error:', e.message); }
      }
    }

    return Response.json({ success: true, event_id: entry.id });
  } catch (error) {
    console.error('logEvent error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});