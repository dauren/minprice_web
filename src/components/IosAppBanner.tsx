import { X } from "lucide-react";
import { useEffect, useState } from "react";
import logo from "@/assets/logo.png";

const APP_LINK =
  "https://6296656.redirect.appmetrica.yandex.com?appmetrica_tracking_id=1182757017622684277&referrer=reattribution%3D1";

const DISMISSED_KEY = "arzan_ios_app_banner_dismissed_at";
const DISMISS_DAYS = 7;

const isIosDevice = () => {
  if (typeof window === "undefined") return false;

  const ua = window.navigator.userAgent;
  const platform = window.navigator.platform;
  const maxTouchPoints = window.navigator.maxTouchPoints || 0;
  const standalone = window.matchMedia("(display-mode: standalone)").matches;

  const isiPhoneOrIPad = /iPad|iPhone|iPod/.test(ua);
  const iPadOsDesktopMode = platform === "MacIntel" && maxTouchPoints > 1;

  return !standalone && (isiPhoneOrIPad || iPadOsDesktopMode);
};

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
    setVisible(isIosDevice() && !isRecentlyDismissed());
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
    <div className="sm:hidden bg-background px-3 pt-[calc(env(safe-area-inset-top)+0.5rem)] pb-2">
      <div className="mx-auto flex max-w-md items-center gap-3 bg-white px-3 py-2.5">
        <img
          src={logo}
          alt="arzan.kz"
          className="h-11 w-11 shrink-0 object-contain"
        />

        <div className="min-w-0 flex-1">
          <p className="truncate text-[15px] font-bold leading-tight text-foreground">
            arzan.kz
          </p>
          <p className="mt-0.5 truncate text-xs leading-tight text-muted-foreground">
            Открыть приложение для сравнения цен
          </p>
        </div>

        <a
          href={APP_LINK}
          className="shrink-0 bg-[#148a42]/10 px-4 py-2 text-sm font-medium leading-none text-[#148a42]"
        >
          Открыть
        </a>

        <button
          type="button"
          onClick={dismiss}
          aria-label="Скрыть баннер приложения"
          className="flex h-8 w-8 shrink-0 items-center justify-center bg-white text-black/45 transition-colors hover:text-black"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

export default IosAppBanner;
