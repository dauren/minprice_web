import { useState, useMemo, useEffect, useLayoutEffect } from "react";
import { ArrowUpDown, Tag } from "lucide-react";
import { useNavigationType } from "react-router-dom";
import { useScrollRestoration } from "@/hooks/useScrollRestoration";
import Header from "@/components/Header";
import ProductCard from "@/components/ProductCard";
import StoreLogo from "@/components/StoreLogo";
import PageMeta from "@/components/PageMeta";
import { useDiscounts, useChains } from "@/hooks/useApi";
import { transformProducts } from "@/lib/transformers";
import { getChainIdsFromCookie, setChainIdsToCookie } from "@/lib/chainCookies";
import { t } from "@/lib/i18n";

const DiscountsPage = () => {
    const navigationType = useNavigationType();
    const [selectedChainIds, setSelectedChainIds] = useState<number[]>(getChainIdsFromCookie);
    const [sortBy, setSortBy] = useState<"discount" | "price">("discount");
    const [showSortMenu, setShowSortMenu] = useState(false);
    const [page, setPage] = useState(1);

    useScrollRestoration("discounts");

    // Restore pagination page when navigating back
    useLayoutEffect(() => {
        if (navigationType === "POP") {
            const saved = sessionStorage.getItem("discounts:page");
            if (saved) setPage(parseInt(saved, 10));
        } else {
            sessionStorage.removeItem("discounts:page");
        }
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        sessionStorage.setItem("discounts:page", String(page));
    }, [page]);

    // API hooks — pass chainIds to backend for server-side filtering
    const { data: discountsData, isLoading } = useDiscounts(
        selectedChainIds.length > 0 ? selectedChainIds : undefined,
        page
    );
    const { data: chainsData } = useChains();

    const toggleChain = (chainId: number) => {
        setSelectedChainIds((prev) => {
            const next = prev.includes(chainId)
                ? prev.filter((id) => id !== chainId)
                : [...prev, chainId];
            setChainIdsToCookie(next);
            return next;
        });
        setPage(1); // Reset page when filter changes
    };

    const products = useMemo(() => {
        if (!discountsData?.results) return [];
        return transformProducts(discountsData.results);
    }, [discountsData]);

    // Sort on frontend
    const sortedProducts = useMemo(() => {
        const sorted = [...products];
        if (sortBy === "price") {
            sorted.sort(
                (a, b) =>
                    Math.min(...a.stores.map((s) => s.price)) -
                    Math.min(...b.stores.map((s) => s.price))
            );
        } else {
            sorted.sort((a, b) => b.discountPercent - a.discountPercent);
        }
        return sorted;
    }, [products, sortBy]);

    const totalPages = discountsData?.total_pages || 1;
    const total = discountsData?.total || 0;

    return (
        <div className="min-h-screen bg-background pb-32 sm:pb-16">
            <PageMeta
                title={t.discounts.metaTitle}
                description={t.discounts.metaDesc}
                url="/discounts"
            />
            <Header />

            <div className="mx-auto max-w-6xl px-3 pt-4 sm:px-6 sm:pt-6">
                {/* Page Title */}
                <div className="mb-5 flex items-center justify-between gap-3 pb-3">
                    <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center bg-white text-black">
                        <Tag className="h-5 w-5" />
                    </div>
                    <div>
                        <span className="az-kicker mb-1">{t.discounts.kicker}</span>
                        <h1 className="text-2xl font-semibold text-black sm:text-3xl">{t.discounts.heading}</h1>
                        <p className="text-xs font-medium text-black/45">{t.discounts.subheading}</p>
                    </div>
                    </div>
                    <div className="hidden text-right sm:block">
                        <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-black/35">arzan.kz</p>
                        <p className="text-sm font-medium text-black/45">{t.discounts.priceDrops}</p>
                    </div>
                </div>

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
                                    setPage(1); 
                                }}
                                className="ml-1 text-xs font-medium text-black/45 transition-colors hover:text-black"
                            >
                                {t.discounts.reset}
                            </button>
                        )}
                    </div>
                )}

                {/* Results Header */}
                <div className="mb-4 flex items-center justify-between border-b-2 border-foreground pb-2">
                    <p className="text-xs font-medium text-black/45">
                        {!isLoading && t.discounts.itemCount(total)}
                    </p>

                    {/* Sort Toggle */}
                    <div className="relative">
                        <button
                            onClick={() => setShowSortMenu(!showSortMenu)}
                            className="flex items-center gap-1.5 bg-white px-3 py-2 text-xs font-medium text-black/45 transition-colors hover:text-black"
                        >
                            <ArrowUpDown className="w-3.5 h-3.5" />
                            {sortBy === "discount" ? t.discounts.sortByDiscount : t.discounts.sortByPrice}
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
                                        {t.discounts.sortByDiscount}
                                    </button>
                                    <button
                                        onClick={() => { setSortBy("price"); setShowSortMenu(false); }}
                                        className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${sortBy === "price" ? "bg-secondary font-medium text-foreground" : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
                                            }`}
                                    >
                                        {t.discounts.sortByPrice}
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>

                {/* Products Grid */}
                {isLoading ? (
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

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="flex items-center justify-center gap-2 mt-8">
                                <button
                                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                                    disabled={page <= 1}
                                    className="bg-white px-3 py-2 text-sm font-medium text-black/45 transition-colors hover:text-black disabled:cursor-not-allowed disabled:opacity-40"
                                >
                                    ←
                                </button>
                                {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                                    let pageNum: number;
                                    if (totalPages <= 7) {
                                        pageNum = i + 1;
                                    } else if (page <= 4) {
                                        pageNum = i + 1;
                                    } else if (page >= totalPages - 3) {
                                        pageNum = totalPages - 6 + i;
                                    } else {
                                        pageNum = page - 3 + i;
                                    }
                                    return (
                                        <button
                                            key={pageNum}
                                            onClick={() => setPage(pageNum)}
                                            className={`h-9 w-9 border text-sm font-medium transition-colors ${page === pageNum
                                                ? "bg-[#148a42]/10 text-[#148a42]"
                                                : "border-border bg-secondary text-muted-foreground hover:text-foreground"
                                                }`}
                                        >
                                            {pageNum}
                                        </button>
                                    );
                                })}
                                <button
                                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                                    disabled={page >= totalPages}
                                    className="bg-white px-3 py-2 text-sm font-medium text-black/45 transition-colors hover:text-black disabled:cursor-not-allowed disabled:opacity-40"
                                >
                                    →
                                </button>
                            </div>
                        )}
                    </>
                ) : (
                    <div className="mx-auto max-w-md bg-white py-14 text-center">
                        <p className="font-medium text-black">{t.discounts.noDiscounts}</p>
                        <p className="text-xs text-muted-foreground mt-1.5">
                            {selectedChainIds.length > 0
                                ? t.discounts.tryResetFilters
                                : t.discounts.tryLater
                            }
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default DiscountsPage;
