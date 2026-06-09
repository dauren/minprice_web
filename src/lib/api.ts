import { getAccessToken, getRefreshToken, setTokens, clearTokens } from './auth';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://backend.minprice.kz/api';
// Auth (/auth/*) may target a different backend than products/data — e.g. staging
// for auth, prod for the catalog. Falls back to API_BASE_URL when not split.
const AUTH_BASE_URL = import.meta.env.VITE_AUTH_BASE_URL || API_BASE_URL;
const baseFor = (endpoint: string) => (endpoint.startsWith('/auth/') ? AUTH_BASE_URL : API_BASE_URL);
const GUEST_UUID_KEY = 'minprice_guest_uuid';

let sessionPromise: Promise<string> | null = null;

const getGuestUuid = (): string | null => {
  // Check localStorage first
  const stored = localStorage.getItem(GUEST_UUID_KEY);
  if (stored) return stored;

  // Check document.cookie as fallback
  const match = document.cookie.match(new RegExp('(^| )' + GUEST_UUID_KEY + '=([^;]+)'));
  if (match) return match[2];

  return null;
};

const setGuestUuid = (uuid: string) => {
  localStorage.setItem(GUEST_UUID_KEY, uuid);
  // Set cookie for 1 year
  const date = new Date();
  date.setTime(date.getTime() + (365 * 24 * 60 * 60 * 1000));
  document.cookie = `${GUEST_UUID_KEY}=${uuid};expires=${date.toUTCString()};path=/;samesite=lax`;
};

const initSession = async (): Promise<string> => {
  const existing = getGuestUuid();
  if (existing) return existing;

  if (!sessionPromise) {
    sessionPromise = fetch(`${API_BASE_URL}/session/init/`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
      credentials: 'omit' // Explicitly omit credentials for the first init to avoid CORS Catch-22
    })
      .then(res => {
        if (!res.ok) throw new Error("Failed to init session");
        return res.json();
      })
      .then(data => {
        if (data.guest_uuid) {
          setGuestUuid(data.guest_uuid);
          return data.guest_uuid;
        }
        throw new Error("No guest_uuid returned");
      })
      .catch((e) => {
        console.error("Session init failed:", e);
        sessionPromise = null;
        throw e;
      })
  }
  return sessionPromise;
};

// ── JWT auth: attach Authorization header + transparently refresh on 401 ────────

let refreshPromise: Promise<string | null> | null = null;

const refreshAccessToken = async (): Promise<string | null> => {
  const refresh = getRefreshToken();
  if (!refresh) return null;

  if (!refreshPromise) {
    refreshPromise = fetch(`${AUTH_BASE_URL}/auth/token/refresh/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'omit',
      body: JSON.stringify({ refresh }),
    })
      .then(async (res) => {
        if (!res.ok) { clearTokens(); return null; }
        const data = await res.json();
        if (data.access) {
          // simplejwt rotates refresh tokens — keep the new one if present
          setTokens({ access: data.access, refresh: data.refresh || refresh });
          return data.access as string;
        }
        clearTokens();
        return null;
      })
      .catch(() => { clearTokens(); return null; })
      .finally(() => { refreshPromise = null; });
  }
  return refreshPromise;
};

// Shared fetch: injects guest UUID + platform + (optional) Bearer token.
// On a 401 with a refresh token available, refreshes once and retries.
const coreFetch = async (
  endpoint: string,
  init: RequestInit = {},
  retried = false,
): Promise<Response> => {
  const uuid = await initSession();
  const access = getAccessToken();

  const headers: Record<string, string> = {
    'X-Guest-UUID': uuid,
    'X-Platform': 'web',
    ...(init.headers as Record<string, string> | undefined),
  };
  if (access) headers['Authorization'] = `Bearer ${access}`;

  const response = await fetch(`${baseFor(endpoint)}${endpoint}`, {
    ...init,
    headers,
    credentials: 'omit',
  });

  if (response.status === 401 && access && !retried) {
    const newAccess = await refreshAccessToken();
    if (newAccess) return coreFetch(endpoint, init, true);
  }
  return response;
};

export const apiClient = {
  get: async <T>(endpoint: string): Promise<T> => {
    // If the endpoint IS the session init, bypass the wrapper to avoid infinite loops
    if (endpoint === '/session/init/') {
      const response = await fetch(`${API_BASE_URL}${endpoint}`);
      return response.json();
    }

    const response = await coreFetch(endpoint, { method: 'GET' });
    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`);
    }
    return response.json();
  },
  post: async <T>(endpoint: string, data?: any): Promise<T> => {
    const response = await coreFetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: data ? JSON.stringify(data) : undefined,
    });
    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`);
    }
    return response.json();
  },
  patch: async <T>(endpoint: string, data?: any): Promise<T> => {
    const response = await coreFetch(endpoint, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: data ? JSON.stringify(data) : undefined,
    });
    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`);
    }
    return response.json();
  },
  delete: async (endpoint: string): Promise<void> => {
    const response = await coreFetch(endpoint, { method: 'DELETE' });
    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`);
    }
  }
};

export const API_ENDPOINTS = {
  search: (query: string, cityId?: number, chainIds?: number[], page?: number) => {
    let url = `/search/?q=${encodeURIComponent(query)}`;
    if (cityId) url += `&city_id=${cityId}`;
    if (chainIds && chainIds.length > 0) url += `&chain_ids=${chainIds.join(',')}`;
    if (page !== undefined) url += `&page=${page}`;
    return url;
  },
  searchSuggestions: (query: string, limit?: number) => {
    let url = `/search/suggestions/?q=${encodeURIComponent(query)}`;
    if (limit) url += `&limit=${limit}`;
    return url;
  },
  algoliaConfig: () => '/algolia-config/',
  bestDeals: (cityId?: number, chainIds?: number[], page?: number) => {
    const params = new URLSearchParams();
    if (cityId) params.append('city_id', cityId.toString());
    if (chainIds && chainIds.length > 0) params.append('chain_ids', chainIds.join(','));
    if (page) params.append('page', page.toString());
    const qs = params.toString();
    return `/best-deals/${qs ? `?${qs}` : ''}`;
  },
  discounts: (cityId?: number, chainIds?: number[], page?: number) => {
    const params = new URLSearchParams();
    if (cityId) params.append('city_id', cityId.toString());
    if (chainIds && chainIds.length > 0) params.append('chain_ids', chainIds.join(','));
    if (page) params.append('page', page.toString());
    const qs = params.toString();
    return `/discounts/${qs ? `?${qs}` : ''}`;
  },
  product: (uuid: string, cityId?: number) =>
    `/products/${uuid}/${cityId ? `?city_id=${cityId}` : ''}`,
  priceHistory: (uuid: string, cityId?: number) => {
    const params = new URLSearchParams();
    if (cityId) params.append('city_id', cityId.toString());
    params.append('days', '180');
    return `/products/${uuid}/price-history/?${params.toString()}`;
  },
  priceDrops: (cityId?: number) => `/price-drops/${cityId ? `?city_id=${cityId}` : ''}`,
  priceIncreases: (cityId?: number) => `/price-increases/${cityId ? `?city_id=${cityId}` : ''}`,
  cities: () => '/cities/',
  chains: () => '/chains/',
  homepageStats: () => '/homepage-stats/',
  categories: () => '/categories/',
  products: (params?: {
    canonical_category?: number;
    ordering?: string;
    city_id?: number;
    limit?: number;
    page?: number;
  }) => {
    const queryParams = new URLSearchParams();
    if (params?.canonical_category) queryParams.append('canonical_category', params.canonical_category.toString());
    if (params?.ordering) queryParams.append('ordering', params.ordering);
    if (params?.city_id) queryParams.append('city_id', params.city_id.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.page) queryParams.append('page', params.page.toString());
    const query = queryParams.toString();
    return `/products/${query ? `?${query}` : ''}`;
  },
  // Cart Endpoints
  carts: () => '/carts/',
  cart: (uuid: string) => `/carts/${uuid}/`,
  cartSummary: (uuid: string, cityId?: number) => `/carts/${uuid}/summary/?city_id=${cityId || 1}`,
  cartAddItem: (uuid: string) => `/carts/${uuid}/add_item/`,
  cartRemoveItem: (uuid: string) => `/carts/${uuid}/remove_item/`,
  cartUpdateQuantity: (uuid: string) => `/carts/${uuid}/update_quantity/`,
  cartArchive: (uuid: string) => `/carts/${uuid}/archive/`,
  cartRename: (uuid: string) => `/carts/${uuid}/update_name/`,
  cartSetActive: (uuid: string) => `/carts/${uuid}/set_active/`,
  quickAdd: () => '/cart/add/',
  storePreferences: () => '/store-preferences/',
  cartTransfer: () => '/cart/transfer/',
  sessionInit: () => '/session/init/',
  // Auth
  authTelegram: () => '/auth/telegram/',
  authMe: () => '/auth/me/',
  authTokenRefresh: () => '/auth/token/refresh/',
} as const;
