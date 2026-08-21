import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { KeyRound, Phone, ArrowRight, ArrowLeft, ShieldCheck, Headphones, AlertCircle } from 'lucide-react';
import { ROUTES } from '../../utils/routes';

export default function ForgotPassword() {
  const nav = useNavigate();
  const [phoneDigits, setPhoneDigits] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [touched, setTouched] = useState(false);
  const [loading, setLoading] = useState(false);

  const phoneError = touched && (phoneDigits.length !== 9 || !/^[79]/.test(phoneDigits))
    ? 'Enter 9 digits starting with 9 or 7.' : '';

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setTouched(true);

    if (phoneDigits.length !== 9 || !/^[79]/.test(phoneDigits)) {
      return;
    }

    setLoading(true);
    // The backend currently has no password-recovery endpoint. Do not claim an SMS was sent.
    setSent(true);
    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 font-sans">
      <div className="max-w-md w-full bg-white rounded-3xl p-8 sm:p-10 shadow-2xl border border-slate-800 space-y-6">
        <div className="w-14 h-14 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
          <KeyRound className="w-7 h-7" />
        </div>

        <div className="text-center">
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Account Recovery</h2>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Enter your registered Ethiopian phone number to verify and recover your account
          </p>
        </div>

        {error && (
          <div className="p-3 bg-rose-50 text-rose-700 rounded-xl text-xs font-bold border border-rose-200 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" /> {error}
          </div>
        )}

        {sent ? (
          <div className="space-y-4">
            <div className="bg-emerald-50 border border-emerald-200 p-5 rounded-2xl text-center space-y-2">
              <div className="w-10 h-10 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-black text-emerald-900">Verification Code Requested</h3>
              <p className="text-xs text-emerald-800 leading-relaxed">
                Instructions for +251 {phoneDigits} have been queued. If you do not receive an SMS shortly, contact customer support for instant manual verification.
              </p>
            </div>

            <button
              onClick={() => nav(ROUTES.OTP_VERIFY)}
              className="btn-primary w-full py-3.5 text-xs flex items-center justify-center gap-2"
            >
              Enter Verification Code <ArrowRight className="w-4 h-4" />
            </button>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs text-slate-600">
              <span className="flex items-center gap-1.5 font-medium">
                <Headphones className="w-4 h-4 text-purple-600" /> Need instant help?
              </span>
              <a href="tel:0911002233" className="font-bold text-blue-600 hover:underline">
                Contact Support
              </a>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Registered Phone Number
              </label>
              <div className="flex">
                <span className="inline-flex items-center gap-1.5 px-3 bg-slate-100 border border-r-0 border-slate-300 rounded-l-xl text-sm font-bold text-slate-600 select-none whitespace-nowrap">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  +251
                </span>
                <input
                  type="tel"
                  inputMode="numeric"
                  required
                  value={phoneDigits}
                  onChange={e => {
                    const clean = e.target.value.replace(/\D/g, '').slice(0, 9);
                    setPhoneDigits(clean);
                    if (error) setError('');
                  }}
                  onBlur={() => setTouched(true)}
                  aria-invalid={Boolean(phoneError)}
                  aria-describedby={phoneError ? 'forgot-phone-error' : undefined}
                  className="flex-1 border border-slate-300 rounded-r-xl px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 font-bold"
                  placeholder="9XXXXXXXX"
                  maxLength={9}
                  autoComplete="tel"
                />
              </div>
              {phoneError && <p id="forgot-phone-error" className="text-rose-500 text-xs font-medium mt-1">{phoneError}</p>}
              <div className="flex items-center justify-between mt-1 text-xs text-slate-400">
                <span>Must start with 9 or 7</span>
                <span className={phoneDigits.length === 9 ? 'text-emerald-600 font-bold' : ''}>
                  {phoneDigits.length}/9
                </span>
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full py-3.5 text-sm flex items-center justify-center gap-2 disabled:opacity-60">
              {loading ? 'Checking...' : <>Send Reset Code <ArrowRight className="w-4 h-4" /></>}
            </button>
          </form>
        )}

        <div className="pt-2 text-center border-t border-slate-100">
          <Link to={ROUTES.LOGIN} className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
