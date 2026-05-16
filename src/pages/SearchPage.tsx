import { useState, useMemo, useRef, useEffect } from "react";
import { useSearchParams, useLocation } from "react-router-dom";
import { useScrollRestoration } from "@/hooks/useScrollRestoration";
import { Search, X, ArrowUpDown, Clock, ScanBarcode } from "lucide-react";
import { useInView } from "react-intersection-observer";
import Header from "@/components/Header";
import ProductCard from "@/components/ProductCard";
import StoreLogo from "@/components/StoreLogo";
import mascot from "@/assets/logo.png";
import { useInfiniteSearch, useChains, useSearchSuggestions } from "@/hooks/useApi";
import { transformProducts } from "@/lib/transformers";
import { getSearchHistory, addSearchHistory, removeSearchHistoryItem } from "@/lib/searchHistory";
import { BarcodeScannerModal } from "@/components/BarcodeScannerModal";
import { getChainIdsFromCookie, setChainIdsToCookie } from "@/lib/chainCookies";


const SearchPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get("q") || "";
  const sortParam = searchParams.get("sort");
  const location = useLocation();

  useScrollRestoration(`search:${location.search}`);

  const [inputValue, setInputValue] = useState(query);
  const [selectedChainIds, setSelectedChainIds] = useState<number[]>(getChainIdsFromCookie);
  const [sortBy, setSortBy] = useState<"discount" | "price">(
    sortParam === "price" ? "price" : "discount"
  );
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [page, setPage] = useState(1);
  const [showHistory, setShowHistory] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [searchHistory, setSearchHistory] = useState<string[]>(getSearchHistory);
  const inputRef = useRef<HTMLInputElement>(null);
  const historyRef = useRef<HTMLDivElement>(null);

  const { ref: bottomRef, inView } = useInView({ threshold: 0 });

  // Auto-focus input when visiting /search without query
  useEffect(() => {
    if (!query && inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  // Sync input with URL
  useEffect(() => {
    setInputValue(query);
  }, [query]);

  // Reset sentinel and state when query, filters or sort changes
  useEffect(() => {
    // page state removed as useInfiniteQuery handles it
  }, [query, selectedChainIds, sortBy]);

  // API hooks — pass chainIds to backend for server-side filtering
  const {
    data: searchData,
    isLoading: isSearchLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage
  } = useInfiniteSearch(
    query,
    selectedChainIds.length > 0 ? selectedChainIds : undefined
  );

  // Load next page when sentinel enters viewport
  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);
  const { data: chainsData } = useChains();
  const { data: suggestionsData } = useSearchSuggestions(inputValue);
  const suggestions = suggestionsData?.suggestions || [];

  // Close history dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (historyRef.current && !historyRef.current.contains(e.target as Node)) {
        setShowHistory(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = inputValue.trim();
    if (trimmed) {
      addSearchHistory(trimmed);
      setSearchHistory(getSearchHistory());
      setSearchParams({ q: trimmed });
      setShowHistory(false);
    } else {
      setSearchParams({});
    }
  };

  const handleHistoryClick = (term: string) => {
    setInputValue(term);
    addSearchHistory(term);
    setSearchHistory(getSearchHistory());
    setSearchParams({ q: term });
    setShowHistory(false);
  };

  const handleSuggestionClick = (term: string, queryID?: string, objectID?: string, position?: number) => {
    if (queryID && objectID && position !== undefined) {
      import('@/lib/algoliaInsights').then(({ sendSuggestionClickEvent }) => {
        sendSuggestionClickEvent(queryID, objectID, position);
      });
    }
    handleHistoryClick(term);
  };

  const handleRemoveHistory = (e: React.MouseEvent, term: string) => {
    e.stopPropagation();
    removeSearchHistoryItem(term);
    setSearchHistory(getSearchHistory());
  };

  const clearSearch = () => {
    setInputValue("");
    setSearchParams({});
    inputRef.current?.focus();
  };

  const toggleChain = (chainId: number) => {
    setSelectedChainIds((prev) => {
      const next = prev.includes(chainId)
        ? prev.filter((id) => id !== chainId)
        : [...prev, chainId];
      setChainIdsToCookie(next);
      return next;
    });
  };

  // Sort on frontend PER PAGE to preserve Meilisearch relevance tiers
  // (otherwise less relevant items from page 2 would bubble up if they are cheaper).
  const sortedProducts = useMemo(() => {
    if (!query || !searchData?.pages) return [];

    return searchData.pages.flatMap((page) => {
      const pageHits = transformProducts(page.hits || [], page.queryID);
      
      if (sortBy === "price") {
        pageHits.sort((a, b) => {
          const aPrice = a.stores.length > 0 ? Math.min(...a.stores.map(s => s.price)) : Infinity;
          const bPrice = b.stores.length > 0 ? Math.min(...b.stores.map(s => s.price)) : Infinity;
          return aPrice - bPrice;
        });
      } else {
        pageHits.sort((a, b) => b.discountPercent - a.discountPercent);
      }
      
      return pageHits;
    });
  }, [query, searchData, sortBy]);

  // Since backend gives us chunks of products, we don't need client-side slicing anymore.
  // We just render all sortedProducts, which grows as we fetchNextPage.

  const isLoading = !!query && isSearchLoading;

  return (
    <div className="min-h-screen bg-background pb-32 sm:pb-16">
      <Header />

      <div className="max-w-5xl mx-auto px-3 sm:px-6 pt-5 sm:pt-8">
        {/* Search Input */}
        <form onSubmit={handleSearch} className="mb-5">
          <div className="relative group" ref={historyRef}>
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onFocus={() => setShowHistory(true)}
              placeholder="Поиск товаров..."
              className="w-full h-12 sm:h-14 pl-12 pr-12 rounded-2xl bg-secondary/60 border-2 border-transparent text-foreground text-base placeholder:text-muted-foreground/60 focus:outline-none focus:border-primary focus:bg-card focus:shadow-[0_0_20px_4px_hsl(var(--primary)/0.12)] transition-all"
            />
            {inputValue ? (
              <button
                type="button"
                onClick={clearSearch}
                className="absolute right-4 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-muted hover:bg-muted-foreground/20 flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setIsScannerOpen(true)}
                className="absolute right-4 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-secondary hover:bg-secondary/80 flex items-center justify-center transition-colors text-muted-foreground hover:text-foreground"
              >
                <ScanBarcode className="w-4.5 h-4.5" />
              </button>
            )}
            {showHistory && !query && searchHistory.length > 0 && !inputValue && (
              <div className="absolute top-full left-0 right-0 mt-1 z-50 bg-card border border-border rounded-xl shadow-lg overflow-hidden">
                {searchHistory.map((term) => (
                  <button
                    key={term}
                    type="button"
                    onClick={() => handleHistoryClick(term)}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-foreground hover:bg-secondary/50 transition-colors"
                  >
                    <Clock className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                    <span className="flex-1 text-left truncate">{term}</span>
                    <button
                      type="button"
                      onClick={(e) => handleRemoveHistory(e, term)}
                      className="shrink-0 text-muted-foreground hover:text-foreground p-0.5"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </button>
                ))}
              </div>
            )}
            
            {showHistory && inputValue && suggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 z-50 bg-card border border-border rounded-xl shadow-lg overflow-hidden">
                {suggestions.map((suggestion, index) => (
                  <button
                    key={`${suggestion.query}-${index}`}
                    type="button"
                    onClick={() => handleSuggestionClick(suggestion.query, suggestionsData?.queryID, suggestion.objectID, index + 1)}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-foreground hover:bg-secondary/50 transition-colors"
                  >
                    <Search className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                    <span className="flex-1 text-left truncate">{suggestion.query}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </form>

        {/* Store Icon Filters */}
        {chainsData && chainsData.chains.length > 0 && (
          <div className="flex items-center gap-2 mb-5">
            {chainsData.chains.map((chain) => {
              const isActive = selectedChainIds.includes(chain.id);
              return (
                <button
                  key={chain.id}
                  onClick={() => toggleChain(chain.id)}
                  title={chain.name}
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
                onClick={() => {
                  setSelectedChainIds([]);
                  setChainIdsToCookie([]);
                }}
                className="text-xs text-primary hover:text-primary/80 transition-colors ml-1 font-medium"
              >
                Сбросить
              </button>
            )}
          </div>
        )}

        {/* Results Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-lg sm:text-xl font-bold text-foreground">
              {query ? `Результаты: «${query}»` : "Поиск"}
            </h1>
            {query && !isLoading && (
              <p className="text-xs text-muted-foreground mt-0.5">
                {sortedProducts.length}{" "}
                {sortedProducts.length === 1
                  ? "товар"
                  : sortedProducts.length < 5
                    ? "товара"
                    : "товаров"}
              </p>
            )}
          </div>

          {/* Sort Toggle */}
          <div className="relative">
            <button
              onClick={() => setShowSortMenu(!showSortMenu)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium bg-secondary text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowUpDown className="w-3.5 h-3.5" />
              {sortBy === "discount" ? "По скидке" : "По цене"}
            </button>
            {showSortMenu && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowSortMenu(false)} />
                <div className="absolute right-0 mt-1 z-50 w-40 bg-card border border-border rounded-xl shadow-lg overflow-hidden">
                  <button
                    onClick={() => { setSortBy("discount"); setShowSortMenu(false); }}
                    className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${sortBy === "discount" ? "bg-secondary font-medium text-foreground" : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
                      }`}
                  >
                    По скидке
                  </button>
                  <button
                    onClick={() => { setSortBy("price"); setShowSortMenu(false); }}
                    className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${sortBy === "price" ? "bg-secondary font-medium text-foreground" : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
                      }`}
                  >
                    По цене
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Products Grid */}
        {!query ? (
          <div className="text-center py-24">
            <img src={mascot} alt="Поиск" className="w-20 h-20 mx-auto mb-4 object-contain opacity-40" />
            <p className="text-muted-foreground font-medium">Введите запрос для поиска</p>
            <p className="text-xs text-muted-foreground mt-1.5">Например: молоко, хлеб, курица</p>
          </div>
        ) : isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 sm:gap-3">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="h-[400px] rounded-xl bg-secondary/50 animate-pulse" />
            ))}
          </div>
        ) : sortedProducts.length > 0 ? (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 sm:gap-3">
              {sortedProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>

            {/* Infinite scroll sentinel */}
            {hasNextPage && (
              <div ref={bottomRef} className="w-full flex justify-center mt-8 h-12">
                <div className="flex gap-1.5 items-center justify-center">
                  <div className="w-2.5 h-2.5 rounded-full bg-primary/40 animate-bounce [animation-delay:-0.3s]" />
                  <div className="w-2.5 h-2.5 rounded-full bg-primary/40 animate-bounce [animation-delay:-0.15s]" />
                  <div className="w-2.5 h-2.5 rounded-full bg-primary/40 animate-bounce" />
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-20">
            <img src={mascot} alt="Ничего не найдено" className="w-20 h-20 mx-auto mb-4 object-contain opacity-50" />
            <p className="text-muted-foreground font-medium">
              По запросу «{query}» ничего не найдено
            </p>
            <p className="text-xs text-muted-foreground mt-1.5">
              {selectedChainIds.length > 0
                ? "Попробуйте сбросить фильтры магазинов"
                : "Попробуйте изменить запрос"
              }
            </p>
          </div>
        )}
      </div>

      <BarcodeScannerModal 
        open={isScannerOpen} 
        onOpenChange={setIsScannerOpen} 
        onScan={(barcode) => {
          setInputValue(barcode);
          setSearchParams({ q: barcode });
        }} 
      />
    </div>
  );
};

export default SearchPage;
