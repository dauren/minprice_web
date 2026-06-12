import { useMemo } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import Header from "@/components/Header";
import PageMeta from "@/components/PageMeta";
import ProductCard from "@/components/ProductCard";
import { useChains, useInfiniteProducts } from "@/hooks/useApi";
import { transformProducts } from "@/lib/transformers";
import { t } from "@/lib/i18n";

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

  const title = t.store.titleSuffix(chain?.name || "", citySlug);

  return (
    <div className="min-h-screen bg-background pb-32 sm:pb-16">
      <PageMeta
        title={title}
        description={`${title}${t.store.metaDescSuffix}`}
        url={citySlug ? `/city/${citySlug}/stores/${chainSlug}` : `/stores/${chainSlug}`}
      />
      <Header />

      <main className="mx-auto max-w-6xl px-3 py-5 sm:px-6 sm:py-8">
        <Link to="/" className="az-min-link mb-4 inline-flex items-center gap-1.5">
          <ArrowLeft className="w-3.5 h-3.5" />
          {t.store.backHome}
        </Link>

        <section className="az-sheet mb-5 p-4 sm:p-5">
          <span className="az-kicker mb-2">{t.store.kicker}</span>
          <h1 className="text-2xl font-black leading-tight text-foreground sm:text-4xl">{title}</h1>
          <p className="mt-2 max-w-2xl text-sm font-semibold text-muted-foreground">
            {t.store.storeDesc}
          </p>
        </section>

        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3">
            {Array.from({ length: 12 }).map((_, index) => (
              <div key={index} className="h-[360px] border border-border bg-secondary/50 animate-pulse" />
            ))}
          </div>
        ) : products.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="az-empty text-sm text-muted-foreground">
            {t.store.noProducts}
          </div>
        )}
      </main>
    </div>
  );
};

export default StorePage;
