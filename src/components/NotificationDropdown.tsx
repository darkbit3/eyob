import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { ROUTES } from '../utils/routes';
import { Bell, Check, Sparkles, Wallet, Gavel, ShieldAlert, Trophy } from 'lucide-react';

export default function NotificationDropdown() {
  const { notifications, markNotificationRead } = useApp();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const unreadNotifications = notifications
    .filter(n => !n.read)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  const unreadCount = unreadNotifications.length;

  useEffect(() => {
    function closeOnOutsideClick(event: PointerEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener('pointerdown', closeOnOutsideClick);
    return () => document.removeEventListener('pointerdown', closeOnOutsideClick);
  }, []);

  const getIcon = (type: string) => {
    switch (type) {
      case 'winner_announced': return <Sparkles className="w-4 h-4 text-amber-500" />;
      case 'wallet_updated': return <Wallet className="w-4 h-4 text-emerald-500" />;
      case 'auction_started': return <Gavel className="w-4 h-4 text-blue-500" />;
      default: return <ShieldAlert className="w-4 h-4 text-purple-500" />;
    }
  };

  return (
    <div ref={containerRef} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2.5 text-slate-600 hover:text-blue-600 hover:bg-slate-100 rounded-xl transition-colors"
        title="Notifications"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-rose-500 text-white text-[10px] font-black rounded-full flex items-center justify-center shadow-md animate-pulse">
            {unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-3 w-80 sm:w-96 bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border border-slate-200 z-50 overflow-hidden animate-in fade-in-50 zoom-in-95">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-blue-400" />
                <h3 className="font-bold text-sm">System Notifications</h3>
              </div>
              <span className="text-[10px] bg-blue-600 text-white px-2 py-0.5 rounded-full font-extrabold uppercase">
                {unreadCount} Unread
              </span>
            </div>

            <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
              {unreadNotifications.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400">
                  No unread notifications
                </div>
              ) : (
                unreadNotifications.map(n => (
                  <div
                    key={n.id}
                    onClick={() => {
                      markNotificationRead(n.id);
                      setOpen(false);
                    }}
                    className="p-4 hover:bg-slate-50 transition-colors cursor-pointer flex gap-3 bg-blue-50/40"
                  >
                    <div className="mt-0.5 p-2 bg-slate-100 rounded-xl flex-shrink-0">
                      {getIcon(n.type)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="text-xs font-bold text-slate-900">{n.title}</h4>
                        <span className="text-[10px] text-slate-400">
                          {new Date(n.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed mb-1">{n.message}</p>
                      {n.type === 'winner_announced' && (
                        <Link
                          to={ROUTES.NOTIFICATIONS}
                          onClick={() => { markNotificationRead(n.id); setOpen(false); }}
                          className="inline-flex items-center gap-1 text-[10px] font-black text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full"
                        >
                          <Trophy className="w-3 h-3" /> View My Win & Order →
                        </Link>
                      )}
                      {!n.read && n.type !== 'winner_announced' && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-600">
                          <Check className="w-3 h-3" /> Mark as read
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
            <div className="p-3 border-t border-slate-200 bg-slate-50 text-center">
              <Link
                to={ROUTES.NOTIFICATIONS}
                onClick={() => setOpen(false)}
                className="text-xs text-blue-600 font-semibold hover:text-blue-800"
              >
                View all notifications
              </Link>
            </div>
        </div>
      )}
    </div>
  );
}
