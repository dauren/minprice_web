import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { apiClient, API_ENDPOINTS } from "@/lib/api";
import { useCity } from "@/context/CityContext";
import { t } from "@/lib/i18n";

// ExtProduct properties mapped from backend API responses
export interface CartItemProduct {
  id: number;
  uuid: string;
  title: string;
  brand: string | null;
  image_url: string | null;
  measure_unit_kind?: string;
  measure_unit_qty?: string;
  stores?: {
    store_id: number;
    store_name: string;
    chain_name: string;
    chain_logo: string | null;
    price: number;
  }[];
}

export interface CartItem {
  product: CartItemProduct;
  store_id: number;
  store_name: string;
  chain_name?: string;
  chain_logo?: string | null;
  chain_source?: string;
  price: number;
  item_total: number;
  quantity: number;
  currency?: string;
  url?: string;
  ext_product_id?: number;
  ext_product_ext_id?: string;
  ext_product_title?: string;
  ext_product_image?: string | null;
}

export interface UnavailableProduct {
  product: CartItemProduct;
  quantity: number;
  reason: string;
}

export interface AvailableStore {
  store_id: number;
  store_name: string;
  chain_id: number;
  chain_name: string;
  chain_logo: string | null;
}

export interface SingleStoreProduct {
  product: CartItemProduct;
  quantity: number;
  price: number;
  item_total: number;
  currency?: string;
  url?: string;
  ext_product_id?: number;
  ext_product_ext_id?: string;
  ext_product_title?: string;
  ext_product_image?: string | null;
}

export interface SingleStoreTotal {
  store_id: number;
  store_name: string;
  chain_name: string;
  chain_source?: string;
  chain_logo: string | null;
  total_price: number;
  available_count: number;
  total_count: number;
  products: SingleStoreProduct[];
}

interface CartContextType {
  cartUuid: string | null;
  cartName: string;
  items: CartItem[];
  unavailableProducts: UnavailableProduct[];
  singleStoreTotals: SingleStoreTotal[];
  totalItems: number;
  totalPrice: number;
  isOwner: boolean;
  isLoading: boolean;
  selectedChainIds: number[];
  availableStores: AvailableStore[];

  // Actions
  fetchCart: () => Promise<void>;
  addItem: (productId: string, quantity?: number) => Promise<void>;
  removeItem: (productId: string) => Promise<void>;
  updateQuantity: (productId: string, quantity: number) => Promise<void>;
  clearCart: () => void;
  renameCart: (newName: string) => Promise<void>;
  archiveCart: () => Promise<void>;
  deleteCart: (uuid: string) => Promise<void>;
  updateStorePreferences: (chainIds: number[]) => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const { selectedCityId } = useCity();
  const [cartUuid, setCartUuid] = useState<string | null>(null);
  const [cartName, setCartName] = useState<string>(t.cart.defaultName);
  const [items, setItems] = useState<CartItem[]>([]);
  const [unavailableProducts, setUnavailableProducts] = useState<UnavailableProduct[]>([]);
  const [totalItems, setTotalItems] = useState<number>(0);
  const [totalPrice, setTotalPrice] = useState<number>(0);
  const [isOwner, setIsOwner] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedChainIds, setSelectedChainIds] = useState<number[]>([]);
  const [availableStores, setAvailableStores] = useState<AvailableStore[]>([]);
  const [singleStoreTotals, setSingleStoreTotals] = useState<SingleStoreTotal[]>([]);

  const fetchCartSummary = async (uuid: string) => {
    try {
      const data = await apiClient.get<any>(API_ENDPOINTS.cartSummary(uuid, selectedCityId));

      setCartName(data.cart.name);
      setIsOwner(data.cart.is_owner !== false);
      setTotalItems(data.total_items || 0);
      setTotalPrice(data.cheapest_total_price || 0);

      if (data.cheapest_per_product) {
        setItems(data.cheapest_per_product);
      } else {
        setItems([]);
      }

      if (data.unavailable_products) {
        setUnavailableProducts(data.unavailable_products);
      } else {
        setUnavailableProducts([]);
      }

      if (data.all_stores && Array.isArray(data.all_stores)) {
        setAvailableStores(data.all_stores);
      }

      if (data.single_store_totals && Array.isArray(data.single_store_totals)) {
        setSingleStoreTotals(data.single_store_totals);
      } else {
        setSingleStoreTotals([]);
      }
    } catch (error) {
      console.error("Failed to fetch cart summary:", error);
    }
  };

  const fetchPreferences = async () => {
    try {
      const pref = await apiClient.get<any>(API_ENDPOINTS.storePreferences());
      if (pref && pref.chain_ids) {
        setSelectedChainIds(pref.chain_ids);
      }
    } catch (e) {
      console.error("Failed to fetch preferences:", e);
    }
  };

  const fetchCart = async () => {
    setIsLoading(true);
    try {
      await fetchPreferences();
      const response = await apiClient.get<any>(`${API_ENDPOINTS.carts()}?is_active=true`);
      if (response && response.results && response.results.length > 0) {
        const activeCart = response.results[0];
        setCartUuid(activeCart.uuid);
        await fetchCartSummary(activeCart.uuid);
      } else {
        setCartUuid(null);
        setItems([]);
        setUnavailableProducts([]);
        setSingleStoreTotals([]);
        setTotalItems(0);
        setTotalPrice(0);
      }
    } catch (error) {
      console.error("Failed to fetch active cart:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCart();
  }, []);

  useEffect(() => {
    if (cartUuid) {
      fetchCartSummary(cartUuid);
    }
  }, [selectedCityId]);

  const addItem = async (productId: string, quantity: number = 1) => {
    try {
      if (cartUuid) {
        await apiClient.post(API_ENDPOINTS.cartAddItem(cartUuid), {
          product_uuid: productId,
          quantity
        });
        await fetchCartSummary(cartUuid);
      } else {
        const res = await apiClient.post<any>(API_ENDPOINTS.quickAdd(), {
          product_uuid: productId,
          quantity
        });
        setCartUuid(res.cart_uuid);
        await fetchCartSummary(res.cart_uuid);
      }
    } catch (error) {
      console.error("Failed to add item:", error);
    }
  };

  const removeItem = async (productId: string) => {
    if (!cartUuid) return;
    // Optimistic update: remove the item from UI immediately
    setItems(prev => prev.filter(i => i.product.uuid !== productId));
    setUnavailableProducts(prev => prev.filter(i => i.product.uuid !== productId));
    try {
      await apiClient.post(API_ENDPOINTS.cartRemoveItem(cartUuid), {
        product_uuid: productId
      });
      // Fetch fresh data to get updated totals
      await fetchCartSummary(cartUuid);
    } catch (error) {
      console.error("Failed to remove item:", error);
      // Revert on error by refetching
      await fetchCartSummary(cartUuid);
    }
  };

  const updateQuantity = async (productId: string, quantity: number) => {
    if (!cartUuid) return;
    if (quantity <= 0) {
      await removeItem(productId);
      return;
    }
    // Optimistic update: update quantity in UI immediately
    setItems(prev => prev.map(i =>
      i.product.uuid === productId
        ? { ...i, quantity, item_total: i.price * quantity }
        : i
    ));
    try {
      await apiClient.patch(API_ENDPOINTS.cartUpdateQuantity(cartUuid), {
        product_uuid: productId,
        quantity
      });
      await fetchCartSummary(cartUuid);
    } catch (error) {
      console.error("Failed to update quantity:", error);
      await fetchCartSummary(cartUuid);
    }
  };

  const clearCart = async () => {
    if (cartUuid) {
      await archiveCart();
    }
  };

  const renameCart = async (newName: string) => {
    if (!cartUuid) return;
    try {
      await apiClient.patch(API_ENDPOINTS.cartRename(cartUuid), { name: newName });
      setCartName(newName);
    } catch (error) {
      console.error("Failed to rename cart:", error);
    }
  };

  const archiveCart = async () => {
    if (!cartUuid) return;
    try {
      await apiClient.post(API_ENDPOINTS.cartArchive(cartUuid));
      await fetchCart();
    } catch (error) {
      console.error("Failed to archive cart:", error);
    }
  };

  const deleteCart = async (uuid: string) => {
    try {
      await apiClient.delete(API_ENDPOINTS.cart(uuid));
      // If the deleted cart was the active one, refetch
      if (uuid === cartUuid) {
        await fetchCart();
      }
    } catch (error) {
      console.error("Failed to delete cart:", error);
    }
  };

  const updateStorePreferences = async (chainIds: number[]) => {
    try {
      await apiClient.patch(API_ENDPOINTS.storePreferences(), { chain_ids: chainIds });
      setSelectedChainIds(chainIds);
      if (cartUuid) {
        await fetchCartSummary(cartUuid);
      }
    } catch (error) {
      console.error("Failed to update store preferences:", error);
    }
  }

  return (
    <CartContext.Provider
      value={{
        cartUuid, cartName, items, unavailableProducts, singleStoreTotals, totalItems, totalPrice, isOwner, isLoading, selectedChainIds, availableStores,
        fetchCart, addItem, removeItem, updateQuantity, clearCart, renameCart, archiveCart, deleteCart, updateStorePreferences
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
};
