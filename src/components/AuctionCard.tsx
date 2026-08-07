import { useNavigate } from 'react-router-dom';
import { Auction } from '../data/mockData';
import CountdownTimer from './CountdownTimer';
import { formatCurrency } from '../utils/countdown';
import { Users, TrendingDown, ArrowRight } from 'lucide-react';

export default function AuctionCard({ auction }: { auction: Auction }) {
  const nav = useNavigate();

  const isActive = auction.status === 'active';
  const isUpcoming = auction.status === 'upcoming';
  const isClosed = auction.status === 'closed';

  return (
    <div
      onClick={() => nav(`/auction/${auction.id}`)}
      className="group bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer active:scale-[0.98]"
    >
      {/* Image */}
      <div className="relative overflow-hidden h-44 sm:h-48 bg-slate-100">
        <img
          src={auction.image}
          alt={auction.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          onError={e => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=600&q=80'; }}
        />
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent" />

        {/* Status badge top-left */}
        <div className="absolute top-3 left-3">
          {isActive && <span className="badge-active text-[11px] shadow-sm">● Live</span>}
          {isUpcoming && <span className="badge-upcoming text-[11px] shadow-sm">◷ Soon</span>}
          {isClosed && <span className="badge-closed text-[11px] shadow-sm">✓ Ended</span>}
        </div>

        {/* Countdown / winner bottom-right on image */}
        <div className="absolute bottom-3 right-3">
          {isClosed && auction.lowestUniqueBid ? (
            <span className="bg-emerald-500 text-white text-[10px] font-black px-2.5 py-1 rounded-full shadow-md">
              🏆 Won: {auction.lowestUniqueBid.toFixed(1)} ETB
            </span>
          ) : isActive ? (
            <div className="bg-slate-900/80 backdrop-blur-sm text-white text-[11px] font-bold px-2.5 py-1 rounded-full">
              <CountdownTimer endTime={auction.endTime} status={auction.status} />
            </div>
          ) : null}
        </div>

        {/* Category chip top-right */}
        <div className="absolute top-3 right-3">
          <span className="bg-white/90 backdrop-blur-sm text-slate-700 text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">
            {auction.category}
          </span>
        </div>
      </div>

      {/* Body */}
      <div className="p-4 space-y-3">
        <h3 className="font-black text-slate-900 text-sm leading-tight line-clamp-2 group-hover:text-blue-600 transition-colors">
          {auction.title}
        </h3>

        {/* Price row */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase">Retail Value</p>
            <p className="text-sm font-extrabold text-slate-800">{formatCurrency(auction.retailValue)}</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-bold text-slate-400 uppercase">Bid Range</p>
            <p className="text-sm font-bold text-blue-600">{auction.minBid}–{auction.maxBid} ETB</p>
          </div>
        </div>

        {/* Stats + CTA */}
        <div className="flex items-center justify-between pt-2.5 border-t border-slate-100">
          <div className="flex items-center gap-3 text-[11px] text-slate-500 font-semibold">
            <span className="flex items-center gap-1"><Users className="w-3 h-3 text-purple-500" />{auction.totalParticipants}</span>
            <span className="flex items-center gap-1"><TrendingDown className="w-3 h-3 text-blue-500" />{auction.totalBids} bids</span>
          </div>
          <div className="flex items-center gap-1 text-[11px] font-bold text-blue-600">
            {isActive ? 'Bid Now' : isUpcoming ? 'Remind Me' : 'View Result'}
            <ArrowRight className="w-3.5 h-3.5" />
          </div>
        </div>
      </div>
    </div>
  );
}
