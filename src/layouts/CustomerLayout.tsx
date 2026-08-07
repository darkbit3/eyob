import { Link, useNavigate, useLocation, Outlet } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import NotificationDropdown from '../components/NotificationDropdown';
import {
  Gavel, LayoutDashboard, Wallet, LogOut, ShieldCheck,
  Sparkles, Coins, History, Home, Search, Trophy
} from 'lucide-react';

export default function CustomerLayout() {
  const { currentUser, setCurrentUser, bids } = useApp();
  const nav = useNavigate();
  const loc = useLocation();

  const userBidsCount = bids.filter(b => b.bidderId === currentUser?.id).length;

  function logout() {
    setCurrentUser(null);
    nav('/login');
  }

  const desktopLinks = [
    { to: '/dashboard', icon: <LayoutDashboard className="w-4 h-4" />, label: 'Dashboard' },
    { to: '/auctions', icon: <Gavel className="w-4 h-4" />, label: 'Browse Auctions' },
    { to: '/wallet', icon: <Wallet className="w-4 h-4" />, label: 'Wallet & Credits' },
    { to: '/winner-verification', icon: <ShieldCheck className="w-4 h-4" />, label: 'Fairness Audit' },
  ];

  // Mobile bottom nav tabs
  const mobileNavTabs = [
    { to: '/dashboard', icon: Home, label: 'Home' },
    { to: '/auctions', icon: Search, label: 'Auctions' },
    { to: '/bids', icon: History, label: 'My Bids', badge: userBidsCount },
    { to: '/wallet', icon: Wallet, label: 'Wallet' },
    { to: '/winner-verification', icon: Trophy, label: 'Audit' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-purple-800 text-white text-xs py-2 px-4 text-center font-medium flex items-center justify-center gap-2 shadow-inner">
        <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
        <span>Welcome to <strong>BidLow</strong> — Ethiopia's premier Lowest Unique Bid Auction Platform!</span>
        <span className="hidden md:inline-block bg-white/20 px-2 py-0.5 rounded text-[10px] uppercase tracking-wider font-bold">100% Provably Fair</span>
      </div>

      {/* Header */}
      <header className="glass-nav border-b border-slate-200/80 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">

            {/* Brand */}
            <Link to="/dashboard" className="flex items-center gap-3 group">
              <div className="w-10 h-10 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-md shadow-blue-500/30 group-hover:scale-105 transition-transform duration-300">
                <Gavel className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="font-bold text-slate-900 text-xl tracking-tight group-hover:text-blue-600 transition-colors">BidLow</span>
                <span className="text-[10px] text-blue-600 block font-semibold uppercase tracking-widest -mt-1">Unique Auctions</span>
              </div>
            </Link>

            {/* Desktop Nav Pills */}
            <div className="hidden md:flex items-center gap-1.5 bg-slate-100/70 p-1.5 rounded-2xl border border-slate-200/60">
              {desktopLinks.map(l => {
                const active = loc.pathname.startsWith(l.to);
                return (
                  <Link key={l.to} to={l.to}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200
                      ${active ? 'bg-white text-blue-600 shadow-sm border border-slate-200/60' : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'}`}>
                    {l.icon}{l.label}
                  </Link>
                );
              })}
            </div>

            {/* Right Side Actions */}
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Credit Pill */}
              <Link to="/wallet" className="flex items-center gap-2 bg-gradient-to-r from-amber-500/10 to-orange-500/10 hover:from-amber-500/20 hover:to-orange-500/20 border border-amber-300/40 px-3 py-1.5 rounded-full transition-all duration-300">
                <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center text-white shadow-sm">
                  <Coins className="w-3 h-3" />
                </div>
                <div className="text-left leading-none">
                  <span className="text-[10px] text-amber-700 font-bold block uppercase">Credits</span>
                  <span className="text-xs font-black text-amber-800">{currentUser?.credits ?? 0}</span>
                </div>
              </Link>

              {/* My Bids Icon — desktop only */}
              <Link to="/bids"
                className="hidden md:flex relative p-2.5 text-slate-600 hover:text-blue-600 hover:bg-slate-100 rounded-xl transition-colors items-center justify-center"
                title="My Bids">
                <History className="w-5 h-5" />
                {userBidsCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-blue-600 text-white text-[10px] font-black rounded-full flex items-center justify-center shadow-md">
                    {userBidsCount}
                  </span>
                )}
              </Link>

              {/* Notifications */}
              <NotificationDropdown />

              {/* User Avatar */}
              <div className="hidden sm:flex items-center gap-2.5 pl-2 border-l border-slate-200">
                <div className="w-9 h-9 bg-gradient-to-tr from-blue-600 to-indigo-700 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-md ring-2 ring-blue-100">
                  {currentUser?.name?.charAt(0) ?? 'U'}
                </div>
                <div className="hidden lg:block text-left leading-tight">
                  <span className="text-xs font-bold text-slate-800 block">{currentUser?.name ?? 'Guest'}</span>
                  <span className="text-[10px] text-slate-500 capitalize">{currentUser?.role ?? 'Member'}</span>
                </div>
              </div>

              {/* Admin Portal */}
              {currentUser?.role === 'admin' && (
                <Link to="/admin"
                  className="hidden sm:flex items-center gap-1.5 text-xs bg-purple-50 hover:bg-purple-100 border border-purple-200 text-purple-700 px-3 py-1.5 rounded-full font-bold transition-all shadow-sm">
                  <ShieldCheck className="w-3.5 h-3.5 text-purple-600" /> Admin
                </Link>
              )}

              {/* Logout */}
              <button onClick={logout} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors" title="Logout">
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content — extra bottom padding on mobile for the nav bar */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-28 md:pb-8">
        <Outlet />
      </main>

      {/* Desktop Footer */}
      <footer className="hidden md:block bg-white border-t border-slate-200 mt-auto py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center sm:flex sm:items-center sm:justify-between text-xs text-slate-500 font-medium">
          <p>© {new Date().getFullYear()} BidLow Auction Systems. All rights reserved.</p>
          <div className="flex items-center justify-center gap-4 mt-3 sm:mt-0">
            <Link to="/winner-verification" className="hover:text-blue-600 transition-colors">Provably Fair Algorithm</Link>
            <span>•</span>
            <Link to="/auctions" className="hover:text-blue-600 transition-colors">Live Auctions</Link>
          </div>
        </div>
      </footer>

      {/* ══════════════════════════════════════════════════════════
          MOBILE BOTTOM NAVIGATION BAR
      ══════════════════════════════════════════════════════════ */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50">
        {/* Frosted glass background */}
        <div className="bg-white/90 backdrop-blur-xl border-t border-slate-200/80 shadow-[0_-4px_24px_rgba(0,0,0,0.08)]">
          {/* User info strip */}
          <div className="flex items-center justify-between px-4 py-2 border-b border-slate-100/80 bg-gradient-to-r from-blue-50/80 to-indigo-50/80">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-gradient-to-tr from-blue-600 to-indigo-700 rounded-full flex items-center justify-center text-white font-bold text-xs shadow ring-2 ring-blue-100">
                {currentUser?.name?.charAt(0) ?? 'U'}
              </div>
              <div className="leading-tight">
                <p className="text-[11px] font-black text-slate-800 truncate max-w-[120px]">{currentUser?.name ?? 'Guest'}</p>
                <p className="text-[9px] text-slate-500 capitalize">{currentUser?.role ?? 'Member'}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {currentUser?.role === 'admin' && (
                <Link to="/admin"
                  className="flex items-center gap-1 text-[10px] bg-purple-100 text-purple-700 border border-purple-200 px-2 py-1 rounded-full font-bold">
                  <ShieldCheck className="w-3 h-3" /> Admin
                </Link>
              )}
              <div className="flex items-center gap-1 bg-amber-50 border border-amber-200 px-2 py-1 rounded-full">
                <Coins className="w-3 h-3 text-amber-500" />
                <span className="text-[10px] font-black text-amber-700">{currentUser?.credits ?? 0}</span>
              </div>
              <button onClick={logout}
                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors">
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Nav Tabs */}
          <div className="flex items-stretch">
            {mobileNavTabs.map(({ to, icon: Icon, label, badge }) => {
              const active = loc.pathname === to || loc.pathname.startsWith(to + '/');
              return (
                <Link
                  key={to}
                  to={to}
                  className={`flex-1 flex flex-col items-center justify-center py-3 gap-1 relative transition-all duration-200
                    ${active ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  {/* Active indicator bar */}
                  {active && (
                    <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-blue-600 rounded-full" />
                  )}

                  {/* Icon wrapper */}
                  <div className={`relative w-10 h-8 flex items-center justify-center rounded-xl transition-all duration-200
                    ${active ? 'bg-blue-50 scale-110' : 'scale-100'}`}>
                    <Icon className={`w-5 h-5 ${active ? 'text-blue-600' : 'text-slate-400'}`} />
                    {/* Badge */}
                    {badge && badge > 0 && (
                      <span className="absolute -top-1 -right-1 w-4 h-4 bg-blue-600 text-white text-[9px] font-black rounded-full flex items-center justify-center shadow">
                        {badge > 9 ? '9+' : badge}
                      </span>
                    )}
                  </div>

                  <span className={`text-[10px] font-bold leading-none ${active ? 'text-blue-600' : 'text-slate-400'}`}>
                    {label}
                  </span>
                </Link>
              );
            })}
          </div>

          {/* Safe area spacer for iOS */}
          <div className="h-safe-area-inset-bottom" style={{ height: 'env(safe-area-inset-bottom, 0px)' }} />
        </div>
      </nav>
    </div>
  );
}
