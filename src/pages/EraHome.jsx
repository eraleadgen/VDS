import EraNav from '@/components/marketing/EraNav';
import EraHero from '@/components/marketing/EraHero';
import EraProof from '@/components/marketing/EraProof';
import EraPlatform from '@/components/marketing/EraPlatform';
import EraHowItWorks from '@/components/marketing/EraHowItWorks';
import EraWhoFor from '@/components/marketing/EraWhoFor';
import EraPricing from '@/components/marketing/EraPricing';
import EraCta from '@/components/marketing/EraCta';
import EraFooter from '@/components/marketing/EraFooter';
import EraLivingBackground from '@/components/marketing/EraLivingBackground';
import EraCursorGlow from '@/components/marketing/EraCursorGlow';
import EraScrollProgress from '@/components/marketing/EraScrollProgress';

export default function EraHome() {
  return (
    <div className="bg-[#060A09] min-h-screen relative overflow-x-hidden">
      <EraLivingBackground />
      <EraCursorGlow />
      <EraScrollProgress />
      <EraNav />
      <main className="relative z-10">
        <EraHero />
        <EraProof />
        <EraPlatform />
        <EraHowItWorks />
        <EraWhoFor />
        <EraPricing />
        <EraCta />
        <EraFooter />
      </main>
    </div>
  );
}