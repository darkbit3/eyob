import { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import {
  Gavel, User as UserIcon, Phone, Mail, Lock, Eye, EyeOff,
  ArrowRight, ShieldCheck, Loader2, CheckCircle2, XCircle,
} from 'lucide-react';
import { authApi, setToken } from '../../utils/api';
import { ROUTES } from '../../utils/routes';

// ── Password strength rules ───────────────────────────────────────────────────
const RULES = [
  { id: 'len',    label: 'At least 8 characters',          test: (p: string) => p.length >= 8 },
  { id: 'upper',  label: 'One uppercase letter (A–Z)',      test: (p: string) => /[A-Z]/.test(p) },
  { id: 'lower',  label: 'One lowercase letter (a–z)',      test: (p: string) => /[a-z]/.test(p) },
  { id: 'number', label: 'One number (0–9)',                test: (p: string) => /\d/.test(p) },
  { id: 'symbol', label: 'One special character (!@#$…)',   test: (p: string) => /[^A-Za-z0-9]/.test(p) },
];

function strengthLabel(passed: number): { label: string; color: string; bar: string } {
  if (passed <= 1) return { label: 'Very Weak',  color: 'text-red-500',    bar: 'bg-red-500' };
  if (passed === 2) return { label: 'Weak',       color: 'text-orange-500', bar: 'bg-orange-500' };
  if (passed === 3) return { label: 'Fair',       color: 'text-yellow-500', bar: 'bg-yellow-500' };
  if (passed === 4) return { label: 'Strong',     color: 'text-blue-500',   bar: 'bg-blue-500' };
  return              { label: 'Very Strong', color: 'text-emerald-500', bar: 'bg-emerald-500' };
}

// ── Phone validation: 9 digits only (after +251) ─────────────────────────────
function validatePhoneDigits(digits: string): string | null {
  if (digits.length === 0) return 'Phone number is required';
  if (digits.length < 9)   return `${9 - digits.length} more digit${9 - digits.length > 1 ? 's' : ''} needed`;
  if (!/^[79]/.test(digits)) return 'Number must start with 9 or 7';
  return null;
}

// ── Email validation ──────────────────────────────────────────────────────────
function validateEmail(e: string): string | null {
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e))
    return 'Enter a valid email address';
  return null;
}

export default function Register() {
  const { setCurrentUser } = useApp();
  const nav = useNavigate();

  const [name, setName]                   = useState('');
  const [email, setEmail]                 = useState('');
  const [phoneDigits, setPhoneDigits]     = useState('');
  const [password, setPassword]           = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword]   = useState(false);
  const [showConfirm, setShowConfirm]     = useState(false);
  const [touched, setTouched]             = useState<Record<string, boolean>>({});
  const [apiError, setApiError]           = useState('');
  const [loading, setLoading]             = useState(false);

  // ── Live validation ───────────────────────────────────────────────────────
  const phoneError    = useMemo(() => touched.phone    ? validatePhoneDigits(phoneDigits) : null, [phoneDigits, touched.phone]);
  const emailError    = useMemo(() => touched.email    ? validateEmail(email)    : null, [email, touched.email]);
  const nameError     = useMemo(() => touched.name     ? (name.trim().length < 2 ? 'Full name is required' : null) : null, [name, touched.name]);

  const ruleResults   = useMemo(() => RULES.map(r => ({ ...r, passed: r.test(password) })), [password]);
  const passedCount   = ruleResults.filter(r => r.passed).length;
  const strength      = strengthLabel(passedCount);

  const confirmError  = useMemo(() =>
    touched.confirmPassword && password !== confirmPassword ? 'Passwords do not match' : null,
  [password, confirmPassword, touched.confirmPassword]);

  const isFormValid =
    name.trim().length >= 2 &&
    !validateEmail(email) &&
    !validatePhoneDigits(phoneDigits) &&
    passedCount === 5 &&
    password === confirmPassword;

  function blur(field: string) {
    setTouched(prev => ({ ...prev, [field]: true }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    // Touch all fields to show any remaining errors
    setTouched({ name: true, email: true, phone: true, password: true, confirmPassword: true });
    if (!isFormValid) return;

    setApiError('');
    setLoading(true);
    try {
      const fullPhone = `+251${phoneDigits}`;
      const res = await authApi.register(name.trim(), email.trim(), fullPhone, password);
      setToken(res.data.token);

      const u = res.data.user;
      setCurrentUser({
        id:            u.id,
        name:          u.name,
        email:         u.email,
        phone:         u.phone ?? `+251${phoneDigits}`,
        role:          u.role,
        walletBalance: Number(u.wallet_balance ?? 0),
        status:        u.status,
        joinedAt:      u.joined_at ?? new Date().toISOString().split('T')[0],
        wonAuctions:   u.won_auctions ?? [],
        photo:         u.photo_url ?? undefined,
      });

      nav(ROUTES.DASHBOARD);
    } catch (err: any) {
      setApiError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 font-sans">
      <div className="max-w-4xl w-full bg-white rounded-3xl overflow-hidden shadow-2xl grid grid-cols-1 md:grid-cols-12 border border-slate-800">

        {/* ── Left Hero ─────────────────────────────────────────────────── */}
        <div className="md:col-span-5 bg-gradient-to-br from-blue-700 via-indigo-800 to-purple-900 p-8 text-white flex flex-col justify-between relative overflow-hidden">
          <div className="absolute right-0 bottom-0 w-64 h-64 bg-white/10 rounded-full blur-2xl" />

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center">
              <Gavel className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-xl tracking-tight">BidLow</span>
          </div>

          <div className="space-y-4 my-8 relative z-10">

            <h2 className="text-2xl sm:text-3xl font-black tracking-tight leading-tight">
              Create Your Account
            </h2>
            <p className="text-xs text-blue-100 leading-relaxed">
              Sign up to start bidding on live unique auctions with your phone number and email.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs text-blue-200 font-bold border-t border-white/10 pt-4">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Secure Account Registration</span>
          </div>
        </div>

        {/* ── Right Form ────────────────────────────────────────────────── */}
        <div className="md:col-span-7 p-8 sm:p-10 flex flex-col justify-center space-y-5 overflow-y-auto max-h-screen">
          <div>
            <h3 className="text-2xl font-bold text-slate-900 tracking-tight">Register Account</h3>
            <p className="text-xs text-slate-500 font-medium mt-1">Fill in your details to create your account</p>
          </div>

          {apiError && (
            <div className="p-3 bg-rose-50 text-rose-700 rounded-xl text-xs font-bold border border-rose-200 flex items-center gap-2">
              <XCircle className="w-4 h-4 shrink-0" /> {apiError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>

            {/* Full Name */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Full Name
              </label>
              <div className="relative">
                <UserIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  onBlur={() => blur('name')}
                  className={`input-field pl-10 ${nameError ? 'border-rose-400 focus:ring-rose-300' : ''}`}
                  placeholder="e.g. Abebe Girma"
                />
              </div>
              {nameError && <p className="text-rose-500 text-xs mt-1 font-medium">{nameError}</p>}
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  onBlur={() => blur('email')}
                  className={`input-field pl-10 ${emailError ? 'border-rose-400 focus:ring-rose-300' : ''}`}
                  placeholder="you@example.com"
                />
              </div>
              {emailError && <p className="text-rose-500 text-xs mt-1 font-medium">{emailError}</p>}
            </div>

            {/* Phone */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Phone Number
              </label>
              <div className="flex">
                {/* Fixed prefix */}
                <span className="inline-flex items-center gap-1.5 px-3 bg-slate-100 border border-r-0 border-slate-300 rounded-l-xl text-sm font-bold text-slate-600 select-none whitespace-nowrap">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  +251
                </span>
                {/* Digits only */}
                <input
                  type="tel"
                  inputMode="numeric"
                  value={phoneDigits}
                  onChange={e => {
                    // Strip non-digits, limit to 9
                    const digits = e.target.value.replace(/\D/g, '').slice(0, 9);
                    setPhoneDigits(digits);
                  }}
                  onBlur={() => blur('phone')}
                  className={`flex-1 border border-slate-300 rounded-r-xl px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 ${
                    phoneError ? 'border-rose-400 focus:ring-rose-300' : ''
                  }`}
                  placeholder="9XXXXXXXX"
                  maxLength={9}
                />
              </div>
              <div className="flex items-center justify-between mt-1">
                {phoneError
                  ? <p className="text-rose-500 text-xs font-medium">{phoneError}</p>
                  : <span />}
                <span className={`text-xs font-medium ml-auto ${phoneDigits.length === 9 ? 'text-emerald-600' : 'text-slate-400'}`}>
                  {phoneDigits.length}/9
                </span>
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  onBlur={() => blur('password')}
                  className="input-field pl-10 pr-10"
                  placeholder="Create a strong password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Strength bar */}
              {password.length > 0 && (
                <div className="mt-2 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-500 font-medium">Strength:</span>
                    <span className={`text-xs font-bold ${strength.color}`}>{strength.label}</span>
                  </div>
                  <div className="flex gap-1">
                    {RULES.map((_, i) => (
                      <div
                        key={i}
                        className={`h-1.5 flex-1 rounded-full transition-colors duration-300 ${
                          i < passedCount ? strength.bar : 'bg-slate-200'
                        }`}
                      />
                    ))}
                  </div>
                  {/* Rule checklist */}
                  <div className="grid grid-cols-1 gap-0.5 pt-1">
                    {ruleResults.map(r => (
                      <div key={r.id} className={`flex items-center gap-1.5 text-xs font-medium transition-colors ${r.passed ? 'text-emerald-600' : 'text-slate-400'}`}>
                        {r.passed
                          ? <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                          : <XCircle className="w-3.5 h-3.5 shrink-0" />}
                        {r.label}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type={showConfirm ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  onBlur={() => blur('confirmPassword')}
                  className={`input-field pl-10 pr-10 ${confirmError ? 'border-rose-400 focus:ring-rose-300' : ''}`}
                  placeholder="Repeat your password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(v => !v)}
                  className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                  tabIndex={-1}
                >
                  {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {confirmError && <p className="text-rose-500 text-xs mt-1 font-medium">{confirmError}</p>}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-3.5 text-sm disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating Account…</>
                : <>Create Account <ArrowRight className="w-4 h-4" /></>}
            </button>
          </form>

          <div className="pt-3 border-t border-slate-100 text-center text-xs text-slate-500 font-medium">
            Already have an account?{' '}
            <Link to={ROUTES.LOGIN} className="font-bold text-blue-600 hover:underline">Sign In</Link>
          </div>
        </div>

      </div>
    </div>
  );
}
