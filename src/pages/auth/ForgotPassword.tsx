import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { KeyRound, Phone, ArrowRight, ArrowLeft } from 'lucide-react';
import { ROUTES } from '../../utils/routes';

export default function ForgotPassword() {
  const nav = useNavigate();
  const [phoneDigits, setPhoneDigits] = useState('');
  const [sent, setSent] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSent(true);
  }

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 font-sans">
      <div className="max-w-md w-full bg-white rounded-3xl p-8 sm:p-10 shadow-2xl border border-slate-800 space-y-6">
        <div className="w-14 h-14 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center mx-auto">
          <KeyRound className="w-7 h-7" />
        </div>

        <div className="text-center">
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Reset Password</h2>
          <p className="text-xs text-slate-500 font-medium mt-1">Enter your registered phone number to receive OTP instructions</p>
        </div>

        {sent ? (
          <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-2xl text-center space-y-3">
            <p className="text-xs font-bold text-emerald-800">Password recovery OTP sent to your phone!</p>
            <button onClick={() => nav(ROUTES.RESET_PASSWORD)} className="btn-primary w-full py-2.5 text-xs">
              Proceed to Set New Password <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Phone Number
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
                  onChange={e => setPhoneDigits(e.target.value.replace(/\D/g, '').slice(0, 9))}
                  className="flex-1 border border-slate-300 rounded-r-xl px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                  placeholder="9XXXXXXXX"
                  maxLength={9}
                />
              </div>
            </div>

            <button type="submit" className="btn-primary w-full py-3.5 text-sm">
              Send Reset Instructions <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}

        <div className="pt-2 text-center">
          <Link to={ROUTES.LOGIN} className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-900">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
