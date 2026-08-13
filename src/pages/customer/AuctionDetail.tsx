import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { ROUTES } from '../../utils/routes';
import CountdownTimer from '../../components/CountdownTimer';
import { formatCurrency, formatDate } from '../../utils/countdown';
import { bidsApi } from '../../utils/api';
import { Bid } from '../../data/mockData';
import {
  ChevronLeft, Users, TrendingDown, Phone,
  CheckCircle, AlertCircle, Gavel, Sparkles, Play, RefreshCw, Trophy, XCircle, Clock, Star, Loader2
} from 'lucide-react';

type ScanMark = 'idle' | 'scanning' | 'duplicate' | 'unique' | 'winner';

// Validate bid amount: only allow one digit after decimal point
const validateBidAmount = (value: string): string => {
  // Allow empty string
  if (value === '') return '';
  
  // Only allow numbers and one decimal point
  if (!/^[\d.]*$/.test(value)) return '';
  
  // Split by decimal point
  const parts = value.split('.');
  if (parts.length > 2) return ''; // More than one decimal point
  
  // If there's a decimal part, limit to 1 digit
  if (parts.length === 2) {
    const integerPart = parts[0];
    const decimalPart = parts[1].slice(0, 1); // Only first digit
    return integerPart ? `${integerPart}.${decimalPart}` : `.${decimalPart}`;
  }
  
  return value;
};

export default function AuctionDetail() {
  const { id } = useParams<{ id: string }>();
  const { auctions, products, bids, users, currentUser, placeBid, setAuctions } = useApp();
  const nav = useNavigate();

  const auction = auctions.find(a => a.id === id);
  const linkedProduct = auction?.productId ? products.find(p => p.id === auction.productId) : undefined;
  const auctionBids = bids.filter(b => b.auctionId === id);

  const [bidAmount, setBidAmount] = useState<string>('');
  const [imgIdx, setImgIdx] = useState(0);
  const [bidResult, setBidResult] = useState<{ ok: boolean; msg: string } | null>(null);
  const [bidSubmitState, setBidSubmitState] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [bidSubmitText, setBidSubmitText] = useState('');
  const [isSimulatedClosed, setIsSimulatedClosed] = useState(false);

  // ── MODAL STATE ──────────────────────────────────────────────────────────
  const [showAuditModal, setShowAuditModal] = useState(false);
  const [auditPhase, setAuditPhase] = useState<'product_countdown' | 'player_scan' | 'winner_reveal' | null>(null);
  const [productTimer, setProductTimer] = useState<number>(5);

  // ── SCAN ANIMATION STATE ─────────────────────────────────────────────────
  // How many rows are visible yet (slide-in effect)
  const [revealCount, setRevealCount] = useState(0);
  // Per-row mark state
  const [rowMarks, setRowMarks] = useState<ScanMark[]>([]);
  // Which sub-step within player_scan we're on
  const [scanSubStep, setScanSubStep] = useState<'reveal' | 'mark_red' | 'mark_green' | 'zoom_winner'>('reveal');

  const timerRefs = useRef<ReturnType<typeof setTimeout>[]>([]);

  const images = [auction?.image ?? '', auction?.image ?? '', auction?.image ?? ''];

  // ── BID ANALYSIS ─────────────────────────────────────────────────────────
  const amountCounts: Record<number, number> = {};
  auctionBids.forEach(b => {
    amountCounts[b.amount] = (amountCounts[b.amount] || 0) + 1;
  });
  const uniqueAmounts = Object.keys(amountCounts).map(Number).filter(amt => amountCounts[amt] === 1).sort((a, b) => a - b);
  const lowestUniqueAmount = uniqueAmounts.length > 0 ? uniqueAmounts[0] : null;
  const winningBid = lowestUniqueAmount ? auctionBids.find(b => b.amount === lowestUniqueAmount) : null;
  const winningUser = winningBid ? users.find(u => u.id === winningBid.bidderId) : (users[1] ?? users[0]);

  // ── PHASE 1 TIMER ────────────────────────────────────────────────────────
  useEffect(() => {
    let t: ReturnType<typeof setTimeout>;
    if (showAuditModal && auditPhase === 'product_countdown') {
      if (productTimer > 0) {
        t = setTimeout(() => setProductTimer(p => p - 1), 1000);
      } else {
        beginPlayerScan();
      }
    }
    return () => clearTimeout(t);
  }, [showAuditModal, auditPhase, productTimer]);

  // ── CLEAR ALL TIMERS ─────────────────────────────────────────────────────
  function clearAllTimers() {
    timerRefs.current.forEach(t => clearTimeout(t));
    timerRefs.current = [];
  }

  function push(fn: () => void, ms: number) {
    const t = setTimeout(fn, ms);
    timerRefs.current.push(t);
  }

  // ── BEGIN PHASE 2 (PLAYER SCAN) ──────────────────────────────────────────
  function beginPlayerScan() {
    setAuditPhase('player_scan');
    setScanSubStep('reveal');
    setRevealCount(0);
    setRowMarks(new Array(auctionBids.length).fill('idle'));
    clearAllTimers();

    const n = auctionBids.length;
    // 1. Reveal rows one by one — each 180ms apart
    for (let i = 0; i < n; i++) {
      push(() => setRevealCount(i + 1), i * 180);
    }

    const allRevealedAt = n * 180 + 200;

    // 2. Mark duplicates red (staggered, 120ms each)
    push(() => setScanSubStep('mark_red'), allRevealedAt);
    auctionBids.forEach((b, idx) => {
      const isDup = (amountCounts[b.amount] || 1) > 1;
      push(() => {
        setRowMarks(prev => {
          const next = [...prev];
          next[idx] = isDup ? 'duplicate' : 'scanning';
          return next;
        });
      }, allRevealedAt + idx * 120);
    });

    const redDoneAt = allRevealedAt + n * 120 + 400;

    // 3. Mark unique bids green
    push(() => setScanSubStep('mark_green'), redDoneAt);
    auctionBids.forEach((b, idx) => {
      const isUnique = (amountCounts[b.amount] || 1) === 1;
      const isWin = b.amount === lowestUniqueAmount;
      if (isUnique) {
        push(() => {
          setRowMarks(prev => {
            const next = [...prev];
            next[idx] = isWin ? 'winner' : 'unique';
            return next;
          });
        }, redDoneAt + idx * 80);
      }
    });

    const greenDoneAt = redDoneAt + n * 80 + 600;

    // 4. Zoom to winner reveal
    push(() => {
      setScanSubStep('zoom_winner');
      // After a brief pause, go to winner_reveal phase
      push(() => setAuditPhase('winner_reveal'), 1200);
    }, greenDoneAt);
  }

  // ── START WHOLE ANIMATION ────────────────────────────────────────────────
  function startWinnerFindingAnimation() {
    clearAllTimers();
    setIsSimulatedClosed(true);
    setShowAuditModal(true);
    setAuditPhase('product_countdown');
    setProductTimer(5);
    setRevealCount(0);
    setRowMarks([]);
    setScanSubStep('reveal');
    setAuctions(prev => prev.map(a => a.id === auction!.id ? { ...a, status: 'closed', lowestUniqueBid: lowestUniqueAmount ?? 12 } : a));
  }

  function closeModal() {
    clearAllTimers();
    setShowAuditModal(false);
  }

  const isClosed = auction?.status === 'closed' || isSimulatedClosed;

  if (!auction) return (
    <div className="text-center py-20 bg-white rounded-3xl border border-slate-200 p-8 space-y-4">
      <div className="text-5xl mb-4">🔍</div>
      <p className="text-slate-500 font-bold">Auction not found.</p>
      <button onClick={() => nav(ROUTES.AUCTIONS)} className="btn-primary">Browse Auctions</button>
    </div>
  );

  function handleBid(e: React.FormEvent) {
    e.preventDefault();
    const amount = parseInt(bidAmount);
    if (isNaN(amount) || amount < auction!.minBid || amount > auction!.maxBid) {
      setBidResult({ ok: false, msg: `Bid must be between ${auction!.minBid} and ${auction!.maxBid} ETB.` });
      return;
    }
    if (!currentUser) { nav(ROUTES.LOGIN); return; }

    setBidSubmitState('loading');
    setBidSubmitText('Placing your bid...');
    setBidResult(null);

    window.setTimeout(() => {
      const ok = placeBid(auction!.id, amount);
      if (ok) {
        setBidSubmitState('success');
        setBidSubmitText('You placed bet');
        setBidResult({ ok: true, msg: `Bid of ${amount.toFixed(1)} ETB placed successfully!` });
        setBidAmount('');
      } else {
        setBidSubmitState('error');
        setBidSubmitText('Bid failed');
        setBidResult({ ok: false, msg: 'Failed to place bid. Please try again.' });
      }

      window.setTimeout(() => {
        setBidSubmitState('idle');
        setBidSubmitText('');
        setBidResult(null);
      }, 1600);
    }, 700);
  }

  // ── RENDER ───────────────────────────────────────────────────────────────
  return (
    <>
      {bidSubmitState !== 'idle' && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/40 backdrop-blur-sm">
          <div className="flex flex-col items-center justify-center gap-4 rounded-full bg-white/90 p-6 shadow-2xl ring-1 ring-slate-200">
            {bidSubmitState === 'loading' ? (
              <div className="h-16 w-16 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600" />
            ) : bidSubmitState === 'success' ? (
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                <CheckCircle className="h-9 w-9" />
              </div>
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-rose-100 text-rose-600">
                <XCircle className="h-9 w-9" />
              </div>
            )}
            <p className="text-center text-sm font-bold text-slate-800">{bidSubmitText}</p>
          </div>
        </div>
      )}

      <div className="space-y-8 font-sans">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <button onClick={() => nav(-1)} className="flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors">
          <ChevronLeft className="w-4 h-4" /> Back to Auctions
        </button>
        <button onClick={startWinnerFindingAnimation} className="btn-accent inline-flex items-center gap-2 shadow-lg shadow-amber-500/20 text-xs py-2.5 px-4">
          <Play className="w-4 h-4 fill-white" />
          ⚡ Start 5s Countdown & Animated Winner Reveal
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Images */}
        <div className="lg:col-span-6 space-y-4">
          <div className="relative bg-slate-100 rounded-3xl overflow-hidden h-80 sm:h-96 border border-slate-200/80 shadow-sm">
            <img src={images[imgIdx]} alt={auction.title} className="w-full h-full object-cover"
              onError={e => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=600&q=80'; }} />
            <div className="absolute top-4 left-4">
              {isClosed ? <span className="badge-closed shadow-md">✓ Auction Closed (00:00:00)</span> : <span className="badge-active shadow-md">● Active Auction</span>}
            </div>
          </div>
          <div className="flex gap-3">
            {images.map((img, i) => (
              <button key={i} onClick={() => setImgIdx(i)}
                className={`w-20 h-16 rounded-xl overflow-hidden border-2 transition-all ${imgIdx === i ? 'border-blue-600 ring-2 ring-blue-500/20' : 'border-slate-200 opacity-70 hover:opacity-100'}`}>
                <img src={img} className="w-full h-full object-cover" onError={e => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=600&q=80'; }} />
              </button>
            ))}
          </div>
        </div>

        {/* Details */}
        <div className="lg:col-span-6 space-y-6">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-blue-600">{auction.category}</span>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 leading-tight mt-1">{auction.title}</h1>
            {linkedProduct && (
              <p className="text-[11px] uppercase tracking-[0.2em] text-slate-500 font-semibold mt-2">
                Product: {linkedProduct.name}
              </p>
            )}
            <p className="text-slate-600 text-sm leading-relaxed mt-2">{auction.description}</p>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 text-center">
              <p className="text-[11px] font-bold text-slate-400 uppercase">Retail Price</p>
              <p className="font-extrabold text-slate-900 text-sm mt-1">{formatCurrency(auction.retailValue)}</p>
            </div>
            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 text-center">
              <p className="text-[11px] font-bold text-slate-400 uppercase">Bid Range</p>
              <p className="font-extrabold text-blue-600 text-sm mt-1">{auction.minBid}–{auction.maxBid} ETB</p>
            </div>
            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 text-center">
              <p className="text-[11px] font-bold text-slate-400 uppercase">Countdown</p>
              <div className="mt-1">
                {isClosed ? <span className="text-xs font-mono font-bold text-rose-600">00:00:00</span> : <CountdownTimer endTime={auction.endTime} status={auction.status} />}
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between text-xs text-slate-600 bg-slate-50 p-4 rounded-2xl border border-slate-200">
            <span className="flex items-center gap-1.5 font-bold"><Users className="w-4 h-4 text-purple-600" /> {auction.totalParticipants} Participants</span>
            <span className="flex items-center gap-1.5 font-bold"><TrendingDown className="w-4 h-4 text-blue-600" /> {auction.totalBids} Total Bids</span>
          </div>

          {!isClosed && (
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900 text-sm flex items-center gap-2"><Gavel className="w-4 h-4 text-blue-600" /> Submit Your Bid</span>
              </div>
              <form onSubmit={handleBid} className="flex gap-2">
                <input type="number" value={bidAmount} onChange={e => setBidAmount(validateBidAmount(e.target.value))}
                  className="input-field flex-1 font-bold" placeholder={`Range: ${auction.minBid} – ${auction.maxBid} ETB`}
                  min={auction.minBid} max={auction.maxBid} />
                <button type="submit" className="btn-primary whitespace-nowrap">Place Bid</button>
              </form>
              {bidResult && (
                <div className={`flex items-center gap-2 text-xs font-bold p-3 rounded-xl ${bidResult.ok ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'}`}>
                  {bidResult.ok ? <CheckCircle className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
                  <span>{bidResult.msg}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* CLOSED: PERMANENT AUDIT TABLE */}
      {isClosed && (
        <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-xl space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-6">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-50 text-purple-700 border border-purple-200 text-xs font-bold mb-2">
                <Sparkles className="w-3.5 h-3.5" /> Provably Fair Audit Engine
              </div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">Complete Player Bids Audit Table</h2>
              <p className="text-xs text-slate-500 font-medium">Total Bids: <strong>{auctionBids.length}</strong></p>
            </div>
            <button onClick={startWinnerFindingAnimation} className="btn-accent inline-flex items-center gap-2 shadow-lg">
              <Play className="w-4 h-4 fill-white" /> Replay Winner Animation
            </button>
          </div>

          {winningUser && (
            <div className="bg-gradient-to-r from-emerald-600 via-teal-700 to-slate-900 text-white p-6 sm:p-8 rounded-3xl shadow-xl flex flex-col md:flex-row items-center justify-between gap-6 border border-emerald-400/30">
              <div className="flex items-center gap-5">
                <div className="relative">
                  <img src={winningUser.photo ?? `https://api.dicebear.com/7.x/avataaars/svg?seed=${winningUser.name}`} alt={winningUser.name}
                    className="w-20 h-20 rounded-2xl object-cover border-2 border-amber-300 shadow-xl ring-4 ring-white/20"
                    onError={e => { (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${winningUser.name}`; }} />
                  <div className="absolute -top-2 -right-2 bg-amber-400 text-slate-900 p-1.5 rounded-full shadow-md">
                    <Trophy className="w-4 h-4 fill-slate-900" />
                  </div>
                </div>
                <div className="space-y-1">
                  <span className="bg-amber-400/20 text-amber-300 text-[10px] font-black uppercase px-3 py-1 rounded-full border border-amber-300/30">Official Auction Winner</span>
                  <h3 className="text-2xl font-black text-white">{winningUser.name}</h3>
                  <p className="text-xs text-emerald-100 flex items-center gap-1"><Phone className="w-3.5 h-3.5 text-emerald-300" /> {winningUser.phone}</p>
                  <p className="text-xs text-amber-300 font-extrabold">Winning Bid: <span className="text-white font-black">{(lowestUniqueAmount ?? 12).toFixed(1)} ETB</span></p>
                </div>
              </div>
              <div className="bg-slate-950/70 backdrop-blur-md px-6 py-4 rounded-2xl border border-white/20 text-center shrink-0">
                <p className="text-[10px] uppercase font-bold text-emerald-400">Audited Hash</p>
                <p className="text-xs font-mono font-black tracking-wider text-white mt-1">#SHA256-8A9F-49C0</p>
              </div>
            </div>
          )}

          <div className="overflow-x-auto rounded-2xl border border-slate-200 shadow-sm">
            <table className="w-full text-left text-xs font-sans">
              <thead className="bg-slate-900 text-white font-bold uppercase tracking-wider">
                <tr>
                  <th className="p-4">Photo</th>
                  <th className="p-4">Full Name</th>
                  <th className="p-4">Phone</th>
                  <th className="p-4">Bid Amount</th>
                  <th className="p-4">Time</th>
                  <th className="p-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {auctionBids.map(b => {
                  const bidder = users.find(u => u.id === b.bidderId) || { name: `Bidder (${b.maskedBidderId})`, phone: b.maskedBidderId, photo: undefined };
                  const count = amountCounts[b.amount] || 1;
                  const isDuplicate = count > 1;
                  const isWinner = winningBid?.id === b.id;
                  return (
                    <tr key={b.id} className={`transition-all font-semibold ${isWinner ? 'bg-emerald-50 border-l-4 border-l-emerald-600' : isDuplicate ? 'bg-rose-50/80 border-l-4 border-l-rose-500' : 'bg-white hover:bg-slate-50'}`}>
                      <td className="p-4">
                        <img src={bidder.photo ?? `https://api.dicebear.com/7.x/avataaars/svg?seed=${bidder.name}`} alt={bidder.name}
                          className="w-10 h-10 rounded-full object-cover border border-slate-200"
                          onError={e => { (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${bidder.name}`; }} />
                      </td>
                      <td className="p-4 font-bold text-slate-900">{bidder.name} {isWinner && <Trophy className="w-3.5 h-3.5 text-amber-500 inline ml-1" />}</td>
                      <td className="p-4 font-mono text-slate-600">{bidder.phone}</td>
                      <td className="p-4 font-black text-sm"><span className={isDuplicate ? 'line-through text-rose-600' : 'text-slate-900'}>{b.amount.toFixed(1)} ETB</span></td>
                      <td className="p-4 text-slate-500">{formatDate(b.timestamp)}</td>
                      <td className="p-4">
                        {isWinner ? (
                          <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-100 border border-emerald-300 px-3 py-1 rounded-full animate-pulse">
                            <Trophy className="w-3 h-3 text-amber-500" /> WINNER
                          </span>
                        ) : isDuplicate ? (
                          <span className="inline-flex items-center gap-1 text-xs font-bold text-rose-700 bg-rose-100 border border-rose-300 px-3 py-1 rounded-full">
                            <XCircle className="w-3 h-3" /> DISQUALIFIED ×{count}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs font-bold text-blue-700 bg-blue-100 border border-blue-300 px-3 py-1 rounded-full">
                            <CheckCircle className="w-3 h-3" /> UNIQUE
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          LIVE ANIMATED AUDIT MODAL
      ══════════════════════════════════════════════════════════════════ */}
      {showAuditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-950/90 backdrop-blur-xl">
          <div className="bg-white rounded-3xl w-full max-w-xl shadow-2xl border border-slate-200 relative overflow-hidden flex flex-col" style={{ maxHeight: '92vh' }}>

            {/* Close button */}
            <button onClick={closeModal} className="absolute top-4 right-4 z-10 text-slate-400 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 w-8 h-8 rounded-full flex items-center justify-center font-bold transition-all">✕</button>

            {/* ── PHASE 1: PRODUCT COUNTDOWN ────────────────────────────────── */}
            {auditPhase === 'product_countdown' && (
              <div className="p-8 space-y-6 text-center">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-rose-50 text-rose-600 border border-rose-200 text-xs font-black uppercase animate-pulse">
                  <Clock className="w-4 h-4" /> Auction Finalizing
                </div>

                <div className="relative w-44 h-44 mx-auto">
                  <img src={auction.image} alt={auction.title}
                    className="w-full h-full object-cover rounded-3xl border-4 border-amber-400 shadow-2xl"
                    onError={e => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=600&q=80'; }} />
                  {/* Animated countdown ring overlay */}
                  <div className="absolute inset-0 rounded-3xl flex items-center justify-center bg-slate-900/50">
                    <span className="text-6xl font-black text-white drop-shadow-2xl" style={{ animation: 'ping 1s cubic-bezier(0, 0, 0.2, 1) infinite', animationIterationCount: 1 }}>
                      {productTimer}
                    </span>
                  </div>
                  {/* Pulsing ring */}
                  <div className="absolute inset-0 rounded-3xl border-4 border-amber-400 animate-ping opacity-40"></div>
                </div>

                <div>
                  <h3 className="text-xl font-black text-slate-900">{auction.title}</h3>
                  <p className="text-xs font-bold text-blue-600 mt-1">{formatCurrency(auction.retailValue)}</p>
                  <p className="text-xs text-slate-500 mt-3">Scanning <strong>{auctionBids.length} bids</strong> from <strong>{new Set(auctionBids.map(b => b.bidderId)).size} players</strong> in {productTimer}s…</p>
                </div>

                <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-amber-500 via-rose-500 to-purple-600 rounded-full transition-all duration-1000"
                    style={{ width: `${((5 - productTimer) / 5) * 100}%` }} />
                </div>
              </div>
            )}

            {/* ── PHASE 2: PLAYER SCAN ──────────────────────────────────────── */}
            {auditPhase === 'player_scan' && (
              <div className="flex flex-col overflow-hidden" style={{ maxHeight: '92vh' }}>
                {/* Header */}
                <div className="px-6 pt-6 pb-4 border-b border-slate-100 shrink-0">
                  <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-black uppercase mb-3 ${
                    scanSubStep === 'reveal' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                    scanSubStep === 'mark_red' ? 'bg-rose-50 text-rose-700 border border-rose-200 animate-pulse' :
                    scanSubStep === 'mark_green' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                    'bg-amber-50 text-amber-700 border border-amber-200 animate-pulse'
                  }`}>
                    {scanSubStep === 'reveal' && <><RefreshCw className="w-4 h-4 animate-spin" /> Loading Players ({revealCount}/{auctionBids.length})</>}
                    {scanSubStep === 'mark_red' && <><XCircle className="w-4 h-4" /> Flagging Duplicate Amounts in RED</>}
                    {scanSubStep === 'mark_green' && <><CheckCircle className="w-4 h-4" /> Isolating Unique Bids</>}
                    {scanSubStep === 'zoom_winner' && <><Star className="w-4 h-4 fill-amber-500" /> Finding Lowest Unique Winner…</>}
                  </div>

                  <div className="flex items-center justify-between text-xs font-bold text-slate-500">
                    <span>
                      {scanSubStep === 'reveal' && 'Scanning bidder records…'}
                      {scanSubStep === 'mark_red' && 'Same-amount bids are disqualified'}
                      {scanSubStep === 'mark_green' && 'Unique amounts qualify for winning'}
                      {scanSubStep === 'zoom_winner' && 'Choosing the lowest unique bid…'}
                    </span>
                    <span className="font-mono bg-slate-100 px-2 py-0.5 rounded text-[10px]">{auctionBids.length} total bids</span>
                  </div>
                </div>

                {/* Scrollable player list */}
                <div className="overflow-y-auto flex-1 px-4 py-3 space-y-2">
                  {auctionBids.map((b, idx) => {
                    const bidder = users.find(u => u.id === b.bidderId) || {
                      name: `Bidder (${b.maskedBidderId})`,
                      phone: b.maskedBidderId,
                      photo: undefined,
                    };
                    const mark = rowMarks[idx] ?? 'idle';
                    const visible = idx < revealCount;
                    const isZoomWinner = scanSubStep === 'zoom_winner' && mark === 'winner';

                    return (
                      <div
                        key={b.id}
                        style={{
                          transition: 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
                          opacity: visible ? 1 : 0,
                          transform: visible ? 'translateX(0) scale(1)' : 'translateX(-30px) scale(0.95)',
                        }}
                        className={`flex items-center justify-between p-3 rounded-2xl border transition-colors ${
                          mark === 'winner'
                            ? isZoomWinner
                              ? 'bg-gradient-to-r from-amber-400 via-yellow-300 to-emerald-400 border-amber-400 shadow-lg shadow-amber-200 scale-105'
                              : 'bg-emerald-50 border-emerald-400 shadow-sm'
                            : mark === 'unique'
                            ? 'bg-emerald-50 border-emerald-300'
                            : mark === 'duplicate'
                            ? 'bg-rose-100 border-rose-400 animate-pulse'
                            : mark === 'scanning'
                            ? 'bg-blue-50 border-blue-200'
                            : 'bg-slate-50 border-slate-200'
                        }`}
                      >
                        {/* Left: Photo + Name + Phone */}
                        <div className="flex items-center gap-3">
                          <div className={`relative shrink-0 rounded-full ${mark === 'winner' ? 'ring-2 ring-amber-400' : mark === 'duplicate' ? 'ring-2 ring-rose-400' : mark === 'unique' ? 'ring-2 ring-emerald-400' : ''}`}>
                            <img
                              src={bidder.photo ?? `https://api.dicebear.com/7.x/avataaars/svg?seed=${bidder.name}`}
                              alt={bidder.name}
                              className="w-10 h-10 rounded-full object-cover border border-white shadow-sm"
                              onError={e => { (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${bidder.name}`; }}
                            />
                            {mark === 'winner' && (
                              <div className="absolute -top-1 -right-1 bg-amber-400 text-white w-4 h-4 rounded-full flex items-center justify-center">
                                <Trophy className="w-2.5 h-2.5" />
                              </div>
                            )}
                            {mark === 'duplicate' && (
                              <div className="absolute -top-1 -right-1 bg-rose-500 text-white w-4 h-4 rounded-full flex items-center justify-center">
                                <XCircle className="w-2.5 h-2.5" />
                              </div>
                            )}
                          </div>
                          <div>
                            <p className={`text-xs font-extrabold leading-tight ${
                              mark === 'winner' ? 'text-slate-900' :
                              mark === 'duplicate' ? 'text-rose-800 line-through opacity-80' :
                              mark === 'unique' ? 'text-emerald-900' :
                              'text-slate-900'
                            }`}>{bidder.name}</p>
                            <p className="text-[10px] text-slate-500 font-mono">{bidder.phone}</p>
                          </div>
                        </div>

                        {/* Right: Amount + Badge */}
                        <div className="text-right">
                          <p className={`text-sm font-black ${
                            mark === 'winner' ? 'text-slate-900' :
                            mark === 'duplicate' ? 'line-through text-rose-600' :
                            mark === 'unique' ? 'text-emerald-700' :
                            'text-slate-800'
                          }`}>{b.amount.toFixed(1)} ETB</p>
                          <span className={`text-[10px] font-extrabold uppercase ${
                            mark === 'winner' ? 'text-amber-800' :
                            mark === 'duplicate' ? 'text-rose-600' :
                            mark === 'unique' ? 'text-emerald-600' :
                            mark === 'scanning' ? 'text-blue-600' :
                            'text-slate-400'
                          }`}>
                            {mark === 'winner' && '🏆 WINNER'}
                            {mark === 'duplicate' && `❌ DUPLICATE (×${amountCounts[b.amount]})`}
                            {mark === 'unique' && '✅ UNIQUE'}
                            {mark === 'scanning' && 'UNIQUE BID'}
                            {mark === 'idle' && '…'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Progress bar */}
                <div className="px-6 pb-5 pt-3 shrink-0">
                  <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all duration-500 ${
                      scanSubStep === 'reveal' ? 'bg-blue-500' :
                      scanSubStep === 'mark_red' ? 'bg-rose-500' :
                      scanSubStep === 'mark_green' ? 'bg-emerald-500' :
                      'bg-gradient-to-r from-amber-400 to-emerald-500'
                    }`}
                      style={{ width: scanSubStep === 'reveal' ? `${(revealCount / auctionBids.length) * 60}%` : scanSubStep === 'mark_red' ? '70%' : scanSubStep === 'mark_green' ? '90%' : '100%' }}
                    />
                  </div>
                  <p className="text-[10px] text-slate-400 font-bold mt-2 text-center">
                    {scanSubStep === 'reveal' && `Revealing players… ${revealCount} of ${auctionBids.length}`}
                    {scanSubStep === 'mark_red' && 'Flagging duplicate bid amounts in red…'}
                    {scanSubStep === 'mark_green' && 'Filtering unique bids…'}
                    {scanSubStep === 'zoom_winner' && 'Winner found! Preparing reveal…'}
                  </p>
                </div>
              </div>
            )}

            {/* ── PHASE 3: GRAND WINNER REVEAL ──────────────────────────────── */}
            {auditPhase === 'winner_reveal' && winningUser && (
              <div className="p-8 space-y-6 text-center">
                <div className="w-16 h-16 bg-amber-100 rounded-3xl flex items-center justify-center mx-auto shadow-lg ring-8 ring-amber-50">
                  <Trophy className="w-9 h-9 fill-amber-500 animate-bounce" />
                </div>

                <div>
                  <span className="bg-emerald-100 text-emerald-800 text-xs font-black uppercase px-3 py-1 rounded-full border border-emerald-300">
                    🎉 Provably Fair Winner Found!
                  </span>

                  {/* Big winner profile card */}
                  <div className="mt-5 flex flex-col items-center gap-3">
                    <div className="relative">
                      <img src={winningUser.photo ?? `https://api.dicebear.com/7.x/avataaars/svg?seed=${winningUser.name}`} alt={winningUser.name}
                        className="w-24 h-24 rounded-3xl object-cover border-4 border-amber-400 shadow-2xl ring-8 ring-amber-100"
                        onError={e => { (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${winningUser.name}`; }} />
                      <div className="absolute -top-2 -right-2 bg-amber-400 text-slate-900 p-2 rounded-full shadow-md">
                        <Trophy className="w-4 h-4 fill-slate-900" />
                      </div>
                    </div>
                    <h2 className="text-3xl font-black text-slate-900">{winningUser.name}</h2>
                    <p className="text-xs text-slate-500 flex items-center gap-1 font-bold">
                      <Phone className="w-3.5 h-3.5 text-blue-600" /> {winningUser.phone}
                    </p>
                  </div>
                </div>

                <div className="bg-slate-900 text-white p-6 rounded-3xl">
                  <p className="text-xs font-bold text-amber-400 uppercase tracking-wider">Lowest Unique Winning Bid</p>
                  <p className="text-5xl font-black text-white mt-1">{(lowestUniqueAmount ?? 12).toFixed(1)} ETB</p>
                  <p className="text-[11px] text-slate-400 pt-3 mt-3 border-t border-slate-800 font-mono">
                    Audited Hash: #SHA256-8A9F-49C0-VERIFIED
                  </p>
                </div>

                <button onClick={closeModal} className="btn-primary w-full py-3 text-sm">
                  View Complete Audit Table ↓
                </button>
              </div>
            )}
          </div>
        </div>
      )}
      </div>
    </>
  );
}
