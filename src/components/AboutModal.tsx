import { Link } from "react-router-dom";
import { Drawer, DrawerContent, DrawerTitle } from "@/components/ui/drawer";
import { X, Tag, ShoppingCart, ScanBarcode, Bell, ArrowUpRight } from "lucide-react";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";

import logo from "@/assets/logo.png";
import StoreLogo from "@/components/StoreLogo";
import { useChains } from "@/hooks/useApi";

interface AboutModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AboutModal({ open, onOpenChange }: AboutModalProps) {
  const { data: chainsData } = useChains();

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-w-md mx-auto w-full rounded-t-[32px] p-0 bg-[#F4F6F9] dark:bg-zinc-950 border-none overflow-hidden max-h-[80vh] flex flex-col">
        <VisuallyHidden>
          <DrawerTitle>О приложении minprice.kz</DrawerTitle>
        </VisuallyHidden>
        
        <div className="overflow-y-auto px-4 pb-5 pt-2 sm:px-6 custom-scrollbar">
          {/* Header Card */}
          <div className="bg-white dark:bg-zinc-900 rounded-3xl p-5 mb-6 shadow-sm border border-black/5 dark:border-white/5 relative">
            <button 
              onClick={() => onOpenChange(false)}
              className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-secondary/50 hover:bg-secondary transition-colors"
            >
              <X className="w-4 h-4 text-foreground" />
            </button>

            <div className="flex items-start gap-3 mb-4">
              <img src={logo} alt="minprice" className="w-16 h-16 object-contain" />
              <div className="pt-1">
                <div className="inline-flex items-center px-2 py-0.5 rounded-full bg-cyan-100 dark:bg-cyan-900/30 text-cyan-600 dark:text-cyan-400 text-[11px] font-semibold mb-1">
                  Сравнение цен
                </div>
                <div className="text-[11px] text-muted-foreground leading-tight">
                  Алматы, Астана, Шымкент
                </div>
              </div>
            </div>

            <div>
              <div className="text-3xl font-extrabold tracking-tight text-foreground flex items-baseline">
                minprice<span className="text-primary">.kz</span>
              </div>
              <div className="text-base text-muted-foreground font-medium mt-1">
                Минимальные цены.
              </div>
            </div>
          </div>

          {/* Features */}
          <div className="mb-6">
            <h3 className="text-[11px] font-bold text-cyan-500 uppercase tracking-widest mb-3 px-1">Что умеет</h3>
            <div className="flex flex-col gap-2">
              <FeatureCard 
                icon={<Tag className="w-5 h-5 text-emerald-500" />}
                iconBg="bg-emerald-100 dark:bg-emerald-500/20"
                title="Сравнение цен"
                desc="6 магазинов одним тапом"
              />
              <FeatureCard 
                icon={<ShoppingCart className="w-5 h-5 text-sky-500" />}
                iconBg="bg-sky-100 dark:bg-sky-500/20"
                title="Умная корзина"
                desc="Считает экономию vs покупка в одном магазине"
              />
              <FeatureCard 
                icon={<ScanBarcode className="w-5 h-5 text-orange-500" />}
                iconBg="bg-orange-100 dark:bg-orange-500/20"
                title="Сканер штрих-кодов"
                desc="Камера → товар в каталоге"
              />
              <FeatureCard 
                icon={<Bell className="w-5 h-5 text-rose-500" />}
                iconBg="bg-rose-100 dark:bg-rose-500/20"
                title="Алерты на снижение"
                desc="Уведомим, когда товар подешевеет"
              />
            </div>
          </div>

          {/* Stores */}
          <div className="mb-6">
            <h3 className="text-[11px] font-bold text-cyan-500 uppercase tracking-widest mb-3 px-1">Сравниваем в:</h3>
            <div className="grid grid-cols-3 gap-2">
              {chainsData?.chains.map((chain) => (
                <StoreCard 
                  key={chain.id} 
                  name={chain.name} 
                  displayName={chain.name === "A-Store ADK" ? "A-Store" : chain.name === "Airba Fresh" ? "Airba" : chain.name} 
                  logoUrl={chain.logo}
                />
              ))}
            </div>
          </div>

          {/* Documents */}
          <div className="mb-6">
            <h3 className="text-[11px] font-bold text-cyan-500 uppercase tracking-widest mb-3 px-1">Документы</h3>
            <div className="bg-white dark:bg-zinc-900 rounded-2xl overflow-hidden shadow-sm border border-black/5 dark:border-white/5">
              <DocLink href="/privacy" title="Политика конфиденциальности" />
              <div className="h-px bg-black/5 dark:bg-white/5 mx-4" />
              <DocLink href="/public-offer" title="Публичная оферта" />
            </div>
          </div>

          {/* Support */}
          <div className="mb-8">
            <h3 className="text-[11px] font-bold text-cyan-500 uppercase tracking-widest mb-3 px-1">Поддержка</h3>
            <div className="bg-white dark:bg-zinc-900 rounded-2xl overflow-hidden shadow-sm border border-black/5 dark:border-white/5">
              <SupportLink 
                href="mailto:support@minprice.kz" 
                title="Написать нам" 
                subtitle="support@minprice.kz" 
              />
              <div className="h-px bg-black/5 dark:bg-white/5 mx-4" />
              <SupportLink 
                href="https://wa.me/77066989960" 
                title="WhatsApp" 
                subtitle="+7 (706) 698-99-60" 
                external
              />
            </div>
          </div>

          {/* Footer Info */}
          <div className="px-1 flex items-center justify-center mb-4">
            <div className="text-center">
              <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-0.5">Сделано в</div>
              <div className="text-sm font-bold text-foreground flex items-center justify-center gap-1.5">
                Казахстане <span className="text-base">🇰🇿</span>
              </div>
            </div>
          </div>
          
          <div className="text-[11px] text-muted-foreground text-center px-2 pb-6">
            Цены отображаются по данным партнёрских магазинов и могут отличаться от итоговых на кассе.
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}

function FeatureCard({ icon, iconBg, title, desc }: { icon: React.ReactNode, iconBg: string, title: string, desc: string }) {
  return (
    <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 flex items-center gap-4 shadow-sm border border-black/5 dark:border-white/5">
      <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${iconBg}`}>
        {icon}
      </div>
      <div>
        <div className="text-[15px] font-bold text-foreground mb-0.5">{title}</div>
        <div className="text-[12px] text-muted-foreground">{desc}</div>
      </div>
    </div>
  );
}

function StoreCard({ name, displayName, logoUrl }: { name: string; displayName: string; logoUrl?: string | null }) {
  return (
    <div className="bg-white dark:bg-zinc-900 rounded-2xl p-3 flex flex-col items-center justify-center gap-2 shadow-sm border border-black/5 dark:border-white/5 aspect-square">
      <div className="w-10 h-10 rounded-full flex items-center justify-center bg-secondary/30 overflow-hidden">
        <StoreLogo store={name} logoUrl={logoUrl} className="!w-10 !h-10 !rounded-none object-contain p-1" />
      </div>
      <div className="text-[11px] font-bold text-foreground text-center line-clamp-1 w-full">{displayName}</div>
    </div>
  );
}

function DocLink({ href, title }: { href: string, title: string }) {
  const isExternal = href.startsWith('http');
  const LinkComponent = isExternal ? 'a' : Link;
  const props = isExternal ? { target: "_blank", rel: "noopener noreferrer" } : {};

  return (
    <LinkComponent 
      to={isExternal ? undefined : href} 
      href={isExternal ? href : undefined}
      {...props as any}
      className="flex items-center justify-between p-4 hover:bg-secondary/20 transition-colors"
    >
      <div className="text-[15px] font-bold text-foreground">{title}</div>
      <ArrowUpRight className="w-5 h-5 text-muted-foreground/50" />
    </LinkComponent>
  );
}

function SupportLink({ href, title, subtitle, external }: { href: string, title: string, subtitle: string, external?: boolean }) {
  const LinkComponent = external || href.startsWith('mailto') ? 'a' : Link;
  const props = external ? { target: "_blank", rel: "noopener noreferrer" } : {};

  return (
    <LinkComponent 
      to={external || href.startsWith('mailto') ? undefined : href} 
      href={external || href.startsWith('mailto') ? href : undefined}
      {...props as any}
      className="flex items-center justify-between p-4 hover:bg-secondary/20 transition-colors"
    >
      <div>
        <div className="text-[15px] font-bold text-foreground mb-0.5">{title}</div>
        <div className="text-[13px] text-muted-foreground">{subtitle}</div>
      </div>
      <ArrowUpRight className="w-5 h-5 text-muted-foreground/50" />
    </LinkComponent>
  );
}
