import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  User, Auction, AuctionStatus, Bid, Transaction, Notification, Product, PaymentQueueItem, Announcement, AuditLog, SystemSettings,
  initialSettings,
  ApiUser, ApiAuction, ApiProduct, ApiBid, ApiNotification,
} from '../types';
import {
  getToken, removeToken,
  usersApi, auctionsApi, productsApi, bidsApi,
  walletApi, notificationsApi,
} from '../utils/api';

interface AppContextType {
  currentUser: User | null;
  authLoading: boolean;
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

  // Unlock Auctions State
  unlockedAuctionIds: string[];
  isAuctionUnlocked: (auctionId: string) => boolean;
  unlockAuction: (auctionId: string) => Promise<{ success: boolean; message: string }>;

  // Actions
  markNotificationRead: (id: string) => void;
  placeBid: (auctionId: string, amount: number) => Promise<boolean>;
  editBid: (bidId: string, newAmount: number) => boolean;
  refreshCurrentUser: () => Promise<void>;
  logout: () => void;

  // Admin Actions (compat)
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

// ── Shape converters: API DTO → App Model ────────────────────────────────────
export function apiToUser(u: ApiUser): User {
  return {
    id: u.id,
    name: u.name,
    email: u.email ?? '',
    phone: u.phone ?? '',
    role: u.role ?? 'customer',
    walletBalance: Number(u.wallet_balance ?? 0),
    credits: u.credits !== undefined ? Number(u.credits) : undefined,
    status: u.status ?? 'active',
    joinedAt: u.joined_at ?? new Date().toISOString().split('T')[0],
    wonAuctions: u.won_auctions ?? [],
    photo: u.photo_url ?? undefined,
  };
}

export function apiToAuction(a: ApiAuction): Auction {
  const endTime = a.end_time ?? '';
  const startTime = a.start_time ?? '';
  const dbStatus = a.status;
  const rawImage = a.image_url ?? a.image ?? '';
  const fallbackImage = 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=600&q=80';
  const safeImageUrl = rawImage.includes('photo-1675785931670-9f51e7a2a6e0') || !rawImage
    ? fallbackImage
    : rawImage;

  // Derive active/closed status if timestamps have expired
  let status: AuctionStatus = dbStatus;
  const now = Date.now();
  if (endTime && new Date(endTime).getTime() < now && dbStatus === 'active') {
    status = 'closed';
  } else if (startTime && new Date(startTime).getTime() > now && dbStatus === 'active') {
    status = 'upcoming';
  }

  return {
    id: a.id,
    productId: a.product_id ?? undefined,
    productName: a.product_name ?? undefined,
    title: a.title,
    description: a.description ?? '',
    image: safeImageUrl,
    retailValue: Number(a.retail_value ?? 0),
    bidPerCost: Number(a.bid_per_cost ?? 100),
    maxBidsPerUser: Number(a.max_bids_per_user ?? 0),
    effectiveMaxBidsPerUser: Number(a.effective_max_bids_per_user ?? a.max_bids_per_user ?? 0),
    category: a.category,
    status,
    startTime,
    endTime,
    minBid: Number(a.min_bid ?? 1),
    maxBid: Number(a.max_bid ?? 500),
    totalParticipants: Number(a.total_participants ?? 0),
    totalBids: Number(a.total_bids ?? 0),
    winnerId: a.winner_id ?? undefined,
    winnerName: a.winner_name ?? undefined,
    lowestUniqueBid: a.lowest_unique_bid !== undefined ? Number(a.lowest_unique_bid) : undefined,
    closedAt: a.closed_at ?? undefined,
  };
}

export function apiToProduct(p: ApiProduct): Product {
  let images: string[] = [];
  if (Array.isArray(p.images)) {
    images = p.images;
  } else if (typeof p.images === 'string') {
    try {
      images = JSON.parse(p.images);
    } catch {
      images = [p.images];
    }
  }

  const fallbackImage = 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=600&q=80';
  const safeImages = images.map((image: string) => image.includes('photo-1675785931670-9f51e7a2a6e0') ? fallbackImage : image);
  const rawPrimary = p.image_url ?? (safeImages.length > 0 ? safeImages[0] : p.image ?? '');
  const primaryImage = rawPrimary.includes('photo-1675785931670-9f51e7a2a6e0') || !rawPrimary ? fallbackImage : rawPrimary;

  return {
    id: p.id,
    name: p.name,
    category: p.category,
    image: primaryImage,
    images: safeImages,
    retailValue: Number(p.retail_value ?? 0),
    description: p.description ?? '',
    linkedAuctionId: p.linked_auction_id ?? undefined,
    linkedAuctionStatus: p.linked_auction_status ?? undefined,
    createdAt: p.created_at ?? new Date().toISOString().split('T')[0],
  };
}

export function apiToBid(b: ApiBid): Bid {
  return {
    id: b.id,
    auctionId: b.auction_id ?? '',
    bidderId: b.bidder_id ?? '',
    maskedBidderId: b.masked_bidder_id ?? '',
    bidderName: b.bidder_name ?? undefined,
    bidderPhone: b.bidder_phone ?? undefined,
    bidderPhoto: b.bidder_photo ?? undefined,
    amount: Number(b.amount ?? 0),
    timestamp: b.created_at ?? new Date().toISOString(),
    isDuplicate: Boolean(b.is_duplicate ?? false),
    isLowestUnique: Boolean(b.is_lowest_unique ?? false),
  };
}

export function apiToNotification(n: ApiNotification): Notification {
  return {
    id: n.id,
    userId: n.user_id ?? '',
    type: n.type ?? 'system',
    title: n.title ?? 'Notification',
    message: n.message ?? '',
    read: Boolean(n.is_read ?? n.read ?? false),
    timestamp: n.created_at ?? new Date().toISOString(),
    metadata: n.metadata,
  };
}

function uniqueNotifications(notifications: Notification[]): Notification[] {
  const seen = new Set<string>();
  return notifications.filter(notification => {
    const key = `${notification.type}:${notification.title.trim().toLowerCase()}:${notification.message.trim().toLowerCase()}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

// ── Web Audio Chime Synthesizer ───────────────────────────────────────────────
function playNotificationSound() {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(587.33, ctx.currentTime);
    osc1.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15);

    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(880, ctx.currentTime);
    osc2.frequency.exponentialRampToValueAtTime(1174.66, ctx.currentTime + 0.2);

    gainNode.gain.setValueAtTime(0.001, ctx.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.05);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.45);

    osc1.connect(gainNode);
    osc2.connect(gainNode);
    gainNode.connect(ctx.destination);

    osc1.start(ctx.currentTime);
    osc2.start(ctx.currentTime);
    osc1.stop(ctx.currentTime + 0.45);
    osc2.stop(ctx.currentTime + 0.45);
  } catch {
    // AudioContext autoplay permission or unsupported
  }
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUserState] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState<boolean>(true);
  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [bids, setBids] = useState<Bid[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [paymentQueue, setPaymentQueue] = useState<PaymentQueueItem[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [settings, setSettings] = useState<SystemSettings>(initialSettings);
  const [unlockedAuctionIds, setUnlockedAuctionIds] = useState<string[]>([]);

  // ── On mount: restore session & load live data ──────────────────────────────
  useEffect(() => {
    const token = getToken();
    if (!token) {
      setAuthLoading(false);
      // Load public auction & product listings
      auctionsApi.list()
        .then(res => setAuctions(res.data.map(apiToAuction)))
        .catch(() => {});
      productsApi.list()
        .then(res => setProducts(res.data.map(apiToProduct)))
        .catch(() => {});
      return;
    }

    // Restore current user from API
    usersApi.me()
      .then(res => {
        setCurrentUserState(apiToUser(res.data));
      })
      .catch(() => {
        removeToken();
        setCurrentUserState(null);
      })
      .finally(() => {
        setAuthLoading(false);
      });

    // Load auctions
    auctionsApi.list()
      .then(res => setAuctions(res.data.map(apiToAuction)))
      .catch(() => {});

    // Load unlocked auction IDs for this user
    auctionsApi.myUnlocked()
      .then(res => setUnlockedAuctionIds(res.data || []))
      .catch(() => {});

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
      .then(res => {
        setTransactions((res.data || []).map(t => ({
          id: t.id,
          userId: t.user_id ?? '',
          userName: t.user_name ?? '',
          type: t.type ?? '',
          amount: Number(t.amount ?? 0),
          description: t.description ?? '',
          status: t.status ?? 'completed',
          paymentMethod: t.payment_method,
          timestamp: t.created_at ?? new Date().toISOString(),
        })));
      })
      .catch(() => {});

    // Load notifications with sound check
    notificationsApi.my()
      .then(res => {
        const notifs = (res.data || []).map(apiToNotification);
        setNotifications(uniqueNotifications(notifs));
        const hasUnread = notifs.some(n => !n.read);
        if (hasUnread) {
          setTimeout(playNotificationSound, 800);
        }
      })
      .catch(() => {});
  }, []);

  function isAuctionUnlocked(auctionId: string): boolean {
    if (!currentUser) return false;
    if (currentUser.role === 'admin' || currentUser.role === 'super_admin') return true;
    return unlockedAuctionIds.includes(auctionId);
  }

  async function unlockAuction(auctionId: string): Promise<{ success: boolean; message: string }> {
    try {
      const res = await auctionsApi.unlock(auctionId);
      if (res.success) {
        setUnlockedAuctionIds(prev => Array.from(new Set([...prev, auctionId])));
        await refreshCurrentUser();
        walletApi.myTransactions().then(r => {
          setTransactions((r.data || []).map(t => ({
            id: t.id,
            userId: t.user_id ?? '',
            userName: t.user_name ?? '',
            type: t.type ?? '',
            amount: Number(t.amount ?? 0),
            description: t.description ?? '',
            status: t.status ?? 'completed',
            paymentMethod: t.payment_method,
            timestamp: t.created_at ?? new Date().toISOString(),
          })));
        }).catch(() => {});
        return { success: true, message: res.message || 'Auction unlocked successfully!' };
      } else {
        return { success: false, message: res.message || 'Failed to unlock auction' };
      }
    } catch (err: any) {
      return { success: false, message: err?.message || 'Failed to pay bid cost to unlock auction' };
    }
  }

  async function refreshCurrentUser() {
    try {
      const res = await usersApi.me();
      setCurrentUserState(apiToUser(res.data));
    } catch {
      // silently ignore — keep current state
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

  // ── Live WebSocket connection: Real-time balance and notification push ───────
  useEffect(() => {
    if (!currentUser) return;
    const token = getToken();
    let ws: WebSocket | null = null;
    let reconnectTimeout: number | undefined;

    function connect() {
      try {
        const isSecure = window.location.protocol === 'https:';
        const wsProto = isSecure ? 'wss:' : 'ws:';
        const host = window.location.hostname === 'localhost' ? 'localhost:3000' : 'eyob-backend.onrender.com';
        const wsUrl = `${wsProto}//${host}/ws?token=${token || ''}`;

        ws = new WebSocket(wsUrl);

        ws.onopen = () => {
          if (token && ws && ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: 'auth', token }));
          }
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data.type === 'balance_updated') {
              if (data.wallet_balance !== undefined) {
                setCurrentUserState(prev => prev ? {
                  ...prev,
                  walletBalance: Number(data.wallet_balance),
                  credits: data.credits !== undefined ? Number(data.credits) : prev.credits,
                } : null);
              }
              void refreshCurrentUser();
              walletApi.myTransactions().then(r => {
                setTransactions((r.data || []).map(t => ({
                  id: t.id,
                  userId: t.user_id ?? '',
                  userName: t.user_name ?? '',
                  type: t.type ?? '',
                  amount: Number(t.amount ?? 0),
                  description: t.description ?? '',
                  status: t.status ?? 'completed',
                  paymentMethod: t.payment_method,
                  timestamp: t.created_at ?? new Date().toISOString(),
                })));
              }).catch(() => {});
              notificationsApi.my().then(r => setNotifications(uniqueNotifications((r.data || []).map(apiToNotification)))).catch(() => {});
              playNotificationSound();
            }
          } catch {
            // ignore malformed ws message
          }
        };

        ws.onclose = () => {
          reconnectTimeout = window.setTimeout(connect, 5000);
        };

        ws.onerror = () => {
          if (ws) ws.close();
        };
      } catch {
        reconnectTimeout = window.setTimeout(connect, 5000);
      }
    }

    connect();

    return () => {
      if (reconnectTimeout) window.clearTimeout(reconnectTimeout);
      if (ws) {
        ws.onclose = null;
        ws.close();
      }
    };
  }, [currentUser?.id]);

  // Poll current user profile as a fallback heartbeat
  useEffect(() => {
    let id: number | undefined;
    async function poll() {
      try {
        const res = await usersApi.me();
        setCurrentUserState(apiToUser(res.data));
      } catch {}
    }
    if (currentUser) {
      poll();
      id = window.setInterval(poll, 15000);
    }
    return () => { if (id) window.clearInterval(id); };
  }, [currentUser?.id]);

  useEffect(() => {
    void refreshMyBids();
  }, [currentUser?.id]);

  // Poll auctions every 20s
  useEffect(() => {
    let id: number | undefined;
    async function pollAuctions() {
      try {
        const res = await auctionsApi.list();
        setAuctions(res.data.map(apiToAuction));
      } catch {}
    }
    pollAuctions();
    id = window.setInterval(pollAuctions, 20000);
    return () => { if (id) window.clearInterval(id); };
  }, []);

  // Poll notifications
  useEffect(() => {
    let id: number | undefined;
    async function pollNotifications() {
      try {
        const res = await notificationsApi.my();
        const fresh = (res.data || []).map(apiToNotification);
        setNotifications(prev => {
          const uniqueFresh = uniqueNotifications(fresh);
          const prevUnreadCount = prev.filter(n => !n.read).length;
          const freshUnreadCount = uniqueFresh.filter(n => !n.read).length;
          if (freshUnreadCount > prevUnreadCount) {
            playNotificationSound();
          }
          return uniqueFresh;
        });
      } catch {}
    }
    if (currentUser) {
      pollNotifications();
      id = window.setInterval(pollNotifications, 10000);
    }
    return () => { if (id) window.clearInterval(id); };
  }, [currentUser?.id]);

  function setCurrentUser(u: User | null) {
    setCurrentUserState(u);
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
        .then(res => {
          setTransactions((res.data || []).map(t => ({
            id: t.id,
            userId: t.user_id ?? '',
            userName: t.user_name ?? '',
            type: t.type ?? '',
            amount: Number(t.amount ?? 0),
            description: t.description ?? '',
            status: t.status ?? 'completed',
            paymentMethod: t.payment_method,
            timestamp: t.created_at ?? new Date().toISOString(),
          })));
        })
        .catch(() => {});
      notificationsApi.my()
        .then(res => {
          const notifs = (res.data || []).map(apiToNotification);
          setNotifications(uniqueNotifications(notifs));
          if (notifs.some(n => !n.read)) playNotificationSound();
        })
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

  async function placeBid(auctionId: string, amount: number): Promise<boolean> {
    if (!currentUser) return false;

    const targetAuction = auctions.find(a => a.id === auctionId);
    const safeAmount = Number(amount.toFixed(1));
    if (Number.isNaN(safeAmount) || safeAmount <= 0) return false;
    if (currentUser.walletBalance < safeAmount) return false;

    try {
      const res = await bidsApi.place(auctionId, safeAmount);
      const bidData = res.data || {};
      const deductedAmount = Number(bidData.amount ?? safeAmount);

      setUsers(prev => prev.map(u => u.id === currentUser.id
        ? { ...u, walletBalance: Math.max(0, Number(u.walletBalance) - deductedAmount) }
        : u
      ));
      setAuctions(prev => prev.map(a => a.id === auctionId ? { ...a, totalBids: a.totalBids + 1 } : a));

      const tx: Transaction = {
        id: `t${Date.now()}`,
        userId: currentUser.id,
        userName: currentUser.name,
        type: 'bid_placed',
        amount: -deductedAmount,
        description: `Bid placed on "${targetAuction?.title || auctionId}" — ${safeAmount} ETB`,
        timestamp: new Date().toISOString(),
        status: 'completed',
      };
      setTransactions(prev => [tx, ...prev]);

      setCurrentUser({
        ...currentUser,
        walletBalance: Math.max(0, Number(currentUser.walletBalance) - deductedAmount),
      });

      void refreshMyBids();
      refreshCurrentUser().catch(() => {});
      return true;
    } catch (err) {
      throw err;
    }
  }

  function editBid(bidId: string, newAmount: number): boolean {
    if (!currentUser) return false;
    setBids(prev => prev.map(b => b.id === bidId ? { ...b, amount: newAmount, timestamp: new Date().toISOString() } : b));
    return true;
  }

  // ── Compatibility Admin Actions ──────────────────────────────────────────────
  function createAuction(auctionData: Omit<Auction, 'id' | 'totalParticipants' | 'totalBids'>) {
    const id = `a0${auctions.length + 1}`;
    const newAuction: Auction = { ...auctionData, id, totalParticipants: 0, totalBids: 0 };
    setAuctions(prev => [newAuction, ...prev]);
    addAuditLog('Created Auction', newAuction.title, `Category: ${newAuction.category}`);
  }

  function updateAuction(id: string, updates: Partial<Auction>) {
    setAuctions(prev => prev.map(a => a.id === id ? { ...a, ...updates } : a));
  }

  function pauseAuction(id: string) {
    setAuctions(prev => prev.map(a => a.id === id ? { ...a, status: 'paused' } : a));
  }

  function resumeAuction(id: string) {
    setAuctions(prev => prev.map(a => a.id === id ? { ...a, status: 'active' } : a));
  }

  function cancelAuction(id: string) {
    setAuctions(prev => prev.map(a => a.id === id ? { ...a, status: 'closed' } : a));
  }

  function addProduct(prodData: Omit<Product, 'id' | 'createdAt'>) {
    const id = `p0${products.length + 1}`;
    const newProd: Product = { ...prodData, id, createdAt: new Date().toISOString().split('T')[0] };
    setProducts(prev => [newProd, ...prev]);
  }

  function updateProduct(id: string, updates: Partial<Product>) {
    setProducts(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
  }

  function deleteProduct(id: string) {
    setProducts(prev => prev.filter(p => p.id !== id));
  }

  function toggleUserStatus(userId: string) {
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, status: u.status === 'active' ? 'suspended' : 'active' } : u));
  }

  function deleteUser(userId: string) {
    setUsers(prev => prev.filter(u => u.id !== userId));
  }

  function approvePayment(queueId: string) {
    setPaymentQueue(prev => prev.map(p => p.id === queueId ? { ...p, status: 'approved' } : p));
  }

  function rejectPayment(queueId: string, reason = 'Verification details do not match') {
    setPaymentQueue(prev => prev.map(p => p.id === queueId ? { ...p, status: 'rejected', notes: reason } : p));
  }

  function adjustUserWallet(userId: string, amount: number, _reason: string) {
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, walletBalance: Math.max(0, u.walletBalance + amount) } : u));
  }

  function sendAnnouncement(data: Omit<Announcement, 'id' | 'timestamp' | 'deliveredCount' | 'sentBy'>) {
    const newAnn: Announcement = {
      ...data,
      id: `ann${Date.now()}`,
      sentBy: currentUser?.name || 'Admin',
      timestamp: new Date().toISOString(),
      deliveredCount: users.length,
    };
    setAnnouncements(prev => [newAnn, ...prev]);
  }

  function updateSystemSettings(newSettings: Partial<SystemSettings>) {
    setSettings(prev => ({ ...prev, ...newSettings }));
  }

  return (
    <AppContext.Provider value={{
      currentUser,
      authLoading,
      setCurrentUser,
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
      unlockedAuctionIds,
      isAuctionUnlocked,
      unlockAuction,
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
  authLoading: false,
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
  placeBid: async () => false,
  editBid: () => false,
  unlockedAuctionIds: [],
  isAuctionUnlocked: () => false,
  unlockAuction: async () => ({ success: false, message: 'Not logged in' }),
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
