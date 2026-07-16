import { useState } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Eye, EyeOff, ArrowRight } from 'lucide-react';
import Navbar from '../components/vds/Navbar';
import Footer from '../components/vds/Footer';
import GoldShimmer from '../components/vds/GoldShimmer';
import SmsConsent from '../components/vds/SmsConsent';

export default function GoldSignup() {
  const [step, setStep] = useState('register'); // 'register' | 'otp'
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [smsConsent, setSmsConsent] = useState(false);

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    if (!firstName.trim() || !lastName.trim()) {
      setError('Please enter your first and last name.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (!smsConsent) {
      setError('Please provide SMS consent to continue.');
      return;
    }
    setLoading(true);
    await base44.auth.register({ email, password, full_name: `${firstName.trim()} ${lastName.trim()}` });
    setStep('otp');
    setLoading(false);
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const res = await base44.auth.verifyOtp({ email, otpCode: otp });
    base44.auth.setToken(res.access_token);
    // Persist full name + phone (platform may default full_name to the email prefix otherwise)
    await base44.auth.updateMe({
      full_name: `${firstName.trim()} ${lastName.trim()}`.trim(),
      phone: phone.trim(),
    });
    // Sync new member to GHL CRM
    await base44.functions.invoke('syncContactToGHL', {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email,
      phone,
      source: 'VDS Website Member Portal Signup',
      tags: ['website-signup', 'member-portal'],
    });
    window.location.href = '/member-dashboard';
  };

  const handleResendOtp = async () => {
    await base44.auth.resendOtp(email);
  };

  return (
    <div className="bg-obsidian min-h-screen flex flex-col">
      <Navbar />

      <div className="flex-1 flex items-center justify-center px-6 pt-32 pb-16">
        <div className="w-full max-w-md">
          <div className="text-center mb-10">
            <p className="text-xs font-mono-tech tracking-[0.3em] text-gold/70 mb-4">MEMBER PORTAL</p>
            <h1 className="text-4xl font-grotesk font-bold text-vapor mb-3">
              CREATE YOUR <GoldShimmer>ACCOUNT</GoldShimmer>
            </h1>
            <p className="text-vapor/50 text-sm font-mono-tech">
              Set up your member portal to manage vehicles &amp; schedule services.
            </p>
          </div>

          <div className="glass-panel border border-gold/15 p-8 rounded-sm">
            {step === 'register' ? (
              <form onSubmit={handleRegister} className="space-y-5">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-mono-tech tracking-widest text-vapor/50 mb-2">FIRST NAME</label>
                    <input
                      type="text"
                      value={firstName}
                      onChange={e => setFirstName(e.target.value)}
                      required
                      className="w-full bg-asphalt border border-vapor/10 focus:border-gold/50 outline-none text-vapor px-4 py-3 text-sm font-mono-tech rounded-sm transition-colors duration-200"
                      placeholder="John"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-mono-tech tracking-widest text-vapor/50 mb-2">LAST NAME</label>
                    <input
                      type="text"
                      value={lastName}
                      onChange={e => setLastName(e.target.value)}
                      required
                      className="w-full bg-asphalt border border-vapor/10 focus:border-gold/50 outline-none text-vapor px-4 py-3 text-sm font-mono-tech rounded-sm transition-colors duration-200"
                      placeholder="Smith"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-mono-tech tracking-widest text-vapor/50 mb-2">PHONE NUMBER</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    required
                    className="w-full bg-asphalt border border-vapor/10 focus:border-gold/50 outline-none text-vapor px-4 py-3 text-sm font-mono-tech rounded-sm transition-colors duration-200"
                    placeholder="(404) 555-0000"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono-tech tracking-widest text-vapor/50 mb-2">EMAIL</label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    className="w-full bg-asphalt border border-vapor/10 focus:border-gold/50 outline-none text-vapor px-4 py-3 text-sm font-mono-tech rounded-sm transition-colors duration-200"
                    placeholder="your@email.com"
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
                      placeholder="Min. 8 characters"
                    />
                    <button type="button" onClick={() => setShowPass(!showPass)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-vapor/30 hover:text-vapor/60 transition-colors">
                      {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-mono-tech tracking-widest text-vapor/50 mb-2">CONFIRM PASSWORD</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    required
                    className="w-full bg-asphalt border border-vapor/10 focus:border-gold/50 outline-none text-vapor px-4 py-3 text-sm font-mono-tech rounded-sm transition-colors duration-200"
                    placeholder="••••••••"
                  />
                </div>

                <div className="border border-vapor/10 bg-asphalt/50 rounded-sm px-4 py-3.5">
                  <SmsConsent checked={smsConsent} onChange={setSmsConsent} />
                </div>

                {error && (
                  <p className="text-red-400 text-xs font-mono-tech border border-red-400/20 bg-red-400/5 px-4 py-3 rounded-sm">{error}</p>
                )}

                <button
                  type="submit"
                  disabled={loading || !smsConsent}
                  className="w-full bg-gold text-obsidian py-4 text-sm font-mono-tech tracking-widest hover:bg-gold-light transition-colors duration-200 rounded-sm flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed font-bold mt-2"
                >
                  {loading ? 'CREATING ACCOUNT...' : <>CREATE ACCOUNT <ArrowRight size={14} /></>}
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtp} className="space-y-5">
                <div className="text-center mb-4">
                  <p className="text-vapor font-grotesk font-semibold mb-1">Check your email</p>
                  <p className="text-vapor/50 text-xs font-mono-tech">We sent a verification code to <span className="text-gold">{email}</span></p>
                </div>

                <div>
                  <label className="block text-xs font-mono-tech tracking-widest text-vapor/50 mb-2">VERIFICATION CODE</label>
                  <input
                    type="text"
                    value={otp}
                    onChange={e => setOtp(e.target.value)}
                    required
                    maxLength={6}
                    className="w-full bg-asphalt border border-vapor/10 focus:border-gold/50 outline-none text-vapor px-4 py-3 text-sm font-mono-tech rounded-sm transition-colors duration-200 text-center tracking-[0.5em] text-lg"
                    placeholder="000000"
                  />
                </div>

                {error && (
                  <p className="text-red-400 text-xs font-mono-tech border border-red-400/20 bg-red-400/5 px-4 py-3 rounded-sm">{error}</p>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gold text-obsidian py-4 text-sm font-mono-tech tracking-widest hover:bg-gold-light transition-colors duration-200 rounded-sm flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed font-bold"
                >
                  {loading ? 'VERIFYING...' : <>VERIFY & ENTER PORTAL <ArrowRight size={14} /></>}
                </button>

                <button type="button" onClick={handleResendOtp}
                  className="w-full text-center text-xs font-mono-tech text-vapor/30 hover:text-vapor/60 transition-colors">
                  Didn't receive a code? Resend →
                </button>
              </form>
            )}

            <div className="mt-6 pt-6 border-t border-vapor/10 text-center">
              <p className="text-vapor/30 text-xs font-mono-tech">
                Already have an account?{' '}
                <Link to="/member-login" className="text-gold/60 hover:text-gold transition-colors">Sign in →</Link>
              </p>
            </div>
          </div>

          <p className="text-center text-vapor/20 text-xs font-mono-tech mt-6">
            By creating an account you agree to our{' '}
            <Link to="/terms" className="text-vapor/40 hover:text-vapor/60 transition-colors">Terms & Conditions</Link>
          </p>
        </div>
      </div>

      <Footer />
    </div>
  );
}