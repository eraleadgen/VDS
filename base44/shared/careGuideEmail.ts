// ERA Core — Client Care Guide auto-delivery.
// Each service has a focused care guide (ceramic_coating, paint_correction, detailing,
// vds_gold). Ceramic coatings, paint corrections and VDS Gold sign-ups are emailed
// automatically after payment; regular detailing guides are emailed after job completion.
//
// NOTE: the Base44 SendEmail integration only delivers to registered app users. Gold
// members are registered (they created accounts), so VDS Gold delivery always works.
// Guest detailing / coating / correction clients who never registered may be rejected by
// the email service — those sends are logged to SystemEventLog as suppressed.

// Map a job's service to the matching care-guide key.
export function guideKeyForService(servicePackage, serviceLabel) {
  const s = ((servicePackage || '') + ' ' + (serviceLabel || '')).toLowerCase();
  if (s.includes('coating')) return 'ceramic_coating';
  if (s.includes('correction')) return 'paint_correction';
  if (s.includes('gold')) return 'vds_gold';
  return 'detailing';
}

// Guide content for the email body. Kept self-contained (no frontend import) so this
// module can run in the Deno backend. Mirrors src/lib/careGuides.js customer-facing text.
const GUIDES = {
  ceramic_coating: {
    subject: 'Your VDS Ceramic Coating — Care Guide',
    headline: 'Ceramic Coating Aftercare',
    intro: 'Your ceramic coating needs a brief cure period and gentle maintenance to perform for years. Follow these steps to protect your investment.',
    sections: [
      { title: 'The 48-Hour Cure', bullets: [
        'Do not wash the vehicle for the first 48 hours — the coating is curing and bonding to the paint during this window.',
        'Keep the vehicle in a covered area (garage or parking deck) for the entire 48-hour cure, away from rain and the elements.',
      ] },
      { title: 'Ongoing Maintenance', bullets: [
        'After curing, wash every 2–4 weeks using a pH-neutral, coating-safe shampoo — never dish soap or degreasers.',
        'Use the two-bucket method (one rinse, one wash) with a clean microfiber mitt to prevent swirl marks.',
        'Top up the coating\'s hydrophobic behavior with a ceramic sealant every 6 months.',
        'Dry with a leaf blower — the most effective method with a ceramic coating (less contact with the paint).',
        'Have the coating inspected annually by a VDS specialist to check for worn or compromised areas.',
      ] },
      { title: 'Hazards to Avoid', bullets: [
        'Once cured, do not park under trees or near sprinklers — sap, bird droppings, and hard-water spots etch the coating if left untreated.',
        'Remove bird droppings and sap promptly: soften with a damp microfiber, then gently lift off. Never scrape dry.',
        'VDS Mobile is not responsible for damage caused by improper care or mistreatment of a ceramic-coated vehicle.',
      ] },
    ],
  },
  paint_correction: {
    subject: 'Your VDS Paint Correction — Care Guide',
    headline: 'Paint Correction Aftercare',
    intro: 'Freshly corrected paint is delicate. Protect it and keep it clean to preserve the finish.',
    sections: [
      { title: 'Protect Corrected Paint Immediately', bullets: [
        'Apply a sealant, ceramic coating, or PPF as soon as possible — corrected paint has no protective layer until you do.',
        'Until protected, treat the paint as freshly polished: minimal contact, gentle washing only.',
      ] },
      { title: 'Safe Washing', bullets: [
        'Wash using the two-bucket method with plush microfiber towels only.',
        'Never wipe the paint dry — always use a detail spray or pre-rinse to lift dirt first.',
        'Blot dry with a clean microfiber towel instead of wiping in circles.',
        'Avoid drive-through brush washes entirely; they will re-introduce swirl marks.',
      ] },
      { title: 'Hazards to Avoid', bullets: [
        'Do not wipe paint with a dry towel or your hand (even "just dusting").',
        'Parking under trees — sap and bird droppings etch paint within hours.',
        'Parking in sprinkler range — sprinklers cause hard-water spots that can stain the finish.',
      ] },
    ],
  },
  detailing: {
    subject: 'Your VDS Detail — Care Guide',
    headline: 'Detailing Aftercare',
    intro: 'Proper technique is the single biggest factor in keeping your paint flawless between details. Use these methods yourself, or let us handle it through VDS Gold.',
    sections: [
      { title: 'Safe Washing — The Two-Bucket Method', bullets: [
        'Bucket 1: clean soapy water (pH-neutral shampoo). Bucket 2: plain rinse water for the mitt.',
        'Work top-down, one panel at a time, rinsing the mitt in the rinse bucket before reloading.',
        'Use grit guards in both buckets to trap dirt at the bottom.',
        'Dry immediately with a clean, plush microfiber drying towel — never air-dry (water spots etch paint).',
        'Wash in shade or early morning; never wash hot paint in direct sunlight.',
      ] },
      { title: 'Interior Care', bullets: [
        'Vacuum weekly to prevent grit from grinding into carpets and seats.',
        'Wipe interior plastics with a damp microfiber; use a UV-safe interior dressing every 6–8 weeks.',
        'Condition leather every 3 months with a pH-balanced leather conditioner — avoid silicone-heavy products.',
        'Clean spills immediately; blot, do not rub, to avoid spreading stains.',
        'Window tint acts as a UV protector for the interior — it reduces fading and cracking of the dash, leather, and trim.',
      ] },
      { title: 'What to Avoid', bullets: [
        'Automated brush car washes — the #1 cause of swirl marks.',
        'Dish soap, household cleaners, or degreasers — they strip coatings and waxes.',
        'Wiping paint with a dry towel or your hand.',
        'Parking under trees or in sprinkler range.',
      ] },
    ],
  },
  vds_gold: {
    subject: 'Welcome to VDS Gold — Member Care Guide',
    headline: 'VDS Gold Member Care',
    intro: 'Your VDS Gold membership keeps your vehicle in showroom condition all year. Here is how to get the most from your membership and protect your finish between visits.',
    sections: [
      { title: "What's Included", bullets: [
        'Unlimited exterior details (ceramic sealant included).',
        'One full detail per month.',
        'Annual ceramic coating inspection and maintenance top-up.',
        '$250/month for sedans and coupes · $300/month for trucks and SUVs.',
      ] },
      { title: 'Maintenance Cadence', bullets: [
        'Bi-weekly express exterior washes prevent contaminant buildup between details.',
        'Schedule your monthly full detail through your Member Dashboard to lock in your preferred slot.',
        'Keep your vehicle information up to date (paint protection, mileage) so we tailor every visit.',
      ] },
      { title: 'Between Visits', bullets: [
        'Use the two-bucket method for any at-home washes; never use dish soap or automated brush washes.',
        'Remove bird droppings and sap promptly to protect your coating.',
        'Dry with a leaf blower or plush microfiber to minimize paint contact.',
      ] },
    ],
  },
};

function goldCtaHtml(website) {
  return `
  <div style="border:1px solid rgba(212,175,55,0.4);background:rgba(212,175,55,0.08);border-radius:10px;padding:18px 20px;margin-top:24px;">
    <h2 style="color:#D4AF37;margin:0 0 8px;font-size:16px;">Keep It Showroom-Fresh with VDS Gold</h2>
    <p style="margin:0 0 14px;color:#E2E8F0;font-size:14px;line-height:1.6;">The methods in this guide are exactly how we maintain our own clients' vehicles. With VDS Gold you get unlimited exterior details (ceramic sealant included) and one full detail every month, plus an annual ceramic coating inspection — so your finish stays protected for the life of your membership. $250/mo for sedans &amp; coupes · $300/mo for trucks &amp; SUVs.</p>
    <a href="${website}/membership" style="display:inline-block;background:#D4AF37;color:#0A0B0D;text-decoration:none;font-family:'Space Mono',monospace;font-size:12px;letter-spacing:2px;padding:12px 22px;border-radius:4px;">◆ EXPLORE VDS GOLD</a>
  </div>`;
}

function buildEmailHtml(guide, firstName, guideKey, website) {
  let websiteHost = '';
  try { websiteHost = new URL(website).hostname; } catch (_) { websiteHost = website; }
  const sections = guide.sections.map((s) => `
    <h2 style="color:#D4AF37;font-size:16px;margin:24px 0 10px;">${s.title}</h2>
    <ul style="padding-left:20px;margin:0;">
      ${s.bullets.map((b) => `<li style="color:#E2E8F0;font-size:14px;line-height:1.6;margin-bottom:8px;">${b}</li>`).join('')}
    </ul>`).join('');
  const buttons = `
    <div style="margin-top:24px;display:flex;flex-wrap:wrap;gap:12px;">
      <a href="${website}/member-dashboard" style="display:inline-block;background:#D4AF37;color:#0A0B0D;text-decoration:none;font-family:'Space Mono',monospace;font-size:12px;letter-spacing:2px;padding:12px 22px;border-radius:4px;">◆ VIEW ON YOUR ACCOUNT</a>
      <a href="${website}/care-guide/${guideKey}" style="display:inline-block;border:1px solid rgba(212,175,55,0.5);color:#D4AF37;text-decoration:none;font-family:'Space Mono',monospace;font-size:12px;letter-spacing:2px;padding:12px 22px;border-radius:4px;">⤓ DOWNLOAD GUIDE</a>
    </div>`;
  return `<!DOCTYPE html><html><head><meta charset="utf-8"></head><body style="margin:0;background:#0A0B0D;font-family:'Space Grotesk',system-ui,sans-serif;">
  <div style="max-width:640px;margin:0 auto;padding:32px 20px;">
    <p style="font-family:'Space Mono',monospace;font-size:11px;letter-spacing:3px;color:#D4AF37;text-transform:uppercase;margin:0 0 8px;">VDS MOBILE · CLIENT CARE GUIDE</p>
    <h1 style="color:#D4AF37;font-size:24px;margin:0 0 8px;">${guide.headline}</h1>
    <p style="color:#E2E8F0;font-size:15px;line-height:1.6;">Hi ${firstName}, thank you for choosing VDS Mobile. ${guide.intro}</p>
    ${sections}
    ${goldCtaHtml(website)}
    ${buttons}
    <p style="margin-top:28px;padding-top:18px;border-top:1px solid rgba(212,175,55,0.25);font-family:'Space Mono',monospace;font-size:10px;letter-spacing:2px;color:#E2E8F0;opacity:0.5;text-align:center;text-transform:uppercase;">Valet Detailing Service LLC · (470) 412-8986 · ${websiteHost}</p>
  </div></body></html>`;
}

async function logCareGuideEvent(base44, { guideKey, customerId, to, sent, reason, businessId }) {
  try {
    await base44.asServiceRole.entities.SystemEventLog.create({
      business_id: businessId,
      event_type: sent ? 'care_guide_sent' : 'care_guide_suppressed',
      entity_type: 'customer',
      entity_id: customerId || null,
      customer_id: customerId || null,
      description: sent
        ? `Care guide "${guideKey}" emailed to ${to}`
        : `Care guide "${guideKey}" to ${to} suppressed: ${reason || 'unknown'}`,
      suppression_reason: sent ? null : (reason || 'send_failed'),
      metadata: { guide: guideKey, recipient: to },
    });
  } catch (e) { console.error('care guide event log failed:', e.message); }
}

// Send the matching care-guide email to a customer. Returns { sent, reason }.
export async function sendCareGuideEmail(base44, { guideKey, to, customerName, customerId, businessId = 'vds' }) {
  if (!to) return { sent: false, reason: 'no_email' };
  const guide = GUIDES[guideKey] || GUIDES.detailing;
  const firstName = (customerName || '').split(' ')[0] || 'there';
  // Resolve the tenant's website origin from BusinessConfig so care-guide email links
  // (membership, member dashboard, care-guide download) point to the tenant's own domain,
  // never a hardcoded VDS domain. If the tenant's website can't be resolved, suppress the
  // email rather than send links pointing to the wrong domain.
  let website = '';
  try {
    const configs = await base44.asServiceRole.entities.BusinessConfig.filter({ business_id: businessId, is_active: true });
    const cfg = configs && configs[0];
    const bookingUrl = cfg && cfg.website_links && cfg.website_links.booking_url;
    if (bookingUrl) website = new URL(bookingUrl).origin;
  } catch (e) { console.error('care guide config load failed:', e.message); }
  if (!website) {
    await logCareGuideEvent(base44, { guideKey, customerId, to, sent: false, reason: 'no_website_config', businessId });
    return { sent: false, reason: 'no_website_config' };
  }
  const body = buildEmailHtml(guide, firstName, guideKey, website);
  try {
    await base44.asServiceRole.integrations.Core.SendEmail({
      to, subject: guide.subject, body,
    });
    await logCareGuideEvent(base44, { guideKey, customerId, to, sent: true, businessId });
    return { sent: true };
  } catch (e) {
    await logCareGuideEvent(base44, { guideKey, customerId, to, sent: false, reason: e.message, businessId });
    console.error(`care guide email failed (${guideKey} → ${to}):`, e.message);
    return { sent: false, reason: e.message };
  }
}