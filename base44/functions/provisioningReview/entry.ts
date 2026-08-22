import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { assertEraStaff } from '../../shared/eraStaffAuth.ts';

// ERA Systems 24-hour provisioning review.
//
// Actions:
//   auto_approve_past_deadline — runs from a scheduled automation (no user context).
//     Scans every EraAccount still 'pending_review' whose review_deadline has passed
//     and marks it 'approved' (reviewed_by = 'system_auto'), then emails the member
//     that their site is fully live. This guarantees a tenant is never blocked
//     indefinitely — ERA staff have the 24h window to review (or reject); if they
//     do nothing, the tenant auto-unlocks at the deadline.
//
//   approve / reject — ERA staff only (assertEraStaff). Resolves a single review
//     early (before the deadline) or flags issues. Notifies the member by email.

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const action = body.action || 'auto_approve_past_deadline';

    // ── auto_approve_past_deadline (scheduled, no user) ───────────────
    if (action === 'auto_approve_past_deadline') {
      const accounts = await base44.asServiceRole.entities.EraAccount.filter({
        provisioning_review_status: 'pending_review',
      }).catch(() => []);

      const now = Date.now();
      let approved = 0;
      for (const a of (accounts || [])) {
        if (!a.review_deadline) continue;
        if (new Date(a.review_deadline).getTime() >= now) continue;

        await base44.asServiceRole.entities.EraAccount.update(a.id, {
          provisioning_review_status: 'approved',
          reviewed_at: new Date().toISOString(),
          reviewed_by: 'system_auto',
          review_notes: 'Auto-approved: 24-hour review window elapsed with no manual action.',
        }).catch((e: any) => console.error('auto-approve update failed:', e.message));

        try {
          if (a.email) {
            await base44.asServiceRole.integrations.Core.SendEmail({
              to: a.email,
              subject: 'Your ERA Core site is fully live',
              body: [
                'Hi,',
                '',
                "Your 24-hour ERA Systems review window has completed and your site is now fully live. All operational tools for your tier are unlocked in your member portal at https://eraleadgen.com/era-portal.",
                '',
                'If you have any questions, reply to this email or reach out to ERA Systems support.',
                '',
                '— ERA Systems',
              ].join('\n'),
            });
          }
        } catch (e: any) {
          console.error('auto-approve email failed:', e.message);
        }
        approved++;
      }

      return Response.json({ success: true, auto_approved: approved });
    }

    // ── approve / reject (ERA staff only) ─────────────────────────────
    if (action === 'approve' || action === 'reject') {
      const auth = await assertEraStaff(base44);
      if (!auth.authorized) {
        return Response.json(
          { error: auth.status === 401 ? 'Unauthorized' : 'Forbidden: ERA Systems staff only' },
          { status: auth.status }
        );
      }
      const { era_account_id, notes } = body;
      if (!era_account_id) {
        return Response.json({ error: 'era_account_id required' }, { status: 400 });
      }

      const status = action === 'approve' ? 'approved' : 'rejected';
      await base44.asServiceRole.entities.EraAccount.update(era_account_id, {
        provisioning_review_status: status,
        reviewed_at: new Date().toISOString(),
        reviewed_by: auth.user.id,
        review_notes: notes || '',
      });

      const acct = await base44.asServiceRole.entities.EraAccount.get(era_account_id).catch(() => null);
      try {
        if (acct?.email) {
          await base44.asServiceRole.integrations.Core.SendEmail({
            to: acct.email,
            subject:
              action === 'approve'
                ? 'Your ERA Core site is approved'
                : 'ERA Core review needs attention',
            body:
              action === 'approve'
                ? 'Your ERA Core site has been reviewed and approved by ERA Systems. All operational tools for your tier are now unlocked in your member portal at https://eraleadgen.com/era-portal.'
                : `Your ERA Core review found items that need attention before your tools unlock.\n\nNotes from ERA Systems:\n${notes || 'Please contact ERA Systems support to resolve.'}`,
          });
        }
      } catch (e: any) {
        console.error('review notify email failed:', e.message);
      }

      try {
        await base44.asServiceRole.entities.SystemEventLog.create({
          business_id: 'era_systems',
          event_type: 'era_provisioning_review',
          entity_type: 'EraAccount',
          entity_id: era_account_id,
          description: `ERA staff ${action === 'approve' ? 'approved' : 'rejected'} provisioning review for ${acct?.email || era_account_id}`,
          metadata: { staff_user_id: auth.user.id, status, notes: notes || '' },
        });
      } catch (_) {}

      return Response.json({ success: true, status });
    }

    return Response.json({ error: `Unknown action: ${action}` }, { status: 400 });
  } catch (error) {
    console.error('provisioningReview error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});