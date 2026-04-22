import type { Product as MockProduct, StorePrice as MockStorePrice } from '@/data/mockProducts';
import type { Product as ApiProduct, Deal, StorePrice as ApiStorePrice } from '@/types/api';

// Helper to get store logo color based on chain name
const getStoreColor = (chainName: string): string => {
  const colorMap: Record<string, string> = {
    'MGO': '#22c55e',
    'Airba Fresh': '#3b82f6',
    'A-Store ADK': '#f59e0b',
    'Arbuz': '#ef4444',
    'Small': '#a855f7',
  };
  return colorMap[chainName] || '#6b7280';
};

// Transform API store price to mock format
export const transformStorePrice = (apiStore: ApiStorePrice): MockStorePrice => {
  // Construct full logo URL
  let logoUrl = apiStore.chain_logo;
  if (!logoUrl.startsWith('http')) {
    // Add /media/ prefix if not already present
    const path = logoUrl.startsWith('/') ? logoUrl : `/${logoUrl}`;
    logoUrl = path.startsWith('/media/') ? `https://backend.minprice.kz${path}` : `https://backend.minprice.kz/media${path}`;
  }

  // Construct full ext_product image URL
  let extProductImageUrl = apiStore.ext_product_image;
  if (extProductImageUrl && !extProductImageUrl.startsWith('http')) {
    const imgPath = extProductImageUrl.startsWith('/') ? extProductImageUrl : `/${extProductImageUrl}`;
    extProductImageUrl = imgPath.startsWith('/media/') ? `https://backend.minprice.kz${imgPath}` : `https://backend.minprice.kz/media${imgPath}`;
  }

  return {
    store: apiStore.chain_name,
    storeSlug: apiStore.chain_slug,
    storeSource: apiStore.store_source,
    price: apiStore.price,
    oldPrice: apiStore.previous_price || undefined,
    color: getStoreColor(apiStore.chain_name),
    storeName: apiStore.store_name,
    storeImage: logoUrl,
    storeUrl: apiStore.url,
    extProductTitle: apiStore.ext_product_title,
    extProductImage: extProductImageUrl,
    inStock: apiStore.in_stock !== undefined ? apiStore.in_stock : true,
  };
};

// Calculate discount percentage
const calculateDiscountPercent = (currentPrice: number, oldPrice: number): number => {
  if (!oldPrice || oldPrice <= currentPrice) return 0;
  return Math.round(((oldPrice - currentPrice) / oldPrice) * 100);
};

// Transform API Product to Mock Product
export const transformProduct = (apiProduct: ApiProduct | Deal): MockProduct => {
  // Product detail endpoint returns stores in price_range.stores
  // Other endpoints (deals, discounts) return stores directly
  const apiStores = 'price_range' in apiProduct && apiProduct.price_range?.stores
    ? apiProduct.price_range.stores
    : apiProduct.stores || [];

  const stores = apiStores.map(transformStorePrice).sort((a, b) => {
    if (a.inStock === b.inStock) {
      return a.price - b.price;
    }
    return a.inStock ? -1 : 1;
  });

  // Calculate minimum price
  const minPrice = ('price_range' in apiProduct && apiProduct.price_range?.min)
    ? apiProduct.price_range.min
    : apiProduct.min_price || (stores.length > 0 ? Math.min(...stores.map(s => s.price)) : 0);

  // Determine an intelligent reference (max) price to highlight savings
  let maxPrice = minPrice;

  if (stores.length === 1) {
    // If only 1 store, rely on its own discount
    maxPrice = stores[0].oldPrice || stores[0].price;
  } else if (stores.length === 2) {
    // If 2 stores, simply compare max to min
    maxPrice = Math.max(...stores.map(s => s.oldPrice || s.price));
  } else if (stores.length > 2) {
    // Use max price across all stores to show full savings range
    maxPrice = Math.max(...stores.map(s => s.oldPrice || s.price));
  } else {
    // Fallback if no stores array is available
    maxPrice = ('price_range' in apiProduct && apiProduct.price_range?.max)
      ? apiProduct.price_range.max
      : apiProduct.max_price || minPrice;
  }

  // Ensure maxPrice is not less than minPrice due to some odd data
  if (maxPrice < minPrice) {
    maxPrice = minPrice;
  }

  const discountPercent = calculateDiscountPercent(minPrice, maxPrice);
  const savingsAmount = Math.round(maxPrice - minPrice);

  // Handle measure_unit_qty which can be string or number
  const measureQty = apiProduct.measure_unit_qty
    ? (typeof apiProduct.measure_unit_qty === 'string'
      ? parseFloat(apiProduct.measure_unit_qty)
      : apiProduct.measure_unit_qty)
    : '';
  const measureKind = apiProduct.measure_unit_kind || apiProduct.measure_unit || '';
  const weight = measureQty ? `${measureQty}${measureKind}` : measureKind;

  return {
    id: apiProduct.uuid,
    name: apiProduct.title,
    description: 'description' in apiProduct ? apiProduct.description : undefined,
    image: apiProduct.image_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=400&fit=crop',
    weight,
    discountPercent,
    savingsAmount,
    stores,
    category: apiProduct.categories?.[0],
    brand: 'brand' in apiProduct ? apiProduct.brand || undefined : undefined,
    country: 'producing_country' in apiProduct ? apiProduct.producing_country : undefined,
    breadcrumbs: apiProduct.categories,
    additionalImages: 'additional_images' in apiProduct ? apiProduct.additional_images : undefined,
  };
};

// Transform array of products
export const transformProducts = (apiProducts: (ApiProduct | Deal)[]): MockProduct[] => {
  return apiProducts.map(transformProduct);
};
