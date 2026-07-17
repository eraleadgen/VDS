// Distance from Alpharetta, GA to a service address.
// Uses Google Maps Distance Matrix API (driving distance) when GOOGLE_MAPS_API_KEY is set.
// Falls back to Nominatim (OpenStreetMap) geocoding + Haversine straight-line distance.
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';

const BASE_ADDR = 'Alpharetta, GA';
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

async function googleMapsDistance(address: string): Promise<number | null> {
  const key = Deno.env.get('GOOGLE_MAPS_API_KEY');
  if (!key) return null;
  const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${encodeURIComponent(BASE_ADDR)}&destinations=${encodeURIComponent(address)}&units=imperial&key=${key}`;
  const res = await fetch(url);
  if (!res.ok) return null;
  const data = await res.json();
  const el = data?.rows?.[0]?.elements?.[0];
  if (!el || el.status !== 'OK' || !el.distance) return null;
  return Math.round((el.distance.value / 1609.34) * 10) / 10; // meters → miles
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

    const addr = address.trim();

    // Try Google Maps (driving distance) first
    const gDist = await googleMapsDistance(addr);
    if (gDist != null) {
      return Response.json({ success: true, distance: gDist, source: 'google_maps' });
    }

    // Fallback: Nominatim + Haversine
    const coords = await geocode(addr);
    if (!coords) {
      return Response.json({ success: true, distance: null, reason: 'geocode_failed' });
    }

    const distance = haversine(BASE_LAT, BASE_LON, coords.lat, coords.lon);
    return Response.json({ success: true, distance: Math.round(distance * 10) / 10, source: 'haversine' });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});