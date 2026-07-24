// Public: fetches the business's live Google reviews via the Places API (New) so the
// home-page reviews carousel stays in sync with real reviews and auto-includes new ones
// over time. No auth — Google review data is public. Uses GOOGLE_PLACES_API_KEY (New API).
// Docs: https://developers.google.com/maps/documentation/places/web-service
//
// NOTE: "Valet Detailing Service" is a service-area business and is NOT currently returned
// by the (New) Places Text Search (it has no surfaced map pin), and the legacy Find Place
// From Text (phonenumber) API is disabled on this project. Until an exact Place ID (ChIJ...)
// is obtained and hardcoded below, this returns an empty list and the carousel shows its
// fallback content. To enable live reviews, set VDS_PLACE_ID and the lookup below will use it
// directly instead of searching.

const VDS_PLACE_ID = ""; // e.g. "ChIJ..." — paste the exact Place ID here to go live.

Deno.serve(async () => {
  try {
    const key = Deno.env.get("GOOGLE_PLACES_API_KEY") || Deno.env.get("GOOGLE_MAPS_API_KEY");
    if (!key) return Response.json({ error: "Google API key not configured." }, { status: 500 });

    const baseHeaders = { "X-Goog-Api-Key": key };

    // Resolve the place: prefer the hardcoded Place ID; otherwise search by name near the
    // business location. Service-area listings often aren't surfaced by search.
    let placeId = VDS_PLACE_ID;
    if (!placeId) {
      const searchRes = await fetch("https://places.googleapis.com/v1/places:searchText", {
        method: "POST",
        headers: {
          ...baseHeaders,
          "Content-Type": "application/json",
          "X-Goog-FieldMask": "places.id,places.displayName",
        },
        body: JSON.stringify({
          textQuery: "Valet Detailing Service",
          languageCode: "en",
          pageSize: 20,
          locationBias: {
            circle: {
              center: { latitude: 33.94295408989637, longitude: -84.65289852567126 },
              radius: 2000,
            },
          },
        }),
      });
      const searchData = await searchRes.json();
      const places = searchData?.places || [];
      placeId = places.find((p) =>
        (p?.displayName?.text || "").toLowerCase().includes("valet detailing service")
      )?.id;
    }

    if (!placeId) {
      return Response.json({ name: null, rating: null, total: null, reviews: [] });
    }

    // Place Details (New) to fetch reviews.
    const detailsRes = await fetch(`https://places.googleapis.com/v1/places/${placeId}`, {
      headers: { ...baseHeaders, "X-Goog-FieldMask": "id,displayName,rating,userRatingCount,reviews" },
    });
    const details = await detailsRes.json();

    const reviews = (details?.reviews || []).map((r) => ({
      author: r?.authorAttribution?.displayName,
      rating: r?.rating,
      text: r?.text?.text,
      publishTime: r?.publishTime,
      relative_time: r?.relativePublishTimeDescription,
      profile_photo: r?.authorAttribution?.photoUri,
    }));

    return Response.json({
      name: details?.displayName?.text,
      rating: details?.rating,
      total: details?.userRatingCount,
      reviews,
    });
  } catch (error) {
    console.error("getGoogleReviews error:", error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});