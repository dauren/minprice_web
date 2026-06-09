import { Search, ShoppingCart, Home, Tag, LayoutGrid, ScanBarcode, Info } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useCart } from "@/context/CartContext";
import CitySelector from "@/components/CitySelector";
import IosAppBanner from "@/components/IosAppBanner";
import { BarcodeScannerModal } from "@/components/BarcodeScannerModal";
import { AboutModal } from "@/components/AboutModal";
import AuthButton from "@/components/AuthButton";

const navItems = [
  { to: "/", icon: Home, label: "Главная", matchExact: true },
  { to: "/search", icon: Search, label: "Поиск" },
  { to: "/catalog", icon: LayoutGrid, label: "Каталог" },
  { to: "/discounts", icon: Tag, label: "Скидки" },
  { to: "/cart", icon: ShoppingCart, label: "Корзина", hasBadge: true },
];

const Header = ({ forceDance = false }: { forceDance?: boolean }) => {
  const { totalItems } = useCart();
  const location = useLocation();
  const navigate = useNavigate();
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isAboutOpen, setIsAboutOpen] = useState(false);

  const qParams = new URLSearchParams(location.search);
  const q = qParams.get("q") || "";
  const isCucumberQuery = q.toLowerCase().includes("огурец") || q.toLowerCase().includes("огурцы");
  const isDancing = forceDance || isCucumberQuery;

  return (
    <>
      <IosAppBanner />
      <header className="sticky top-0 z-50 border-b border-black/10 bg-white">
        <div className="mx-auto max-w-none px-3 sm:px-6">
          <div className="relative flex h-12 items-center justify-between gap-3 sm:h-14">
            <Link to="/" className="group flex shrink-0 items-center" aria-label="Arzan.kz">
              <span className={`az-logo text-[20px] text-black sm:text-[24px] ${isDancing ? "animate-dance" : ""}`}>
                Arzan.kz
              </span>
            </Link>

            <nav className="hidden shrink-0 items-center gap-1 sm:flex">
              {navItems.map((item) => {
                const active = item.matchExact
                  ? location.pathname === item.to
                  : location.pathname.startsWith(item.to);

                return (
                  <Link
                    key={item.label}
                    to={item.to}
                    className={`relative flex h-9 items-center gap-1.5 px-2 text-xs font-normal tracking-normal transition-colors ${active ? "text-black" : "text-black/35 hover:text-black"
                      }`}
                  >
                    <item.icon className="w-4 h-4" />
                    {item.label}
                    {item.hasBadge && totalItems > 0 && (
                      <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center bg-white px-1 text-[10px] font-medium text-black">
                        {totalItems}
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>

            <div className="flex shrink-0 items-center gap-3 sm:gap-4">
              <CitySelector />

              <button
                className="flex h-9 w-9 items-center justify-center bg-white text-black/35 transition-colors hover:text-black"
                onClick={() => setIsScannerOpen(true)}
                title="Сканировать штрихкод"
              >
                <ScanBarcode className="h-5 w-5" />
              </button>

              <button
                className="hidden h-9 w-9 items-center justify-center bg-white text-black/35 transition-colors hover:text-black sm:flex"
                onClick={() => setIsAboutOpen(true)}
              >
                <Info className="h-[18px] w-[18px]" />
              </button>

              <AuthButton />
            </div>
          </div>
        </div>
      </header>

      <BarcodeScannerModal 
        open={isScannerOpen} 
        onOpenChange={setIsScannerOpen} 
        onScan={(barcode) => {
          navigate(`/search?q=${encodeURIComponent(barcode)}`);
        }} 
      />

      <AboutModal open={isAboutOpen} onOpenChange={setIsAboutOpen} />

      {/* Mobile bottom nav */}
      <MobileBottomNav />
    </>
  );
};

const MobileBottomNav = () => {
  const location = useLocation();
  const { totalItems } = useCart();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white pb-[env(safe-area-inset-bottom)] sm:hidden">
      <div className="grid h-14 grid-cols-5 items-center">
        {navItems.map((item) => {
          const active = item.matchExact
            ? location.pathname === item.to
            : location.pathname.startsWith(item.to.split("?")[0]);

          return (
            <Link
              key={item.label}
              to={item.to}
              className={`relative flex min-w-0 flex-1 flex-col items-center gap-0.5 px-2 py-1.5 transition-colors ${active ? "text-black" : "text-black/30"
                }`}
            >
              <span className="flex h-7 w-9 items-center justify-center">
                <item.icon className="h-5 w-5" />
              </span>
              <span className="text-[10px] font-medium">{item.label}</span>
              {item.hasBadge && totalItems > 0 && (
                <span className="absolute right-1 top-0 flex h-4 min-w-4 items-center justify-center bg-white px-1 text-[10px] font-medium text-black">
                  {totalItems}
                </span>
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default Header;
