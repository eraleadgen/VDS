// ERA Core — Create a Stripe invoice for a one-time detailing service (e.g. a ceramic
// coating job) and send it to the customer. The Stripe invoice carries metadata linking
// it back to the Base44 Invoice record, so when the customer pays, the stripe-webhook
// marks the Base44 Invoice paid and runs the shared partner-incentive attribution.
//
// Admin only. Returns the Stripe hosted invoice URL for the admin to share with the customer.
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';
import Stripe from 'npm:stripe@17.0.0';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const me = await base44.auth.me().catch(() => null);
    if (!me || me.role !== 'admin') return Response.json({ error: 'Admin only.' }, { status: 403 });

    const body = await req.json().catch(() => ({}));
    const { invoice_id } = body;
    if (!invoice_id) return Response.json({ error: 'invoice_id is required.' }, { status: 400 });

    const invoice = await base44.asServiceRole.entities.Invoice.get(invoice_id).catch(() => null);
    if (!invoice) return Response.json({ error: 'Invoice not found.' }, { status: 404 });
    if (invoice.payment_status === 'paid') return Response.json({ error: 'Invoice is already paid.' }, { status: 400 });

    const amount = Math.round((invoice.final_amount || invoice.amount || 0) * 100);
    if (amount <= 0) return Response.json({ error: 'Invoice amount must be greater than zero.' }, { status: 400 });

    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));

    // Resolve the Base44 customer for email/name.
    let customerEmail = '';
    let customerName = invoice.customer_name || '';
    if (invoice.customer_id) {
      const cust = await base44.asServiceRole.entities.Customer.get(invoice.customer_id).catch(() => null);
      if (cust) { customerEmail = cust.email || ''; customerName = customerName || `${cust.first_name || ''} ${cust.last_name || ''}`.trim(); }
    }

    // Reuse an existing Stripe customer by email when possible, otherwise create one.
    let stripeCustomerId = '';
    if (customerEmail) {
      const found = await stripe.customers.list({ email: customerEmail, limit: 1 });
      if (found.data && found.data[0]) stripeCustomerId = found.data[0].id;
    }
    if (!stripeCustomerId) {
      const cust = await stripe.customers.create({
        email: customerEmail || undefined,
        name: customerName || undefined,
        metadata: { base44_app_id: Deno.env.get('BASE44_APP_ID') },
      });
      stripeCustomerId = cust.id;
    }

    const job = invoice.job_id ? await base44.asServiceRole.entities.Job.get(invoice.job_id).catch(() => null) : null;
    const description = job?.service_label || 'Detailing service';

    // Create the Stripe invoice with metadata linking back to the Base44 Invoice so the
    // webhook can attribute the payment (and the partner incentive) automatically.
    const stripeInvoice = await stripe.invoices.create({
      customer: stripeCustomerId,
      collection_method: 'send_invoice',
      days_until_due: 7,
      description,
      metadata: {
        base44_app_id: Deno.env.get('BASE44_APP_ID'),
        base44_invoice_id: invoice.id,
      },
    });

    await stripe.invoiceItems.create({
      customer: stripeCustomerId,
      invoice: stripeInvoice.id,
      amount,
      currency: 'usd',
      description,
    });

    await stripe.invoices.finalizeInvoice(stripeInvoice.id);
    const sent = await stripe.invoices.sendInvoice(stripeInvoice.id);

    // Store the Stripe invoice id so the webhook can link the payment back to this record.
    await base44.asServiceRole.entities.Invoice.update(invoice.id, {
      stripe_payment_reference: stripeInvoice.id,
      payment_method: 'stripe',
    });

    console.log(`Stripe invoice ${stripeInvoice.id} created + sent for Base44 invoice ${invoice.id}`);
    return Response.json({ success: true, stripe_invoice_id: stripeInvoice.id, hosted_url: sent.hosted_invoice_url });
  } catch (error) {
    console.error('createStripeInvoice error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});