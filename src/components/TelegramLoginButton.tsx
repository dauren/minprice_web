import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { useAuth, TelegramAuthData } from "@/context/AuthContext";

// Bot @username (without @). Set in .env: VITE_TELEGRAM_BOT_USERNAME=MinPriceLoginBot
const BOT_USERNAME = import.meta.env.VITE_TELEGRAM_BOT_USERNAME as string | undefined;

declare global {
  interface Window {
    onTelegramAuth?: (user: TelegramAuthData) => void;
  }
}

interface Props {
  size?: "small" | "medium" | "large";
  onSuccess?: () => void;
}

/**
 * Renders the official Telegram Login Widget.
 * Requires the bot's domain to be registered via @BotFather /setdomain — the
 * widget will not render on a domain that does not match. (localhost won't work.)
 */
export const TelegramLoginButton = ({ size = "medium", onSuccess }: Props) => {
  const ref = useRef<HTMLDivElement>(null);
  const { loginWithTelegram } = useAuth();

  useEffect(() => {
    if (!BOT_USERNAME || !ref.current) return;

    window.onTelegramAuth = async (tgUser) => {
      try {
        await loginWithTelegram(tgUser);
        toast.success("Вы вошли через Telegram");
        onSuccess?.();
      } catch (e) {
        toast.error("Не удалось войти через Telegram");
      }
    };

    const script = document.createElement("script");
    script.src = "https://telegram.org/js/telegram-widget.js?22";
    script.async = true;
    script.setAttribute("data-telegram-login", BOT_USERNAME);
    script.setAttribute("data-size", size);
    script.setAttribute("data-userpic", "false");
    script.setAttribute("data-request-access", "write");
    script.setAttribute("data-onauth", "onTelegramAuth(user)");

    const container = ref.current;
    container.appendChild(script);

    return () => {
      container.innerHTML = "";
      delete window.onTelegramAuth;
    };
  }, [loginWithTelegram, size, onSuccess]);

  if (!BOT_USERNAME) {
    if (import.meta.env.DEV) {
      console.warn("VITE_TELEGRAM_BOT_USERNAME is not set — Telegram login button hidden.");
    }
    return null;
  }

  return <div ref={ref} className="inline-block" />;
};
