const API_BASE_URL = (import.meta as any).env?.VITE_API_BASE ?? 'http://localhost:3000/api';

export function getAuthToken(): string | null {
  return localStorage.getItem('bidlow_token');
}

export function setAuthToken(token: string): void {
  localStorage.setItem('bidlow_token', token);
}

export function removeAuthToken(): void {
  localStorage.removeItem('bidlow_token');
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const json = await response.json();

  if (!response.ok) {
    throw new Error(json.message || 'API request failed');
  }

  return json.data as T;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  photo_url?: string;
  role: string;
  status: string;
  wallet_balance: number;
  joined_at: string;
  won_auctions?: string[];
}

export interface WalletBalance {
  wallet_balance: number;
}

export interface Transaction {
  id: string;
  user_id: string;
  user_name: string;
  type: string;
  amount: number;
  description: string;
  status: string;
  payment_method?: string;
  created_at: string;
}

export interface ApiAuction {
  id: string;
  product_id?: string;
  title: string;
  description: string;
  image_url: string;
  retail_value: number;
  category: string;
  status: 'active' | 'upcoming' | 'closed' | 'paused' | 'draft';
  start_time: string;
  end_time: string;
  min_bid: number;
  max_bid: number;
  total_participants: number;
  total_bids: number;
  winner_id?: string;
  winner_name?: string;
  lowest_unique_bid?: number;
  closed_at?: string;
}

export interface UserWin {
  auction_id: string;
  title: string;
  image_url: string;
  retail_value: number;
  category: string;
  winning_bid: number;
  date: string;
  product_name: string;
  claim_status: string;
}

export interface UserBid {
  id: string;
  auction_id: string;
  masked_bidder_id: string;
  amount: number;
  is_duplicate: boolean;
  is_lowest_unique: boolean;
  timestamp: string;
  auction_title: string;
  auction_status: string;
  image_url: string;
  result: 'Won' | 'Lost' | 'Pending';
}

export interface NotificationItem {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  timestamp: string;
}

export const api = {
  // Auth
  login: async (email: string, password: string) => {
    const json = await request<{ user: UserProfile; token: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    setAuthToken(json.token);
    return json.user;
  },

  register: async (name: string, email: string, phone: string, password: string) => {
    const json = await request<{ user: UserProfile; token: string }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, phone, password }),
    });
    setAuthToken(json.token);
    return json.user;
  },

  logout: () => {
    removeAuthToken();
  },

  // User Profile
  getUserProfile: () => request<UserProfile>('/user/profile'),

  // Wallet
  getWalletBalance: () => request<WalletBalance>('/wallet/balance'),
  getWalletTransactions: (limit = 5) => request<Transaction[]>(`/wallet/transactions?limit=${limit}`),

  // Auctions
  getAuctions: (status?: string) =>
    request<ApiAuction[]>(`/auctions${status ? `?status=${status}` : ''}`),

  // User Scoped Data
  getUserWins: () => request<UserWin[]>('/user/wins'),
  getUserBids: () => request<UserBid[]>('/user/bids'),
  getUserNotifications: () => request<NotificationItem[]>('/user/notifications'),
  markNotificationRead: (id: string) =>
    request<{ success: boolean }>(`/notifications/${id}/read`, { method: 'PATCH' }),
};
