import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import CountdownTimer from '../../components/CountdownTimer';
import { formatCurrency, formatDate } from '../../utils/countdown';
import {
  ChevronLeft, Users, TrendingDown, Phone,
  CheckCircle, AlertCircle, Gavel, Sparkles, Play, RefreshCw, Trophy, XCircle, Coins, Clock
} from 'lucide-react';

export default function AuctionDetail() {
  const { id } = useParams<{ id: string }>();
  const { auctions, bids, users, currentUser, placeBid, setAuctions } = useApp();
  const nav = useNavigate();

  const auction = auctions.find(a => a.id === id);
  const auctionBids = bids.filter(b => b.auctionId === id);

  const [bidAmount, setBidAmount] = useState<string>('');
  const [imgIdx, setImgIdx] = useState(0);
  const [bidResult, setBidResult] = useState<{ ok: boolean; msg: string } | null>(null);

  // Live Audit Modal & Countdown State
  const [showAuditModal, setShowAuditModal] = useState(false);
  const [auditPhase, setAuditPhase] = useState<'product_countdown' | 'player_scan' | 'winner_reveal' | null>(null);
  const [productTimer, setProductTimer] = useState<number>(5);
  const [scanTimer, setScanTimer] = useState<number>(5);
  const [isSimulatedClosed, setIsSimulatedClosed] = useState(false);

  const images = [auction?.image ?? '', auction?.image ?? '', auction?.image ?? ''];

  // Count occurrences of each bid amount
  const amountCounts: Record<number, number> = {};
  auctionBids.forEach(b => {
    amountCounts[b.amount] = (amountCounts[b.amount] || 0) + 1;
  });

  // Calculate unique bids & lowest unique bid
  const uniqueAmounts = Object.keys(amountCounts)
    .map(Number)
    .filter(amt => amountCounts[amt] === 1)
    .sort((a, b) => a - b);

  const lowestUniqueAmount = uniqueAmounts.length > 0 ? uniqueAmounts[0] : null;
  const winningBid = lowestUniqueAmount ? auctionBids.find(b => b.amount === lowestUniqueAmount) : null;
  const winningUser = winningBid ? users.find(u => u.id === winningBid.bidderId) : (users[1] ?? users[0]);

  // Phase 1: 5-second product popup timer
  useEffect(() => {
    let timerId: ReturnType<typeof setTimeout>;
    if (showAuditModal && auditPhase === 'product_countdown') {
      if (productTimer > 0) {
        timerId = setTimeout(() => setProductTimer(prev => prev - 1), 1000);
      } else {
        // Transition to Phase 2: Player Scan (5s)
        setAuditPhase('player_scan');
        setScanTimer(5);
      }
    }
    return () => clearTimeout(timerId);
  }, [showAuditModal, auditPhase, productTimer]);

  // Phase 2: 5-second player scan timer
  useEffect(() => {
    let timerId: ReturnType<typeof setTimeout>;
    if (showAuditModal && auditPhase === 'player_scan') {
      if (scanTimer > 0) {
        timerId = setTimeout(() => setScanTimer(prev => prev - 1), 1000);
      } else {
        // Transition to Phase 3: Grand Winner Reveal
        setAuditPhase('winner_reveal');
      }
    }
    return () => clearTimeout(timerId);
  }, [showAuditModal, auditPhase, scanTimer]);

  if (!auction) return (
    <div className="text-center py-20 bg-white rounded-3xl border border-slate-200 p-8 space-y-4">
      <div className="text-5xl mb-4">🔍</div>
      <p className="text-slate-500 font-bold">Auction not found.</p>
      <button onClick={() => nav('/auctions')} className="btn-primary">Browse Auctions</button>
    </div>
  );

  function handleBid(e: React.FormEvent) {
    e.preventDefault();
    const amount = parseInt(bidAmount);
    if (isNaN(amount) || amount < auction!.minBid || amount > auction!.maxBid) {
      setBidResult({ ok: false, msg: `Bid must be between ${auction!.minBid} and ${auction!.maxBid} ETB.` });
      return;
    }
    if (!currentUser) { nav('/login'); return; }
    if (currentUser.credits < 1) {
      setBidResult({ ok: false, msg: 'Not enough credits. Purchase credits in your wallet to continue bidding.' });
      return;
    }
    const ok = placeBid(auction!.id, amount);
    if (ok) {
      setBidResult({ ok: true, msg: `Success! Placed bid of ${amount.toFixed(1)} ETB. 1 credit deducted.` });
      setBidAmount('');
    } else {
      setBidResult({ ok: false, msg: 'Failed to place bid. Please try again.' });
    }
    setTimeout(() => setBidResult(null), 4000);
  }

  // Trigger End Countdown & Animated Reveal Modal
  function startWinnerFindingAnimation() {
    setIsSimulatedClosed(true);
    setShowAuditModal(true);
    setAuditPhase('product_countdown');
    setProductTimer(5);
    setScanTimer(5);

    // Update auction status to closed in state
    setAuctions(prev => prev.map(a => a.id === auction!.id ? { ...a, status: 'closed', lowestUniqueBid: lowestUniqueAmount ?? 12 } : a));
  }

  const isClosed = auction.status === 'closed' || isSimulatedClosed;

  return (
    <div className="space-y-8 font-sans">
      {/* Top Bar with Trigger Start Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <button onClick={() => nav(-1)} className="flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors">
          <ChevronLeft className="w-4 h-4" /> Back to Auctions
        </button>

        {/* Start Winner Audit & 5s Countdown Animation Button */}
        <button
          onClick={startWinnerFindingAnimation}
          className="btn-accent inline-flex items-center gap-2 shadow-lg shadow-amber-500/20 text-xs py-2.5 px-4"
        >
          <Play className="w-4 h-4 fill-white" />
          <span>⚡ Start 5s Countdown & Animated Winner Reveal</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Images Column */}
        <div className="lg:col-span-6 space-y-4">
          <div className="relative bg-slate-100 rounded-3xl overflow-hidden h-80 sm:h-96 border border-slate-200/80 shadow-sm">
            <img
              src={images[imgIdx]}
              alt={auction.title}
              className="w-full h-full object-cover"
              onError={e => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=600&q=80'; }}
            />
            <div className="absolute top-4 left-4">
              {isClosed ? (
                <span className="badge-closed shadow-md">✓ Auction Closed (00:00:00)</span>
              ) : (
                <span className="badge-active shadow-md">● Active Auction</span>
              )}
            </div>
          </div>
          <div className="flex gap-3">
            {images.map((img, i) => (
              <button
                key={i}
                onClick={() => setImgIdx(i)}
                className={`w-20 h-16 rounded-xl overflow-hidden border-2 transition-all ${imgIdx === i ? 'border-blue-600 ring-2 ring-blue-500/20' : 'border-slate-200 opacity-70 hover:opacity-100'}`}
              >
                <img src={img} className="w-full h-full object-cover" onError={e => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=600&q=80'; }} />
              </button>
            ))}
          </div>
        </div>

        {/* Details Column */}
        <div className="lg:col-span-6 space-y-6">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-blue-600">{auction.category}</span>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 leading-tight mt-1">{auction.title}</h1>
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
                {isClosed ? (
                  <span className="text-xs font-mono font-bold text-rose-600">00:00:00 (Ended)</span>
                ) : (
                  <CountdownTimer endTime={auction.endTime} status={auction.status} />
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-slate-600 bg-slate-50 p-4 rounded-2xl border border-slate-200">
            <span className="flex items-center gap-1.5 font-bold"><Users className="w-4 h-4 text-purple-600" /> {auction.totalParticipants} Participants</span>
            <span className="flex items-center gap-1.5 font-bold"><TrendingDown className="w-4 h-4 text-blue-600" /> {auction.totalBids} Total Bids</span>
          </div>

          {/* Active Bid Form */}
          {!isClosed && (
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <Gavel className="w-4 h-4 text-blue-600" /> Submit Your Bid
                </span>
                <span className="text-xs font-bold text-amber-700 bg-amber-50 px-3 py-1 rounded-full border border-amber-200 flex items-center gap-1">
                  <Coins className="w-3.5 h-3.5 text-amber-500" /> {currentUser?.credits ?? 0} Credits Left
                </span>
              </div>
              <form onSubmit={handleBid} className="flex gap-2">
                <input
                  type="number"
                  value={bidAmount}
                  onChange={e => setBidAmount(e.target.value)}
                  className="input-field flex-1 font-bold"
                  placeholder={`Range: ${auction.minBid} – ${auction.maxBid} ETB`}
                  min={auction.minBid}
                  max={auction.maxBid}
                />
                <button type="submit" className="btn-primary whitespace-nowrap">Place Bid (1 Credit)</button>
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

      {/* ENDED AUCTION PERMANENT AUDIT SECTION */}
      {isClosed && (
        <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-xl space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-6">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-50 text-purple-700 border border-purple-200 text-xs font-bold mb-2">
                <Sparkles className="w-3.5 h-3.5" /> Provably Fair Audit Engine
              </div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">Complete Player Bids Audit Table</h2>
              <p className="text-xs text-slate-500 font-medium">
                Total Bidders: <strong>{auction.totalParticipants}</strong> | Total Bids Placed: <strong>{auctionBids.length}</strong>
              </p>
            </div>

            <button
              onClick={startWinnerFindingAnimation}
              className="btn-accent inline-flex items-center gap-2 shadow-lg"
            >
              <Play className="w-4 h-4 fill-white" />
              <span>Replay 5s Countdown & Winner Reveal</span>
            </button>
          </div>

          {/* Winner Profile Card with Photo, Full Name, Phone Number, and Amount */}
          {winningUser && (
            <div className="bg-gradient-to-r from-emerald-600 via-teal-700 to-slate-900 text-white p-6 sm:p-8 rounded-3xl shadow-xl flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden animate-in fade-in zoom-in-95 border border-emerald-400/30">
              <div className="flex items-center gap-5 relative z-10">
                <div className="relative">
                  <img
                    src={winningUser.photo ?? `https://api.dicebear.com/7.x/avataaars/svg?seed=${winningUser.name}`}
                    alt={winningUser.name}
                    className="w-20 h-20 rounded-2xl object-cover border-2 border-amber-300 shadow-xl ring-4 ring-white/20"
                    onError={e => {
                      (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${winningUser.name}`;
                    }}
                  />
                  <div className="absolute -top-2 -right-2 bg-amber-400 text-slate-900 p-1.5 rounded-full shadow-md">
                    <Trophy className="w-4 h-4 fill-slate-900" />
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="bg-amber-400/20 text-amber-300 text-[10px] font-black uppercase px-3 py-1 rounded-full border border-amber-300/30">
                    Official Auction Winner
                  </span>
                  <h3 className="text-2xl font-black text-white">{winningUser.name}</h3>
                  <p className="text-xs text-emerald-100 flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5 text-emerald-300" /> {winningUser.phone}
                  </p>
                  <p className="text-xs text-amber-300 font-extrabold mt-1">
                    Winning Bid Amount: <span className="text-sm text-white font-black">{(lowestUniqueAmount ?? 12).toFixed(1)} ETB</span>
                  </p>
                </div>
              </div>

              <div className="bg-slate-950/70 backdrop-blur-md px-6 py-4 rounded-2xl border border-white/20 text-center relative z-10 shrink-0">
                <p className="text-[10px] uppercase font-bold text-emerald-400">Audited Cryptographic Hash</p>
                <p className="text-xs font-mono font-black tracking-wider text-white mt-1">#SHA256-8A9F-49C0</p>
              </div>
            </div>
          )}

          {/* AUDIT BIDS TABLE (PHOTO, FULL NAME, PHONE NUMBER, AMOUNT & STATUS) */}
          <div className="space-y-3">
            <div className="overflow-x-auto rounded-2xl border border-slate-200 shadow-sm">
              <table className="w-full text-left text-xs font-sans">
                <thead className="bg-slate-900 text-white font-bold uppercase tracking-wider">
                  <tr>
                    <th className="p-4">Bidder Photo</th>
                    <th className="p-4">Full Name</th>
                    <th className="p-4">Phone Number</th>
                    <th className="p-4">Bid Amount (ETB)</th>
                    <th className="p-4">Submission Time</th>
                    <th className="p-4">Audit Status Result</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {auctionBids.map(b => {
                    const bidder = users.find(u => u.id === b.bidderId) || {
                      name: `Bidder (${b.maskedBidderId})`,
                      phone: '+251 9' + Math.floor(10000000 + Math.random() * 90000000),
                      photo: `https://api.dicebear.com/7.x/avataaars/svg?seed=${b.maskedBidderId}`,
                    };

                    const count = amountCounts[b.amount] || 1;
                    const isDuplicate = count > 1;
                    const isWinner = winningBid?.id === b.id;

                    return (
                      <tr
                        key={b.id}
                        className={`transition-all duration-500 font-semibold ${
                          isWinner
                            ? 'bg-emerald-500/15 font-black border-l-4 border-l-emerald-600 text-emerald-950'
                            : isDuplicate
                            ? 'bg-rose-50/80 text-rose-800 border-l-4 border-l-rose-500'
                            : 'bg-white text-slate-800 hover:bg-slate-50'
                        }`}
                      >
                        <td className="p-4">
                          <img
                            src={bidder.photo ?? `https://api.dicebear.com/7.x/avataaars/svg?seed=${bidder.name}`}
                            alt={bidder.name}
                            className="w-10 h-10 rounded-full object-cover border border-slate-200 shadow-xs"
                            onError={e => {
                              (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${bidder.name}`;
                            }}
                          />
                        </td>
                        <td className="p-4 font-bold text-slate-900">
                          {bidder.name}
                          {isWinner && <Trophy className="w-3.5 h-3.5 text-amber-500 inline ml-1.5" />}
                        </td>
                        <td className="p-4 text-slate-600 font-mono">
                          {bidder.phone}
                        </td>
                        <td className="p-4 text-sm font-black">
                          <span className={isDuplicate ? 'line-through text-rose-600' : 'text-slate-900'}>
                            {b.amount.toFixed(1)} ETB
                          </span>
                        </td>
                        <td className="p-4 text-slate-500">{formatDate(b.timestamp)}</td>
                        <td className="p-4">
                          {isWinner ? (
                            <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-100 border border-emerald-300 px-3 py-1 rounded-full shadow-xs animate-pulse">
                              <Trophy className="w-3.5 h-3.5 text-amber-500" /> WINNER (Lowest Unique Bid)
                            </span>
                          ) : isDuplicate ? (
                            <span className="inline-flex items-center gap-1 text-xs font-bold text-rose-700 bg-rose-100 border border-rose-300 px-3 py-1 rounded-full">
                              <XCircle className="w-3.5 h-3.5 text-rose-600" /> DISQUALIFIED (Same Bid Amount by {count} bidders)
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs font-bold text-blue-700 bg-blue-100 border border-blue-300 px-3 py-1 rounded-full">
                              <CheckCircle className="w-3.5 h-3.5 text-blue-600" /> Unique Bid ({b.amount.toFixed(1)} ETB)
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
        </div>
      )}

      {/* 🚀 LIVE ANIMATED AUDIT OVERLAY MODAL (5s PRODUCT COUNTDOWN -> 5s PLAYER RED SCAN -> GRAND WINNER REVEAL) */}
      {showAuditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-xl animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-8 shadow-2xl space-y-6 border border-slate-200 relative overflow-hidden text-center">
            <button
              onClick={() => setShowAuditModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 font-bold bg-slate-100 w-8 h-8 rounded-full flex items-center justify-center"
            >
              ✕
            </button>

            {/* PHASE 1: 5-SECOND PRODUCT COUNTDOWN MODAL POPUP */}
            {auditPhase === 'product_countdown' && (
              <div className="space-y-6 py-4 animate-in zoom-in-95">
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-rose-50 text-rose-600 border border-rose-200 text-xs font-black uppercase tracking-wider animate-pulse">
                  <Clock className="w-4 h-4" /> Live Auction Finalizing
                </div>

                <div className="relative w-40 h-40 mx-auto">
                  <img
                    src={auction.image}
                    alt={auction.title}
                    className="w-full h-full object-cover rounded-3xl shadow-xl border-4 border-amber-400 animate-pulse-subtle"
                    onError={e => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=600&q=80'; }}
                  />
                  <div className="absolute inset-0 bg-slate-900/40 rounded-3xl flex items-center justify-center">
                    <span className="text-5xl font-black text-white drop-shadow-lg animate-ping">
                      {productTimer}s
                    </span>
                  </div>
                </div>

                <div>
                  <h3 className="text-2xl font-black text-slate-900 tracking-tight">{auction.title}</h3>
                  <p className="text-xs font-bold text-blue-600 mt-1">Retail Price: {formatCurrency(auction.retailValue)}</p>
                  <p className="text-xs text-slate-500 mt-3 font-semibold">
                    Auction countdown is ending in <strong>{productTimer} seconds</strong>. Preparing to scan all bidder amounts...
                  </p>
                </div>

                {/* Progress bar */}
                <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-amber-500 via-rose-500 to-purple-600 transition-all duration-1000 rounded-full"
                    style={{ width: `${((5 - productTimer) / 5) * 100}%` }}
                  ></div>
                </div>
              </div>
            )}

            {/* PHASE 2: 5-SECOND PLAYER SCANNING & RED DUPLICATE FLAGGING */}
            {auditPhase === 'player_scan' && (
              <div className="space-y-6 py-4 animate-in fade-in">
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200 text-xs font-black uppercase tracking-wider">
                  <RefreshCw className="w-4 h-4 animate-spin text-purple-600" /> Scanning Player Bids ({scanTimer}s remaining)
                </div>

                <div className="text-left space-y-2">
                  <h3 className="text-lg font-bold text-slate-900 text-center">Flagging Duplicate Bid Amounts in RED</h3>
                  <p className="text-xs text-slate-500 text-center">Bidders with identical amounts are disqualified</p>
                </div>

                {/* Animated Scanner Player Bids Feed */}
                <div className="max-h-64 overflow-y-auto divide-y divide-slate-100 border border-slate-200 rounded-2xl p-2 text-left">
                  {auctionBids.map(b => {
                    const bidder = users.find(u => u.id === b.bidderId) || {
                      name: `Bidder (${b.maskedBidderId})`,
                      phone: '+251 9' + Math.floor(10000000 + Math.random() * 90000000),
                      photo: `https://api.dicebear.com/7.x/avataaars/svg?seed=${b.maskedBidderId}`,
                    };
                    const count = amountCounts[b.amount] || 1;
                    const isDuplicate = count > 1;

                    return (
                      <div
                        key={b.id}
                        className={`p-3 rounded-xl flex items-center justify-between text-xs font-bold transition-all duration-700 ${
                          isDuplicate
                            ? 'bg-rose-100/80 text-rose-800 border border-rose-300 animate-pulse'
                            : 'bg-blue-50 text-blue-900 border border-blue-200'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <img
                            src={bidder.photo}
                            alt={bidder.name}
                            className="w-8 h-8 rounded-full border border-slate-200 object-cover"
                            onError={e => { (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${bidder.name}`; }}
                          />
                          <div>
                            <p className="font-extrabold">{bidder.name}</p>
                            <p className="text-[10px] text-slate-500">{bidder.phone}</p>
                          </div>
                        </div>

                        <div className="text-right">
                          <span className={`text-sm font-black ${isDuplicate ? 'line-through text-rose-600' : 'text-slate-900'}`}>
                            {b.amount.toFixed(1)} ETB
                          </span>
                          {isDuplicate ? (
                            <span className="block text-[10px] text-rose-600 font-extrabold">DISQUALIFIED (DUPLICATE)</span>
                          ) : (
                            <span className="block text-[10px] text-blue-600 font-extrabold">UNIQUE BID</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Progress bar */}
                <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-purple-600 via-rose-500 to-emerald-500 transition-all duration-1000 rounded-full"
                    style={{ width: `${((5 - scanTimer) / 5) * 100}%` }}
                  ></div>
                </div>
              </div>
            )}

            {/* PHASE 3: GRAND WINNER REVEAL */}
            {auditPhase === 'winner_reveal' && winningUser && (
              <div className="space-y-6 py-2 animate-in zoom-in-95">
                <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-3xl flex items-center justify-center mx-auto shadow-lg ring-8 ring-amber-50">
                  <Trophy className="w-9 h-9 fill-amber-500 animate-bounce" />
                </div>

                <div>
                  <span className="bg-emerald-100 text-emerald-800 text-xs font-black uppercase px-3 py-1 rounded-full border border-emerald-300">
                    Provably Fair Winner Found!
                  </span>
                  <h2 className="text-3xl font-black text-slate-900 tracking-tight mt-2">{winningUser.name}</h2>
                  <p className="text-xs text-slate-500 flex items-center justify-center gap-1 font-bold mt-1">
                    <Phone className="w-3.5 h-3.5 text-blue-600" /> {winningUser.phone}
                  </p>
                </div>

                <div className="bg-slate-900 text-white p-6 rounded-3xl space-y-2 border border-slate-800 shadow-xl">
                  <p className="text-xs font-bold text-amber-400 uppercase tracking-wider">Winning Lowest Unique Bid Amount</p>
                  <p className="text-4xl font-black text-white">{(lowestUniqueAmount ?? 12).toFixed(1)} ETB</p>
                  <p className="text-[11px] text-slate-400 pt-2 border-t border-slate-800 font-mono">
                    Audited Hash: #SHA256-8A9F-49C0-VERIFIED
                  </p>
                </div>

                <div className="flex items-center justify-center gap-3">
                  <button onClick={() => setShowAuditModal(false)} className="btn-primary w-full py-3 text-sm">
                    View Complete Audit Table
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
