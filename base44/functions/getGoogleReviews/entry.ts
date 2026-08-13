// Public: fetches the business's live Google reviews via the Places API (New) and caches
// every returned review into the GoogleReview entity. The Places API surfaces at most 5
// reviews per request, so we upsert whatever it returns and reply with the FULL cached set —
// letting the home-page carousel cycle all accumulated reviews (21+) instead of only the
// latest 5. No auth — Google review data is public. Uses GOOGLE_PLACES_API_KEY (New API).

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { resolveBusinessIdFromHost } from '../../shared/tenantContext.ts';

const VDS_PLACE_ID = "ChIJzdzDrpzR9y8RyZ2fOz9rfTk";

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Phase 4: resolve business_id from the request hostname (multi-tenant).
    const businessId = await resolveBusinessIdFromHost(base44, req);

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

    const name = details?.displayName?.text || null;
    const rating = details?.rating ?? null;
    const total = details?.userRatingCount ?? null;

    const fetched = (details?.reviews || []).map((r) => ({
      author: r?.authorAttribution?.displayName || "Anonymous",
      rating: r?.rating ?? 5,
      text: r?.text?.text || "",
      publish_time: r?.publishTime || "",
      relative_time: r?.relativePublishTimeDescription || "",
      profile_photo: r?.authorAttribution?.photoUri || "",
      review_key: `${r?.authorAttribution?.displayName || "Anon"}__${r?.publishTime || ""}`,
    }));

    // Upsert freshly fetched reviews into the cache so the full set accumulates over time.
    for (const rv of fetched) {
      if (!rv.review_key || rv.review_key.endsWith("__")) continue;
      try {
        const existing = await base44.asServiceRole.entities.GoogleReview.filter({ business_id: businessId, review_key: rv.review_key });
        if (!existing || existing.length === 0) {
          await base44.asServiceRole.entities.GoogleReview.create({ ...rv, business_id: businessId });
        }
      } catch (e) {
        console.error("GoogleReview upsert error:", e.message, rv.review_key);
      }
    }

    // Return the full cached set (all accumulated reviews), newest first.
    const cached = await base44.asServiceRole.entities.GoogleReview.filter({ business_id: businessId }, "-publish_time", 100);
    const reviews = (cached || []).map((r) => ({
      author: r.author,
      rating: r.rating,
      text: r.text,
      publishTime: r.publish_time,
      relative_time: r.relative_time,
      profile_photo: r.profile_photo,
    }));

    return Response.json({ name, rating, total, reviews });
  } catch (error) {
    console.error("getGoogleReviews error:", error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});