import { useState, useMemo, useRef } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Share2, Tag, Globe, ExternalLink, Copy, Check, ChevronDown, ChevronUp, TrendingUp, TrendingDown, Download, ChevronLeft, ChevronRight, ImageOff } from "lucide-react";
import html2canvas from "html2canvas";
import StoreLogo from "@/components/StoreLogo";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";
import Header from "@/components/Header";
import PageMeta from "@/components/PageMeta";
import { useCart } from "@/context/CartContext";
import { useCity } from "@/context/CityContext";
import { useCashback } from "@/context/CashbackContext";
import { useProduct, usePriceHistory, useSimilarProducts } from "@/hooks/useApi";
import { transformProduct, transformProducts } from "@/lib/transformers";
import ProductCard from "@/components/ProductCard";
import { t } from "@/lib/i18n";

const LINE_COLORS = ["#6366f1", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];

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
  const { copiedKey, copy } = useCopy();
  const { applyEnabled, getPercent, effectivePrice } = useCashback();
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
  // When cashback display is on, rank the best store by effective (post-cashback) price.
  const priceKey = (s: typeof candidateStores[number]) =>
    applyEnabled ? effectivePrice(s.price, s.chainId) : s.price;
  const bestStore = candidateStores.length > 0 ? candidateStores.reduce((a, b) => (priceKey(a) < priceKey(b) ? a : b)) : null;
  const bestPrice = bestStore?.price ?? 0;
  const bestPct = bestStore ? getPercent(bestStore.chainId) : 0;
  const bestEff = bestStore ? Math.round(effectivePrice(bestStore.price, bestStore.chainId)) : 0;
  const worstPrice = product ? Math.max(...product.stores.map((s) => s.oldPrice || s.price)) : 0;

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
          <div className="h-56 bg-muted/30" />
          <div className="h-32 bg-muted/30" />
        </div>
      </div>
    );
  }

  if (isError || (!isLoading && !product)) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="max-w-2xl mx-auto px-4 py-20 text-center">
          <p className="text-muted-foreground">{t.product.notFound}</p>
          <Link to="/" className="mt-4 inline-block text-sm text-black underline">{t.product.backHome}</Link>
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
      link.download = `arzan-${product.name.replace(/[^a-zA-Z0-9а-яА-Я]/g, '_').substring(0, 30)}.png`;
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

      <main className="mx-auto max-w-3xl px-3 py-5 sm:px-6 sm:py-8">
        {/* Back + Share */}
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => window.history.length > 1 ? navigate(-1) : navigate("/")}
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            {t.product.back}
          </button>
          <button onClick={handleShare} className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
            <Share2 className="w-3.5 h-3.5" />
            {t.product.share}
          </button>
        </div>

        {/* Product hero card */}
        <div className="mb-4 overflow-hidden bg-white">
          <div className="flex gap-4 p-4">
            {/* Image */}
            {(() => {
              const allImages = [product.image, ...(product.additionalImages || [])].filter(Boolean);
              const currentImage = allImages[selectedImageIndex] || product.image;
              return (
                <div className="relative h-32 w-32 shrink-0 overflow-hidden bg-white sm:h-48 sm:w-48">
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
                        className="absolute left-1 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center bg-white/80 text-black transition-colors hover:bg-white"
                      >
                        <ChevronLeft className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => { setSelectedImageIndex((prev) => (prev + 1) % allImages.length); setImgError(false); }}
                        className="absolute right-1 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center bg-white/80 text-black transition-colors hover:bg-white"
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
              <h1 className="text-base font-semibold leading-snug text-black sm:text-xl">
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
                    <span className="az-price-chip text-base">{applyEnabled && bestPct > 0 ? bestEff : bestPrice} ₸</span>
                    {applyEnabled && bestPct > 0 ? (
                      <span className="price-old text-sm">{bestPrice} ₸</span>
                    ) : worstPrice > bestPrice && (
                      <span className="price-old text-sm">{worstPrice} ₸</span>
                    )}
                    {!applyEnabled && bestPct > 0 && (
                      <span className="text-xs font-medium text-primary">кэшбэк {bestPct}%</span>
                    )}
                  </>
                ) : (
                  <span className="text-sm text-muted-foreground">{t.product.outOfStock}</span>
                )}
              </div>
            </div>
          </div>
        </div>


        {/* Store prices – expandable with ext_product title */}
        {!hasStores && (
          <div className="mb-3 overflow-hidden bg-white p-4 text-center">
            <p className="text-sm text-muted-foreground">{t.product.unavailableInStores}</p>
          </div>
        )}

        {hasStores && <div className="mb-4 overflow-hidden bg-white">
          <div className="px-4 py-2.5">
            <p className="text-xs font-medium text-black/45">{t.product.storesPrices}</p>
          </div>

          {product.stores.map((store, i) => {
            // Compare on the same key used to pick bestStore: identical to the old
            // price match when no cashback (ties still all show "min"), correct with it.
            const isBest = !!bestStore && store.inStock !== false && priceKey(store) === priceKey(bestStore);
            const isExpanded = expandedStore === `${store.store}-${i}`;
            const key = `${store.store}-${i}`;

            return (
              <div key={key} className={`border-b border-border last:border-0 transition-colors ${isExpanded ? "bg-secondary/30" : ""} ${store.inStock === false ? "opacity-60 grayscale" : ""}`}>
                {/* Main row */}
                <div
                  className="flex cursor-pointer items-center gap-3 px-4 py-3"
                  onClick={() => setExpandedStore(isExpanded ? null : key)}
                >
                  {/* Logo */}
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden bg-white">
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
                        <span className="text-[10px] bg-secondary text-muted-foreground px-1.5 py-0.5 rounded uppercase font-medium">{t.product.outOfStock}</span>
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
                      <div className="flex items-start gap-2.5 bg-white p-2.5">
                        {store.extProductImage && (
                          <img
                            src={store.extProductImage}
                            alt={store.extProductTitle || ""}
                            className="h-14 w-14 shrink-0 object-cover bg-secondary/30"
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
                              title={import.meta.env.VITE_SITE_LANG === "kk" ? "Атауды көшіру" : "Копировать название"}
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
                        className="flex h-9 w-full items-center justify-center gap-1.5 text-xs font-medium text-black/45 transition-colors hover:text-black"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        {t.product.openInStore}
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
              className="flex h-11 w-full items-center justify-center gap-1.5 bg-[#148a42]/10 text-sm font-medium text-[#148a42] transition-colors hover:bg-[#148a42]/15 active:scale-[0.98]"
            >
              <span>{t.product.addToCart(bestPrice)}</span>
            </button>
          ) : (
            <div className="flex h-11 items-center overflow-hidden bg-[#148a42]/10 text-[#148a42]">
              <button
                onClick={() => { if (cartItem) { cartItem.quantity <= 1 ? removeItem(cartItem.product.uuid) : updateQuantity(cartItem.product.uuid, cartItem.quantity - 1); } }}
                className="h-full px-5 flex items-center justify-center text-primary-foreground hover:bg-primary-foreground/10 active:scale-90 transition-all"
              >
                <span className="text-lg font-light">−</span>
              </button>
              <span className="flex-1 text-center text-sm font-semibold text-primary-foreground">{t.product.inCart(quantity)}</span>
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
          <div ref={chartRef} className="relative overflow-hidden bg-white p-4 sm:p-5">

            <div className="flex items-start justify-between mb-4 relative z-10 w-full gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-1">
                  <h2 className="text-sm font-semibold text-foreground">{t.product.priceChart}</h2>
                  <span className="text-[9px] text-muted-foreground bg-secondary px-1.5 py-0.5 rounded uppercase font-medium whitespace-nowrap hidden sm:inline-block">arzan.kz</span>
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
                  title={t.product.downloadChart}
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
          <div className="mt-4 overflow-hidden bg-white p-4 sm:p-5">
            <h2 className="text-sm font-semibold text-foreground mb-3">{t.product.similarProducts}</h2>
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
