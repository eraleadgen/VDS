import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import GoldShimmer from './GoldShimmer';

export default function GoldPromoCard({ className = '' }) {
  return (
    <div
      className={`relative overflow-hidden rounded-sm border border-gold/20 ${className}`}
      style={{
        background:
          'radial-gradient(ellipse 70% 120% at 50% 50%, #1a1a1a 0%, #121212 55%, #0a0b0d 100%)',
      }}
    >
      {/* Subtle gold radial glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 55% 90% at 12% 50%, rgba(212,175,55,0.09) 0%, transparent 65%)',
        }}
      />
      <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between gap-6 p-8 md:p-12">
        <div className="max-w-xl text-center md:text-left">
          <p className="text-xs font-mono-tech tracking-[0.3em] text-gold mb-4">
            NEW — MONTHLY MEMBERSHIP
          </p>
          <h2 className="text-4xl md:text-5xl font-grotesk font-bold mb-4 leading-none">
            <GoldShimmer>VDS GOLD</GoldShimmer>
          </h2>
          <p className="text-vapor/50 font-mono-tech text-sm leading-relaxed">
            Unlimited exterior details + 1 deep interior clean per month. Your vehicle, perpetually immaculate.
          </p>
        </div>
        <Link
          to="/vds-gold"
          className="group shrink-0 flex items-center gap-3 bg-gold text-obsidian px-8 py-4 text-sm font-mono-tech tracking-widest rounded-sm whitespace-nowrap transition-all duration-300 hover:bg-gold-light font-bold"
        >
          VIEW MEMBERSHIP
          <ArrowRight size={14} className="transition-transform duration-300 group-hover:translate-x-1" />
        </Link>
      </div>
    </div>
  );
}