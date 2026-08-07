import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../../context/AppContext';

import { Gavel, Edit3, Plus, ArrowRight, CheckCircle, AlertCircle, History, X } from 'lucide-react';

export default function MyBids() {
  const { currentUser, bids, auctions, editBid, placeBid } = useApp();
  const userBids = bids.filter(b => b.bidderId === currentUser?.id);

  const [editingBidId, setEditingBidId] = useState<string | null>(null);
  const [newAmount, setNewAmount] = useState<number>(1);
  const [addBidAuctionId, setAddBidAuctionId] = useState<string | null>(null);
  const [addBidAmount, setAddBidAmount] = useState<number>(1);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  function flash(type: 'success' | 'error', text: string) {
    setFeedback({ type, text });
    setTimeout(() => setFeedback(null), 3500);
  }

  function handleSaveEdit(bidId: string) {
    const success = editBid(bidId, newAmount);
    if (success) { flash('success', 'Bid updated successfully!'); setEditingBidId(null); }
    else flash('error', 'Failed to update bid.');
  }

  function handlePlaceAnotherBid(auctionId: string) {
    const success = placeBid(auctionId, addBidAmount);
    if (success) { flash('success', `New bid of ${addBidAmount.toFixed(1)} ETB placed!`); setAddBidAuctionId(null); }
    else flash('error', 'Insufficient credits or invalid bid amount.');
  }

  return (
    <div className="space-y-5 font-sans">

      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <History className="w-6 h-6 text-blue-600" /> My Bids
          </h1>
          <p className="text-slate-500 text-xs font-medium mt-1">
            {userBids.length} bid{userBids.length !== 1 ? 's' : ''} placed
          </p>
        </div>
        <Link to="/auctions" className="btn-primary text-xs py-2 px-3 flex items-center gap-1.5 shrink-0">
          <Gavel className="w-3.5 h-3.5" /> Browse
        </Link>
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

      {/* Bids List */}
      {userBids.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-4 shadow-sm">
          <Gavel className="w-12 h-12 text-slate-200 mx-auto" />
          <h3 className="text-base font-bold text-slate-800">No Bids Yet</h3>
          <p className="text-sm text-slate-500 max-w-xs mx-auto">Place your first lowest unique bid on a live auction!</p>
          <Link to="/auctions" className="btn-primary inline-flex text-sm">Explore Auctions</Link>
        </div>
      ) : (
        <div className="space-y-3">
          {userBids.map(bid => {
            const auction = auctions.find(a => a.id === bid.auctionId);
            if (!auction) return null;
            const isEditing = editingBidId === bid.id;
            const isAddingAnother = addBidAuctionId === auction.id;
            const isActive = auction.status === 'active';

            return (
              <div key={bid.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
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

                  <Link to={`/auction/${auction.id}`}
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
                        onChange={e => setNewAmount(Number(e.target.value))}
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
                    <p className="text-[10px] text-blue-600 font-semibold">Costs 1 Credit • Range: {auction.minBid}–{auction.maxBid}</p>
                    <div className="flex gap-2">
                      <input type="number" min={auction.minBid} max={auction.maxBid} value={addBidAmount}
                        onChange={e => setAddBidAmount(Number(e.target.value))}
                        className="input-field flex-1 font-black text-center text-sm" />
                      <button onClick={() => setAddBidAuctionId(null)} className="btn-secondary text-xs px-3">Cancel</button>
                      <button onClick={() => handlePlaceAnotherBid(auction.id)} className="btn-accent text-xs px-3">Submit</button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
