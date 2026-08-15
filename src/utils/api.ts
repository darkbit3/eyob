// ─── BidLow API Client ────────────────────────────────────────────────────────
// In dev: requests go through the Vite proxy → http://localhost:3000
// In production: requests go directly to the backend URL via VITE_API_URL

const runtimeHost = typeof window !== 'undefined' ? window.location.hostname : '';
const BASE =
  (import.meta.env.VITE_API_URL
    ? `${import.meta.env.VITE_API_URL}/api`
    : null) ??
  (/localhost|127\.0\.0\.1/.test(runtimeHost) ? '/api' : 'https://eyob-backend.onrender.com/api');

// ── Token helpers ─────────────────────────────────────────────────────────────
export function getToken(): string | null {
  return localStorage.getItem('bidlow_token');
}

export function setToken(token: string): void {
  localStorage.setItem('bidlow_token', token);
}

export function removeToken(): void {
  localStorage.removeItem('bidlow_token');
}

// ── Core fetch wrapper ────────────────────────────────────────────────────────
async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${BASE}${path}`, { ...options, headers });
  const contentType = res.headers.get('content-type') || '';
  let body: any;
  if (contentType.includes('application/json')) {
    body = await res.json();
  } else {
    const text = await res.text();
    if (text.trim().startsWith('<')) {
      // Got an HTML page — likely wrong URL or proxy not running
      throw new Error(`Server returned an unexpected HTML response (status ${res.status}). Check the API URL configuration.`);
    }
    try {
      body = JSON.parse(text);
    } catch {
      throw new Error(`Unexpected response from server (status ${res.status})`);
    }
  }

  if (!res.ok) {
    throw new Error(body?.message || `Request failed (${res.status})`);
  }
  return body;
}

// ── Auth ──────────────────────────────────────────────────────────────────────
export const authApi = {
  login: (phone: string, password: string) =>
    request<{ success: boolean; data: { user: any; token: string } }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ phone, password }),
    }),

  register: (name: string, email: string, phone: string, password: string) =>
    request<{ success: boolean; data: { user: any; token: string } }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, phone, password }),
    }),

  logout: () =>
    request<{ success: boolean }>('/auth/logout', { method: 'POST' }),
};

// ── Users ─────────────────────────────────────────────────────────────────────
export const usersApi = {
  me: () => request<{ success: boolean; data: any }>('/users/me'),
  list: () => request<{ success: boolean; data: any[] }>('/users'),
  updateStatus: (id: string, status: 'active' | 'suspended') =>
    request<{ success: boolean; data: any }>(`/users/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),
  deleteUser: (id: string) =>
    request<{ success: boolean }>(`/users/${id}`, { method: 'DELETE' }),
  adjustWallet: (id: string, amount: number, reason: string) =>
    request<{ success: boolean; data: any }>(`/users/${id}/wallet`, {
      method: 'PATCH',
      body: JSON.stringify({ amount, reason }),
    }),
};

// ── Auctions ──────────────────────────────────────────────────────────────────
export const auctionsApi = {
  list: (params?: { status?: string; category?: string; search?: string }) => {
    const q = new URLSearchParams(params as any).toString();
    return request<{ success: boolean; data: any[] }>(`/auctions${q ? `?${q}` : ''}`);
  },
  get: (id: string) =>
    request<{ success: boolean; data: any }>(`/auctions/${id}`),
  create: (data: any) =>
    request<{ success: boolean; data: any }>('/auctions', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  update: (id: string, data: any) =>
    request<{ success: boolean; data: any }>(`/auctions/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  setStatus: (id: string, status: string) =>
    request<{ success: boolean; data: any }>(`/auctions/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),
  delete: (id: string) =>
    request<{ success: boolean }>(`/auctions/${id}`, { method: 'DELETE' }),
};

// ── Products ──────────────────────────────────────────────────────────────────
export const productsApi = {
  list: () => request<{ success: boolean; data: any[] }>('/products'),
  create: (data: any) =>
    request<{ success: boolean; data: any }>('/products', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  update: (id: string, data: any) =>
    request<{ success: boolean; data: any }>(`/products/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  delete: (id: string) =>
    request<{ success: boolean }>(`/products/${id}`, { method: 'DELETE' }),
};

// ── Bids ──────────────────────────────────────────────────────────────────────
export const bidsApi = {
  place: (auctionId: string, amount: number) =>
    request<{ success: boolean; data: any }>('/bids', {
      method: 'POST',
      body: JSON.stringify({ auction_id: auctionId, amount }),
    }),
  myBids: () => request<{ success: boolean; data: any[] }>('/bids/my'),
  forAuction: (auctionId: string) =>
    request<{ success: boolean; data: any[] }>(`/bids/auction/${auctionId}`),
};

// ── Wallet ────────────────────────────────────────────────────────────────────
export const walletApi = {
  myTransactions: () =>
    request<{ success: boolean; data: any[] }>('/wallet/transactions/my'),
  allTransactions: () =>
    request<{ success: boolean; data: any[] }>('/wallet/transactions'),
  queue: () => request<{ success: boolean; data: any[] }>('/wallet/queue'),
  submitDeposit: (data: any) =>
    request<{ success: boolean; data: any }>('/wallet/queue', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  approvePayment: (id: string) =>
    request<{ success: boolean }>(`/wallet/queue/${id}/approve`, { method: 'PATCH' }),
  rejectPayment: (id: string, reason?: string) =>
    request<{ success: boolean }>(`/wallet/queue/${id}/reject`, {
      method: 'PATCH',
      body: JSON.stringify({ reason }),
    }),
  chapaInitialize: (amount: number) =>
    request<{ success: boolean; data: { checkout_url: string; tx_ref: string } }>('/wallet/chapa/initialize', {
      method: 'POST',
      body: JSON.stringify({ amount }),
    }),
  chapaVerify: (txRef: string) =>
    request<{ success: boolean; message: string; data: { status: string; amount?: number } }>(`/wallet/chapa/verify/${txRef}`),
};

// ── Notifications ─────────────────────────────────────────────────────────────
export const notificationsApi = {
  my: () => request<{ success: boolean; data: any[] }>('/notifications/my'),
  markRead: (id: string) =>
    request<{ success: boolean }>(`/notifications/${id}/read`, { method: 'PATCH' }),
};

// ── Audit Logs ────────────────────────────────────────────────────────────────
export const auditApi = {
  list: () => request<{ success: boolean; data: any[] }>('/audit'),
};

// ── Settings ──────────────────────────────────────────────────────────────────
export const settingsApi = {
  get: () => request<{ success: boolean; data: any }>('/settings'),
  update: (data: any) =>
    request<{ success: boolean; data: any }>('/settings', {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
};

// ── Winners ───────────────────────────────────────────────────────────────────
export const winnersApi = {
  list: () => request<{ success: boolean; data: any[] }>('/winners'),
};

// ── Reports ───────────────────────────────────────────────────────────────────
export const reportsApi = {
  dashboard: () => request<{ success: boolean; data: any }>('/reports/dashboard'),
};
