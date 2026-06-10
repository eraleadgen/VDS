import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import Navbar from '../components/vds/Navbar';
import Footer from '../components/vds/Footer';
import GoldShimmer from '../components/vds/GoldShimmer';

const GHL_STANDARD_URL = 'https://api.leadconnectorhq.com/widget/service-menu/6a29c64952cf9650ab20fb2b';
const GHL_GOLD_URL = 'https://api.leadconnectorhq.com/widget/service-menu/6a29d695d2456291889c2f13';

export default function BookAppointment() {
  const [user, setUser] = useState(null);
  const [isGold, setIsGold] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const init = async () => {
      const isAuth = await base44.auth.isAuthenticated();
      if (isAuth) {
        const me = await base44.auth.me();
        setUser(me);
        setIsGold(!!me?.is_gold_member);
      }
      setLoaded(true);
    };
    init();
  }, []);

  const embedUrl = isGold ? GHL_GOLD_URL : GHL_STANDARD_URL;

  return (
    <div className="min-h-screen bg-obsidian flex flex-col">
      <Navbar />

      <main className="flex-1 w-full pt-24 pb-0">
        {/* Header */}
        <div className="max-w-3xl mx-auto px-6 pt-8 pb-8 text-center md:text-left">
          <div className="flex items-center gap-3 mb-4 justify-center md:justify-start">
            <div className="w-8 h-px bg-gold" />
            <p className="text-xs font-mono-tech tracking-[0.4em] text-gold">
              {isGold ? 'VDS GOLD SCHEDULING' : 'SCHEDULE SERVICE'}
            </p>
          </div>
          <h1 className="text-4xl md:text-5xl font-grotesk font-bold text-vapor mb-3">
            BOOK AN <GoldShimmer>APPOINTMENT</GoldShimmer>
          </h1>
          <p className="text-vapor/40 font-mono-tech text-sm">
            {isGold
              ? 'As a Gold member, select your exclusive service below and pick a time that works for you.'
              : 'Select your service and schedule directly — we come to your location anywhere in Metro Atlanta.'}
          </p>
        </div>

        {/* GHL Embed */}
        {loaded && (
          <div className="w-full">
            <iframe
              src={embedUrl}
              title="Book Appointment"
              style={{ width: '100%', minHeight: '800px', border: 'none', display: 'block' }}
              allow="payment"
            />
          </div>
        )}

        {!loaded && (
          <div className="flex items-center justify-center py-32">
            <div className="w-8 h-8 border-2 border-gold/20 border-t-gold rounded-full animate-spin" />
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}