// ─── BidLow Type & Interface Definitions ──────────────────────────────────────

export type AuctionStatus = 'active' | 'upcoming' | 'closed' | 'paused' | 'draft';
export type UserRole = 'admin' | 'super_admin' | 'customer';

export interface User {
  id: string;
  name: string;
  phone: string;
  email: string;
  photo?: string;
  role: UserRole;
  walletBalance: number;
  credits?: number;
  status: 'active' | 'suspended';
  joinedAt: string;
  wonAuctions: string[];
}

export interface Product {
  id: string;
  name: string;
  category: string;
  image: string;
  images?: string[];
  retailValue: number;
  description: string;
  linkedAuctionId?: string;
  linkedAuctionStatus?: AuctionStatus;
  createdAt: string;
}

export interface Auction {
  id: string;
  productId?: string;
  productName?: string;
  title: string;
  description: string;
  image: string;
  retailValue: number;
  bidPerCost?: number;
  maxBidsPerUser?: number;
  effectiveMaxBidsPerUser?: number;
  category: string;
  status: AuctionStatus;
  startTime: string;
  endTime: string;
  minBid: number;
  maxBid: number;
  totalParticipants: number;
  totalBids: number;
  winnerId?: string;
  winnerName?: string;
  lowestUniqueBid?: number;
  closedAt?: string;
}

export interface Bid {
  id: string;
  auctionId: string;
  bidderId: string;
  maskedBidderId: string;
  bidderName?: string;
  bidderPhone?: string;
  bidderPhoto?: string;
  amount: number;
  timestamp: string;
  isDuplicate?: boolean;
  isLowestUnique?: boolean;
}

export interface Transaction {
  id: string;
  userId: string;
  userName: string;
  type: 'wallet_deposit' | 'credit_purchase' | 'bid_placed' | 'refund' | 'winning_reward' | 'manual_adjustment' | 'wallet_withdrawal' | 'bid_fee_paid' | string;
  amount: number;
  description: string;
  timestamp: string;
  status: 'completed' | 'pending' | 'failed' | 'approved' | 'rejected' | string;
  paymentMethod?: string;
}

export interface PaymentQueueItem {
  id: string;
  userId: string;
  userName: string;
  userEmail?: string;
  amount: number;
  paymentMethod: string;
  referenceNumber: string;
  receiptImage: string;
  timestamp: string;
  status: 'pending' | 'approved' | 'rejected';
  notes?: string;
}

export interface Notification {
  id: string;
  userId: string;
  type: 'auction_started' | 'auction_ending' | 'winner_announced' | 'payment_received' | 'wallet_updated' | 'system' | string;
  title: string;
  message: string;
  read: boolean;
  timestamp: string;
  metadata?: Record<string, any>;
}

export interface Announcement {
  id: string;
  title: string;
  message: string;
  audience: 'All Users' | 'Customers Only' | 'Admins Only' | 'Active Auction Bidders';
  type: 'System Alert' | 'Promotion' | 'Platform Update' | 'Maintenance Notice';
  sentBy: string;
  timestamp: string;
  deliveredCount: number;
}

export interface AuditLog {
  id: string;
  adminId: string;
  adminName: string;
  action: string;
  target: string;
  details: string;
  ipAddress: string;
  timestamp: string;
}

export interface SystemSettings {
  platformName: string;
  supportEmail: string;
  currency: string;
  minBidPrice: number;
  maxBidPrice: number;
  defaultBidStep: number;
  autoWinnerVerification: boolean;
  maintenanceMode: boolean;
}

export const initialSettings: SystemSettings = {
  platformName: 'BidLow Transparent Auctions',
  supportEmail: 'admin@bidlow.et',
  currency: 'ETB',
  minBidPrice: 1,
  maxBidPrice: 5000,
  defaultBidStep: 1,
  autoWinnerVerification: true,
  maintenanceMode: false,
};

// API DTO types
export interface ApiUser {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  photo_url?: string;
  role: UserRole;
  status: 'active' | 'suspended';
  wallet_balance?: number;
  credits?: number;
  joined_at?: string;
  won_auctions?: string[];
}

export interface ApiAuction {
  id: string;
  product_id?: string;
  product_name?: string;
  title: string;
  description?: string;
  image_url?: string;
  image?: string;
  retail_value?: number;
  bid_per_cost?: number;
  max_bids_per_user?: number;
  effective_max_bids_per_user?: number;
  category: string;
  status: AuctionStatus;
  start_time?: string;
  end_time?: string;
  min_bid?: number;
  max_bid?: number;
  total_participants?: number;
  total_bids?: number;
  winner_id?: string;
  winner_name?: string;
  lowest_unique_bid?: number;
  closed_at?: string;
}

export interface ApiProduct {
  id: string;
  name: string;
  category: string;
  image_url?: string;
  image?: string;
  images?: string[] | string;
  retail_value?: number;
  description?: string;
  linked_auction_id?: string;
  linked_auction_status?: AuctionStatus;
  created_at?: string;
}

export interface ApiBid {
  id: string;
  auction_id?: string;
  bidder_id?: string;
  masked_bidder_id?: string;
  bidder_name?: string;
  bidder_phone?: string;
  bidder_photo?: string;
  amount: number;
  created_at?: string;
  is_duplicate?: boolean;
  is_lowest_unique?: boolean;
}

export interface ApiTransaction {
  id: string;
  user_id?: string;
  user_name?: string;
  type?: string;
  amount: number;
  description?: string;
  status?: string;
  payment_method?: string;
  created_at?: string;
}

export interface ApiNotification {
  id: string;
  user_id?: string;
  type?: string;
  title: string;
  message: string;
  is_read?: boolean;
  read?: boolean;
  created_at?: string;
  metadata?: Record<string, any>;
}

export interface BankAccountItem {
  id?: string;
  method_name: string;
  account_number: string;
  account_holder: string;
  is_active?: boolean;
}

export interface PaymentGatewayItem {
  id?: string;
  name: string;
  display_name?: string;
  is_active?: boolean;
}

export interface AdvertisementItem {
  id: string;
  title?: string;
  image_url: string;
  target_url?: string;
  is_active?: boolean;
}
