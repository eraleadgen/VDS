import { useState } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Eye, EyeOff, ArrowRight } from 'lucide-react';
import Navbar from '@/components/vds/Navbar';
import Footer from '@/components/vds/Footer';
import GoldShimmer from '@/components/vds/GoldShimmer';
import RememberDevice from '@/components/vds/RememberDevice';
import { applyRememberDevice } from '@/lib/remember-device';

export default function SpecialistLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await base44.auth.loginViaEmailPassword(email, password);
      applyRememberDevice(remember);
      const me = await base44.auth.me();
      if (me.role === 'admin') { window.location.href = '/admin'; return; }
      if (me.role !== 'contractor') { setError('This account is not registered as a specialist.'); return; }
      window.location.href = '/specialist-portal';
    } catch (err) {
      setError('Invalid email or password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-obsidian min-h-screen flex flex-col">
      <Navbar />
      <div className="flex-1 flex items-center justify-center px-6 pt-32 pb-16">
        <div className="w-full max-w-md">
          <div className="text-center mb-10">
            <p className="text-xs font-mono-tech tracking-[0.3em] text-gold/70 mb-4">SPECIALIST PORTAL</p>
            <h1 className="text-4xl font-grotesk font-bold text-vapor mb-3">
              SPECIALIST <GoldShimmer>LOGIN</GoldShimmer>
            </h1>
            <p className="text-vapor/50 text-sm font-mono-tech">
              Access your schedule, manage jobs & update availability.
            </p>
          </div>

          <div className="glass-panel border border-gold/15 p-8 rounded-sm">
            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label className="block text-xs font-mono-tech tracking-widest text-vapor/50 mb-2">EMAIL</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  className="w-full bg-asphalt border border-vapor/10 focus:border-gold/50 outline-none text-vapor px-4 py-3 text-sm font-mono-tech rounded-sm transition-colors duration-200"
                  placeholder="specialist@yourbusiness.com"
                />
              </div>
              <div>
                <label className="block text-xs font-mono-tech tracking-widest text-vapor/50 mb-2">PASSWORD</label>
                <div className="relative">
                  <input
                    type={showPass ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    className="w-full bg-asphalt border border-vapor/10 focus:border-gold/50 outline-none text-vapor px-4 py-3 pr-12 text-sm font-mono-tech rounded-sm transition-colors duration-200"
                    placeholder="••••••••"
                  />
                  <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-4 top-1/2 -translate-y-1/2 text-vapor/30 hover:text-vapor/60 transition-colors">
                    {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              <RememberDevice checked={remember} onChange={setRemember} />

              {error && (
                <p className="text-red-400 text-xs font-mono-tech border border-red-400/20 bg-red-400/5 px-4 py-3 rounded-sm">{error}</p>
              )}

              <button type="submit" disabled={loading}
                className="w-full bg-vapor text-obsidian py-4 text-sm font-mono-tech tracking-widest hover:bg-gold transition-colors duration-200 rounded-sm flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed mt-2">
                {loading ? 'SIGNING IN...' : <>SIGN IN <ArrowRight size={14} /></>}
              </button>
            </form>
            <div className="mt-6 pt-6 border-t border-vapor/10 text-center">
              <Link to="/forgot-password" className="text-xs font-mono-tech text-gold/60 hover:text-gold transition-colors tracking-widest">FORGOT PASSWORD →</Link>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}