import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider, useApp } from './context/AppContext';
import { ROUTES } from './utils/routes';

// Auth
import Login            from './pages/auth/Login';
import Register         from './pages/auth/Register';
import ForgotPassword   from './pages/auth/ForgotPassword';
import OtpVerify        from './pages/auth/OtpVerify';
import ResetPassword    from './pages/auth/ResetPassword';

// Layout
import CustomerLayout from './layouts/CustomerLayout';

// Customer pages
import Dashboard          from './pages/customer/Dashboard';
import AuctionList        from './pages/customer/AuctionList';
import AuctionDetail      from './pages/customer/AuctionDetail';
import WinnerVerification from './pages/customer/WinnerVerification';
import FairnessAudit      from './pages/customer/FairnessAudit';
import Wallet             from './pages/customer/Wallet';
import MyBids             from './pages/customer/MyBids';
import Notifications      from './pages/customer/Notifications';

function ProtectedCustomer({ children }: { children: React.ReactNode }) {
  const { currentUser } = useApp();
  if (!currentUser) return <Navigate to={ROUTES.LOGIN} replace />;
  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      {/* ── Public ─────────────────────────────────────────────────────── */}
      <Route path={ROUTES.LOGIN}           element={<Login />} />
      <Route path={ROUTES.REGISTER}        element={<Register />} />
      <Route path={ROUTES.FORGOT_PASSWORD} element={<ForgotPassword />} />
      <Route path={ROUTES.OTP_VERIFY}      element={<OtpVerify />} />
      <Route path={ROUTES.RESET_PASSWORD}  element={<ResetPassword />} />

      {/* ── Protected ──────────────────────────────────────────────────── */}
      <Route element={<ProtectedCustomer><CustomerLayout /></ProtectedCustomer>}>
        <Route path={ROUTES.DASHBOARD}              element={<Dashboard />} />
        <Route path={ROUTES.AUCTIONS}               element={<AuctionList />} />
        <Route path={`${ROUTES.AUCTION_DETAIL}/:id`} element={<AuctionDetail />} />
        <Route path={ROUTES.MY_BIDS}                element={<MyBids />} />
        <Route path={ROUTES.NOTIFICATIONS}          element={<Notifications />} />
        <Route path={ROUTES.WINNER_VERIFY}          element={<WinnerVerification />} />
        <Route path={ROUTES.FAIRNESS_AUDIT}         element={<FairnessAudit />} />
        <Route path={ROUTES.WALLET}                 element={<Wallet />} />
      </Route>

      {/* ── Fallback ───────────────────────────────────────────────────── */}
      <Route path="/" element={<Navigate to={ROUTES.LOGIN} replace />} />
      <Route path="*" element={<Navigate to={ROUTES.LOGIN} replace />} />
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
