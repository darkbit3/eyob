import { useApp } from '../../context/AppContext';
import AuctionCard from '../../components/AuctionCard';
import { Link } from 'react-router-dom';
import { Gavel, Wallet, ShieldCheck, Sparkles, Trophy, ArrowRight, Zap, TrendingDown } from 'lucide-react';

export default function Dashboard() {
  const { currentUser, auctions, bids } = useApp();

  const activeAuctions = auctions.filter(a => a.status === 'active');
  const userBidsCount = bids.filter(b => b.bidderId === currentUser?.id).length;

  return (
    <div className="space-y-6 font-sans w-full">

      {/* ── HERO BANNER (Bold Green & White) ─────────────────────────────────── */}
      <div className="relative rounded-2xl sm:rounded-3xl bg-gradient-to-br from-slate-900 via-emerald-950 to-slate-900 text-white overflow-hidden shadow-xl border border-emerald-800/40">
        {/* Decorative green blobs */}
        <div className="absolute -right-12 -bottom-12 w-80 h-80 bg-emerald-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute right-1/3 -top-8 w-56 h-56 bg-teal-500/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 p-6 sm:p-10 md:p-12 space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-500/20 backdrop-blur-md border border-emerald-400/30 text-xs font-black text-emerald-300">
            <Sparkles className="w-3.5 h-3.5" />
            Ethiopia's Lowest Unique Bid Marketplace
          </div>

          <h1 className="text-2xl sm:text-4xl md:text-5xl font-black tracking-tight leading-tight">
            Win Premium Goods at{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-amber-300">
              Fractional Prices
            </span>
          </h1>

          <p className="text-slate-300 text-sm sm:text-base leading-relaxed max-w-2xl">
            Place strategic lowest unique bids on laptops, smartphones, motorbikes, and appliances. Every bid is backed by an auditable provably fair algorithm.
          </p>

          <div className="flex flex-col xs:flex-row gap-3 pt-2">
            <Link to="/auctions" className="btn-primary flex items-center justify-center gap-2 text-sm py-3 px-6 shadow-lg shadow-emerald-600/30">
              <Zap className="w-4 h-4 fill-white" /> Explore Live Auctions
            </Link>
            <Link to="/wallet" className="btn-secondary flex items-center justify-center gap-2 text-sm py-3 px-6">
              <Wallet className="w-4 h-4 text-emerald-600" /> Buy Credits
            </Link>
          </div>
        </div>
      </div>

      {/* ── STATS ROW ───────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        {[
          { icon: <Wallet className="w-5 h-5 text-emerald-600" />, label: 'Credits', value: `${currentUser?.credits ?? 0}`, bg: 'bg-emerald-50' },
          { icon: <Gavel className="w-5 h-5 text-emerald-600" />, label: 'My Bids', value: `${userBidsCount}`, bg: 'bg-emerald-50' },
          { icon: <Trophy className="w-5 h-5 text-amber-500" />, label: 'Auctions Won', value: `${currentUser?.wonAuctions?.length ?? 0}`, bg: 'bg-amber-50' },
          { icon: <ShieldCheck className="w-5 h-5 text-emerald-600" />, label: 'Verified', value: 'SHA-256', bg: 'bg-emerald-50' },
        ].map(({ icon, label, value, bg }) => (
          <div key={label} className="bg-white rounded-2xl border border-slate-200 p-4 flex items-center gap-3.5 shadow-sm">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${bg} shrink-0`}>
              {icon}
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{label}</p>
              <p className="text-lg sm:text-xl font-black text-slate-900 leading-tight">{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── QUICK ACTIONS (Mobile) ────────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-3 sm:hidden">
        {[
          { to: '/auctions', icon: <TrendingDown className="w-5 h-5 text-emerald-600" />, label: 'Browse', bg: 'bg-emerald-50' },
          { to: '/wallet', icon: <Wallet className="w-5 h-5 text-emerald-600" />, label: 'Wallet', bg: 'bg-emerald-50' },
          { to: '/winner-verification', icon: <ShieldCheck className="w-5 h-5 text-emerald-600" />, label: 'Audit', bg: 'bg-emerald-50' },
        ].map(({ to, icon, label, bg }) => (
          <Link key={to} to={to}
            className={`${bg} rounded-2xl p-3.5 flex flex-col items-center gap-1.5 border border-emerald-100 active:scale-95 transition-transform`}>
            {icon}
            <span className="text-xs font-black text-slate-800">{label}</span>
          </Link>
        ))}
      </div>

      {/* ── LIVE AUCTIONS (Full Width Grid) ─────────────────────────────── */}
      <div className="space-y-4 pt-2">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">Active Live Auctions</h2>
            <p className="text-slate-500 text-xs font-medium mt-0.5">Place your unique bid before the timer expires</p>
          </div>
          <Link to="/auctions" className="flex items-center gap-1 text-xs font-black text-emerald-700 bg-emerald-50 px-3.5 py-1.5 rounded-full border border-emerald-200 hover:bg-emerald-100 transition-colors">
            View All ({auctions.length}) <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Mobile horizontal scroll */}
        <div className="sm:hidden -mx-4 px-4">
          <div className="flex gap-4 overflow-x-auto pb-2 snap-x snap-mandatory" style={{ scrollbarWidth: 'none' }}>
            {activeAuctions.map(auction => (
              <div key={auction.id} className="snap-start shrink-0 w-72">
                <AuctionCard auction={auction} />
              </div>
            ))}
          </div>
        </div>

        {/* Desktop full width grid */}
        <div className="hidden sm:grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {activeAuctions.map(auction => (
            <AuctionCard key={auction.id} auction={auction} />
          ))}
        </div>
      </div>
    </div>
  );
}
