import { useState, useMemo, useRef } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Share2, Tag, Globe, ExternalLink, Copy, Check, ChevronDown, ChevronUp, TrendingUp, TrendingDown, Download, ChevronLeft, ChevronRight, ImageOff, Gift, X } from "lucide-react";
import html2canvas from "html2canvas";
import StoreLogo from "@/components/StoreLogo";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";
import Header from "@/components/Header";
import PageMeta from "@/components/PageMeta";
import { useCart } from "@/context/CartContext";
import { useCity } from "@/context/CityContext";
import { useProduct, usePriceHistory, useSimilarProducts } from "@/hooks/useApi";
import { transformProduct, transformProducts } from "@/lib/transformers";
import ProductCard from "@/components/ProductCard";

const LINE_COLORS = ["#6366f1", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];

// Arbuz referral promo — shown on the product page when Arbuz has the lowest price
const ARBUZ_PROMO_CODE = "LOEIQYF6";
const FREEDOM_SUPERAPP_URL = "https://freedombank.onelink.me/WNLd/9i3xt1xw";
const ARBUZ_PROMO_DISMISS_KEY = "minprice_arbuz_promo_dismissed";

// Persist the promo dismissal in a cookie so it stays hidden across visits
const isArbuzPromoDismissed = (): boolean =>
  typeof document !== "undefined" && document.cookie.includes(`${ARBUZ_PROMO_DISMISS_KEY}=1`);

const dismissArbuzPromo = () => {
  const date = new Date();
  date.setTime(date.getTime() + 365 * 24 * 60 * 60 * 1000); // 1 year
  document.cookie = `${ARBUZ_PROMO_DISMISS_KEY}=1;expires=${date.toUTCString()};path=/;samesite=lax`;
};

// Small hook to copy text and show a flash confirmation
const useCopy = () => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const copy = (text: string, key: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 1800);
    });
  };
  return { copiedKey, copy };
};

const ProductPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addItem, updateQuantity, removeItem, items } = useCart();
  const { selectedCityId } = useCity();
  const [expandedStore, setExpandedStore] = useState<string | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [imgError, setImgError] = useState(false);
  const [promoDismissed, setPromoDismissed] = useState(isArbuzPromoDismissed);
  const { copiedKey, copy } = useCopy();
  const chartRef = useRef<HTMLDivElement>(null);

  const { data: productData, isLoading, isError } = useProduct(id || "");
  const { data: priceHistoryData } = usePriceHistory(id || "");
  const { data: similarData } = useSimilarProducts(id || "", 8);

  const similarProducts = useMemo(() => {
    if (!similarData?.results?.length) return [];
    return transformProducts(similarData.results);
  }, [similarData]);

  const product = useMemo(() => {
    if (!productData) return null;
    return transformProduct(productData);
  }, [productData]);

  const inStockStores = product?.stores.filter(s => s.inStock !== false) || [];
  const candidateStores = inStockStores.length > 0 ? inStockStores : (product?.stores || []);
  const bestStore = candidateStores.length > 0 ? candidateStores.reduce((a, b) => (a.price < b.price ? a : b)) : null;
  const bestPrice = bestStore?.price ?? 0;
  const worstPrice = product ? Math.max(...product.stores.map((s) => s.oldPrice || s.price)) : 0;

  // Show the Arbuz referral promo only when Arbuz has the cheapest price for this product
  const isArbuzCheapest = bestStore?.storeSource === "arbuz" || bestStore?.store === "Arbuz";

  const cartItem = items.find((i) => i.product.uuid === id);
  const quantity = cartItem?.quantity || 0;

  const { chartData, chartStores, priceChangeStats } = useMemo(() => {
    if (!priceHistoryData?.stores || priceHistoryData.stores.length === 0)
      return { chartData: [], chartStores: [], priceChangeStats: null };

    const grouped: Record<string, Record<string, number>> = {};

    priceHistoryData.stores.forEach((store) => {
      store.prices.forEach((p) => {
        if (!grouped[p.date]) grouped[p.date] = {};
        grouped[p.date][store.store_name] = p.price;
      });
    });

    const entries = Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b));
    let priceChangeStats = null;

    if (entries.length >= 2) {
      const firstDate = new Date(entries[0][0]).getTime();
      const lastDate = new Date(entries[entries.length - 1][0]).getTime();
      const corridorMs = 14 * 24 * 60 * 60 * 1000; // 14 дней коридор

      const firstPrices: number[] = [];
      const lastPrices: number[] = [];

      priceHistoryData.stores.forEach(store => {
        const sortedPrices = [...store.prices].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        if (sortedPrices.length === 0) return;

        const firstP = sortedPrices.find(p => new Date(p.date).getTime() <= firstDate + corridorMs);
        const lastP = [...sortedPrices].reverse().find(p => new Date(p.date).getTime() >= lastDate - corridorMs);

        if (firstP && lastP) {
          firstPrices.push(firstP.price);
          lastPrices.push(lastP.price);
        }
      });

      if (firstPrices.length > 0 && lastPrices.length > 0) {
        const firstDayAvg = firstPrices.reduce((a, b) => a + b, 0) / firstPrices.length;
        const lastDayAvg = lastPrices.reduce((a, b) => a + b, 0) / lastPrices.length;

        const diff = lastDayAvg - firstDayAvg;
        const percent = (diff / firstDayAvg) * 100;

        priceChangeStats = {
          percent,
          isIncrease: diff > 0,
          isDecrease: diff < 0
        };
      }
    }

    const data = entries.map(([date, prices]) => ({
      date: new Date(date).toLocaleDateString("ru-RU", { day: "numeric", month: "short" }),
      ...prices,
    }));

    return { chartData: data, chartStores: priceHistoryData.stores, priceChangeStats };
  }, [priceHistoryData]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10 space-y-4 animate-pulse">
          <div className="h-6 bg-secondary/50 rounded w-1/3" />
          <div className="h-56 bg-secondary/50 rounded-2xl" />
          <div className="h-32 bg-secondary/50 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (isError || (!isLoading && !product)) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="max-w-2xl mx-auto px-4 py-20 text-center">
          <p className="text-muted-foreground">Товар не найден</p>
          <Link to="/" className="text-sm text-primary underline mt-4 inline-block">На главную</Link>
        </div>
      </div>
    );
  }

  if (!product) return null;

  const hasCucumber = product.name.toLowerCase().includes("огурец") || product.name.toLowerCase().includes("огурцы");
  const hasStores = product.stores.length > 0;

  const handleExportChart = async () => {
    if (!chartRef.current) return;
    try {
      const canvas = await html2canvas(chartRef.current, {
        backgroundColor: document.documentElement.classList.contains('dark') ? '#09090b' : '#ffffff',
        scale: 2,
        useCORS: true,
      });
      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `minprice-${product.name.replace(/[^a-zA-Z0-9а-яА-Я]/g, '_').substring(0, 30)}.png`;
      link.href = dataUrl;
      link.click();
    } catch (error) {
      console.error('Failed to export chart', error);
    }
  };

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try { await navigator.share({ title: product.name, url }); } catch { }
    } else {
      navigator.clipboard.writeText(url);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-40 sm:pb-16">
      <PageMeta
        title={product.name}
        image={product.image}
        url={`/product/${product.id}`}
        type="product"
      />
      <Header forceDance={hasCucumber} />

      <main className="max-w-2xl mx-auto px-3 sm:px-6 py-5 sm:py-8">
        {/* Back + Share */}
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => window.history.length > 1 ? navigate(-1) : navigate("/")}
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Назад
          </button>
          <button onClick={handleShare} className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
            <Share2 className="w-3.5 h-3.5" />
            Поделиться
          </button>
        </div>

        {/* Product hero card */}
        <div className="bg-card rounded-2xl overflow-hidden mb-3 border border-border">
          <div className="flex gap-4 p-4">
            {/* Image */}
            {(() => {
              const allImages = [product.image, ...(product.additionalImages || [])].filter(Boolean);
              const currentImage = allImages[selectedImageIndex] || product.image;
              return (
                <div className="relative w-32 h-32 sm:w-44 sm:h-44 shrink-0 rounded-xl overflow-hidden bg-secondary/30">
                  <div className="absolute top-1.5 left-1.5 z-10 flex gap-1 flex-col items-start">
                    {product.discountPercent > 0 && (
                      <span className="discount-badge text-[10px]">-{product.discountPercent}%</span>
                    )}
                    {product.savingsAmount > 0 && (
                      <span className="savings-badge text-[10px]">-{product.savingsAmount} ₸</span>
                    )}
                  </div>
                  <img 
                    src={currentImage} 
                    alt={product.name} 
                    className={`w-full h-full object-cover ${imgError ? 'hidden' : ''}`}
                    onError={() => setImgError(true)} 
                  />
                  {imgError && (
                    <div className="w-full h-full flex items-center justify-center">
                      <ImageOff className="w-10 h-10 text-muted-foreground/20" />
                    </div>
                  )}
                  {allImages.length > 1 && (
                    <>
                      <button
                        onClick={() => { setSelectedImageIndex((prev) => (prev - 1 + allImages.length) % allImages.length); setImgError(false); }}
                        className="absolute left-1 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-black/40 text-white flex items-center justify-center hover:bg-black/60 transition-colors"
                      >
                        <ChevronLeft className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => { setSelectedImageIndex((prev) => (prev + 1) % allImages.length); setImgError(false); }}
                        className="absolute right-1 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-black/40 text-white flex items-center justify-center hover:bg-black/60 transition-colors"
                      >
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                      <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 flex gap-1">
                        {allImages.map((_, i) => (
                          <button
                            key={i}
                            onClick={() => { setSelectedImageIndex(i); setImgError(false); }}
                            className={`w-1.5 h-1.5 rounded-full transition-colors ${i === selectedImageIndex ? "bg-white" : "bg-white/40"}`}
                          />
                        ))}
                      </div>
                    </>
                  )}
                </div>
              );
            })()}

            {/* Info */}
            <div className="flex-1 min-w-0 flex flex-col gap-1.5">
              <h1 className="text-sm sm:text-base font-semibold text-foreground leading-snug">
                {product.name}
              </h1>
              <p className="text-xs text-muted-foreground">{product.weight}</p>

              <div className="flex flex-wrap gap-2 text-[11px] text-muted-foreground">
                {product.brand && (
                  <span className="inline-flex items-center gap-1">
                    <Tag className="w-2.5 h-2.5" />
                    <span className="font-medium text-foreground">{product.brand}</span>
                  </span>
                )}
                {product.country && (
                  <span className="inline-flex items-center gap-1">
                    <Globe className="w-2.5 h-2.5" />
                    {product.country}
                  </span>
                )}
              </div>


              <div className="mt-auto flex items-baseline gap-2">
                {hasStores ? (
                  <>
                    <span className="price-new text-lg">{bestPrice} ₸</span>
                    {worstPrice > bestPrice && (
                      <span className="price-old text-sm">{worstPrice} ₸</span>
                    )}
                  </>
                ) : (
                  <span className="text-sm text-muted-foreground">Нет в наличии</span>
                )}
              </div>
            </div>
          </div>
        </div>


        {/* Arbuz referral promo — only when Arbuz is the cheapest store */}
        {isArbuzCheapest && !promoDismissed && (
          <div className="relative rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-rose-500/10 p-4 mb-3">
            <button
              onClick={() => { dismissArbuzPromo(); setPromoDismissed(true); }}
              title="Больше не показывать"
              className="absolute top-2.5 right-2.5 w-6 h-6 rounded-full flex items-center justify-center text-muted-foreground/60 hover:text-foreground hover:bg-background/60 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
            <div className="flex items-center gap-2 mb-3 pr-6">
              <div className="w-7 h-7 rounded-full bg-emerald-500/15 flex items-center justify-center shrink-0">
                <Gift className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              </div>
              <p className="text-sm font-semibold text-foreground">Промокод Arbuz — 4 000 ₸ на первый заказ</p>
            </div>

            {/* Copyable promo code */}
            <button
              onClick={() => copy(ARBUZ_PROMO_CODE, "arbuz-promo")}
              className="w-full flex items-center justify-between gap-2 h-11 rounded-xl border border-dashed border-emerald-500/40 bg-background px-3 hover:border-emerald-500/70 transition-colors"
            >
              <span className="font-mono text-base font-bold tracking-widest text-emerald-600 dark:text-emerald-400">
                {ARBUZ_PROMO_CODE}
              </span>
              <span className={`shrink-0 inline-flex items-center gap-1.5 text-xs font-medium ${copiedKey === "arbuz-promo" ? "text-green-600" : "text-muted-foreground"}`}>
                {copiedKey === "arbuz-promo" ? (
                  <><Check className="w-3.5 h-3.5" /> Скопировано</>
                ) : (
                  <><Copy className="w-3.5 h-3.5" /> Копировать</>
                )}
              </span>
            </button>

            {/* Download Freedom SuperApp */}
            <a
              href={FREEDOM_SUPERAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 w-full flex items-center justify-center gap-1.5 h-10 rounded-xl bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 active:scale-[0.98] transition-all"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Скачать Freedom SuperApp
            </a>

            <p className="mt-2 text-[10px] text-muted-foreground/80 leading-relaxed">
              Действует только на первый заказ при сумме заказа от 10 000 ₸.
            </p>
          </div>
        )}

        {/* Store prices – expandable with ext_product title */}
        {!hasStores && (
          <div className="bg-card rounded-2xl border border-border overflow-hidden mb-3 p-4 text-center">
            <p className="text-sm text-muted-foreground">Этот товар сейчас недоступен ни в одном магазине</p>
          </div>
        )}

        {hasStores && <div className="bg-card rounded-2xl border border-border overflow-hidden mb-3">
          <div className="px-4 py-2.5 border-b border-border">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Цены по магазинам</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">Цены информационные — уточняйте актуальную стоимость в магазине перед покупкой</p>
          </div>

          {product.stores.map((store, i) => {
            const isBest = store.price === bestPrice && store.inStock !== false;
            const isExpanded = expandedStore === `${store.store}-${i}`;
            const key = `${store.store}-${i}`;

            return (
              <div key={key} className={`border-b border-border last:border-0 transition-colors ${isExpanded ? "bg-secondary/30" : ""} ${store.inStock === false ? "opacity-60 grayscale" : ""}`}>
                {/* Main row */}
                <div
                  className="flex items-center gap-3 px-4 py-3 cursor-pointer"
                  onClick={() => setExpandedStore(isExpanded ? null : key)}
                >
                  {/* Logo */}
                  <div className="w-8 h-8 rounded-full bg-background border border-border flex items-center justify-center shrink-0 overflow-hidden">
                    <StoreLogo store={store.store} logoUrl={store.storeImage} size="md" />
                  </div>

                  {/* Chain name only */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-sm font-medium text-foreground truncate">{store.store}</span>
                      {isBest && product.stores.length > 1 && (
                        <span className="best-price-label text-[10px]">min</span>
                      )}
                      {store.inStock === false && (
                        <span className="text-[10px] bg-secondary text-muted-foreground px-1.5 py-0.5 rounded uppercase font-medium">Нет в наличии</span>
                      )}
                    </div>
                  </div>

                  {/* Price */}
                  <div className="text-right shrink-0">
                    {store.oldPrice && store.inStock !== false && (
                      <p className="text-[11px] line-through text-muted-foreground/60">{store.oldPrice} ₸</p>
                    )}
                    <p className={`text-sm font-bold ${isBest ? "text-foreground" : "text-muted-foreground"}`}>
                      {store.price} ₸
                    </p>
                  </div>

                  {/* Expand chevron */}
                  <div className="text-muted-foreground shrink-0">
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </div>
                </div>

                {/* Expanded: ext_product title + actions */}
                {isExpanded && (
                  <div className="px-4 pb-3 space-y-2">
                    {/* ext_product image + title + copy */}
                    {(store.extProductTitle || store.extProductImage) && (
                      <div className="flex items-start gap-2.5 bg-background rounded-xl p-2.5 border border-border">
                        {store.extProductImage && (
                          <img
                            src={store.extProductImage}
                            alt={store.extProductTitle || ""}
                            className="w-14 h-14 rounded-lg object-cover shrink-0 bg-secondary/30"
                            onError={(e) => { e.currentTarget.style.display = 'none'; }}
                          />
                        )}
                        <div className="flex-1 min-w-0 flex items-start gap-2">
                          <p className="flex-1 text-xs text-foreground font-mono leading-snug break-words pt-0.5">{store.extProductTitle}</p>
                          {store.extProductTitle && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                copy(store.extProductTitle!, key);
                              }}
                              title="Копировать название"
                              className={`shrink-0 w-7 h-7 rounded-lg flex items-center justify-center transition-all ${copiedKey === key
                                ? "bg-green-500/15 text-green-600"
                                : "bg-secondary text-muted-foreground hover:text-foreground"
                                }`}
                            >
                              {copiedKey === key ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                            </button>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Open in store button */}
                    {store.storeUrl && (
                      <a
                        href={store.storeUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="w-full flex items-center justify-center gap-1.5 h-9 rounded-xl border border-border text-xs font-medium text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-all"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        Открыть в магазине
                      </a>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>}

        {/* Add to cart */}
        {hasStores && <div className="mb-3">
          {quantity === 0 ? (
            <button
              onClick={() => addItem(product.id, 1)}
              className="w-full h-11 rounded-xl border border-primary text-primary text-sm font-medium flex items-center justify-center gap-1.5 hover:bg-primary/5 active:scale-[0.98] transition-all"
            >
              <span>+ В корзину — {bestPrice} ₸</span>
            </button>
          ) : (
            <div className="flex items-center h-11 rounded-xl bg-primary overflow-hidden">
              <button
                onClick={() => { if (cartItem) { cartItem.quantity <= 1 ? removeItem(cartItem.product.uuid) : updateQuantity(cartItem.product.uuid, cartItem.quantity - 1); } }}
                className="h-full px-5 flex items-center justify-center text-primary-foreground hover:bg-primary-foreground/10 active:scale-90 transition-all"
              >
                <span className="text-lg font-light">−</span>
              </button>
              <span className="flex-1 text-center text-sm font-semibold text-primary-foreground">{quantity} в корзине</span>
              <button
                onClick={() => { if (cartItem) updateQuantity(cartItem.product.uuid, cartItem.quantity + 1); }}
                className="h-full px-5 flex items-center justify-center text-primary-foreground hover:bg-primary-foreground/10 active:scale-90 transition-all"
              >
                <span className="text-lg font-light">+</span>
              </button>
            </div>
          )}
        </div>}


        {/* Price History Chart */}
        {chartData.length > 0 && (
          <div ref={chartRef} className="bg-card rounded-2xl border border-border p-4 sm:p-5 relative overflow-hidden">

            <div className="flex items-start justify-between mb-4 relative z-10 w-full gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-1">
                  <h2 className="text-sm font-semibold text-foreground">Динамика цен</h2>
                  <span className="text-[9px] text-muted-foreground bg-secondary px-1.5 py-0.5 rounded uppercase font-medium whitespace-nowrap hidden sm:inline-block">minprice.kz</span>
                </div>
                <p className="text-[11px] sm:text-xs text-muted-foreground break-words whitespace-normal leading-normal pb-0.5">
                  {product.name}
                </p>
              </div>
              <div className="flex flex-col sm:flex-row items-end sm:items-center gap-2 flex-shrink-0">
                {priceChangeStats && Math.abs(priceChangeStats.percent) > 0.5 && (
                  <div className={`px-2 py-1 sm:px-2.5 rounded-full text-[10px] sm:text-xs font-semibold flex items-center gap-1 ${priceChangeStats.isIncrease
                    ? "bg-red-500/15 text-red-600 dark:text-red-400"
                    : "bg-green-500/15 text-green-700 dark:text-green-400"
                    }`}>
                    {priceChangeStats.isIncrease ? (
                      <TrendingUp className="w-3.5 h-3.5" />
                    ) : (
                      <TrendingDown className="w-3.5 h-3.5" />
                    )}
                    {Math.abs(priceChangeStats.percent).toFixed(1)}%
                  </div>
                )}
                <button
                  onClick={handleExportChart}
                  data-html2canvas-ignore="true"
                  className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-secondary text-muted-foreground hover:text-foreground flex items-center justify-center transition-all border border-transparent hover:border-border shadow-sm active:scale-95"
                  title="Скачать график (PNG)"
                >
                  <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </button>
              </div>
            </div>

            <div className="h-52 sm:h-60">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: "hsl(0 0% 45%)" }} axisLine={false} tickLine={false} />
                  <YAxis domain={['auto', 'auto']} tick={{ fontSize: 10, fill: "hsl(0 0% 45%)" }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v} ₸`} width={62} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "10px", fontSize: "12px" }}
                    formatter={(value: number) => [`${value} ₸`]}
                  />
                  <Legend wrapperStyle={{ fontSize: "11px" }} />
                  {chartStores.map((store, i) => (
                    <Line
                      key={`${store.store_name}-${i}`}
                      type="monotone"
                      dataKey={store.store_name}
                      stroke={LINE_COLORS[i % LINE_COLORS.length]}
                      strokeWidth={2}
                      dot={{ r: 3, fill: LINE_COLORS[i % LINE_COLORS.length] }}
                      activeDot={{ r: 5 }}
                      connectNulls
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Similar products */}
        {similarProducts.length > 0 && (
          <div className="mt-4 overflow-hidden bg-card rounded-2xl border border-border p-4 sm:p-5">
            <h2 className="text-sm font-semibold text-foreground mb-3">Похожие товары</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3">
              {similarProducts.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default ProductPage;
