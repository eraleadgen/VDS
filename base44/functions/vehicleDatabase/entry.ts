// Vehicle Database — proxies the NHTSA VPIC API to fetch vehicle models by year + make.
// Used by the Pricing page vehicle selector dropdowns. Public endpoint (no auth needed).
// NHTSA VPIC is a free, keyless government API: https://vpic.nhtsa.dot.gov/api/

Deno.serve(async (req) => {
  try {
    if (req.method === 'OPTIONS') {
      return new Response(null, { status: 204 });
    }

    const body = await req.json().catch(() => ({}));
    const { action, year, make } = body;

    if (action === 'models') {
      if (!year || !make) {
        return Response.json({ error: 'year and make are required.' }, { status: 400 });
      }
      const url = `https://vpic.nhtsa.dot.gov/api/vehicles/GetModelsForMakeYear/make/${encodeURIComponent(make)}/modelyear/${encodeURIComponent(year)}?format=json`;
      const resp = await fetch(url);
      if (!resp.ok) {
        return Response.json({ models: [] });
      }
      const data = await resp.json();
      // VPIC matches the make name by substring, so a loose name like "Mini" also returns
      // trailer/LLC manufacturers ("Mobile Mini Inc.", "My Mini Trailer LLC."). Keep only
      // results whose Make_Name exactly matches the requested make (case-insensitive) so the
      // dropdown shows only the real brand's models.
      const makeUpper = make.toUpperCase();
      const models = [...new Set(
        (data.Results || [])
          .filter(r => r.Make_Name && r.Make_Name.toUpperCase() === makeUpper)
          .map(r => r.Model_Name)
          .filter(Boolean)
      )].sort((a, b) => a.localeCompare(b));
      return Response.json({ models });
    }

    return Response.json({ error: 'Unknown action.' }, { status: 400 });
  } catch (error) {
    console.error('vehicleDatabase error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});