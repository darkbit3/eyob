import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { formatDate, formatCurrency } from '../../utils/countdown';
import { Shield, ChevronLeft, CheckCircle, XCircle, Trophy } from 'lucide-react';

export default function WinnerVerification() {
  const { id } = useParams<{ id: string }>();
  const { auctions, bids, users } = useApp();
  const nav = useNavigate();

  const auction = auctions.find(a => a.id === id);
  const rawBids = bids.filter(b => b.auctionId === id);

  if (!auction || auction.status !== 'closed') {
    return (
      <div className="text-center py-20">
        <Shield className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-500 font-medium">Verification only available for closed auctions.</p>
        <button onClick={() => nav('/auctions')} className="btn-primary mt-4">Browse Auctions</button>
      </div>
    );
  }

  const freqMap: Record<number, number> = {};
  rawBids.forEach(b => { freqMap[b.amount] = (freqMap[b.amount] ?? 0) + 1; });

  const taggedBids = rawBids.map(b => ({
    ...b,
    freq: freqMap[b.amount],
    isUnique: freqMap[b.amount] === 1,
  }));

  const uniqueAmounts = rawBids
    .filter(b => freqMap[b.amount] === 1)
    .map(b => b.amount);

  const lowestUnique = uniqueAmounts.length > 0 ? Math.min(...uniqueAmounts) : null;
  const winner = rawBids.find(b => b.amount === lowestUnique);
  const winnerUser = users.find(u => u.id === winner?.bidderId);
  const sortedForTable = [...taggedBids].sort((a, b) => a.amount - b.amount);

  const steps = [
    { n: 1, title: 'Count all bids',        desc: `${rawBids.length} total bids collected across ${Object.keys(freqMap).length} distinct amounts.`, icon: '📊' },
    { n: 2, title: 'Remove duplicates',     desc: `${Object.values(freqMap).filter(v => v > 1).length} amounts were bid more than once and are eliminated.`, icon: '🗑️' },
    { n: 3, title: 'Sort remaining unique', desc: `${uniqueAmounts.length} unique amounts remain after removing duplicates.`, icon: '📋' },
    { n: 4, title: 'Select lowest unique',  desc: lowestUnique ? `The lowest unique bid is ${lowestUnique} ETB.` : 'No unique bid found.', icon: '🎯' },
    { n: 5, title: 'Declare winner',        desc: winner ? `Bidder ${winner.maskedBidderId} wins ${auction.title}!` : 'No winner.', icon: '🏆' },
  ];

  return (
    <div className="space-y-6">
      <button onClick={() => nav(-1)} className="flex items-center gap-2 text-gray-500 hover:text-gray-800 text-sm">
        <ChevronLeft className="w-4 h-4" /> Back
      </button>

      {/* Header */}
      <div className="bg-gradient-to-r from-blue-700 to-blue-900 rounded-2xl p-6 text-white">
        <div className="flex items-center gap-3 mb-3">
          <Shield className="w-8 h-8 text-blue-200" />
          <div>
            <h1 className="text-xl font-bold">Independent Verification</h1>
            <p className="text-blue-200 text-sm">Anyone can verify this result transparently</p>
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4">
          <div><p className="text-blue-300 text-xs">Product</p><p className="font-semibold text-sm">{auction.title}</p></div>
          <div><p className="text-blue-300 text-xs">Closed At</p><p className="font-semibold text-sm">{formatDate(auction.endTime)}</p></div>
          <div><p className="text-blue-300 text-xs">Total Participants</p><p className="font-semibold text-sm">{auction.totalParticipants}</p></div>
          <div><p className="text-blue-300 text-xs">Total Bids</p><p className="font-semibold text-sm">{rawBids.length}</p></div>
        </div>
      </div>

      {/* Winner Box */}
      {winner && (
        <div className="bg-green-50 border-2 border-green-200 rounded-2xl p-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <Trophy className="w-8 h-8 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-green-700 font-medium">🏆 Auction Winner</p>
                <p className="text-2xl font-bold text-green-900">{winner.maskedBidderId}</p>
                <p className="text-sm text-green-700">Winning bid: <strong>{lowestUnique} ETB</strong> (Lowest Unique)</p>
                {winnerUser && <p className="text-xs text-green-600 mt-0.5">Retail value: {formatCurrency(auction.retailValue)}</p>}
              </div>
            </div>
            <div className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-full font-bold text-sm">
              <CheckCircle className="w-5 h-5" /> Verified ✅
            </div>
          </div>
        </div>
      )}

      {/* Algorithm Steps */}
      <div className="card">
        <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Shield className="w-5 h-5 text-blue-600" /> Step-by-Step Algorithm Verification
        </h2>
        <div className="space-y-3">
          {steps.map(s => (
            <div key={s.n} className="flex items-start gap-4 p-4 bg-gray-50 rounded-xl">
              <div className="w-8 h-8 bg-blue-600 text-white text-sm font-bold rounded-full flex items-center justify-center flex-shrink-0">{s.n}</div>
              <div className="text-3xl">{s.icon}</div>
              <div>
                <p className="font-semibold text-gray-900 text-sm">{s.title}</p>
                <p className="text-gray-600 text-sm mt-0.5">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Frequency Summary */}
      <div className="card">
        <h2 className="font-bold text-gray-900 mb-4">Bid Frequency Summary</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
          {Object.entries(freqMap).sort(([a], [b]) => Number(a) - Number(b)).map(([amount, count]) => {
            const isUniqueAmt = count === 1;
            const isWinner = Number(amount) === lowestUnique;
            return (
              <div key={amount} className={`rounded-xl p-3 border-2 text-sm flex flex-col items-center text-center
                ${isWinner ? 'border-green-500 bg-green-50' : isUniqueAmt ? 'border-blue-200 bg-blue-50' : 'border-red-100 bg-red-50'}`}>
                <p className={`text-2xl font-bold ${isWinner ? 'text-green-700' : isUniqueAmt ? 'text-blue-700' : 'text-red-500 line-through'}`}>
                  {amount}
                </p>
                <p className="text-xs font-medium text-gray-500">ETB</p>
                <p className={`text-xs mt-1 font-semibold ${isWinner ? 'text-green-600' : isUniqueAmt ? 'text-blue-600' : 'text-red-500'}`}>
                  {count}x {isWinner ? '🏆 WINNER' : isUniqueAmt ? 'Unique' : 'Duplicate'}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Full Bid Table */}
      <div className="card">
        <h2 className="font-bold text-gray-900 mb-1">Complete Bid Log ({rawBids.length} bids)</h2>
        <p className="text-xs text-gray-500 mb-4">Sorted by amount. Duplicates are grayed out. The lowest unique bid is highlighted in green.</p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-gray-500 bg-gray-50">
                <th className="text-left py-2.5 px-3 rounded-tl-lg">#</th>
                <th className="text-left py-2.5 px-3">Bidder ID</th>
                <th className="text-left py-2.5 px-3">Amount (ETB)</th>
                <th className="text-left py-2.5 px-3">Frequency</th>
                <th className="text-left py-2.5 px-3">Status</th>
                <th className="text-left py-2.5 px-3 rounded-tr-lg">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {sortedForTable.map((b, i) => {
                const isWin = b.amount === lowestUnique;
                return (
                  <tr key={b.id}
                    className={`transition-colors ${isWin ? 'bg-green-50 font-semibold' : b.isUnique ? 'bg-blue-50/50' : 'bg-red-50/30'}`}>
                    <td className="py-2 px-3 text-gray-400 text-xs">{i + 1}</td>
                    <td className="py-2 px-3 font-mono text-xs text-gray-600">{b.maskedBidderId}</td>
                    <td className={`py-2 px-3 font-bold ${isWin ? 'text-green-700' : b.isUnique ? 'text-blue-700' : 'text-red-400 line-through'}`}>
                      {b.amount}
                    </td>
                    <td className="py-2 px-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium
                        ${b.freq === 1 ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'}`}>
                        ×{b.freq}
                      </span>
                    </td>
                    <td className="py-2 px-3">
                      {isWin ? (
                        <span className="flex items-center gap-1 text-xs text-green-700 font-bold">
                          <CheckCircle className="w-3.5 h-3.5" /> Lowest Unique 🏆
                        </span>
                      ) : b.isUnique ? (
                        <span className="flex items-center gap-1 text-xs text-blue-600">
                          <CheckCircle className="w-3.5 h-3.5" /> Unique
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-xs text-red-500">
                          <XCircle className="w-3.5 h-3.5" /> Duplicate
                        </span>
                      )}
                    </td>
                    <td className="py-2 px-3 text-gray-400 text-xs">{formatDate(b.timestamp)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
