import { useState } from 'react';
import { X } from 'lucide-react';
import Navbar from '../components/vds/Navbar';
import Footer from '../components/vds/Footer';

const PHOTOS = [
  {
    img: 'https://media.base44.com/images/public/6a191df337222815cd0b1f5e/aa4571c98_FullDetail.jpg',
    service: 'Full Detail',
    tags: ['Full Detail'],
  },
  {
    img: 'https://media.base44.com/images/public/6a191df337222815cd0b1f5e/3dc7e5603_FullDetail2.jpg',
    service: 'Full Detail',
    tags: ['Full Detail'],
  },
  {
    img: 'https://media.base44.com/images/public/6a191df337222815cd0b1f5e/1843ecb8f_FullDetail3.jpg',
    service: 'Full Detail',
    tags: ['Full Detail'],
  },
  {
    img: 'https://media.base44.com/images/public/6a191df337222815cd0b1f5e/27795897c_FullDetail-CeramicSealant2.jpg',
    service: 'Full Detail + Ceramic Sealant',
    tags: ['Full Detail', 'Ceramic Sealant'],
  },
  {
    img: 'https://media.base44.com/images/public/6a191df337222815cd0b1f5e/50fc4ae87_FullDetail-CeramicSealant.jpg',
    service: 'Full Detail + Ceramic Sealant',
    tags: ['Full Detail', 'Ceramic Sealant'],
  },
  {
    img: 'https://media.base44.com/images/public/6a191df337222815cd0b1f5e/933c641a9_ExteriorDetail.jpg',
    service: 'Exterior Detail',
    tags: ['Exterior Detail'],
  },
  {
    img: 'https://media.base44.com/images/public/6a191df337222815cd0b1f5e/02edab55d_FullDetail-5YearCeramicCoating-Stage3PaintCorrection.jpg',
    service: 'Full Detail + 5-Year Ceramic Coating + Stage 3 Paint Correction',
    tags: ['Full Detail', 'Ceramic Coating', 'Paint Correction'],
  },
  {
    img: 'https://media.base44.com/images/public/6a191df337222815cd0b1f5e/a5df93801_FullDetail-5YearCeramicCoating-Stage1PaintCorrection.jpg',
    service: 'Full Detail + 5-Year Ceramic Coating + Stage 1 Paint Correction',
    tags: ['Full Detail', 'Ceramic Coating', 'Paint Correction'],
  },
  {
    img: 'https://media.base44.com/images/public/6a191df337222815cd0b1f5e/73b0c6f48_FullDetail-5YearCeramicCoating-Stage1PaintCorrection.jpg',
    service: 'Full Detail + 5-Year Ceramic Coating + Stage 1 Paint Correction',
    tags: ['Full Detail', 'Ceramic Coating', 'Paint Correction'],
  },
  {
    img: 'https://media.base44.com/images/public/6a191df337222815cd0b1f5e/7e0e8e30c_FullDetail-CeramicSealant2.jpg',
    service: 'Full Detail + Ceramic Sealant',
    tags: ['Full Detail', 'Ceramic Sealant'],
  },
  {
    img: 'https://media.base44.com/images/public/6a191df337222815cd0b1f5e/fc5c033c1_FullDetail-CeramicSealant.jpg',
    service: 'Full Detail + Ceramic Sealant',
    tags: ['Full Detail', 'Ceramic Sealant'],
  },
  {
    img: 'https://media.base44.com/images/public/6a191df337222815cd0b1f5e/e81a4b27a_FullDetail2.jpg',
    service: 'Full Detail',
    tags: ['Full Detail'],
  },
  {
    img: 'https://media.base44.com/images/public/6a191df337222815cd0b1f5e/afaaf50c5_FullDetail3.jpg',
    service: 'Full Detail',
    tags: ['Full Detail'],
  },
  {
    img: 'https://media.base44.com/images/public/6a191df337222815cd0b1f5e/72db908f1_FullDetail4.jpg',
    service: 'Full Detail',
    tags: ['Full Detail'],
  },
  {
    img: 'https://media.base44.com/images/public/6a191df337222815cd0b1f5e/08e4dab62_FullDetail5.jpg',
    service: 'Full Detail',
    tags: ['Full Detail'],
  },
  {
    img: 'https://media.base44.com/images/public/6a191df337222815cd0b1f5e/20635cea2_FullDetail6.jpg',
    service: 'Full Detail',
    tags: ['Full Detail'],
  },
  {
    img: 'https://media.base44.com/images/public/6a191df337222815cd0b1f5e/ddc0a29a7_FullDetail.jpg',
    service: 'Full Detail',
    tags: ['Full Detail'],
  },
  {
    img: 'https://media.base44.com/images/public/6a191df337222815cd0b1f5e/b46468994_ExteriorDetail3.jpg',
    service: 'Exterior Detail',
    tags: ['Exterior Detail'],
  },
  {
    img: 'https://media.base44.com/images/public/6a191df337222815cd0b1f5e/e47c4c896_ExteriorDetail5.jpg',
    service: 'Exterior Detail',
    tags: ['Exterior Detail'],
  },
  {
    img: 'https://media.base44.com/images/public/6a191df337222815cd0b1f5e/52c3ecad8_ExteriorDetail4.jpg',
    service: 'Exterior Detail',
    tags: ['Exterior Detail'],
  },
  {
    img: 'https://media.base44.com/images/public/6a191df337222815cd0b1f5e/1082fee8c_FullDetail-5YearCeramicCoating-Stage1PaintCorrecton.jpg',
    service: 'Full Detail + 5-Year Ceramic Coating + Stage 1 Paint Correction',
    tags: ['Full Detail', 'Ceramic Coating', 'Paint Correction'],
  },
  {
    img: 'https://media.base44.com/images/public/6a191df337222815cd0b1f5e/67fedece8_FullDetail4.jpg',
    service: 'Full Detail',
    tags: ['Full Detail'],
  },
  {
    img: 'https://media.base44.com/images/public/6a191df337222815cd0b1f5e/ef3ecb851_FullDetail5.jpg',
    service: 'Full Detail',
    tags: ['Full Detail'],
  },
];

const ALL_FILTERS = ['All', 'Full Detail', 'Exterior Detail', 'Ceramic Sealant', 'Ceramic Coating', 'Paint Correction'];

export default function Gallery() {
  const [filter, setFilter] = useState('All');
  const [lightbox, setLightbox] = useState(null);

  const filtered = filter === 'All'
    ? PHOTOS
    : PHOTOS.filter(p => p.tags.includes(filter));

  return (
    <div className="bg-obsidian min-h-screen">
      <Navbar />

      {/* Header */}
      <section className="pt-36 pb-16 max-w-7xl mx-auto px-6">
        <p className="text-xs font-mono-tech tracking-[0.3em] text-gold/70 mb-4">OUR WORK</p>
        <h1 className="text-5xl md:text-6xl font-grotesk font-bold text-vapor mb-6">GALLERY</h1>
        <p className="text-vapor/50 font-mono-tech text-sm max-w-xl">
          Real results on real vehicles across Metro Atlanta. Every photo is an actual client vehicle serviced by VDS Mobile.
        </p>
      </section>

      {/* Filters */}
      <div className="max-w-7xl mx-auto px-6 mb-10">
        <div className="flex flex-wrap gap-2">
          {ALL_FILTERS.map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 text-xs font-mono-tech tracking-widest rounded-sm border transition-colors duration-200 ${
                filter === f
                  ? 'bg-gold text-obsidian border-gold'
                  : 'border-vapor/20 text-vapor/50 hover:border-gold/50 hover:text-vapor'
              }`}
            >
              {f.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      <div className="max-w-7xl mx-auto px-6 pb-24">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-0.5 bg-vapor/5">
          {filtered.map((photo, i) => (
            <div
              key={i}
              onClick={() => setLightbox(photo)}
              className="bg-obsidian group relative overflow-hidden cursor-pointer"
            >
              <div className="aspect-[4/3] overflow-hidden">
                <img
                  src={photo.img}
                  alt={photo.service}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
              </div>
              {/* Overlay */}
              <div className="absolute inset-0 bg-obsidian/0 group-hover:bg-obsidian/70 transition-all duration-300 flex items-end p-6">
                <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className="flex flex-wrap gap-1 mb-2">
                    {photo.tags.map(tag => (
                      <span key={tag} className="text-xs font-mono-tech text-gold border border-gold/40 px-2 py-0.5 rounded-sm">
                        {tag.toUpperCase()}
                      </span>
                    ))}
                  </div>
                  <p className="text-vapor font-grotesk font-semibold text-sm">{photo.service}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-24 text-vapor/30 font-mono-tech text-sm">
            No photos in this category yet.
          </div>
        )}
      </div>

      {/* CTA */}
      <section className="border-t border-vapor/5 py-16 text-center">
        <p className="text-xs font-mono-tech tracking-[0.3em] text-gold/70 mb-4">READY FOR YOUR VEHICLE?</p>
        <h2 className="text-3xl font-grotesk font-bold text-vapor mb-6">BOOK YOUR DETAIL</h2>
        <a
          href="sms:+14704128986"
          className="inline-block bg-vapor text-obsidian px-10 py-4 text-sm font-mono-tech tracking-widest hover:bg-gold transition-colors duration-300 rounded-sm"
        >
          TEXT FOR A QUOTE
        </a>
      </section>

      <Footer />

      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 z-50 bg-obsidian/95 flex items-center justify-center p-4"
          onClick={() => setLightbox(null)}
        >
          <button
            onClick={() => setLightbox(null)}
            className="absolute top-6 right-6 text-vapor/60 hover:text-vapor transition-colors"
          >
            <X size={28} />
          </button>
          <div className="max-w-4xl w-full" onClick={e => e.stopPropagation()}>
            <img
              src={lightbox.img}
              alt={lightbox.service}
              className="w-full max-h-[80vh] object-contain rounded-sm"
            />
            <div className="mt-4 flex flex-wrap items-center gap-3">
              {lightbox.tags.map(tag => (
                <span key={tag} className="text-xs font-mono-tech text-gold border border-gold/40 px-3 py-1 rounded-sm">
                  {tag.toUpperCase()}
                </span>
              ))}
              <p className="text-vapor/60 font-mono-tech text-sm">{lightbox.service}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}