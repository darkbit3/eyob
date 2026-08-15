import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { ROUTES } from '../../utils/routes';
import AuctionCard from '../../components/AuctionCard';
import CountdownTimer from '../../components/CountdownTimer';
import { formatCurrency, formatDate } from '../../utils/countdown';
import { Auction, Bid } from '../../data/mockData';
import { bidsApi } from '../../utils/api';
import { Search, SlidersHorizontal, X, ArrowLeft, Trophy, CheckCircle, XCircle, Loader2 } from 'lucide-react';

const STATUS_OPTS = ['all', 'active', 'upcoming', 'closed'] as const;
type StatusOpt = typeof STATUS_OPTS[number];

const validateBidAmount = (value: string): string => {
  if (value === '') return '';
  if (!/^[\d.]*$/.test(value)) return '';
  const parts = value.split('.');
  if (parts.length > 2) return '';
  if (parts.length === 2) {
    const decimalPart = parts[1].slice(0, 1);
    return parts[0] ? `${parts[0]}.${decimalPart}` : `.${decimalPart}`;
  }
  return value;
};

export default function AuctionList() {
  const { auctions, currentUser, placeBid } = useApp();
  const nav = useNavigate();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusOpt>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const categories = ['all', ...Array.from(new Set(auctions.map(a => a.category)))];

  const [selectedAuction, setSelectedAuction] = useState<Auction | null>(null);
  const [showFullView, setShowFullView] = useState(false);
  const [bidAmount, setBidAmount] = useState('');
  const [bidResult, setBidResult] = useState<{ ok: boolean; msg: string } | null>(null);
  const [bidSubmitState, setBidSubmitState] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [bidSubmitText, setBidSubmitText] = useState('');

  // ── Live bid data fetched per selected auction ──────────────────────────
  const [auctionBids, setAuctionBids] = useState<Bid[]>([]);
  const [bidsLoading, setBidsLoading] = useState(false);

  useEffect(() => {
    if (!selectedAuction) { setAuctionBids([]); return; }
    let cancelled = false;
    setBidsLoading(true);
    bidsApi.forAuction(selectedAuction.id)
      .then(res => {
        if (cancelled) return;
        setAuctionBids((res.data || []).map((b: any) => ({
          id: b.id,
          auctionId: b.auction_id ?? selectedAuction.id,
          bidderId: b.bidder_id ?? b.bidderId ?? '',
          maskedBidderId: b.masked_bidder_id ?? b.maskedBidderId ?? '',
          amount: Number(b.amount ?? 0),
          timestamp: b.created_at ?? b.timestamp ?? new Date().toISOString(),
          isDuplicate: Boolean(b.is_duplicate ?? false),
          isLowestUnique: Boolean(b.is_lowest_unique ?? false),
        })));
      })
      .catch(() => { if (!cancelled) setAuctionBids([]); })
      .finally(() => { if (!cancelled) setBidsLoading(false); });
    return () => { cancelled = true; };
  }, [selectedAuction?.id]);

  // ── Computed stats from live bids ────────────────────────────────────────
  const bidCounts = auctionBids.reduce<Record<number, number>>((acc, b) => {
    acc[b.amount] = (acc[b.amount] ?? 0) + 1;
    return acc;
  }, {});
  const uniqueAmounts = Array.from(new Set(auctionBids.map(b => b.amount)))
    .filter(amt => bidCounts[amt] === 1)
    .sort((a, b) => a - b);
  const lowestUnique = uniqueAmounts[0] ?? null;
  const winningBid = lowestUnique !== null ? auctionBids.find(b => b.amount === lowestUnique) : undefined;
  const participantCount = new Set(auctionBids.map(b => b.bidderId)).size;
  const myLatestBid = currentUser
    ? [...auctionBids]
        .filter(b => b.bidderId === currentUser.id)
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0]
    : undefined;

  // ── After a bid is placed, re-fetch bids so stats update instantly ────────
  function handlePopupBid(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedAuction) return;
    if (selectedAuction.status !== 'active') {
      setBidResult({ ok: false, msg: 'This auction is not currently active.' });
      return;
    }    const amount = Number(bidAmount);
    if (isNaN(amount) || amount < selectedAuction.minBid || amount > selectedAuction.maxBid) {
      setBidResult({ ok: false, msg: `Enter a valid bid between ${selectedAuction.minBid} and ${selectedAuction.maxBid} ETB.` });
      return;
    }
    if (!currentUser) { nav(ROUTES.LOGIN); return; }

    setBidSubmitState('loading');
    setBidSubmitText('Placing your bid...');
    setBidResult(null);

    window.setTimeout(() => {
      const ok = placeBid(selectedAuction.id, amount);
      if (ok) {
        setBidSubmitState('success');
        setBidSubmitText('Bid placed!');
        setBidResult({ ok: true, msg: `Bid placed for ${amount.toFixed(1)} ETB!` });
        setBidAmount('');
        // Re-fetch bids so Participants / Total bids / Unique bids update
        bidsApi.forAuction(selectedAuction.id)
          .then(res => setAuctionBids((res.data || []).map((b: any) => ({
            id: b.id,
            auctionId: b.auction_id ?? selectedAuction.id,
            bidderId: b.bidder_id ?? b.bidderId ?? '',
            maskedBidderId: b.masked_bidder_id ?? b.maskedBidderId ?? '',
            amount: Number(b.amount ?? 0),
            timestamp: b.created_at ?? b.timestamp ?? new Date().toISOString(),
            isDuplicate: Boolean(b.is_duplicate ?? false),
            isLowestUnique: Boolean(b.is_lowest_unique ?? false),
          }))))
          .catch(() => {});
      } else {
        setBidSubmitState('error');
        setBidSubmitText('Bid failed');
        setBidResult({ ok: false, msg: 'Unable to place bid. Check your wallet balance.' });
      }
      window.setTimeout(() => {
        setBidSubmitState('idle');
        setBidSubmitText('');
        setBidResult(null);
      }, 1600);
    }, 700);
  }

  const filtered = auctions.filter(a => {
    const q = search.toLowerCase();
    return (
      (a.title.toLowerCase().includes(q) || a.category.toLowerCase().includes(q)) &&
      (statusFilter === 'all' || a.status === statusFilter) &&
      (selectedCategory === 'all' || a.category === selectedCategory)
    );
  });

  // ── Stats block — reused in both quick-preview and full-view ─────────────
  function StatsBlock() {
    if (bidsLoading) {
      return (
        <div className="rounded-3xl bg-slate-100 p-6 border border-slate-200 flex items-center justify-center gap-2 text-slate-500 text-sm">
          <Loader2 className="w-4 h-4 animate-spin" /> Loading stats…
        </div>
      );
    }
    return (
      <div className="rounded-3xl bg-slate-100 p-6 border border-slate-200 text-sm space-y-3">
        <div className="flex items-center justify-between">
          <span className="font-semibold text-slate-900">Participants</span>
          <span className="font-mono font-bold text-slate-700">{participantCount}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="font-semibold text-slate-900">Total bids</span>
          <span className="font-mono font-bold text-slate-700">{auctionBids.length}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="font-semibold text-slate-900">Unique bids</span>
          <span className="font-mono font-bold text-slate-700">{uniqueAmounts.length}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5 font-sans">

      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Explore Auctions</h1>
        <p className="text-slate-500 text-xs font-medium mt-1">
          {filtered.length} auction{filtered.length !== 1 ? 's' : ''} found
        </p>
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 space-y-3">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search auctions…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="input-field pl-10 pr-10 text-sm"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="flex gap-2 overflow-x-auto pb-0.5" style={{ scrollbarWidth: 'none' }}>
          {STATUS_OPTS.map(st => (
            <button key={st} onClick={() => setStatusFilter(st)}
              className={`shrink-0 px-4 py-1.5 rounded-full text-xs font-bold capitalize transition-all ${
                statusFilter === st
                  ? st === 'active' ? 'bg-emerald-500 text-white shadow-sm'
                  : st === 'upcoming' ? 'bg-blue-500 text-white shadow-sm'
                  : st === 'closed' ? 'bg-slate-700 text-white shadow-sm'
                  : 'bg-blue-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}>
              {st === 'active' && '🔴 '}{st === 'upcoming' && '🔵 '}{st === 'closed' && '✓ '}{st === 'all' && '◈ '}{st}
            </button>
          ))}
        </div>

        <div className="flex gap-2 overflow-x-auto pb-0.5 pt-1 border-t border-slate-100" style={{ scrollbarWidth: 'none' }}>
          {categories.map(cat => (
            <button key={cat} onClick={() => setSelectedCategory(cat)}
              className={`shrink-0 px-3 py-1 rounded-full text-xs font-bold capitalize whitespace-nowrap transition-all ${
                selectedCategory === cat ? 'bg-indigo-600 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}>
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Auction Grid */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 space-y-3 shadow-sm">
          <SlidersHorizontal className="w-10 h-10 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-800">No auctions matched</h3>
          <p className="text-sm text-slate-500">Try clearing your filters or search term.</p>
          <button onClick={() => { setSearch(''); setStatusFilter('all'); setSelectedCategory('all'); }}
            className="btn-primary text-xs py-2 px-4 mt-2">
            Clear All Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {filtered.map(auction => (
            <AuctionCard key={auction.id} auction={auction} onClick={() => setSelectedAuction(auction)} />
          ))}
        </div>
      )}

      {/* Auction modal */}
      {selectedAuction && (
        <div
          onClick={() => { setSelectedAuction(null); setShowFullView(false); }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm"
        >
          <div
            onClick={e => e.stopPropagation()}
            className="w-full max-w-3xl max-h-[90vh] bg-white rounded-3xl shadow-2xl overflow-hidden overflow-y-auto"
          >
            {/* Modal header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-200">
              <div>
                <h2 className="text-lg font-bold text-slate-900">{selectedAuction.title}</h2>
                <p className="text-sm text-slate-500">{selectedAuction.category} • {selectedAuction.status}</p>
              </div>
              <button onClick={() => setSelectedAuction(null)}
                className="text-slate-500 hover:text-slate-900 text-xl font-bold" aria-label="Close">×</button>
            </div>

            {/* ── FULL VIEW ─────────────────────────────────────────────── */}
            {showFullView ? (
              <div className="p-6">
                <div className="flex items-center justify-between gap-4 mb-6">
                  <button type="button" onClick={() => setShowFullView(false)}
                    className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 text-sm font-semibold">
                    <ArrowLeft className="w-4 h-4" /> Back
                  </button>
                  <div className="text-right text-xs text-slate-500">
                    <div>{selectedAuction.category}</div>
                    <div>{selectedAuction.status.toUpperCase()}</div>
                  </div>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                  <div className="xl:col-span-2 space-y-4">
                    <div className="h-72 rounded-3xl overflow-hidden bg-slate-100">
                      <img src={selectedAuction.image} alt={selectedAuction.title}
                        className="w-full h-full object-cover"
                        onError={e => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=600&q=80'; }} />
                    </div>
                    <div className="rounded-3xl bg-slate-50 p-6 border border-slate-200">
                      <h3 className="text-xl font-bold text-slate-900">{selectedAuction.title}</h3>
                      <p className="text-sm text-slate-500 mt-2">{selectedAuction.description}</p>
                      <div className="mt-4 grid grid-cols-2 gap-3 text-sm text-slate-700">
                        <div className="rounded-2xl bg-white p-4 border border-slate-200">
                          <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Retail</p>
                          <p className="font-bold text-slate-900 mt-2">{formatCurrency(selectedAuction.retailValue)}</p>
                        </div>
                        <div className="rounded-2xl bg-white p-4 border border-slate-200">
                          <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Bid range</p>
                          <p className="font-bold text-blue-600 mt-2">{selectedAuction.minBid}–{selectedAuction.maxBid} ETB</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="rounded-3xl bg-slate-900 p-6 text-white shadow-sm">
                      <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Live countdown</p>
                      <div className="mt-4">
                        <CountdownTimer endTime={selectedAuction.endTime} status={selectedAuction.status} />
                      </div>
                      <p className="text-[11px] text-slate-400 mt-3">{selectedAuction.startTime ? `Starts: ${formatDate(selectedAuction.startTime)}` : ''}</p>
                      <p className="text-[11px] text-slate-400">Ends: {formatDate(selectedAuction.endTime)}</p>
                    </div>

                    {/* Live stats */}
                    <StatsBlock />
                  </div>
                </div>

                {/* Bid log for closed auctions */}
                {selectedAuction.status === 'closed' && (
                  <div className="mt-6 rounded-3xl overflow-hidden border border-slate-200 shadow-sm bg-white">
                    <div className="bg-slate-950 text-white px-6 py-4">
                      <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Bid History</p>
                      <h3 className="text-lg font-bold">All Bids</h3>
                    </div>
                    {bidsLoading ? (
                      <div className="flex items-center justify-center gap-2 py-10 text-slate-400 text-sm">
                        <Loader2 className="w-4 h-4 animate-spin" /> Loading bids…
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-slate-100 text-slate-600 uppercase tracking-wider text-[10px] font-bold">
                            <tr>
                              <th className="p-4">Bidder</th>
                              <th className="p-4">Amount</th>
                              <th className="p-4">Time</th>
                              <th className="p-4">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-200">
                            {auctionBids.length === 0 ? (
                              <tr><td colSpan={4} className="p-8 text-center text-slate-400">No bids recorded for this auction.</td></tr>
                            ) : auctionBids.map(bid => {
                              const isDuplicate = (bidCounts[bid.amount] ?? 1) > 1;
                              const isWinner = winningBid?.id === bid.id;
                              return (
                                <tr key={bid.id} className={`transition-all ${isWinner ? 'bg-emerald-50' : isDuplicate ? 'bg-rose-50' : 'bg-white hover:bg-slate-50'}`}>
                                  <td className="p-4 font-mono text-slate-700">{bid.maskedBidderId || `Bidder #${bid.bidderId.slice(-4)}`}</td>
                                  <td className={`p-4 font-black text-sm ${isDuplicate ? 'text-rose-600 line-through' : 'text-slate-900'}`}>{bid.amount.toFixed(1)} ETB</td>
                                  <td className="p-4 text-slate-500">{formatDate(bid.timestamp)}</td>
                                  <td className="p-4">
                                    {isWinner ? (
                                      <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-100 border border-emerald-300 px-3 py-1 rounded-full text-[11px] font-bold">
                                        <Trophy className="w-3 h-3 text-amber-500" /> Winner
                                      </span>
                                    ) : isDuplicate ? (
                                      <span className="inline-flex items-center gap-1 text-rose-700 bg-rose-100 border border-rose-300 px-3 py-1 rounded-full text-[11px] font-bold">
                                        <XCircle className="w-3 h-3" /> Duplicate
                                      </span>
                                    ) : (
                                      <span className="inline-flex items-center gap-1 text-blue-700 bg-blue-100 border border-blue-300 px-3 py-1 rounded-full text-[11px] font-bold">
                                        <CheckCircle className="w-3 h-3" /> Unique
                                      </span>
                                    )}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}

                {/* Bid form for active auctions */}
                {selectedAuction.status === 'active' && (
                  <div className="mt-6 grid gap-6">
                    <div className="rounded-3xl bg-white border border-slate-200 p-6 shadow-sm">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                        <p className="text-sm font-semibold text-slate-900">Place a bid</p>
                        <span className="inline-flex items-center rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                          {selectedAuction.minBid}–{selectedAuction.maxBid} ETB
                        </span>
                      </div>
                      {!currentUser ? (
                        <div className="mt-5 rounded-3xl bg-amber-50 border border-amber-200 p-4 text-sm text-amber-900">
                          <p className="font-semibold">Sign in to place a bid.</p>
                          <button type="button" onClick={() => nav(ROUTES.LOGIN)}
                            className="mt-3 inline-flex rounded-3xl bg-amber-500 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-400 transition">
                            Sign in
                          </button>
                        </div>
                      ) : (
                        <form onSubmit={handlePopupBid} className="mt-5 space-y-4">
                          <label className="block text-sm font-medium text-slate-700">Your bid amount</label>
                          <div className="flex flex-col gap-3 sm:flex-row">
                            <input type="number" min={selectedAuction.minBid} max={selectedAuction.maxBid} step="0.1"
                              value={bidAmount} onChange={e => setBidAmount(validateBidAmount(e.target.value))}
                              placeholder={`${selectedAuction.minBid} ETB`}
                              className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                            <button type="submit" disabled={bidSubmitState === 'loading'}
                              className="rounded-3xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-500 transition disabled:opacity-60 flex items-center justify-center gap-2">
                              {bidSubmitState === 'loading' ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Place bid'}
                            </button>
                          </div>

                          {/* Inline bid status */}
                          {bidSubmitState !== 'idle' && (
                            <div className={`flex items-center gap-3 p-3 rounded-2xl text-sm font-bold border ${
                              bidSubmitState === 'loading' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                              bidSubmitState === 'success' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' :
                              'bg-rose-50 text-rose-800 border-rose-200'
                            }`}>
                              {bidSubmitState === 'loading' && <Loader2 className="w-5 h-5 animate-spin shrink-0" />}
                              {bidSubmitState === 'success' && <CheckCircle className="w-5 h-5 shrink-0" />}
                              {bidSubmitState === 'error'   && <XCircle className="w-5 h-5 shrink-0" />}
                              <span>{bidSubmitText || (bidResult?.msg ?? '')}</span>
                            </div>
                          )}

                          <div className="grid gap-3 sm:grid-cols-2 text-sm text-slate-600">
                            {myLatestBid && <p>Your latest bid: {myLatestBid.amount.toFixed(1)} ETB</p>}
                          </div>
                        </form>
                      )}
                    </div>

                    <div className="rounded-3xl bg-slate-50 p-6 border border-slate-200 text-sm text-slate-700">
                      <h3 className="text-lg font-bold text-slate-900">Auction details</h3>
                      <p className="mt-3 text-sm text-slate-600">Bidding is live. Place your bid before the timer expires.</p>
                      <div className="mt-5 grid gap-3">
                        {[
                          { label: 'Category', value: selectedAuction.category },
                          { label: 'Starts', value: formatDate(selectedAuction.startTime) },
                          { label: 'Ends', value: formatDate(selectedAuction.endTime) },
                        ].map(item => (
                          <div key={item.label} className="rounded-2xl bg-white p-4 border border-slate-200">
                            <p className="text-xs uppercase tracking-[0.18em] text-slate-400">{item.label}</p>
                            <p className="font-semibold mt-2">{item.value}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Upcoming auction info */}
                {selectedAuction.status === 'upcoming' && (
                  <div className="mt-6 rounded-3xl bg-slate-50 p-6 border border-slate-200">
                    <h3 className="text-lg font-bold text-slate-900">Auction Details</h3>
                    <p className="text-sm text-slate-600 mt-3">Coming soon. Bidding opens when the countdown reaches zero.</p>
                    <div className="mt-5 grid gap-3 text-sm text-slate-700">
                      {[
                        { label: 'Category', value: selectedAuction.category },
                        { label: 'Expected start', value: formatDate(selectedAuction.startTime) },
                        { label: 'Expected closing', value: formatDate(selectedAuction.endTime) },
                      ].map(item => (
                        <div key={item.label} className="rounded-2xl bg-white p-4 border border-slate-200">
                          <p className="text-xs uppercase tracking-[0.18em] text-slate-400">{item.label}</p>
                          <p className="font-semibold mt-2">{item.value}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

            ) : (
              /* ── QUICK PREVIEW ──────────────────────────────────────── */
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6">
                <div className="space-y-4">
                  <div className="h-72 rounded-3xl overflow-hidden bg-slate-100">
                    <img src={selectedAuction.image} alt={selectedAuction.title}
                      className="w-full h-full object-cover"
                      onError={e => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=600&q=80'; }} />
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm text-slate-600">{selectedAuction.description}</p>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="rounded-3xl bg-slate-100 p-4 text-center">
                        <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Bid Per Cost</p>
                        <p className="text-sm font-bold text-slate-900 mt-2">{formatCurrency(selectedAuction.bidPerCost || selectedAuction.retailValue)}</p>
                      </div>
                      <div className="rounded-3xl bg-slate-100 p-4 text-center">
                        <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Bid Range</p>
                        <p className="text-sm font-bold text-blue-600 mt-2">{selectedAuction.minBid}–{selectedAuction.maxBid} ETB</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-5">
                  <div className="rounded-3xl bg-slate-900 p-6 text-white shadow-sm">
                    <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Auction Countdown</p>
                    <div className="mt-4">
                      <CountdownTimer endTime={selectedAuction.endTime} status={selectedAuction.status} />
                    </div>
                  </div>

                  {/* Live stats in quick-preview too */}
                  <StatsBlock />

                  {selectedAuction.status === 'active' ? (
                    <button type="button" onClick={() => setShowFullView(true)}
                      className="w-full rounded-3xl bg-blue-600 text-white py-3 text-sm font-semibold hover:bg-blue-500 transition">
                      View full auction &amp; Place Bid
                    </button>
                  ) : (
                    <div className={`rounded-2xl p-3 text-xs font-semibold text-center border ${
                      selectedAuction.status === 'paused'
                        ? 'bg-amber-50 text-amber-700 border-amber-200'
                        : selectedAuction.status === 'upcoming'
                        ? 'bg-blue-50 text-blue-700 border-blue-200'
                        : 'bg-slate-100 text-slate-500 border-slate-200'
                    }`}>
                      {selectedAuction.status === 'paused'   && '⏸ Bidding paused'}
                      {selectedAuction.status === 'upcoming' && "🕐 Not started yet"}
                      {selectedAuction.status === 'closed'   && '✓ Auction closed'}
                      {selectedAuction.status === 'draft'    && '📝 Not published'}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
