import { useState } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import Navbar from '../components/vds/Navbar';
import Footer from '../components/vds/Footer';

const PHOTOS = [
  {
    src: 'https://media.base44.com/images/public/6a191df337222815cd0b1f5e/f695b9a84_PhotoFeb23202651724PM.jpg',
    thumb: 'https://media.base44.com/images/public/6a191df337222815cd0b1f5e/f695b9a84_PhotoFeb23202651724PM.jpg',
    services: ['Full Detail', 'Ceramic Sealant'],
    vehicle: 'Mercedes-Benz G63 AMG',
  },
  {
    src: 'https://media.base44.com/images/public/6a191df337222815cd0b1f5e/f16ccaed0_porschedetailing.jpg',
    thumb: 'https://media.base44.com/images/public/6a191df337222815cd0b1f5e/f16ccaed0_porschedetailing.jpg',
    services: ['Full Detail', 'Paint Correction'],
    vehicle: 'Porsche Macan',
  },
  {
    src: 'https://media.base44.com/images/public/6a191df337222815cd0b1f5e/f94d09f22_exteriordetailingmercades.jpg',
    thumb: 'https://media.base44.com/images/public/6a191df337222815cd0b1f5e/f94d09f22_exteriordetailingmercades.jpg',
    services: ['Exterior Detail', 'Ceramic Sealant'],
    vehicle: 'Mercedes-Benz S-Class',
  },
  {
    src: 'https://media.base44.com/images/public/6a191df337222815cd0b1f5e/7225d5050_infinitidetailing.jpg',
    thumb: 'https://media.base44.com/images/public/6a191df337222815cd0b1f5e/7225d5050_infinitidetailing.jpg',
    services: ['Full Detail', 'Exterior Polish'],
    vehicle: 'Infiniti Q60',
  },
  {
    src: 'https://media.base44.com/images/public/6a191df337222815cd0b1f5e/5995f04a1_Interiordetailingmclaren.jpg',
    thumb: 'https://media.base44.com/images/public/6a191df337222815cd0b1f5e/5995f04a1_Interiordetailingmclaren.jpg',
    services: ['Interior Detail', 'Steam Clean'],
    vehicle: 'McLaren — Interior',
  },
  {
    src: 'https://media.base44.com/images/public/6a191df337222815cd0b1f5e/167aa5aef_interiordetailingmercades.jpg',
    thumb: 'https://media.base44.com/images/public/6a191df337222815cd0b1f5e/167aa5aef_interiordetailingmercades.jpg',
    services: ['Interior Detail', 'Leather Conditioning'],
    vehicle: 'Mercedes-Benz — Interior',
  },
  {
    src: 'https://media.base44.com/images/public/6a191df337222815cd0b1f5e/7b9bc552e_Lamborginidetailing.jpg',
    thumb: 'https://media.base44.com/images/public/6a191df337222815cd0b1f5e/7b9bc552e_Lamborginidetailing.jpg',
    services: ['Full Detail', 'Paint Correction', 'Ceramic Coating'],
    vehicle: 'Lamborghini Aventador',
  },
  {
    src: 'https://media.base44.com/images/public/6a191df337222815cd0b1f5e/57598a584_mobilecardetailing.jpg',
    thumb: 'https://media.base44.com/images/public/6a191df337222815cd0b1f5e/57598a584_mobilecardetailing.jpg',
    services: ['Full Detail', 'Foam Wash', 'Ceramic Sealant'],
    vehicle: 'McLaren 720S',
  },
  {
    src: 'https://media.base44.com/images/public/6a191df337222815cd0b1f5e/38511afa7_cardetailingbmw.jpg',
    thumb: 'https://media.base44.com/images/public/6a191df337222815cd0b1f5e/38511afa7_cardetailingbmw.jpg',
    services: ['Exterior Detail', 'Rim Detailing'],
    vehicle: 'BMW M3',
  },
  {
    src: 'https://media.base44.com/images/public/6a191df337222815cd0b1f5e/604f342bf_johnscreekmobiledetailing.jpg',
    thumb: 'https://media.base44.com/images/public/6a191df337222815cd0b1f5e/604f342bf_johnscreekmobiledetailing.jpg',
    services: ['Full Detail', 'Ceramic Sealant'],
    vehicle: 'Mercedes-Benz S-Class',
  },
  {
    src: 'https://media.base44.com/images/public/6a191df337222815cd0b1f5e/6adfedc7d_Mobiledetailingmclaren.jpg',
    thumb: 'https://media.base44.com/images/public/6a191df337222815cd0b1f5e/6adfedc7d_Mobiledetailingmclaren.jpg',
    services: ['Full Detail', 'Paint Correction'],
    vehicle: 'McLaren Artura',
  },
  {
    src: 'https://media.base44.com/images/public/6a191df337222815cd0b1f5e/1c68f36d3_mobiledetailingnearme.jpg',
    thumb: 'https://media.base44.com/images/public/6a191df337222815cd0b1f5e/1c68f36d3_mobiledetailingnearme.jpg',
    services: ['VDS Gold Monthly', 'Exterior Detail'],
    vehicle: 'McLaren 720S',
  },
  {
    src: 'https://media.base44.com/images/public/6a191df337222815cd0b1f5e/703edb93d_alpharettacarwash.jpg',
    thumb: 'https://media.base44.com/images/public/6a191df337222815cd0b1f5e/703edb93d_alpharettacarwash.jpg',
    services: ['Exterior Detail', 'Ceramic Sealant'],
    vehicle: 'Mercedes-Benz GLE',
  },
  {
    src: 'https://media.base44.com/images/public/6a191df337222815cd0b1f5e/1745d8124_mobiledetailingjohnscreek.jpg',
    thumb: 'https://media.base44.com/images/public/6a191df337222815cd0b1f5e/1745d8124_mobiledetailingjohnscreek.jpg',
    services: ['Full Detail', 'Exterior Polish'],
    vehicle: 'Porsche Cayenne GTS',
  },
  {
    src: 'https://media.base44.com/images/public/6a191df337222815cd0b1f5e/e029b5b8b_Paintcorrectionnearme.jpg',
    thumb: 'https://media.base44.com/images/public/6a191df337222815cd0b1f5e/e029b5b8b_Paintcorrectionnearme.jpg',
    services: ['Paint Correction', 'Ceramic Coating'],
    vehicle: 'Paint Correction Detail',
  },
  {
    src: 'https://media.base44.com/images/public/6a191df337222815cd0b1f5e/d8a1fbe9f_VDSMobiledetailing.jpg',
    thumb: 'https://media.base44.com/images/public/6a191df337222815cd0b1f5e/d8a1fbe9f_VDSMobiledetailing.jpg',
    services: ['Full Detail', 'VDS Gold Monthly'],
    vehicle: 'Porsche 911 Targa 4S',
  },
  {
    src: 'https://media.base44.com/images/public/6a191df337222815cd0b1f5e/1ca0b31ab_vdsmobilenearme.jpg',
    thumb: 'https://media.base44.com/images/public/6a191df337222815cd0b1f5e/1ca0b31ab_vdsmobilenearme.jpg',
    services: ['Full Detail', 'Ceramic Coating'],
    vehicle: 'Porsche 911 Carrera',
  },
  {
    src: 'https://media.base44.com/images/public/6a191df337222815cd0b1f5e/bcd6fe317_vdsmobile.jpg',
    thumb: 'https://media.base44.com/images/public/6a191df337222815cd0b1f5e/bcd6fe317_vdsmobile.jpg',
    services: ['Full Detail', 'Paint Correction'],
    vehicle: 'Mercedes-Benz Maybach GLS',
  },
  {
    src: 'https://media.base44.com/images/public/6a191df337222815cd0b1f5e/9e2448db0_cummingcardetailing.jpg',
    thumb: 'https://media.base44.com/images/public/6a191df337222815cd0b1f5e/9e2448db0_cummingcardetailing.jpg',
    services: ['Full Detail', 'Ceramic Sealant'],
    vehicle: 'Porsche Macan GTS',
  },
  {
    src: 'https://media.base44.com/images/public/6a191df337222815cd0b1f5e/0c0923639_alpharettamobiledetailing.jpg',
    thumb: 'https://media.base44.com/images/public/6a191df337222815cd0b1f5e/0c0923639_alpharettamobiledetailing.jpg',
    services: ['Exterior Detail', 'Paint Correction'],
    vehicle: 'Audi RSQ8',
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