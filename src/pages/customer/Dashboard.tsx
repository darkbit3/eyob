import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { useLanguage } from '../../context/LanguageContext';
import { ROUTES } from '../../utils/routes';
import CountdownTimer from '../../components/CountdownTimer';
import { formatDate } from '../../utils/countdown';
import { walletApi, advertisementsApi } from '../../utils/api';
import { ApiTransaction, AdvertisementItem } from '../../types';
import {
  Wallet, Trophy, Bell, ArrowRight, ArrowUpRight,
  Gavel, History, TrendingDown, Users, Loader2,
} from 'lucide-react';

export default function Dashboard() {
  const {
    currentUser,
    auctions,
    bids,
    notifications,
    markNotificationRead,
  } = useApp();
  const { t } = useLanguage();

  // ── Live transactions from API ─────────────────────────────────────────
  const [myTx, setMyTx] = useState<{ id: string; description: string; amount: number; type: string; timestamp: string }[]>([]);
  const [txLoading, setTxLoading] = useState(false);
  const [ads, setAds] = useState<AdvertisementItem[]>([]);
  const [adsLoading, setAdsLoading] = useState(true);
  const adsRailRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!currentUser) return;
    setTxLoading(true);
    walletApi.myTransactions()
      .then(res => {
        setMyTx((res.data || []).slice(0, 5).map((tx: ApiTransaction) => ({
          id:          tx.id,
          description: tx.description ?? '',
          amount:      Number(tx.amount ?? 0),
          type:        tx.type ?? '',
          timestamp:   tx.created_at ?? new Date().toISOString(),
        })));
      })
      .catch(() => {})
      .finally(() => setTxLoading(false));
  }, [currentUser?.id]);

  useEffect(() => {
    advertisementsApi.active()
      .then(res => setAds(res.data || []))
      .catch(() => setAds([]))
      .finally(() => setAdsLoading(false));
  }, []);

  useEffect(() => {
    if (ads.length < 2) return;
    const rail = adsRailRef.current;
    if (!rail) return;

    const timer = window.setInterval(() => {
      const firstCard = rail.firstElementChild as HTMLElement | null;
      if (!firstCard) return;
      const nextPosition = rail.scrollLeft + firstCard.offsetWidth + 16;
      const atEnd = nextPosition >= rail.scrollWidth - rail.clientWidth - 4;
      rail.scrollTo({ left: atEnd ? 0 : nextPosition, behavior: 'smooth' });
    }, 5000);

    return () => window.clearInterval(timer);
  }, [ads.length]);

  const activeAuctions   = auctions.filter(a => a.status === 'active');
  const upcomingAuctions = auctions.filter(a => a.status === 'upcoming');
  const closedAuctions   = auctions.filter(a => a.status === 'closed').slice(0, 5);
  const myBids           = bids.filter(b => b.bidderId === currentUser?.id);
  const unread           = notifications.filter(n => !n.read).length;

  return (
    <div className="space-y-6 font-sans pb-10">

      {/* ── Welcome Banner ──────────────────────────────────────────────────── */}
      <div className="relative rounded-2xl sm:rounded-3xl bg-gradient-to-br from-slate-900 via-emerald-950 to-slate-900 text-white p-6 sm:p-8 overflow-hidden shadow-xl border border-emerald-800/40 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-emerald-600 flex items-center justify-center text-white font-black text-2xl border-2 border-emerald-400 shadow-md">
              {currentUser?.name?.charAt(0) ?? 'U'}
            </div>
            <span className="absolute bottom-0 right-0 w-4 h-4 bg-emerald-500 rounded-full border-2 border-slate-900" />
          </div>
          <div>
            <h1 className="text-xl sm:text-3xl font-black tracking-tight">
              {t('hero_title')}
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm mt-1">
              {t('hero_desc')}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link to={ROUTES.NOTIFICATIONS} className="relative bg-slate-800/80 border border-slate-700 rounded-xl p-3 flex items-center gap-2 hover:bg-slate-700/80 transition-colors">
            <Bell className="w-5 h-5 text-emerald-400" />
            <span className="text-xs font-bold text-slate-200">{unread} {t('alerts')}</span>
            {unread > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-rose-500 text-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center">
                {unread}
              </span>
            )}
          </Link>
        </div>
      </div>

      {/* ── Advertisements ─────────────────────────────────────────────────── */}
      {(adsLoading || ads.length > 0) && (
        <section className="space-y-3" aria-label="Advertisements">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] uppercase tracking-[0.18em] font-black text-emerald-600">From BidLow</p>
              <h2 className="text-lg font-black text-slate-900">Featured for you</h2>
            </div>
            {ads.length > 1 && <span className="text-[10px] font-bold text-slate-400">Swipe to explore</span>}
          </div>
          {adsLoading ? (
            <div className="h-44 rounded-2xl bg-slate-100 animate-pulse" />
          ) : (
            <div ref={adsRailRef} className="flex gap-4 overflow-x-auto snap-x snap-mandatory pb-2 scrollbar-thin scroll-smooth">
              {ads.map(ad => {
                const content = <div className="relative h-44 sm:h-52 min-w-[86vw] sm:min-w-[520px] lg:min-w-[600px] overflow-hidden rounded-2xl bg-slate-100 shadow-sm snap-start">
                  <img src={ad.image_url} alt={ad.title || 'Advertisement'} className="w-full h-full object-cover" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                </div>;
                return ad.target_url ? <a key={ad.id} href={ad.target_url} target="_blank" rel="noreferrer" className="block focus:outline-none focus:ring-2 focus:ring-emerald-500 rounded-2xl">{content}</a> : <div key={ad.id}>{content}</div>;
              })}
            </div>
          )}
        </section>
      )}

      {/* ── Wallet + Recent Transactions ────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <span className="text-xs font-black text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Wallet className="w-4 h-4 text-emerald-600" /> {t('wallet')}
            </span>
            <span className="text-xs bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">Active</span>
          </div>
          <div className="space-y-2">
            <p className="text-3xl sm:text-4xl font-black text-slate-900">
              {(currentUser?.walletBalance ?? 0).toLocaleString()}
              <span className="text-lg font-bold text-slate-500 ml-1">ETB</span>
            </p>
          </div>
          <Link to={ROUTES.WALLET} className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-600/20 text-center transition-colors block">
            {t('wallet')}
          </Link>
        </div>

        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
              <History className="w-4 h-4 text-emerald-600" /> {t('transaction_history')}
            </h3>
            <Link to={ROUTES.WALLET} className="text-xs font-bold text-emerald-700 hover:underline flex items-center gap-1">
              {t('view_details')} <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="divide-y divide-slate-100 text-xs">
            {txLoading ? (
              <div className="py-6 flex items-center justify-center gap-2 text-slate-400">
                <Loader2 className="w-4 h-4 animate-spin" /> Loading transactions…
              </div>
            ) : myTx.length > 0 ? myTx.map(tx => (
              <div key={tx.id} className="py-2.5 flex items-center justify-between">
                <div>
                  <p className="font-bold text-slate-900">{tx.description}</p>
                  <span className="text-[10px] text-slate-400">{formatDate(tx.timestamp)}</span>
                </div>
                <span className={`font-mono font-bold text-sm ${tx.amount >= 0 ? 'text-emerald-600' : 'text-slate-500'}`}>
                  {tx.amount >= 0 ? `+${tx.amount}` : tx.amount} ETB
                </span>
              </div>
            )) : (
              <div className="py-6 text-center text-slate-400">{t('no_transactions')}</div>
            )}
          </div>
        </div>
      </div>

      {/* ── Active Auctions ─────────────────────────────────────────────────── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
          <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500" />
            </span>
            {t('active_auctions')} ({activeAuctions.length})
          </h2>
          <Link to={ROUTES.AUCTIONS} className="text-xs font-bold text-emerald-700 hover:underline flex items-center gap-1">
            View All <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {activeAuctions.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {activeAuctions.map(a => (
              <div key={a.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden hover:border-emerald-300 hover:shadow-md transition-all">
                <div className="relative h-40 bg-slate-100">
                  <img src={a.image} alt={a.title} className="w-full h-full object-cover"
                    onError={e => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=600&q=80'; }} />
                  <div className="absolute top-2 right-2 bg-slate-900/80 backdrop-blur-md text-white text-[11px] font-bold px-2.5 py-1 rounded-full">
                    <CountdownTimer endTime={a.endTime} status={a.status} />
                  </div>
                </div>
                <div className="p-4 space-y-3">
                  <h3 className="font-bold text-slate-900 text-sm truncate">{a.title}</h3>
                  <div className="flex items-center justify-between text-xs bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    <div>
                      <span className="text-slate-400 block text-[10px]">Allowed Bid Range</span>
                      <span className="font-bold text-emerald-600">{a.minBid} – {a.maxBid} ETB</span>
                    </div>
                    <div className="text-right">
                      <span className="text-slate-400 block text-[10px]">Active Bids</span>
                      <span className="font-bold text-slate-800">{a.totalBids} placed</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-500">
                    <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5 text-slate-400" /> {a.totalParticipants} Participants</span>
                    <span className="flex items-center gap-1 font-semibold text-emerald-600"><TrendingDown className="w-3.5 h-3.5" /> Live Database</span>
                  </div>
                  <Link to={`${ROUTES.AUCTION_DETAIL}/${a.id}`}
                    className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl text-center transition-colors block">
                    Place Bid Now
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 bg-white border border-slate-200 rounded-2xl text-center text-slate-400 text-sm">
            No active auctions right now.
          </div>
        )}
      </div>

      {/* ── Upcoming Auctions ──────────────────────────────────────────────── */}
      {upcomingAuctions.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-black text-slate-900 border-b border-slate-200 pb-2">
            Upcoming Auctions ({upcomingAuctions.length})
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {upcomingAuctions.map(a => (
              <div key={a.id} className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex items-center gap-3">
                <img src={a.image} alt={a.title} className="w-14 h-14 object-cover rounded-xl shrink-0"
                  onError={e => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=200&q=80'; }} />
                <div>
                  <h4 className="font-bold text-slate-900 text-sm truncate">{a.title}</h4>
                  <p className="text-xs text-slate-500 font-mono mt-0.5">Starts: {formatDate(a.startTime)}</p>
                  <span className="text-[10px] bg-blue-100 text-blue-700 font-bold px-2 py-0.5 rounded mt-1 inline-block">Upcoming</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Recently Closed ────────────────────────────────────────────────── */}
      {closedAuctions.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-black text-slate-900 border-b border-slate-200 pb-2">
            Recently Closed
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {closedAuctions.map(a => (
              <div key={a.id} className="bg-white border border-slate-200 rounded-2xl p-4 space-y-2">
                <div className="flex items-center gap-3">
                  <img src={a.image} alt={a.title} className="w-12 h-12 object-cover rounded-xl shrink-0"
                    onError={e => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=200&q=80'; }} />
                  <div className="min-w-0 flex-1">
                    <h4 className="font-bold text-slate-900 text-sm truncate">{a.title}</h4>
                  </div>
                </div>
                <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-100">
                  <span className="font-mono text-emerald-700 font-bold">
                    {a.lowestUniqueBid ? `Won: ${a.lowestUniqueBid} ETB` : 'Closed'}
                  </span>
                  <Link to={`${ROUTES.FAIRNESS_AUDIT}?auction=${encodeURIComponent(a.id)}`} className="text-xs text-emerald-700 font-bold hover:underline flex items-center gap-1">
                    Verify <ArrowUpRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── My Bid History ─────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
            <Gavel className="w-5 h-5 text-emerald-600" /> My Bids ({myBids.length})
          </h2>
          <Link to={ROUTES.MY_BIDS} className="text-xs font-bold text-emerald-700 hover:underline flex items-center gap-1">
            View All <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
        {myBids.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase border-b border-slate-200">
                <tr>
                  <th className="p-3">Auction</th>
                  <th className="p-3">Bid Amount</th>
                  <th className="p-3">Placed At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {myBids.slice(0, 5).map(b => {
                  const auction = auctions.find(a => a.id === b.auctionId);
                  return (
                    <tr key={b.id} className="hover:bg-slate-50">
                      <td className="p-3 font-bold text-slate-900">{auction?.title ?? b.auctionId}</td>
                      <td className="p-3 font-mono font-bold text-emerald-600">{b.amount} ETB</td>
                      <td className="p-3 text-slate-400 font-mono text-[11px]">{formatDate(b.timestamp)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-6 text-center text-slate-400 text-sm">
            No bids placed yet.{' '}
            <Link to={ROUTES.AUCTIONS} className="text-emerald-600 font-bold hover:underline">Browse auctions</Link>
          </div>
        )}
      </div>

      {/* ── Notifications ──────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
            <Bell className="w-5 h-5 text-emerald-600" /> Notifications
          </h2>
          <Link to={ROUTES.NOTIFICATIONS} className="text-xs font-bold text-emerald-700 hover:underline flex items-center gap-1">
            View All <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
        {notifications.length > 0 ? (
          <div className="divide-y divide-slate-100 text-xs">
            {notifications.slice(0, 5).map(n => (
              <div key={n.id} className={`py-3 flex items-start justify-between gap-4 ${n.read ? 'opacity-60' : ''}`}>
                <div>
                  <h4 className="text-slate-900 font-bold">{n.title}</h4>
                  <p className="text-slate-600 mt-0.5">{n.message}</p>
                  <span className="text-[10px] text-slate-400 block mt-1">{formatDate(n.timestamp)}</span>
                </div>
                {!n.read && (
                  <button onClick={() => markNotificationRead(n.id)}
                    className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg shrink-0 text-[10px] font-bold border border-emerald-200">
                    Mark read
                  </button>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="py-6 text-center text-slate-400 text-sm">No notifications.</div>
        )}
      </div>

      {/* ── My Won Auctions ────────────────────────────────────────────────── */}
      {currentUser?.wonAuctions && currentUser.wonAuctions.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-500" /> Won Auctions ({currentUser.wonAuctions.length})
          </h2>
          <div className="divide-y divide-slate-100 text-xs">
            {currentUser.wonAuctions.map((auctionId: string) => {
              const a = auctions.find(x => x.id === auctionId);
              if (!a) return null;
              return (
                <div key={auctionId} className="py-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <img src={a.image} alt={a.title} className="w-10 h-10 object-cover rounded-lg shrink-0" />
                    <span className="font-bold text-slate-900">{a.title}</span>
                  </div>
                  <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2.5 py-1 rounded-full">Won</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

    </div>
  );
}
