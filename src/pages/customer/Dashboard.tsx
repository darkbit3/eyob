import { useApp } from '../../context/AppContext';
import AuctionCard from '../../components/AuctionCard';
import { Link } from 'react-router-dom';
import { Gavel, Wallet, ShieldCheck, Sparkles, Trophy, ArrowRight, Zap } from 'lucide-react';

export default function Dashboard() {
  const { currentUser, auctions, bids } = useApp();

  const activeAuctions = auctions.filter(a => a.status === 'active');
  const userBidsCount = bids.filter(b => b.bidderId === currentUser?.id).length;

  return (
    <div className="space-y-8 font-sans">
      {/* Hero Showcase Banner */}
      <div className="relative rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-900 text-white p-8 md:p-12 overflow-hidden shadow-xl border border-slate-800">
        <div className="absolute -right-12 -bottom-12 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute right-1/3 -top-12 w-64 h-64 bg-purple-600/20 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-xs font-bold text-amber-300">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Ethiopia's Lowest Unique Bid Marketplace</span>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight leading-tight">
            Win Premium Tech & Goods at <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-sky-300 to-indigo-300">Fractional Prices</span>
          </h1>

          <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
            Place strategic, lowest unique bids on laptops, smartphones, motorbikes, and appliances. Every bid is backed by an auditable provably fair algorithm.
          </p>

          <div className="pt-4 flex flex-wrap items-center gap-4">
            <Link to="/auctions" className="btn-primary">
              <Zap className="w-4 h-4 fill-white" /> Explore Live Auctions
            </Link>
            <Link to="/wallet" className="btn-secondary">
              <Wallet className="w-4 h-4 text-blue-600" /> Buy Bid Credits
            </Link>
          </div>
        </div>
      </div>

      {/* Quick Metrics Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <Wallet className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Available Credits</p>
            <h4 className="text-xl font-black text-slate-900">{currentUser?.credits ?? 0} <span className="text-xs font-semibold text-slate-500">Credits</span></h4>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-4">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <Gavel className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Active Bids Placed</p>
            <h4 className="text-xl font-black text-slate-900">{userBidsCount} <span className="text-xs font-semibold text-slate-500">Bids</span></h4>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-4">
          <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
            <Trophy className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Auctions Won</p>
            <h4 className="text-xl font-black text-slate-900">{currentUser?.wonAuctions?.length ?? 0} <span className="text-xs font-semibold text-slate-500">Won</span></h4>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-4">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Provably Fair</p>
            <h4 className="text-sm font-black text-slate-900">SHA-256 Validated</h4>
          </div>
        </div>
      </div>

      {/* Featured Live Auctions */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Active Live Auctions</h2>
            <p className="text-slate-500 text-xs font-medium">Place your unique bids before the timer expires</p>
          </div>
          <Link to="/auctions" className="text-sm font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1">
            View All ({auctions.length}) <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {activeAuctions.map(auction => (
            <AuctionCard key={auction.id} auction={auction} />
          ))}
        </div>
      </div>
    </div>
  );
}
