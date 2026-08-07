import { useApp } from '../../context/AppContext';
import { formatCurrency, formatDate } from '../../utils/countdown';
import { creditPackages } from '../../data/mockData';
import { Wallet as WalletIcon, TrendingUp, Star, CheckCircle, ArrowUpRight, ArrowDownLeft, Trophy, RefreshCw } from 'lucide-react';

export default function Wallet() {
  const { currentUser, transactions, buyCredits } = useApp();
  const myTxs = transactions.filter(t => t.userId === currentUser?.id);

  function handleBuy(credits: number, price: number) {
    buyCredits(credits, price);
  }

  const txMeta = (type: string) => {
    if (type === 'credit_purchase') return { icon: <ArrowDownLeft className="w-4 h-4 text-blue-500" />, color: 'text-blue-600', bg: 'bg-blue-50', label: 'Credit Purchase' };
    if (type === 'bid_placed') return { icon: <ArrowUpRight className="w-4 h-4 text-rose-500" />, color: 'text-rose-600', bg: 'bg-rose-50', label: 'Bid Placed' };
    if (type === 'winning_reward') return { icon: <Trophy className="w-4 h-4 text-amber-500" />, color: 'text-emerald-600', bg: 'bg-amber-50', label: 'Prize Won' };
    return { icon: <RefreshCw className="w-4 h-4 text-slate-500" />, color: 'text-slate-600', bg: 'bg-slate-50', label: 'Refund' };
  };

  return (
    <div className="space-y-5 font-sans">

      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Wallet & Credits</h1>
        <p className="text-slate-500 text-xs font-medium mt-1">Manage your balance and purchase bid credits</p>
      </div>

      {/* ── BALANCE CARDS ───────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3">
        {/* ETB Balance */}
        <div className="relative bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl p-5 text-white overflow-hidden">
          <div className="absolute -right-4 -top-4 w-20 h-20 bg-white/10 rounded-full blur-xl" />
          <div className="flex items-center gap-2 mb-3">
            <WalletIcon className="w-4 h-4 text-blue-200" />
            <span className="text-blue-200 text-xs font-semibold">Balance</span>
          </div>
          <p className="text-2xl sm:text-3xl font-black leading-tight">{(currentUser?.walletBalance ?? 0).toLocaleString()}</p>
          <p className="text-blue-300 text-[10px] font-bold mt-0.5 uppercase">ETB</p>
        </div>

        {/* Credits */}
        <div className="relative bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-5 text-white overflow-hidden">
          <div className="absolute -right-4 -top-4 w-20 h-20 bg-white/10 rounded-full blur-xl" />
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="w-4 h-4 text-emerald-200" />
            <span className="text-emerald-200 text-xs font-semibold">Credits</span>
          </div>
          <p className="text-2xl sm:text-3xl font-black leading-tight">{currentUser?.credits ?? 0}</p>
          <p className="text-emerald-300 text-[10px] font-bold mt-0.5 uppercase">1 Credit = 1 Bid</p>
        </div>
      </div>

      {/* ── BUY CREDITS ─────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Star className="w-5 h-5 text-amber-500 fill-amber-400" />
          <h2 className="font-black text-slate-900">Buy Credits</h2>
        </div>
        <p className="text-xs text-slate-500">Each credit lets you place one bid. Choose your package:</p>

        {/* Credit Packages — 2 col on mobile, 4 on desktop */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {creditPackages.map(pkg => (
            <div key={pkg.id}
              className={`relative rounded-2xl p-4 text-center border-2 transition-all active:scale-95 cursor-pointer ${
                pkg.popular
                  ? 'border-blue-500 bg-gradient-to-b from-blue-50 to-indigo-50 shadow-md shadow-blue-100'
                  : 'border-slate-200 hover:border-blue-300 bg-white'
              }`}
              onClick={() => handleBuy(pkg.credits, pkg.price)}
            >
              {pkg.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-[10px] font-black px-3 py-0.5 rounded-full whitespace-nowrap shadow">
                  ⭐ Best Value
                </div>
              )}
              <div className={`text-2xl font-black mt-1 ${pkg.popular ? 'text-blue-700' : 'text-slate-900'}`}>{pkg.credits}</div>
              <div className="text-xs text-slate-500 font-semibold">credits</div>
              <div className={`text-lg font-black my-2 ${pkg.popular ? 'text-blue-600' : 'text-slate-700'}`}>
                {formatCurrency(pkg.price)}
              </div>
              <div className="text-[10px] text-slate-400 mb-3">{(pkg.price / pkg.credits).toFixed(1)} ETB/credit</div>
              <button
                className={`w-full py-2 rounded-xl text-xs font-black transition-colors ${
                  pkg.popular
                    ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                Buy {pkg.label}
              </button>
            </div>
          ))}
        </div>

        <div className="flex items-start gap-2 bg-emerald-50 border border-emerald-100 text-emerald-700 text-xs px-4 py-3 rounded-xl">
          <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>Demo mode — purchasing credits updates your balance instantly. No real payments.</span>
        </div>
      </div>

      {/* ── TRANSACTION HISTORY ─────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
        <h2 className="font-black text-slate-900">Transaction History</h2>

        {myTxs.length === 0 ? (
          <div className="text-center py-10 text-slate-400 space-y-2">
            <div className="text-4xl">📋</div>
            <p className="font-semibold text-sm">No transactions yet</p>
          </div>
        ) : (
          <div className="space-y-2">
            {myTxs.map(t => {
              const meta = txMeta(t.type);
              const isDebit = t.type === 'bid_placed';
              return (
                <div key={t.id} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors">
                  {/* Icon */}
                  <div className={`${meta.bg} w-9 h-9 rounded-xl flex items-center justify-center shrink-0`}>
                    {meta.icon}
                  </div>
                  {/* Text */}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-black text-slate-900 truncate">{meta.label}</p>
                    <p className="text-[10px] text-slate-500 truncate">{t.description}</p>
                  </div>
                  {/* Amount + Date */}
                  <div className="text-right shrink-0">
                    <p className={`text-sm font-black ${isDebit ? 'text-rose-600' : 'text-emerald-600'}`}>
                      {isDebit ? '-' : '+'}{Math.abs(t.amount).toLocaleString()} ETB
                    </p>
                    <p className="text-[10px] text-slate-400">{formatDate(t.timestamp)}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
