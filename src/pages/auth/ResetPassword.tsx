import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, ArrowRight } from 'lucide-react';
import { ROUTES } from '../../utils/routes';

export default function ResetPassword() {
  const nav = useNavigate();
  const [pass, setPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    nav(ROUTES.LOGIN, { replace: true });
  }

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 font-sans">
      <div className="max-w-md w-full bg-white rounded-3xl p-8 sm:p-10 shadow-2xl border border-slate-800 space-y-6">
        <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto">
          <Lock className="w-7 h-7" />
        </div>

        <div className="text-center">
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Set New Password</h2>
          <p className="text-xs text-slate-500 font-medium mt-1">Choose a strong password for your account</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              New Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="password"
                required
                value={pass}
                onChange={e => setPass(e.target.value)}
                className="input-field pl-10"
                placeholder="••••••••"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Confirm New Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="password"
                required
                value={confirmPass}
                onChange={e => setConfirmPass(e.target.value)}
                className="input-field pl-10"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button type="submit" className="btn-primary w-full py-3.5 text-sm">
            Update Password & Sign In <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
