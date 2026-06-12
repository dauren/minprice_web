import { useState, useMemo, useRef, useEffect } from "react";
import { useSearchParams, useLocation } from "react-router-dom";
import { useScrollRestoration } from "@/hooks/useScrollRestoration";
import { Search, X, ArrowUpDown, Clock, ScanBarcode } from "lucide-react";
import { useInView } from "react-intersection-observer";
import Header from "@/components/Header";
import ProductCard from "@/components/ProductCard";
import StoreLogo from "@/components/StoreLogo";
import { useInfiniteSearch, useChains, useSearchSuggestions } from "@/hooks/useApi";
import { transformProducts } from "@/lib/transformers";
import { getSearchHistory, addSearchHistory, removeSearchHistoryItem } from "@/lib/searchHistory";
import { BarcodeScannerModal } from "@/components/BarcodeScannerModal";
import { getChainIdsFromCookie, setChainIdsToCookie } from "@/lib/chainCookies";
import { t } from "@/lib/i18n";


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

      <div className="mx-auto max-w-6xl px-3 pt-4 sm:px-6 sm:pt-6">
        <div className="mb-4 flex flex-col gap-2 pb-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <span className="az-kicker mb-2">{t.search.kicker}</span>
            <h1 className="text-2xl font-semibold leading-tight text-black sm:text-3xl">
              {t.search.heading(query)}
            </h1>
          </div>
          {query && !isLoading && (
            <p className="text-xs font-medium text-black/45">
              {t.search.found(sortedProducts.length)}
            </p>
          )}
        </div>

        {/* Search Input */}
        <form onSubmit={handleSearch} className="mb-5">
          <div className="relative group" ref={historyRef}>
            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-black/35 transition-colors group-focus-within:text-black" />
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onFocus={() => setShowHistory(true)}
              placeholder={t.search.placeholder}
              className="h-12 w-full bg-white pl-12 pr-[100px] text-base font-medium text-black placeholder:text-black/35 transition-colors focus:outline-none sm:h-14"
            />
            <div className="absolute right-1.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
              {inputValue && (
                <button
                  type="button"
                  onClick={clearSearch}
                  className="flex h-8 w-8 shrink-0 items-center justify-center border border-border bg-muted transition-colors hover:bg-muted-foreground/20"
                >
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsScannerOpen(true)}
                className="flex h-10 w-10 shrink-0 items-center justify-center bg-[#148a42]/10 text-[#148a42] transition-colors hover:bg-[#148a42]/15"
                title={t.nav.scanBarcode}
              >
                <ScanBarcode className="w-4.5 h-4.5 sm:w-5 sm:h-5" />
              </button>
            </div>
            {showHistory && !query && searchHistory.length > 0 && !inputValue && (
              <div className="absolute left-0 right-0 top-full z-50 mt-1 overflow-hidden bg-white">
                {searchHistory.map((term) => (
                  <button
                    key={term}
                    type="button"
                    onClick={() => handleHistoryClick(term)}
                    className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-black transition-colors hover:bg-[#148a42]/5"
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
              <div className="absolute left-0 right-0 top-full z-50 mt-1 overflow-hidden bg-white">
                {suggestions.map((suggestion, index) => (
                  <button
                    key={`${suggestion.query}-${index}`}
                    type="button"
                    onClick={() => handleSuggestionClick(suggestion.query, suggestionsData?.queryID, suggestion.objectID, index + 1)}
                    className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-black transition-colors hover:bg-[#148a42]/5"
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
          <div className="mb-5 flex items-center gap-2 overflow-x-auto scrollbar-hide">
            {chainsData.chains.map((chain) => {
              const isActive = selectedChainIds.includes(chain.id);
              return (
                <button
                  key={chain.id}
                  onClick={() => toggleChain(chain.id)}
                  title={chain.name}
                  className={`flex h-10 w-10 shrink-0 items-center justify-center border transition-colors ${isActive
                    ? "border-transparent bg-white opacity-100"
                    : "border-transparent bg-white opacity-35 hover:opacity-100"
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
                className="ml-1 text-xs font-medium text-black/45 transition-colors hover:text-black"
              >
                {t.search.reset}
              </button>
            )}
          </div>
        )}

        {/* Results Header */}
        <div className="mb-4 flex items-center justify-between border-b-2 border-foreground pb-2">
          <p className="text-xs font-medium text-black/45">
            {query ? t.search.results : t.search.startWithQuery}
          </p>

          {/* Sort Toggle */}
          <div className="relative">
            <button
              onClick={() => setShowSortMenu(!showSortMenu)}
              className="flex items-center gap-1.5 bg-white px-3 py-2 text-xs font-medium text-black/45 transition-colors hover:text-black"
            >
              <ArrowUpDown className="w-3.5 h-3.5" />
              {sortBy === "discount" ? t.search.sortByDiscount : t.search.sortByPrice}
            </button>
            {showSortMenu && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowSortMenu(false)} />
                <div className="absolute right-0 z-50 mt-1 w-40 overflow-hidden bg-white">
                  <button
                    onClick={() => { setSortBy("discount"); setShowSortMenu(false); }}
                    className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${sortBy === "discount" ? "bg-secondary font-medium text-foreground" : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
                      }`}
                  >
                    {t.search.sortByDiscount}
                  </button>
                  <button
                    onClick={() => { setSortBy("price"); setShowSortMenu(false); }}
                    className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${sortBy === "price" ? "bg-secondary font-medium text-foreground" : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
                      }`}
                  >
                    {t.search.sortByPrice}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Products Grid */}
        {!query ? (
          <div className="mx-auto max-w-md bg-white py-16 text-center">
            <p className="font-medium text-black">{t.search.emptyPrompt}</p>
            <p className="text-xs text-muted-foreground mt-1.5">{t.search.emptyHint}</p>
          </div>
        ) : isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 sm:gap-3">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="h-[400px] border border-border bg-secondary/50 animate-pulse" />
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
          <div className="mx-auto max-w-md bg-white py-14 text-center">
            <p className="font-medium text-black">
              {t.search.noResults(query)}
            </p>
            <p className="text-xs text-muted-foreground mt-1.5">
              {selectedChainIds.length > 0
                ? t.search.tryResetFilters
                : t.search.tryChangeQuery
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
