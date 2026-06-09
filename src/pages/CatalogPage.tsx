import { useState, useMemo, useEffect } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { useScrollRestoration } from "@/hooks/useScrollRestoration";
import { ArrowLeft, Search, ChevronDown, ChevronRight } from "lucide-react";
import Header from "@/components/Header";
import CategorySidebar from "@/components/CategorySidebar";
import ProductCard from "@/components/ProductCard";
import { useInView } from "react-intersection-observer";
import { useCategories, useInfiniteProducts } from "@/hooks/useApi";
import { transformProducts } from "@/lib/transformers";

/** Desktop/tablet view with category sidebar */
const CatalogPage = () => {
  const { categoryId } = useParams<{ categoryId?: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  useScrollRestoration(`catalog:${location.pathname}`);

  const [searchQuery, setSearchQuery] = useState("");
  const [expandedCategories, setExpandedCategories] = useState<number[]>([]);

  const categoryIdNum = categoryId ? parseInt(categoryId) : null;

  const toggleExpand = (catId: number) => {
    setExpandedCategories(prev =>
      prev.includes(catId) ? prev.filter(id => id !== catId) : [...prev, catId]
    );
  };

  const { ref, inView } = useInView();

  // Fetch categories and infinite products
  const { data: categoriesData } = useCategories();
  const {
    data: productsPages,
    isLoading: isLoadingProducts,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage
  } = useInfiniteProducts(
    categoryIdNum ? {
      canonical_category: categoryIdNum,
      ordering: 'min_price',
      limit: 30 // Reduce limit per page for better pagination UX
    } : undefined
  );

  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

  // Transform products from all pages
  const products = useMemo(() => {
    if (!productsPages?.pages) return [];
    const allResults = productsPages.pages.flatMap(page => page.results);
    return transformProducts(allResults);
  }, [productsPages]);

  // Filter products by search query and ensure they have stores
  const filteredProducts = useMemo(() => {
    let result = products.filter((p) => p.stores && p.stores.length > 0);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter((p) => p.name.toLowerCase().includes(q));
    }
    return result;
  }, [products, searchQuery]);

  // Find category context
  const { displayCategory, activeCategoryId, subcategories, isSubcategory } = useMemo(() => {
    if (!categoryIdNum || !categoriesData?.categories) {
      return { displayCategory: null, activeCategoryId: null, subcategories: [], isSubcategory: false };
    }

    let foundParent: any = null;
    let foundCurrent: any = null;

    const findContext = (cats: any[], parent: any = null) => {
      for (const cat of cats) {
        if (cat.id === categoryIdNum) {
          foundParent = parent;
          foundCurrent = cat;
          return true;
        }
        if (cat.children && cat.children.length > 0) {
          if (findContext(cat.children, cat)) return true;
        }
      }
      return false;
    };

    findContext(categoriesData.categories);

    if (!foundCurrent) {
      return { displayCategory: null, activeCategoryId: null, subcategories: [], isSubcategory: false };
    }

    // If it has a parent, it's a subcategory. The display context (header, tabs) should be the parent.
    if (foundParent) {
      return {
        displayCategory: foundParent,
        activeCategoryId: categoryIdNum,
        subcategories: foundParent.children || [],
        isSubcategory: true
      };
    }

    // It is a top-level category
    return {
      displayCategory: foundCurrent,
      activeCategoryId: categoryIdNum,
      subcategories: foundCurrent.children || [],
      isSubcategory: false
    };
  }, [categoryIdNum, categoriesData]);

  const categoryName = displayCategory?.name || "Весь каталог";
  const categoryEmoji = displayCategory?.emoji || "📦";
  const isAllActive = !isSubcategory;

  const handleCategorySelect = (newCategoryId: number | null) => {
    if (newCategoryId === null) {
      navigate('/catalog');
    } else {
      navigate(`/catalog/${newCategoryId}`);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-32 sm:pb-16">
      <Header />
      <div className="mx-auto flex max-w-7xl gap-6 px-3 py-4 sm:px-6 sm:py-6">
        {/* Desktop sidebar */}
        <CategorySidebar
          activeCategory={categoryIdNum}
          onCategorySelect={handleCategorySelect}
        />

        <main className="flex-1 min-w-0">
          {/* Header */}
          {displayCategory && (
            <div className="az-sheet mb-4 flex items-center gap-3 p-4">
              <button
                onClick={() => navigate("/catalog")}
                className="flex h-8 w-8 shrink-0 items-center justify-center border border-border transition-colors hover:bg-accent"
              >
                <ArrowLeft className="w-4 h-4 text-muted-foreground" />
              </button>
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <span className="text-xl">{categoryEmoji}</span>
                <h1 className="truncate text-2xl font-black text-foreground">
                  {categoryName}
                </h1>
              </div>
            </div>
          )}

          {/* Subcategories chips */}
          {displayCategory && subcategories.length > 0 && (
            <div className="overflow-x-auto scrollbar-hide -mx-3 px-3 mb-4">
              <div className="flex w-max gap-1.5">
                <button
                  onClick={() => navigate(`/catalog/${displayCategory.id}`)}
                  className={`border px-3 py-1.5 text-xs font-black uppercase whitespace-nowrap transition-all ${isAllActive
                    ? "bg-foreground text-background"
                    : "border-border bg-secondary text-muted-foreground hover:text-foreground"
                    }`}
                >
                  Все
                </button>
                {subcategories.map((sub: any) => {
                  const isActive = activeCategoryId === sub.id;
                  return (
                    <button
                      key={sub.id}
                      onClick={() => navigate(`/catalog/${sub.id}`)}
                      className={`border px-3 py-1.5 text-xs font-black uppercase whitespace-nowrap transition-all ${isActive ? "bg-foreground text-background" : "border-border bg-secondary text-muted-foreground hover:text-foreground"}`}
                    >
                      {sub.emoji} {sub.name}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Search */}
          {categoryIdNum && (
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder={`Искать в «${categoryName}»...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-11 w-full border-2 border-foreground bg-card pl-9 pr-3 text-sm font-semibold text-foreground placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none"
              />
            </div>
          )}

          {/* Products grid */}
          {isLoadingProducts ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3">
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className="h-[400px] border border-border bg-secondary/50 animate-pulse" />
              ))}
            </div>
          ) : !categoryIdNum && categoriesData?.categories ? (
            // Show category tree when no category selected
            <>
              {/* Mobile tree */}
              <div className="space-y-1 lg:hidden">
                {categoriesData.categories.map((cat) => {
                  const isExpanded = expandedCategories.includes(cat.id);
                  const hasChildren = cat.children && cat.children.length > 0;

                  return (
                    <div key={cat.id} className="az-table-card">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => toggleExpand(cat.id)}
                          className="flex flex-1 items-center justify-between gap-3 px-4 py-3.5 text-left transition-colors hover:bg-accent/50"
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-2xl leading-none">{cat.emoji || '📦'}</span>
                            <span className="text-sm font-black text-foreground">{cat.name}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            {/* Assuming we might not have exact count, omitted or you can add if api provides */}
                            {hasChildren ? (
                              isExpanded ? (
                                <ChevronDown className="w-4 h-4 text-muted-foreground" />
                              ) : (
                                <ChevronRight className="w-4 h-4 text-muted-foreground" />
                              )
                            ) : (
                              <ChevronRight className="w-4 h-4 text-muted-foreground" />
                            )}
                          </div>
                        </button>
                      </div>

                      {isExpanded && hasChildren && (
                        <div className="pl-12 pr-4 pb-2 space-y-0.5">
                          <button
                            onClick={() => navigate(`/catalog/${cat.id}`)}
                            className="flex w-full items-center justify-between gap-2 border border-border px-3 py-2.5 text-sm font-black text-primary transition-colors hover:bg-secondary"
                          >
                            <span>Все в категории</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                          {cat.children!.map((sub) => (
                            <button
                              key={sub.id}
                              onClick={() => navigate(`/catalog/${sub.id}`)}
                              className="flex w-full items-center justify-between gap-2 px-3 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-accent/40 hover:text-foreground"
                            >
                              <div className="flex items-center gap-2">
                                {sub.emoji && <span className="text-base">{sub.emoji}</span>}
                                <span>{sub.name}</span>
                              </div>
                              <ChevronRight className="w-3.5 h-3.5 opacity-50" />
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              {/* Desktop placeholder */}
              <div className="az-empty hidden lg:flex flex-col items-center justify-center">
                <div className="mb-4 flex h-16 w-16 items-center justify-center border-2 border-foreground bg-secondary">
                  <span className="text-3xl opacity-50 grayscale">🔍</span>
                </div>
                <h3 className="mb-2 text-lg font-black text-foreground">Выберите категорию</h3>
                <p className="text-sm text-muted-foreground max-w-[250px]">
                  Используйте меню слева, чтобы найти нужные вам товары
                </p>
              </div>
            </>
          ) : filteredProducts.length > 0 ? (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3">
                {filteredProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>

              {/* Infinite scroll trigger and loader */}
              {hasNextPage && (
                <div ref={ref} className="w-full flex justify-center mt-6 h-12">
                  {isFetchingNextPage ? (
                    <div className="flex gap-1.5 items-center justify-center">
                      <div className="w-2 h-2 rounded-full bg-primary/40 animate-bounce [animation-delay:-0.3s]" />
                      <div className="w-2 h-2 rounded-full bg-primary/40 animate-bounce [animation-delay:-0.15s]" />
                      <div className="w-2 h-2 rounded-full bg-primary/40 animate-bounce" />
                    </div>
                  ) : (
                    <div className="h-full w-full" />
                  )}
                </div>
              )}
            </>
          ) : (
            <div className="az-empty">
              <span className="text-4xl mb-3 block">{categoryEmoji}</span>
              <p className="text-muted-foreground text-sm">
                {searchQuery.trim()
                  ? `Нет товаров по запросу «${searchQuery}»`
                  : categoryIdNum
                    ? `Пока нет товаров в категории «${categoryName}»`
                    : 'Выберите категорию из списка слева'
                }
              </p>
              {!searchQuery.trim() && categoryIdNum && (
                <p className="text-xs text-muted-foreground mt-1">Скоро появятся!</p>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default CatalogPage;
