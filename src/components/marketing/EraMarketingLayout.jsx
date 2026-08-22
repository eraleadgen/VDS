import EraNav from './EraNav';
import EraFooter from './EraFooter';
import EraLivingBackground from './EraLivingBackground';
import EraCursorGlow from './EraCursorGlow';
import EraScrollProgress from './EraScrollProgress';

export default function EraMarketingLayout({ children }) {
  return (
    <div className="bg-[#060A09] min-h-screen relative overflow-x-hidden">
      <EraLivingBackground />
      <EraCursorGlow />
      <EraScrollProgress />
      <EraNav />
      <main className="relative z-10">
        {children}
        <EraFooter />
      </main>
    </div>
  );
}