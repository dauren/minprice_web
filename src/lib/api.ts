const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://backend.minprice.kz/api';
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

export const apiClient = {
  get: async <T>(endpoint: string): Promise<T> => {
    // If the endpoint IS the session init, bypass the wrapper to avoid infinite loops
    if (endpoint === '/session/init/') {
      const response = await fetch(`${API_BASE_URL}${endpoint}`);
      return response.json();
    }

    const uuid = await initSession();
    const url = `${API_BASE_URL}${endpoint}`;

    const response = await fetch(url, {
      headers: {
        'X-Guest-UUID': uuid,
        'X-Platform': 'web',
      },
      credentials: 'omit',
    });
    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`);
    }
    return response.json();
  },
  post: async <T>(endpoint: string, data?: any): Promise<T> => {
    const uuid = await initSession();
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Guest-UUID': uuid,
        'X-Platform': 'web',
      },
      credentials: 'omit',
      body: data ? JSON.stringify(data) : undefined,
    });
    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`);
    }
    return response.json();
  },
  patch: async <T>(endpoint: string, data?: any): Promise<T> => {
    const uuid = await initSession();
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'X-Guest-UUID': uuid,
        'X-Platform': 'web',
      },
      credentials: 'omit',
      body: data ? JSON.stringify(data) : undefined,
    });
    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`);
    }
    return response.json();
  },
  delete: async (endpoint: string): Promise<void> => {
    const uuid = await initSession();
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'DELETE',
      headers: {
        'X-Guest-UUID': uuid,
        'X-Platform': 'web',
      },
      credentials: 'omit',
    });
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
  similarProducts: (uuid: string, cityId?: number, limit?: number) => {
    const params = new URLSearchParams();
    if (cityId) params.append('city_id', cityId.toString());
    if (limit) params.append('limit', limit.toString());
    const qs = params.toString();
    return `/products/${uuid}/similar/${qs ? `?${qs}` : ''}`;
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
  sessionInit: () => '/session/init/'
} as const;
