import { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Notification } from '../../data/mockData';
import { Send, Bell, CheckCircle } from 'lucide-react';
import { formatDate } from '../../utils/countdown';

export default function AdminNotifications() {
  const { notifications, setNotifications, users } = useApp();
  const [form, setForm] = useState({ title: '', message: '', type: 'system' as Notification['type'], target: 'all' });
  const [sent, setSent] = useState(false);

  function handleSend(e: React.FormEvent) {
    e.preventDefault();
    const targets = form.target === 'all'
      ? users.filter(u => u.role === 'customer').map(u => u.id)
      : [form.target];
    const newNotifs: Notification[] = targets.map(uid => ({
      id: `n${Date.now()}-${uid}`,
      userId: uid,
      type: form.type,
      title: form.title,
      message: form.message,
      read: false,
      timestamp: new Date().toISOString(),
    }));
    setNotifications(prev => [...newNotifs, ...prev]);
    setSent(true);
    setForm({ title:'', message:'', type:'system', target:'all' });
    setTimeout(() => setSent(false), 3000);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-bold text-gray-900">Notifications & Announcements</h1>
        <p className="text-gray-500 text-sm">Send announcements to users.</p>
      </div>

      {/* Composer */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
        <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Send className="w-4 h-4 text-blue-600" /> Compose Announcement
        </h2>
        {sent && (
          <div className="flex items-center gap-2 bg-green-50 text-green-700 text-sm px-4 py-3 rounded-lg mb-4">
            <CheckCircle className="w-4 h-4" /> Notification sent successfully!
          </div>
        )}
        <form onSubmit={handleSend} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Target Audience</label>
              <select value={form.target} onChange={e => setForm(p => ({...p,target:e.target.value}))} className="input-field">
                <option value="all">All Customers</option>
                {users.filter(u=>u.role==='customer').map(u=>(
                  <option key={u.id} value={u.id}>{u.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Notification Type</label>
              <select value={form.type} onChange={e => setForm(p => ({...p,type:e.target.value as Notification['type']}))} className="input-field">
                <option value="system">System Announcement</option>
                <option value="auction_started">Auction Started</option>
                <option value="auction_ending">Auction Ending Soon</option>
                <option value="winner_announced">Winner Announced</option>
                <option value="wallet_updated">Wallet Updated</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
            <input value={form.title} onChange={e => setForm(p=>({...p,title:e.target.value}))} className="input-field" placeholder="Notification title..." required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
            <textarea value={form.message} onChange={e => setForm(p=>({...p,message:e.target.value}))}
              className="input-field min-h-[100px] resize-none" placeholder="Write your message..." required />
          </div>
          <button type="submit" className="btn-primary flex items-center gap-2">
            <Send className="w-4 h-4" /> Send Notification
          </button>
        </form>
      </div>

      {/* Recent Notifications */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
        <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Bell className="w-4 h-4 text-gray-500" /> All Notifications ({notifications.length})
        </h2>
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {notifications.map(n => (
            <div key={n.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
              <span className="text-lg mt-0.5">
                {n.type==='winner_announced'?'🏆':n.type==='auction_ending'?'⏰':n.type==='auction_started'?'🔔':n.type==='wallet_updated'?'💳':'📢'}
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-medium text-gray-900">{n.title}</p>
                  <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full">{n.type}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${n.read?'bg-gray-100 text-gray-400':'bg-blue-100 text-blue-600 font-medium'}`}>
                    {n.read?'read':'unread'}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-0.5">{n.message}</p>
                <p className="text-xs text-gray-400 mt-1">User: {n.userId} · {formatDate(n.timestamp)}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
