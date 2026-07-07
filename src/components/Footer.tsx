import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";

// Sitewide footer. Also carries a dofollow cross-link to our sister project arzan.kz
// to help it rank (real <a href>, present in the DOM on every route).
const Footer = () => {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-border bg-background mt-8">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-6">
          {/* Brand */}
          <div className="max-w-xs">
            <div className="text-lg font-extrabold tracking-tight text-foreground">
              minprice<span className="text-primary">.kz</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
              Сравнение цен супермаркетов Казахстана — Алматы, Астана, Шымкент.
            </p>
          </div>

          {/* Site nav */}
          <nav className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
            <Link to="/catalog" className="text-muted-foreground hover:text-foreground transition-colors">Каталог</Link>
            <Link to="/discounts" className="text-muted-foreground hover:text-foreground transition-colors">Скидки</Link>
            <Link to="/search" className="text-muted-foreground hover:text-foreground transition-colors">Поиск</Link>
            <Link to="/cart" className="text-muted-foreground hover:text-foreground transition-colors">Корзина</Link>
            <Link to="/public-offer" className="text-muted-foreground hover:text-foreground transition-colors">Оферта</Link>
            <Link to="/return-policy" className="text-muted-foreground hover:text-foreground transition-colors">Возврат</Link>
            <a href="mailto:support@minprice.kz" className="text-muted-foreground hover:text-foreground transition-colors">Поддержка</a>
          </nav>

          {/* Our projects — arzan.kz cross-link */}
          <div className="max-w-xs">
            <h3 className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest mb-2">Новый проект</h3>
            <a
              href="https://arzan.kz"
              target="_blank"
              rel="noopener"
              className="inline-flex items-center gap-1 text-sm font-semibold text-foreground hover:text-primary transition-colors"
            >
              Arzan.kz — поиск самых низких цен
              <ArrowUpRight className="w-4 h-4 shrink-0" />
            </a>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
              Сравнение цен супермаркетов Казахстана. Эволюция minprice.kz — быстрее, умнее, больше магазинов.
            </p>
          </div>
        </div>

        <div className="mt-8 pt-4 border-t border-border text-[11px] text-muted-foreground">
          © {year} minprice.kz — минимальные цены. Сделано в Казахстане 🇰🇿
        </div>
      </div>
    </footer>
  );
};

export default Footer;
