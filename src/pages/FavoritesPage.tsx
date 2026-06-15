import { useMemo } from "react";
import { Heart } from "lucide-react";
import { useScrollRestoration } from "@/hooks/useScrollRestoration";
import Header from "@/components/Header";
import ProductCard from "@/components/ProductCard";
import PageMeta from "@/components/PageMeta";
import { useFavoriteProducts } from "@/hooks/useApi";
import { useFavorites } from "@/context/FavoritesContext";
import { transformProducts } from "@/lib/transformers";

const FavoritesPage = () => {
  useScrollRestoration("favorites");
  const { data, isLoading } = useFavoriteProducts();
  const { isFavorite } = useFavorites();

  // Filter by the live favorites set so un-hearting a card removes it instantly.
  const products = useMemo(() => {
    if (!data?.results) return [];
    return transformProducts(data.results).filter((p) => isFavorite(p.id));
  }, [data, isFavorite]);

  return (
    <div className="min-h-screen bg-background pb-32 sm:pb-16">
      <PageMeta
        title="Избранное"
        description="Сохранённые товары — сравнивайте цены на избранное в супермаркетах Казахстана."
        url="/favorites"
      />
      <Header />

      <div className="mx-auto max-w-6xl px-3 pt-4 sm:px-6 sm:pt-6">
        <div className="mb-5 flex items-center gap-3 pb-3">
          <div className="flex h-10 w-10 items-center justify-center bg-white text-black">
            <Heart className="h-5 w-5" />
          </div>
          <div>
            <span className="az-kicker mb-1">saved</span>
            <h1 className="text-2xl font-semibold text-black sm:text-3xl">Избранное</h1>
            <p className="text-xs font-medium text-black/45">Товары, которые вы сохранили</p>
          </div>
        </div>

        <div className="mb-4 flex items-center justify-between border-b-2 border-foreground pb-2">
          <p className="text-xs font-medium text-black/45">
            {!isLoading && `${products.length} товаров`}
          </p>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 sm:gap-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-[400px] border border-border bg-secondary/50 animate-pulse" />
            ))}
          </div>
        ) : products.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 sm:gap-3">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="mx-auto max-w-md bg-white py-14 text-center">
            <Heart className="mx-auto mb-3 h-8 w-8 text-black/15" />
            <p className="font-medium text-black">В избранном пока пусто</p>
            <p className="text-xs text-muted-foreground mt-1.5">
              Нажимайте на ♡ на карточках товаров, чтобы сохранять их сюда
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default FavoritesPage;
