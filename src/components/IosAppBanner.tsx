import { X } from "lucide-react";
import { useEffect, useState } from "react";
import logo from "@/assets/logo.png";

const APP_LINK =
  "https://6296656.redirect.appmetrica.yandex.com?appmetrica_tracking_id=1182757017622684277&referrer=reattribution%3D1";

const DISMISSED_KEY = "minprice_ios_app_banner_dismissed_at";
const DISMISS_DAYS = 7;

const isRecentlyDismissed = () => {
  try {
    const dismissedAt = Number(localStorage.getItem(DISMISSED_KEY));
    if (!dismissedAt) return false;

    const maxAge = DISMISS_DAYS * 24 * 60 * 60 * 1000;
    return Date.now() - dismissedAt < maxAge;
  } catch {
    return false;
  }
};

const IosAppBanner = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(!isRecentlyDismissed());
  }, []);

  const dismiss = () => {
    try {
      localStorage.setItem(DISMISSED_KEY, String(Date.now()));
    } catch {
      // Ignore storage failures in private browsing modes.
    }
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="bg-background px-3 pt-[calc(env(safe-area-inset-top)+0.5rem)] pb-2 sm:pt-3">
      <div className="mx-auto flex max-w-md items-center gap-3 rounded-2xl border border-border/80 bg-card/95 px-3 py-2.5 shadow-[0_12px_36px_hsl(195_85%_48%/0.16)] backdrop-blur-xl sm:max-w-6xl sm:px-4">
        <img
          src={logo}
          alt="minprice.kz"
          className="h-11 w-11 shrink-0 rounded-xl object-contain"
        />

        <div className="min-w-0 flex-1">
          <p className="truncate text-[15px] font-bold leading-tight text-foreground">
            minprice.kz
          </p>
          <p className="mt-0.5 truncate text-xs leading-tight text-muted-foreground">
            Открыть приложение для сравнения цен
          </p>
        </div>

        <a
          href={APP_LINK}
          className="shrink-0 rounded-full bg-primary px-4 py-2 text-sm font-bold leading-none text-primary-foreground shadow-[0_8px_18px_hsl(195_85%_48%/0.24)]"
        >
          Открыть
        </a>

        <button
          type="button"
          onClick={dismiss}
          aria-label="Скрыть баннер приложения"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-secondary text-muted-foreground transition-colors hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

export default IosAppBanner;
