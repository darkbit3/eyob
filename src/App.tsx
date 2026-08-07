import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider, useApp } from './context/AppContext';

// Auth
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ForgotPassword from './pages/auth/ForgotPassword';
import OtpVerify from './pages/auth/OtpVerify';
import ResetPassword from './pages/auth/ResetPassword';

// Layouts
import CustomerLayout from './layouts/CustomerLayout';
import AdminLayout from './layouts/AdminLayout';

// Customer pages
import Dashboard from './pages/customer/Dashboard';
import AuctionList from './pages/customer/AuctionList';
import AuctionDetail from './pages/customer/AuctionDetail';
import WinnerVerification from './pages/customer/WinnerVerification';
import Wallet from './pages/customer/Wallet';
import MyBids from './pages/customer/MyBids';

// Admin pages
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminAuctions from './pages/admin/AdminAuctions';
import AdminProducts from './pages/admin/AdminProducts';
import AdminUsers from './pages/admin/AdminUsers';
import AdminReports from './pages/admin/AdminReports';
import AdminNotifications from './pages/admin/AdminNotifications';
import AdminAuditLog from './pages/admin/AdminAuditLog';

function ProtectedCustomer({ children }: { children: React.ReactNode }) {
  const { currentUser } = useApp();
  if (!currentUser) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function ProtectedAdmin({ children }: { children: React.ReactNode }) {
  const { currentUser } = useApp();
  if (!currentUser) return <Navigate to="/login" replace />;
  if (currentUser.role !== 'admin') return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/login"          element={<Login />} />
      <Route path="/register"       element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/otp-verify"     element={<OtpVerify />} />
      <Route path="/reset-password" element={<ResetPassword />} />

      {/* Customer */}
      <Route element={<ProtectedCustomer><CustomerLayout /></ProtectedCustomer>}>
        <Route path="/dashboard"           element={<Dashboard />} />
        <Route path="/auctions"            element={<AuctionList />} />
        <Route path="/auction/:id"         element={<AuctionDetail />} />
        <Route path="/bids"                element={<MyBids />} />
        <Route path="/winner-verification" element={<WinnerVerification />} />
        <Route path="/verify/:id text"    element={<WinnerVerification />} />
        <Route path="/wallet"              element={<Wallet />} />
      </Route>

      {/* Admin */}
      <Route path="/admin" element={<ProtectedAdmin><AdminLayout /></ProtectedAdmin>}>
        <Route index                   element={<AdminDashboard />} />
        <Route path="auctions"         element={<AdminAuctions />} />
        <Route path="products"         element={<AdminProducts />} />
        <Route path="users"            element={<AdminUsers />} />
        <Route path="reports"          element={<AdminReports />} />
        <Route path="notifications"    element={<AdminNotifications />} />
        <Route path="audit"            element={<AdminAuditLog />} />
      </Route>

      {/* Root redirect */}
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AppProvider>
  );
}
