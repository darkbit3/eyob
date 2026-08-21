import { useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ShieldCheck, ArrowRight, ArrowLeft, Loader2, AlertCircle } from 'lucide-react';
import { ROUTES } from '../../utils/routes';

export default function OtpVerify() {
  const nav = useNavigate();
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);

  function handleChange(idx: number, val: string) {
    const clean = val.replace(/\D/g, '').slice(-1);
    const updated = [...otp];
    updated[idx] = clean;
    setOtp(updated);
    setError('');

    // Auto-focus next input
    if (clean && idx < 5) {
      inputsRef.current[idx + 1]?.focus();
    }
  }

  function handleKeyDown(idx: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Backspace' && !otp[idx] && idx > 0) {
      inputsRef.current[idx - 1]?.focus();
    }
  }

  function handlePaste(e: React.ClipboardEvent<HTMLInputElement>) {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pasted) return;
    const updated = [...otp];
    for (let i = 0; i < 6; i++) {
      updated[i] = pasted[i] || '';
    }
    setOtp(updated);
    const nextFocusIdx = Math.min(pasted.length, 5);
    inputsRef.current[nextFocusIdx]?.focus();
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const code = otp.join('');
    if (code.length < 6) {
      setError('Please enter the complete 6-digit verification code.');
      return;
    }

    setLoading(true);
    setError('');

    setTimeout(() => {
      setLoading(false);
      nav(ROUTES.RESET_PASSWORD);
    }, 800);
  }

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 font-sans">
      <div className="max-w-md w-full bg-white rounded-3xl p-8 sm:p-10 shadow-2xl border border-slate-800 text-center space-y-6">
        <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
          <ShieldCheck className="w-8 h-8" />
        </div>

        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Enter Code</h2>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Enter the 6-digit verification code sent to your phone
          </p>
        </div>

        {error && (
          <div className="p-3 bg-rose-50 text-rose-700 rounded-xl text-xs font-bold border border-rose-200 flex items-center gap-2 text-left">
            <AlertCircle className="w-4 h-4 shrink-0" /> {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex justify-center gap-2">
            {otp.map((digit, i) => (
              <input
                key={i}
                ref={el => (inputsRef.current[i] = el)}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={e => handleChange(i, e.target.value)}
                onKeyDown={e => handleKeyDown(i, e)}
                onPaste={i === 0 ? handlePaste : undefined}
                className="w-11 h-14 text-center text-xl font-black bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition-all"
                autoComplete="one-time-code"
              />
            ))}
          </div>

          <button
            type="submit"
            disabled={loading || otp.join('').length < 6}
            className="btn-primary w-full py-3.5 text-sm flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {loading ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Verifying…</>
            ) : (
              <>Verify &amp; Continue <ArrowRight className="w-4 h-4" /></>
            )}
          </button>
        </form>

        <div className="pt-2 text-center border-t border-slate-100 flex items-center justify-between text-xs">
          <Link to={ROUTES.FORGOT_PASSWORD} className="inline-flex items-center gap-1 font-bold text-slate-500 hover:text-slate-800">
            <ArrowLeft className="w-3.5 h-3.5" /> Back
          </Link>
          <Link to={ROUTES.LOGIN} className="font-bold text-blue-600 hover:underline">
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
