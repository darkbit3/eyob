import { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { formatDate, formatCurrency } from '../../utils/countdown';
import {
  Bell, Check, Trophy, Gavel, Wallet, ShieldAlert,
  Sparkles, X, Package
} from 'lucide-react';

// ── Winner Detail Modal ───────────────────────────────────────────────────────
function WinnerModal({ notification, onClose }: { notification: any; onClose: () => void }) {
  const meta = notification.metadata ?? {};
  const [ordering, setOrdering] = useState(false);
  const [ordered, setOrdered] = useState(false);

  function handleOrder() {
    setOrdering(true);
    // Simulate order placement — replace with real API call when order system is ready
    setTimeout(() => {
      setOrdering(false);
      setOrdered(true);
    }, 1200);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-md overflow-hidden">

        {/* Header — animated winner banner */}
        <div className="relative bg-gradient-to-br from-amber-400 via-yellow-300 to-emerald-400 p-6 text-center overflow-hidden">
          <div className="absolute inset-0 opacity-20">
            {['🎉','⭐','🏆','✨','🎊'].map((e, i) => (
              <span key={i} className="absolute text-2xl animate-bounce" style={{ left: `${i * 22}%`, top: `${(i % 3) * 25}%`, animationDelay: `${i * 0.2}s` }}>{e}</span>
            ))}
          </div>
          <button onClick={onClose} className="absolute top-3 right-3 w-8 h-8 bg-white/30 hover:bg-white/50 rounded-full flex items-center justify-center text-slate-800 transition-colors">
            <X className="w-4 h-4" />
          </button>
          <div className="relative z-10">
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-3 shadow-xl">
              <Trophy className="w-9 h-9 text-amber-500" />
            </div>
            <h2 className="text-2xl font-black text-slate-900">You Won! 🎉</h2>
            <p className="text-slate-800 text-sm font-semibold mt-1">Congratulations on your winning bid</p>
          </div>
        </div>

        {/* Auction Details */}
        <div className="p-6 space-y-4">
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-3">
            <div className="flex items-start gap-2">
              <Gavel className="w-4 h-4 text-purple-600 mt-0.5 shrink-0" />
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Auction</p>
                <p className="font-black text-slate-900 text-sm">{meta.auction_title ?? notification.title}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white rounded-xl p-3 border border-slate-200 text-center">
                <p className="text-[10px] font-bold text-slate-400 uppercase">Winning Bid</p>
                <p className="text-lg font-black text-emerald-600 mt-0.5">{meta.bid_amount ?? '—'} ETB</p>
              </div>
              <div className="bg-white rounded-xl p-3 border border-slate-200 text-center">
                <p className="text-[10px] font-bold text-slate-400 uppercase">Retail Value</p>
                <p className="text-lg font-black text-slate-800 mt-0.5">
                  {meta.retail_value ? formatCurrency(Number(meta.retail_value)) : '—'}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 text-xs text-blue-800 font-medium flex items-start gap-2">
            <Package className="w-4 h-4 shrink-0 mt-0.5 text-blue-600" />
            <span>The product will be delivered to your registered address. Click "Order Product" to confirm and provide your delivery details.</span>
          </div>

          {ordered ? (
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-center space-y-1">
              <Check className="w-8 h-8 text-emerald-600 mx-auto" />
              <p className="font-black text-emerald-800">Order Submitted!</p>
              <p className="text-xs text-emerald-600">Admin will contact you shortly to arrange delivery.</p>
            </div>
          ) : (
            <button
              onClick={handleOrder}
              disabled={ordering}
              className="w-full py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-sm rounded-2xl shadow-lg shadow-emerald-600/20 transition-all flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {ordering ? (
                <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Processing…</>
              ) : (
                <><Package className="w-4 h-4" /> Order Product</>
              )}
            </button>
          )}

          <button onClick={onClose} className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-xs rounded-2xl transition-colors">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Notification icon by type ─────────────────────────────────────────────────
function NotifIcon({ type }: { type: string }) {
  const cls = "w-4 h-4";
  switch (type) {
    case 'winner_announced': return <Trophy className={`${cls} text-amber-500`} />;
    case 'wallet_updated':   return <Wallet className={`${cls} text-emerald-500`} />;
    case 'auction_started':
    case 'auction_ending':   return <Gavel className={`${cls} text-blue-500`} />;
    case 'payment_received': return <Wallet className={`${cls} text-purple-500`} />;
    default:                 return <ShieldAlert className={`${cls} text-slate-500`} />;
  }
}

// ── Main Notifications Page ───────────────────────────────────────────────────
export default function Notifications() {
  const { notifications, markNotificationRead } = useApp();
  const [winnerNotif, setWinnerNotif] = useState<any | null>(null);

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="space-y-6 font-sans pb-10">

      {/* Winner modal */}
      {winnerNotif && (
        <WinnerModal notification={winnerNotif} onClose={() => setWinnerNotif(null)} />
      )}

      {/* Header */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-black text-slate-900 flex items-center gap-3">
              <Bell className="w-6 h-6 text-emerald-600" /> Notifications
            </h1>
            <p className="text-slate-500 text-sm mt-1">System alerts, auction updates, and bid notifications.</p>
          </div>
          {unreadCount > 0 && (
            <span className="bg-rose-100 text-rose-700 text-xs font-bold px-2.5 py-1 rounded-full">
              {unreadCount} Unread
            </span>
          )}
        </div>
      </div>

      {/* Notifications list */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        {notifications.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <Bell className="w-10 h-10 mx-auto mb-3 opacity-30" />
            No notifications yet.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {notifications.map(n => {
              const isWinner = n.type === 'winner_announced';

              return (
                <div
                  key={n.id}
                  className={`p-5 flex flex-col sm:flex-row sm:items-start gap-4 transition-colors ${
                    !n.read
                      ? isWinner
                        ? 'bg-amber-50/60 border-l-4 border-l-amber-400'
                        : 'bg-emerald-50/40 border-l-4 border-l-emerald-400'
                      : 'bg-white'
                  }`}
                >
                  {/* Icon */}
                  <div className={`shrink-0 w-10 h-10 rounded-xl flex items-center justify-center ${
                    isWinner ? 'bg-amber-100' : 'bg-emerald-100'
                  }`}>
                    <NotifIcon type={n.type} />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                      <h2 className={`text-sm font-bold ${!n.read ? 'text-slate-900' : 'text-slate-600'}`}>
                        {isWinner && <Sparkles className="w-3.5 h-3.5 text-amber-500 inline mr-1" />}
                        {n.title}
                      </h2>
                      <span className="text-[11px] text-slate-400 font-mono shrink-0">{formatDate(n.timestamp)}</span>
                    </div>
                    <p className={`mt-1 text-sm leading-relaxed ${
                      n.read ? 'text-slate-400' : 'text-slate-800 font-medium'
                    }`}>{n.message}</p>

                    {/* Winner action buttons */}
                    {isWinner && (
                      <button
                        onClick={() => {
                          if (!n.read) markNotificationRead(n.id);
                          setWinnerNotif(n);
                        }}
                        className="mt-3 inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-900 font-black text-xs rounded-xl shadow-md shadow-amber-500/20 transition-all"
                      >
                        <Trophy className="w-3.5 h-3.5" /> View My Win & Order
                      </button>
                    )}

                    {/* Read status + mark read */}
                    <div className="mt-3 flex items-center gap-2">
                      <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${
                        n.read ? 'bg-slate-100 text-slate-500' : 'bg-emerald-100 text-emerald-700'
                      }`}>
                        {n.read ? 'Read' : 'Unread'}
                      </span>
                      {!n.read && (
                        <button
                          onClick={() => markNotificationRead(n.id)}
                          className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-white px-3 py-1 text-[11px] font-semibold text-emerald-700 hover:bg-emerald-50 transition-colors"
                        >
                          <Check className="w-3.5 h-3.5" /> Mark read
                        </button>
                      )}
                    </div>
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
