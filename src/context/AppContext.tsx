import React, { createContext, useContext, useState, ReactNode } from 'react';
import {
  User, Auction, Bid, Transaction, Notification,
  mockUsers, mockAuctions, mockBidsA005, mockTransactions, mockNotifications,
} from '../data/mockData';

interface AppContextType {
  currentUser: User | null;
  setCurrentUser: (u: User | null) => void;
  auctions: Auction[];
  setAuctions: React.Dispatch<React.SetStateAction<Auction[]>>;
  users: User[];
  setUsers: React.Dispatch<React.SetStateAction<User[]>>;
  bids: Bid[];
  setBids: React.Dispatch<React.SetStateAction<Bid[]>>;
  transactions: Transaction[];
  setTransactions: React.Dispatch<React.SetStateAction<Transaction[]>>;
  notifications: Notification[];
  setNotifications: React.Dispatch<React.SetStateAction<Notification[]>>;
  markNotificationRead: (id: string) => void;
  placeBid: (auctionId: string, amount: number) => boolean;
  editBid: (bidId: string, newAmount: number) => boolean;
  buyCredits: (pkgCredits: number, pkgPrice: number) => void;
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(mockUsers[1] ?? mockUsers[0]);
  const [auctions, setAuctions] = useState<Auction[]>(mockAuctions);
  const [users, setUsers] = useState<User[]>(mockUsers);
  const [bids, setBids] = useState<Bid[]>(mockBidsA005);
  const [transactions, setTransactions] = useState<Transaction[]>(mockTransactions);
  const [notifications, setNotifications] = useState<Notification[]>(mockNotifications);

  function markNotificationRead(id: string) {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  }

  function placeBid(auctionId: string, amount: number): boolean {
    if (!currentUser) return false;
    if (currentUser.credits < 1) return false;
    const newBid: Bid = {
      id: `b${Date.now()}`,
      auctionId,
      bidderId: currentUser.id,
      maskedBidderId: `BDR-${currentUser.name.split(' ')[0] || 'User'}`,
      amount,
      timestamp: new Date().toISOString(),
    };
    setBids(prev => [newBid, ...prev]);
    const updatedUser = { ...currentUser, credits: currentUser.credits - 1 };
    setCurrentUser(updatedUser);
    setUsers(prev => prev.map(u => u.id === currentUser.id ? updatedUser : u));
    setAuctions(prev => prev.map(a => a.id === auctionId
      ? { ...a, totalBids: a.totalBids + 1 } : a));
    const tx: Transaction = {
      id: `t${Date.now()}`,
      userId: currentUser.id,
      type: 'bid_placed',
      amount: -10,
      description: `Bid of ${amount} ETB placed on auction`,
      timestamp: new Date().toISOString(),
    };
    setTransactions(prev => [tx, ...prev]);
    return true;
  }

  function editBid(bidId: string, newAmount: number): boolean {
    if (!currentUser) return false;
    const targetBid = bids.find(b => b.id === bidId);
    if (!targetBid) return false;

    setBids(prev => prev.map(b => b.id === bidId ? { ...b, amount: newAmount, timestamp: new Date().toISOString() } : b));
    
    const tx: Transaction = {
      id: `t${Date.now()}`,
      userId: currentUser.id,
      type: 'bid_placed',
      amount: 0,
      description: `Updated bid #${bidId} amount to ${newAmount} ETB`,
      timestamp: new Date().toISOString(),
    };
    setTransactions(prev => [tx, ...prev]);
    return true;
  }

  function buyCredits(pkgCredits: number, pkgPrice: number) {
    if (!currentUser) return;
    const updatedUser = {
      ...currentUser,
      credits: currentUser.credits + pkgCredits,
      walletBalance: currentUser.walletBalance - pkgPrice,
    };
    setCurrentUser(updatedUser);
    setUsers(prev => prev.map(u => u.id === currentUser.id ? updatedUser : u));
    const tx: Transaction = {
      id: `t${Date.now()}`,
      userId: currentUser.id,
      type: 'credit_purchase',
      amount: pkgPrice,
      description: `Purchased ${pkgCredits} credits`,
      timestamp: new Date().toISOString(),
    };
    setTransactions(prev => [tx, ...prev]);
    const notif: Notification = {
      id: `n${Date.now()}`,
      userId: currentUser.id,
      type: 'wallet_updated',
      title: 'Credits Added',
      message: `${pkgCredits} credits added to your account.`,
      read: false,
      timestamp: new Date().toISOString(),
    };
    setNotifications(prev => [notif, ...prev]);
  }

  return (
    <AppContext.Provider value={{
      currentUser, setCurrentUser,
      auctions, setAuctions,
      users, setUsers,
      bids, setBids,
      transactions, setTransactions,
      notifications, setNotifications,
      markNotificationRead,
      placeBid,
      editBid,
      buyCredits,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
