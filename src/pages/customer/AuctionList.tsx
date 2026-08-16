import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { ROUTES } from '../../utils/routes';
import AuctionCard from '../../components/AuctionCard';
import CountdownTimer from '../../components/CountdownTimer';
import { formatCurrency, formatDate } from '../../utils/countdown';
import { Auction, Bid } from '../../data/mockData';
import { bidsApi } from '../../utils/api';
import {
  Search, X, Trophy, CheckCircle, XCircle, Loader2,
  Gavel, Users, TrendingDown, Zap, Clock, Tag, Filter,
  ArrowRight, Sparkles, LayoutGrid, List
} from 'lucide-react';

const STATUS_OPTS = ['all', 'active', 'upcoming', 'paused', 'closed'] as const;
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

const STATUS_META: Record<string, { label: string; color: string; dot: string; badge: string }> = {
  all:      { label: 'All',     color: 'from-violet-600 to-indigo-600',  dot: 'bg-violet-400',             badge: 'bg-violet-100 text-violet-700' },
  active:   { label: 'Live',    color: 'from-emerald-500 to-teal-600',   dot: 'bg-emerald-400 animate-pulse', badge: 'bg-emerald-100 text-emerald-700' },
  upcoming: { label: 'Soon',    color: 'from-blue-500 to-cyan-600',      dot: 'bg-blue-400',               badge: 'bg-blue-100 text-blue-700' },
  paused:   { label: 'Paused',  color: 'from-amber-500 to-orange-500',   dot: 'bg-amber-400',              badge: 'bg-amber-100 text-amber-700' },
  closed:   { label: 'Ended',   color: 'from-slate-500 to-slate-700',    dot: 'bg-slate-400',              badge: 'bg-slate-100 text-slate-600' },
};

export default function AuctionList() {
  const { auctions, currentUser, placeBid } = useApp();
  const nav = useNavigate();

  const [search, setSearch]                 = useState('');
  const [statusFilter, setStatusFilter]     = useState<StatusOpt>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [viewMode, setViewMode]             = useState<'grid' | 'list'>('grid');
  const categories = ['all', ...Array.from(new Set(auctions.map(a => a.category)))];

  const [selectedAuction, setSelectedAuction] = useState<Auction | null>(null);
  const [bidAmount, setBidAmount]   = useState('');
  const [bidResult, setBidResult]   = useState<{ ok: boolean; msg: string } | null>(null);
  const [bidSubmitState, setBidSubmitState] = useState<'idle'|'loading'|'success'|'error'>('idle');
  const [bidSubmitText, setBidSubmitText]   = useState('');
  const modalRef = useRef<HTMLDivElement>(null);

  // ── Live bid data ─────────────────────────────────────────────────────────
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

  // ── Computed stats ────────────────────────────────────────────────────────
  const bidCounts = auctionBids.reduce<Record<number, number>>((acc, b) => {
    acc[b.amount] = (acc[b.amount] ?? 0) + 1;
    return acc;
  }, {});
  const uniqueAmounts = Array.from(new Set(auctionBids.map(b => b.amount)))
    .filter(amt => bidCounts[amt] === 1)
    .sort((a, b) => a - b);
  const lowestUnique = uniqueAmounts[0] ?? null;
  const winningBid   = lowestUnique !== null ? auctionBids.find(b => b.amount === lowestUnique) : undefined;
  const participantCount = new Set(auctionBids.map(b => b.bidderId)).size;
  const myLatestBid  = currentUser
    ? [...auctionBids].filter(b => b.bidderId === currentUser.id)
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0]
    : undefined;

  // ── Bid handler ───────────────────────────────────────────────────────────
  function handlePopupBid(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedAuction) return;
    if (selectedAuction.status !== 'active') {
      setBidResult({ ok: false, msg: 'This auction is not currently active.' });
      return;
    }
    const amount = Number(bidAmount);
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
        setBidResult({ ok: true, msg: `Bid placed! ${selectedAuction.bidPerCost ?? 100} ETB fee deducted from your wallet.` });
        setBidAmount('');
        bidsApi.forAuction(selectedAuction.id)
          .then(res => setAuctionBids((res.data || []).map((b: any) => ({
            id: b.id, auctionId: b.auction_id ?? selectedAuction.id,
            bidderId: b.bidder_id ?? '', maskedBidderId: b.masked_bidder_id ?? '',
            amount: Number(b.amount ?? 0), timestamp: b.created_at ?? new Date().toISOString(),
            isDuplicate: Boolean(b.is_duplicate), isLowestUnique: Boolean(b.is_lowest_unique),
          })))).catch(() => {});
      } else {
        setBidSubmitState('error');
        setBidSubmitText('Bid failed');
        setBidResult({ ok: false, msg: 'Unable to place bid. Check your wallet balance.' });
      }
      window.setTimeout(() => { setBidSubmitState('idle'); setBidSubmitText(''); setBidResult(null); }, 1800);
    }, 700);
  }

  // ── Filter logic ─────────────────────────────────────────────────────────
  const filtered = auctions.filter(a => {
    const q = search.toLowerCase();
    return (
      (a.title.toLowerCase().includes(q) || a.category.toLowerCase().includes(q)) &&
      (statusFilter === 'all' || a.status === statusFilter) &&
      (selectedCategory === 'all' || a.category === selectedCategory)
    );
  });

  const liveCount     = auctions.filter(a => a.status === 'active').length;
  const upcomingCount = auctions.filter(a => a.status === 'upcoming').length;
  const pausedCount   = auctions.filter(a => a.status === 'paused').length;
  const closedCount   = auctions.filter(a => a.status === 'closed').length;

  function closeModal() {
    setSelectedAuction(null);
    setBidAmount('');
    setBidResult(null);
    setBidSubmitState('idle');
  }

  return (
    <div className="min-h-screen space-y-6 font-sans pb-10">

      {/* ── HERO HEADER ─────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 p-6 sm:p-8 shadow-2xl border border-white/5">
        {/* Decorative blobs */}
        <div className="pointer-events-none absolute -top-20 -right-20 w-72 h-72 rounded-full bg-indigo-600/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-12 -left-12 w-56 h-56 rounded-full bg-violet-600/20 blur-3xl" />

        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-xl bg-indigo-500/30 border border-indigo-400/30 flex items-center justify-center">
                <Gavel className="w-4 h-4 text-indigo-300" />
              </div>
              <span className="text-indigo-300 text-xs font-bold uppercase tracking-[0.15em]">Live Auction Platform</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white leading-tight">
              Browse <span className="bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">Auctions</span>
            </h1>
            <p className="text-slate-400 text-sm mt-1 font-medium">
              {filtered.length} auction{filtered.length !== 1 ? 's' : ''} found — Lowest unique bid wins
            </p>
          </div>

          {/* Stat pills */}
          <div className="flex flex-wrap gap-2 shrink-0">
            <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-2xl px-3 py-2 backdrop-blur-sm">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-white text-xs font-bold">{liveCount} Live</span>
            </div>
            <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-2xl px-3 py-2 backdrop-blur-sm">
              <span className="w-2 h-2 rounded-full bg-blue-400" />
              <span className="text-white text-xs font-bold">{upcomingCount} Soon</span>
            </div>
            {pausedCount > 0 && (
              <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-2xl px-3 py-2 backdrop-blur-sm">
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                <span className="text-white text-xs font-bold">{pausedCount} Paused</span>
              </div>
            )}
            <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-2xl px-3 py-2 backdrop-blur-sm">
              <span className="w-2 h-2 rounded-full bg-slate-400" />
              <span className="text-white text-xs font-bold">{closedCount} Ended</span>
            </div>
          </div>
        </div>

        {/* Search bar inside hero */}
        <div className="relative mt-5">
          <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search auctions by name or category…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-white/10 border border-white/15 text-white placeholder:text-slate-500 rounded-2xl pl-11 pr-11 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/60 focus:border-indigo-400/40 transition backdrop-blur-sm"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* ── FILTER BAR ──────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Status tabs */}
        <div className="flex items-center gap-1 p-2 border-b border-slate-100">
          {STATUS_OPTS.map(st => {
            const m = STATUS_META[st];
            const count = st === 'all' ? auctions.length
              : st === 'active'   ? liveCount
              : st === 'upcoming' ? upcomingCount
              : st === 'paused'   ? pausedCount
              : closedCount;
            return (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all flex-1 justify-center ${
                  statusFilter === st
                    ? `bg-gradient-to-r ${m.color} text-white shadow-md`
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${statusFilter === st ? 'bg-white/70' : m.dot}`} />
                <span className="hidden sm:inline">{m.label}</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-black ${
                  statusFilter === st ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                }`}>{count}</span>
              </button>
            );
          })}
        </div>

        {/* Category chips + view toggle */}
        <div className="flex items-center gap-3 px-3 py-2.5">
          <div className="flex gap-1.5 overflow-x-auto flex-1" style={{ scrollbarWidth: 'none' }}>
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold capitalize whitespace-nowrap transition-all ${
                  selectedCategory === cat
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {cat !== 'all' && <Tag className="w-2.5 h-2.5" />}
                {cat}
              </button>
            ))}
          </div>
          {/* View mode toggle */}
          <div className="flex items-center gap-1 bg-slate-100 rounded-xl p-1 shrink-0">
            <button onClick={() => setViewMode('grid')} className={`p-1.5 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}>
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
            <button onClick={() => setViewMode('list')} className={`p-1.5 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}>
              <List className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Active filter chips */}
      {(search || statusFilter !== 'all' || selectedCategory !== 'all') && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-slate-400 font-medium">Active filters:</span>
          {search && (
            <span className="flex items-center gap-1.5 bg-indigo-50 text-indigo-700 border border-indigo-200 text-xs font-bold px-3 py-1 rounded-full">
              <Search className="w-3 h-3" /> "{search}"
              <button onClick={() => setSearch('')}><X className="w-3 h-3" /></button>
            </span>
          )}
          {statusFilter !== 'all' && (
            <span className="flex items-center gap-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold px-3 py-1 rounded-full">
              <Zap className="w-3 h-3" /> {STATUS_META[statusFilter].label}
              <button onClick={() => setStatusFilter('all')}><X className="w-3 h-3" /></button>
            </span>
          )}
          {selectedCategory !== 'all' && (
            <span className="flex items-center gap-1.5 bg-violet-50 text-violet-700 border border-violet-200 text-xs font-bold px-3 py-1 rounded-full">
              <Tag className="w-3 h-3" /> {selectedCategory}
              <button onClick={() => setSelectedCategory('all')}><X className="w-3 h-3" /></button>
            </span>
          )}
          <button onClick={() => { setSearch(''); setStatusFilter('all'); setSelectedCategory('all'); }}
            className="text-xs text-slate-500 hover:text-rose-600 font-bold underline-offset-2 hover:underline">
            Clear all
          </button>
        </div>
      )}

      {/* ── AUCTION GRID / LIST ──────────────────────────────────────────── */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-3xl p-14 text-center border border-slate-200 shadow-sm space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto">
            <Gavel className="w-7 h-7 text-slate-300" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-800">No auctions matched</h3>
            <p className="text-sm text-slate-400 mt-1">Try clearing your filters or search term.</p>
          </div>
          <button onClick={() => { setSearch(''); setStatusFilter('all'); setSelectedCategory('all'); }}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-500 transition shadow-md shadow-indigo-900/20">
            <Filter className="w-4 h-4" /> Clear All Filters
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {filtered.map(auction => (
            <AuctionCard key={auction.id} auction={auction} onClick={() => setSelectedAuction(auction)} />
          ))}
        </div>
      ) : (
        /* List view */
        <div className="space-y-2">
          {filtered.map(auction => {
            const isLive = auction.status === 'active';
            const isUpcoming = auction.status === 'upcoming';
            return (
              <button
                key={auction.id}
                onClick={() => setSelectedAuction(auction)}
                className="w-full group bg-white border border-slate-200 rounded-2xl p-4 flex items-center gap-4 hover:border-indigo-300 hover:shadow-md transition-all text-left"
              >
                <div className="w-16 h-16 rounded-2xl overflow-hidden bg-slate-100 shrink-0">
                  <img src={auction.image} alt={auction.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    onError={e => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=200&q=80'; }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    {isLive && <span className="text-[9px] font-black bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse inline-block" />LIVE</span>}
                    {isUpcoming && <span className="text-[9px] font-black bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">SOON</span>}
                    {auction.status === 'closed' && <span className="text-[9px] font-black bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">ENDED</span>}
                    <span className="text-[9px] font-bold text-slate-400 uppercase">{auction.category}</span>
                  </div>
                  <h3 className="font-bold text-slate-900 text-sm truncate group-hover:text-indigo-600 transition-colors">{auction.title}</h3>
                  <p className="text-xs text-slate-400 mt-0.5 truncate">{auction.description}</p>
                </div>
                <div className="text-right shrink-0 space-y-1">
                  <p className="text-xs font-black text-slate-900">{formatCurrency(auction.bidPerCost || 0)}</p>
                  <p className="text-[10px] text-slate-400 font-medium">Bid Cost</p>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-500 group-hover:translate-x-1 transition-all shrink-0" />
              </button>
            );
          })}
        </div>
      )}

      {/* ── AUCTION DETAIL MODAL ─────────────────────────────────────────── */}
      {selectedAuction && (
        <div
          onClick={closeModal}
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/75 backdrop-blur-sm"
        >
          <div
            ref={modalRef}
            onClick={e => e.stopPropagation()}
            className="w-full sm:max-w-2xl max-h-[95vh] sm:max-h-[90vh] bg-white sm:rounded-3xl rounded-t-3xl shadow-2xl overflow-hidden flex flex-col"
          >
            {/* Modal top image banner */}
            <div className="relative h-48 sm:h-56 bg-slate-100 shrink-0 overflow-hidden">
              <img
                src={selectedAuction.image}
                alt={selectedAuction.title}
                className="w-full h-full object-cover"
                onError={e => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=800&q=80'; }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-900/20 to-transparent" />

              {/* Close btn */}
              <button
                onClick={closeModal}
                className="absolute top-4 right-4 w-9 h-9 bg-white/15 hover:bg-white/30 backdrop-blur-md text-white rounded-full flex items-center justify-center font-bold text-base border border-white/20 transition-all"
              >
                ✕
              </button>

              {/* Status badge */}
              <div className="absolute top-4 left-4">
                {selectedAuction.status === 'active' && (
                  <span className="flex items-center gap-1.5 bg-emerald-500 text-white text-[10px] font-black px-3 py-1.5 rounded-full shadow-lg">
                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" /> LIVE NOW
                  </span>
                )}
                {selectedAuction.status === 'upcoming' && (
                  <span className="flex items-center gap-1.5 bg-blue-500 text-white text-[10px] font-black px-3 py-1.5 rounded-full shadow-lg">
                    <Clock className="w-3 h-3" /> COMING SOON
                  </span>
                )}
                {selectedAuction.status === 'closed' && (
                  <span className="flex items-center gap-1.5 bg-slate-700 text-white text-[10px] font-black px-3 py-1.5 rounded-full shadow-lg">
                    ✓ ENDED
                  </span>
                )}
              </div>

              {/* Title overlay */}
              <div className="absolute bottom-4 left-4 right-12">
                <p className="text-white/70 text-[10px] font-bold uppercase tracking-wider mb-1">{selectedAuction.category}</p>
                <h2 className="text-white font-black text-lg sm:text-xl leading-tight line-clamp-2">{selectedAuction.title}</h2>
              </div>
            </div>

            {/* Modal body — scrollable */}
            <div className="overflow-y-auto flex-1 p-5 space-y-4">

              {/* Description */}
              {selectedAuction.description && (
                <p className="text-sm text-slate-500 leading-relaxed">{selectedAuction.description}</p>
              )}

              {/* Key stats row */}
              <div className="grid grid-cols-3 gap-2">
                <div className="bg-gradient-to-br from-indigo-50 to-violet-50 border border-indigo-100 rounded-2xl p-3 text-center">
                  <p className="text-[9px] font-black text-indigo-400 uppercase tracking-wider">Bid Cost</p>
                  <p className="font-black text-slate-900 text-sm mt-1">{formatCurrency(selectedAuction.bidPerCost || 0)}</p>
                </div>
                <div className="bg-gradient-to-br from-blue-50 to-cyan-50 border border-blue-100 rounded-2xl p-3 text-center">
                  <p className="text-[9px] font-black text-blue-400 uppercase tracking-wider">Bid Range</p>
                  <p className="font-black text-blue-700 text-sm mt-1">{selectedAuction.minBid}–{selectedAuction.maxBid}</p>
                </div>
                <div className="bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-200 rounded-2xl p-3 text-center">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Participants</p>
                  <p className="font-black text-slate-900 text-sm mt-1 flex items-center justify-center gap-1">
                    <Users className="w-3 h-3 text-purple-500" />{bidsLoading ? '…' : participantCount}
                  </p>
                </div>
              </div>

              {/* Countdown */}
              <div className="bg-slate-900 rounded-2xl p-4 text-white flex items-center justify-between gap-4">
                <div>
                  <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mb-1">
                    {selectedAuction.status === 'active' ? 'Time Remaining' : selectedAuction.status === 'upcoming' ? 'Starts In' : 'Ended'}
                  </p>
                  <CountdownTimer endTime={selectedAuction.endTime} status={selectedAuction.status} startTime={selectedAuction.startTime} />
                </div>
                <div className="text-right text-[10px] text-slate-400 space-y-1">
                  {selectedAuction.startTime && <p>Start: {formatDate(selectedAuction.startTime)}</p>}
                  <p>End: {formatDate(selectedAuction.endTime)}</p>
                </div>
              </div>

              {/* Live bid stats */}
              {!bidsLoading && auctionBids.length > 0 && (
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { label: 'Total Bids', value: auctionBids.length, icon: <Gavel className="w-3.5 h-3.5 text-violet-500" /> },
                    { label: 'Unique Bids', value: uniqueAmounts.length, icon: <Sparkles className="w-3.5 h-3.5 text-amber-500" /> },
                    { label: 'Lowest Unique', value: lowestUnique ? `${lowestUnique} ETB` : '—', icon: <TrendingDown className="w-3.5 h-3.5 text-emerald-500" /> },
                  ].map(s => (
                    <div key={s.label} className="bg-slate-50 border border-slate-200 rounded-2xl p-3 text-center">
                      <div className="flex items-center justify-center mb-1">{s.icon}</div>
                      <p className="font-black text-slate-900 text-xs">{s.value}</p>
                      <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">{s.label}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Winner banner (closed) */}
              {selectedAuction.status === 'closed' && winningBid && (
                <div className="bg-gradient-to-r from-amber-400 to-orange-500 rounded-2xl p-4 text-white flex items-center gap-3 shadow-lg shadow-amber-900/20">
                  <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                    <Trophy className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="font-black text-sm">🏆 Winner: {winningBid.maskedBidderId || `Bidder #${winningBid.bidderId.slice(-4)}`}</p>
                    <p className="text-white/80 text-xs font-bold">Lowest unique bid: {lowestUnique} ETB</p>
                  </div>
                </div>
              )}

              {/* Bid form (active) */}
              {selectedAuction.status === 'active' && (
                <div className="bg-gradient-to-br from-indigo-50 to-violet-50 border border-indigo-200 rounded-2xl p-4 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Gavel className="w-4 h-4 text-indigo-600" />
                      <span className="font-black text-slate-900 text-sm">Place Your Bid</span>
                    </div>
                    {myLatestBid && (
                      <span className="text-xs text-indigo-600 font-bold bg-indigo-100 px-2 py-0.5 rounded-full">
                        Your last: {myLatestBid.amount.toFixed(1)} ETB
                      </span>
                    )}
                  </div>
                  {!currentUser ? (
                    <div className="text-center py-2 space-y-2">
                      <p className="text-sm text-slate-600 font-medium">Sign in to place a bid</p>
                      <button onClick={() => nav(ROUTES.LOGIN)}
                        className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-500 transition">
                        Sign In →
                      </button>
                    </div>
                  ) : (
                    <form onSubmit={handlePopupBid} className="flex gap-2">
                      <input
                        type="number"
                        min={selectedAuction.minBid}
                        max={selectedAuction.maxBid}
                        step="0.1"
                        value={bidAmount}
                        onChange={e => setBidAmount(validateBidAmount(e.target.value))}
                        placeholder={`${selectedAuction.minBid} – ${selectedAuction.maxBid} ETB`}
                        className="flex-1 rounded-xl border border-indigo-200 bg-white px-4 py-2.5 text-sm text-slate-900 font-bold placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                      <button
                        type="submit"
                        disabled={bidSubmitState === 'loading'}
                        className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-black transition shadow-md shadow-indigo-900/20 disabled:opacity-60 flex items-center gap-2"
                      >
                        {bidSubmitState === 'loading' ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Bid'}
                      </button>
                    </form>
                  )}
                  {bidSubmitState !== 'idle' && (
                    <div className={`flex items-center gap-2 p-3 rounded-xl text-xs font-bold border ${
                      bidSubmitState === 'loading' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                      bidSubmitState === 'success' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' :
                      'bg-rose-50 text-rose-800 border-rose-200'
                    }`}>
                      {bidSubmitState === 'loading' && <Loader2 className="w-4 h-4 animate-spin shrink-0" />}
                      {bidSubmitState === 'success' && <CheckCircle className="w-4 h-4 shrink-0" />}
                      {bidSubmitState === 'error'   && <XCircle className="w-4 h-4 shrink-0" />}
                      <span>{bidSubmitText || (bidResult?.msg ?? '')}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Upcoming info */}
              {selectedAuction.status === 'upcoming' && (
                <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 flex items-center gap-3 text-sm">
                  <Clock className="w-5 h-5 text-blue-500 shrink-0" />
                  <div>
                    <p className="font-bold text-blue-900">Coming soon</p>
                    <p className="text-blue-600 text-xs mt-0.5">Bidding opens when the countdown reaches zero.</p>
                  </div>
                </div>
              )}

              {/* Bid history table (closed) */}
              {selectedAuction.status === 'closed' && auctionBids.length > 0 && (
                <div className="rounded-2xl overflow-hidden border border-slate-200">
                  <div className="bg-slate-900 text-white px-4 py-3 flex items-center gap-2">
                    <TrendingDown className="w-4 h-4 text-slate-400" />
                    <span className="text-xs font-black uppercase tracking-wider">Bid History</span>
                    <span className="ml-auto text-[10px] bg-white/10 px-2 py-0.5 rounded-full">{auctionBids.length} bids</span>
                  </div>
                  {bidsLoading ? (
                    <div className="flex items-center justify-center gap-2 py-8 text-slate-400 text-sm">
                      <Loader2 className="w-4 h-4 animate-spin" /> Loading…
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs text-left">
                        <thead className="bg-slate-50 text-slate-500 font-black uppercase tracking-wider text-[10px]">
                          <tr>
                            <th className="px-4 py-3">Bidder</th>
                            <th className="px-4 py-3">Amount</th>
                            <th className="px-4 py-3">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {auctionBids.map(bid => {
                            const isDup = (bidCounts[bid.amount] ?? 1) > 1;
                            const isWin = winningBid?.id === bid.id;
                            return (
                              <tr key={bid.id} className={`${isWin ? 'bg-amber-50' : isDup ? 'bg-rose-50/50' : 'bg-white hover:bg-slate-50'} transition-colors`}>
                                <td className="px-4 py-2.5 font-mono text-slate-600">{bid.maskedBidderId || `#${bid.bidderId.slice(-4)}`}</td>
                                <td className={`px-4 py-2.5 font-black ${isDup ? 'text-rose-400 line-through' : isWin ? 'text-amber-600' : 'text-slate-900'}`}>
                                  {bid.amount.toFixed(1)} ETB
                                </td>
                                <td className="px-4 py-2.5">
                                  {isWin ? (
                                    <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full text-[10px] font-black">
                                      <Trophy className="w-2.5 h-2.5" /> Winner
                                    </span>
                                  ) : isDup ? (
                                    <span className="inline-flex items-center gap-1 bg-rose-100 text-rose-700 border border-rose-200 px-2 py-0.5 rounded-full text-[10px] font-black">
                                      <XCircle className="w-2.5 h-2.5" /> Duplicate
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full text-[10px] font-black">
                                      <CheckCircle className="w-2.5 h-2.5" /> Unique
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

              {/* CTA: go to full detail page */}
              <button
                onClick={() => nav(`${ROUTES.AUCTION_DETAIL}/${selectedAuction.id}`)}
                className="w-full flex items-center justify-center gap-2 py-3.5 bg-slate-900 hover:bg-slate-700 text-white rounded-2xl text-sm font-black transition-all shadow-lg"
              >
                <span>View Full Auction Page</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
