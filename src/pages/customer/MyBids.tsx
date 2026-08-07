import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { formatCurrency } from '../../utils/countdown';
import { Gavel, Edit3, Plus, ArrowRight, CheckCircle, AlertCircle, History } from 'lucide-react';

export default function MyBids() {
  const { currentUser, bids, auctions, editBid, placeBid } = useApp();

  const userBids = bids.filter(b => b.bidderId === currentUser?.id);

  const [editingBidId, setEditingBidId] = useState<string | null>(null);
  const [newAmount, setNewAmount] = useState<number>(1);

  const [addBidAuctionId, setAddBidAuctionId] = useState<string | null>(null);
  const [addBidAmount, setAddBidAmount] = useState<number>(1);

  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  function handleSaveEdit(bidId: string) {
    setFeedback(null);
    const success = editBid(bidId, newAmount);
    if (success) {
      setFeedback({ type: 'success', text: 'Bid amount updated successfully!' });
      setEditingBidId(null);
    } else {
      setFeedback({ type: 'error', text: 'Failed to update bid amount.' });
    }
  }

  function handlePlaceAnotherBid(auctionId: string) {
    setFeedback(null);
    const success = placeBid(auctionId, addBidAmount);
    if (success) {
      setFeedback({ type: 'success', text: `Success! Added another bid of ${addBidAmount} ETB.` });
      setAddBidAuctionId(null);
    } else {
      setFeedback({ type: 'error', text: 'Insufficient credits or invalid bid.' });
    }
  }

  return (
    <div className="space-y-8 font-sans">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <History className="w-7 h-7 text-blue-600" /> My Bid History
          </h1>
          <p className="text-slate-500 text-sm font-medium">
            Manage your placed bids, modify amounts on active auctions, or submit additional bids
          </p>
        </div>

        <Link to="/auctions" className="btn-primary inline-flex">
          <Gavel className="w-4 h-4" /> Browse More Auctions
        </Link>
      </div>

      {/* Feedback Toast */}
      {feedback && (
        <div className={`p-4 rounded-2xl text-xs font-bold flex items-center gap-3 animate-in fade-in ${
          feedback.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'
        }`}>
          {feedback.type === 'success' ? <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" /> : <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />}
          <span>{feedback.text}</span>
        </div>
      )}

      {/* Bids List */}
      <div className="space-y-4">
        {userBids.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-4 shadow-sm">
            <Gavel className="w-12 h-12 text-slate-300 mx-auto" />
            <h3 className="text-lg font-bold text-slate-800">No Bids Placed Yet</h3>
            <p className="text-sm text-slate-500 max-w-md mx-auto">You have not submitted any bids. Explore live auctions and place your lowest unique bid today!</p>
            <Link to="/auctions" className="btn-primary inline-flex">Explore Live Auctions</Link>
          </div>
        ) : (
          userBids.map(bid => {
            const auction = auctions.find(a => a.id === bid.auctionId);
            if (!auction) return null;

            const isEditing = editingBidId === bid.id;
            const isAddingAnother = addBidAuctionId === auction.id;

            return (
              <div key={bid.id} className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-all space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  {/* Auction Details */}
                  <div className="flex items-center gap-4">
                    <img
                      src={auction.image}
                      alt={auction.title}
                      className="w-16 h-16 rounded-2xl object-cover border border-slate-100 shrink-0"
                      onError={e => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=600&q=80'; }}
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">{auction.category}</span>
                        {auction.status === 'active' ? (
                          <span className="badge-active text-[10px] px-2 py-0.2">Active</span>
                        ) : (
                          <span className="badge-closed text-[10px] px-2 py-0.2">Ended</span>
                        )}
                      </div>
                      <h3 className="font-bold text-slate-900 text-base">{auction.title}</h3>
                      <p className="text-xs text-slate-500">Retail Price: {formatCurrency(auction.retailValue)} | Range: {auction.minBid}–{auction.maxBid} ETB</p>
                    </div>
                  </div>

                  {/* Placed Bid Amount & Action Buttons */}
                  <div className="flex items-center gap-4 sm:justify-end">
                    <div className="text-right">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Your Placed Bid</span>
                      <p className="text-xl font-black text-blue-600">{bid.amount.toFixed(1)} ETB</p>
                    </div>

                    {auction.status === 'active' && (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setEditingBidId(isEditing ? null : bid.id);
                            setNewAmount(bid.amount);
                            setAddBidAuctionId(null);
                          }}
                          className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1 transition-colors"
                        >
                          <Edit3 className="w-3.5 h-3.5" /> Edit Amount
                        </button>

                        <button
                          onClick={() => {
                            setAddBidAuctionId(isAddingAnother ? null : auction.id);
                            setAddBidAmount(auction.minBid);
                            setEditingBidId(null);
                          }}
                          className="px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl text-xs font-bold flex items-center gap-1 transition-colors"
                        >
                          <Plus className="w-3.5 h-3.5" /> Add Another Bid
                        </button>
                      </div>
                    )}

                    <Link
                      to={`/auction/${auction.id}`}
                      className="p-2 text-slate-400 hover:text-blue-600 rounded-xl hover:bg-slate-50 transition-colors"
                      title="View Auction Details & Audit Table"
                    >
                      <ArrowRight className="w-5 h-5" />
                    </Link>
                  </div>
                </div>

                {/* Edit Form Modal Drawer */}
                {isEditing && (
                  <div className="pt-4 border-t border-slate-100 bg-slate-50 p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 animate-in fade-in">
                    <div className="w-full sm:w-auto">
                      <label className="block text-xs font-bold uppercase text-slate-700 mb-1">Update Bid Amount (ETB)</label>
                      <input
                        type="number"
                        min={auction.minBid}
                        max={auction.maxBid}
                        value={newAmount}
                        onChange={e => setNewAmount(Number(e.target.value))}
                        className="input-field max-w-xs font-bold text-center"
                      />
                    </div>
                    <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                      <button onClick={() => setEditingBidId(null)} className="btn-secondary text-xs py-2">Cancel</button>
                      <button onClick={() => handleSaveEdit(bid.id)} className="btn-primary text-xs py-2">Save Changes</button>
                    </div>
                  </div>
                )}

                {/* Add Another Bid Form Drawer */}
                {isAddingAnother && (
                  <div className="pt-4 border-t border-slate-100 bg-blue-50/50 p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 animate-in fade-in">
                    <div className="w-full sm:w-auto">
                      <label className="block text-xs font-bold uppercase text-blue-900 mb-1">New Additional Bid Amount (ETB)</label>
                      <input
                        type="number"
                        min={auction.minBid}
                        max={auction.maxBid}
                        value={addBidAmount}
                        onChange={e => setAddBidAmount(Number(e.target.value))}
                        className="input-field max-w-xs font-bold text-center"
                      />
                      <span className="text-[10px] text-blue-700 font-semibold mt-1 block">Costs 1 Bid Credit</span>
                    </div>
                    <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                      <button onClick={() => setAddBidAuctionId(null)} className="btn-secondary text-xs py-2">Cancel</button>
                      <button onClick={() => handlePlaceAnotherBid(auction.id)} className="btn-accent text-xs py-2">Submit New Bid</button>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
