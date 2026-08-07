import { useNavigate } from 'react-router-dom';
import { Auction } from '../data/mockData';
import CountdownTimer from './CountdownTimer';
import { formatCurrency } from '../utils/countdown';
import { Users, TrendingDown } from 'lucide-react';

export default function AuctionCard({ auction }: { auction: Auction }) {
  const nav = useNavigate();

  const badge =
    auction.status === 'active' ? <span className="badge-active">● Active</span> :
    auction.status === 'upcoming' ? <span className="badge-upcoming">◷ Upcoming</span> :
    <span className="badge-closed">✓ Closed</span>;

  return (
    <div
      className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow cursor-pointer group"
      onClick={() => nav(`/auction/${auction.id}`)}
    >
      <div className="relative overflow-hidden h-48">
        <img
          src={auction.image}
          alt={auction.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          onError={e => { (e.target as HTMLImageElement).src = 'https://placehold.co/600x400?text=Auction'; }}
        />
        <div className="absolute top-3 left-3">{badge}</div>
        {auction.status === 'closed' && auction.lowestUniqueBid && (
          <div className="absolute bottom-3 right-3 bg-green-600 text-white text-xs font-bold px-2 py-1 rounded-full">
            Won: {auction.lowestUniqueBid} ETB
          </div>
        )}
      </div>
      <div className="p-4">
        <p className="text-xs text-blue-600 font-medium mb-1">{auction.category}</p>
        <h3 className="font-semibold text-gray-900 text-sm mb-2 line-clamp-2">{auction.title}</h3>
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-xs text-gray-500">Retail Value</p>
            <p className="text-sm font-bold text-gray-800">{formatCurrency(auction.retailValue)}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-500">Bid Range</p>
            <p className="text-sm font-medium text-blue-600">{auction.minBid}–{auction.maxBid} ETB</p>
          </div>
        </div>
        <div className="flex items-center justify-between text-xs text-gray-500 pt-3 border-t border-gray-50">
          <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" />{auction.totalParticipants} bidders</span>
          <span className="flex items-center gap-1"><TrendingDown className="w-3.5 h-3.5" />{auction.totalBids} bids</span>
          <CountdownTimer endTime={auction.endTime} status={auction.status} />
        </div>
      </div>
    </div>
  );
}
