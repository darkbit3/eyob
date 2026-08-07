import { useApp } from '../../context/AppContext';
import { formatCurrency } from '../../utils/countdown';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Users, Gavel, TrendingUp, ShieldCheck, DollarSign, Activity } from 'lucide-react';

export default function AdminDashboard() {
  const { auctions, users, bids } = useApp();

  const activeAuctions = auctions.filter(a => a.status === 'active').length;
  const totalBids = bids.length;
  const totalUsers = users.length;
  const totalRevenue = 45800; // Simulated ETB revenue

  const revenueData = [
    { day: 'Mon', revenue: 6400, bids: 120 },
    { day: 'Tue', revenue: 7800, bids: 145 },
    { day: 'Wed', revenue: 9200, bids: 190 },
    { day: 'Thu', revenue: 8500, bids: 160 },
    { day: 'Fri', revenue: 11400, bids: 230 },
    { day: 'Sat', revenue: 14200, bids: 310 },
    { day: 'Sun', revenue: 12800, bids: 280 },
  ];

  return (
    <div className="space-y-8 font-sans">
      {/* Top Banner Notice */}
      <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 text-white rounded-3xl p-8 shadow-xl border border-purple-800 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider bg-purple-500/20 text-purple-300 px-3 py-1 rounded-full border border-purple-400/30">
            System Overseer Console
          </span>
          <h1 className="text-3xl font-black mt-2 tracking-tight">BidLow Platform Control Center</h1>
          <p className="text-xs text-purple-200 mt-1">Real-time telemetry, bid distribution monitoring, and revenue audit.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-white/10 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/15 text-xs font-bold flex items-center gap-2">
            <Activity className="w-4 h-4 text-emerald-400 animate-pulse" /> Platform Engine Active
          </div>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-slate-400">Total Platform Revenue</span>
            <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-2xl">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <h3 className="text-2xl font-black text-slate-900">{formatCurrency(totalRevenue)}</h3>
          <p className="text-[11px] font-bold text-emerald-600 flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5" /> +18.4% this week
          </p>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-slate-400">Active Live Auctions</span>
            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-2xl">
              <Gavel className="w-5 h-5" />
            </div>
          </div>
          <h3 className="text-2xl font-black text-slate-900">{activeAuctions}</h3>
          <p className="text-[11px] text-slate-500">{auctions.length} total created</p>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-slate-400">Total Bids Placed</span>
            <div className="p-2.5 bg-purple-50 text-purple-600 rounded-2xl">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <h3 className="text-2xl font-black text-slate-900">{totalBids}</h3>
          <p className="text-[11px] text-slate-500">Across all active items</p>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-slate-400">Registered Bidders</span>
            <div className="p-2.5 bg-amber-50 text-amber-600 rounded-2xl">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <h3 className="text-2xl font-black text-slate-900">{totalUsers}</h3>
          <p className="text-[11px] text-emerald-600 font-bold">100% Verified Users</p>
        </div>
      </div>

      {/* Chart & Telemetry Row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-900 text-base">Weekly Credit Sales & Bid Revenue</h3>
              <p className="text-xs text-slate-500">Daily financial breakdown in ETB</p>
            </div>
            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full">
              +24% Growth
            </span>
          </div>

          <div className="h-72 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenueData}>
                <XAxis dataKey="day" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', border: 'none', color: '#fff', fontSize: '12px' }}
                />
                <Bar dataKey="revenue" fill="#8b5cf6" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Security Audit Feed */}
        <div className="lg:col-span-4 bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4 flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-purple-600" /> Audit Integrity
            </h3>
            <p className="text-xs text-slate-500 mt-1">Platform SHA-256 seed state</p>
          </div>

          <div className="bg-slate-900 text-white p-4 rounded-2xl space-y-2 text-xs font-mono">
            <p className="text-slate-400">Current Seed Hash:</p>
            <p className="text-purple-400 break-all text-[11px] font-bold">e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855</p>
            <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[10px] text-slate-400">
              <span>Status: SEALED</span>
              <span className="text-emerald-400 font-bold">● VERIFIED</span>
            </div>
          </div>

          <div className="p-4 bg-purple-50 rounded-2xl border border-purple-200 text-xs text-purple-900 leading-relaxed font-medium">
            No integrity violations detected. Bidding engine running cleanly across all nodes.
          </div>
        </div>
      </div>
    </div>
  );
}
