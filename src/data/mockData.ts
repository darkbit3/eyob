export type AuctionStatus = 'active' | 'upcoming' | 'closed';
export type UserRole = 'admin' | 'customer';

export interface User {
  id: string;
  name: string;
  phone: string;
  photo?: string;
  email?: string;
  role: UserRole;
  walletBalance: number;
  credits: number;
  status: 'active' | 'suspended';
  joinedAt: string;
  wonAuctions: string[];
}

export interface Auction {
  id: string;
  title: string;
  description: string;
  image: string;
  retailValue: number;
  category: string;
  status: AuctionStatus;
  startTime: string;
  endTime: string;
  minBid: number;
  maxBid: number;
  totalParticipants: number;
  totalBids: number;
  winnerId?: string;
  lowestUniqueBid?: number;
}

export interface Bid {
  id: string;
  auctionId: string;
  bidderId: string;
  maskedBidderId: string;
  amount: number;
  timestamp: string;
}

export interface Transaction {
  id: string;
  userId: string;
  type: 'credit_purchase' | 'bid_placed' | 'refund' | 'winning_reward';
  amount: number;
  description: string;
  timestamp: string;
}

export interface Notification {
  id: string;
  userId: string;
  type: 'auction_started' | 'auction_ending' | 'winner_announced' | 'payment_received' | 'wallet_updated' | 'system';
  title: string;
  message: string;
  read: boolean;
  timestamp: string;
}

export interface AuditLog {
  id: string;
  adminId: string;
  adminName: string;
  action: string;
  target: string;
  timestamp: string;
}

// ── USERS ──────────────────────────────────────────────────────────────────
export const mockUsers: User[] = [
  {
    id: 'u001',
    name: 'Abebe Girma',
    phone: '+251 91 234 5678',
    photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
    role: 'admin',
    walletBalance: 5000,
    credits: 200,
    status: 'active',
    joinedAt: '2025-01-15',
    wonAuctions: [],
  },
  {
    id: 'u002',
    name: 'Tigist Bekele',
    phone: '+251 92 345 6789',
    photo: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=150&h=150&fit=crop&crop=face',
    role: 'customer',
    walletBalance: 1250,
    credits: 45,
    status: 'active',
    joinedAt: '2025-02-20',
    wonAuctions: ['a005'],
  },
  {
    id: 'u003',
    name: 'Dawit Haile',
    phone: '+251 93 456 7890',
    photo: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&h=150&fit=crop&crop=face',
    role: 'customer',
    walletBalance: 800,
    credits: 12,
    status: 'active',
    joinedAt: '2025-03-10',
    wonAuctions: [],
  },
  {
    id: 'u004',
    name: 'Selamawit Tadesse',
    phone: '+251 94 567 8901',
    photo: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=150&h=150&fit=crop&crop=face',
    role: 'customer',
    walletBalance: 300,
    credits: 5,
    status: 'suspended',
    joinedAt: '2025-04-05',
    wonAuctions: [],
  },
  {
    id: 'u005',
    name: 'Yohannes Mekonnen',
    phone: '+251 95 678 9012',
    photo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face',
    role: 'customer',
    walletBalance: 2100,
    credits: 78,
    status: 'active',
    joinedAt: '2025-05-18',
    wonAuctions: ['a006'],
  },
  {
    id: 'u006',
    name: 'Hiwot Alemu',
    phone: '+251 96 789 0123',
    photo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop&crop=face',
    role: 'customer',
    walletBalance: 950,
    credits: 30,
    status: 'active',
    joinedAt: '2025-06-01',
    wonAuctions: [],
  },
  {
    id: 'u007',
    name: 'Bereket Solomon',
    phone: '+251 97 890 1234',
    photo: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
    role: 'customer',
    walletBalance: 1700,
    credits: 55,
    status: 'active',
    joinedAt: '2025-06-15',
    wonAuctions: [],
  },
  {
    id: 'u008',
    name: 'Mekdes Worku',
    phone: '+251 98 901 2345',
    photo: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face',
    role: 'customer',
    walletBalance: 620,
    credits: 18,
    status: 'active',
    joinedAt: '2025-07-02',
    wonAuctions: [],
  },
  {
    id: 'u009',
    name: 'Ephrem Tesfaye',
    phone: '+251 91 012 3456',
    photo: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&h=150&fit=crop&crop=face',
    role: 'customer',
    walletBalance: 3200,
    credits: 110,
    status: 'active',
    joinedAt: '2025-07-20',
    wonAuctions: [],
  },
  {
    id: 'u010',
    name: 'Almaz Kebede',
    phone: '+251 92 123 4567',
    photo: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop&crop=face',
    role: 'customer',
    walletBalance: 480,
    credits: 8,
    status: 'active',
    joinedAt: '2025-08-05',
    wonAuctions: [],
  },
  {
    id: 'u011',
    name: 'Girma Desta',
    phone: '+251 93 234 5678',
    photo: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150&h=150&fit=crop&crop=face',
    role: 'customer',
    walletBalance: 1100,
    credits: 40,
    status: 'active',
    joinedAt: '2025-08-18',
    wonAuctions: [],
  },
  {
    id: 'u012',
    name: 'Rahel Getachew',
    phone: '+251 94 345 6789',
    photo: 'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=150&h=150&fit=crop&crop=face',
    role: 'customer',
    walletBalance: 760,
    credits: 22,
    status: 'active',
    joinedAt: '2025-09-03',
    wonAuctions: [],
  },
  {
    id: 'u013',
    name: 'Tamrat Assefa',
    phone: '+251 95 456 7890',
    photo: 'https://images.unsplash.com/photo-1463453091185-61582044d556?w=150&h=150&fit=crop&crop=face',
    role: 'customer',
    walletBalance: 2400,
    credits: 90,
    status: 'active',
    joinedAt: '2025-09-20',
    wonAuctions: [],
  },
  {
    id: 'u014',
    name: 'Frehiwot Mulatu',
    phone: '+251 96 567 8901',
    photo: 'https://images.unsplash.com/photo-1489424731084-a5d8b219a5bb?w=150&h=150&fit=crop&crop=face',
    role: 'customer',
    walletBalance: 890,
    credits: 27,
    status: 'active',
    joinedAt: '2025-10-08',
    wonAuctions: [],
  },
  {
    id: 'u015',
    name: 'Natnael Berhane',
    phone: '+251 97 678 9012',
    photo: 'https://images.unsplash.com/photo-1568602471122-7832951cc4c5?w=150&h=150&fit=crop&crop=face',
    role: 'customer',
    walletBalance: 1340,
    credits: 48,
    status: 'active',
    joinedAt: '2025-10-25',
    wonAuctions: [],
  },
  {
    id: 'u016',
    name: 'Azeb Teklu',
    phone: '+251 98 789 0123',
    photo: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=150&h=150&fit=crop&crop=face',
    role: 'customer',
    walletBalance: 510,
    credits: 15,
    status: 'active',
    joinedAt: '2025-11-12',
    wonAuctions: [],
  },
];

// ── AUCTIONS ───────────────────────────────────────────────────────────────
export const mockAuctions: Auction[] = [
  {
    id: 'a001',
    title: 'Samsung Galaxy S25 Ultra',
    description: 'Brand new Samsung Galaxy S25 Ultra 256GB, Phantom Black. Includes original accessories and 1-year warranty.',
    image: 'https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=600&h=400&fit=crop',
    retailValue: 45000,
    category: 'Electronics',
    status: 'active',
    startTime: '2026-08-01T08:00:00',
    endTime: '2026-08-10T20:00:00',
    minBid: 1,
    maxBid: 500,
    totalParticipants: 142,
    totalBids: 389,
  },
  {
    id: 'a002',
    title: 'MacBook Pro 14" M3',
    description: 'Apple MacBook Pro 14-inch with M3 chip, 16GB RAM, 512GB SSD. Space Gray. Factory sealed.',
    image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=600&h=400&fit=crop',
    retailValue: 120000,
    category: 'Electronics',
    status: 'active',
    startTime: '2026-08-03T10:00:00',
    endTime: '2026-08-12T18:00:00',
    minBid: 1,
    maxBid: 1000,
    totalParticipants: 87,
    totalBids: 203,
  },
  {
    id: 'a003',
    title: 'Toyota Corolla 2024',
    description: 'Brand new Toyota Corolla 2024, White Pearl, 1.8L engine. Full option package with sunroof.',
    image: 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=600&h=400&fit=crop',
    retailValue: 1200000,
    category: 'Vehicles',
    status: 'active',
    startTime: '2026-08-05T09:00:00',
    endTime: '2026-08-15T21:00:00',
    minBid: 100,
    maxBid: 5000,
    totalParticipants: 312,
    totalBids: 891,
  },
  {
    id: 'a004',
    title: 'Sony PlayStation 5',
    description: 'PlayStation 5 Disc Edition bundle with 2 controllers and 3 games. Brand new sealed.',
    image: 'https://images.unsplash.com/photo-1606813907291-d86efa9b94db?w=600&h=400&fit=crop',
    retailValue: 28000,
    category: 'Gaming',
    status: 'upcoming',
    startTime: '2026-08-12T10:00:00',
    endTime: '2026-08-20T20:00:00',
    minBid: 1,
    maxBid: 300,
    totalParticipants: 0,
    totalBids: 0,
  },
  {
    id: 'a005',
    title: 'iPhone 15 Pro Max',
    description: 'Apple iPhone 15 Pro Max 256GB, Natural Titanium. Unlocked, brand new.',
    image: 'https://images.unsplash.com/photo-1675785931670-9f51e7a2a6e0?w=600&h=400&fit=crop',
    retailValue: 65000,
    category: 'Electronics',
    status: 'closed',
    startTime: '2026-07-15T08:00:00',
    endTime: '2026-07-25T20:00:00',
    minBid: 1,
    maxBid: 600,
    totalParticipants: 198,
    totalBids: 512,
    winnerId: 'u002',
    lowestUniqueBid: 7,
  },
  {
    id: 'a006',
    title: 'LG 65" OLED Smart TV',
    description: 'LG OLED65C3 65-inch 4K OLED TV with ThinQ AI, webOS 23, Dolby Vision & Atmos.',
    image: 'https://images.unsplash.com/photo-1593784991095-a205069470b6?w=600&h=400&fit=crop',
    retailValue: 90000,
    category: 'Electronics',
    status: 'closed',
    startTime: '2026-07-01T08:00:00',
    endTime: '2026-07-10T20:00:00',
    minBid: 1,
    maxBid: 800,
    totalParticipants: 156,
    totalBids: 423,
    winnerId: 'u005',
    lowestUniqueBid: 13,
  },
  {
    id: 'a007',
    title: 'Dyson V15 Vacuum',
    description: 'Dyson V15 Detect cordless vacuum cleaner. New generation with laser dust detection.',
    image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&h=400&fit=crop',
    retailValue: 18000,
    category: 'Home Appliances',
    status: 'upcoming',
    startTime: '2026-08-14T09:00:00',
    endTime: '2026-08-22T21:00:00',
    minBid: 1,
    maxBid: 200,
    totalParticipants: 0,
    totalBids: 0,
  },
  {
    id: 'a008',
    title: 'Rolex Submariner Watch',
    description: 'Rolex Submariner Date 41mm, Oystersteel, Black dial. Complete with original box and papers.',
    image: 'https://images.unsplash.com/photo-1523170335258-f5ed11844a49?w=600&h=400&fit=crop',
    retailValue: 550000,
    category: 'Luxury',
    status: 'active',
    startTime: '2026-08-06T12:00:00',
    endTime: '2026-08-16T12:00:00',
    minBid: 50,
    maxBid: 4000,
    totalParticipants: 67,
    totalBids: 145,
  },
];

// ── BIDS for closed auction a005 (iPhone 15 Pro Max) ─────────────────────
// 15+ users each place one bid; some amounts are duplicated (disqualified)
// Winner: Tigist Bekele (u002) with unique lowest bid of 7 ETB
export const mockBidsA005: Bid[] = [
  // --- ROUND 1: opening bids ---
  { id: 'b001', auctionId: 'a005', bidderId: 'u002', maskedBidderId: 'BDR-4821', amount: 7,   timestamp: '2026-07-20T08:12:33' }, // UNIQUE WINNER
  { id: 'b002', auctionId: 'a005', bidderId: 'u003', maskedBidderId: 'BDR-7743', amount: 5,   timestamp: '2026-07-20T08:45:12' }, // duplicate
  { id: 'b003', auctionId: 'a005', bidderId: 'u004', maskedBidderId: 'BDR-2291', amount: 5,   timestamp: '2026-07-20T09:03:44' }, // duplicate
  { id: 'b004', auctionId: 'a005', bidderId: 'u005', maskedBidderId: 'BDR-9934', amount: 12,  timestamp: '2026-07-20T09:22:01' }, // duplicate
  { id: 'b005', auctionId: 'a005', bidderId: 'u006', maskedBidderId: 'BDR-6612', amount: 12,  timestamp: '2026-07-20T10:05:00' }, // duplicate
  { id: 'b006', auctionId: 'a005', bidderId: 'u007', maskedBidderId: 'BDR-3377', amount: 3,   timestamp: '2026-07-20T10:44:21' }, // duplicate
  { id: 'b007', auctionId: 'a005', bidderId: 'u008', maskedBidderId: 'BDR-8812', amount: 3,   timestamp: '2026-07-21T07:11:09' }, // duplicate
  { id: 'b008', auctionId: 'a005', bidderId: 'u009', maskedBidderId: 'BDR-9901', amount: 20,  timestamp: '2026-07-21T08:00:00' }, // duplicate
  { id: 'b009', auctionId: 'a005', bidderId: 'u010', maskedBidderId: 'BDR-1045', amount: 20,  timestamp: '2026-07-21T08:33:44' }, // duplicate
  { id: 'b010', auctionId: 'a005', bidderId: 'u011', maskedBidderId: 'BDR-5521', amount: 35,  timestamp: '2026-07-21T09:15:00' }, // duplicate
  { id: 'b011', auctionId: 'a005', bidderId: 'u012', maskedBidderId: 'BDR-2230', amount: 35,  timestamp: '2026-07-21T09:55:10' }, // duplicate
  { id: 'b012', auctionId: 'a005', bidderId: 'u013', maskedBidderId: 'BDR-7780', amount: 50,  timestamp: '2026-07-21T10:40:22' }, // duplicate
  { id: 'b013', auctionId: 'a005', bidderId: 'u014', maskedBidderId: 'BDR-4490', amount: 50,  timestamp: '2026-07-21T11:10:55' }, // duplicate
  { id: 'b014', auctionId: 'a005', bidderId: 'u015', maskedBidderId: 'BDR-6634', amount: 18,  timestamp: '2026-07-22T07:45:33' }, // unique
  { id: 'b015', auctionId: 'a005', bidderId: 'u016', maskedBidderId: 'BDR-3301', amount: 25,  timestamp: '2026-07-22T08:20:00' }, // unique
  // --- ROUND 2: additional bids ---
  { id: 'b016', auctionId: 'a005', bidderId: 'u003', maskedBidderId: 'BDR-7743', amount: 45,  timestamp: '2026-07-22T09:05:44' }, // unique
  { id: 'b017', auctionId: 'a005', bidderId: 'u004', maskedBidderId: 'BDR-2291', amount: 60,  timestamp: '2026-07-22T09:50:11' }, // duplicate
  { id: 'b018', auctionId: 'a005', bidderId: 'u005', maskedBidderId: 'BDR-9934', amount: 60,  timestamp: '2026-07-22T10:30:05' }, // duplicate
  { id: 'b019', auctionId: 'a005', bidderId: 'u006', maskedBidderId: 'BDR-6612', amount: 75,  timestamp: '2026-07-23T07:00:00' }, // duplicate
  { id: 'b020', auctionId: 'a005', bidderId: 'u007', maskedBidderId: 'BDR-3377', amount: 75,  timestamp: '2026-07-23T07:45:22' }, // duplicate
  { id: 'b021', auctionId: 'a005', bidderId: 'u008', maskedBidderId: 'BDR-8812', amount: 100, timestamp: '2026-07-23T08:10:15' }, // duplicate
  { id: 'b022', auctionId: 'a005', bidderId: 'u009', maskedBidderId: 'BDR-9901', amount: 100, timestamp: '2026-07-23T09:00:00' }, // duplicate
  { id: 'b023', auctionId: 'a005', bidderId: 'u010', maskedBidderId: 'BDR-1045', amount: 120, timestamp: '2026-07-24T07:20:30' }, // unique
  { id: 'b024', auctionId: 'a005', bidderId: 'u011', maskedBidderId: 'BDR-5521', amount: 85,  timestamp: '2026-07-24T08:05:00' }, // unique
  { id: 'b025', auctionId: 'a005', bidderId: 'u012', maskedBidderId: 'BDR-2230', amount: 140, timestamp: '2026-07-24T09:30:55' }, // unique
  { id: 'b026', auctionId: 'a005', bidderId: 'u013', maskedBidderId: 'BDR-7780', amount: 200, timestamp: '2026-07-24T10:15:00' }, // duplicate
  { id: 'b027', auctionId: 'a005', bidderId: 'u014', maskedBidderId: 'BDR-4490', amount: 200, timestamp: '2026-07-24T11:00:10' }, // duplicate
  { id: 'b028', auctionId: 'a005', bidderId: 'u015', maskedBidderId: 'BDR-6634', amount: 250, timestamp: '2026-07-25T07:00:00' }, // duplicate
  { id: 'b029', auctionId: 'a005', bidderId: 'u016', maskedBidderId: 'BDR-3301', amount: 250, timestamp: '2026-07-25T07:55:44' }, // duplicate
  { id: 'b030', auctionId: 'a005', bidderId: 'u002', maskedBidderId: 'BDR-4821', amount: 300, timestamp: '2026-07-25T08:15:33' }, // unique
];

// ── TRANSACTIONS ───────────────────────────────────────────────────────────
export const mockTransactions: Transaction[] = [
  { id: 't001', userId: 'u002', type: 'credit_purchase', amount: 500,  description: 'Purchased 50 credits package', timestamp: '2026-07-10T10:00:00' },
  { id: 't002', userId: 'u002', type: 'bid_placed',      amount: -10,  description: 'Bid placed on iPhone 15 Pro Max', timestamp: '2026-07-20T08:12:33' },
  { id: 't003', userId: 'u002', type: 'bid_placed',      amount: -10,  description: 'Bid placed on iPhone 15 Pro Max', timestamp: '2026-07-21T09:12:00' },
  { id: 't004', userId: 'u002', type: 'winning_reward',  amount: 65000, description: 'Won iPhone 15 Pro Max auction', timestamp: '2026-07-25T22:00:00' },
  { id: 't005', userId: 'u003', type: 'credit_purchase', amount: 100,  description: 'Purchased 10 credits package', timestamp: '2026-07-18T14:30:00' },
  { id: 't006', userId: 'u003', type: 'bid_placed',      amount: -10,  description: 'Bid placed on Samsung Galaxy S25', timestamp: '2026-08-02T11:00:00' },
  { id: 't007', userId: 'u005', type: 'credit_purchase', amount: 1000, description: 'Purchased 100 credits package', timestamp: '2026-06-25T09:00:00' },
  { id: 't008', userId: 'u005', type: 'winning_reward',  amount: 90000, description: 'Won LG 65" OLED TV auction',   timestamp: '2026-07-10T22:00:00' },
];

// ── NOTIFICATIONS ──────────────────────────────────────────────────────────
export const mockNotifications: Notification[] = [
  {
    id: 'n001', userId: 'u002',
    type: 'winner_announced',
    title: 'You Won! 🎉',
    message: 'Congratulations! You won the iPhone 15 Pro Max auction with a bid of 7 birr.',
    read: false,
    timestamp: '2026-07-25T22:00:00',
  },
  {
    id: 'n002', userId: 'u002',
    type: 'auction_ending',
    title: 'Auction Ending Soon',
    message: 'Samsung Galaxy S25 Ultra auction ends in 2 hours. Don\'t miss your chance!',
    read: false,
    timestamp: '2026-08-10T18:00:00',
  },
  {
    id: 'n003', userId: 'u002',
    type: 'wallet_updated',
    title: 'Wallet Credited',
    message: 'Your wallet has been credited with 65,000 birr for winning the iPhone 15 Pro Max.',
    read: true,
    timestamp: '2026-07-26T08:00:00',
  },
  {
    id: 'n004', userId: 'u002',
    type: 'auction_started',
    title: 'New Auction Live',
    message: 'MacBook Pro 14" M3 auction is now live! Start bidding.',
    read: true,
    timestamp: '2026-08-03T10:00:00',
  },
  {
    id: 'n005', userId: 'u002',
    type: 'system',
    title: 'System Maintenance',
    message: 'Scheduled maintenance on Aug 20, 2026 from 2–4 AM. Brief downtime expected.',
    read: true,
    timestamp: '2026-08-07T12:00:00',
  },
];

// ── AUDIT LOGS ─────────────────────────────────────────────────────────────
export const mockAuditLogs: AuditLog[] = [
  { id: 'log001', adminId: 'u001', adminName: 'Abebe Girma', action: 'Created Auction', target: 'Samsung Galaxy S25 Ultra',    timestamp: '2026-07-30T09:00:00' },
  { id: 'log002', adminId: 'u001', adminName: 'Abebe Girma', action: 'Published Auction', target: 'MacBook Pro 14" M3',        timestamp: '2026-08-03T09:50:00' },
  { id: 'log003', adminId: 'u001', adminName: 'Abebe Girma', action: 'Suspended User',    target: 'Selamawit Tadesse (u004)',  timestamp: '2026-08-04T14:22:00' },
  { id: 'log004', adminId: 'u001', adminName: 'Abebe Girma', action: 'Closed Auction',    target: 'iPhone 15 Pro Max',        timestamp: '2026-07-25T20:00:00' },
  { id: 'log005', adminId: 'u001', adminName: 'Abebe Girma', action: 'Created Auction',   target: 'Sony PlayStation 5',       timestamp: '2026-08-05T11:00:00' },
  { id: 'log006', adminId: 'u001', adminName: 'Abebe Girma', action: 'Sent Announcement', target: 'All Users',                timestamp: '2026-08-07T12:00:00' },
  { id: 'log007', adminId: 'u001', adminName: 'Abebe Girma', action: 'Edited Auction',    target: 'Rolex Submariner Watch',   timestamp: '2026-08-06T10:15:00' },
];

// ── MOCK CHART DATA ────────────────────────────────────────────────────────
export const revenueData = [
  { month: 'Feb', revenue: 12000 },
  { month: 'Mar', revenue: 19500 },
  { month: 'Apr', revenue: 15200 },
  { month: 'May', revenue: 28000 },
  { month: 'Jun', revenue: 32500 },
  { month: 'Jul', revenue: 41000 },
  { month: 'Aug', revenue: 23000 },
];

export const userActivityData = [
  { month: 'Feb', newUsers: 12,  activeBidders: 45 },
  { month: 'Mar', newUsers: 28,  activeBidders: 89 },
  { month: 'Apr', newUsers: 19,  activeBidders: 72 },
  { month: 'May', newUsers: 45,  activeBidders: 134 },
  { month: 'Jun', newUsers: 38,  activeBidders: 156 },
  { month: 'Jul', newUsers: 62,  activeBidders: 210 },
  { month: 'Aug', newUsers: 31,  activeBidders: 142 },
];

export const auctionPerformanceData = [
  { name: 'Electronics', auctions: 5, avgBids: 320 },
  { name: 'Vehicles',    auctions: 1, avgBids: 891 },
  { name: 'Gaming',      auctions: 1, avgBids: 0   },
  { name: 'Luxury',      auctions: 1, avgBids: 145 },
  { name: 'Home',        auctions: 1, avgBids: 0   },
];

export const creditPackages = [
  { id: 'pkg1', credits: 10,  price: 100,  label: 'Starter',  popular: false },
  { id: 'pkg2', credits: 50,  price: 450,  label: 'Popular',  popular: true  },
  { id: 'pkg3', credits: 100, price: 800,  label: 'Pro',      popular: false },
  { id: 'pkg4', credits: 250, price: 1800, label: 'Elite',    popular: false },
];
