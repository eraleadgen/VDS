import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { LogOut, Calendar, Star, ClipboardList, CheckCircle, X, RotateCcw, User } from 'lucide-react';
import { format, startOfMonth } from 'date-fns';
import Navbar from '../components/vds/Navbar';
import Footer from '../components/vds/Footer';
import GoldShimmer from '../components/vds/GoldShimmer';
import VehicleGarageSection from '../components/member/VehicleGarageSection';
import AccountDetailsForm from '../components/member/AccountDetailsForm';
import AppointmentCard from '../components/member/AppointmentCard';
import VehicleSubscriptionModal from '../components/member/VehicleSubscriptionModal';

// v3
const BOOKING_LINK = 'https://book.vdsmobile.com';

export default function MemberDashboard() {
  const [user, setUser] = useState(null);
  const [vehicles, setVehicles] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]); // VehicleSubscription records
  const [records, setRecords] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [showAddVehicle, setShowAddVehicle] = useState(false);
  const [showEditAccount, setShowEditAccount] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [modalAction, setModalAction] = useState(null);
  const [showGoldSuccess, setShowGoldSuccess] = useState(false);
  const [showRefundSuccess, setShowRefundSuccess] = useState(false);

  const currentMonth = format(new Date(), 'yyyy-MM');

  const loadData = useCallback(async () => {
    const [v, r, a, subsRes] = await Promise.allSettled([
      base44.entities.MemberVehicle.list(),
      base44.entities.ServiceRecord.list(),
      base44.entities.Appointment.list(),
      base44.functions.invoke('getMySubscriptions', {}),
    ]);
    if (v.status === 'fulfilled') setVehicles(v.value);
    if (r.status === 'fulfilled') setRecords(r.value);
    if (a.status === 'fulfilled') setAppointments(a.value.sort((x, y) => new Date(y.preferred_date) - new Date(x.preferred_date)));
    if (subsRes.status === 'fulfilled') setSubscriptions(subsRes.value?.data?.subscriptions || []);
  }, []);

  // Fallback: provision Gold subscriptions if webhook hasn't fired yet
  const provisionGoldSubscriptions = async (me) => {
    try {
      await base44.functions.invoke('provisionGoldOnReturn', { user_id: me?.id });
    } catch (e) {
      console.log('Provision fallback skipped:', e.message);
    }
  };

  // Real-time subscription — auto-refreshes appointments when GHL syncs cancel/confirm
  useEffect(() => {
    const unsubscribe = base44.entities.Appointment.subscribe(() => loadData());
    const onVisibility = () => {
      if (document.visibilityState === 'visible') loadData();
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => { unsubscribe(); document.removeEventListener('visibilitychange', onVisibility); };
  }, [loadData]);

  useEffect(() => {
    const init = async () => {
      const me = await base44.auth.me();
      // Also load saved_addresses from User entity (not always in auth.me())
      try {
        const userEntities = await base44.entities.User.list();
        const myEntity = userEntities.find(u => u.id === me.id);
        setUser({ ...me, saved_addresses: myEntity?.saved_addresses || [] });
      } catch {
        setUser(me);
      }
      // Check for gold success query param
      const params = new URLSearchParams(window.location.search);
      if (params.get('gold_success') === 'true') {
        setShowGoldSuccess(true);
        // Provision subscriptions as fallback in case webhook hasn't fired yet
        await provisionGoldSubscriptions(me);
        // Small delay to ensure DB writes are settled before loading data
        await new Promise(resolve => setTimeout(resolve, 1500));
        // Clean up URL
        window.history.replaceState({}, document.title, '/member-dashboard');
      }
      await loadData();
      setLoading(false);
    };
    init();
  }, []);

  const thisMonthRecords = records.filter(r => r.month_year === currentMonth);
  const fullDetailsUsed = thisMonthRecords.filter(r => r.service_type === 'full_detail').length;
  const exteriorDetailsUsed = thisMonthRecords.filter(r => r.service_type === 'exterior_detail').length;

  const handleAddVehicle = async (formData) => {
    await base44.entities.MemberVehicle.create(formData);
    setShowAddVehicle(false);
    await loadData();
  };

  const handleDeleteVehicle = async (id) => {
    await base44.entities.MemberVehicle.delete(id);
    await loadData();
  };

  const handleEditVehicle = async (id, formData) => {
    await base44.entities.MemberVehicle.update(id, formData);
    await loadData();
  };

  const handleVehicleSubscriptionChange = async () => {
    await loadData();
  };

  const handleEnrollClick = (vehicle) => {
    setSelectedVehicle(vehicle);
    setModalAction('enroll');
  };

  const handleCancelClick = (vehicle) => {
    setSelectedVehicle(vehicle);
    setModalAction('cancel');
  };

  const handleModalConfirm = async () => {
    if (!selectedVehicle) return;
    if (modalAction === 'enroll') {
      window.location.href = '/vds-gold-signup';
    } else if (modalAction === 'cancel') {
      try {
        const response = await base44.functions.invoke('cancelGoldSubscription', { vehicle_id: selectedVehicle.id });
        if (response.data.success) {
          if (response.data.refund_issued) setShowRefundSuccess(true);
          await loadData();
        }
      } catch (error) {
        console.error('Cancellation error:', error);
      }
    }
    setSelectedVehicle(null);
    setModalAction(null);
  };

  const handleModalClose = () => {
    setSelectedVehicle(null);
    setModalAction(null);
  };

  const handleAccountSaved = async (updatedFields) => {
    setShowEditAccount(false);
    try {
      const fresh = await base44.auth.me();
      // Merge saved_addresses from entity since auth.me() may not include it
      const userEntity = await base44.entities.User.list();
      const myEntity = userEntity.find(u => u.id === fresh.id);
      setUser({ ...fresh, saved_addresses: myEntity?.saved_addresses || updatedFields.saved_addresses || [] });
    } catch (e) {
      setUser(prev => ({ ...prev, ...updatedFields }));
    }
  };

  const handleLogout = () => {
    base44.auth.logout('/');
  };

  if (loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-obsidian">
        <div className="w-8 h-8 border-2 border-gold/20 border-t-gold rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="bg-obsidian min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-5xl mx-auto w-full px-6 pt-32 pb-20">
        {/* Refund Success Banner */}
        {showRefundSuccess && (
          <div className="mb-8 border border-emerald-500/30 bg-emerald-950/30 rounded-sm p-5 flex items-center gap-4">
            <RotateCcw size={24} className="text-emerald-400 shrink-0" />
            <div>
              <p className="text-emerald-400 font-grotesk font-semibold">Refund Issued</p>
              <p className="text-vapor/50 font-mono-tech text-xs">Your membership has been canceled and a full refund has been processed to your original payment method.</p>
            </div>
            <button onClick={() => setShowRefundSuccess(false)} className="ml-auto text-vapor/30 hover:text-vapor">
              <X size={16} />
            </button>
          </div>
        )}

        {/* Gold Success Banner */}
        {showGoldSuccess && (
          <div className="mb-8 border border-gold/30 bg-gold/10 rounded-sm p-5 flex items-center gap-4">
            <CheckCircle size={24} className="text-gold shrink-0" />
            <div>
              <p className="text-gold font-grotesk font-semibold">Welcome to VDS Gold!</p>
              <p className="text-vapor/50 font-mono-tech text-xs">Your membership is active. Enjoy unlimited exterior details and 1 interior detail per month.</p>
            </div>
            <button onClick={() => setShowGoldSuccess(false)} className="ml-auto text-vapor/30 hover:text-vapor">
              <X size={16} />
            </button>
          </div>
        )}

        {/* Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-12">
          <div>
            <p className="text-xs font-mono-tech tracking-[0.3em] text-gold/70 mb-2">{subscriptions.length > 0 ? 'VDS GOLD MEMBER PORTAL' : 'MEMBER PORTAL'}</p>
            <h1 className="text-4xl font-grotesk font-bold text-vapor">
              WELCOME, <GoldShimmer>{(user?.full_name?.includes('@') ? '' : user?.full_name?.split(' ')[0])?.toUpperCase() || 'MEMBER'}</GoldShimmer>
            </h1>
            <p className="text-vapor/40 text-xs font-mono-tech mt-2 tracking-widest">{user?.email}</p>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 border border-vapor/20 text-vapor/50 hover:border-vapor/40 hover:text-vapor px-5 py-3 text-xs font-mono-tech tracking-widest transition-colors rounded-sm"
          >
            <LogOut size={13} /> SIGN OUT
          </button>
        </div>



        {/* Upcoming Appointments */}
        <div className="mb-8">
          <p className="text-xs font-mono-tech tracking-[0.3em] text-vapor/40 mb-4">UPCOMING APPOINTMENTS</p>
          {appointments.filter(a => {
            if (a.status === 'cancelled' || a.status === 'completed') return false;
            if (!a.preferred_date) return true;
            const apptDate = new Date(a.preferred_date + 'T23:59:00');
            return apptDate >= new Date();
          }).length === 0 ? (
            <div className="glass-panel border border-vapor/10 rounded-sm p-8 text-center">
              <ClipboardList size={24} className="text-vapor/20 mx-auto mb-3" />
              <p className="text-vapor/40 font-mono-tech text-xs">No upcoming appointments</p>
              <Link
                to="/book"
                className="mt-4 inline-flex items-center gap-2 vds-gold-btn px-6 py-3 text-xs font-mono-tech tracking-widest rounded-sm whitespace-nowrap"
              >
                <Calendar size={13} /> SCHEDULE APPOINTMENT →
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {appointments
                .filter(a => {
                  if (a.status === 'cancelled' || a.status === 'completed') return false;
                  if (!a.preferred_date) return true;
                  const apptDate = new Date(a.preferred_date + 'T23:59:00');
                  return apptDate >= new Date();
                })
                .map(apt => (
                  <AppointmentCard
                    key={apt.id}
                    appointment={apt}
                    onRefresh={loadData}
                  />
                ))}
            </div>
          )}
        </div>

        {/* VDS Gold Quick Booking — Gold members only */}
        {subscriptions.length > 0 && (
          <div className="mb-8">
            <p className="text-xs font-mono-tech tracking-[0.3em] text-vapor/40 mb-4">VDS GOLD BOOKING</p>
            <div className="glass-panel border border-gold/20 rounded-sm p-6">
              <div className="flex items-center gap-3 mb-5">
                <Star size={14} className="text-gold" />
                <p className="text-vapor font-grotesk font-semibold">Book Your Gold Services</p>
              </div>
              <p className="text-vapor/40 font-mono-tech text-xs leading-relaxed mb-6">
                As a VDS Gold member, you have access to unlimited exterior details and 1 interior detail per month — all with ceramic sealant included. Rates: $250/mo (sedan/coupe) or $300/mo (truck/SUV) per vehicle.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Link
                  to="/gold-booking"
                  className="flex flex-col gap-1 border border-gold/25 hover:border-gold/50 bg-gold/5 hover:bg-gold/10 px-5 py-4 rounded-sm transition-colors group"
                >
                  <p className="text-gold font-mono-tech text-xs tracking-widest group-hover:text-gold-light transition-colors">◆ EXTERIOR DETAIL</p>
                  <p className="text-vapor/50 text-xs font-mono-tech">Unlimited / Month · 1 hr</p>
                </Link>
                <Link
                  to="/gold-booking"
                  className="flex flex-col gap-1 border border-gold/25 hover:border-gold/50 bg-gold/5 hover:bg-gold/10 px-5 py-4 rounded-sm transition-colors group"
                >
                  <p className="text-gold font-mono-tech text-xs tracking-widest group-hover:text-gold-light transition-colors">◆ FULL DETAIL</p>
                  <p className="text-vapor/50 text-xs font-mono-tech">1× Per Month · 2–3 hrs</p>
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Subscription Status */}
        <div className="mb-8">
          <p className="text-xs font-mono-tech tracking-[0.3em] text-vapor/40 mb-4">MEMBERSHIP STATUS</p>
          {subscriptions.length > 0 ? (
            <div className="glass-panel border border-gold/15 rounded-sm p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-2 h-2 rounded-full bg-gold animate-pulse" />
                <div>
                  <p className="text-vapor font-grotesk font-semibold">VDS Gold — Active</p>
                  <p className="text-vapor/40 text-xs font-mono-tech mt-0.5">Unlimited Exterior + 1 Interior / Month · Ceramic Sealant Included</p>
                </div>
              </div>
              <div className="flex flex-col items-end gap-2">
                <p className="text-gold font-mono-tech text-xs tracking-widest">
                  ${subscriptions.reduce((sum, sub) => sum + (sub.tier === 'truck_suv' ? 300 : 250), 0)} / MO
                </p>
                <p className="text-vapor/30 text-xs font-mono-tech">
                  {subscriptions.length} Gold vehicle{subscriptions.length > 1 ? 's' : ''} · Billed via Stripe
                </p>
                <button
                  onClick={() => {
                    const goldVehicle = vehicles.find(v => subscriptions.some(s => s.vehicle_id === v.id));
                    if (goldVehicle) handleCancelClick(goldVehicle);
                  }}
                  className="text-xs font-mono-tech tracking-widest text-red-400/60 hover:text-red-400 border border-red-400/20 hover:border-red-400/40 px-3 py-1.5 rounded-sm transition-colors"
                >
                  CANCEL MEMBERSHIP
                </button>
              </div>
            </div>
          ) : (
            <div className="glass-panel border border-vapor/10 rounded-sm p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-2 h-2 rounded-full bg-vapor/20" />
                <div>
                  <p className="text-vapor/60 font-grotesk font-semibold">No Active Membership</p>
                  <p className="text-vapor/30 text-xs font-mono-tech mt-0.5">Join VDS Gold for unlimited exterior + interior details each month</p>
                </div>
              </div>
              <Link to="/vds-gold" className="vds-gold-btn px-5 py-2.5 text-xs font-mono-tech tracking-widest rounded-sm whitespace-nowrap">
                ◆ JOIN VDS GOLD
              </Link>
            </div>
          )}
        </div>

        {/* Completed Appointments */}
        {appointments.filter(a => a.status === 'completed').length > 0 && (
          <div className="mb-12">
            <p className="text-xs font-mono-tech tracking-[0.3em] text-vapor/40 mb-4">COMPLETED APPOINTMENTS</p>
            <div className="space-y-3">
              {appointments
                .filter(a => a.status === 'completed')
                .map(apt => (
                  <AppointmentCard key={apt.id} appointment={apt} onRefresh={loadData} />
                ))}
            </div>
          </div>
        )}

        {/* Account Details */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs font-mono-tech tracking-[0.3em] text-vapor/40">ACCOUNT DETAILS</p>
            {!showEditAccount && (
              <button
                onClick={() => setShowEditAccount(true)}
                className="flex items-center gap-2 text-xs font-mono-tech tracking-widest text-gold/70 hover:text-gold border border-gold/20 hover:border-gold/40 px-4 py-2 rounded-sm transition-colors"
              >
                <User size={12} /> EDIT ACCOUNT
              </button>
            )}
          </div>
          {showEditAccount ? (
            <AccountDetailsForm
              user={user}
              subscriptions={subscriptions}
              onSaved={handleAccountSaved}
              onCancel={() => setShowEditAccount(false)}
            />
          ) : (
            <div className="glass-panel border border-vapor/10 rounded-sm p-6 grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <p className="text-xs font-mono-tech tracking-widest text-vapor/30 mb-1">FIRST NAME</p>
                <p className="text-vapor font-mono-tech text-sm">
                  {user?.full_name?.includes('@') ? '—' : (user?.full_name?.split(' ')[0] || '—')}
                </p>
              </div>
              <div>
                <p className="text-xs font-mono-tech tracking-widest text-vapor/30 mb-1">LAST NAME</p>
                <p className="text-vapor font-mono-tech text-sm">
                  {user?.full_name?.includes('@') ? '—' : (user?.full_name?.split(' ').slice(1).join(' ') || '—')}
                </p>
              </div>
              <div>
                <p className="text-xs font-mono-tech tracking-widest text-vapor/30 mb-1">EMAIL</p>
                <p className="text-vapor font-mono-tech text-sm">{user?.email || '—'}</p>
              </div>
              <div>
                <p className="text-xs font-mono-tech tracking-widest text-vapor/30 mb-1">PHONE</p>
                <p className="text-vapor font-mono-tech text-sm">{user?.phone || '—'}</p>
              </div>
              <div>
                <p className="text-xs font-mono-tech tracking-widest text-vapor/30 mb-1">SAVED ADDRESSES</p>
                {(user?.saved_addresses || []).length > 0 ? (
                  <div className="space-y-1">
                    {(user.saved_addresses).map((addr, i) => (
                      <p key={i} className="text-vapor/60 font-mono-tech text-xs">{addr}</p>
                    ))}
                  </div>
                ) : (
                  <p className="text-vapor/30 font-mono-tech text-xs">No saved addresses</p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* My Garage — vehicles with per-vehicle usage & history */}
        <VehicleGarageSection
          vehicles={vehicles}
          records={records}
          subscriptions={subscriptions}
          currentMonth={currentMonth}
          onEdit={handleEditVehicle}
          onDelete={handleDeleteVehicle}
          onEnrollClick={handleEnrollClick}
          onCancelClick={handleCancelClick}
          showAddVehicle={showAddVehicle}
          setShowAddVehicle={setShowAddVehicle}
          onAddVehicle={handleAddVehicle}
        />
      </main>

      {/* Subscription Modal - rendered at page level to avoid clipping */}
      {selectedVehicle && modalAction && (
        <VehicleSubscriptionModal
          vehicle={selectedVehicle}
          actionType={modalAction}
          subscription={subscriptions.find(s => s.vehicle_id === selectedVehicle.id)}
          onConfirm={handleModalConfirm}
          onClose={handleModalClose}
        />
      )}

      <Footer />
    </div>
  );
}