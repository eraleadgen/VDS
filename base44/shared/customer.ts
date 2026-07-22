// Shared customer find-or-create helper (ERA Core CRM).
// Guarantees ONE canonical phone format (E.164) and ONE robust lookup across every
// customer-creation path, preventing duplicate Customer records when a contact flows
// in from different channels (website booking vs. Valerie SMS vs. admin).
//
// Lookup order: linked_user_id → phone (E.164 exact, then last-10-digit fallback) → email.
// When found, missing fields are merged in instead of creating a new record.

export function toE164(phone) {
  if (!phone) return '';
  let d = phone.replace(/\D/g, '');
  if (d.length === 10) d = '1' + d;
  return d.length >= 10 ? '+' + d : '';
}

// Find an existing Customer by phone (E.164 exact, then last-10-digit fallback) or email.
export async function findCustomer(base44, phone, email) {
  if (phone) {
    const e164 = toE164(phone);
    let customers = await base44.asServiceRole.entities.Customer.filter({ phone: e164 }).catch(() => []);
    if (!customers.length) {
      const d = phone.replace(/\D/g, '');
      if (d.length >= 10) {
        const all = await base44.asServiceRole.entities.Customer.list().catch(() => []);
        customers = (all || []).filter(c => (c.phone || '').replace(/\D/g, '').slice(-10) === d.slice(-10));
      }
    }
    if (customers.length) return customers[0];
  }
  if (email) {
    const e = email.toLowerCase();
    const all = await base44.asServiceRole.entities.Customer.list().catch(() => []);
    const found = (all || []).find(c => c.email && c.email.toLowerCase() === e);
    if (found) return found;
  }
  return null;
}

// Find-or-create a Customer. Stores phone in canonical E.164 so every channel agrees.
// Returns { customer, created }.
export async function findOrCreateCustomer(base44, opts) {
  const {
    phone, firstName, lastName, email, linkedUserId, address,
    smsConsent = true,
  } = opts || {};

  let customer = null;

  // 1) Strongest match — authenticated user link
  if (linkedUserId) {
    const byUser = await base44.asServiceRole.entities.Customer.filter({ linked_user_id: linkedUserId }).catch(() => []);
    if (byUser && byUser.length > 0) customer = byUser[0];
  }
  // 2) Phone match (E.164 exact, then last-10-digit fallback)
  if (!customer && phone) {
    customer = await findCustomer(base44, phone, null);
  }
  // 3) Email match
  if (!customer && email) {
    customer = await findCustomer(base44, null, email);
  }

  if (customer) {
    const updates = {};
    if (smsConsent && !customer.sms_consent) updates.sms_consent = true;
    if (email && !customer.email) updates.email = email;
    if (linkedUserId && !customer.linked_user_id) updates.linked_user_id = linkedUserId;
    if (address && !(customer.service_addresses || []).includes(address)) {
      updates.service_addresses = [...(customer.service_addresses || []), address];
    }
    if (Object.keys(updates).length > 0) {
      await base44.asServiceRole.entities.Customer.update(customer.id, updates);
    }
    return { customer, created: false };
  }

  customer = await base44.asServiceRole.entities.Customer.create({
    linked_user_id: linkedUserId || null,
    first_name: firstName || '',
    last_name: lastName || '',
    email: email || null,
    phone: toE164(phone) || phone || '',
    sms_consent: smsConsent !== false,
    email_consent: true,
    service_addresses: address ? [address] : [],
    customer_since: new Date().toISOString().split('T')[0],
    account_status: 'active',
  });
  return { customer, created: true };
}