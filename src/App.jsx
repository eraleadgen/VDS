import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import ScrollToTop from '@/components/ScrollToTop';

// Page imports
import Home from './pages/Home';
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

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-obsidian">
        <div className="w-8 h-8 border-2 border-gold/20 border-t-gold rounded-full animate-spin"></div>
      </div>
    );
  }

  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      // Only redirect if a token was present but is invalid/expired
      // Don't redirect unauthenticated users on a public app
      if (typeof window !== 'undefined' && window.location.pathname === '/member-dashboard') {
        window.location.href = '/member-login';
        return null;
      }
      // For all other pages, just render normally
    }
    // For unknown errors, still render the app rather than blocking
  }

  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/services" element={<Services />} />
      <Route path="/vds-gold" element={<VdsGold />} />

      <Route path="/faq" element={<FAQ />} />
      <Route path="/pricing" element={<Pricing />} />

      <Route path="/terms" element={<Terms />} />
      <Route path="/privacy" element={<Privacy />} />
      <Route path="/cookies" element={<Cookies />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/member-login" element={<MemberLogin />} />
      <Route path="/member-dashboard" element={<MemberDashboard />} />
      <Route path="/gold-signup" element={<GoldSignup />} />
      <Route path="/vds-gold-signup" element={<VdsGoldSignup />} />
      <Route path="/gallery" element={<Gallery />} />
      <Route path="/book" element={<BookAppointment />} />
      <Route path="/gold-booking" element={<GoldBooking />} />
      <Route path="/specialist-login" element={<SpecialistLogin />} />
      <Route path="/specialist-portal" element={<SpecialistPortal />} />
      <Route path="/specialist-setup" element={<SpecialistSetup />} />
      <Route path="/admin-login" element={<AdminLogin />} />
      <Route path="/admin" element={<AdminDashboard />} />
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};

function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <ScrollToTop />
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  );
}

export default App;