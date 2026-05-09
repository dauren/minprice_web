import { Search, ShoppingCart, Home, Tag, Moon, Sun, LayoutGrid, ScanBarcode, ArrowUp, Clock, X } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useCart } from "@/context/CartContext";
import CitySelector from "@/components/CitySelector";
import IosAppBanner from "@/components/IosAppBanner";
import logo from "@/assets/logo.png";
import { getSearchHistory, addSearchHistory, removeSearchHistoryItem } from "@/lib/searchHistory";
import { BarcodeScannerModal } from "@/components/BarcodeScannerModal";

const navItems = [
  { to: "/", icon: Home, label: "Главная", matchExact: true },
  { to: "/search", icon: Search, label: "Поиск" },
  { to: "/catalog", icon: LayoutGrid, label: "Каталог" },
  { to: "/discounts", icon: Tag, label: "Скидки" },
  { to: "/cart", icon: ShoppingCart, label: "Корзина", hasBadge: true },
];

const Header = ({ forceDance = false }: { forceDance?: boolean }) => {
  const [isDark, setIsDark] = useState(() => document.documentElement.classList.contains("dark"));
  const [searchQuery, setSearchQuery] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [searchHistory, setSearchHistory] = useState<string[]>(getSearchHistory);
  const { totalItems } = useCart();
  const location = useLocation();
  const navigate = useNavigate();
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const historyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (historyRef.current && !historyRef.current.contains(e.target as Node)) {
        setShowHistory(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleTheme = () => {
    const next = !isDark;
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("theme", next ? "dark" : "light");
    setIsDark(next);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      addSearchHistory(searchQuery.trim());
      setSearchHistory(getSearchHistory());
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery("");
      setShowHistory(false);
    } else {
      navigate("/search");
    }
  };

  const handleHeaderHistoryClick = (term: string) => {
    addSearchHistory(term);
    setSearchHistory(getSearchHistory());
    navigate(`/search?q=${encodeURIComponent(term)}`);
    setSearchQuery("");
    setShowHistory(false);
  };

  const isSearchPage = location.pathname.startsWith("/search");
  const qParams = new URLSearchParams(location.search);
  const q = qParams.get("q") || "";
  const isCucumberQuery = q.toLowerCase().includes("огурец") || q.toLowerCase().includes("огурцы");
  const isDancing = forceDance || isCucumberQuery;

  return (
    <>
      <IosAppBanner />
      <header className="sticky top-0 z-50 bg-card/80 backdrop-blur-xl border-b border-border">
        <div className="max-w-6xl mx-auto px-3 sm:px-6">
          {/* Top row: logo + nav + actions */}
          <div className="flex items-center justify-between h-12 sm:h-14 gap-3">
            <Link to="/" className="shrink-0 flex items-center gap-1.5 group">
              <img src={logo} alt="minprice.kz" className={`w-9 h-9 sm:w-11 sm:h-11 object-contain origin-bottom ${isDancing ? "animate-dance" : "group-hover:animate-dance"}`} />
              <span className="text-base sm:text-lg font-semibold tracking-tight text-foreground hidden sm:block">
                minprice.kz
              </span>
            </Link>

            {/* Search bar — always visible in header, hidden on search page (it has its own) */}
            {!isSearchPage && (
              <form
                onSubmit={handleSearch}
                className="hidden sm:flex flex-1 max-w-md mx-4"
              >
                <div
                  ref={historyRef}
                  className={`relative flex items-center w-full rounded-xl transition-all duration-200 ${isFocused
                    ? "bg-card border-2 border-primary shadow-[0_0_16px_2px_hsl(var(--primary)/0.2)]"
                    : "bg-secondary/70 border-2 border-transparent hover:border-border"
                    }`}
                >
                  <Search
                    className={`absolute left-3 w-4 h-4 transition-colors ${isFocused ? "text-primary" : "text-muted-foreground"
                      }`}
                  />
                  <input
                    type="text"
                    placeholder="Поиск товаров..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onFocus={() => { setIsFocused(true); setShowHistory(true); }}
                    onBlur={() => setIsFocused(false)}
                    className="w-full pl-9 pr-10 h-9 bg-transparent text-foreground text-sm placeholder:text-muted-foreground/60 focus:outline-none"
                  />
                  <button
                    type="submit"
                    className={`absolute right-2 w-6 h-6 rounded-lg flex items-center justify-center transition-all ${searchQuery.trim()
                      ? "bg-primary text-primary-foreground hover:bg-primary/90"
                      : "bg-muted text-muted-foreground"
                      }`}
                  >
                    <ArrowUp className="w-3 h-3" />
                  </button>
                  {showHistory && !searchQuery && searchHistory.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-1 z-50 bg-card border border-border rounded-xl shadow-lg overflow-hidden">
                      {searchHistory.map((term) => (
                        <button
                          key={term}
                          type="button"
                          onMouseDown={() => handleHeaderHistoryClick(term)}
                          className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-foreground hover:bg-secondary/50 transition-colors"
                        >
                          <Clock className="w-3 h-3 text-muted-foreground shrink-0" />
                          <span className="flex-1 text-left truncate">{term}</span>
                          <span
                            onMouseDown={(e) => {
                              e.stopPropagation();
                              removeSearchHistoryItem(term);
                              setSearchHistory(getSearchHistory());
                            }}
                            className="shrink-0 text-muted-foreground hover:text-foreground p-0.5"
                          >
                            <X className="w-3 h-3" />
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </form>
            )}

            {/* Desktop Navigation */}
            <nav className="hidden sm:flex items-center gap-5 shrink-0">
              {navItems.map((item) => {
                const active = item.matchExact
                  ? location.pathname === item.to
                  : location.pathname.startsWith(item.to);

                return (
                  <Link
                    key={item.label}
                    to={item.to}
                    className={`text-sm font-medium transition-colors hover:text-foreground flex items-center gap-1.5 relative ${active ? "text-foreground" : "text-muted-foreground"
                      }`}
                  >
                    <item.icon className="w-4 h-4" />
                    {item.label}
                    {item.hasBadge && totalItems > 0 && (
                      <span className="absolute -top-2 -right-3 w-4 h-4 rounded-full bg-foreground text-background text-[10px] font-semibold flex items-center justify-center">
                        {totalItems}
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={toggleTheme}
                className="flex items-center justify-center w-8 h-8 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-all"
              >
                {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>

              <CitySelector />

              <button
                className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
                onClick={() => setIsScannerOpen(true)}
              >
                <ScanBarcode className="w-4.5 h-4.5" />
              </button>
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

      {/* Mobile bottom nav */}
      <MobileBottomNav />
    </>
  );
};

const MobileBottomNav = () => {
  const location = useLocation();
  const { totalItems } = useCart();

  return (
    <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-50 bg-card/80 backdrop-blur-xl border-t border-border pb-[env(safe-area-inset-bottom)]">
      <div className="flex items-center justify-around h-14">
        {navItems.map((item) => {
          const active = item.matchExact
            ? location.pathname === item.to
            : location.pathname.startsWith(item.to.split("?")[0]);

          return (
            <Link
              key={item.label}
              to={item.to}
              className={`relative flex flex-col items-center gap-0.5 px-4 py-1.5 transition-colors ${active ? "text-foreground" : "text-muted-foreground"
                }`}
            >
              <item.icon className="w-5 h-5" />
              <span className="text-[11px] font-medium">{item.label}</span>
              {item.hasBadge && totalItems > 0 && (
                <span className="absolute -top-0.5 right-1 w-4 h-4 rounded-full bg-foreground text-background text-[10px] font-semibold flex items-center justify-center">
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
