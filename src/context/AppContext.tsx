import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  User, Auction, AuctionStatus, Bid, Transaction, Notification, Product, PaymentQueueItem, Announcement, AuditLog, SystemSettings,
  initialSettings,
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
  const endTime  = a.end_time   ?? a.endTime   ?? '';
  const startTime = a.start_time ?? a.startTime ?? '';
  const dbStatus  = a.status as string;
  const imageUrl = a.image_url ?? a.image ?? a.imageUrl ?? '';
  const safeImageUrl = imageUrl.includes('photo-1675785931670-9f51e7a2a6e0')
    ? 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=600&q=80'
    : imageUrl;

  // Correct stale status based on actual times
  let status: AuctionStatus = dbStatus as AuctionStatus;
  const now = Date.now();
  if (endTime && new Date(endTime).getTime() < now && dbStatus === 'active') {
    status = 'closed';
  } else if (startTime && new Date(startTime).getTime() > now && dbStatus === 'active') {
    status = 'upcoming';
  }

  return {
    id: a.id,
    productId: a.product_id ?? a.productId ?? undefined,
    productName: a.product_name ?? a.productName ?? undefined,
    title: a.title,
    description: a.description ?? '',
    image: safeImageUrl,
    retailValue: Number(a.retail_value ?? a.retailValue ?? 0),
    bidPerCost: Number(a.bid_per_cost ?? a.bidPerCost ?? 100),
    maxBidsPerUser: Number(a.max_bids_per_user ?? a.maxBidsPerUser ?? 0),
    effectiveMaxBidsPerUser: Number(a.effective_max_bids_per_user ?? a.max_bids_per_user ?? a.maxBidsPerUser ?? 0),
    category: a.category,
    status,
    startTime,
    endTime,
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
  const fallbackImage = 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=600&q=80';
  const safeImages = images.map((image: string) => image.includes('photo-1675785931670-9f51e7a2a6e0') ? fallbackImage : image);
  const primaryImage = p.image_url ?? (safeImages.length > 0 ? safeImages[0] : p.image ?? '');

  return {
    id: p.id,
    name: p.name,
    category: p.category,
    image: primaryImage.includes('photo-1675785931670-9f51e7a2a6e0') ? fallbackImage : primaryImage,
    images: safeImages,
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

function apiToNotification(n: any): Notification {
  return {
    id: n.id,
    userId: n.user_id ?? n.userId ?? '',
    type: n.type ?? 'system',
    title: n.title ?? 'Notification',
    message: n.message ?? '',
    read: Boolean(n.is_read ?? n.read ?? false),
    timestamp: n.created_at ?? n.timestamp ?? new Date().toISOString(),
  };
}

function uniqueNotifications(notifications: Notification[]): Notification[] {
  const seen = new Set<string>();
  return notifications.filter(notification => {
    // Some older backend rows were duplicated with different IDs; content is the stable identity.
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
    
    // Play pleasant high chime (two harmonic tones)
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
    osc1.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15); // A5

    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(880, ctx.currentTime); // A5
    osc2.frequency.exponentialRampToValueAtTime(1174.66, ctx.currentTime + 0.2); // D6

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
  } catch (_e) {
    // AudioContext autoplay permission or unsupported
  }
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUserState] = useState<User | null>(null);
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
    if (!token) return;

    // Restore current user from API
    usersApi.me()
      .then(res => setCurrentUserState(apiToUser(res.data)))
      .catch(() => removeToken());

    // Load auctions from real database
    auctionsApi.list()
      .then(res => setAuctions(res.data.map(apiToAuction)))
      .catch(() => {});

    // Load unlocked auction IDs for this user
    auctionsApi.myUnlocked()
      .then(res => setUnlockedAuctionIds(res.data || []))
      .catch(() => {});

    // Load products from real database
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

    // Load notifications with sound check
    notificationsApi.my()
      .then(res => {
        const notifs = (res.data || []).map(apiToNotification);
        setNotifications(uniqueNotifications(notifs));
        const hasUnread = notifs.some((n: any) => !n.read);
        if (hasUnread) {
          setTimeout(playNotificationSound, 800);
        }
      })
      .catch(() => {});
  }, []);

  function isAuctionUnlocked(auctionId: string): boolean {
    if (!currentUser) return false;
    if (currentUser.role === 'admin') return true;
    return unlockedAuctionIds.includes(auctionId);
  }

  async function unlockAuction(auctionId: string): Promise<{ success: boolean; message: string }> {
    try {
      const res = await auctionsApi.unlock(auctionId);
      if (res.success) {
        setUnlockedAuctionIds(prev => Array.from(new Set([...prev, auctionId])));
        await refreshCurrentUser();
        walletApi.myTransactions().then(r => setTransactions(r.data || [])).catch(() => {});
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

  // ── Live WebSocket connection: Real-time balance and transaction push ────────
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
              // Instantly update current user balance in memory without reload
              if (data.wallet_balance !== undefined) {
                setCurrentUserState(prev => prev ? {
                  ...prev,
                  walletBalance: Number(data.wallet_balance),
                  credits: data.credits !== undefined ? Number(data.credits) : prev.credits,
                } : null);
              }
              // Refresh user and transaction ledger immediately
              void refreshCurrentUser();
              walletApi.myTransactions().then(r => setTransactions(r.data || [])).catch(() => {});
              notificationsApi.my().then(r => setNotifications(uniqueNotifications((r.data || []).map(apiToNotification)))).catch(() => {});
              playNotificationSound();
            }
          } catch (_e) {}
        };

        ws.onclose = () => {
          reconnectTimeout = window.setTimeout(connect, 5000);
        };

        ws.onerror = () => {
          if (ws) ws.close();
        };
      } catch (_e) {
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
      } catch (e) {}
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

  // Poll auctions every 20s so statuses, totals, and countdowns stay live
  useEffect(() => {
    let id: number | undefined;
    async function pollAuctions() {
      try {
        const res = await auctionsApi.list();
        setAuctions(res.data.map(apiToAuction));
      } catch (_e) {}
    }
    // Always poll auctions whether logged in or not (public data)
    pollAuctions();
    id = window.setInterval(pollAuctions, 20000);
    return () => { if (id) window.clearInterval(id); };
  }, []);

  // Poll notifications so customers see new auction alerts without needing a manual refresh
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
      } catch (e) {}
    }
    if (currentUser) {
      pollNotifications();
      id = window.setInterval(pollNotifications, 10000);
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

  // ── Admin Actions ─────────────────────────────────────────────────────────────
  function createAuction(auctionData: Omit<Auction, 'id' | 'totalParticipants' | 'totalBids'>) {
    const id = `a0${auctions.length + 1}`;
    const newAuction: Auction = { ...auctionData, id, totalParticipants: 0, totalBids: 0 };
    setAuctions(prev => [newAuction, ...prev]);
    addAuditLog('Created Auction', newAuction.title, `Category: ${newAuction.category}, Bid Per Cost: ${newAuction.bidPerCost || newAuction.retailValue} ETB`);
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
