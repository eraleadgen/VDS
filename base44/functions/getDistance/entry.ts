// Geocode a service address and return the straight-line distance in miles from Alpharetta, GA.
// Uses Nominatim (OpenStreetMap) — free, no API key required. Haversine formula for distance.
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';

// Alpharetta, GA city center
const BASE_LAT = 34.0754;
const BASE_LON = -84.2941;

function haversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3958.8; // Earth radius in miles
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

async function geocode(address: string): Promise<{ lat: number; lon: number } | null> {
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&limit=1&countrycodes=us`;
  const res = await fetch(url, {
    headers: { 'User-Agent': 'VDS-Mobile-Distance/1.0' },
  });
  if (!res.ok) return null;
  const data = await res.json();
  if (!Array.isArray(data) || !data.length) return null;
  return { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) };
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const { address } = body;

    if (!address || !address.trim()) {
      return Response.json({ success: true, distance: null });
    }

    const coords = await geocode(address.trim());
    if (!coords) {
      return Response.json({ success: true, distance: null, reason: 'geocode_failed' });
    }

    const distance = haversine(BASE_LAT, BASE_LON, coords.lat, coords.lon);
    return Response.json({ success: true, distance: Math.round(distance * 10) / 10 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});