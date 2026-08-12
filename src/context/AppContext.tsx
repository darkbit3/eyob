import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  User, Auction, Bid, Transaction, Notification, Product, PaymentQueueItem, Announcement, AuditLog, SystemSettings,
  mockUsers, mockAuctions, mockBidsA005, mockBidsA006, mockTransactions, mockNotifications,
  mockProducts, mockPaymentQueue, mockAnnouncements, mockAuditLogs, initialSettings,
} from '../data/mockData';
import {
  getToken, removeToken,
  usersApi, auctionsApi, productsApi, bidsApi,
  walletApi, notificationsApi,
} from '../utils/api';

interface AppContextType {
  currentUser: User | null;
  setCurrentUser: (u: User | null) => void;
  
  // Data States
  auctions: Auction[];
  setAuctions: React.Dispatch<React.SetStateAction<Auction[]>>;
  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  users: User[];
  setUsers: React.Dispatch<React.SetStateAction<User[]>>;
  bids: Bid[];
  setBids: React.Dispatch<React.SetStateAction<Bid[]>>;
  transactions: Transaction[];
  setTransactions: React.Dispatch<React.SetStateAction<Transaction[]>>;
  paymentQueue: PaymentQueueItem[];
  setPaymentQueue: React.Dispatch<React.SetStateAction<PaymentQueueItem[]>>;
  notifications: Notification[];
  setNotifications: React.Dispatch<React.SetStateAction<Notification[]>>;
  announcements: Announcement[];
  setAnnouncements: React.Dispatch<React.SetStateAction<Announcement[]>>;
  auditLogs: AuditLog[];
  setAuditLogs: React.Dispatch<React.SetStateAction<AuditLog[]>>;
  settings: SystemSettings;
  setSettings: React.Dispatch<React.SetStateAction<SystemSettings>>;

  // Actions
  markNotificationRead: (id: string) => void;
  placeBid: (auctionId: string, amount: number) => boolean;
  editBid: (bidId: string, newAmount: number) => boolean;
  refreshCurrentUser: () => Promise<void>;
  logout: () => void;

  // Admin Actions
  addAuditLog: (action: string, target: string, details: string) => void;
  createAuction: (auction: Omit<Auction, 'id' | 'totalParticipants' | 'totalBids'>) => void;
  updateAuction: (id: string, updates: Partial<Auction>) => void;
  pauseAuction: (id: string) => void;
  resumeAuction: (id: string) => void;
  cancelAuction: (id: string) => void;
  addProduct: (product: Omit<Product, 'id' | 'createdAt'>) => void;
  updateProduct: (id: string, updates: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  toggleUserStatus: (userId: string) => void;
  deleteUser: (userId: string) => void;
  approvePayment: (queueId: string) => void;
  rejectPayment: (queueId: string, reason?: string) => void;
  adjustUserWallet: (userId: string, amount: number, reason: string) => void;
  sendAnnouncement: (announcement: Omit<Announcement, 'id' | 'timestamp' | 'deliveredCount' | 'sentBy'>) => void;
  updateSystemSettings: (newSettings: Partial<SystemSettings>) => void;
}

const AppContext = createContext<AppContextType | null>(null);

// ── Shape converter: API row → App User ───────────────────────────────────────
function apiToUser(u: any): User {
  return {
    id: u.id,
    name: u.name,
    email: u.email ?? '',
    phone: u.phone ?? '',
    role: u.role,
    walletBalance: Number(u.wallet_balance ?? u.walletBalance ?? 0),
    status: u.status,
    joinedAt: u.joined_at ?? u.joinedAt ?? new Date().toISOString().split('T')[0],
    wonAuctions: u.won_auctions ?? u.wonAuctions ?? [],
    photo: u.photo_url ?? u.photo ?? undefined,
  };
}

function apiToAuction(a: any): Auction {
  return {
    id: a.id,
    productId: a.product_id ?? a.productId ?? undefined,
    productName: a.product_name ?? a.productName ?? undefined,
    title: a.title,
    description: a.description ?? '',
    image: a.image_url ?? a.image ?? a.imageUrl ?? '',
    retailValue: Number(a.retail_value ?? a.retailValue ?? 0),
    category: a.category,
    status: a.status,
    startTime: a.start_time ?? a.startTime ?? '',
    endTime: a.end_time ?? a.endTime ?? '',
    minBid: Number(a.min_bid ?? a.minBid ?? 1),
    maxBid: Number(a.max_bid ?? a.maxBid ?? 500),
    totalParticipants: Number(a.total_participants ?? a.totalParticipants ?? 0),
    totalBids: Number(a.total_bids ?? a.totalBids ?? 0),
  };
}

function apiToProduct(p: any): Product {
  const images = Array.isArray(p.images)
    ? p.images
    : p.images
      ? JSON.parse(p.images)
      : [];

  return {
    id: p.id,
    name: p.name,
    category: p.category,
    image: p.image_url ?? (images.length > 0 ? images[0] : p.image ?? ''),
    images,
    retailValue: Number(p.retail_value ?? p.retailValue ?? 0),
    description: p.description ?? '',
    linkedAuctionId: p.linked_auction_id ?? p.linkedAuctionId ?? undefined,
    linkedAuctionStatus: p.linked_auction_status ?? p.linkedAuctionStatus ?? undefined,
    createdAt: p.created_at ?? p.createdAt ?? new Date().toISOString().split('T')[0],
  };
}

function apiToBid(b: any): Bid {
  return {
    id: b.id,
    auctionId: b.auction_id ?? b.auctionId ?? '',
    bidderId: b.bidder_id ?? b.bidderId ?? '',
    maskedBidderId: b.masked_bidder_id ?? b.maskedBidderId ?? '',
    amount: Number(b.amount ?? 0),
    timestamp: b.created_at ?? b.timestamp ?? new Date().toISOString(),
    isDuplicate: Boolean(b.is_duplicate ?? b.isDuplicate ?? false),
    isLowestUnique: Boolean(b.is_lowest_unique ?? b.isLowestUnique ?? false),
  };
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUserState] = useState<User | null>(null);
  const [auctions, setAuctions] = useState<Auction[]>(mockAuctions);
  const [products, setProducts] = useState<Product[]>(mockProducts);
  const [users, setUsers] = useState<User[]>(mockUsers);
  const [bids, setBids] = useState<Bid[]>([...mockBidsA005, ...mockBidsA006]);
  const [transactions, setTransactions] = useState<Transaction[]>(mockTransactions);
  const [paymentQueue, setPaymentQueue] = useState<PaymentQueueItem[]>(mockPaymentQueue);
  const [notifications, setNotifications] = useState<Notification[]>(mockNotifications);
  const [announcements, setAnnouncements] = useState<Announcement[]>(mockAnnouncements);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(mockAuditLogs);
  const [settings, setSettings] = useState<SystemSettings>(initialSettings);

  // ── On mount: restore session & load live data ──────────────────────────────
  useEffect(() => {
    const token = getToken();
    if (!token) return;

    // Restore current user from API
    usersApi.me()
      .then(res => setCurrentUserState(apiToUser(res.data)))
      .catch(() => removeToken());

    // Load auctions
    auctionsApi.list()
      .then(res => setAuctions(res.data.map(apiToAuction)))
      .catch(() => {/* keep mock */});

    // Load products
    productsApi.list()
      .then(res => setProducts(res.data.map(apiToProduct)))
      .catch(() => {});

    // Load my bids
    bidsApi.myBids()
      .then(res => setBids((res.data || []).map(apiToBid)))
      .catch(() => {});

    // Load my transactions
    walletApi.myTransactions()
      .then(res => setTransactions(res.data))
      .catch(() => {});

    // Load notifications
    notificationsApi.my()
      .then(res => setNotifications(res.data))
      .catch(() => {});
  }, []);

  async function refreshCurrentUser() {
    try {
      const res = await usersApi.me();
      setCurrentUserState(apiToUser(res.data));
    } catch (_err) {
      // silently ignore — keep stale data
    }
  }

  async function refreshMyBids() {
    if (!currentUser?.id) {
      setBids([]);
      return;
    }

    try {
      const res = await bidsApi.myBids();
      setBids((res.data || []).map(apiToBid));
    } catch {
      setBids([]);
    }
  }

  // Poll current user profile to keep walletBalance in sync after backend changes
  useEffect(() => {
    let id: number | undefined;
    async function poll() {
      try {
        const res = await usersApi.me();
        setCurrentUserState(apiToUser(res.data));
      } catch (e) {}
    }
    if (currentUser) {
      poll();
      id = window.setInterval(poll, 30000);
    }
    return () => { if (id) window.clearInterval(id); };
  }, [currentUser?.id]);

  useEffect(() => {
    void refreshMyBids();
  }, [currentUser?.id]);

  // Poll notifications so customers see new auction alerts without needing a manual refresh
  useEffect(() => {
    let id: number | undefined;
    async function pollNotifications() {
      try {
        const res = await notificationsApi.my();
        setNotifications(res.data);
      } catch (e) {}
    }
    if (currentUser) {
      pollNotifications();
      id = window.setInterval(pollNotifications, 30000);
    }
    return () => { if (id) window.clearInterval(id); };
  }, [currentUser?.id]);

  function setCurrentUser(u: User | null) {
    setCurrentUserState(u);
    // If user is set, reload their fresh data
    if (u) {
      auctionsApi.list()
        .then(res => setAuctions(res.data.map(apiToAuction)))
        .catch(() => {});
      productsApi.list()
        .then(res => setProducts(res.data.map(apiToProduct)))
        .catch(() => {});
      bidsApi.myBids()
        .then(res => setBids((res.data || []).map(apiToBid)))
        .catch(() => setBids([]));
      walletApi.myTransactions()
        .then(res => setTransactions(res.data))
        .catch(() => {});
      notificationsApi.my()
        .then(res => setNotifications(res.data))
        .catch(() => {});
    }
  }

  function logout() {
    removeToken();
    setCurrentUserState(null);
  }

  function addAuditLog(action: string, target: string, details: string) {
    const adminName = currentUser?.name || 'System Engine';
    const adminId = currentUser?.id || 'sys';
    const newLog: AuditLog = {
      id: `log${Date.now()}`,
      adminId,
      adminName,
      action,
      target,
      details,
      ipAddress: '197.156.104.12',
      timestamp: new Date().toISOString(),
    };
    setAuditLogs(prev => [newLog, ...prev]);
  }

  function markNotificationRead(id: string) {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    notificationsApi.markRead(id).catch(() => {});
  }

  function placeBid(auctionId: string, amount: number): boolean {
    if (!currentUser) return false;

    const safeAmount = Number(amount.toFixed(1));
    if (Number.isNaN(safeAmount) || safeAmount <= 0) return false;
    if (currentUser.walletBalance < safeAmount) return false;

    void bidsApi.place(auctionId, safeAmount)
      .then((res) => {
        const bidData = res.data || {};
        void bidData;

        setUsers(prev => prev.map(u => u.id === currentUser.id
          ? { ...u, walletBalance: Math.max(0, Number(u.walletBalance) - safeAmount) }
          : u
        ));
        setAuctions(prev => prev.map(a => a.id === auctionId ? { ...a, totalBids: a.totalBids + 1 } : a));

        const tx: Transaction = {
          id: `t${Date.now()}`,
          userId: currentUser.id,
          userName: currentUser.name,
          type: 'bid_placed',
          amount: -safeAmount,
          description: `Bid of ${safeAmount} ETB placed on auction #${auctionId}`,
          timestamp: new Date().toISOString(),
          status: 'completed',
        };
        setTransactions(prev => [tx, ...prev]);

        setCurrentUser({
          ...currentUser,
          walletBalance: Math.max(0, Number(currentUser.walletBalance) - safeAmount),
        });

        void refreshMyBids();
        refreshCurrentUser().catch(() => {});
      })
      .catch(() => {
        // Keep the UI in sync with backend validation errors by not forcing a stale local state change.
      });

    return true;
  }

  function editBid(bidId: string, newAmount: number): boolean {
    if (!currentUser) return false;
    setBids(prev => prev.map(b => b.id === bidId ? { ...b, amount: newAmount, timestamp: new Date().toISOString() } : b));
    return true;
  }

  // ── Admin Actions ─────────────────────────────────────────────────────────────
  function createAuction(auctionData: Omit<Auction, 'id' | 'totalParticipants' | 'totalBids'>) {
    const id = `a0${auctions.length + 1}`;
    const newAuction: Auction = { ...auctionData, id, totalParticipants: 0, totalBids: 0 };
    setAuctions(prev => [newAuction, ...prev]);
    addAuditLog('Created Auction', newAuction.title, `Category: ${newAuction.category}, Retail Value: ${newAuction.retailValue} ETB`);
  }

  function updateAuction(id: string, updates: Partial<Auction>) {
    setAuctions(prev => prev.map(a => a.id === id ? { ...a, ...updates } : a));
    const target = auctions.find(a => a.id === id);
    addAuditLog('Edited Auction', target?.title || id, `Updated parameters: ${Object.keys(updates).join(', ')}`);
  }

  function pauseAuction(id: string) {
    setAuctions(prev => prev.map(a => a.id === id ? { ...a, status: 'paused' } : a));
    const target = auctions.find(a => a.id === id);
    addAuditLog('Paused Auction', target?.title || id, 'Auction status changed to PAUSED.');
  }

  function resumeAuction(id: string) {
    setAuctions(prev => prev.map(a => a.id === id ? { ...a, status: 'active' } : a));
    const target = auctions.find(a => a.id === id);
    addAuditLog('Resumed Auction', target?.title || id, 'Auction status changed to ACTIVE.');
  }

  function cancelAuction(id: string) {
    setAuctions(prev => prev.map(a => a.id === id ? { ...a, status: 'closed' } : a));
    const target = auctions.find(a => a.id === id);
    addAuditLog('Cancelled Auction', target?.title || id, 'Auction cancelled by admin.');
  }

  function addProduct(prodData: Omit<Product, 'id' | 'createdAt'>) {
    const id = `p0${products.length + 1}`;
    const newProd: Product = { ...prodData, id, createdAt: new Date().toISOString().split('T')[0] };
    setProducts(prev => [newProd, ...prev]);
    addAuditLog('Created Product', newProd.name, `Retail value: ${newProd.retailValue} ETB`);
  }

  function updateProduct(id: string, updates: Partial<Product>) {
    setProducts(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
    const target = products.find(p => p.id === id);
    addAuditLog('Updated Product', target?.name || id, `Fields updated: ${Object.keys(updates).join(', ')}`);
  }

  function deleteProduct(id: string) {
    const target = products.find(p => p.id === id);
    setProducts(prev => prev.filter(p => p.id !== id));
    addAuditLog('Deleted Product', target?.name || id, 'Product deleted from inventory catalog.');
  }

  function toggleUserStatus(userId: string) {
    setUsers(prev => prev.map(u => {
      if (u.id === userId) {
        const nextStatus = u.status === 'active' ? 'suspended' : 'active';
        addAuditLog(nextStatus === 'suspended' ? 'Suspended User' : 'Activated User', `${u.name} (${u.id})`, `Status changed to ${nextStatus.toUpperCase()}`);
        return { ...u, status: nextStatus };
      }
      return u;
    }));
  }

  function deleteUser(userId: string) {
    const target = users.find(u => u.id === userId);
    setUsers(prev => prev.filter(u => u.id !== userId));
    addAuditLog('Deleted User Account', `${target?.name} (${userId})`, 'User removed from platform registry.');
  }

  function approvePayment(queueId: string) {
    const item = paymentQueue.find(p => p.id === queueId);
    if (!item) return;
    setPaymentQueue(prev => prev.map(p => p.id === queueId ? { ...p, status: 'approved', notes: `Approved by ${currentUser?.name || 'Admin'}` } : p));
    setUsers(prev => prev.map(u => u.id === item.userId ? { ...u, walletBalance: u.walletBalance + item.amount } : u));
    const tx: Transaction = {
      id: `t${Date.now()}`, userId: item.userId, userName: item.userName,
      type: 'wallet_deposit', amount: item.amount,
      description: `Approved deposit via ${item.paymentMethod} (Ref: ${item.referenceNumber})`,
      timestamp: new Date().toISOString(), status: 'completed', paymentMethod: item.paymentMethod,
    };
    setTransactions(prev => [tx, ...prev]);
    addAuditLog('Approved Payment', `${item.userName} (${item.referenceNumber})`, `Amount: ${item.amount} ETB`);

  }

  function rejectPayment(queueId: string, reason = 'Verification details do not match bank statement') {
    const item = paymentQueue.find(p => p.id === queueId);
    if (!item) return;
    setPaymentQueue(prev => prev.map(p => p.id === queueId ? { ...p, status: 'rejected', notes: `Rejected: ${reason}` } : p));
    addAuditLog('Rejected Payment', `${item.userName} (${item.referenceNumber})`, `Reason: ${reason}`);
  }

  function adjustUserWallet(userId: string, amount: number, reason: string) {
    const targetUser = users.find(u => u.id === userId);
    if (!targetUser) return;
    setUsers(prev => prev.map(u => u.id === userId
      ? { ...u, walletBalance: Math.max(0, u.walletBalance + amount) }
      : u
    ));
    const tx: Transaction = {
      id: `t${Date.now()}`, userId, userName: targetUser.name,
      type: 'manual_adjustment', amount,
      description: `Admin manual adjustment (Wallet): ${reason}`,
      timestamp: new Date().toISOString(), status: 'completed',
    };
    setTransactions(prev => [tx, ...prev]);
    addAuditLog('Manual Wallet Adjustment', `${targetUser.name} (${userId})`, `Adjusted ${amount > 0 ? '+' : ''}${amount} ETB. Reason: ${reason}`);
  }

  function sendAnnouncement(data: Omit<Announcement, 'id' | 'timestamp' | 'deliveredCount' | 'sentBy'>) {
    const newAnn: Announcement = {
      ...data, id: `ann${Date.now()}`, sentBy: currentUser?.name || 'Admin',
      timestamp: new Date().toISOString(), deliveredCount: users.length,
    };
    setAnnouncements(prev => [newAnn, ...prev]);
    addAuditLog('Sent Announcement', data.audience, `Title: "${data.title}" (${data.type})`);
  }

  function updateSystemSettings(newSettings: Partial<SystemSettings>) {
    setSettings(prev => ({ ...prev, ...newSettings }));
    addAuditLog('Updated Settings', 'Platform Core', `Updated parameters: ${Object.keys(newSettings).join(', ')}`);
  }

  return (
    <AppContext.Provider value={{
      currentUser, setCurrentUser,
      refreshCurrentUser,
      auctions, setAuctions,
      products, setProducts,
      users, setUsers,
      bids, setBids,
      transactions, setTransactions,
      paymentQueue, setPaymentQueue,
      notifications, setNotifications,
      announcements, setAnnouncements,
      auditLogs, setAuditLogs,
      settings, setSettings,
      markNotificationRead,
      placeBid,
      editBid,

      logout,
      addAuditLog,
      createAuction,
      updateAuction,
      pauseAuction,
      resumeAuction,
      cancelAuction,
      addProduct,
      updateProduct,
      deleteProduct,
      toggleUserStatus,
      deleteUser,
      approvePayment,
      rejectPayment,
      adjustUserWallet,
      sendAnnouncement,
      updateSystemSettings,
    }}>
      {children}
    </AppContext.Provider>
  );
}

const fallbackAppContext: AppContextType = {
  currentUser: null,
  setCurrentUser: () => {},
  refreshCurrentUser: async () => {},
  auctions: [],
  setAuctions: () => {},
  products: [],
  setProducts: () => {},
  users: [],
  setUsers: () => {},
  bids: [],
  setBids: () => {},
  transactions: [],
  setTransactions: () => {},
  paymentQueue: [],
  setPaymentQueue: () => {},
  notifications: [],
  setNotifications: () => {},
  announcements: [],
  setAnnouncements: () => {},
  auditLogs: [],
  setAuditLogs: () => {},
  settings: initialSettings,
  setSettings: () => {},
  markNotificationRead: () => {},
  placeBid: () => false,
  editBid: () => false,
  logout: () => {},
  addAuditLog: () => {},
  createAuction: async () => {},
  updateAuction: async () => {},
  pauseAuction: async () => {},
  resumeAuction: async () => {},
  cancelAuction: async () => {},
  addProduct: async () => {},
  updateProduct: async () => {},
  deleteProduct: async () => {},
  toggleUserStatus: async () => {},
  deleteUser: async () => {},
  approvePayment: () => {},
  rejectPayment: () => {},
  adjustUserWallet: async () => {},
  sendAnnouncement: () => {},
  updateSystemSettings: () => {},
};

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) {
    return fallbackAppContext;
  }
  return ctx;
}
