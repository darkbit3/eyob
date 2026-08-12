import { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import {
  Gavel, Phone, Lock, Eye, EyeOff,
  ArrowRight, Sparkles, ShieldCheck, Loader2, XCircle,
} from 'lucide-react';
import { authApi, setToken } from '../../utils/api';
import { ROUTES } from '../../utils/routes';

export default function Login() {
  const { setCurrentUser } = useApp();
  const nav = useNavigate();

  const [phoneDigits, setPhoneDigits] = useState('');
  const [password, setPassword]       = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [touched, setTouched]         = useState<Record<string, boolean>>({});
  const [apiError, setApiError]       = useState('');
  const [loading, setLoading]         = useState(false);

  // ── Validation ────────────────────────────────────────────────────────────
  const phoneError = useMemo(() => {
    if (!touched.phone) return null;
    if (phoneDigits.length === 0) return 'Phone number is required';
    if (phoneDigits.length < 9)   return `${9 - phoneDigits.length} more digit${9 - phoneDigits.length > 1 ? 's' : ''} needed`;
    if (!/^[79]/.test(phoneDigits)) return 'Number must start with 9 or 7';
    return null;
  }, [phoneDigits, touched.phone]);

  const passwordError = useMemo(() =>
    touched.password && !password ? 'Password is required' : null,
  [password, touched.password]);

  const isValid = phoneDigits.length === 9 && /^[79]/.test(phoneDigits) && password.length > 0;

  function blur(field: string) {
    setTouched(prev => ({ ...prev, [field]: true }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setTouched({ phone: true, password: true });
    if (!isValid) return;

    setApiError('');
    setLoading(true);
    try {
      const fullPhone = `+251${phoneDigits}`;
      const res = await authApi.login(fullPhone, password);
      setToken(res.data.token);

      const u = res.data.user;
      setCurrentUser({
        id:            u.id,
        name:          u.name,
        email:         u.email,
        phone:         u.phone ?? fullPhone,
        role:          u.role,
        walletBalance: Number(u.wallet_balance ?? 0),
        status:        u.status,
        joinedAt:      u.joined_at ?? new Date().toISOString().split('T')[0],
        wonAuctions:   u.won_auctions ?? [],
        photo:         u.photo_url ?? undefined,
      });

      nav(u.role === 'admin' || u.role === 'super_admin' ? '/admin' : ROUTES.DASHBOARD, { replace: true });
    } catch (err: any) {
      setApiError(err.message || 'Login failed. Please try again.');
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
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-[11px] font-bold text-amber-300">
              <Sparkles className="w-3.5 h-3.5" /> Lowest Unique Bid
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight leading-tight">
              Sign In to Your Account
            </h2>
            <p className="text-xs text-blue-100 leading-relaxed">
              Access your wallet balance, place strategic unique bids, and audit verified auction history.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs text-blue-200 font-bold border-t border-white/10 pt-4">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>256-Bit SSL Encrypted Protocol</span>
          </div>
        </div>

        {/* ── Right Form ────────────────────────────────────────────────── */}
        <div className="md:col-span-7 p-8 sm:p-12 flex flex-col justify-center space-y-6">
          <div>
            <h3 className="text-2xl font-bold text-slate-900 tracking-tight">Welcome Back</h3>
            <p className="text-xs text-slate-500 font-medium mt-1">Enter your phone number & password to continue</p>
          </div>

          {apiError && (
            <div className="p-3 bg-rose-50 text-rose-700 rounded-xl text-xs font-bold border border-rose-200 flex items-center gap-2">
              <XCircle className="w-4 h-4 shrink-0" /> {apiError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>

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
                    const digits = e.target.value.replace(/\D/g, '').slice(0, 9);
                    setPhoneDigits(digits);
                  }}
                  onBlur={() => blur('phone')}
                  className={`flex-1 border border-slate-300 rounded-r-xl px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 ${
                    phoneError ? 'border-rose-400 focus:ring-rose-300' : ''
                  }`}
                  placeholder="9XXXXXXXX"
                  maxLength={9}
                  autoComplete="tel"
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
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  Password
                </label>
                <Link to={ROUTES.FORGOT_PASSWORD} className="text-xs font-bold text-blue-600 hover:underline">
                  Forgot?
                </Link>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  onBlur={() => blur('password')}
                  className={`input-field pl-10 pr-10 ${passwordError ? 'border-rose-400 focus:ring-rose-300' : ''}`}
                  placeholder="••••••••"
                  autoComplete="current-password"
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
              {passwordError && <p className="text-rose-500 text-xs mt-1 font-medium">{passwordError}</p>}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-3.5 text-sm disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Signing In…</>
                : <>Sign In <ArrowRight className="w-4 h-4" /></>}
            </button>
          </form>

          <div className="pt-4 border-t border-slate-100 text-center text-xs text-slate-500 font-medium">
            Don't have an account?{' '}
            <Link to={ROUTES.REGISTER} className="font-bold text-blue-600 hover:underline">Create an Account</Link>
          </div>
        </div>

      </div>
    </div>
  );
}
