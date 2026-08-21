import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Auction } from '../types';
import CountdownTimer from './CountdownTimer';
import { formatCurrency, getAuctionDisplayStatus } from '../utils/countdown';
import { ROUTES } from '../utils/routes';
import { useLanguage } from '../context/LanguageContext';
import { useApp } from '../context/AppContext';
import { Users, TrendingDown, ArrowRight, Lock, Unlock, CreditCard, CheckCircle, XCircle } from 'lucide-react';

export default function AuctionCard({
  auction,
  onClick,
}: {
  auction: Auction;
  onClick?: () => void;
}) {
  const nav = useNavigate();
  const { t } = useLanguage();
  const { isAuctionUnlocked, unlockAuction, currentUser } = useApp();

  const [showUnlockModal, setShowUnlockModal] = useState(false);
  const [unlockState, setUnlockState] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [unlockMsg, setUnlockMsg] = useState('');

  const displayStatus = getAuctionDisplayStatus(auction.status, auction.startTime, auction.endTime);
  const isActive = displayStatus === 'active';
  const isUpcoming = displayStatus === 'upcoming';
  const isClosed = displayStatus === 'closed';

  const isUnlocked = isAuctionUnlocked(auction.id);
  const bidCost = auction.bidPerCost || 100;
  const userBalance = currentUser?.walletBalance ?? 0;
  const canAfford = userBalance >= bidCost;

  // Lock only applies to active and upcoming auctions for non-admin users
  const needsUnlock = !isUnlocked && (isActive || isUpcoming) && currentUser?.role !== 'admin' && currentUser?.role !== 'super_admin';

  function handleCardClick(e: React.MouseEvent) {
    if (needsUnlock) {
      e.stopPropagation();
      setShowUnlockModal(true);
    } else {
      if (onClick) onClick();
      else nav(`${ROUTES.AUCTION_DETAIL}/${auction.id}`);
    }
  }

  async function handleConfirmUnlock() {
    setUnlockMsg('');
    setUnlockState('loading');
    try {
      const res = await unlockAuction(auction.id);
      if (res.success) {
        setUnlockState('success');
        setUnlockMsg(res.message || 'Auction unlocked successfully!');
        setTimeout(() => {
          setShowUnlockModal(false);
          setUnlockState('idle');
          setUnlockMsg('');
          if (onClick) onClick();
          else nav(`${ROUTES.AUCTION_DETAIL}/${auction.id}`);
        }, 1400);
      } else {
        setUnlockState('error');
        setUnlockMsg(res.message || 'Unlock failed. Please try again.');
      }
    } catch (err: any) {
      setUnlockState('error');
      setUnlockMsg(err?.message || 'Failed to unlock auction.');
    }
  }

  return (
    <>
      <div
        onClick={handleCardClick}
        className={`group bg-white rounded-3xl border transition-all duration-300 cursor-pointer overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1 relative ${
          needsUnlock
            ? 'border-amber-200/90 ring-1 ring-amber-100'
            : 'border-slate-200/80'
        }`}
      >
        {/* Image Container */}
        <div className="relative overflow-hidden h-44 sm:h-48 bg-slate-100">
          <img
            src={auction.image}
            alt={auction.title}
            className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ${
              needsUnlock ? 'brightness-90 blur-[0.5px]' : ''
            }`}
            onError={e => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=600&q=80'; }}
          />
          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent" />

          {/* Top-Left: Lock/Status Badge */}
          <div className="absolute top-3 left-3 flex items-center gap-1.5">
            {needsUnlock ? (
              <span className="px-2.5 py-1 rounded-full bg-slate-950/85 backdrop-blur-md text-amber-400 text-[10px] font-black tracking-wider uppercase flex items-center gap-1 border border-amber-500/40 shadow-lg">
                <Lock className="w-3 h-3 text-amber-400" /> Locked
              </span>
            ) : (isActive || isUpcoming) && isUnlocked ? (
              <span className="px-2.5 py-1 rounded-full bg-emerald-500/90 text-white text-[10px] font-extrabold flex items-center gap-1 shadow-md">
                <Unlock className="w-3 h-3 text-emerald-100" /> Unlocked ✓
              </span>
            ) : null}

            {isActive && <span className="badge-active text-[10px] shadow-sm">● Live</span>}
            {isUpcoming && <span className="badge-upcoming text-[10px] shadow-sm">◷ Soon</span>}
            {isClosed && <span className="badge-closed text-[10px] shadow-sm">✓ Ended</span>}
          </div>

          {/* Category Chip Top-Right */}
          <div className="absolute top-3 right-3">
            <span className="bg-white/90 backdrop-blur-md text-slate-800 text-[10px] font-black px-2.5 py-1 rounded-full shadow-sm uppercase tracking-wider">
              {auction.category}
            </span>
          </div>

          {/* Bottom Countdown / Winner */}
          <div className="absolute bottom-3 right-3">
            {isClosed && auction.lowestUniqueBid ? (
              <span className="bg-emerald-500 text-white text-[10px] font-black px-2.5 py-1 rounded-full shadow-md">
                🏆 {t('winner')}: {auction.lowestUniqueBid.toFixed(1)} ETB
              </span>
            ) : (isActive || isUpcoming) ? (
              <div className="bg-slate-900/80 backdrop-blur-sm text-white text-[11px] font-bold px-2.5 py-1 rounded-full">
                <CountdownTimer endTime={auction.endTime} status={auction.status} startTime={auction.startTime} />
              </div>
            ) : null}
          </div>
        </div>

        {/* Card Body */}
        <div className="p-4 space-y-3">
          <div className="flex items-center justify-between gap-3">
            <h3 className="font-black text-slate-900 text-sm leading-tight line-clamp-2 group-hover:text-emerald-600 transition-colors">
              {auction.title}
            </h3>
            {auction.productName && (
              <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-500 shrink-0">
                {auction.productName}
              </span>
            )}
          </div>

          {/* Price details */}
          <div className="flex items-center bg-slate-50 p-2.5 rounded-2xl border border-slate-100">
            <div>
              <p className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider">{t('bid_cost')}</p>
              <p className="text-sm font-black text-slate-900">{formatCurrency(bidCost)}</p>
            </div>
          </div>

          {/* Dynamic Button */}
          <div className="pt-1">
            {needsUnlock ? (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowUnlockModal(true);
                }}
                className="w-full rounded-2xl bg-amber-600 hover:bg-amber-500 text-white py-2.5 px-3 text-xs font-black transition-all flex items-center justify-center gap-2 shadow-lg shadow-amber-900/20 active:scale-95 border border-amber-400/40"
              >
                <Lock className="w-4 h-4 text-amber-200" />
                <span>First Pay {formatCurrency(bidCost)} Bid Cost to Unlock</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleCardClick}
                className="w-full rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 px-3 text-xs font-black transition-all flex items-center justify-center gap-2 shadow-md shadow-emerald-900/20"
              >
                <span>{isClosed ? t('view_details') : `${t('view_details')} & Place Bid`}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Stats footer */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[11px] text-slate-500 font-semibold">
            <span className="flex items-center gap-1"><Users className="w-3 h-3 text-purple-500" />{auction.totalParticipants}</span>
            <span className="flex items-center gap-1"><TrendingDown className="w-3 h-3 text-emerald-600" />{auction.totalBids} {t('total_bids')}</span>
          </div>
        </div>
      </div>

      {/* ── UNLOCK CONFIRMATION MODAL ────────────────────────────────────── */}
      {showUnlockModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div onClick={() => setShowUnlockModal(false)} className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm transition-opacity" />

          <div className="relative bg-white rounded-3xl border border-slate-200 shadow-2xl p-6 sm:p-8 w-full max-w-md z-50 text-left font-sans animate-in fade-in zoom-in-95">
            <button
              type="button"
              onClick={() => setShowUnlockModal(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm"
            >
              ✕
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center shadow-inner">
                <Lock className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-black text-slate-900 text-lg leading-tight">
                  Unlock Auction Access
                </h3>
                <p className="text-xs text-slate-500">
                  Pay entry bid cost to participate in this auction.
                </p>
              </div>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3 mb-4 text-xs">
              <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                <span className="text-slate-500 font-medium">Auction:</span>
                <span className="font-bold text-slate-900 truncate max-w-[200px]">{auction.title}</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                <span className="text-slate-500 font-medium">Bid Cost Fee:</span>
                <span className="font-black text-amber-600 text-sm">{formatCurrency(bidCost)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">Your Wallet Balance:</span>
                <span className={`font-extrabold ${canAfford ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {formatCurrency(userBalance)}
                </span>
              </div>
            </div>

            {!canAfford && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-semibold mb-4">
                ⚠️ Insufficient wallet balance. You need {formatCurrency(bidCost - userBalance)} more to unlock.
              </div>
            )}

            {/* Status feedback */}
            {unlockState !== 'idle' && (
              <div className={`flex flex-col items-center gap-2 p-4 rounded-2xl border mb-4 text-center transition-all ${
                unlockState === 'loading' ? 'bg-amber-50 border-amber-200' :
                unlockState === 'success' ? 'bg-emerald-50 border-emerald-200' :
                'bg-rose-50 border-rose-200'
              }`}>
                {unlockState === 'loading' && (
                  <>
                    <div className="w-10 h-10 rounded-full border-4 border-amber-200 border-t-amber-500 animate-spin" />
                    <p className="text-xs font-bold text-amber-700">Processing payment…</p>
                  </>
                )}
                {unlockState === 'success' && (
                  <>
                    <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-900/20">
                      <CheckCircle className="w-5 h-5 text-white" />
                    </div>
                    <p className="text-xs font-bold text-emerald-700">{unlockMsg}</p>
                  </>
                )}
                {unlockState === 'error' && (
                  <>
                    <div className="w-10 h-10 rounded-full bg-rose-500 flex items-center justify-center shadow-lg shadow-rose-900/20">
                      <XCircle className="w-5 h-5 text-white" />
                    </div>
                    <p className="text-xs font-bold text-rose-700">{unlockMsg}</p>
                  </>
                )}
              </div>
            )}

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowUnlockModal(false)}
                className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors"
              >
                Cancel
              </button>

              {canAfford ? (
                <button
                  type="button"
                  disabled={unlockState === 'loading' || unlockState === 'success'}
                  onClick={handleConfirmUnlock}
                  className="flex-1 py-3 bg-amber-600 hover:bg-amber-500 text-white font-black text-xs rounded-xl shadow-lg shadow-amber-900/20 transition-all flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  {unlockState === 'loading' ? (
                    <><div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" /><span>Processing…</span></>
                  ) : unlockState === 'success' ? (
                    <><CheckCircle className="w-4 h-4" /><span>Unlocked!</span></>
                  ) : (
                    <span>Pay {formatCurrency(bidCost)} &amp; Unlock</span>
                  )}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setShowUnlockModal(false);
                    nav(ROUTES.WALLET);
                  }}
                  className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-xl shadow-lg shadow-emerald-900/20 transition-all flex items-center justify-center gap-2"
                >
                  <CreditCard className="w-4 h-4" /> Top-Up Wallet
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
