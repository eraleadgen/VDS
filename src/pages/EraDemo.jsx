import { useState } from 'react';
import DemoShell from '@/components/demo/DemoShell';
import DemoOverview from '@/components/demo/DemoOverview';
import DemoAnalytics from '@/components/demo/DemoAnalytics';

// Interactive product demo page. Renders a faux admin dashboard shell with
// fictional sample data for the "Apex Detail Co." demo tenant. Read-only by
// construction — no backend calls, no entity access, no auth. Overview and
// Analytics are the two clickable screens; other nav items are locked.
export default function EraDemo() {
  const [tab, setTab] = useState('overview');

  return (
    <DemoShell activeTab={tab} onTabChange={setTab}>
      {tab === 'overview' && <DemoOverview />}
      {tab === 'analytics' && <DemoAnalytics />}
    </DemoShell>
  );
}