import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Eye, EyeOff, ArrowRight, CheckCircle2 } from 'lucide-react';
import Navbar from '@/components/vds/Navbar';
import Footer from '@/components/vds/Footer';
import GoldShimmer from '@/components/vds/GoldShimmer';

const invoke = (payload) => base44.functions.invoke('scheduler', payload).then(r => r.data ?? r);
const INPUT = 'w-full bg-asphalt border border-vapor/10 focus:border-gold/50 outline-none text-vapor px-4 py-3 text-sm font-mono-tech rounded-sm transition-colors duration-200';
const LABEL = 'block text-xs font-mono-tech tracking-widest text-vapor/50 mb-2';

// Partner account creation form. The admin enters only contact info; the partner fills in
// their dealership / type / phone here AND sets their password, then verifies via OTP.
export default function PartnerSetup() {
  const params = new URLSearchParams(window.location.search);
  const token = params.get('token') || '';

  const [stage, setStage] = useState('validating'); // validating | invalid | form | otp
  const [info, setInfo] = useState(null); // { name, email, phone }
  const [error, setError] = useState('');

  const [dealership, setDealership] = useState('');
  const [partnerType, setPartnerType] = useState('dealership_salesperson');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [otp, setOtp] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    (async () => {
      if (!token) { setStage('invalid'); setError('No invite token was found in the link.'); return; }
      try {
        const r = await invoke({ action: 'validate_partner_token', token });
        if (r.error) { setStage('invalid'); setError(r.error); return; }
        setInfo({ name: r.name, email: r.email, phone: r.phone || '' });
        setPhone(r.phone || '');
        setStage('form');
      } catch (e) {
        setStage('invalid');
        setError(e.message || 'Unable to validate this invite.');
      }
    })();
  }, [token]);

  const submitForm = async (e) => {
    e.preventDefault();
    setError('');
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return; }
    if (password !== confirm) { setError('Passwords do not match.'); return; }
    setBusy(true);
    try {
      try {
        await base44.auth.register({ email: info.email, password, full_name: info.name });
      } catch (regErr) {
        // If an account already exists for this email (e.g. a previous incomplete setup or an
        // existing member), don't block — send a fresh verification code and continue to OTP so
        // they can finish linking their partner account.
        const msg = (regErr.message || '').toLowerCase();
        if (msg.includes('already') || msg.includes('exists') || msg.includes('duplicate') || msg.includes('registered')) {
          await base44.auth.resendOtp(info.email);
        } else {
          throw regErr;
        }
      }
      setStage('otp');
    } catch (err) {
      setError(err.message || 'Could not create your account. If you already have an account with this email, please contact your administrator.');
    } finally {
      setBusy(false);
    }
  };

  const submitOtp = async () => {
    setError('');
    if (otp.length < 6) { setError('Enter the 6-digit code.'); return; }
    setBusy(true);
    try {
      const result = await base44.auth.verifyOtp({ email: info.email, otpCode: otp });
      if (result?.access_token) base44.auth.setToken(result.access_token);
      const r = await invoke({
        action: 'finalize_partner_setup',
        invite_token: token,
        profile: { dealership, partner_type: partnerType, phone },
      });
      if (r.error) { setError(r.error); setBusy(false); return; }
      window.location.href = '/partner-portal';
    } catch (err) {
      setError(err.message || 'Invalid verification code.');
      setBusy(false);
    }
  };

  const resend = async () => {
    setError('');
    try { await base44.auth.resendOtp(info.email); } catch (e) { setError(e.message || 'Failed to resend code.'); }
  };

  return (
    <div className="bg-obsidian min-h-screen flex flex-col">
      <Navbar />
      <div className="flex-1 flex items-center justify-center px-6 pt-32 pb-16">
        <div className="w-full max-w-md">
          <div className="text-center mb-10">
            <p className="text-xs font-mono-tech tracking-[0.3em] text-gold/70 mb-4">PARTNER SETUP</p>
            <h1 className="text-4xl font-grotesk font-bold text-vapor mb-3">
              {stage === 'otp' ? <>VERIFY <GoldShimmer>EMAIL</GoldShimmer></> : <>CREATE <GoldShimmer>ACCOUNT</GoldShimmer></>}
            </h1>
            <p className="text-vapor/50 text-sm font-mono-tech">
              {stage === 'otp' ? 'Enter the code we sent to your email.' : 'Complete your profile and set your password.'}
            </p>
          </div>

          <div className="glass-panel border border-gold/15 p-8 rounded-sm">
            {stage === 'validating' && (
              <div className="flex justify-center py-10"><div className="w-8 h-8 border-2 border-gold/20 border-t-gold rounded-full animate-spin" /></div>
            )}

            {stage === 'invalid' && (
              <div className="text-center py-6">
                <p className="text-red-400 text-sm font-mono-tech mb-6">{error}</p>
                <a href="/admin-login" className="text-gold text-xs font-mono-tech tracking-widest">← BACK TO LOGIN</a>
              </div>
            )}

            {stage === 'form' && (
              <form onSubmit={submitForm} className="space-y-5">
                <div>
                  <label className={LABEL}>EMAIL</label>
                  <input value={info?.email || ''} disabled className={`${INPUT} opacity-60`} />
                </div>
                <div>
                  <label className={LABEL}>DEALERSHIP / COMPANY</label>
                  <input value={dealership} onChange={e => setDealership(e.target.value)} className={INPUT} placeholder="Where you work" />
                </div>
                <div>
                  <label className={LABEL}>PARTNER TYPE</label>
                  <select value={partnerType} onChange={e => setPartnerType(e.target.value)} className={INPUT}>
                    <option value="dealership_salesperson">Dealership Salesperson</option>
                    <option value="strategic_partner">Strategic Partner</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className={LABEL}>PHONE</label>
                  <input value={phone} onChange={e => setPhone(e.target.value)} className={INPUT} />
                </div>
                <div>
                  <label className={LABEL}>PASSWORD</label>
                  <div className="relative">
                    <input
                      type={showPass ? 'text' : 'password'}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      required
                      minLength={8}
                      className={`${INPUT} pr-12`}
                      placeholder="At least 8 characters"
                    />
                    <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-4 top-1/2 -translate-y-1/2 text-vapor/30 hover:text-vapor/60 transition-colors">
                      {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className={LABEL}>CONFIRM PASSWORD</label>
                  <input
                    type={showPass ? 'text' : 'password'}
                    value={confirm}
                    onChange={e => setConfirm(e.target.value)}
                    required
                    minLength={8}
                    className={INPUT}
                    placeholder="Re-enter password"
                  />
                </div>

                {error && <p className="text-red-400 text-xs font-mono-tech border border-red-400/20 bg-red-400/5 px-4 py-3 rounded-sm">{error}</p>}

                <button type="submit" disabled={busy}
                  className="w-full bg-vapor text-obsidian py-4 text-sm font-mono-tech tracking-widest hover:bg-gold transition-colors duration-200 rounded-sm flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed mt-2">
                  {busy ? 'CREATING ACCOUNT...' : <>CONTINUE <ArrowRight size={14} /></>}
                </button>
              </form>
            )}

            {stage === 'otp' && (
              <div className="space-y-5">
                <p className="text-sm text-vapor/60 font-mono-tech text-center">
                  We sent a 6-digit verification code to<br /><span className="text-gold">{info?.email}</span>
                </p>
                <input
                  value={otp}
                  onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  inputMode="numeric"
                  autoFocus
                  placeholder="••••••"
                  className="w-full bg-asphalt border border-vapor/10 focus:border-gold/50 outline-none text-vapor text-center text-2xl tracking-[0.5em] font-mono-tech px-4 py-4 rounded-sm transition-colors duration-200"
                />
                {error && <p className="text-red-400 text-xs font-mono-tech border border-red-400/20 bg-red-400/5 px-4 py-3 rounded-sm">{error}</p>}
                <button onClick={submitOtp} disabled={busy || otp.length < 6}
                  className="w-full bg-vapor text-obsidian py-4 text-sm font-mono-tech tracking-widest hover:bg-gold transition-colors duration-200 rounded-sm flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed">
                  {busy ? <span className="flex items-center gap-2"><CheckCircle2 size={14} className="animate-pulse" /> SETTING UP...</span> : <>VERIFY &amp; ENTER PORTAL <ArrowRight size={14} /></>}
                </button>
                <p className="text-center text-xs font-mono-tech text-vapor/40">
                  Didn't receive the code? <button onClick={resend} className="text-gold/70 hover:text-gold tracking-widest">RESEND</button>
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}