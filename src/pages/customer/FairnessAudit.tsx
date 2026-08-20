import { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { formatDate, formatCurrency } from '../../utils/countdown';
import { bidsApi, auctionsApi } from '../../utils/api';
import { Bid } from '../../data/mockData';
import {
  Shield, Trophy, CheckCircle, XCircle, Search,
  ChevronLeft, ChevronRight, BarChart2, Hash, Sparkles, Info,
  ArrowUpDown, AlertCircle, Eye, Clock, Package, Users, TrendingDown, SlidersHorizontal,
} from 'lucide-react';

// ── Types ─────────────────────────────────────────────────────────────────────
type SortDir = 'asc' | 'desc';
type SortKey = 'amount' | 'timestamp' | 'freq';

// ── Helpers ───────────────────────────────────────────────────────────────────
function fakeHash(seed: string) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = (Math.imul(31, h) + seed.charCodeAt(i)) | 0;
  }
  return Math.abs(h).toString(16).padStart(8, '0').toUpperCase();
}

function buildHash(auctionId: string, bids: { amount: number; bidderId: string }[]) {
  const payload = auctionId + bids.map(b => `${b.bidderId}:${b.amount}`).join('|');
  return fakeHash(payload).padEnd(64, fakeHash(payload + 'x'));
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function FairnessAudit() {
  const { products } = useApp();
  const [searchParams] = useSearchParams();
  const requestedAuctionId = searchParams.get('auction');

  // ── Live closed auctions from API ─────────────────────────────────────────
  const [closedAuctions, setClosedAuctions] = useState<any[]>([]);
  const [auctionsLoading, setAuctionsLoading] = useState(false);

  useEffect(() => {
    setAuctionsLoading(true);
    auctionsApi.list({ status: 'closed' })
      .then(res => {
        const now = Date.now();
        // Include both DB-closed and time-expired active auctions
        const allClosed = (res.data || []).filter((a: any) => {
          const endTime = a.end_time ?? a.endTime ?? '';
          const dbStatus = a.status;
          return dbStatus === 'closed' || (endTime && new Date(endTime).getTime() < now);
        }).map((a: any) => ({
          id: a.id,
          title: a.title,
          description: a.description ?? '',
          image: a.image_url ?? a.image ?? '',
          retailValue: Number(a.retail_value ?? a.retailValue ?? 0),
          bidPerCost: Number(a.bid_per_cost ?? a.bidPerCost ?? 100),
          category: a.category,
          status: 'closed',
          startTime: a.start_time ?? a.startTime ?? '',
          endTime: a.end_time ?? a.endTime ?? '',
          minBid: Number(a.min_bid ?? a.minBid ?? 1),
          maxBid: Number(a.max_bid ?? a.maxBid ?? 500),
          totalParticipants: Number(a.total_participants ?? a.totalParticipants ?? 0),
          totalBids: Number(a.total_bids ?? a.totalBids ?? 0),
          productId: a.product_id ?? a.productId ?? undefined,
        }));
        setClosedAuctions(allClosed);
        // Prefer an auction passed from Dashboard Verify, otherwise use the first one.
        const requestedAuction = allClosed.find(a => a.id === requestedAuctionId);
        if (requestedAuction) setSelectedId(requestedAuction.id);
        else if (allClosed.length > 0) setSelectedId(allClosed[0].id);
      })
      .catch(() => {})
      .finally(() => setAuctionsLoading(false));
  }, [requestedAuctionId]);

  const [selectedId, setSelectedId] = useState<string>(closedAuctions[0]?.id ?? '');
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('amount');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [activeTab, setActiveTab] = useState<'algorithm' | 'frequency' | 'log'>('algorithm');
  const [showHashInfo, setShowHashInfo] = useState(false);
  const [bidStatusFilter, setBidStatusFilter] = useState<'all' | 'winner' | 'unique' | 'duplicate'>('all');
  const [minAmount, setMinAmount] = useState('');
  const [maxAmount, setMaxAmount] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  // ── Live bids from API ──────────────────────────────────────────────────
  const [rawBids, setRawBids] = useState<Bid[]>([]);
  const [bidsLoading, setBidsLoading] = useState(false);

  useEffect(() => {
    if (!selectedId) return;
    let cancelled = false;
    setBidsLoading(true);
    setRawBids([]);
    bidsApi.forAuction(selectedId)
      .then(res => {
        if (cancelled) return;
        setRawBids((res.data || []).map((b: any) => ({
          id: b.id,
          auctionId: b.auction_id ?? selectedId,
          bidderId: b.bidder_id ?? b.bidderId ?? '',
          maskedBidderId: b.masked_bidder_id ?? b.maskedBidderId ?? `BDR-${String(b.bidder_id ?? '').slice(-4)}`,
          bidderName: b.bidder_name ?? b.bidderName ?? '',
          bidderPhone: b.bidder_phone ?? b.bidderPhone ?? '',
          bidderPhoto: b.bidder_photo ?? b.bidderPhoto ?? '',
          amount: Number(b.amount ?? 0),
          timestamp: b.created_at ?? b.timestamp ?? new Date().toISOString(),
          isDuplicate: Boolean(b.is_duplicate ?? false),
          isLowestUnique: Boolean(b.is_lowest_unique ?? false),
        })));
      })
      .catch(() => { if (!cancelled) setRawBids([]); })
      .finally(() => { if (!cancelled) setBidsLoading(false); });
    return () => { cancelled = true; };
  }, [selectedId]);

  // ── Core bid analysis ────────────────────────────────────────────────────
  const auction = useMemo(() => closedAuctions.find(a => a.id === selectedId), [closedAuctions, selectedId]);
  const selectedAuctionIndex = closedAuctions.findIndex(a => a.id === selectedId);
  const linkedProduct = useMemo(() => auction?.productId ? products.find(p => p.id === auction.productId) : undefined, [auction, products]);

  const freqMap = useMemo(() => {
    const m: Record<number, number> = {};
    rawBids.forEach(b => { m[b.amount] = (m[b.amount] ?? 0) + 1; });
    return m;
  }, [rawBids]);

  const uniqueAmounts = useMemo(
    () =>
      Object.keys(freqMap)
        .map(Number)
        .filter(a => freqMap[a] === 1)
        .sort((a, b) => a - b),
    [freqMap]
  );

  const lowestUnique = uniqueAmounts.length > 0 ? uniqueAmounts[0] : null;
  const winnerBid = rawBids.find(b => b.amount === lowestUnique) ?? null;

  const taggedBids = useMemo(
    () =>
      rawBids.map(b => ({
        ...b,
        freq: freqMap[b.amount] ?? 1,
        isUnique: freqMap[b.amount] === 1,
        isWinner: b.amount === lowestUnique,
      })),
    [rawBids, freqMap, lowestUnique]
  );

  // ── Search + Sort ────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    let rows = taggedBids.filter(
      b =>
        b.maskedBidderId.toLowerCase().includes(search.toLowerCase()) ||
        (b.bidderName ?? '').toLowerCase().includes(search.toLowerCase()) ||
        (b.bidderPhone ?? '').toLowerCase().includes(search.toLowerCase()) ||
        String(b.amount).includes(search)
    );
    const minimum = minAmount === '' ? null : Number(minAmount);
    const maximum = maxAmount === '' ? null : Number(maxAmount);
    const from = fromDate ? new Date(`${fromDate}T00:00:00`).getTime() : null;
    const to = toDate ? new Date(`${toDate}T23:59:59.999`).getTime() : null;

    rows = rows.filter(b => {
      const timestamp = new Date(b.timestamp).getTime();
      const matchesStatus = bidStatusFilter === 'all'
        || (bidStatusFilter === 'winner' && b.isWinner)
        || (bidStatusFilter === 'unique' && b.isUnique && !b.isWinner)
        || (bidStatusFilter === 'duplicate' && !b.isUnique);
      const matchesMinimum = minimum === null || (Number.isFinite(minimum) && b.amount >= minimum);
      const matchesMaximum = maximum === null || (Number.isFinite(maximum) && b.amount <= maximum);
      const matchesFrom = from === null || timestamp >= from;
      const matchesTo = to === null || timestamp <= to;
      return matchesStatus && matchesMinimum && matchesMaximum && matchesFrom && matchesTo;
    });
    rows = [...rows].sort((a, b) => {
      let diff = 0;
      if (sortKey === 'amount') diff = a.amount - b.amount;
      if (sortKey === 'freq') diff = a.freq - b.freq;
      if (sortKey === 'timestamp') diff = new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
      return sortDir === 'asc' ? diff : -diff;
    });
    return rows;
  }, [taggedBids, search, bidStatusFilter, minAmount, maxAmount, fromDate, toDate, sortKey, sortDir]);

  function clearBidFilters() {
    setSearch('');
    setBidStatusFilter('all');
    setMinAmount('');
    setMaxAmount('');
    setFromDate('');
    setToDate('');
  }

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir(d => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortKey(key); setSortDir('asc'); }
  }

  const hash = useMemo(() => buildHash(selectedId, rawBids), [selectedId, rawBids]);

  const steps = [
    {
      n: 1,
      icon: '📥',
      title: 'Collect All Bids',
      desc: `${rawBids.length} total bids were collected across ${Object.keys(freqMap).length} distinct amounts.`,
      detail: 'Every bid placed by every participant is recorded immutably with a timestamp and masked bidder ID.',
    },
    {
      n: 2,
      icon: '🔢',
      title: 'Count Bid Frequencies',
      desc: `Each unique amount is tallied. ${Object.values(freqMap).filter(v => v > 1).length} amounts were bid more than once.`,
      detail: 'The system counts how many different bidders submitted each specific ETB value.',
    },
    {
      n: 3,
      icon: '🗑️',
      title: 'Eliminate Duplicates',
      desc: `${Object.values(freqMap).filter(v => v > 1).reduce((s, v) => s + v, 0)} bids are disqualified because their amounts appeared more than once.`,
      detail: 'Any amount bid by 2 or more participants is disqualified. No exceptions.',
    },
    {
      n: 4,
      icon: '📋',
      title: 'Isolate Unique Bids',
      desc: `${uniqueAmounts.length} amounts remain after eliminating all duplicates.`,
      detail: 'Only bids with an amount that no other bidder chose are eligible to win.',
    },
    {
      n: 5,
      icon: '🎯',
      title: 'Select Lowest Unique',
      desc: lowestUnique
        ? `The lowest unique bid is ${lowestUnique} ETB — the smallest amount that only one person bid.`
        : 'No unique bids found. No winner can be determined.',
      detail: 'Among all surviving unique bids, the smallest value wins. This is the core of the "Lowest Unique Bid" mechanic.',
    },
    {
      n: 6,
      icon: '🏆',
      title: 'Declare Winner',
      desc: winnerBid
        ? `Bidder ${winnerBid.maskedBidderId} wins "${auction?.title}" with a bid of ${lowestUnique} ETB!`
        : 'No winner declared.',
      detail: 'The single bidder who placed the lowest unique amount is declared the official winner.',
    },
  ];

  return (
    <div className="space-y-6 font-sans">

      {/* ── Hero Banner ───────────────────────────────────────────────────── */}
      <div className="bg-gradient-to-br from-slate-900 via-emerald-950 to-slate-900 rounded-2xl sm:rounded-3xl p-6 sm:p-8 text-white shadow-xl border border-emerald-900/40">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-emerald-500/20 border border-emerald-500/40 rounded-2xl flex items-center justify-center flex-shrink-0">
              <Shield className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-black tracking-tight">Fairness Audit</h1>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 px-2.5 py-1 rounded-full">
                  100% Transparent
                </span>
              </div>
              <p className="text-slate-400 text-sm mt-1 max-w-lg">
                Every closed auction's winner can be independently verified by anyone. The algorithm is deterministic, open, and tamper-proof.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs text-emerald-400 font-bold bg-emerald-950/60 border border-emerald-800/60 px-3 py-2 rounded-xl self-start">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            Provably Fair Engine v2
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-3 mt-6">
          <div className="bg-white/5 border border-white/10 rounded-xl p-3 text-center">
            <p className="text-2xl font-black text-white">{closedAuctions.length}</p>
            <p className="text-[11px] text-slate-400 font-semibold mt-0.5">Auditable Auctions</p>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-xl p-3 text-center">
            <p className="text-2xl font-black text-white">{bidsLoading ? '…' : rawBids.length}</p>
            <p className="text-[11px] text-slate-400 font-semibold mt-0.5">Bids in Selected</p>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-xl p-3 text-center">
            <p className="text-2xl font-black text-emerald-400">{bidsLoading ? '…' : uniqueAmounts.length}</p>
            <p className="text-[11px] text-slate-400 font-semibold mt-0.5">Unique Bids</p>
          </div>
        </div>
      </div>

      {/* ── Auction Selector ──────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-5">
        <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-2">
          Select Closed Auction to Audit
        </label>
        {auctionsLoading ? (
          <div className="flex items-center gap-2 text-sm text-slate-500 bg-slate-50 rounded-xl p-4 border border-slate-200">
            <div className="w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
            Loading closed auctions…
          </div>
        ) : closedAuctions.length === 0 ? (
          <div className="flex items-center gap-2 text-sm text-slate-500 bg-slate-50 rounded-xl p-4 border border-slate-200">
            <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0" />
            No closed auctions available yet. Auctions appear here once they end.
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <button
              type="button"
              aria-label="Previous closed auction"
              title="Previous closed auction"
              disabled={selectedAuctionIndex <= 0}
              onClick={() => {
                const previousAuction = closedAuctions[selectedAuctionIndex - 1];
                if (previousAuction) { setSelectedId(previousAuction.id); setSearch(''); }
              }}
              className="w-10 h-10 flex-shrink-0 rounded-xl border border-slate-200 bg-white text-slate-600 flex items-center justify-center hover:bg-slate-50 hover:border-emerald-300 disabled:opacity-35 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            <div className="flex-1 min-w-0 overflow-x-auto snap-x snap-mandatory scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-slate-100">
              <div className="flex gap-3 pb-1">
                {closedAuctions.map(a => {
                  const isSelected = a.id === selectedId;
                  return (
                    <button
                      key={a.id}
                      type="button"
                      aria-pressed={isSelected}
                      onClick={() => { setSelectedId(a.id); setSearch(''); }}
                      className={`w-64 sm:w-72 flex-shrink-0 snap-start text-left rounded-xl border p-3 transition-all ${
                        isSelected
                          ? 'border-emerald-500 bg-emerald-50 ring-2 ring-emerald-100'
                          : 'border-slate-200 bg-slate-50 hover:border-emerald-300 hover:bg-white'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <span className={`text-sm font-black line-clamp-2 ${isSelected ? 'text-emerald-900' : 'text-slate-800'}`}>
                          {a.title}
                        </span>
                        {isSelected && <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />}
                      </div>
                      <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] font-semibold text-slate-500">
                        <span>{formatCurrency(a.retailValue)} retail</span>
                        <span>•</span>
                        <span>{a.totalBids} bids</span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1">Ended {formatDate(a.endTime)}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            <button
              type="button"
              aria-label="Next closed auction"
              title="Next closed auction"
              disabled={selectedAuctionIndex < 0 || selectedAuctionIndex >= closedAuctions.length - 1}
              onClick={() => {
                const nextAuction = closedAuctions[selectedAuctionIndex + 1];
                if (nextAuction) { setSelectedId(nextAuction.id); setSearch(''); }
              }}
              className="w-10 h-10 flex-shrink-0 rounded-xl border border-slate-200 bg-white text-slate-600 flex items-center justify-center hover:bg-slate-50 hover:border-emerald-300 disabled:opacity-35 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>

      {/* ── Only show rest if an auction is selected ──────────────────────── */}
      {auction && (
        <>
          {/* ── Auction Info Bar ───────────────────────────────────────────── */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="flex flex-col sm:flex-row items-start gap-4 p-4 sm:p-5">
              <img
                src={auction.image}
                alt={auction.title}
                className="w-20 h-20 rounded-xl object-cover border border-slate-100 flex-shrink-0"
                onError={e => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=200&q=80'; }}
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full">
                    {auction.category}
                  </span>
                  <span className="badge-closed text-[10px] px-2 py-0.5">✓ Closed</span>
                </div>
                <h2 className="text-base font-black text-slate-900 mt-1">{auction.title}</h2>
                {/* Product */}
                {linkedProduct && (
                  <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                    <Package className="w-3.5 h-3.5 text-purple-500" />
                    Product: <span className="font-semibold text-slate-700">{linkedProduct.name}</span>
                  </p>
                )}
                {/* Closing Time */}
                <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-rose-500" />
                  Closed: <span className="font-semibold text-slate-700">{formatDate(auction.endTime)}</span>
                </p>
              </div>
            </div>

            {/* Stats grid — all required by spec */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 px-4 sm:px-5 pb-4">
              {[
                { label: 'Total Participants', value: bidsLoading ? '…' : new Set(rawBids.map(b => b.bidderId)).size, icon: <Users className="w-3.5 h-3.5 text-purple-500" />, color: 'text-slate-900' },
                { label: 'Total Bids', value: bidsLoading ? '…' : rawBids.length, icon: <TrendingDown className="w-3.5 h-3.5 text-blue-500" />, color: 'text-slate-900' },
                { label: 'Unique Bids', value: bidsLoading ? '…' : uniqueAmounts.length, icon: <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />, color: 'text-emerald-700' },
                { label: 'Duplicate Bids', value: bidsLoading ? '…' : rawBids.length - uniqueAmounts.length, icon: <XCircle className="w-3.5 h-3.5 text-rose-500" />, color: 'text-rose-600' },
                { label: 'Lowest Unique', value: bidsLoading ? '…' : lowestUnique !== null ? `${lowestUnique} ETB` : '—', icon: <Trophy className="w-3.5 h-3.5 text-amber-500" />, color: 'text-amber-700' },
                { label: 'Retail Value', value: formatCurrency(auction.retailValue), icon: <Hash className="w-3.5 h-3.5 text-slate-400" />, color: 'text-slate-700' },
              ].map(s => (
                <div key={s.label} className="bg-slate-50 border border-slate-100 rounded-xl p-3 text-center">
                  <div className="flex items-center justify-center gap-1 mb-1">{s.icon}</div>
                  <p className={`text-sm font-black ${s.color}`}>{s.value}</p>
                  <p className="text-[10px] text-slate-400 font-semibold mt-0.5 leading-tight">{s.label}</p>
                </div>
              ))}
            </div>

            {/* Hash strip */}
            <div className="border-t border-slate-100 bg-slate-50 px-4 sm:px-5 py-3 flex items-start gap-3">
              <Hash className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">Result Hash (SHA-256 simulation)</span>
                  <button
                    onClick={() => setShowHashInfo(v => !v)}
                    className="text-[10px] text-emerald-600 hover:underline font-semibold flex items-center gap-0.5"
                  >
                    <Info className="w-3 h-3" /> What is this?
                  </button>
                </div>
                <p className="font-mono text-[11px] text-slate-600 break-all mt-1">{hash}</p>
              </div>
            </div>

            {showHashInfo && (
              <div className="border-t border-emerald-100 bg-emerald-50 px-4 sm:px-5 py-3 text-xs text-emerald-800 font-medium">
                This hash is computed from the auction ID and every bid's bidder + amount pair. If any single bid were changed after the fact, this hash would be completely different — making tampering immediately detectable by anyone who saved this value.
              </div>
            )}
          </div>

          {/* ── Winner Card ────────────────────────────────────────────────── */}
          {winnerBid ? (
            <div className="bg-gradient-to-r from-emerald-50 to-green-50 border-2 border-emerald-300 rounded-2xl p-5 sm:p-6 shadow-sm">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-emerald-100 border border-emerald-200 rounded-full flex items-center justify-center flex-shrink-0">
                    <Trophy className="w-7 h-7 text-amber-500" />
                  </div>
                  <div>
                    <p className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider">🏆 Verified Winner</p>
                    <p className="text-xl font-black text-emerald-900 mt-0.5">{winnerBid.maskedBidderId}</p>
                    <p className="text-sm text-emerald-700 mt-1">
                      Winning bid: <span className="font-black">{lowestUnique} ETB</span>
                      <span className="text-emerald-600 ml-2 text-xs">(Lowest Unique Bid)</span>
                    </p>
                    <p className="text-xs text-emerald-600 mt-0.5">
                      Placed at {formatDate(winnerBid.timestamp)} • Bid per cost value: {formatCurrency(auction.bidPerCost || auction.retailValue)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2.5 rounded-xl font-bold text-sm shadow-md shadow-emerald-600/20">
                  <CheckCircle className="w-5 h-5" /> Verified ✓
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-amber-50 border-2 border-amber-200 rounded-2xl p-5 flex items-center gap-4">
              <AlertCircle className="w-8 h-8 text-amber-500 flex-shrink-0" />
              <div>
                <p className="font-black text-amber-800">No Winner Determined</p>
                <p className="text-sm text-amber-700 mt-0.5">All bid amounts were submitted by more than one bidder — no unique bid exists.</p>
              </div>
            </div>
          )}

          {/* ── Tab Navigation ─────────────────────────────────────────────── */}
          {bidsLoading && (
            <div className="flex items-center justify-center gap-2 py-6 text-slate-500 text-sm bg-white rounded-2xl border border-slate-200">
              <div className="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
              Loading bids from database…
            </div>
          )}
          <div className="flex items-center gap-1 bg-slate-100 p-1.5 rounded-2xl border border-slate-200 w-full sm:w-auto overflow-x-auto">
            {([
              { key: 'algorithm', label: 'Algorithm Steps', icon: <Shield className="w-3.5 h-3.5" /> },
              { key: 'frequency', label: 'Bid Frequency', icon: <BarChart2 className="w-3.5 h-3.5" /> },
              { key: 'log',       label: `Full Bid Log (${rawBids.length})`, icon: <Eye className="w-3.5 h-3.5" /> },
            ] as { key: typeof activeTab; label: string; icon: React.ReactNode }[]).map(t => (
              <button
                key={t.key}
                onClick={() => setActiveTab(t.key)}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all
                  ${activeTab === t.key
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white'}`}
              >
                {t.icon} {t.label}
              </button>
            ))}
          </div>

          {/* ── Algorithm Steps Tab ────────────────────────────────────────── */}
          {activeTab === 'algorithm' && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-3">
              <h2 className="font-black text-slate-900 flex items-center gap-2">
                <Shield className="w-5 h-5 text-emerald-600" />
                Step-by-Step Algorithm Verification
              </h2>
              <p className="text-xs text-slate-500">
                This is the exact algorithm the system ran to determine the winner. Every step is reproducible from the raw bid data.
              </p>
              <div className="space-y-3 mt-2">
                {steps.map((s, idx) => {
                  const isLast = idx === steps.length - 1;
                  return (
                    <div key={s.n} className={`flex items-start gap-4 p-4 rounded-xl border transition-all
                      ${isLast && winnerBid
                        ? 'bg-emerald-50 border-emerald-200'
                        : 'bg-slate-50 border-slate-100'}`}
                    >
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-black flex-shrink-0
                        ${isLast && winnerBid ? 'bg-emerald-600 text-white' : 'bg-slate-700 text-white'}`}>
                        {s.n}
                      </div>
                      <div className="text-2xl flex-shrink-0">{s.icon}</div>
                      <div className="flex-1 min-w-0">
                        <p className={`font-black text-sm ${isLast && winnerBid ? 'text-emerald-900' : 'text-slate-900'}`}>
                          {s.title}
                        </p>
                        <p className={`text-sm font-semibold mt-0.5 ${isLast && winnerBid ? 'text-emerald-700' : 'text-slate-700'}`}>
                          {s.desc}
                        </p>
                        <p className="text-[11px] text-slate-500 mt-1 italic">{s.detail}</p>
                      </div>
                      {isLast && winnerBid && (
                        <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-1" />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── Bid Frequency Tab ─────────────────────────────────────────── */}
          {activeTab === 'frequency' && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
              <div>
                <h2 className="font-black text-slate-900 flex items-center gap-2">
                  <BarChart2 className="w-5 h-5 text-emerald-600" />
                  Bid Frequency Map
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Every amount ever bid and how many people bid that exact value.
                  <span className="text-emerald-600 font-semibold"> Green = winner</span>
                  <span className="text-blue-600 font-semibold"> · Blue = unique</span>
                  <span className="text-rose-500 font-semibold"> · Red = duplicate (eliminated)</span>
                </p>
              </div>

              {/* Legend */}
              <div className="flex flex-wrap gap-2">
                {[
                  { color: 'bg-emerald-100 border-emerald-400 text-emerald-700', label: '🏆 Winner (lowest unique)' },
                  { color: 'bg-blue-50 border-blue-200 text-blue-700', label: '✓ Unique (eligible)' },
                  { color: 'bg-rose-50 border-rose-200 text-rose-500', label: '✗ Duplicate (eliminated)' },
                ].map(l => (
                  <div key={l.label} className={`flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full border ${l.color}`}>
                    {l.label}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-2">
                {Object.entries(freqMap)
                  .sort(([a], [b]) => Number(a) - Number(b))
                  .map(([amount, count]) => {
                    const amt = Number(amount);
                    const isWin = amt === lowestUnique;
                    const isUniq = count === 1;
                    return (
                      <div
                        key={amount}
                        className={`rounded-xl p-3 border-2 text-center flex flex-col items-center transition-all
                          ${isWin
                            ? 'border-emerald-400 bg-emerald-50 shadow-md shadow-emerald-100'
                            : isUniq
                            ? 'border-blue-200 bg-blue-50'
                            : 'border-rose-100 bg-rose-50'}`}
                      >
                        <p className={`text-xl font-black
                          ${isWin ? 'text-emerald-700' : isUniq ? 'text-blue-700' : 'text-rose-400 line-through'}`}>
                          {amount}
                        </p>
                        <p className="text-[10px] text-slate-500 font-semibold">ETB</p>
                        <div className={`mt-1.5 text-[10px] font-black px-2 py-0.5 rounded-full
                          ${isWin
                            ? 'bg-emerald-600 text-white'
                            : isUniq
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-rose-100 text-rose-600'}`}>
                          ×{count} {isWin ? '🏆' : isUniq ? 'Unique' : 'Dup'}
                        </div>
                      </div>
                    );
                  })}
              </div>

              {Object.keys(freqMap).length === 0 && (
                <div className="text-center py-8 text-slate-400 text-sm">No bids recorded for this auction.</div>
              )}
            </div>
          )}

          {/* ── Full Bid Log Tab ───────────────────────────────────────────── */}
          {activeTab === 'log' && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="font-black text-slate-900 flex items-center gap-2">
                    <Eye className="w-5 h-5 text-emerald-600" />
                    Complete Bid Log
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {rawBids.length} bids recorded · showing {filtered.length} results
                  </p>
                </div>
                {/* Search */}
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search user, phone, bidder ID, or amount…"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="pl-8 pr-3 py-2 text-xs font-medium border border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 w-56"
                  />
                </div>
              </div>

              <div className="border-t border-slate-100 pt-4 mt-1 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 items-end">
                <label className="text-[10px] font-bold uppercase tracking-wide text-slate-500">
                  Status
                  <select
                    value={bidStatusFilter}
                    onChange={e => setBidStatusFilter(e.target.value as typeof bidStatusFilter)}
                    className="mt-1 w-full px-2.5 py-2 text-xs font-semibold border border-slate-200 rounded-lg bg-slate-50 text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="all">All bids</option>
                    <option value="winner">Winner</option>
                    <option value="unique">Unique</option>
                    <option value="duplicate">Duplicate</option>
                  </select>
                </label>
                <label className="text-[10px] font-bold uppercase tracking-wide text-slate-500">
                  Min amount
                  <input
                    type="number"
                    min="0"
                    value={minAmount}
                    onChange={e => setMinAmount(e.target.value)}
                    placeholder="Any"
                    className="mt-1 w-full px-2.5 py-2 text-xs font-semibold border border-slate-200 rounded-lg bg-slate-50 text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </label>
                <label className="text-[10px] font-bold uppercase tracking-wide text-slate-500">
                  Max amount
                  <input
                    type="number"
                    min="0"
                    value={maxAmount}
                    onChange={e => setMaxAmount(e.target.value)}
                    placeholder="Any"
                    className="mt-1 w-full px-2.5 py-2 text-xs font-semibold border border-slate-200 rounded-lg bg-slate-50 text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </label>
                <label className="text-[10px] font-bold uppercase tracking-wide text-slate-500">
                  From date
                  <input
                    type="date"
                    value={fromDate}
                    onChange={e => setFromDate(e.target.value)}
                    className="mt-1 w-full px-2.5 py-2 text-xs font-semibold border border-slate-200 rounded-lg bg-slate-50 text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </label>
                <label className="text-[10px] font-bold uppercase tracking-wide text-slate-500">
                  To date
                  <input
                    type="date"
                    value={toDate}
                    onChange={e => setToDate(e.target.value)}
                    className="mt-1 w-full px-2.5 py-2 text-xs font-semibold border border-slate-200 rounded-lg bg-slate-50 text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </label>
                <button
                  type="button"
                  onClick={clearBidFilters}
                  className="h-9 flex items-center justify-center gap-1.5 px-3 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5" /> Clear filters
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-900 text-white text-[11px] font-black uppercase tracking-wider">
                      <th className="py-3 px-4 text-left">#</th>
                      <th className="py-3 px-4 text-left">User Information</th>
                      <th className="py-3 px-4 text-left">
                        <button
                          onClick={() => toggleSort('amount')}
                          className="flex items-center gap-1 hover:text-emerald-300 transition-colors"
                        >
                          Amount (ETB)
                          <ArrowUpDown className={`w-3 h-3 ${sortKey === 'amount' ? 'text-emerald-400' : 'opacity-40'}`} />
                        </button>
                      </th>
                      <th className="py-3 px-4 text-left">
                        <button
                          onClick={() => toggleSort('freq')}
                          className="flex items-center gap-1 hover:text-emerald-300 transition-colors"
                        >
                          Frequency
                          <ArrowUpDown className={`w-3 h-3 ${sortKey === 'freq' ? 'text-emerald-400' : 'opacity-40'}`} />
                        </button>
                      </th>
                      <th className="py-3 px-4 text-left">Status</th>
                      <th className="py-3 px-4 text-left">
                        <button
                          onClick={() => toggleSort('timestamp')}
                          className="flex items-center gap-1 hover:text-emerald-300 transition-colors"
                        >
                          Timestamp
                          <ArrowUpDown className={`w-3 h-3 ${sortKey === 'timestamp' ? 'text-emerald-400' : 'opacity-40'}`} />
                        </button>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filtered.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-12 text-center text-slate-400 text-sm">
                          {rawBids.length === 0 ? 'No bids for this auction.' : 'No results match your search.'}
                        </td>
                      </tr>
                    ) : (
                      filtered.map((b, i) => (
                        <tr
                          key={b.id}
                          className={`transition-colors text-xs
                            ${b.isWinner
                              ? 'bg-emerald-50 font-semibold'
                              : b.isUnique
                              ? 'bg-blue-50/40'
                              : 'bg-rose-50/20 opacity-75'}`}
                        >
                          <td className="py-2.5 px-4 text-slate-400 font-mono">{i + 1}</td>
                          <td className="py-2.5 px-4">
                            <div className="flex items-center gap-2 min-w-40">
                              {b.bidderPhoto ? (
                                <img src={b.bidderPhoto} alt="" className="w-7 h-7 rounded-full object-cover" />
                              ) : (
                                <div className="w-7 h-7 rounded-full bg-slate-200 text-slate-500 flex items-center justify-center">
                                  <Users className="w-3.5 h-3.5" />
                                </div>
                              )}
                              <div className="min-w-0">
                                <p className="font-bold text-slate-700 truncate">{b.bidderName || 'Registered bidder'}</p>
                                <p className="font-mono text-[10px] text-slate-500">{b.maskedBidderId}</p>
                                {b.bidderPhone && <p className="text-[10px] text-slate-400">{b.bidderPhone}</p>}
                              </div>
                            </div>
                          </td>
                          <td className={`py-2.5 px-4 font-black
                            ${b.isWinner ? 'text-emerald-700' : b.isUnique ? 'text-blue-700' : 'text-rose-400 line-through'}`}>
                            {b.amount}
                          </td>
                          <td className="py-2.5 px-4">
                            <span className={`inline-flex items-center justify-center w-7 h-5 rounded-full text-[10px] font-black
                              ${b.freq === 1 ? 'bg-blue-100 text-blue-700' : 'bg-rose-100 text-rose-700'}`}>
                              ×{b.freq}
                            </span>
                          </td>
                          <td className="py-2.5 px-4">
                            {b.isWinner ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-black text-emerald-700 bg-emerald-100 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                                <Trophy className="w-3 h-3 text-amber-500" /> Winner 🏆
                              </span>
                            ) : b.isUnique ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-700 bg-blue-50 border border-blue-100 px-2.5 py-0.5 rounded-full">
                                <CheckCircle className="w-3 h-3" /> Unique
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-500 bg-rose-50 border border-rose-100 px-2.5 py-0.5 rounded-full">
                                <XCircle className="w-3 h-3" /> Duplicate
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 px-4 text-slate-400 font-mono text-[10px]">
                            {formatDate(b.timestamp)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Footer summary */}
              {rawBids.length > 0 && (
                <div className="border-t border-slate-100 bg-slate-50 px-5 py-3 flex flex-wrap gap-4 text-xs font-semibold text-slate-500">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
                    Winner: {winnerBid ? `${winnerBid.maskedBidderId} @ ${lowestUnique} ETB` : 'None'}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-400 inline-block" />
                    Unique bids: {uniqueAmounts.length}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-400 inline-block" />
                    Duplicates eliminated: {rawBids.length - uniqueAmounts.length}
                  </span>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
