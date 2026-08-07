import { useApp } from '../../context/AppContext';
import { formatCurrency, formatDate } from '../../utils/countdown';
import { creditPackages } from '../../data/mockData';
import { Wallet as WalletIcon, TrendingUp, Star, CheckCircle } from 'lucide-react';

export default function Wallet() {
  const { currentUser, transactions, buyCredits } = useApp();
  const myTxs = transactions.filter(t => t.userId === currentUser?.id);

  function handleBuy(credits: number, price: number) {
    buyCredits(credits, price);
  }

  const txIcon = (type: string) =>
    type === 'credit_purchase' ? '💳' :
    type === 'bid_placed'      ? '🎯' :
    type === 'winning_reward'  ? '🏆' : '↩️';

  const txColor = (type: string) =>
    type === 'bid_placed' ? 'text-red-600' : 'text-green-600';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Wallet & Credits</h1>
        <p className="text-gray-500 mt-1">Manage your balance and purchase bid credits.</p>
      </div>

      {/* Balance Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl p-6 text-white">
          <div className="flex items-center gap-3 mb-4">
            <WalletIcon className="w-6 h-6 text-blue-200" />
            <span className="text-blue-200 text-sm">Wallet Balance</span>
          </div>
          <p className="text-4xl font-bold">{formatCurrency(currentUser?.walletBalance ?? 0)}</p>
          <p className="text-blue-300 text-sm mt-2">Available for purchases</p>
        </div>
        <div className="bg-gradient-to-br from-green-500 to-green-700 rounded-2xl p-6 text-white">
          <div className="flex items-center gap-3 mb-4">
            <TrendingUp className="w-6 h-6 text-green-200" />
            <span className="text-green-200 text-sm">Bid Credits</span>
          </div>
          <p className="text-4xl font-bold">{currentUser?.credits ?? 0}</p>
          <p className="text-green-300 text-sm mt-2">1 credit = 1 bid placement</p>
        </div>
      </div>

      {/* Buy Credits */}
      <div className="card">
        <h2 className="font-bold text-gray-900 mb-1 flex items-center gap-2">
          <Star className="w-5 h-5 text-yellow-500" /> Buy Credits
        </h2>
        <p className="text-sm text-gray-500 mb-4">Credits are used to place bids. Each bid costs 1 credit.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {creditPackages.map(pkg => (
            <div key={pkg.id}
              className={`relative border-2 rounded-xl p-4 text-center transition-all hover:shadow-md
                ${pkg.popular ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-300'}`}>
              {pkg.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-xs font-bold px-3 py-0.5 rounded-full">
                  Most Popular
                </div>
              )}
              <div className="text-3xl font-bold text-gray-900 mt-2">{pkg.credits}</div>
              <div className="text-gray-500 text-sm">credits</div>
              <div className="text-2xl font-bold text-blue-600 my-3">{formatCurrency(pkg.price)}</div>
              <div className="text-xs text-gray-400 mb-3">{(pkg.price / pkg.credits).toFixed(1)} ETB/credit</div>
              <button onClick={() => handleBuy(pkg.credits, pkg.price)}
                className={`w-full py-2 rounded-lg font-semibold text-sm transition-colors
                  ${pkg.popular ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}`}>
                Buy {pkg.label}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Transaction History */}
      <div className="card">
        <h2 className="font-bold text-gray-900 mb-4">Transaction History</h2>
        {myTxs.length === 0 ? (
          <div className="text-center py-10 text-gray-400">
            <div className="text-4xl mb-2">📋</div>
            <p>No transactions yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-gray-500 bg-gray-50">
                  <th className="text-left py-2.5 px-3 rounded-tl-lg">Type</th>
                  <th className="text-left py-2.5 px-3">Description</th>
                  <th className="text-right py-2.5 px-3">Amount</th>
                  <th className="text-left py-2.5 px-3 rounded-tr-lg">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {myTxs.map(t => (
                  <tr key={t.id} className="hover:bg-gray-50">
                    <td className="py-3 px-3">
                      <span className="flex items-center gap-2">
                        <span className="text-lg">{txIcon(t.type)}</span>
                        <span className="text-xs capitalize text-gray-500">{t.type.replace('_', ' ')}</span>
                      </span>
                    </td>
                    <td className="py-3 px-3 text-gray-600">{t.description}</td>
                    <td className={`py-3 px-3 text-right font-bold ${txColor(t.type)}`}>
                      {t.type === 'bid_placed' ? `-${Math.abs(t.amount)}` : `+${t.amount}`} ETB
                    </td>
                    <td className="py-3 px-3 text-gray-400 text-xs">{formatDate(t.timestamp)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="mt-4 flex items-center gap-2 bg-green-50 border border-green-100 text-green-700 text-xs px-4 py-3 rounded-lg">
          <CheckCircle className="w-4 h-4" />
          Demo mode: buying credits instantly updates your balance. No real payment gateway is used.
        </div>
      </div>
    </div>
  );
}
