import { useState } from 'react';
import { Link, useNavigate, useLocation, Outlet } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { useLanguage } from '../context/LanguageContext';
import { ROUTES } from '../utils/routes';
import NotificationDropdown from '../components/NotificationDropdown';
import LanguageSelector from '../components/LanguageSelector';
import {
  Gavel, LayoutDashboard, Wallet, LogOut, ShieldCheck,
  Sparkles, Coins, History, Home, Search, Trophy,
  Download, Smartphone, CheckCircle2, Bell
} from 'lucide-react';

export default function CustomerLayout() {
  const { currentUser, setCurrentUser, bids } = useApp();
  const { t } = useLanguage();
  const nav = useNavigate();
  const loc = useLocation();

  const [installing, setInstalling] = useState(false);
  const [installedSuccess, setInstalledSuccess] = useState(false);

  const userBidsCount = bids.filter(b => b.bidderId === currentUser?.id).length;

  function logout() {
    setCurrentUser(null);
    nav(ROUTES.LOGIN);
  }

  function handleInstallApp() {
    setInstalling(true);

    // Trigger instant app download
    const element = document.createElement("a");
    const file = new Blob([
      `BidLow Auction Mobile App v1.0.4\nPlatform: Android APK / iOS Web App\nVerified Provably Fair System\nDownloaded: ${new Date().toISOString()}`
    ], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = "BidLow-App.apk";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);

    setTimeout(() => {
      setInstalling(false);
      setInstalledSuccess(true);
      setTimeout(() => setInstalledSuccess(false), 4000);
    }, 1200);
  }

  const desktopLinks = [
    { to: ROUTES.DASHBOARD,      icon: <LayoutDashboard className="w-4 h-4" />, label: t('dashboard') },
    { to: ROUTES.AUCTIONS,       icon: <Gavel className="w-4 h-4" />,           label: t('browse_auctions') },
    { to: ROUTES.WALLET,         icon: <Wallet className="w-4 h-4" />,          label: t('wallet') },
    { to: ROUTES.FAIRNESS_AUDIT, icon: <ShieldCheck className="w-4 h-4" />,     label: t('fairness_audit') },
  ];

  const mobileNavTabs = [
    { to: ROUTES.DASHBOARD,      icon: Home,    label: t('home') },
    { to: ROUTES.AUCTIONS,       icon: Search,  label: t('browse_auctions') },
    { to: ROUTES.MY_BIDS,        icon: History, label: t('my_bids'), badge: userBidsCount },
    { to: ROUTES.NOTIFICATIONS,  icon: Bell,    label: t('alerts') },
    { to: ROUTES.FAIRNESS_AUDIT, icon: Trophy,  label: t('audit') },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans relative">
      {/* Top Banner Notice */}
      <div className="bg-emerald-700 text-white text-xs py-2 px-4 text-center font-bold flex items-center justify-center gap-2 shadow-inner">
        <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
        <span>{t('welcome_banner')}</span>
        <span className="hidden md:inline-block bg-white/20 px-2.5 py-0.5 rounded-full text-[10px] uppercase tracking-wider font-extrabold">{t('provably_fair_badge')}</span>
      </div>

      {/* Header — White with Bold Green Accents */}
      <header className="glass-nav border-b border-slate-200 sticky top-0 z-40 shadow-sm">
        <div className="w-full px-4 sm:px-8 lg:px-12">
          <div className="flex items-center justify-between h-16">

            {/* Brand */}
            <Link to={ROUTES.DASHBOARD} className="flex items-center gap-3 group">
              <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center shadow-md shadow-emerald-600/30 group-hover:scale-105 transition-transform duration-300">
                <Gavel className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="font-black text-slate-900 text-xl tracking-tight group-hover:text-emerald-600 transition-colors">{t('app_title')}</span>
                <span className="text-[10px] text-emerald-600 block font-bold uppercase tracking-widest -mt-1">{t('app_subtitle')}</span>
              </div>
            </Link>

            {/* Desktop Nav Pills */}
            <div className="hidden md:flex items-center gap-1.5 bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
              {desktopLinks.map(l => {
                const active = loc.pathname.startsWith(l.to);
                return (
                  <Link key={l.to} to={l.to}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all duration-200
                      ${active ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900 hover:bg-white'}`}>
                    {l.icon}{l.label}
                  </Link>
                );
              })}
            </div>

            {/* Right Side Actions */}
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Language Switcher */}
              <LanguageSelector />

              {/* Credit Pill */}
              <Link to={ROUTES.WALLET} className="flex items-center gap-2 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-3 py-1.5 rounded-full transition-all duration-300">
                <div className="w-5 h-5 rounded-full bg-emerald-600 flex items-center justify-center text-white shadow-xs">
                  <Coins className="w-3 h-3" />
                </div>
                <div className="text-left leading-none">
                  <span className="text-[9px] text-emerald-700 font-bold block uppercase">{t('balance')}</span>
                  <span className="text-xs font-black text-emerald-900">{(currentUser?.walletBalance ?? 0).toLocaleString()}</span>
                </div>
              </Link>

              {/* My Bids Icon — desktop only */}
              <Link to={ROUTES.MY_BIDS}
                className="hidden md:flex relative p-2.5 text-slate-600 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-colors items-center justify-center"
                title={t('my_bids')}>
                <History className="w-5 h-5" />
                {userBidsCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-emerald-600 text-white text-[10px] font-black rounded-full flex items-center justify-center shadow-md">
                    {userBidsCount}
                  </span>
                )}
              </Link>

              {/* Notifications */}
              <NotificationDropdown />

              {/* User Avatar */}
              <div className="hidden sm:flex items-center gap-2.5 pl-2 border-l border-slate-200">
                <div className="w-9 h-9 bg-emerald-600 rounded-full flex items-center justify-center text-white font-black text-sm shadow-md ring-2 ring-emerald-100">
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
                  className="hidden sm:flex items-center gap-1.5 text-xs bg-emerald-700 text-white px-3 py-1.5 rounded-full font-bold transition-all shadow-sm hover:bg-emerald-800">
                  <ShieldCheck className="w-3.5 h-3.5" /> {t('admin')}
                </Link>
              )}

              {/* Logout */}
              <button onClick={logout} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors" title={t('logout')}>
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content — End-to-End Full Width (w-full) */}
      <main className="flex-1 w-full px-4 sm:px-8 lg:px-12 py-6 pb-28 md:pb-8">
        <Outlet />
      </main>

      {/* Desktop Footer */}
      <footer className="hidden md:block bg-white border-t border-slate-200 mt-auto py-6">
        <div className="w-full px-4 sm:px-8 lg:px-12 text-center sm:flex sm:items-center sm:justify-between text-xs text-slate-500 font-medium">
          <p>© {new Date().getFullYear()} BidLow Auction Systems. All rights reserved.</p>
          <div className="flex items-center justify-center gap-4 mt-3 sm:mt-0">
            <Link to={ROUTES.FAIRNESS_AUDIT} className="hover:text-emerald-600 transition-colors">Provably Fair Algorithm</Link>
            <span>•</span>
            <Link to={ROUTES.AUCTIONS} className="hover:text-emerald-600 transition-colors">Live Auctions</Link>
          </div>
        </div>
      </footer>

      {/* ══════════════════════════════════════════════════════════
          CIRCULAR FLOATING ACTION BUTTON (FAB) FOR GET APP
      ══════════════════════════════════════════════════════════ */}
      <div className="fixed bottom-24 left-4 md:bottom-6 md:left-6 z-50 group">
        <button
          onClick={handleInstallApp}
          disabled={installing}
          className="relative w-14 h-14 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xl shadow-emerald-600/50 flex flex-col items-center justify-center border-2 border-emerald-400/40 transition-all duration-300 active:scale-90 hover:scale-110"
          title="Download BidLow App"
        >
          {/* Pulsing ring around circular button */}
          <span className="absolute -inset-1 rounded-full border-2 border-emerald-500 animate-ping opacity-40"></span>

          {/* Smartphone + Download icon inside circle */}
          <div className="relative">
            <Smartphone className="w-6 h-6 text-amber-300 group-hover:scale-110 transition-transform" />
            <Download className="w-3 h-3 text-white absolute -bottom-1 -right-1 bg-emerald-800 rounded-full p-0.5 animate-bounce" />
          </div>

          <span className="text-[8px] font-black uppercase text-emerald-100 tracking-tighter mt-0.5 leading-none">
            {installing ? '...' : 'Get App'}
          </span>
        </button>
      </div>

      {/* Success Toast */}
      {installedSuccess && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-emerald-600 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 animate-in slide-in-from-top-4 font-sans border border-emerald-400">
          <CheckCircle2 className="w-5 h-5 text-amber-300 animate-bounce" />
          <div>
            <p className="text-xs font-black">BidLow App Downloaded!</p>
            <p className="text-[10px] text-emerald-100 font-medium">Downloading APK package to your device...</p>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════
          MOBILE BOTTOM NAVIGATION BAR
      ══════════════════════════════════════════════════════════ */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40">
        <div className="bg-white/95 backdrop-blur-xl border-t border-slate-200 shadow-[0_-4px_24px_rgba(0,0,0,0.08)]">
          {/* User info strip */}
          <div className="flex items-center justify-between px-4 py-2 border-b border-slate-100 bg-emerald-50/80">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-emerald-600 rounded-full flex items-center justify-center text-white font-black text-xs shadow ring-2 ring-emerald-100">
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
                  className="flex items-center gap-1 text-[10px] bg-emerald-700 text-white px-2.5 py-1 rounded-full font-bold">
                  <ShieldCheck className="w-3 h-3" /> Admin
                </Link>
              )}
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
                    ${active ? 'text-emerald-600' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  {active && (
                    <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-emerald-600 rounded-full" />
                  )}

                  <div className={`relative w-10 h-8 flex items-center justify-center rounded-xl transition-all duration-200
                    ${active ? 'bg-emerald-50 scale-110' : 'scale-100'}`}>
                    <Icon className={`w-5 h-5 ${active ? 'text-emerald-600' : 'text-slate-400'}`} />
                    {badge && badge > 0 && (
                      <span className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-600 text-white text-[9px] font-black rounded-full flex items-center justify-center shadow">
                        {badge > 9 ? '9+' : badge}
                      </span>
                    )}
                  </div>

                  <span className={`text-[10px] font-bold leading-none ${active ? 'text-emerald-600' : 'text-slate-400'}`}>
                    {label}
                  </span>
                </Link>
              );
            })}
          </div>

          <div className="h-safe-area-inset-bottom" style={{ height: 'env(safe-area-inset-bottom, 0px)' }} />
        </div>
      </nav>
    </div>
  );
}
