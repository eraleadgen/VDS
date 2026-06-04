import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { LogOut, Plus, Calendar, ChevronRight } from 'lucide-react';
import { format, startOfMonth } from 'date-fns';
import Navbar from '../components/vds/Navbar';
import Footer from '../components/vds/Footer';
import GoldShimmer from '../components/vds/GoldShimmer';
import UsageTracker from '../components/member/UsageTracker';
import VehicleCard from '../components/member/VehicleCard';
import AddVehicleForm from '../components/member/AddVehicleForm';

const BOOKING_LINK = 'https://book.vdsmobile.com'; // Replace with your actual Gold member booking link

export default function MemberDashboard() {
  const [user, setUser] = useState(null);
  const [vehicles, setVehicles] = useState([]);
  const [records, setRecords] = useState([]);
  const [showAddVehicle, setShowAddVehicle] = useState(false);
  const [loading, setLoading] = useState(true);

  const currentMonth = format(new Date(), 'yyyy-MM');

  useEffect(() => {
    const init = async () => {
      const me = await base44.auth.me();
      setUser(me);
      await loadData();
      setLoading(false);
    };
    init();
  }, []);

  const loadData = async () => {
    const [v, r] = await Promise.all([
      base44.entities.MemberVehicle.list(),
      base44.entities.ServiceRecord.list(),
    ]);
    setVehicles(v);
    setRecords(r);
  };

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
        {/* Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-12">
          <div>
            <p className="text-xs font-mono-tech tracking-[0.3em] text-gold/70 mb-2">VDS GOLD MEMBER PORTAL</p>
            <h1 className="text-4xl font-grotesk font-bold text-vapor">
              WELCOME, <GoldShimmer>{user?.full_name?.split(' ')[0]?.toUpperCase() || 'MEMBER'}</GoldShimmer>
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

        {/* This Month Banner */}
        <div className="border border-gold/20 bg-gradient-to-r from-[#0D0B06] to-obsidian p-5 rounded-sm mb-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <p className="text-xs font-mono-tech tracking-widest text-gold/60 mb-1">CURRENT BILLING PERIOD</p>
            <p className="text-vapor font-grotesk font-semibold">{format(new Date(), 'MMMM yyyy')}</p>
          </div>
          <a
            href={BOOKING_LINK}
            target="_blank"
            rel="noopener noreferrer"
            className="vds-gold-btn flex items-center gap-2 px-6 py-3 text-xs font-mono-tech tracking-widest rounded-sm whitespace-nowrap"
          >
            <Calendar size={13} /> SCHEDULE APPOINTMENT →
          </a>
        </div>

        {/* Usage Tracker */}
        <div className="mb-12">
          <p className="text-xs font-mono-tech tracking-[0.3em] text-vapor/40 mb-4">THIS MONTH'S USAGE</p>
          <UsageTracker fullDetailsUsed={fullDetailsUsed} exteriorDetailsUsed={exteriorDetailsUsed} />
        </div>

        {/* Service History */}
        {thisMonthRecords.length > 0 && (
          <div className="mb-12">
            <p className="text-xs font-mono-tech tracking-[0.3em] text-vapor/40 mb-4">RECENT SERVICES</p>
            <div className="space-y-2">
              {thisMonthRecords.map(record => {
                const v = vehicles.find(veh => veh.id === record.vehicle_id);
                return (
                  <div key={record.id} className="glass-panel border border-vapor/10 px-5 py-4 rounded-sm flex items-center justify-between">
                    <div>
                      <p className="text-vapor text-sm font-grotesk font-medium">
                        {record.service_type === 'full_detail' ? 'Full Interior Detail' : 'Exterior Detail'}
                      </p>
                      {v && (
                        <p className="text-vapor/40 text-xs font-mono-tech mt-0.5">
                          {v.year} {v.make} {v.model}
                        </p>
                      )}
                    </div>
                    <p className="text-vapor/40 text-xs font-mono-tech">
                      {record.service_date ? format(new Date(record.service_date), 'MMM d') : '—'}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Vehicles */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs font-mono-tech tracking-[0.3em] text-vapor/40">MY VEHICLES</p>
            {!showAddVehicle && (
              <button
                onClick={() => setShowAddVehicle(true)}
                className="flex items-center gap-2 text-xs font-mono-tech tracking-widest text-gold/60 hover:text-gold transition-colors border border-gold/20 hover:border-gold/40 px-4 py-2 rounded-sm"
              >
                <Plus size={12} /> ADD VEHICLE
              </button>
            )}
          </div>

          {showAddVehicle && (
            <div className="mb-4">
              <AddVehicleForm onAdd={handleAddVehicle} onCancel={() => setShowAddVehicle(false)} />
            </div>
          )}

          {vehicles.length === 0 && !showAddVehicle ? (
            <div className="border border-dashed border-vapor/10 rounded-sm p-12 text-center">
              <p className="text-vapor/30 font-mono-tech text-sm">No vehicles added yet.</p>
              <button
                onClick={() => setShowAddVehicle(true)}
                className="mt-4 text-xs font-mono-tech tracking-widest text-gold/60 hover:text-gold transition-colors"
              >
                + ADD YOUR FIRST VEHICLE
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {vehicles.map(v => (
                <VehicleCard key={v.id} vehicle={v} onDelete={handleDeleteVehicle} />
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}