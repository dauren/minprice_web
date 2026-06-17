import { Link } from "react-router-dom";
import { Plus, Minus, ImageOff, Heart } from "lucide-react";
import { Product } from "@/data/mockProducts";
import { useCart } from "@/context/CartContext";
import { useFavorites } from "@/context/FavoritesContext";
import { useCashback } from "@/context/CashbackContext";
import StoreLogo from "@/components/StoreLogo";
import { useState, useLayoutEffect, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { t } from "@/lib/i18n";

const MAX_STORES_DISPLAY = 3; // ensure consistent height

const SmartTitle = ({ title }: { title: string }) => {
  const containerRef = useRef<HTMLHeadingElement>(null);

  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Reset purely to measure the full original text
    container.textContent = title;

    if (container.scrollHeight <= container.clientHeight) {
      return; 
    }

    const words = title.trim().split(/\s+/);
    if (words.length <= 2) {
       container.textContent = title;
       return;
    }
    
    const lastWord = words[words.length - 1];
    const secondLast = words[words.length - 2];
    let tailCount = 1;
    if (/^[\d.,]+$/.test(secondLast) || (lastWord.length <= 5 && secondLast.length <= 8)) {
      tailCount = 2;
    }
    const tailStr = words.slice(-tailCount).join(' ');
    const headWords = words.slice(0, -tailCount);

    let low = 1;
    let high = headWords.length;
    let bestFitText = `${headWords[0]}... ${tailStr}`;

    // Binary search over words to find the max amount that fits the exact CSS layout
    while (low <= high) {
      const mid = Math.floor((low + high) / 2);
      const testText = `${headWords.slice(0, mid).join(' ')}... ${tailStr}`;
      
      container.textContent = testText;
      
      // Allow minor sub-pixel rendering leeway if needed, but strict <= works mostly
      if (container.scrollHeight <= container.clientHeight) {
        bestFitText = testText;
        low = mid + 1;
      } else {
        high = mid - 1;
      }
    }
    
    container.textContent = bestFitText;
  }, [title]);

  return (
    <h3 
      ref={containerRef} 
      className="max-h-[2.5rem] min-h-[2.5rem] overflow-hidden break-words text-sm font-medium leading-snug text-black"
      title={title}
    >
      {title}
    </h3>
  );
};

const ProductCard = ({ product }: { product: Product }) => {
  const { items, addItem, updateQuantity, removeItem } = useCart();
  const { isFavorite, toggleFavorite } = useFavorites();
  const { applyEnabled, getPercent, effectivePrice } = useCashback();
  const { toast } = useToast();
  const [justAdded, setJustAdded] = useState(false);
  const [imgError, setImgError] = useState(false);
  const favorited = isFavorite(product.id);

  const handleToggleFavorite = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleFavorite(product.id);
  };

  if (!product.stores || product.stores.length === 0) return null;

  const inStockStores = product.stores.filter(s => s.inStock !== false);
  const candidateStores = inStockStores.length > 0 ? inStockStores : product.stores;
  // When cashback display is on, rank the best store by effective (post-cashback) price.
  const priceKey = (s: typeof candidateStores[number]) =>
    applyEnabled ? effectivePrice(s.price, s.chainId) : s.price;
  const bestStore = candidateStores.reduce((a, b) => (priceKey(a) < priceKey(b) ? a : b));
  const bestPct = getPercent(bestStore.chainId);
  const bestEff = Math.round(effectivePrice(bestStore.price, bestStore.chainId));
  // The 'worstPrice' (reference price) aligns with the robust robust calculation done in transformers.
  const worstPrice = bestStore.price + (product.savingsAmount || 0);

  const cartItem = items.find((i) => i.product.uuid === product.id);
  const quantity = cartItem?.quantity || 0;

  const handleProductClick = () => {
    import('@/lib/algoliaInsights').then(({ sendProductClickEvent }) => {
      if (product.queryID && product.__position !== undefined) {
        sendProductClickEvent('Product Clicked', product.queryID, [product.id], [product.__position]);
      }
    });
  };

  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addItem(product.id, 1);
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 600);
    toast({
      title: import.meta.env.VITE_SITE_LANG === "kk" ? "Себетке қосылды" : "Добавлено в корзину",
      description: product.name,
    });
    import('@/lib/algoliaInsights').then(({ sendProductAddToCartEvent }) => {
      sendProductAddToCartEvent('Product Added to Cart', product.queryID, [product.id], bestStore.price, 1);
    });
  };

  const handleIncrement = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (cartItem) {
      updateQuantity(cartItem.product.uuid, cartItem.quantity + 1);
    }
  };

  const handleDecrement = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (cartItem) {
      if (cartItem.quantity <= 1) {
        removeItem(cartItem.product.uuid);
      } else {
        updateQuantity(cartItem.product.uuid, cartItem.quantity - 1);
      }
    }
  };

  // Pad stores to consistent height
  const displayStores = product.stores.slice(0, MAX_STORES_DISPLAY);
  const emptySlots = MAX_STORES_DISPLAY - displayStores.length;

  return (
    <Link
      to={`/product/${product.id}`}
      onClick={handleProductClick}
      className="group flex h-full flex-col overflow-hidden bg-white text-black transition-opacity hover:opacity-80"
    >
      <div className="relative bg-white">
        <div className="absolute top-2 left-2 z-10 flex gap-1">
          {product.discountPercent > 0 && (
            <span className="bg-[#148a42] px-1.5 py-1 text-[11px] font-medium leading-none text-white">-{product.discountPercent}%</span>
          )}
        </div>
        <button
          onClick={handleToggleFavorite}
          className="absolute top-1.5 right-1.5 z-10 flex h-8 w-8 items-center justify-center rounded-full text-black/35 transition-colors hover:text-[#148a42]"
          aria-label={favorited ? "Убрать из избранного" : "В избранное"}
          aria-pressed={favorited}
        >
          <Heart className={`h-5 w-5 transition-colors ${favorited ? "fill-[#148a42] text-[#148a42]" : ""}`} />
        </button>
        <div className="flex aspect-square items-center justify-center overflow-hidden bg-white p-3">
          <img
            src={product.image}
            alt={product.name}
            className={`h-full w-full object-contain transition-transform duration-200 group-hover:scale-[1.02] ${imgError ? 'hidden' : ''}`}
            loading="lazy"
            onError={() => setImgError(true)}
          />
          {imgError && <ImageOff className="h-10 w-10 text-muted-foreground/20" />}
        </div>
      </div>

      <div className="px-3 pb-2 pt-2">
        <div className="flex min-h-8 flex-wrap items-baseline gap-x-2 gap-y-1">
          <span className="text-xl font-semibold leading-none tracking-normal text-[#148a42]">
            {applyEnabled && bestPct > 0 ? bestEff : bestStore.price} ₸
          </span>
          {applyEnabled && bestPct > 0 ? (
            <span className="text-sm font-normal text-black/35 line-through">{bestStore.price} ₸</span>
          ) : worstPrice > bestStore.price && (
            <span className="text-sm font-normal text-black/35 line-through">{worstPrice} ₸</span>
          )}
          {!applyEnabled && bestPct > 0 && (
            <span className="text-xs font-medium text-[#148a42]">кэшбэк {bestPct}%</span>
          )}
        </div>
        <SmartTitle title={product.name} />
      </div>

      <div className="mx-3 mt-auto py-2 text-black">
        <div className="space-y-1">
          {displayStores.map((store, i) => {
            // Compare on the same key used to pick bestStore, so ties still all
            // highlight (as before) and the highlight follows any cashback ranking.
            const isBest = store.inStock !== false && priceKey(store) === priceKey(bestStore);
            return (
              <div key={`${store.store}-${i}`} className={`flex h-[20px] items-center justify-between text-[11px] ${store.inStock === false ? "opacity-60 grayscale" : ""}`}>
                <div className="flex items-center gap-1.5 min-w-0">
                  <StoreLogo store={store.store} size="sm" logoUrl={store.storeImage} />
                  <span className={`${isBest ? "text-black" : "text-black/45"} truncate font-medium`}>{store.store}</span>
                  {isBest && product.stores.length > 1 && (
                    <span className="best-price-label">min</span>
                  )}
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {store.oldPrice && store.inStock !== false && (
                    <span className="line-through text-muted-foreground/60">
                      {store.oldPrice}
                    </span>
                  )}
                  <span className={`font-medium ${isBest ? "text-black" : "text-black/45"} ${store.inStock === false ? "line-through" : ""}`}>
                    {store.price} ₸
                  </span>
                </div>
              </div>
            );
          })}
          {/* Empty slots to maintain consistent height */}
          {Array.from({ length: emptySlots }).map((_, i) => (
            <div key={`empty-${i}`} className="h-[18px]" />
          ))}
        </div>
      </div>

      {/* Add button / quantity control - always at bottom */}
      <div className="px-3 pb-3 pt-1.5">
        {quantity === 0 ? (
          <button
            onClick={handleAdd}
            className={`flex h-9 w-full items-center justify-center gap-1.5 bg-[#148a42]/10 px-3 text-sm font-medium text-[#148a42] transition-colors hover:bg-[#148a42]/15 ${justAdded ? "bg-[#148a42]/15" : ""
              }`}
          >
            <Plus className="w-3.5 h-3.5" />
            {justAdded
              ? (import.meta.env.VITE_SITE_LANG === "kk" ? "Қосылды" : "Добавлено")
              : (import.meta.env.VITE_SITE_LANG === "kk" ? "Себетке" : "В корзину")}
          </button>
        ) : (
          <div className="flex h-9 animate-scale-in items-center justify-center gap-3 overflow-hidden bg-[#148a42]/10 text-[#148a42] transition-colors">
            <button
              onClick={handleDecrement}
              className="flex h-full items-center justify-center px-2 text-[#148a42]/70 transition-colors hover:text-[#148a42]"
            >
              <Minus className="w-4 h-4" />
            </button>
            <span className="flex-1 text-center text-sm font-semibold text-[#148a42]">
              {quantity}
            </span>
            <button
              onClick={handleIncrement}
              className="flex h-full items-center justify-center px-2 text-[#148a42]/70 transition-colors hover:text-[#148a42]"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </Link>
  );
};

export default ProductCard;
