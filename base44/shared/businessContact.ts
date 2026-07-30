// Single source of truth for business contact info used across every customer-facing
// message — reminders, booking notifications, and all welcome/invite emails. Each
// caller loads the active BusinessConfig here so phone / email / website are never
// hardcoded copies that drift out of sync. The fallbacks keep messages deliverable
// even if a field is missing from config.

export async function loadBusinessContact(base44) {
  let cfg = null;
  try {
    const cfgs = await base44.asServiceRole.entities.BusinessConfig.filter({ is_active: true });
    cfg = cfgs && cfgs[0] ? cfgs[0] : null;
  } catch (e) { console.error('BusinessConfig load error:', e.message); }

  const phone = (cfg && cfg.business_phone) || '(470) 944-6485';
  const phoneDigits = phone.replace(/\D/g, '');
  const phoneTel = phoneDigits.length === 10 ? '+1' + phoneDigits : (phoneDigits.length > 10 ? '+' + phoneDigits : phone);
  const email = (cfg && cfg.business_email) || 'Valetdetailingservice@gmail.com';
  const bookingUrl = (cfg && cfg.website_links && cfg.website_links.booking_url) || 'https://vdsmobile.com/book';
  let website = 'https://vdsmobile.com';
  try { website = new URL(bookingUrl).origin; } catch (_) {}
  const goldSignupUrl = (cfg && cfg.website_links && cfg.website_links.gold_signup_url) || (website + '/vds-gold');
  const businessName = (cfg && cfg.business_name) || 'VDS Mobile';
  const legalName = (cfg && cfg.legal_name) || businessName;
  return { phone, phoneTel, email, website, bookingUrl, goldSignupUrl, businessName, legalName, cfg };
}