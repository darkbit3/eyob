import { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Auction } from '../../data/mockData';
import { formatCurrency, formatDate } from '../../utils/countdown';
import { Plus, Edit2, Trash2, Pause, Play, Eye, X, CheckCircle } from 'lucide-react';

const EMPTY: Omit<Auction, 'id' | 'totalParticipants' | 'totalBids'> = {
  title: '', description: '', image: '', retailValue: 0, category: 'Electronics',
  status: 'upcoming', startTime: '', endTime: '', minBid: 1, maxBid: 100,
};

export default function AdminAuctions() {
  const { auctions, setAuctions } = useApp();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Auction | null>(null);
  const [form, setForm] = useState<Omit<Auction, 'id' | 'totalParticipants' | 'totalBids'>>(EMPTY);
  const [saved, setSaved] = useState(false);

  function openCreate() { setForm(EMPTY); setEditing(null); setShowForm(true); }
  function openEdit(a: Auction) { setEditing(a); setForm({ ...a }); setShowForm(true); }

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (editing) {
      setAuctions(prev => prev.map(a => a.id === editing.id ? { ...a, ...form } : a));
    } else {
      const n: Auction = { ...form, id: `a${Date.now()}`, totalParticipants: 0, totalBids: 0 };
      setAuctions(prev => [...prev, n]);
    }
    setShowForm(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  function handleDelete(id: string) {
    setAuctions(prev => prev.filter(a => a.id !== id));
  }

  function togglePause(a: Auction) {
    setAuctions(prev => prev.map(x => x.id === a.id
      ? { ...x, status: x.status === 'active' ? 'upcoming' : 'active' } : x));
  }

  const f = (key: keyof typeof form, val: string | number) => setForm(p => ({ ...p, [key]: val }));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-gray-900">Auction Management</h1>
          <p className="text-gray-500 text-sm">{auctions.length} total auctions</p>
        </div>
        <button onClick={openCreate} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> Create Auction
        </button>
      </div>

      {saved && (
        <div className="flex items-center gap-2 bg-green-50 text-green-700 text-sm px-4 py-3 rounded-lg">
          <CheckCircle className="w-4 h-4" /> Auction saved successfully.
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-gray-500 bg-gray-50 border-b border-gray-100">
                <th className="text-left py-3 px-4">Auction</th>
                <th className="text-left py-3 px-4">Category</th>
                <th className="text-left py-3 px-4">Status</th>
                <th className="text-left py-3 px-4">End Time</th>
                <th className="text-right py-3 px-4">Bids</th>
                <th className="text-right py-3 px-4">Value</th>
                <th className="text-center py-3 px-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {auctions.map(a => (
                <tr key={a.id} className="hover:bg-gray-50">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <img src={a.image} alt="" className="w-9 h-9 rounded-lg object-cover"
                        onError={e => { (e.target as HTMLImageElement).src = 'https://placehold.co/40x40?text=?'; }} />
                      <span className="font-medium text-gray-900 truncate max-w-[160px]">{a.title}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-gray-500">{a.category}</td>
                  <td className="py-3 px-4">
                    <span className={a.status === 'active' ? 'badge-active' : a.status === 'upcoming' ? 'badge-upcoming' : 'badge-closed'}>
                      {a.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-gray-500 text-xs">{formatDate(a.endTime)}</td>
                  <td className="py-3 px-4 text-right text-gray-600">{a.totalBids}</td>
                  <td className="py-3 px-4 text-right font-semibold text-gray-900">{formatCurrency(a.retailValue)}</td>
                  <td className="py-3 px-4">
                    <div className="flex items-center justify-center gap-1">
                      <button onClick={() => openEdit(a)} className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg" title="Edit">
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      {a.status !== 'closed' && (
                        <button onClick={() => togglePause(a)} className="p-1.5 text-yellow-500 hover:bg-yellow-50 rounded-lg" title="Pause/Resume">
                          {a.status === 'active' ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                        </button>
                      )}
                      {a.status === 'closed' && (
                        <a href={`/verify/${a.id}`} className="p-1.5 text-green-500 hover:bg-green-50 rounded-lg" title="Verify">
                          <Eye className="w-3.5 h-3.5" />
                        </a>
                      )}
                      <button onClick={() => handleDelete(a.id)} className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg" title="Delete">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create/Edit Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="font-bold text-gray-900">{editing ? 'Edit Auction' : 'Create New Auction'}</h2>
              <button onClick={() => setShowForm(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                  <input value={form.title} onChange={e => f('title', e.target.value)} className="input-field" required />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea value={form.description} onChange={e => f('description', e.target.value)}
                    className="input-field min-h-[80px] resize-none" />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Image URL</label>
                  <input value={form.image} onChange={e => f('image', e.target.value)}
                    className="input-field" placeholder="https://..." />
                  {form.image && <img src={form.image} alt="" className="mt-2 h-24 rounded-lg object-cover"
                    onError={e => { (e.target as HTMLImageElement).src = 'https://placehold.co/200x100?text=Preview'; }} />}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <select value={form.category} onChange={e => f('category', e.target.value)} className="input-field">
                    {['Electronics', 'Vehicles', 'Gaming', 'Luxury', 'Home Appliances', 'Other'].map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select value={form.status} onChange={e => f('status', e.target.value)} className="input-field">
                    <option value="upcoming">Upcoming</option>
                    <option value="active">Active</option>
                    <option value="closed">Closed</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Retail Value (ETB)</label>
                  <input type="number" value={form.retailValue} onChange={e => f('retailValue', +e.target.value)} className="input-field" min={0} />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Min Bid</label>
                    <input type="number" value={form.minBid} onChange={e => f('minBid', +e.target.value)} className="input-field" min={1} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Max Bid</label>
                    <input type="number" value={form.maxBid} onChange={e => f('maxBid', +e.target.value)} className="input-field" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
                  <input type="datetime-local" value={form.startTime.slice(0, 16)} onChange={e => f('startTime', e.target.value)} className="input-field" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
                  <input type="datetime-local" value={form.endTime.slice(0, 16)} onChange={e => f('endTime', e.target.value)} className="input-field" />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" className="btn-primary flex-1">{editing ? 'Save Changes' : 'Create Auction'}</button>
                <button type="button" onClick={() => setShowForm(false)} className="btn-secondary flex-1">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
