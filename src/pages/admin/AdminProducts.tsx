import { useApp } from '../../context/AppContext';
import { formatCurrency } from '../../utils/countdown';
import { Package } from 'lucide-react';

export default function AdminProducts() {
  const { auctions } = useApp();

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-bold text-gray-900">Product Management</h1>
        <p className="text-gray-500 text-sm">All products listed in auctions.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {auctions.map(a => (
          <div key={a.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
            <div className="h-40 overflow-hidden">
              <img src={a.image} alt={a.title} className="w-full h-full object-cover"
                onError={e => { (e.target as HTMLImageElement).src='https://placehold.co/300x160?text=Product'; }} />
            </div>
            <div className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <Package className="w-4 h-4 text-gray-400" />
                <span className="text-xs text-gray-500">{a.category}</span>
              </div>
              <h3 className="font-semibold text-gray-900 text-sm mb-2 line-clamp-1">{a.title}</h3>
              <p className="text-xs text-gray-500 mb-3 line-clamp-2">{a.description}</p>
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-blue-600">{formatCurrency(a.retailValue)}</span>
                <span className={a.status==='active'?'badge-active':a.status==='upcoming'?'badge-upcoming':'badge-closed'}>
                  {a.status}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
