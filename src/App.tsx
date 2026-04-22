import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation, useNavigationType } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { CartProvider } from "@/context/CartContext";
import { CityProvider } from "@/context/CityContext";
import { useLayoutEffect } from "react";
import Index from "./pages/Index";
import ProductPage from "./pages/ProductPage";
import SearchPage from "./pages/SearchPage";
import CatalogPage from "./pages/CatalogPage";
import StorePage from "./pages/StorePage";
import CartPage from "./pages/CartPage";
import DiscountsPage from "./pages/DiscountsPage";
import OfertaPage from "./pages/OfertaPage";
import CartHistoryPage from "./pages/CartHistoryPage";
import SharedCartPage from "./pages/SharedCartPage";
import NotFound from "./pages/NotFound";
import CityDetectionDialog from "./components/CityDetectionDialog";

const queryClient = new QueryClient();

// Scrolls to top on every new navigation (PUSH/REPLACE).
// POP (back/forward) is handled by useScrollRestoration in each list page.
function ScrollToTop() {
  const { pathname } = useLocation();
  const navigationType = useNavigationType();

  useLayoutEffect(() => {
    if (navigationType !== "POP") {
      window.scrollTo(0, 0);
    }
  }, [pathname, navigationType]);

  return null;
}

const App = () => (
  <HelmetProvider>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <CityProvider>
          <CartProvider>
            <CityDetectionDialog />
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <ScrollToTop />
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/product/:id" element={<ProductPage />} />
                <Route path="/product/:id/:slug" element={<ProductPage />} />
                <Route path="/catalog" element={<CatalogPage />} />
                <Route path="/catalog/:categoryId" element={<CatalogPage />} />
                <Route path="/catalog/:categoryId/:slug" element={<CatalogPage />} />
                <Route path="/city/:citySlug/catalog/:categoryId/:slug" element={<CatalogPage />} />
                <Route path="/stores/:chainSlug" element={<StorePage />} />
                <Route path="/city/:citySlug/stores/:chainSlug" element={<StorePage />} />
                <Route path="/search" element={<SearchPage />} />
                <Route path="/discounts" element={<DiscountsPage />} />
                <Route path="/public-offer" element={<OfertaPage />} />
                <Route path="/cart" element={<CartPage />} />
                <Route path="/cart-history" element={<CartHistoryPage />} />
                <Route path="/cart/:uuid" element={<SharedCartPage />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </CartProvider>
        </CityProvider>
      </TooltipProvider>
    </QueryClientProvider>
  </HelmetProvider>
);

export default App;
