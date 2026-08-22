import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { useEffect, useRef, useState } from 'react';
import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import { BusinessConfigProvider, useBusinessConfigLoading } from '@/lib/BusinessConfigContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import ScrollToTop from '@/components/ScrollToTop';
import RouteSeo from '@/components/vds/RouteSeo';
import PageTransition from '@/components/vds/PageTransition';
import VdsTransitionOverlay from '@/components/vds/VdsTransitionOverlay';

// Page imports
import HomeRouter from '@/components/HomeRouter';
import Services from './pages/Services';
import VdsGold from './pages/VdsGold';
import FAQ from './pages/FAQ';
import Terms from './pages/Terms';
import Pricing from './pages/Pricing';
import Privacy from './pages/Privacy';
import Cookies from './pages/Cookies';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import MemberLogin from './pages/MemberLogin';
import MemberDashboard from './pages/MemberDashboard';
import GoldSignup from './pages/GoldSignup';
import VdsGoldSignup from './pages/VdsGoldSignup';
import Gallery from './pages/Gallery';
import BookAppointment from './pages/BookAppointment';
import GoldBooking from './pages/GoldBooking';
import SpecialistLogin from './pages/SpecialistLogin';
import SpecialistPortal from './pages/SpecialistPortal';
import SpecialistSetup from './pages/SpecialistSetup';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import PartnerPortal from './pages/PartnerPortal';
import PartnerLogin from './pages/PartnerLogin';
import PartnerSetup from './pages/PartnerSetup';
import PartnerRedirect from './pages/PartnerRedirect';
import CareGuide from './pages/CareGuide';
import OnboardingWizard from './pages/OnboardingWizard';
import EraConsole from './pages/EraConsole';
import EraAdminPortal from './pages/EraAdminPortal';
import EraRegister from './pages/EraRegister';
import EraLogin from './pages/EraLogin';
import EraPortal from './pages/EraPortal';
import EraPlatformPage from './pages/era/EraPlatformPage';
import EraResultsPage from './pages/era/EraResultsPage';
import EraPricingPage from './pages/era/EraPricingPage';
import EraWhoForPage from './pages/era/EraWhoForPage';
import SsoHandoff from './pages/SsoHandoff';
import ChatWidget from '@/components/chat/ChatWidget';
import FeatureGate from '@/components/FeatureGate';
import TenantRouteGuard from '@/components/TenantRouteGuard';

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError } = useAuth();
  const location = useLocation();
  const configLoading = useBusinessConfigLoading();
  // The branded reveal also waits for BusinessConfig to load so the first paint of every
  // page already has the tenant's real name/area/prices — no flash of hardcoded defaults.
  const authLoaded = !isLoadingAuth && !isLoadingPublicSettings && !configLoading;

  // The page only swaps once the transition overlay has fully closed. While closing we keep
  // rendering the previous route (committedLocation) so the old page stays put until the
  // overlay covers the screen; then we swap to the new route under the closed overlay, and the
  // overlay opens to reveal it. This applies to every in-app navigation site-wide.
  const [committedLocation, setCommittedLocation] = useState(location);
  const latestLocation = useRef(location);
  useEffect(() => { latestLocation.current = location; }, [location]);
  const handleCloseComplete = () => setCommittedLocation(latestLocation.current);

  // The branded transition overlay is always rendered (even during the auth loading
  // gate) so it replaces the loading circle and only opens once the page is ready.
  let content;
  if (!authLoaded) {
    // The VdsTransitionOverlay (always rendered) covers the screen during loading;
    // this placeholder just ensures a solid black field behind it with no VDS-branded
    // spinner that would flash before the tenant config resolves.
    content = <div className="fixed inset-0 bg-obsidian" />;
  } else if (authError && authError.type === 'user_not_registered') {
    content = <UserNotRegisteredError />;
  } else {
    if (authError && authError.type === 'auth_required' && typeof window !== 'undefined' && window.location.pathname === '/member-dashboard') {
      window.location.href = '/member-login';
    }
    content = (
      <Routes location={committedLocation}>
        <Route element={<PageTransition />}>
          <Route element={<TenantRouteGuard />}>
            <Route path="/" element={<HomeRouter />} />
          <Route path="/services" element={<Services />} />
          <Route path="/membership" element={<VdsGold />} />

          <Route path="/faq" element={<FAQ />} />
          <Route path="/pricing" element={<Pricing />} />

          <Route path="/terms" element={<Terms />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/cookies" element={<Cookies />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/member-login" element={<FeatureGate feature="member_portal"><MemberLogin /></FeatureGate>} />
          <Route path="/member-dashboard" element={<FeatureGate feature="member_portal"><MemberDashboard /></FeatureGate>} />
          <Route path="/member-signup" element={<FeatureGate feature="member_portal"><GoldSignup /></FeatureGate>} />
          <Route path="/membership-signup" element={<VdsGoldSignup />} />
          <Route path="/gallery" element={<Gallery />} />
          <Route path="/book" element={<BookAppointment />} />
          <Route path="/gold-booking" element={<GoldBooking />} />
          <Route path="/specialist-login" element={<FeatureGate feature="specialist_portal"><SpecialistLogin /></FeatureGate>} />
          <Route path="/specialist-portal" element={<FeatureGate feature="specialist_portal"><SpecialistPortal /></FeatureGate>} />
          <Route path="/specialist-setup" element={<FeatureGate feature="specialist_portal"><SpecialistSetup /></FeatureGate>} />
          <Route path="/admin-login" element={<AdminLogin />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/partner-portal" element={<FeatureGate feature="partner_engine"><PartnerPortal /></FeatureGate>} />
          <Route path="/partner-login" element={<FeatureGate feature="partner_engine"><PartnerLogin /></FeatureGate>} />
          <Route path="/partner-setup" element={<FeatureGate feature="partner_engine"><PartnerSetup /></FeatureGate>} />
          <Route path="/care-guide/:key" element={<CareGuide />} />
          <Route path="/onboarding" element={<OnboardingWizard />} />
          <Route path="/era-console" element={<EraConsole />} />
          <Route path="/era-admin" element={<EraAdminPortal />} />
          <Route path="/era-register" element={<EraRegister />} />
          <Route path="/era-login" element={<EraLogin />} />
          <Route path="/era-portal" element={<EraPortal />} />
          <Route path="/era-platform" element={<EraPlatformPage />} />
          <Route path="/era-results" element={<EraResultsPage />} />
          <Route path="/era-pricing" element={<EraPricingPage />} />
          <Route path="/era-who-for" element={<EraWhoForPage />} />
          <Route path="/sso" element={<SsoHandoff />} />
          <Route path="/:code" element={<FeatureGate feature="partner_engine"><PartnerRedirect /></FeatureGate>} />
            <Route path="*" element={<PageNotFound />} />
          </Route>
        </Route>
      </Routes>
    );
  }

  return (
    <>
      <VdsTransitionOverlay authLoaded={authLoaded} pathKey={location.pathname} onCloseComplete={handleCloseComplete} />
      {content}
    </>
  );
};

function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <BusinessConfigProvider>
          <Router>
            <ScrollToTop />
            <RouteSeo />
            <AuthenticatedApp />
            <ChatWidget />
          </Router>
        </BusinessConfigProvider>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  );
}

export default App;