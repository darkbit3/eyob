import { useApp } from '../../context/AppContext';
import AuctionCard from '../../components/AuctionCard';
import { Link } from 'react-router-dom';
import { Gavel, Wallet, ShieldCheck, Sparkles, Trophy, ArrowRight, Zap, TrendingDown } from 'lucide-react';

export default function Dashboard() {
  const { currentUser, auctions, bids } = useApp();

  const activeAuctions = auctions.filter(a => a.status === 'active');
  const userBidsCount = bids.filter(b => b.bidderId === currentUser?.id).length;

  return (
    <div className="space-y-6 font-sans">

      {/* ── HERO BANNER ─────────────────────────────────────────────────── */}
      <div className="relative rounded-2xl sm:rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950 to-blue-900 text-white overflow-hidden shadow-xl border border-slate-800">
        {/* Decorative blobs */}
        <div className="absolute -right-12 -bottom-12 w-64 h-64 bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute right-1/3 -top-8 w-40 h-40 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 p-6 sm:p-10 space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-xs font-bold text-amber-300">
            <Sparkles className="w-3.5 h-3.5" />
            Ethiopia's Lowest Unique Bid Marketplace
          </div>

          <h1 className="text-2xl sm:text-4xl font-black tracking-tight leading-tight">
            Win Premium Goods at{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-sky-300 to-indigo-300">
              Fractional Prices
            </span>
          </h1>

          <p className="text-slate-300 text-sm leading-relaxed max-w-lg">
            Place strategic lowest unique bids on tech, appliances & more. Every bid is cryptographically audited.
          </p>

          <div className="flex flex-col xs:flex-row gap-3 pt-1">
            <Link to="/auctions" className="btn-primary flex items-center justify-center gap-2 text-sm py-3">
              <Zap className="w-4 h-4 fill-white" /> Explore Live Auctions
            </Link>
            <Link to="/wallet" className="btn-secondary flex items-center justify-center gap-2 text-sm py-3">
              <Wallet className="w-4 h-4 text-blue-600" /> Buy Credits
            </Link>
          </div>
        </div>
      </div>

      {/* ── STATS ROW ───────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { icon: <Wallet className="w-5 h-5" />, color: 'blue', label: 'Credits', value: `${currentUser?.credits ?? 0}` },
          { icon: <Gavel className="w-5 h-5" />, color: 'emerald', label: 'My Bids', value: `${userBidsCount}` },
          { icon: <Trophy className="w-5 h-5" />, color: 'amber', label: 'Auctions Won', value: `${currentUser?.wonAuctions?.length ?? 0}` },
          { icon: <ShieldCheck className="w-5 h-5" />, color: 'purple', label: 'Verified', value: 'SHA-256' },
        ].map(({ icon, color, label, value }) => (
          <div key={label} className="bg-white rounded-2xl border border-slate-200/80 p-4 flex flex-col gap-2 shadow-sm">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center bg-${color}-50 text-${color}-600`}>
              {icon}
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{label}</p>
              <p className="text-lg font-black text-slate-900 leading-tight">{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── QUICK ACTIONS ───────────────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-3 sm:hidden">
        {[
          { to: '/auctions', icon: <TrendingDown className="w-5 h-5 text-blue-600" />, label: 'Browse', bg: 'bg-blue-50' },
          { to: '/wallet', icon: <Wallet className="w-5 h-5 text-emerald-600" />, label: 'Wallet', bg: 'bg-emerald-50' },
          { to: '/winner-verification', icon: <ShieldCheck className="w-5 h-5 text-purple-600" />, label: 'Audit', bg: 'bg-purple-50' },
        ].map(({ to, icon, label, bg }) => (
          <Link key={to} to={to}
            className={`${bg} rounded-2xl p-4 flex flex-col items-center gap-2 border border-slate-200/60 active:scale-95 transition-transform`}>
            {icon}
            <span className="text-xs font-bold text-slate-700">{label}</span>
          </Link>
        ))}
      </div>

      {/* ── LIVE AUCTIONS ───────────────────────────────────────────────── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">Live Auctions</h2>
            <p className="text-slate-500 text-xs font-medium mt-0.5">Place your unique bid before the timer expires</p>
          </div>
          <Link to="/auctions" className="flex items-center gap-1 text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-full border border-blue-100 hover:bg-blue-100 transition-colors">
            All ({auctions.length}) <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Mobile: horizontal scroll, Desktop: grid */}
        <div className="sm:hidden -mx-4 px-4">
          <div className="flex gap-4 overflow-x-auto pb-2 snap-x snap-mandatory" style={{ scrollbarWidth: 'none' }}>
            {activeAuctions.map(auction => (
              <div key={auction.id} className="snap-start shrink-0 w-72">
                <AuctionCard auction={auction} />
              </div>
            ))}
            {activeAuctions.length === 0 && (
              <div className="w-full text-center py-8 text-slate-400 text-sm">No active auctions right now.</div>
            )}
          </div>
        </div>

        {/* Desktop grid */}
        <div className="hidden sm:grid grid-cols-2 lg:grid-cols-3 gap-5">
          {activeAuctions.map(auction => (
            <AuctionCard key={auction.id} auction={auction} />
          ))}
        </div>
      </div>
    </div>
  );
}
