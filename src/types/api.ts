// API Response Types based on minprice.xyz API

export interface Chain {
  id: number;
  name: string;
  slug: string;
  source: string;
  logo: string;
}

export interface ChainsResponse {
  chains: Chain[];
}

export interface Store {
  id: number;
  name: string;
  slug: string;
  source: string;
}

export interface ExtProduct {
  id: number;
  ext_id: string;
  chain: Chain;
  store: Store;
  title: string;
  price: number;
  currency: string;
  in_stock: boolean;
  url: string;
  measure_unit: string;
  measure_unit_kind: string;
  measure_unit_qty: string;
  pack_count: number;
  barcodes: string[];
}

export interface StorePrice {
  store_id?: number;
  store_name: string;
  store_slug?: string;
  store_source: string;
  chain_id: number;
  chain_name: string;
  chain_slug?: string;
  chain_logo: string | null;
  city_id?: number;
  city_name?: string;
  city_slug?: string;
  price: number;
  previous_price: number | null;
  discount_amount?: number;
  currency: string;
  price_per_unit?: number;
  in_stock: boolean;
  updated_at?: string | null;
  url: string;
  ext_product_id: number;
  ext_product_title: string;
  ext_product_brand_canonical: string | null;
  ext_product_image: string | null;
  ext_product_url?: string;
  ext_product_measure_unit: string;
  ext_product_measure_unit_kind: string;
  ext_product_measure_unit_qty: number;
  ext_product_pack_count: number;
  similarity_coef: number;
  ai_coef: number | null;
}

export interface PriceRange {
  min: number;
  max: number;
  avg: number;
  old?: number;
  savings: number;
  savings_percent: number;
  stores: StorePrice[];
}

export interface ProductLink {
  id: number;
  ext_product: ExtProduct;
  similarity_coef: number;
  ai_coef: number | null;
  manually_approved: boolean;
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: number;
  uuid: string;
  title: string;
  description?: string;
  brand?: string;
  brand_canonical?: string | null;
  barcodes?: string[];
  producing_country?: string;
  image_url: string;
  additional_images?: string[];
  measure_unit: string;
  measure_unit_kind?: string;
  measure_unit_qty?: string;
  pack_count?: number;
  categories: string[];
  is_age_restricted?: boolean;
  is_active: boolean;
  linked_stores_count?: number;
  min_price?: number;
  max_price?: number;
  old_price?: number;
  savings?: number;
  savings_percent?: number;
  stores?: StorePrice[];
  product_links?: ProductLink[];
  price_range?: PriceRange;
  anomalies?: any[];
  title_manually_edited_at?: string | null;
  title_unified_at?: string | null;
  created_at?: string;
  updated_at?: string;
  __position?: number;
}

export interface Deal {
  id: number;
  uuid: string;
  title: string;
  brand: string | null;
  brand_canonical: string | null;
  producing_country: string;
  image_url: string;
  measure_unit: string;
  measure_unit_kind: string;
  measure_unit_qty: string;
  pack_count: number;
  categories: string[];
  is_active: boolean;
  linked_stores_count: number;
  min_price: number;
  max_price: number;
  old_price?: number;
  savings: number;
  savings_percent: number;
  stores: StorePrice[];
  anomalies: any[];
}

export interface BestDealsResponse {
  deals: Deal[];
  total?: number;
  page?: number;
  page_size?: number;
  total_pages?: number;
}

export interface DiscountsResponse {
  results: Product[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface PriceDropsResponse {
  price_drops: Deal[];
}

export interface PriceIncreasesResponse {
  price_increases: Deal[];
}

export interface SearchResponse {
  hits: Product[];
  nbHits: number;
  page: number;
  nbPages: number;
  hitsPerPage: number;
  query: string;
  queryID?: string;
  suggested_query?: string;
  fallback?: string;
}

export interface AlgoliaConfigResponse {
  app_id: string;
  search_api_key: string;
  index_name: string;
}

export interface QuerySuggestion {
  query: string;
  objectID?: string;
}

export interface QuerySuggestionsResponse {
  queryID?: string;
  suggestions: QuerySuggestion[];
}

export interface City {
  id: number;
  name: string;
  slug: string;
}

export interface CitiesResponse {
  cities: City[];
}

export interface PriceHistoryStore {
  store_id: number;
  store_name: string;
  chain_source: string;
  prices: {
    date: string;
    datetime: string;
    price: number;
    in_stock: boolean;
  }[];
}

export interface PriceHistoryResponse {
  product_uuid: string;
  product_title: string;
  days: number;
  stores: PriceHistoryStore[];
}

export interface SimilarProductsResponse {
  product_uuid: string;
  results: Product[];
}

export interface Category {
  id: number;
  name: string;
  emoji: string | null;
  level: number;
  priority: number;
  children?: Category[];
}

export interface CategoriesResponse {
  categories: Category[];
}

export interface HomepageStatsResponse {
  product_count: number;
  price_count: number;
  avg_savings_pct: number | null;
}

export interface ProductsResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Product[];
}
