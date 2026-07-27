import { base44 } from '@/api/base44Client';

export const CLASSIFICATION_LABEL = {
  coupe: 'Coupe',
  sedan: 'Sedan',
  hatchback: 'Hatchback',
  mid_size_suv: 'Mid Size SUV',
  truck_3_row_suv: 'Truck / 3-Row SUV',
  other: 'Other',
};

// Default VDS Mobile mapping from operational classification to pricing group.
// BusinessConfig.classification_to_pricing_group is the configurable source of truth;
// this is the fallback used by forms that don't have config loaded.
export const DEFAULT_CLASSIFICATION_TO_PRICING_GROUP = {
  coupe: 'sedan_coupe',
  sedan: 'sedan_coupe',
  hatchback: 'sedan_coupe',
  mid_size_suv: 'truck_suv',
  truck_3_row_suv: 'truck_suv',
  other: 'sedan_coupe',
};

export function defaultPricingGroupFor(classification) {
  return DEFAULT_CLASSIFICATION_TO_PRICING_GROUP[classification] || null;
}

// LLM-based auto-classification into the operational vehicle classifications (hatchback is
// its own class; 'other' is a manual-only fallback the LLM never returns).
export async function classifyVehicle4(year, make, model) {
  if (!year || !make || !model) return null;
  try {
    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `Classify this vehicle into exactly ONE of these categories based on its body style and size:

- coupe: 2-door cars, sports cars, convertibles (e.g. Ford Mustang, Porsche 911, Honda Civic Coupe, Subaru BRZ, BMW 2 Series)
- sedan: 4-door passenger cars, mid-size/full-size sedans, compact cars (e.g. Toyota Camry, Honda Accord, BMW 3 Series, Subaru Impreza, Honda Civic Sedan)
- hatchback: 3- or 5-door hatchbacks, compact hatchbacks, hot hatches (e.g. Mini Cooper, VW Golf / GTI, Honda Civic Hatchback, Toyota Corolla Hatchback, Subaru Impreza Hatchback)
- mid_size_suv: compact SUVs, crossovers, mid-size SUVs, wagons, minivans (e.g. Toyota RAV4, Honda CR-V, Subaru Outback, Subaru Forester, Ford Explorer, Kia Telluride, Honda Odyssey)
- truck_3_row_suv: pickup trucks, full-size SUVs, 3-row SUVs, large vans (e.g. Ford F-150, Chevrolet Silverado, Chevrolet Tahoe, GMC Yukon, Subaru Ascent, Ram 1500, Toyota Tundra)

Vehicle: ${year} ${make} ${model}

Respond with ONLY the category key.`,
      response_json_schema: {
        type: 'object',
        properties: {
          classification: { type: 'string', enum: ['coupe', 'sedan', 'hatchback', 'mid_size_suv', 'truck_3_row_suv'] },
        },
      },
    });
    return result?.classification || null;
  } catch (e) {
    console.error('classifyVehicle4 error:', e);
    return null;
  }
}