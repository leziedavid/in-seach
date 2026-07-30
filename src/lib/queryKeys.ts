/**
 * Query Key Factory — source unique de vérité pour les clés React Query.
 * Permet une invalidation précise du cache et évite les fautes de frappe.
 *
 * Usage :
 *   useQuery({ queryKey: queryKeys.products.list({ page: 1 }), ... })
 *   queryClient.invalidateQueries({ queryKey: queryKeys.products.all })
 */

export const queryKeys = {
  // ─── Auth / User ───────────────────────────────────────────────
  me: ['me'] as const,

  // ─── Products ──────────────────────────────────────────────────
  products: {
    all: ['products'] as const,
    list: (params?: Record<string, unknown>) => ['products', 'list', params] as const,
    detail: (id: string) => ['products', 'detail', id] as const,
    myProducts: (params?: Record<string, unknown>) => ['products', 'mine', params] as const,
  },

  // ─── Services ──────────────────────────────────────────────────
  services: {
    all: ['services'] as const,
    list: (params?: Record<string, unknown>) => ['services', 'list', params] as const,
    detail: (id: string) => ['services', 'detail', id] as const,
    search: (query: string, filters?: Record<string, unknown>) => ['services', 'search', query, filters] as const,
  },

  // ─── Bookings ──────────────────────────────────────────────────
  bookings: {
    all: ['bookings'] as const,
    list: (params?: Record<string, unknown>) => ['bookings', 'list', params] as const,
    detail: (id: string) => ['bookings', 'detail', id] as const,
    myBookings: (params?: Record<string, unknown>) => ['bookings', 'mine', params] as const,
  },

  // ─── Orders ────────────────────────────────────────────────────
  orders: {
    all: ['orders'] as const,
    list: (params?: Record<string, unknown>) => ['orders', 'list', params] as const,
    detail: (id: string) => ['orders', 'detail', id] as const,
  },

  // ─── Logistics ─────────────────────────────────────────────────
  logistics: {
    all: ['logistics'] as const,
    quotes: (params?: Record<string, unknown>) => ['logistics', 'quotes', params] as const,
    deliveries: (params?: Record<string, unknown>) => ['logistics', 'deliveries', params] as const,
    tracking: (id: string) => ['logistics', 'tracking', id] as const,
  },

  // ─── Annonces ──────────────────────────────────────────────────
  annonces: {
    all: ['annonces'] as const,
    list: (params?: Record<string, unknown>) => ['annonces', 'list', params] as const,
    detail: (id: string) => ['annonces', 'detail', id] as const,
  },

  // ─── Store ─────────────────────────────────────────────────────
  store: {
    info: ['store', 'info'] as const,
    products: (params?: Record<string, unknown>) => ['store', 'products', params] as const,
  },

  // ─── Lives ─────────────────────────────────────────────────────
  lives: {
    all: ['lives'] as const,
    list: (params?: Record<string, unknown>) => ['lives', 'list', params] as const,
    detail: (id: string) => ['lives', 'detail', id] as const,
  },

  // ─── Notifications ─────────────────────────────────────────────
  notifications: {
    all: ['notifications'] as const,
    list: (params?: Record<string, unknown>) => ['notifications', 'list', params] as const,
  },

  // ─── Subscription ──────────────────────────────────────────────
  subscription: {
    current: ['subscription', 'current'] as const,
    plans: ['subscription', 'plans'] as const,
  },

  // ─── Admin ─────────────────────────────────────────────────────
  admin: {
    users: (params?: Record<string, unknown>) => ['admin', 'users', params] as const,
    stats: ['admin', 'stats'] as const,
  },

  // ─── Videos (page accueil) ─────────────────────────────────────
  videos: ['videos'] as const,

  // ─── AI / MCP Tools ────────────────────────────────────────────
  ai: {
    tools: ['ai', 'tools'] as const,
  },

  // ─── Menus dynamiques (TypeMenu/MenuGroup/Menu) ─────────────────
  menus: {
    byType: (code: string) => ['menus', 'byType', code] as const,
    types: ['menus', 'types'] as const,
    groups: (typeMenuId?: string) => ['menus', 'groups', typeMenuId] as const,
    adminList: (typeMenuId?: string) => ['menus', 'adminList', typeMenuId] as const,
  },
} as const;
