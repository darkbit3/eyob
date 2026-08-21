import { useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Lock, ArrowRight, Eye, EyeOff, CheckCircle2, XCircle, AlertCircle, ShieldCheck } from 'lucide-react';
import { ROUTES } from '../../utils/routes';

const RULES = [
  { id: 'len',    label: 'At least 8 characters',        test: (p: string) => p.length >= 8 },
  { id: 'upper',  label: 'One uppercase letter (A–Z)',    test: (p: string) => /[A-Z]/.test(p) },
  { id: 'lower',  label: 'One lowercase letter (a–z)',    test: (p: string) => /[a-z]/.test(p) },
  { id: 'number', label: 'One number (0–9)',              test: (p: string) => /\d/.test(p) },
  { id: 'symbol', label: 'One special character (!@#$…)', test: (p: string) => /[^A-Za-z0-9]/.test(p) },
];

export default function ResetPassword() {
  const nav = useNavigate();
  const [pass, setPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(false);

  const ruleResults = useMemo(() => RULES.map(r => ({ ...r, passed: r.test(pass) })), [pass]);
  const passedCount = ruleResults.filter(r => r.passed).length;
  const isStrong = passedCount === 5;
  const passwordsMatch = pass.length > 0 && pass === confirmPass;
  const passError = touched.pass && !isStrong ? 'Password must meet all requirements.' : '';
  const confirmError = touched.confirmPass && !passwordsMatch ? 'Passwords do not match.' : '';

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setTouched({ pass: true, confirmPass: true });

    if (!isStrong) {
      setError('Password does not meet all security requirements.');
      return;
    }

    if (!passwordsMatch) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    setSuccess(true);
    setTimeout(() => {
      nav(ROUTES.LOGIN, { replace: true });
    }, 2000);
  }

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 font-sans">
      <div className="max-w-md w-full bg-white rounded-3xl p-8 sm:p-10 shadow-2xl border border-slate-800 space-y-6">
        <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
          <Lock className="w-7 h-7" />
        </div>

        <div className="text-center">
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Set New Password</h2>
          <p className="text-xs text-slate-500 font-medium mt-1">Choose a secure password for your account</p>
        </div>

        {error && (
          <div className="p-3 bg-rose-50 text-rose-700 rounded-xl text-xs font-bold border border-rose-200 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" /> {error}
          </div>
        )}

        {success ? (
          <div className="bg-emerald-50 border border-emerald-200 p-5 rounded-2xl text-center space-y-3">
            <div className="w-10 h-10 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-black text-emerald-900">Password Updated Successfully!</h3>
            <p className="text-xs text-emerald-800">Redirecting to sign in…</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                New Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type={showPass ? 'text' : 'password'}
                  required
                  value={pass}
                  onChange={e => {
                    setPass(e.target.value);
                    if (error) setError('');
                  }}
                  onBlur={() => setTouched(prev => ({ ...prev, pass: true }))}
                  className="input-field pl-10 pr-10"
                  placeholder="Create a strong password"
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(v => !v)}
                  className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                  tabIndex={-1}
                >
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {pass.length > 0 && (
                <div className="mt-2 space-y-1">
                  <div className="grid grid-cols-1 gap-0.5">
                    {ruleResults.map(r => (
                      <div key={r.id} className={`flex items-center gap-1.5 text-xs font-medium ${r.passed ? 'text-emerald-600' : 'text-slate-400'}`}>
                        {r.passed
                          ? <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                          : <XCircle className="w-3.5 h-3.5 shrink-0" />}
                        {r.label}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {passError && <p className="text-rose-500 text-xs font-medium mt-1">{passError}</p>}
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Confirm New Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type={showConfirm ? 'text' : 'password'}
                  required
                  value={confirmPass}
                  onChange={e => {
                    setConfirmPass(e.target.value);
                    if (error) setError('');
                  }}
                  onBlur={() => setTouched(prev => ({ ...prev, confirmPass: true }))}
                  className="input-field pl-10 pr-10"
                  placeholder="Repeat your password"
                  autoComplete="new-password"
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
              {confirmError && <p className="text-rose-500 text-xs font-medium mt-1">{confirmError}</p>}
            </div>

            <button
              type="submit"
              disabled={loading || !isStrong || !passwordsMatch}
              className="btn-primary w-full py-3.5 text-sm flex items-center justify-center gap-2 disabled:opacity-60"
            >
              Update Password &amp; Sign In <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}

        <div className="pt-2 text-center border-t border-slate-100">
          <Link to={ROUTES.LOGIN} className="text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors">
            Back to Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
