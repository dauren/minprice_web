import { useState, useMemo, useEffect, useLayoutEffect } from "react";
import { ArrowUpDown, Tag } from "lucide-react";
import { useNavigationType } from "react-router-dom";
import { useScrollRestoration } from "@/hooks/useScrollRestoration";
import Header from "@/components/Header";
import ProductCard from "@/components/ProductCard";
import StoreLogo from "@/components/StoreLogo";
import mascot from "@/assets/logo.png";
import PageMeta from "@/components/PageMeta";
import { useDiscounts, useChains } from "@/hooks/useApi";
import { transformProducts } from "@/lib/transformers";
import { getChainIdsFromCookie, setChainIdsToCookie } from "@/lib/chainCookies";

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
                title="Скидки"
                description="Лучшие скидки на продукты в супермаркетах Казахстана. Сравните цены и сэкономьте на minprice.kz."
                url="/discounts"
            />
            <Header />

            <div className="max-w-5xl mx-auto px-3 sm:px-6 pt-5 sm:pt-8">
                {/* Page Title */}
                <div className="flex items-center gap-2.5 mb-5">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center">
                        <Tag className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h1 className="text-xl sm:text-2xl font-bold text-foreground">Скидки</h1>
                        <p className="text-xs text-muted-foreground">Лучшие предложения со скидками</p>
                    </div>
                </div>

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
                                    setPage(1); 
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
                        <p className="text-sm text-muted-foreground">
                            {!isLoading && `${total} товаров`}
                        </p>
                        <p className="text-[11px] text-muted-foreground mt-0.5">Цены могут отличаться от актуальных в магазине</p>
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
                {isLoading ? (
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

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="flex items-center justify-center gap-2 mt-8">
                                <button
                                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                                    disabled={page <= 1}
                                    className="px-3 py-2 rounded-lg text-sm font-medium bg-secondary text-muted-foreground hover:text-foreground disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
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
                                            className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors ${page === pageNum
                                                ? "bg-foreground text-background"
                                                : "bg-secondary text-muted-foreground hover:text-foreground"
                                                }`}
                                        >
                                            {pageNum}
                                        </button>
                                    );
                                })}
                                <button
                                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                                    disabled={page >= totalPages}
                                    className="px-3 py-2 rounded-lg text-sm font-medium bg-secondary text-muted-foreground hover:text-foreground disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                                >
                                    →
                                </button>
                            </div>
                        )}
                    </>
                ) : (
                    <div className="text-center py-20">
                        <img src={mascot} alt="Нет скидок" className="w-20 h-20 mx-auto mb-4 object-contain opacity-50" />
                        <p className="text-muted-foreground font-medium">Нет товаров со скидками</p>
                        <p className="text-xs text-muted-foreground mt-1.5">
                            {selectedChainIds.length > 0
                                ? "Попробуйте сбросить фильтры магазинов"
                                : "Попробуйте позже"
                            }
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default DiscountsPage;
