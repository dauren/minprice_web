import { Link } from "react-router-dom";
import { Drawer, DrawerContent, DrawerTitle } from "@/components/ui/drawer";
import { X, Tag, ShoppingCart, ScanBarcode, Bell, ArrowUpRight } from "lucide-react";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";

import logo from "@/assets/logo.png";
import StoreLogo from "@/components/StoreLogo";
import { useChains } from "@/hooks/useApi";
import { t } from "@/lib/i18n";

interface AboutModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AboutModal({ open, onOpenChange }: AboutModalProps) {
  const { data: chainsData } = useChains();

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="mx-auto flex max-h-[80vh] w-full max-w-md flex-col overflow-hidden border-t border-black/10 bg-white p-0">
        <VisuallyHidden>
          <DrawerTitle>{t.about.drawerTitle}</DrawerTitle>
        </VisuallyHidden>

        <div className="overflow-y-auto px-4 pb-5 pt-2 sm:px-6 custom-scrollbar">
          {/* Header Card */}
          <div className="relative mb-6 border border-black/10 bg-white p-5">
            <button
              onClick={() => onOpenChange(false)}
              className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center bg-white text-black/45 transition-colors hover:text-black"
            >
              <X className="w-4 h-4 text-foreground" />
            </button>

            <div className="flex items-start gap-3 mb-4">
              <img src={logo} alt="arzan.kz" className="w-16 h-16 object-contain" />
              <div className="pt-1">
                <div className="mb-1 inline-flex items-center text-[11px] font-medium text-black/45">
                  Арзан баға
                </div>
                <div className="text-[11px] text-muted-foreground leading-tight">
                  Алматы, Астана, Шымкент
                </div>
              </div>
            </div>

            <div>
              <div className="az-logo flex items-baseline text-3xl text-black">
                Arzan.kz
              </div>
              <div className="text-base text-muted-foreground font-medium mt-1">
                {t.about.tagline}
              </div>
            </div>
          </div>

          {/* Features */}
          <div className="mb-6">
            <h3 className="text-[11px] font-bold text-primary uppercase tracking-widest mb-3 px-1">{t.about.featuresHeading}</h3>
            <div className="flex flex-col gap-2">
              <FeatureCard
                icon={<Tag className="w-5 h-5 text-emerald-500" />}
                iconBg="bg-emerald-100 dark:bg-emerald-500/20"
                title={t.about.feature1Title}
                desc={t.about.feature1Desc}
              />
              <FeatureCard
                icon={<ShoppingCart className="w-5 h-5 text-sky-500" />}
                iconBg="bg-sky-100 dark:bg-sky-500/20"
                title={t.about.feature2Title}
                desc={t.about.feature2Desc}
              />
              <FeatureCard
                icon={<ScanBarcode className="w-5 h-5 text-orange-500" />}
                iconBg="bg-orange-100 dark:bg-orange-500/20"
                title={t.about.feature3Title}
                desc={t.about.feature3Desc}
              />
              <FeatureCard
                icon={<Bell className="w-5 h-5 text-rose-500" />}
                iconBg="bg-rose-100 dark:bg-rose-500/20"
                title={t.about.feature4Title}
                desc={t.about.feature4Desc}
              />
            </div>
          </div>

          {/* Stores */}
          <div className="mb-6">
            <h3 className="text-[11px] font-bold text-primary uppercase tracking-widest mb-3 px-1">{t.about.storesHeading}</h3>
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
            <h3 className="text-[11px] font-bold text-primary uppercase tracking-widest mb-3 px-1">{t.about.docsHeading}</h3>
            <div className="overflow-hidden border border-black/10 bg-white">
              <DocLink href="/privacy" title={t.about.privacy} />
              <div className="h-px bg-black/5 dark:bg-white/5 mx-4" />
              <DocLink href="/public-offer" title={t.about.publicOffer} />
            </div>
          </div>

          {/* Support */}
          <div className="mb-8">
            <h3 className="text-[11px] font-bold text-primary uppercase tracking-widest mb-3 px-1">{t.about.supportHeading}</h3>
            <div className="overflow-hidden border border-black/10 bg-white">
              <SupportLink
                href="mailto:support@arzan.kz"
                title={t.about.contactUs}
                subtitle="support@arzan.kz"
              />
              <div className="h-px bg-black/5 dark:bg-white/5 mx-4" />
              <SupportLink
                href="mailto:api@arzan.kz"
                title={t.about.apiAccess}
                subtitle="api@arzan.kz"
              />
              <div className="h-px bg-black/5 dark:bg-white/5 mx-4" />
              <SupportLink
                href="https://wa.me/77066989960"
                title={t.about.whatsapp}
                subtitle="+7 (706) 698-99-60"
                external
              />
            </div>
          </div>

          {/* Footer Info */}
          <div className="px-1 flex items-center justify-center mb-4">
            <div className="text-center">
              <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-0.5">{t.about.madeIn}</div>
              <div className="text-sm font-bold text-foreground flex items-center justify-center gap-1.5">
                {t.about.madeInCountry} <span className="text-base">🇰🇿</span>
              </div>
            </div>
          </div>

          <div className="text-[11px] text-muted-foreground text-center px-2 pb-6">
            {t.about.disclaimer}
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}

function FeatureCard({ icon, iconBg, title, desc }: { icon: React.ReactNode, iconBg: string, title: string, desc: string }) {
  return (
    <div className="flex items-center gap-4 border border-black/10 bg-white p-4">
      <div className={`flex h-10 w-10 shrink-0 items-center justify-center ${iconBg}`}>
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
    <div className="flex aspect-square flex-col items-center justify-center gap-2 border border-black/10 bg-white p-3">
      <div className="flex h-10 w-10 items-center justify-center overflow-hidden bg-black/[0.03]">
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
