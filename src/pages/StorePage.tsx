import { useMemo } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import Header from "@/components/Header";
import PageMeta from "@/components/PageMeta";
import ProductCard from "@/components/ProductCard";
import { useChains, useInfiniteProducts } from "@/hooks/useApi";
import { transformProducts } from "@/lib/transformers";

const StorePage = () => {
  const { chainSlug, citySlug } = useParams<{ chainSlug: string; citySlug?: string }>();
  const { data: chainsData } = useChains();
  const { data: productsPages, isLoading } = useInfiniteProducts({ ordering: "-updated_at", limit: 60 });

  const chain = useMemo(() => {
    if (!chainsData?.chains || !chainSlug) return null;
    return chainsData.chains.find((item) => item.slug === chainSlug || item.source === chainSlug);
  }, [chainsData, chainSlug]);

  const products = useMemo(() => {
    if (!productsPages?.pages) return [];
    const allProducts = transformProducts(productsPages.pages.flatMap((page) => page.results));
    if (!chain) return allProducts;
    return allProducts.filter((product) =>
      product.stores.some((store) => store.storeSlug === chain.slug || store.storeSource === chain.source || store.store === chain.name)
    );
  }, [productsPages, chain]);

  const title = `${chain?.name || "Магазин"}${citySlug ? ` в ${citySlug}` : ""}: цены на продукты`;

  return (
    <div className="min-h-screen bg-background pb-32 sm:pb-16">
      <PageMeta
        title={title}
        description={`${title}. Актуальные предложения, наличие и цены на minprice.kz.`}
        url={citySlug ? `/city/${citySlug}/stores/${chainSlug}` : `/stores/${chainSlug}`}
      />
      <Header />

      <main className="max-w-6xl mx-auto px-3 sm:px-6 py-5 sm:py-8">
        <Link to="/" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft className="w-3.5 h-3.5" />
          Главная
        </Link>

        <section className="mb-5">
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">{title}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Товары с актуальными предложениями источника. Канонические страницы товаров содержат цены, наличие и время обновления.
          </p>
        </section>

        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3">
            {Array.from({ length: 12 }).map((_, index) => (
              <div key={index} className="h-[360px] rounded-xl bg-secondary/50 animate-pulse" />
            ))}
          </div>
        ) : products.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">
            Пока нет доступных товаров для этого магазина.
          </div>
        )}
      </main>
    </div>
  );
};

export default StorePage;
