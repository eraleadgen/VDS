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

// LLM-based auto-classification into the operational vehicle classifications, including
// hatchback and 'other' (returned when a vehicle doesn't fit a standard class).
export async function classifyVehicle4(year, make, model) {
  if (!year || !make || !model) return null;
  try {
    // The model call lives in the classifyVehicle backend function so the browser
    // never triggers a paid LLM request directly.
    const res = await base44.functions.invoke('classifyVehicle', { year, make, model });
    return res?.data?.classification || null;
  } catch (e) {
    console.error('classifyVehicle4 error:', e);
    return null;
  }
}