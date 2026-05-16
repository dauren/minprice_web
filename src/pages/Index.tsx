import { useState, useMemo, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useInView } from "react-intersection-observer";
import { useQueryClient } from "@tanstack/react-query";
import { Search, ArrowUp, Clock, X } from "lucide-react";
import Header from "@/components/Header";
import PageMeta from "@/components/PageMeta";
import ProductCard from "@/components/ProductCard";
import StoreLogo from "@/components/StoreLogo";
import { useInfiniteBestDeals, useChains, useSearchSuggestions } from "@/hooks/useApi";
import { transformProducts } from "@/lib/transformers";
import { useScrollRestoration } from "@/hooks/useScrollRestoration";
import { getSearchHistory, addSearchHistory, removeSearchHistoryItem } from "@/lib/searchHistory";
import { useCart } from "@/context/CartContext";


const Index = () => {
  const { selectedChainIds: savedChainIds, updateStorePreferences } = useCart();
  const [selectedChainIds, setSelectedChainIds] = useState<number[]>(savedChainIds);
  const queryClient = useQueryClient();

  // Keep local selection in sync when preferences load from backend
  useEffect(() => {
    setSelectedChainIds(savedChainIds);
  }, [savedChainIds]);

  const {
    data: bestDealsData,
    isLoading: isLoadingDeals,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage
  } = useInfiniteBestDeals();
  const { data: chainsData } = useChains();
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [searchHistory, setSearchHistory] = useState<string[]>(getSearchHistory);
  const { data: suggestionsData } = useSearchSuggestions(searchQuery);
  const suggestions = suggestionsData?.suggestions || [];
  
  const historyRef = useRef<HTMLDivElement>(null);
  const { ref, inView } = useInView();

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (historyRef.current && !historyRef.current.contains(e.target as Node)) {
        setShowHistory(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useScrollRestoration("index");

  // TanStack Query handles caching of infinite pages automatically
  // No need to manually restore page count unless cache expires

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      addSearchHistory(searchQuery.trim());
      setSearchHistory(getSearchHistory());
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setShowHistory(false);
    } else {
      navigate("/search");
    }
  };

  const handleIndexHistoryClick = (term: string) => {
    addSearchHistory(term);
    setSearchHistory(getSearchHistory());
    navigate(`/search?q=${encodeURIComponent(term)}`);
    setShowHistory(false);
  };

  const toggleChain = async (chainId: number) => {
    const next = selectedChainIds.includes(chainId)
      ? selectedChainIds.filter((id) => id !== chainId)
      : [...selectedChainIds, chainId];
    setSelectedChainIds(next);
    await updateStorePreferences(next);
    queryClient.invalidateQueries({ queryKey: ['bestDeals-infinite'] });
  };

  // Load more pages when scrolling to bottom
  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

  const allDeals = useMemo(() => {
    if (!bestDealsData?.pages) return [];
    const deals = bestDealsData.pages.flatMap((p) => p.deals);
    return transformProducts(deals);
  }, [bestDealsData]);

  const totalDealsCount = bestDealsData?.pages[0]?.total || allDeals.length;

  return (
    <div className="min-h-screen bg-background pb-40 sm:pb-24">
      <PageMeta />
      <Header />

      <section className="max-w-7xl mx-auto px-3 sm:px-6 pt-4 sm:pt-6 mb-8">
        {/* Search bar under hero */}
        <form onSubmit={handleSearch} className="mb-6">
          <div
            ref={historyRef}
            className={`relative flex items-center rounded-2xl transition-all duration-200 ${searchFocused
              ? "bg-card border-2 border-primary shadow-[0_0_20px_4px_hsl(var(--primary)/0.18)]"
              : "bg-secondary/70 border-2 border-transparent hover:border-border"
              }`}
          >
            <Search
              className={`absolute left-4 w-5 h-5 transition-colors ${searchFocused ? "text-primary" : "text-muted-foreground"
                }`}
            />
            <input
              type="text"
              placeholder="Найти самые низкие цены..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => { setSearchFocused(true); setShowHistory(true); }}
              onBlur={() => setSearchFocused(false)}
              className="w-full pl-12 pr-14 h-12 sm:h-14 bg-transparent text-foreground text-[15px] sm:text-base placeholder:text-muted-foreground/60 focus:outline-none"
            />
            <button
              type="submit"
              className={`absolute right-2 h-9 w-9 sm:h-10 sm:w-10 rounded-xl flex items-center justify-center transition-all ${searchQuery.trim()
                ? "bg-primary text-primary-foreground hover:bg-primary/90"
                : "bg-muted text-muted-foreground hover:bg-muted-foreground/20"
                }`}
            >
              <ArrowUp className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
            {showHistory && !searchQuery && searchHistory.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 z-50 bg-card border border-border rounded-xl shadow-lg overflow-hidden">
                {searchHistory.map((term) => (
                  <button
                    key={term}
                    type="button"
                    onMouseDown={() => handleIndexHistoryClick(term)}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-foreground hover:bg-secondary/50 transition-colors"
                  >
                    <Clock className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                    <span className="flex-1 text-left truncate">{term}</span>
                    <span
                      onMouseDown={(e) => {
                        e.stopPropagation();
                        removeSearchHistoryItem(term);
                        setSearchHistory(getSearchHistory());
                      }}
                      className="shrink-0 text-muted-foreground hover:text-foreground p-0.5"
                    >
                      <X className="w-3 h-3" />
                    </span>
                  </button>
                ))}
              </div>
            )}
            
            {showHistory && searchQuery && suggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 z-50 bg-card border border-border rounded-xl shadow-lg overflow-hidden">
                {suggestions.map((term, index) => (
                  <button
                    key={`${term}-${index}`}
                    type="button"
                    onMouseDown={() => handleIndexHistoryClick(term)}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-foreground hover:bg-secondary/50 transition-colors"
                  >
                    <Search className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                    <span className="flex-1 text-left truncate">{term}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </form>

        {/* Store Icon Filters */}
        {chainsData && chainsData.chains.length > 0 && (
          <div className="flex items-center gap-2 mb-6">
            {chainsData.chains.map((chain) => {
              const isActive = selectedChainIds.includes(chain.id);
              return (
                <button
                  key={chain.id}
                  onClick={() => toggleChain(chain.id)}
                  title={chain.name}
                  type="button"
                  className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center transition-all border-2 ${isActive
                    ? "border-primary bg-primary/10 shadow-[0_0_8px_hsl(var(--primary)/0.3)] scale-110"
                    : "border-border bg-card hover:border-foreground/30 opacity-60 hover:opacity-100"
                    }`}
                >
                  <StoreLogo store={chain.name} logoUrl={chain.logo} size="md" />
                </button>
              );
            })}

            {selectedChainIds.length > 0 && (
              <button
                onClick={async () => {
                  setSelectedChainIds([]);
                  await updateStorePreferences([]);
                  queryClient.invalidateQueries({ queryKey: ['bestDeals-infinite'] });
                }}
                type="button"
                className="text-xs text-primary hover:text-primary/80 transition-colors ml-1 font-medium"
              >
                Сбросить
              </button>
            )}
          </div>
        )}

        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg sm:text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            🔥 Выгодные предложения
          </h2>
          <span className="text-sm text-muted-foreground">{totalDealsCount} товаров</span>
        </div>

        {isLoadingDeals ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 sm:gap-3">
            {Array.from({ length: 15 }).map((_, i) => (
              <div key={i} className="h-[400px] rounded-xl bg-secondary/50 animate-pulse" />
            ))}
          </div>
        ) : allDeals.length === 0 ? (
          <div className="py-12 text-center text-muted-foreground">
            Нет доступных скидок
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 sm:gap-3">
              {allDeals.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>

            {hasNextPage && (
              <div ref={ref} className="w-full flex justify-center mt-8 h-12">
                <div className="flex gap-1.5 items-center justify-center">
                  <div className="w-2.5 h-2.5 rounded-full bg-primary/40 animate-bounce [animation-delay:-0.3s]" />
                  <div className="w-2.5 h-2.5 rounded-full bg-primary/40 animate-bounce [animation-delay:-0.15s]" />
                  <div className="w-2.5 h-2.5 rounded-full bg-primary/40 animate-bounce" />
                </div>
              </div>
            )}
          </>
        )}
      </section>

      <Footer />
    </div>
  );
};

const Footer = () => (
  <footer className="border-t border-border py-8 mt-auto">
    <div className="max-w-7xl mx-auto px-4 sm:px-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <span className="text-base font-bold text-foreground">minprice.kz</span>
          <p className="text-sm text-muted-foreground mt-1 max-w-xs">
            Сравнение цен на продукты среди магазинов Казахстана
          </p>
        </div>
        <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground font-medium">
          <Link to="/search" className="hover:text-foreground transition-colors">Поиск</Link>
          <Link to="/catalog" className="hover:text-foreground transition-colors">Каталог</Link>
          <Link to="/discounts" className="hover:text-foreground transition-colors">Скидки</Link>
          <Link to="/cart" className="hover:text-foreground transition-colors">Корзина</Link>
          <Link to="/public-offer" className="hover:text-foreground transition-colors">Оферта</Link>
          <a href="mailto:support@minprice.kz" className="hover:text-foreground transition-colors">Поддержка</a>
        </div>
      </div>
      <div className="mt-6 pt-4 border-t border-border text-center text-xs text-muted-foreground">
        © 2026 minprice.kz — Все цены актуальны на момент обновления
      </div>
    </div>
  </footer>
);

export default Index;

