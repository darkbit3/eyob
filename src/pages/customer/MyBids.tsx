import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { ROUTES } from '../../utils/routes';
import { Bid, Auction } from '../../types';

import { Gavel, Edit3, Plus, ArrowRight, CheckCircle, AlertCircle, History, X, ChevronDown, Search } from 'lucide-react';

// Validate bid amount: only allow one digit after decimal point
const validateBidAmount = (value: string): number => {
  // Only allow numbers and one decimal point
  if (!/^[\d.]*$/.test(value)) return 0;
  
  // Split by decimal point
  const parts = value.split('.');
  if (parts.length > 2) return 0; // More than one decimal point
  
  // If there's a decimal part, limit to 1 digit
  if (parts.length === 2) {
    const integerPart = parts[0];
    const decimalPart = parts[1].slice(0, 1); // Only first digit
    const formatted = integerPart ? `${integerPart}.${decimalPart}` : `.${decimalPart}`;
    return Number(formatted);
  }
  
  return Number(value);
};

export default function MyBids() {
  const { currentUser, bids, auctions, editBid, placeBid } = useApp();
  const userBids = useMemo(() => bids.filter(b => b.bidderId === currentUser?.id).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()), [bids, currentUser?.id]);

  const [editingBidId, setEditingBidId] = useState<string | null>(null);
  const [newAmount, setNewAmount] = useState<number>(1);
  const [addBidAuctionId, setAddBidAuctionId] = useState<string | null>(null);
  const [addBidAmount, setAddBidAmount] = useState<number>(1);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showHistory, setShowHistory] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'all' | 'live' | 'recent' | 'archived'>('all');

  useEffect(() => {
    setShowHistory(true);
    const timer = window.setTimeout(() => setIsLoading(false), 600);
    return () => window.clearTimeout(timer);
  }, [currentUser?.id]);

  // Helper: Check if auction closed more than 1 day ago
  function isOlderThanOneDay(closedAtStr: string | undefined): boolean {
    if (!closedAtStr) return false;
    const closedAt = new Date(closedAtStr);
    const now = new Date();
    const oneDayMs = 24 * 60 * 60 * 1000;
    return now.getTime() - closedAt.getTime() > oneDayMs;
  }

  // Filter bids into current and history
  const currentBids = useMemo(() => userBids.filter(bid => {
    const auction = auctions.find(a => a.id === bid.auctionId);
    if (!auction) return false;
    return auction.status === 'active' || !isOlderThanOneDay(auction.closedAt);
  }), [userBids, auctions]);

  const historyBids = useMemo(() => userBids.filter(bid => {
    const auction = auctions.find(a => a.id === bid.auctionId);
    if (!auction) return false;
    return auction.status === 'closed' && isOlderThanOneDay(auction.closedAt);
  }), [userBids, auctions]);

  const filteredBids = useMemo(() => {
    const source = [...currentBids, ...historyBids].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return source.filter(bid => {
      const auction = auctions.find(a => a.id === bid.auctionId);
      if (!auction) return false;

      const matchesSearch = !searchTerm ||
        auction.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        auction.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        auction.productName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        bid.maskedBidderId.toLowerCase().includes(searchTerm.toLowerCase());

      if (!matchesSearch) return false;

      if (filter === 'live') return auction.status === 'active';
      if (filter === 'recent') return auction.status !== 'active' && !isOlderThanOneDay(auction.closedAt);
      if (filter === 'archived') return auction.status === 'closed' && isOlderThanOneDay(auction.closedAt);
      return true;
    });
  }, [currentBids, historyBids, auctions, searchTerm, filter]);

  function flash(type: 'success' | 'error', text: string) {
    setFeedback({ type, text });
    setTimeout(() => setFeedback(null), 3500);
  }

  function handleSaveEdit(bidId: string) {
    const success = editBid(bidId, newAmount);
    if (success) { flash('success', 'Bid updated successfully!'); setEditingBidId(null); }
    else flash('error', 'Failed to update bid.');
  }

  async function handlePlaceAnotherBid(auctionId: string) {
    try {
      const success = await placeBid(auctionId, addBidAmount);
    if (success) { flash('success', `New bid of ${addBidAmount.toFixed(1)} ETB placed!`); setAddBidAuctionId(null); }
    else flash('error', 'Failed to place bid.');
    } catch (err: any) {
      flash('error', err?.message || 'Failed to place bid.');
    }
  }

  // Render bid card
  function BidCard({ bid, auction, isFromHistory = false }: { bid: Bid; auction: Auction; isFromHistory?: boolean }) {
    const isEditing = editingBidId === bid.id;
    const isAddingAnother = addBidAuctionId === auction.id;
    const isActive = auction.status === 'active';

    return (
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Main row */}
        <div className="p-4 flex items-center gap-3">
          {/* Image */}
          <img
            src={auction.image}
            alt={auction.title}
            className="w-14 h-14 rounded-xl object-cover border border-slate-100 shrink-0"
            onError={e => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=600&q=80'; }}
          />

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 mb-0.5">
              <span className="text-[10px] font-bold text-blue-600 uppercase">{auction.category}</span>
              {isActive
                ? <span className="badge-active text-[9px] px-1.5 py-0.5">Live</span>
                : isFromHistory
                ? <span className="badge-history text-[9px] px-1.5 py-0.5 bg-slate-100 text-slate-600">Archived</span>
                : <span className="badge-closed text-[9px] px-1.5 py-0.5">Ended</span>}
            </div>
            <h3 className="font-black text-slate-900 text-sm leading-tight truncate">{auction.title}</h3>
            <p className="text-[10px] text-slate-400 mt-0.5">Range: {auction.minBid}–{auction.maxBid} ETB</p>
          </div>

          {/* Bid amount + arrow */}
          <div className="text-right shrink-0">
            <p className="text-[10px] font-bold text-slate-400 uppercase">My Bid</p>
            <p className="text-base font-black text-blue-600">{bid.amount.toFixed(1)}</p>
            <p className="text-[9px] text-slate-400">ETB</p>
          </div>

          <Link to={`${ROUTES.AUCTION_DETAIL}/${auction.id}`}
            className="p-2 text-slate-300 hover:text-blue-600 hover:bg-slate-50 rounded-xl transition-colors shrink-0">
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Action buttons — only for active auctions */}
        {isActive && (
          <div className="flex border-t border-slate-100">
            <button
              onClick={() => { setEditingBidId(isEditing ? null : bid.id); setNewAmount(bid.amount); setAddBidAuctionId(null); }}
              className={`flex-1 py-2.5 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors ${
                isEditing ? 'bg-slate-100 text-slate-700' : 'text-slate-600 hover:bg-slate-50'}`}>
              <Edit3 className="w-3.5 h-3.5" /> {isEditing ? 'Cancel Edit' : 'Edit Bid'}
            </button>
            <div className="w-px bg-slate-100" />
            <button
              onClick={() => { setAddBidAuctionId(isAddingAnother ? null : auction.id); setAddBidAmount(auction.minBid); setEditingBidId(null); }}
              className={`flex-1 py-2.5 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors ${
                isAddingAnother ? 'bg-blue-50 text-blue-700' : 'text-blue-600 hover:bg-blue-50'}`}>
              <Plus className="w-3.5 h-3.5" /> {isAddingAnother ? 'Cancel' : 'New Bid'}
            </button>
          </div>
        )}

        {/* Edit form */}
        {isEditing && (
          <div className="p-4 bg-slate-50 border-t border-slate-100 space-y-3">
            <label className="block text-xs font-black uppercase text-slate-700">New Bid Amount (ETB)</label>
            <div className="flex gap-2">
              <input type="number" min={auction.minBid} max={auction.maxBid} value={newAmount}
                onChange={e => setNewAmount(validateBidAmount(e.target.value))}
                className="input-field flex-1 font-black text-center text-sm" />
              <button onClick={() => setEditingBidId(null)} className="btn-secondary text-xs px-3">Cancel</button>
              <button onClick={() => handleSaveEdit(bid.id)} className="btn-primary text-xs px-3">Save</button>
            </div>
          </div>
        )}

        {/* Add another bid form */}
        {isAddingAnother && (
          <div className="p-4 bg-blue-50/60 border-t border-blue-100 space-y-3">
            <label className="block text-xs font-black uppercase text-blue-800">New Bid Amount (ETB)</label>
            <p className="text-[10px] text-blue-600 font-semibold">Range: {auction.minBid}–{auction.maxBid}</p>
            <div className="flex gap-2">
              <input type="number" min={auction.minBid} max={auction.maxBid} value={addBidAmount}
                onChange={e => setAddBidAmount(validateBidAmount(e.target.value))}
                className="input-field flex-1 font-black text-center text-sm" />
              <button onClick={() => setAddBidAuctionId(null)} className="btn-secondary text-xs px-3">Cancel</button>
              <button onClick={() => handlePlaceAnotherBid(auction.id)} className="btn-accent text-xs px-3">Submit</button>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-5 font-sans">

      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <History className="w-6 h-6 text-blue-600" /> My Bid History
          </h1>
          <p className="text-slate-500 text-xs font-medium mt-1">
            {currentBids.length} active bid{currentBids.length !== 1 ? 's' : ''} {historyBids.length > 0 && `• ${historyBids.length} archived`}
          </p>
        </div>
        <Link to={ROUTES.AUCTIONS} className="btn-primary text-xs py-2 px-3 flex items-center gap-1.5 shrink-0">
          <Gavel className="w-3.5 h-3.5" /> Browse
        </Link>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search product, category or bid code..."
            className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 py-2.5 text-sm text-slate-700 focus:border-blue-500 focus:outline-none"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          {(['all', 'live', 'recent', 'archived'] as const).map(option => (
            <button
              key={option}
              type="button"
              onClick={() => setFilter(option)}
              className={`rounded-full px-3 py-1.5 text-[10px] font-bold uppercase tracking-wide transition ${
                filter === option
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {option === 'all' ? 'All bids' : option === 'live' ? 'Live' : option === 'recent' ? 'Recent' : 'Archived'}
            </button>
          ))}
        </div>
      </div>

      {/* Feedback Toast */}
      {feedback && (
        <div className={`p-3.5 rounded-2xl text-xs font-bold flex items-center gap-3 ${
          feedback.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'
        }`}>
          {feedback.type === 'success' ? <CheckCircle className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
          <span className="flex-1">{feedback.text}</span>
          <button onClick={() => setFeedback(null)}><X className="w-4 h-4" /></button>
        </div>
      )}

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(index => (
            <div key={index} className="rounded-2xl border border-slate-200 bg-white p-4 animate-pulse shadow-sm">
              <div className="flex items-center gap-3">
                <div className="h-14 w-14 rounded-xl bg-slate-200" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 w-24 rounded bg-slate-200" />
                  <div className="h-4 w-40 rounded bg-slate-200" />
                  <div className="h-3 w-28 rounded bg-slate-200" />
                </div>
                <div className="h-10 w-16 rounded bg-slate-200" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredBids.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-4 shadow-sm">
          <Gavel className="w-12 h-12 text-slate-200 mx-auto" />
          <h3 className="text-base font-bold text-slate-800">No matching bids</h3>
          <p className="text-sm text-slate-500 max-w-xs mx-auto">Try another product name, category, or switch the filter.</p>
          <button onClick={() => { setSearchTerm(''); setFilter('all'); }} className="btn-primary inline-flex text-sm">Reset filters</button>
        </div>
      ) : (
        <div className="space-y-8">
          <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wide">Bid Activity</h2>
              <span className="text-[10px] font-semibold text-slate-500">{filteredBids.length} result{filteredBids.length !== 1 ? 's' : ''}</span>
            </div>
            {filteredBids.map(bid => {
              const auction = auctions.find(a => a.id === bid.auctionId);
              if (!auction) return null;
              const isArchived = auction.status === 'closed' && isOlderThanOneDay(auction.closedAt);
              return <BidCard key={bid.id} bid={bid} auction={auction} isFromHistory={isArchived} />;
            })}
          </div>

          {historyBids.length > 0 && (
            <div className="space-y-3">
              <button
                onClick={() => setShowHistory(!showHistory)}
                className="w-full flex items-center justify-between px-1 py-2 hover:bg-slate-50 rounded-lg transition-colors">
                <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wide">Bid History ({historyBids.length})</h2>
                <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${showHistory ? 'rotate-180' : ''}`} />
              </button>
              {showHistory && (
                <div className="space-y-3">
                  {historyBids.filter(bid => {
                    const auction = auctions.find(a => a.id === bid.auctionId);
                    if (!auction) return false;
                    if (!searchTerm) return true;
                    return auction.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      auction.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      auction.productName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      bid.maskedBidderId.toLowerCase().includes(searchTerm.toLowerCase());
                  }).map(bid => {
                    const auction = auctions.find(a => a.id === bid.auctionId);
                    if (!auction) return null;
                    return <BidCard key={bid.id} bid={bid} auction={auction} isFromHistory={true} />;
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
