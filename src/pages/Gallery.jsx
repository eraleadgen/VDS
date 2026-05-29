import { useState } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import Navbar from '../components/vds/Navbar';
import Footer from '../components/vds/Footer';

const PHOTOS = [
  {
    src: 'https://images.unsplash.com/photo-1616455579100-2ceaa4ec2d28?w=1200&q=85',
    thumb: 'https://images.unsplash.com/photo-1616455579100-2ceaa4ec2d28?w=600&q=80',
    services: ['Full Detail', 'Ceramic Coating', 'Paint Correction'],
    vehicle: 'Luxury Sedan',
  },
  {
    src: 'https://images.unsplash.com/photo-1607860108855-64acf2078ed9?w=1200&q=85',
    thumb: 'https://images.unsplash.com/photo-1607860108855-64acf2078ed9?w=600&q=80',
    services: ['Interior Deep Clean', 'Steam Treatment'],
    vehicle: 'Premium SUV',
  },
  {
    src: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1200&q=85',
    thumb: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80',
    services: ['Ceramic Coating', 'GTechniq C1'],
    vehicle: 'Sports Coupe',
  },
  {
    src: 'https://images.unsplash.com/photo-1625047509248-ec889cbff17f?w=1200&q=85',
    thumb: 'https://images.unsplash.com/photo-1625047509248-ec889cbff17f?w=600&q=80',
    services: ['Paint Correction', '2-Stage Polish'],
    vehicle: 'Performance Vehicle',
  },
  {
    src: 'https://images.unsplash.com/photo-1601362840469-51e4d8d58785?w=1200&q=85',
    thumb: 'https://images.unsplash.com/photo-1601362840469-51e4d8d58785?w=600&q=80',
    services: ['Full Detail', 'Odor Removal', 'Interior Restoration'],
    vehicle: 'Luxury Crossover',
  },
  {
    src: 'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=1200&q=85',
    thumb: 'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=600&q=80',
    services: ['Exterior Detail', 'Rim Detailing', 'Ceramic Sealant'],
    vehicle: 'Grand Tourer',
  },
  {
    src: 'https://images.unsplash.com/photo-1542282088-fe8426682b8f?w=1200&q=85',
    thumb: 'https://images.unsplash.com/photo-1542282088-fe8426682b8f?w=600&q=80',
    services: ['VDS Gold Monthly', 'Exterior + Interior'],
    vehicle: 'Exotic Sports Car',
  },
  {
    src: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=1200&q=85',
    thumb: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=600&q=80',
    services: ['Paint Correction', 'Ceramic Coating'],
    vehicle: 'European Saloon',
  },
  {
    src: 'https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=1200&q=85',
    thumb: 'https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=600&q=80',
    services: ['Full Detail', 'Leather Conditioning'],
    vehicle: 'Luxury Convertible',
  },
];

export default function Gallery() {
  const [selected, setSelected] = useState(null);

  const prev = () => setSelected(s => (s - 1 + PHOTOS.length) % PHOTOS.length);
  const next = () => setSelected(s => (s + 1) % PHOTOS.length);

  return (
    <div className="bg-obsidian min-h-screen">
      <Navbar />

      {/* ── HEADER ───────────────────────────────────── */}
      <section className="relative pt-36 pb-20">
        <div className="absolute inset-0"
          style={{ background: 'radial-gradient(ellipse at 70% 0%, rgba(212,175,55,0.04) 0%, transparent 60%)' }} />
        <div className="max-w-7xl mx-auto px-6">
          <p className="text-xs font-mono-tech tracking-[0.3em] text-gold/70 mb-4">OUR WORK</p>
          <h1 className="text-5xl md:text-7xl font-grotesk font-bold text-vapor mb-6">THE ARCHIVE</h1>
          <p className="text-vapor/50 text-lg max-w-xl">
            Every vehicle tells a story. These are ours — captured at the moment of transformation.
          </p>
        </div>
      </section>

      {/* ── GRID ─────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-6 pb-24">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-0.5 bg-vapor/5">
          {PHOTOS.map((photo, i) => (
            <div
              key={i}
              className="group relative overflow-hidden cursor-pointer aspect-[4/3]"
              onClick={() => setSelected(i)}
            >
              <img
                src={photo.thumb}
                alt={photo.vehicle}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-obsidian/0 group-hover:bg-obsidian/70 transition-all duration-300" />

              {/* Hover reveal */}
              <div className="absolute inset-0 p-6 flex flex-col justify-end opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <p className="text-xs font-mono-tech text-gold/70 tracking-widest mb-2">// SERVICES PERFORMED</p>
                {photo.services.map(s => (
                  <p key={s} className="text-sm font-mono-tech text-vapor/80">— {s}</p>
                ))}
                <div className="mt-4 w-8 h-0.5 bg-gold" />
                <p className="text-xs font-mono-tech text-vapor/40 mt-2 tracking-widest">{photo.vehicle}</p>
              </div>

              <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div className="w-8 h-8 bg-gold/20 border border-gold/40 flex items-center justify-center rounded-sm">
                  <span className="text-gold text-xs">↗</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center mt-16">
          <p className="text-vapor/30 text-xs font-mono-tech tracking-widest mb-8">FOLLOW OUR WORK IN REAL TIME</p>
          <div className="flex justify-center gap-4">
            <a href="https://www.instagram.com/vdsmobile/" target="_blank" rel="noopener noreferrer"
              className="border border-vapor/20 text-vapor/50 hover:border-gold hover:text-gold px-6 py-3 text-xs font-mono-tech tracking-widest transition-colors duration-200 rounded-sm">
              INSTAGRAM @VDSMOBILE
            </a>
            <a href="https://www.tiktok.com/@vdsmobile" target="_blank" rel="noopener noreferrer"
              className="border border-vapor/20 text-vapor/50 hover:border-gold hover:text-gold px-6 py-3 text-xs font-mono-tech tracking-widest transition-colors duration-200 rounded-sm">
              TIKTOK @VDSMOBILE
            </a>
          </div>
        </div>
      </div>

      {/* ── LIGHTBOX ─────────────────────────────────── */}
      {selected !== null && (
        <div
          className="fixed inset-0 z-50 bg-obsidian/95 flex items-center justify-center"
          onClick={() => setSelected(null)}
        >
          <div className="relative max-w-5xl w-full mx-4" onClick={e => e.stopPropagation()}>
            <img
              src={PHOTOS[selected].src}
              alt={PHOTOS[selected].vehicle}
              className="w-full max-h-[75vh] object-contain"
            />

            {/* Info panel */}
            <div className="absolute bottom-0 left-0 right-0 glass-panel p-6 border-t border-gold/20">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-mono-tech text-gold/70 tracking-widest mb-2">// SERVICES PERFORMED</p>
                  <div className="flex flex-wrap gap-2">
                    {PHOTOS[selected].services.map(s => (
                      <span key={s} className="text-xs font-mono-tech text-vapor/60 border border-vapor/10 px-2 py-1 rounded-sm">{s}</span>
                    ))}
                  </div>
                </div>
                <p className="text-xs font-mono-tech text-vapor/30 tracking-widest">{PHOTOS[selected].vehicle}</p>
              </div>
            </div>

            {/* Nav */}
            <button onClick={prev}
              className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 glass-panel border border-vapor/20 flex items-center justify-center hover:border-gold transition-colors rounded-sm">
              <ChevronLeft size={18} className="text-vapor" />
            </button>
            <button onClick={next}
              className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 glass-panel border border-vapor/20 flex items-center justify-center hover:border-gold transition-colors rounded-sm">
              <ChevronRight size={18} className="text-vapor" />
            </button>
            <button onClick={() => setSelected(null)}
              className="absolute top-4 right-4 w-9 h-9 glass-panel border border-vapor/20 flex items-center justify-center hover:border-gold transition-colors rounded-sm">
              <X size={16} className="text-vapor" />
            </button>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}