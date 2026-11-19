import { createClientFromRequest } from 'npm:@base44/sdk@0.8.39';

// Vehicle classifier — LLM-backed, moved off the browser.
//
// The booking page used to call Core.InvokeLLM directly from the client, which let
// any visitor trigger a paid model call with no limit. This endpoint owns the call
// and rate-limits it per IP. Public by design: the booking form is usable by guests.

import { rateLimit, clientIp } from '../../shared/rateLimit.ts';

const PROMPT_HEAD = `Classify this vehicle into exactly ONE of these categories based on its body style and size:

- coupe: 2-door cars, sports cars, convertibles (e.g. Ford Mustang, Porsche 911, Honda Civic Coupe, Subaru BRZ, BMW 2 Series)
- sedan: 4-door passenger cars, mid-size/full-size sedans, compact cars (e.g. Toyota Camry, Honda Accord, BMW 3 Series, Subaru Impreza, Honda Civic Sedan)
- hatchback: 3- or 5-door hatchbacks, compact hatchbacks, hot hatches (e.g. Mini Cooper, VW Golf / GTI, Honda Civic Hatchback, Toyota Corolla Hatchback, Subaru Impreza Hatchback)
- mid_size_suv: compact SUVs, crossovers, mid-size SUVs, wagons, minivans (e.g. Toyota RAV4, Honda CR-V, Subaru Outback, Subaru Forester, Ford Explorer, Kia Telluride, Honda Odyssey)
- truck_3_row_suv: pickup trucks, full-size SUVs, 3-row SUVs, large vans (e.g. Ford F-150, Chevrolet Silverado, Chevrolet Tahoe, GMC Yukon, Subaru Ascent, Ram 1500, Toyota Tundra)
- other: any vehicle that does not clearly fit one of the above (e.g. motorcycle, RV, trailer, commercial truck, or unusual body style)

Vehicle: `;

const PROMPT_TAIL = `

Respond with ONLY the category key.`;

export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);

    const ip = clientIp(req);
    if (!rateLimit('classifyVehicle:' + ip, 20, 60 * 60 * 1000)) {
      return Response.json({ error: 'Too many requests. Please try again later.' }, { status: 429 });
    }

    const body = await req.json().catch(() => ({}));
    const year = String(body.year || '').trim().slice(0, 10);
    const make = String(body.make || '').trim().slice(0, 40);
    const model = String(body.model || '').trim().slice(0, 40);
    if (!year || !make || !model) {
      return Response.json({ classification: null });
    }

    const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: PROMPT_HEAD + year + ' ' + make + ' ' + model + PROMPT_TAIL,
      response_json_schema: {
        type: 'object',
        properties: {
          classification: { type: 'string', enum: ['coupe', 'sedan', 'hatchback', 'mid_size_suv', 'truck_3_row_suv', 'other'] },
        },
      },
    });

    return Response.json({ classification: (result && result.classification) || null });
  } catch (error) {
    console.error('classifyVehicle error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
}