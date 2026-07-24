// Public: fetches the business's live Google reviews via the Places API (New) so the
// home-page reviews carousel stays in sync with real reviews and auto-includes new ones
// over time. No auth — Google review data is public. Uses GOOGLE_PLACES_API_KEY (New API).
// Docs: https://developers.google.com/maps/documentation/places/web-service

Deno.serve(async () => {
  try {
    const key = Deno.env.get("GOOGLE_PLACES_API_KEY") || Deno.env.get("GOOGLE_MAPS_API_KEY");
    if (!key) return Response.json({ error: "Google API key not configured." }, { status: 500 });

    const baseHeaders = { "X-Goog-Api-Key": key };

    // 1) Text Search (New) to resolve the place by name + area.
    const searchRes = await fetch("https://places.googleapis.com/v1/places:searchText", {
      method: "POST",
      headers: {
        ...baseHeaders,
        "Content-Type": "application/json",
        "X-Goog-FieldMask": "places.id,places.displayName,places.rating,places.userRatingCount",
      },
      body: JSON.stringify({ textQuery: "Valet Detailing Service Alpharetta GA", languageCode: "en" }),
    });
    const searchData = await searchRes.json();
    const placeId = searchData?.places?.[0]?.id;
    if (!placeId) {
      return Response.json({ name: null, rating: null, total: null, reviews: [] });
    }

    // 2) Place Details (New) to fetch reviews.
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