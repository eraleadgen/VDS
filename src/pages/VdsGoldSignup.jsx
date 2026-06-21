import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { CheckCircle, CreditCard, AlertCircle, Loader2, Gem } from 'lucide-react';
import Navbar from '../components/vds/Navbar';
import Footer from '../components/vds/Footer';
import GoldShimmer from '../components/vds/GoldShimmer';

const PRICING = {
  sedan_coupe: 250,
  truck_suv: 300,
};

export default function VdsGoldSignup() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [vehicles, setVehicles] = useState([]);
  const [enrolledVehicleIds, setEnrolledVehicleIds] = useState([]);
  const [selectedVehicles, setSelectedVehicles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [policyAgreed, setPolicyAgreed] = useState(false);

  useEffect(() => {
    const init = async () => {
      const isAuth = await base44.auth.isAuthenticated();
      if (!isAuth) {
        navigate('/member-login');
        return;
      }
      const me = await base44.auth.me();
      setUser(me);
      const [v, subsRes] = await Promise.all([
        base44.entities.MemberVehicle.list(),
        base44.functions.invoke('getMySubscriptions', {}),
      ]);
      setVehicles(v);
      const activeSubs = subsRes?.data?.subscriptions || [];
      setEnrolledVehicleIds(activeSubs.map(s => s.vehicle_id));
    };
    init();
  }, [navigate]);

  const toggleVehicle = (id) => {
    setSelectedVehicles(prev =>
      prev.includes(id) ? prev.filter(v => v !== id) : [...prev, id]
    );
  };

  const calculateTotal = () => {
    return selectedVehicles.reduce((sum, id) => {
      const v = vehicles.find(veh => veh.id === id);
      return sum + (PRICING[v?.vehicle_type || 'sedan_coupe']);
    }, 0);
  };

  const handleUpgradeToGold = async () => {
    if (selectedVehicles.length === 0) {
      setError('Please select at least one vehicle to enroll in VDS Gold.');
      return;
    }

    setProcessing(true);
    setError(null);

    try {
      // Check if running in iframe
      if (window.self !== window.top) {
        setError('Payment checkout only works in the published app, not in preview mode. Please open the app in a browser.');
        setProcessing(false);
        return;
      }

      // Create Stripe checkout session
      const response = await base44.functions.invoke('createGoldCheckoutSession', { 
        vehicleIds: selectedVehicles 
      });

      if (response.data?.url) {
        // Redirect to Stripe checkout
        window.location.href = response.data.url;
      } else {
        throw new Error('Failed to create checkout session');
      }
    } catch (err) {
      console.error('Gold signup error:', err);
      setError(err.message || 'Failed to process Gold membership. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-obsidian flex flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center px-6 py-32">
          <div className="w-8 h-8 border-2 border-gold/20 border-t-gold rounded-full animate-spin" />
        </main>
        <Footer />
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-obsidian flex flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center px-6 py-32">
          <div className="text-center max-w-md">
            <CheckCircle size={48} className="text-gold mx-auto mb-6" />
            <h2 className="text-3xl font-grotesk font-bold text-vapor mb-3">
              Welcome to <GoldShimmer>VDS Gold</GoldShimmer>!
            </h2>
            <p className="text-vapor/50 font-mono-tech text-sm leading-relaxed mb-8">
              Your membership is active. All selected vehicles are now enrolled with unlimited exterior details and 1 interior detail per month.
            </p>
            <div className="w-8 h-8 border-2 border-gold/20 border-t-gold rounded-full animate-spin mx-auto" />
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-obsidian flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-4xl mx-auto w-full px-6 pt-32 pb-20">
        {/* Header */}
        <div className="mb-10 text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-8 h-px bg-gold" />
            <p className="text-xs font-mono-tech tracking-[0.4em] text-gold">PREMIUM MEMBERSHIP</p>
            <div className="w-8 h-px bg-gold" />
          </div>
          <h1 className="text-4xl md:text-5xl font-grotesk font-bold text-vapor mb-3">
            JOIN <GoldShimmer>VDS GOLD</GoldShimmer>
          </h1>
          <p className="text-vapor/40 font-mono-tech text-sm">
            Unlimited Exterior + 1 Interior Detail Per Month · Ceramic Sealant Included
          </p>
        </div>

        {/* Membership Benefits */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
          {[
            { icon: '◆', title: 'UNLIMITED EXTERIOR', desc: 'As often as you need' },
            { icon: '★', title: '1 INTERIOR / MONTH', desc: 'Full interior detail' },
            { icon: '♦', title: 'CERAMIC SEALANT', desc: '3-month protection included' },
          ].map(benefit => (
            <div key={benefit.title} className="glass-panel border border-gold/15 rounded-sm p-5 text-center">
              <p className="text-gold text-xl mb-2">{benefit.icon}</p>
              <p className="text-vapor font-grotesk font-semibold text-sm mb-1">{benefit.title}</p>
              <p className="text-vapor/40 font-mono-tech text-xs">{benefit.desc}</p>
            </div>
          ))}
        </div>

        {/* Vehicle Selection */}
        <div className="glass-panel border border-gold/20 rounded-sm p-6 mb-8">
          <div className="mb-5">
            <p className="text-vapor font-grotesk font-semibold">SELECT VEHICLES TO ENROLL</p>
            <p className="text-vapor/40 font-mono-tech text-xs">Choose which vehicles get Gold benefits</p>
          </div>

          {vehicles.length === 0 ? (
            <div className="border border-dashed border-vapor/10 rounded-sm p-8 text-center">
              <p className="text-vapor/30 font-mono-tech text-sm mb-4">No vehicles found. Add a vehicle first.</p>
              <Link
                to="/member-dashboard"
                className="inline-block border border-gold bg-gold text-obsidian px-5 py-2 text-xs font-mono-tech tracking-widest rounded-sm hover:bg-gold-light transition-colors"
              >
                GO TO DASHBOARD →
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {vehicles.map(v => {
                const isEnrolled = enrolledVehicleIds.includes(v.id);
                const checked = selectedVehicles.includes(v.id);
                const monthlyRate = PRICING[v.vehicle_type || 'sedan_coupe'];
                return (
                  <div
                    key={v.id}
                    onClick={() => !isEnrolled && toggleVehicle(v.id)}
                    className={`w-full flex items-center justify-between px-5 py-4 border rounded-sm text-left transition-colors ${
                      isEnrolled
                        ? 'border-gold/40 bg-gold/5 cursor-not-allowed opacity-70'
                        : checked
                          ? 'border-gold bg-gold/10 cursor-pointer'
                          : 'border-vapor/10 hover:border-vapor/30 cursor-pointer'
                    }`}
                  >
                    <div>
                      <span className="font-mono-tech text-sm text-vapor block">
                        {v.year} {v.make} {v.model}{v.color ? `, ${v.color}` : ''}
                      </span>
                      <span className="text-xs font-mono-tech text-vapor/40 mt-0.5 block">
                        {v.vehicle_type === 'truck_suv' ? 'Truck/SUV' : 'Sedan/Coupe'} · ${monthlyRate}/mo
                      </span>
                      {isEnrolled && (
                        <span className="text-xs font-mono-tech text-gold mt-1 block tracking-widest">◆ ALREADY ENROLLED IN VDS GOLD</span>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      {isEnrolled && <span className="text-[10px] font-mono-tech tracking-widest text-gold border border-gold/40 px-2 py-1 rounded-sm">GOLD</span>}
                      {!isEnrolled && checked && <CheckCircle size={16} className="text-gold shrink-0" />}
                      {!isEnrolled && !checked && <div className="w-4 h-4 border-2 border-vapor/30 rounded-sm" />}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {selectedVehicles.length > 0 && (
            <div className="mt-6 border border-gold/20 bg-gold/5 rounded-sm px-5 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-mono-tech tracking-widest text-gold mb-1">MONTHLY SUBTOTAL</p>
                  <p className="text-vapor/50 font-mono-tech text-xs">
                    {selectedVehicles.length} vehicle{selectedVehicles.length > 1 ? 's' : ''} · Billed monthly
                  </p>
                </div>
                <p className="text-2xl font-grotesk font-bold text-gold shrink-0 ml-4">
                  ${calculateTotal()}+
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Stripe Payment Section */}
        <div className="glass-panel border border-gold/20 rounded-sm p-6 mb-8">
          <div className="flex items-center gap-3 mb-5">
            <CreditCard size={18} className="text-gold" />
            <div>
              <p className="text-vapor font-grotesk font-semibold">SECURE CHECKOUT</p>
              <p className="text-vapor/40 font-mono-tech text-xs">Powered by Stripe</p>
            </div>
          </div>

          <div className="border border-vapor/10 bg-asphalt/50 rounded-sm p-5 mb-4">
            <p className="text-vapor/60 font-mono-tech text-xs mb-3">PAYMENT DETAILS</p>
            <p className="text-vapor/40 font-mono-tech text-xs leading-relaxed mb-4">
              You'll be redirected to Stripe's secure checkout to enter your payment information. 
              Monthly billing starts immediately after enrollment. Cancel anytime from your dashboard.
            </p>
            <div className="flex items-center gap-2 text-gold/80 text-xs font-mono-tech">
              <CheckCircle size={12} />
              <span>Encrypted & secure payment processing</span>
            </div>
          </div>
        </div>

        {/* Cancellation Policy Notice */}
        <div
          onClick={() => setPolicyAgreed(prev => !prev)}
          className={`border rounded-sm px-5 py-4 mb-6 cursor-pointer transition-colors ${policyAgreed ? 'border-gold/40 bg-gold/5' : 'border-vapor/10 bg-asphalt/50 hover:border-vapor/20'}`}
        >
          <div className="flex items-start gap-3">
            <div className={`mt-0.5 w-4 h-4 shrink-0 border-2 rounded-sm flex items-center justify-center transition-colors ${policyAgreed ? 'border-gold bg-gold' : 'border-vapor/30'}`}>
              {policyAgreed && <svg width="10" height="8" viewBox="0 0 10 8" fill="none"><path d="M1 4L3.5 6.5L9 1" stroke="#0A0B0D" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>}
            </div>
            <div>
              <p className="text-xs font-mono-tech tracking-widest text-gold/70 mb-2">CANCELLATION & REFUND POLICY <span className="text-red-400">*</span></p>
              <p className="text-vapor/50 font-mono-tech text-xs leading-relaxed">
                A full refund is available within <span className="text-vapor">48 hours</span> of your initial subscription start date, provided no VDS Gold services have been redeemed or scheduled. After 48 hours, or if any Gold service has been used, no refund will be issued — your membership benefits continue through the end of the current billing period. You may cancel anytime from your Member Dashboard.
              </p>
              {!policyAgreed && <p className="text-xs font-mono-tech text-vapor/30 mt-2">Click to acknowledge this policy before enrolling.</p>}
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="border border-red-500/30 bg-red-500/5 rounded-sm px-5 py-4 mb-6 flex items-start gap-3">
            <AlertCircle size={16} className="text-red-400 shrink-0 mt-0.5" />
            <p className="text-red-300 font-mono-tech text-xs">{error}</p>
          </div>
        )}

        {/* Submit Button */}
        <button
          onClick={handleUpgradeToGold}
          disabled={processing || selectedVehicles.length === 0 || !policyAgreed}
          className="w-full flex items-center justify-center gap-3 bg-gold hover:bg-gold-light text-obsidian font-mono-tech text-sm tracking-widest py-4 rounded-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {processing ? (
            <><Loader2 size={16} className="animate-spin" /> PROCESSING...</>
          ) : (
            <>
              <Gem size={16} />
              <span>ACTIVATE VDS GOLD — ${calculateTotal()}/MO</span>
            </>
          )}
        </button>

        <p className="text-center text-vapor/25 text-xs font-mono-tech mt-4">
          By enrolling, you agree to our{' '}
          <Link to="/terms" className="text-gold/50 hover:text-gold underline transition-colors">Terms & Conditions</Link>
          {' '}including the VDS Gold cancellation & refund policy.
        </p>
      </main>

      <Footer />
    </div>
  );
}