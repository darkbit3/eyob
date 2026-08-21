// ─── BidLow API Client ────────────────────────────────────────────────────────
// In dev: requests go through Vite proxy (/api) or direct to backend
// In production: requests go directly to the backend URL via VITE_API_URL

import {
  ApiUser,
  ApiAuction,
  ApiProduct,
  ApiBid,
  ApiTransaction,
  ApiNotification,
  BankAccountItem,
  PaymentGatewayItem,
  AdvertisementItem,
  PaymentQueueItem,
} from '../types';

const runtimeHost = typeof window !== 'undefined' ? window.location.hostname : '';
const BASE =
  (import.meta.env.VITE_API_URL
    ? `${import.meta.env.VITE_API_URL}/api`
    : null) ??
  (/localhost|127\.0\.0\.1/.test(runtimeHost) ? '/api' : 'https://eyob-backend.onrender.com/api');

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

// ── Token helpers ─────────────────────────────────────────────────────────────
const TOKEN_KEY = 'bidlow_token';

export function getToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setToken(token: string): void {
  try {
    localStorage.setItem(TOKEN_KEY, token);
  } catch (err) {
    console.error('Failed to save auth token to localStorage:', err);
  }
}

export function removeToken(): void {
  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch (err) {
    console.error('Failed to remove auth token from localStorage:', err);
  }
}

// ── Core fetch wrapper ────────────────────────────────────────────────────────
async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    ...(options.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
    ...(options.headers as Record<string, string>),
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  let res: Response;
  try {
    res = await fetch(`${BASE}${path}`, { ...options, headers });
  } catch (netErr: any) {
    throw new Error(netErr?.message || 'Network connection failed. Please check your internet connection.');
  }

  const contentType = res.headers.get('content-type') || '';
  let body: any;

  if (contentType.includes('application/json')) {
    try {
      body = await res.json();
    } catch {
      throw new Error(`Failed to parse JSON response (status ${res.status})`);
    }
  } else {
    const text = await res.text();
    if (text.trim().startsWith('<')) {
      throw new Error(`Server returned an unexpected HTML response (status ${res.status}). Check backend configuration.`);
    }
    try {
      body = JSON.parse(text);
    } catch {
      throw new Error(`Unexpected non-JSON response from server (status ${res.status})`);
    }
  }

  if (!res.ok) {
    const message = body?.message || `Request failed with status ${res.status}`;
    throw new Error(message);
  }

  return body as T;
}

// ── Auth ──────────────────────────────────────────────────────────────────────
export const authApi = {
  login: (phoneOrIdentifier: string, password: string) =>
    request<ApiResponse<{ user: ApiUser; token: string }>>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ phone: phoneOrIdentifier, password }),
    }),

  register: (name: string, email: string, phone: string, password: string) =>
    request<ApiResponse<{ user: ApiUser; token: string }>>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, phone, password }),
    }),

  logout: () =>
    request<ApiResponse<null>>('/auth/logout', { method: 'POST' }),
};

// ── Users ─────────────────────────────────────────────────────────────────────
export const usersApi = {
  me: () => request<ApiResponse<ApiUser>>('/users/me'),
  list: () => request<ApiResponse<ApiUser[]>>('/users'),
  updateStatus: (id: string, status: 'active' | 'suspended') =>
    request<ApiResponse<ApiUser>>(`/users/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),
  deleteUser: (id: string) =>
    request<ApiResponse<null>>(`/users/${id}`, { method: 'DELETE' }),
  adjustWallet: (id: string, amount: number, reason: string) =>
    request<ApiResponse<ApiUser>>(`/users/${id}/wallet`, {
      method: 'PATCH',
      body: JSON.stringify({ amount, reason }),
    }),
};

// ── Auctions ──────────────────────────────────────────────────────────────────
export const auctionsApi = {
  list: (params?: { status?: string; category?: string; search?: string }) => {
    const q = params ? new URLSearchParams(params as Record<string, string>).toString() : '';
    return request<ApiResponse<ApiAuction[]>>(`/auctions${q ? `?${q}` : ''}`);
  },
  get: (id: string) =>
    request<ApiResponse<ApiAuction>>(`/auctions/${id}`),
  myUnlocked: () =>
    request<ApiResponse<string[]>>('/auctions/unlocked/my'),
  unlock: (id: string) =>
    request<ApiResponse<{ unlocked: boolean; wallet_balance?: number }>>(`/auctions/${id}/unlock`, {
      method: 'POST',
    }),
  create: (data: Partial<ApiAuction>) =>
    request<ApiResponse<ApiAuction>>('/auctions', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  update: (id: string, data: Partial<ApiAuction>) =>
    request<ApiResponse<ApiAuction>>(`/auctions/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  setStatus: (id: string, status: string) =>
    request<ApiResponse<ApiAuction>>(`/auctions/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),
  delete: (id: string) =>
    request<ApiResponse<null>>(`/auctions/${id}`, { method: 'DELETE' }),
};

// ── Products ──────────────────────────────────────────────────────────────────
export const productsApi = {
  list: () => request<ApiResponse<ApiProduct[]>>('/products'),
  create: (data: Partial<ApiProduct>) =>
    request<ApiResponse<ApiProduct>>('/products', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  update: (id: string, data: Partial<ApiProduct>) =>
    request<ApiResponse<ApiProduct>>(`/products/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  delete: (id: string) =>
    request<ApiResponse<null>>(`/products/${id}`, { method: 'DELETE' }),
};

// ── Bids ──────────────────────────────────────────────────────────────────────
export const bidsApi = {
  place: (auctionId: string, amount: number) =>
    request<ApiResponse<ApiBid>>('/bids', {
      method: 'POST',
      body: JSON.stringify({ auction_id: auctionId, amount }),
    }),
  myBids: () => request<ApiResponse<ApiBid[]>>('/bids/my'),
  update: (bidId: string, amount: number) =>
    request<ApiResponse<ApiBid>>(`/bids/${bidId}`, {
      method: 'PATCH',
      body: JSON.stringify({ amount }),
    }),
  cancel: (bidId: string) =>
    request<ApiResponse<null>>(`/bids/${bidId}`, { method: 'DELETE' }),
  forAuction: (auctionId: string) =>
    request<ApiResponse<ApiBid[]>>(`/bids/auction/${auctionId}`),
};

// ── Uploads ───────────────────────────────────────────────────────────────────
export const uploadApi = {
  receipt: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return request<ApiResponse<{ url: string }>>('/upload/receipt', {
      method: 'POST',
      body: formData,
    });
  },
};

// ── Wallet ────────────────────────────────────────────────────────────────────
export const walletApi = {
  myTransactions: () =>
    request<ApiResponse<ApiTransaction[]>>('/wallet/transactions/my'),
  allTransactions: () =>
    request<ApiResponse<ApiTransaction[]>>('/wallet/transactions'),
  queue: () => request<ApiResponse<PaymentQueueItem[]>>('/wallet/queue'),
  submitDeposit: (data: {
    amount: number;
    credits?: number;
    payment_method: string;
    reference_number: string;
    receipt_image: string;
    notes?: string;
  }) =>
    request<ApiResponse<PaymentQueueItem>>('/wallet/queue', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  approvePayment: (id: string) =>
    request<ApiResponse<null>>(`/wallet/queue/${id}/approve`, { method: 'PATCH' }),
  rejectPayment: (id: string, reason?: string) =>
    request<ApiResponse<null>>(`/wallet/queue/${id}/reject`, {
      method: 'PATCH',
      body: JSON.stringify({ reason }),
    }),
  chapaInitialize: (amount: number, returnUrl?: string) =>
    request<ApiResponse<{ checkout_url: string; tx_ref: string }>>('/wallet/chapa/initialize', {
      method: 'POST',
      body: JSON.stringify({ amount, return_url: returnUrl }),
    }),
  chapaVerify: (txRef: string) =>
    request<ApiResponse<{ status: string; amount?: number }>>(`/wallet/chapa/verify/${txRef}`),
};

// ── Notifications ─────────────────────────────────────────────────────────────
export const notificationsApi = {
  my: () => request<ApiResponse<ApiNotification[]>>('/notifications/my'),
  markRead: (id: string) =>
    request<ApiResponse<{ success: boolean }>>(`/notifications/${id}/read`, { method: 'PATCH' }),
};

export const paymentGatewaysApi = {
  active: () => request<ApiResponse<PaymentGatewayItem[]>>('/settings/payment-gateways'),
};

export const advertisementsApi = {
  active: () => request<ApiResponse<AdvertisementItem[]>>('/advertisements/active'),
};

// ── Audit Logs ────────────────────────────────────────────────────────────────
export const auditApi = {
  list: () => request<ApiResponse<any[]>>('/audit'),
};

// ── Settings ──────────────────────────────────────────────────────────────────
export const settingsApi = {
  get: () => request<ApiResponse<any>>('/settings'),
  update: (data: any) =>
    request<ApiResponse<any>>('/settings', {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  getBankAccounts: () =>
    request<ApiResponse<BankAccountItem[]>>('/settings/bank-accounts'),
  createBankAccount: (data: { method_name: string; account_number: string; account_holder: string }) =>
    request<ApiResponse<BankAccountItem>>('/settings/bank-accounts', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateBankAccount: (id: string, data: Partial<BankAccountItem>) =>
    request<ApiResponse<BankAccountItem>>(`/settings/bank-accounts/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  deleteBankAccount: (id: string) =>
    request<ApiResponse<null>>(`/settings/bank-accounts/${id}`, {
      method: 'DELETE',
    }),
};

// ── Winners ───────────────────────────────────────────────────────────────────
export const winnersApi = {
  list: () => request<ApiResponse<any[]>>('/winners'),
};

// ── Reports ───────────────────────────────────────────────────────────────────
export const reportsApi = {
  dashboard: () => request<ApiResponse<any>>('/reports/dashboard'),
};
