import { useState } from 'react';
import { Link, useNavigate, useLocation, Outlet } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import {
  Gavel, LayoutDashboard, Package, Users, BarChart3,
  Bell, ClipboardList, LogOut, Menu, ChevronRight
} from 'lucide-react';

export default function AdminLayout() {
  const { setCurrentUser } = useApp();
  const nav = useNavigate();
  const loc = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  function logout() { setCurrentUser(null); nav('/login'); }

  const links = [
    { to: '/admin',               icon: <LayoutDashboard className="w-4 h-4" />, label: 'Dashboard',  exact: true },
    { to: '/admin/auctions',      icon: <Gavel className="w-4 h-4" />,           label: 'Auctions'              },
    { to: '/admin/products',      icon: <Package className="w-4 h-4" />,         label: 'Products'              },
    { to: '/admin/users',         icon: <Users className="w-4 h-4" />,           label: 'Users'                 },
    { to: '/admin/reports',       icon: <BarChart3 className="w-4 h-4" />,       label: 'Reports'               },
    { to: '/admin/notifications', icon: <Bell className="w-4 h-4" />,            label: 'Notifications'         },
    { to: '/admin/audit',         icon: <ClipboardList className="w-4 h-4" />,   label: 'Audit Log'             },
  ];

  const isActive = (link: { to: string; exact?: boolean }) =>
    link.exact ? loc.pathname === link.to : loc.pathname.startsWith(link.to);

  const Sidebar = () => (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 px-6 py-5 border-b border-purple-800">
        <div className="w-9 h-9 bg-white/20 rounded-lg flex items-center justify-center">
          <Gavel className="w-5 h-5 text-white" />
        </div>
        <div>
          <p className="text-white font-bold text-base">BidLow</p>
          <p className="text-purple-300 text-xs">Admin Panel</p>
        </div>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {links.map(l => (
          <Link key={l.to} to={l.to} onClick={() => setSidebarOpen(false)}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors
              ${isActive(l) ? 'bg-white/20 text-white' : 'text-purple-200 hover:bg-white/10 hover:text-white'}`}>
            {l.icon}
            <span>{l.label}</span>
            {isActive(l) && <ChevronRight className="w-3 h-3 ml-auto" />}
          </Link>
        ))}
      </nav>
      <div className="px-3 pb-4 border-t border-purple-800 pt-4">
        <Link to="/dashboard"
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-purple-200 hover:bg-white/10 hover:text-white mb-1">
          ← Customer View
        </Link>
        <button onClick={logout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-purple-200 hover:bg-red-500/20 hover:text-red-300 w-full text-left">
          <LogOut className="w-4 h-4" /> Logout
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      <aside className="hidden lg:flex flex-col w-56 bg-gradient-to-b from-purple-900 to-purple-800 flex-shrink-0">
        <Sidebar />
      </aside>

      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="w-56 bg-gradient-to-b from-purple-900 to-purple-800">
            <Sidebar />
          </div>
          <div className="flex-1 bg-black/40" onClick={() => setSidebarOpen(false)} />
        </div>
      )}

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white border-b border-gray-200 px-4 sm:px-6 py-3 flex items-center gap-3">
          <button className="lg:hidden text-gray-600 p-1" onClick={() => setSidebarOpen(!sidebarOpen)}>
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <h1 className="text-base font-semibold text-gray-900">
              {links.find(isActive)?.label ?? 'Admin'}
            </h1>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
