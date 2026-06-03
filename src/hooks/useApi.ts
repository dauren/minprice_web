import { useQuery, useMutation, useQueryClient, keepPreviousData, useInfiniteQuery } from '@tanstack/react-query';
import { apiClient, API_ENDPOINTS } from '@/lib/api';
import { useCity } from '@/context/CityContext';
import type {
  BestDealsResponse,
  DiscountsResponse,
  PriceDropsResponse,
  PriceIncreasesResponse,
  SearchResponse,
  Product,
  CitiesResponse,
  PriceHistoryResponse,
  ChainsResponse,
  CategoriesResponse,
  ProductsResponse,
  AlgoliaConfigResponse,
  QuerySuggestionsResponse,
  HomepageStatsResponse,
} from '@/types/api';

// Search products
export const useSearch = (query: string, chainIds?: number[]) => {
  const { selectedCityId } = useCity();
  return useQuery({
    queryKey: ['search', query, selectedCityId, chainIds],
    queryFn: () => apiClient.get<SearchResponse>(API_ENDPOINTS.search(query, selectedCityId, chainIds)),
    enabled: query.length > 0,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
};

export const useInfiniteSearch = (query: string, chainIds?: number[]) => {
  const { selectedCityId } = useCity();

  return useInfiniteQuery({
    queryKey: ['search-infinite', query, selectedCityId, chainIds],
    queryFn: async ({ pageParam = 0 }) => {
      // MeiliSearch pagination starts at 0, so we pass pageParam directly
      return apiClient.get<SearchResponse>(
        API_ENDPOINTS.search(query, selectedCityId, chainIds, pageParam)
      );
    },
    getNextPageParam: (lastPage) => {
      // MeiliSearch format: has nbPages and page. If current page + 1 < nbPages, return next page index
      if (lastPage.page + 1 < lastPage.nbPages) {
        return lastPage.page + 1;
      }
      return undefined;
    },
    initialPageParam: 0,
    enabled: query.length > 0,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
};

export const useAlgoliaConfig = () => {
  return useQuery({
    queryKey: ['algoliaConfig'],
    queryFn: () => apiClient.get<AlgoliaConfigResponse>(API_ENDPOINTS.algoliaConfig()),
    staleTime: Infinity,
  });
};

export const useSearchSuggestions = (query: string, limit?: number) => {
  return useQuery({
    queryKey: ['searchSuggestions', query, limit],
    queryFn: () => apiClient.get<QuerySuggestionsResponse>(API_ENDPOINTS.searchSuggestions(query, limit)),
    enabled: query.length > 1,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
};

// Get best deals
export const useBestDeals = (chainIds?: number[]) => {
  const { selectedCityId } = useCity();
  return useQuery({
    queryKey: ['bestDeals', selectedCityId, chainIds],
    queryFn: () => apiClient.get<BestDealsResponse>(API_ENDPOINTS.bestDeals(selectedCityId, chainIds)),
  });
};

export const useInfiniteBestDeals = (chainIds?: number[]) => {
  const { selectedCityId } = useCity();
  return useInfiniteQuery({
    queryKey: ['bestDeals-infinite', selectedCityId, chainIds],
    queryFn: async ({ pageParam = 1 }) => {
      return apiClient.get<BestDealsResponse>(
        API_ENDPOINTS.bestDeals(selectedCityId, chainIds, pageParam)
      );
    },
    getNextPageParam: (lastPage) => {
      if (lastPage.page && lastPage.total_pages && lastPage.page < lastPage.total_pages) {
        return lastPage.page + 1;
      }
      return undefined;
    },
    initialPageParam: 1,
    enabled: !!selectedCityId,
  });
};

// Get discounts
export const useDiscounts = (chainIds?: number[], page?: number) => {
  const { selectedCityId } = useCity();
  return useQuery({
    queryKey: ['discounts', selectedCityId, chainIds, page],
    queryFn: () => apiClient.get<DiscountsResponse>(API_ENDPOINTS.discounts(selectedCityId, chainIds, page)),
  });
};

// Get price drops
export const usePriceDrops = () => {
  const { selectedCityId } = useCity();
  return useQuery({
    queryKey: ['priceDrops', selectedCityId],
    queryFn: () => apiClient.get<PriceDropsResponse>(API_ENDPOINTS.priceDrops(selectedCityId)),
  });
};

// Get price increases
export const usePriceIncreases = () => {
  const { selectedCityId } = useCity();
  return useQuery({
    queryKey: ['priceIncreases', selectedCityId],
    queryFn: () => apiClient.get<PriceIncreasesResponse>(API_ENDPOINTS.priceIncreases(selectedCityId)),
  });
};

// Get product by UUID
export const useProduct = (uuid: string) => {
  const { selectedCityId } = useCity();
  return useQuery({
    queryKey: ['product', uuid, selectedCityId],
    queryFn: () => apiClient.get<Product>(API_ENDPOINTS.product(uuid, selectedCityId)),
    enabled: !!uuid,
    retry: false,
  });
};

// Get price history for a product
export const usePriceHistory = (uuid: string) => {
  const { selectedCityId } = useCity();
  return useQuery({
    queryKey: ['priceHistory', uuid, selectedCityId],
    queryFn: () => apiClient.get<PriceHistoryResponse>(API_ENDPOINTS.priceHistory(uuid, selectedCityId)),
    enabled: !!uuid,
  });
};

// Get cities
export const useCities = () => {
  return useQuery({
    queryKey: ['cities'],
    queryFn: () => apiClient.get<CitiesResponse>(API_ENDPOINTS.cities()),
  });
};

// Get chains (store networks)
export const useChains = () => {
  return useQuery({
    queryKey: ['chains'],
    queryFn: () => apiClient.get<ChainsResponse>(API_ENDPOINTS.chains()),
  });
};

export const useHomepageStats = () => {
  return useQuery({
    queryKey: ['homepage-stats'],
    queryFn: () => apiClient.get<HomepageStatsResponse>(API_ENDPOINTS.homepageStats()),
    staleTime: 4 * 60 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
};

// Get categories
export const useCategories = () => {
  return useQuery({
    queryKey: ['categories'],
    queryFn: () => apiClient.get<CategoriesResponse>(API_ENDPOINTS.categories()),
  });
};

// Get products with filters
export const useProducts = (params?: {
  canonical_category?: number;
  ordering?: string;
  limit?: number;
  page?: number;
}) => {
  const { selectedCityId } = useCity();
  return useQuery({
    queryKey: ['products', params?.canonical_category, params?.ordering, params?.page, selectedCityId],
    queryFn: () => apiClient.get<ProductsResponse>(
      API_ENDPOINTS.products({ ...params, city_id: selectedCityId })
    ),
    placeholderData: keepPreviousData,
    enabled: !!selectedCityId,
  });
};

// Get infinite products with cursor/page parameters
export const useInfiniteProducts = (params?: {
  canonical_category?: number;
  ordering?: string;
  limit?: number;
}) => {
  const { selectedCityId } = useCity();

  return useInfiniteQuery({
    queryKey: ['products-infinite', params?.canonical_category, params?.ordering, selectedCityId],
    queryFn: async ({ pageParam = 1 }) => {
      return apiClient.get<ProductsResponse>(
        API_ENDPOINTS.products({ ...params, page: pageParam, city_id: selectedCityId })
      );
    },
    getNextPageParam: (lastPage, allPages) => {
      // If there's a 'next' property in the pagination result, increase page
      if (lastPage.next) {
        return allPages.length + 1;
      }
      return undefined;
    },
    initialPageParam: 1,
    enabled: !!selectedCityId,
  });
};
