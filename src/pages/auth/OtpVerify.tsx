import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, ArrowRight } from 'lucide-react';

export default function OtpVerify() {
  const nav = useNavigate();
  const [otp, setOtp] = useState(['', '', '', '', '', '']);

  function handleChange(idx: number, val: string) {
    if (val.length > 1) return;
    const updated = [...otp];
    updated[idx] = val;
    setOtp(updated);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    nav('/dashboard');
  }

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 font-sans">
      <div className="max-w-md w-full bg-white rounded-3xl p-8 sm:p-10 shadow-2xl border border-slate-800 text-center space-y-6">
        <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
          <ShieldCheck className="w-8 h-8" />
        </div>

        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Phone Verification</h2>
          <p className="text-xs text-slate-500 font-medium mt-1">We sent a 6-digit OTP code to your phone number</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex justify-center gap-2">
            {otp.map((digit, i) => (
              <input
                key={i}
                type="text"
                maxLength={1}
                value={digit}
                onChange={e => handleChange(i, e.target.value)}
                className="w-11 h-13 text-center text-xl font-bold bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            ))}
          </div>

          <button type="submit" className="btn-primary w-full py-3.5 text-sm">
            Verify & Continue <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <p className="text-xs text-slate-400">
          Didn't receive code? <button className="font-bold text-blue-600 hover:underline">Resend OTP</button>
        </p>
      </div>
    </div>
  );
}
