// ERA Core — shared "invoice paid" side-effects, called from BOTH the manual admin
// "mark paid" flow (adminUpdateInvoice in adminHandlers.ts) AND the Stripe webhook
// (base44/functions/stripe-webhook/entry.ts) when a one-time service invoice is paid.
//
// Keeping this logic in a standalone, dependency-free shared module means the partner
// Network incentive is credited automatically no matter HOW the invoice gets paid —
// cash, card, or a Stripe invoice the customer pays online. The PartnerReferral.attributed
// flag makes attribution idempotent (safe to run twice).
//
// Side effects: customer lifetime_revenue + total_jobs, partner conversion/revenue/
// incentive credit, invoice_paid event log, and auto-finalization of the linked quote.

export async function onInvoicePaid(base44, invoice_id) {
  if (!invoice_id) return;
  try {
    const invoice = await base44.asServiceRole.entities.Invoice.get(invoice_id).catch(() => null);
    if (!invoice) return;

    // 1. Customer lifetime revenue + total jobs
    if (invoice.customer_id) {
      const customer = await base44.asServiceRole.entities.Customer.get(invoice.customer_id).catch(() => null);
      if (customer) {
        await base44.asServiceRole.entities.Customer.update(customer.id, {
          lifetime_revenue: (customer.lifetime_revenue || 0) + (invoice.final_amount || invoice.amount || 0),
          total_jobs: (customer.total_jobs || 0) + 1,
        });
      }
    }

    // 2. Partner Network: attribute conversion + revenue + incentive to the referring partner.
    //    Attribution is keyed off the Customer's referred_by_partner_id (set at first referral
    //    booking), so a partner is correctly credited when a coating CONSULTATION converts to a
    //    later PURCHASE. Idempotent via PartnerReferral.attributed.
    try {
      if (invoice.customer_id) {
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
          // $30 initial detail (one-time per client), $100 ceramic coating / paint correction.
          let incentiveType = 'initial_detail';
          if (svcLower.includes('coating') || svcLower.includes('ceramic')) incentiveType = 'ceramic_coating';
          else if (svcLower.includes('paint correction') || svcLower.includes('correction')) incentiveType = 'paint_correction';
          let incentiveAmount = 0;
          try {
            const cfgs = await base44.asServiceRole.entities.BusinessConfig.filter({ is_active: true });
            const incentives = (cfgs && cfgs[0]?.referral_program?.incentives) || {};
            incentiveAmount = Number(incentives[incentiveType] ?? (incentiveType === 'initial_detail' ? 30 : 100)) || 0;
          } catch (e) { incentiveAmount = incentiveType === 'initial_detail' ? 30 : 100; }
          // initial_detail is one-time per referred client.
          if (incentiveType === 'initial_detail' && invoice.customer_id) {
            try {
              const prior = await base44.asServiceRole.entities.PartnerReferral.filter({
                partner_id: partnerId, customer_id: invoice.customer_id, incentive_type: 'initial_detail'
              });
              const priorCredited = (prior || []).some(r => r.attributed && r.job_id !== invoice.job_id);
              if (priorCredited) incentiveAmount = 0;
            } catch (e) { console.error('incentive one-time check failed:', e.message); }
          }
          if (incentiveAmount <= 0) incentiveType = 'none';

          let credit = false;
          if (!referral) {
            await base44.asServiceRole.entities.PartnerReferral.create({
              partner_id: partnerId, customer_id: invoice.customer_id, job_id: invoice.job_id || null,
              service_package: job?.service_package || '', status: 'converted', revenue, attributed: true,
              incentive_type: incentiveType, incentive_amount: incentiveAmount,
            });
            credit = true;
          } else if (!referral.attributed) {
            await base44.asServiceRole.entities.PartnerReferral.update(referral.id, {
              status: 'converted', revenue, attributed: true, incentive_type: incentiveType, incentive_amount: incentiveAmount,
            });
            credit = true;
          }
          if (credit) {
            const partner = await base44.asServiceRole.entities.Partner.get(partnerId).catch(() => null);
            if (partner) {
              const inc = {
                conversions_count: (partner.conversions_count || 0) + 1,
                revenue_generated: (partner.revenue_generated || 0) + revenue,
                incentives_earned: (partner.incentives_earned || 0) + incentiveAmount,
              };
              if (svcLower.includes('coating') || svcLower.includes('ceramic')) inc.ceramic_coatings_generated = (partner.ceramic_coatings_generated || 0) + 1;
              if (svcLower.includes('paint correction') || svcLower.includes('correction')) inc.paint_corrections_generated = (partner.paint_corrections_generated || 0) + 1;
              await base44.asServiceRole.entities.Partner.update(partnerId, inc);
            }
          }
        }
      }
    } catch (e) { console.error('Partner attribution error:', e.message); }

    // 3. Event log
    await base44.asServiceRole.functions.invoke('logEvent', {
      event_type: 'invoice_paid', entity_type: 'invoice', entity_id: invoice_id,
      customer_id: invoice?.customer_id, description: `Invoice ${invoice?.invoice_number} marked as paid`,
      metadata: { amount: invoice?.final_amount, payment_method: invoice?.payment_method },
      scheduler_token: Deno.env.get('SCHEDULER_TOKEN'),
    });

    // 4. Auto-finalize the linked quote when the invoice is paid.
    if (invoice.job_id) {
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
          }
        }
      } catch (e) { console.error('Quote auto-finalize on payment failed:', e.message); }
    }
  } catch (e) { console.error('Invoice payment update error:', e.message); }
}