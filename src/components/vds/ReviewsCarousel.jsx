import { useState, useEffect } from 'react';
import { Star, Quote, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';

// Infinite-looping carousel of the business's live Google reviews. Fetches from the
// getGoogleReviews backend function (Places API), so it auto-includes new reviews over
// time. The track duplicates the review set and translates -50% for a seamless loop.
// Falls back to nothing (hidden) if reviews can't be loaded.
export default function ReviewsCarousel() {
  const [reviews, setReviews] = useState([]);
  const [rating, setRating] = useState(null);
  const [total, setTotal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await base44.functions.invoke('getGoogleReviews', {});
        const data = res?.data ?? res;
        if (data?.reviews?.length) {
          setReviews(data.reviews);
          setRating(data.rating);
          setTotal(data.total);
        } else {
          setFailed(true);
        }
      } catch {
        setFailed(true);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <section className="py-16 md:py-20 bg-obsidian">
        <div className="flex justify-center"><Loader2 size={26} className="text-gold animate-spin" /></div>
      </section>
    );
  }

  // Silent fallback — if reviews can't be fetched, the section simply doesn't render.
  if (failed || !reviews.length) return null;

  const loop = [...reviews, ...reviews];

  return (
    <section className="py-16 md:py-20 border-y border-vapor/5 overflow-hidden bg-obsidian">
      <div className="max-w-7xl mx-auto px-6 mb-10 text-center">
        <p className="text-xs font-mono-tech tracking-[0.3em] text-gold/70 mb-3">REAL RESULTS · REAL CLIENTS</p>
        <div className="flex items-center justify-center gap-3 flex-wrap">
          <h2 className="text-3xl md:text-4xl font-grotesk font-bold text-vapor">
            {rating ? `${Number(rating).toFixed(1)} ON GOOGLE` : 'GOOGLE REVIEWS'}
          </h2>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((i) => <Star key={i} size={18} className="text-gold fill-gold" />)}
          </div>
        </div>
        {total ? (
          <p className="text-vapor/40 text-xs font-mono-tech mt-2 tracking-widest">{total} VERIFIED REVIEWS</p>
        ) : null}
      </div>

      <div className="relative">
        {/* Edge fades */}
        <div className="absolute left-0 top-0 bottom-0 w-16 sm:w-24 bg-gradient-to-r from-obsidian to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-16 sm:w-24 bg-gradient-to-l from-obsidian to-transparent z-10 pointer-events-none" />

        <div
          className="reviews-track flex gap-5 w-max"
          style={{ animation: `marquee ${Math.max(reviews.length * 10, 50)}s linear infinite` }}
        >
          {loop.map((r, i) => (
            <div
              key={i}
              className="w-[300px] sm:w-[380px] shrink-0 glass-panel border border-vapor/10 rounded-sm p-6"
            >
              <Quote size={22} className="text-gold/40 mb-3" />
              <div className="flex gap-1 mb-3">
                {[1, 2, 3, 4, 5].map((s) => <Star key={s} size={13} className="text-gold fill-gold" />)}
              </div>
              <p className="text-vapor/70 text-sm font-grotesk leading-relaxed line-clamp-5 mb-5">
                &ldquo;{r.text}&rdquo;
              </p>
              <div className="flex items-center justify-between gap-3">
                <p className="text-vapor font-grotesk font-semibold text-sm truncate">{r.author}</p>
                <span className="text-[10px] font-mono-tech tracking-widest text-vapor/40 shrink-0">VIA GOOGLE</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}