import { useApp } from '../../context/AppContext';
import { Bell, Check } from 'lucide-react';
import { formatDate } from '../../utils/countdown';

export default function Notifications() {
  const { notifications, markNotificationRead } = useApp();

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="space-y-6 font-sans pb-10">
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-black text-slate-900 flex items-center gap-3">
              <Bell className="w-6 h-6 text-emerald-600" /> Notifications
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              System alerts, auction updates, and bid notifications.
            </p>
          </div>
          {unreadCount > 0 && (
            <span className="bg-rose-100 text-rose-700 text-xs font-bold px-2.5 py-1 rounded-full">
              {unreadCount} Unread
            </span>
          )}
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        {notifications.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <Bell className="w-10 h-10 mx-auto mb-3 opacity-30" />
            No notifications yet.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {notifications.map(n => (
              <div
                key={n.id}
                className={`p-5 flex flex-col sm:flex-row sm:items-start gap-4 transition-colors ${n.read ? 'bg-white' : 'bg-emerald-50/40'}`}
              >
                <div className="shrink-0 w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600">
                  <Bell className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <h2 className={`text-sm font-bold text-slate-900 ${!n.read ? 'text-slate-900' : 'text-slate-600'}`}>
                      {n.title}
                    </h2>
                    <span className="text-[11px] text-slate-400 font-mono shrink-0">
                      {formatDate(n.timestamp)}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-slate-600 leading-relaxed">{n.message}</p>
                  <div className="mt-3 flex items-center gap-2">
                    <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${
                      n.read ? 'bg-slate-100 text-slate-500' : 'bg-emerald-100 text-emerald-700'
                    }`}>
                      {n.read ? 'Read' : 'Unread'}
                    </span>
                    {!n.read && (
                      <button
                        onClick={() => markNotificationRead(n.id)}
                        className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-white px-3 py-1 text-[11px] font-semibold text-emerald-700 hover:bg-emerald-50 transition-colors"
                      >
                        <Check className="w-3.5 h-3.5" /> Mark read
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
