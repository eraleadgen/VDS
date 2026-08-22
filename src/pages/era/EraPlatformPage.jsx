import EraMarketingLayout from '@/components/marketing/EraMarketingLayout';
import EraPlatform from '@/components/marketing/EraPlatform';
import EraHowItWorks from '@/components/marketing/EraHowItWorks';

export default function EraPlatformPage() {
  return (
    <EraMarketingLayout>
      <EraPlatform />
      <EraHowItWorks />
    </EraMarketingLayout>
  );
}