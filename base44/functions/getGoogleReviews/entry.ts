// Public: fetches the business's live Google reviews via the Places API so the home-page
// reviews carousel stays in sync with real reviews and auto-includes new ones over time.
// No auth — Google review data is public. The API key is the app's GOOGLE_MAPS_API_KEY.

Deno.serve(async () => {
  try {
    const key = Deno.env.get("GOOGLE_MAPS_API_KEY");
    if (!key) return Response.json({ error: "Google API key not configured." }, { status: 500 });

    // Resolve the place — try the business phone first, then a name/area text query.
    const phone = encodeURIComponent("+14704128986");
    const findUrl = `https://maps.googleapis.com/maps/api/place/findplacefromtext/json?input=${phone}&inputtype=phonenumber&fields=place_id&key=${key}`;
    let findData = await (await fetch(findUrl)).json();
    let placeId = findData?.candidates?.[0]?.place_id;
    let findSource = "phone";

    if (!placeId) {
      const q = encodeURIComponent("Valet Detailing Service Alpharetta GA");
      const findUrl2 = `https://maps.googleapis.com/maps/api/place/findplacefromtext/json?input=${q}&inputtype=textquery&fields=place_id&key=${key}`;
      findData = await (await fetch(findUrl2)).json();
      placeId = findData?.candidates?.[0]?.place_id;
      findSource = "text";
    }

    if (!placeId) {
      return Response.json({
        name: null, rating: null, total: null, reviews: [],
        debug: { findSource, status: findData?.status, error: findData?.error_message },
      });
    }

    const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=name,rating,user_ratings_total,reviews&key=${key}`;
    const details = await (await fetch(detailsUrl)).json();
    const result = details?.result || {};

    const reviews = (result.reviews || []).map((r) => ({
      author: r.author_name,
      rating: r.rating,
      text: r.text,
      time: r.time,
      relative_time: r.relative_time_description,
      profile_photo: r.profile_photo_url,
    }));

    return Response.json({
      name: result.name,
      rating: result.rating,
      total: result.user_ratings_total,
      reviews,
    });
  } catch (error) {
    console.error("getGoogleReviews error:", error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});