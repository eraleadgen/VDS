// Pricing Engine — single source of truth for all VDS pricing.
// Retell AI must NEVER calculate prices. It must always call this endpoint.

const PRICING = {
  // vehicle_type -> service -> { price, duration_minutes, label }
  sedan_coupe: {
    exterior_detail:         { price: 150, duration: 60,  label: 'Exterior Detail' },
    interior_detail:         { price: 150, duration: 90,  label: 'Interior Detail' },
    full_detail:             { price: 250, duration: 180, label: 'Full Interior + Exterior Detail' },
    engine_bay:              { price: 75,  duration: 45,  label: 'Engine Bay Detail' },
    headlight_restoration:   { price: 75,  duration: 60,  label: 'Headlight Restoration' },
    ceramic_sealant:         { price: 75,  duration: 30,  label: 'Ceramic Sealant' },
    ceramic_coating:         { price: 0,   duration: 0,   label: 'Ceramic Coating (Consultation Required)' },
    paint_correction:        { price: 0,   duration: 0,   label: 'Paint Correction (Consultation Required)' },
    vds_gold:                { price: 250, duration: 0,   label: 'VDS Gold Membership — Sedan/Coupe ($250/mo)' },
  },
  truck_suv: {
    exterior_detail:         { price: 175, duration: 75,  label: 'Exterior Detail' },
    interior_detail:         { price: 175, duration: 105, label: 'Interior Detail' },
    full_detail:             { price: 300, duration: 210, label: 'Full Interior + Exterior Detail' },
    engine_bay:              { price: 100, duration: 60,  label: 'Engine Bay Detail' },
    headlight_restoration:   { price: 75,  duration: 60,  label: 'Headlight Restoration' },
    ceramic_sealant:         { price: 100, duration: 45,  label: 'Ceramic Sealant' },
    ceramic_coating:         { price: 0,   duration: 0,   label: 'Ceramic Coating (Consultation Required)' },
    paint_correction:        { price: 0,   duration: 0,   label: 'Paint Correction (Consultation Required)' },
    vds_gold:                { price: 300, duration: 0,   label: 'VDS Gold Membership — Truck/SUV ($300/mo)' },
  },
};

const CONSULTATION_SERVICES = ['ceramic_coating', 'paint_correction'];
const BOOKING_URL = 'https://vdsmobile.com/book';

Deno.serve(async (req) => {
  try {
    const { vehicle_type, services } = await req.json();

    if (!vehicle_type || !services || !Array.isArray(services)) {
      return Response.json({ error: 'vehicle_type and services[] are required.' }, { status: 400 });
    }

    const tier = PRICING[vehicle_type] || PRICING['sedan_coupe'];
    let totalPrice = 0;
    let totalDuration = 0;
    const lineItems = [];
    let requiresConsultation = false;

    for (const svc of services) {
      const entry = tier[svc];
      if (!entry) {
        lineItems.push({ service: svc, label: svc, price: 0, duration: 0, note: 'Unknown service' });
        continue;
      }
      if (CONSULTATION_SERVICES.includes(svc)) {
        requiresConsultation = true;
        lineItems.push({ service: svc, label: entry.label, price: null, duration: null, note: 'Free consultation required — we will call to discuss' });
      } else {
        totalPrice += entry.price;
        totalDuration += entry.duration;
        lineItems.push({ service: svc, label: entry.label, price: entry.price, duration: entry.duration });
      }
    }

    const durationFormatted = totalDuration >= 60
      ? `${Math.floor(totalDuration / 60)}–${Math.ceil(totalDuration / 60 + 0.5)} hrs`
      : `${totalDuration} min`;

    const summary = lineItems.map(i =>
      i.price != null
        ? `${i.label} — $${i.price}`
        : `${i.label} — ${i.note}`
    ).join(' | ');

    return Response.json({
      vehicle_type,
      services: lineItems,
      starting_price: totalPrice,
      estimated_duration: durationFormatted,
      quote_summary: summary,
      requires_consultation: requiresConsultation,
      booking_url: BOOKING_URL,
    });

  } catch (error) {
    console.error('pricingEngine error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});