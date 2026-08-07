import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { Gavel, User as UserIcon, Phone, Lock, ArrowRight, Sparkles, ShieldCheck } from 'lucide-react';
import { User } from '../../data/mockData';

export default function Register() {
  const { setUsers, setCurrentUser } = useApp();
  const nav = useNavigate();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    const newUser: User = {
      id: `u${Date.now()}`,
      name,
      phone,
      role: 'customer',
      walletBalance: 0,
      credits: 10,
      status: 'active',
      joinedAt: new Date().toISOString().split('T')[0],
      wonAuctions: [],
    };
    setUsers(prev => [...prev, newUser]);
    setCurrentUser(newUser);
    nav('/otp-verify');
  }

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 font-sans">
      <div className="max-w-4xl w-full bg-white rounded-3xl overflow-hidden shadow-2xl grid grid-cols-1 md:grid-cols-12 border border-slate-800">
        
        {/* Left Hero Showcase */}
        <div className="md:col-span-5 bg-gradient-to-br from-blue-700 via-indigo-800 to-purple-900 p-8 text-white flex flex-col justify-between relative overflow-hidden">
          <div className="absolute right-0 bottom-0 w-64 h-64 bg-white/10 rounded-full blur-2xl"></div>
          
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center">
              <Gavel className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-xl tracking-tight">BidLow</span>
          </div>

          <div className="space-y-4 my-8 relative z-10">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-[11px] font-bold text-amber-300">
              <Sparkles className="w-3.5 h-3.5" /> 10 Free Starter Credits
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight leading-tight">
              Create Your Account
            </h2>
            <p className="text-xs text-blue-100 leading-relaxed">
              Sign up with your Phone Number and Full Name to start bidding on live unique auctions.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs text-blue-200 font-bold border-t border-white/10 pt-4">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Fast Phone OTP Verification</span>
          </div>
        </div>

        {/* Right Form Console */}
        <div className="md:col-span-7 p-8 sm:p-12 flex flex-col justify-center space-y-6">
          <div>
            <h3 className="text-2xl font-bold text-slate-900 tracking-tight">Register Account</h3>
            <p className="text-xs text-slate-500 font-medium mt-1">Enter your details using phone number & password</p>
          </div>

          {error && (
            <div className="p-3 bg-rose-50 text-rose-700 rounded-xl text-xs font-bold border border-rose-200">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Full Name
              </label>
              <div className="relative">
                <UserIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="input-field pl-10"
                  placeholder="e.g. Abebe Girma"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Phone Number
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  className="input-field pl-10"
                  placeholder="+251 91 234 5678"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="input-field pl-10"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  className="input-field pl-10"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button type="submit" className="btn-primary w-full py-3.5 text-sm">
              Create Account <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="pt-4 border-t border-slate-100 text-center text-xs text-slate-500 font-medium">
            Already have an account?{' '}
            <Link to="/login" className="font-bold text-blue-600 hover:underline">
              Sign In
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}
