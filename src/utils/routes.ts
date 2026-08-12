// ─── Encrypted Route Map — Frontend ──────────────────────────────────────────
// Real page names are never exposed in the URL.
// Update these slugs here and everywhere updates automatically.

export const ROUTES = {
  // ── Public ────────────────────────────────────────────────────────────────
  LOGIN:              '/a1b2c3',
  REGISTER:           '/d4e5f6',
  FORGOT_PASSWORD:    '/g7h8i9',
  OTP_VERIFY:         '/j0k1l2',
  RESET_PASSWORD:     '/m3n4o5',

  // ── Customer (protected) ─────────────────────────────────────────────────
  DASHBOARD:          '/p6q7r8',
  AUCTIONS:           '/s9t0u1',
  AUCTION_DETAIL:     '/v2w3x4',   // + /:id  →  /v2w3x4/:id
  MY_BIDS:            '/y5z6a7',
  NOTIFICATIONS:      '/u7v8w9',
  WINNER_VERIFY:      '/b8c9d0',
  FAIRNESS_AUDIT:     '/f7g8h9',
  WALLET:             '/e1f2g3',
} as const;

export type RouteKey = keyof typeof ROUTES;
