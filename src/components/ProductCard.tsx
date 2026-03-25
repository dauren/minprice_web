import { Link } from "react-router-dom";
import { Plus, Minus } from "lucide-react";
import { Product } from "@/data/mockProducts";
import { useCart } from "@/context/CartContext";
import StoreLogo from "@/components/StoreLogo";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

const MAX_STORES_DISPLAY = 3; // ensure consistent height

const ProductCard = ({ product }: { product: Product }) => {
  const { items, addItem, updateQuantity, removeItem } = useCart();
  const { toast } = useToast();

  if (!product.stores || product.stores.length === 0) return null;

  const inStockStores = product.stores.filter(s => s.inStock !== false);
  const candidateStores = inStockStores.length > 0 ? inStockStores : product.stores;
  const bestStore = candidateStores.reduce((a, b) => (a.price < b.price ? a : b));
  // The 'worstPrice' (reference price) aligns with the robust robust calculation done in transformers.
  const worstPrice = bestStore.price + (product.savingsAmount || 0);
  const [justAdded, setJustAdded] = useState(false);

  const cartItem = items.find((i) => i.product.uuid === product.id);
  const quantity = cartItem?.quantity || 0;

  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addItem(product.id, 1);
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 600);
    toast({
      title: "Добавлено в корзину",
      description: product.name,
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
      className="group flex flex-col rounded-xl transition-all duration-200 overflow-hidden h-full"
    >
      {/* Image */}
      <div className="relative p-3 pb-0">
        <div className="absolute top-2 left-2 z-10 flex gap-1">
          {product.discountPercent > 0 && (
            <span className="discount-badge">-{product.discountPercent}%</span>
          )}
          {product.savingsAmount > 0 && (
            <span className="savings-badge">-{product.savingsAmount} ₸</span>
          )}
        </div>
        <div className="aspect-square rounded-lg bg-secondary/50 overflow-hidden">
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
        </div>
      </div>

      {/* Price + Name */}
      <div className="px-3 pt-2.5 pb-1.5">
        <div className="flex items-baseline gap-1.5 mb-1">
          <span className="price-new">{bestStore.price} ₸</span>
          {worstPrice > bestStore.price && (
            <span className="price-old">{worstPrice} ₸</span>
          )}
        </div>
        <h3 className="text-[13px] text-foreground leading-snug line-clamp-2 min-h-[2.25rem]">
          {product.name}
        </h3>

      </div>

      {/* Store prices - fixed height */}
      <div className="px-3 py-1.5 border-t border-border flex-1">
        <div className="space-y-1">
          {displayStores.map((store, i) => {
            const isBest = store.price === bestStore.price && store.inStock !== false;
            return (
              <div key={`${store.store}-${i}`} className={`flex items-center justify-between text-[11px] h-[18px] ${store.inStock === false ? "opacity-60 grayscale" : ""}`}>
                <div className="flex items-center gap-1.5 min-w-0">
                  <StoreLogo store={store.store} size="sm" logoUrl={store.storeImage} />
                  <span className="text-muted-foreground truncate">{store.store}</span>
                  {isBest && product.stores.length > 1 && (
                    <span className="best-price-label">min</span>
                  )}
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {store.oldPrice && (
                    <span className="line-through text-muted-foreground/60">
                      {store.oldPrice}
                    </span>
                  )}
                  <span className={`font-medium ${isBest ? "text-foreground" : "text-muted-foreground"} ${store.inStock === false ? "line-through" : ""}`}>
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
      <div className="px-3 pb-3 pt-1.5 mt-auto">
        {quantity === 0 ? (
          <button
            onClick={handleAdd}
            className={`w-full h-9 rounded-xl border border-primary text-primary text-xs font-medium flex items-center justify-center gap-1.5 hover:bg-primary/5 active:scale-[0.96] transition-all duration-200 ${justAdded ? "animate-cart-pop bg-primary text-primary-foreground border-primary" : ""
              }`}
          >
            <Plus className="w-3.5 h-3.5" />
            Добавить
          </button>
        ) : (
          <div className="flex items-center h-9 rounded-xl bg-primary overflow-hidden transition-all duration-200 animate-scale-in">
            <button
              onClick={handleDecrement}
              className="h-full px-3 flex items-center justify-center text-primary-foreground hover:bg-primary-foreground/10 active:scale-90 transition-all"
            >
              <Minus className="w-4 h-4" />
            </button>
            <span className="flex-1 text-center text-sm font-semibold text-primary-foreground">
              {quantity}
            </span>
            <button
              onClick={handleIncrement}
              className="h-full px-3 flex items-center justify-center text-primary-foreground hover:bg-primary-foreground/10 active:scale-90 transition-all"
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
