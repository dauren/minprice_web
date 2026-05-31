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

// Transform API Product to Mock Product
export const transformProduct = (apiProduct: ApiProduct | Deal, queryID?: string): MockProduct => {
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

  // Only consider in-stock stores for price calculations
  const inStockStores = stores.filter(s => s.inStock !== false);
  const priceStores = inStockStores.length > 0 ? inStockStores : stores;

  const minPrice = priceStores.length > 0
    ? Math.min(...priceStores.map(s => s.price))
    : 0;

  // Use backend-computed savings so web, mobile, and all clients agree
  const priceRange = 'price_range' in apiProduct ? apiProduct.price_range : undefined;
  const savings = priceRange?.savings ?? apiProduct.savings ?? 0;
  const savingsPercent = priceRange?.savings_percent ?? apiProduct.savings_percent ?? 0;

  const discountPercent = Math.round(savingsPercent);
  const savingsAmount = Math.round(savings);

  // Handle measure_unit_qty which can be string or number
  const measureQty = apiProduct.measure_unit_qty
    ? (typeof apiProduct.measure_unit_qty === 'string'
      ? parseFloat(apiProduct.measure_unit_qty)
      : apiProduct.measure_unit_qty)
    : '';
  const measureKind = apiProduct.measure_unit_kind || apiProduct.measure_unit || '';
  const weight = measureQty ? `${measureQty}${measureKind}` : measureKind;

  // Normalize raw unit strings to Russian labels
  const normalizeUnit = (u: string): string => {
    const map: Record<string, string> = {
      piece: 'шт', pieces: 'шт', шт: 'шт',
      g: 'г', г: 'г',
      ml: 'мл', мл: 'мл',
      kg: 'кг', кг: 'кг',
      l: 'л', л: 'л',
    };
    return map[u.toLowerCase()] ?? u;
  };

  // Compute price-per-unit fields
  const packCount = 'pack_count' in apiProduct ? (apiProduct.pack_count ?? 0) : 0;
  const rawUnit = apiProduct.measure_unit || '';
  const rawKind = apiProduct.measure_unit_kind || rawUnit;
  const normUnit = normalizeUnit(rawUnit);
  const normKind = normalizeUnit(rawKind);
  let pricePerUnit: number | undefined;
  let pricePerUnitLabel: string | undefined;

  if (packCount > 1) {
    // price per individual item in the pack — skip кг
    if (normUnit !== 'кг') {
      pricePerUnit = minPrice > 0 ? Math.round(minPrice / packCount) : undefined;
      pricePerUnitLabel = 'шт';
    }
  } else {
    const qty = apiProduct.measure_unit_qty
      ? (typeof apiProduct.measure_unit_qty === 'string'
          ? parseFloat(apiProduct.measure_unit_qty)
          : apiProduct.measure_unit_qty)
      : 0;

    if ((normKind === 'г' || normKind === 'мл') && qty > 0) {
      // per 100г / 100мл
      pricePerUnit = minPrice > 0 ? Math.round((minPrice / qty) * 100) : undefined;
      pricePerUnitLabel = `100${normKind}`;
    } else if (normKind === 'шт' && qty > 0) {
      // piece → show price per шт
      pricePerUnit = minPrice > 0 ? Math.round(minPrice / qty) : undefined;
      pricePerUnitLabel = 'шт';
    } else if (qty > 0 && qty !== 1 && normKind && normUnit !== 'кг') {
      // other units — price per 1 unit, skip кг
      pricePerUnit = minPrice > 0 ? Math.round(minPrice / qty) : undefined;
      pricePerUnitLabel = normKind;
    }
  }

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
    pricePerUnit,
    pricePerUnitLabel,
    __position: ('__position' in apiProduct) ? apiProduct.__position : undefined,
    queryID,
  };
};

// Transform array of products
export const transformProducts = (apiProducts: (ApiProduct | Deal)[], queryID?: string): MockProduct[] => {
  return apiProducts.map(p => transformProduct(p, queryID));
};
