import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { LogIn, LogOut, User as UserIcon, Settings } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { TelegramLoginButton } from "@/components/TelegramLoginButton";

/**
 * Header entry point for auth: shows a "Войти" button when logged out
 * (opens a small panel with the Telegram Login Widget) and an avatar +
 * logout menu when logged in.
 */
const AuthButton = () => {
  const { user, isAuthenticated, logout, loading, loginPromptNonce } = useAuth();
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  // Open the login panel when a feature (e.g. favorites cap) requests it.
  useEffect(() => {
    if (loginPromptNonce > 0 && !isAuthenticated) setOpen(true);
  }, [loginPromptNonce, isAuthenticated]);

  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  if (loading) {
    return <div className="w-8 h-8 rounded-full bg-accent animate-pulse" aria-hidden />;
  }

  const displayName = user
    ? [user.first_name, user.last_name].filter(Boolean).join(" ") || user.email || "Профиль"
    : "";
  const initial = (user?.first_name || user?.email || "?").charAt(0).toUpperCase();

  return (
    <div className="relative" ref={wrapRef}>
      {isAuthenticated ? (
        <button
          onClick={() => setOpen((v) => !v)}
          className="flex items-center justify-center w-8 h-8 rounded-full overflow-hidden bg-accent text-foreground hover:ring-2 hover:ring-border transition-all"
          aria-label="Профиль"
        >
          {user?.avatar_url ? (
            <img src={user.avatar_url} alt="" className="w-full h-full object-cover" />
          ) : (
            <span className="text-sm font-semibold">{initial}</span>
          )}
        </button>
      ) : (
        <button
          onClick={() => setOpen((v) => !v)}
          className="flex items-center gap-1.5 h-8 px-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-all"
        >
          <LogIn className="w-4 h-4" />
          <span className="hidden sm:inline">Войти</span>
        </button>
      )}

      {open && (
        <div className="absolute right-0 mt-2 w-56 rounded-xl border border-border bg-card shadow-lg p-3 z-50">
          {isAuthenticated ? (
            <>
              <div className="flex items-center gap-2 px-1 pb-2 mb-2 border-b border-border">
                <UserIcon className="w-4 h-4 text-muted-foreground shrink-0" />
                <span className="text-sm font-medium text-foreground truncate">{displayName}</span>
              </div>
              <Link
                to="/profile"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2 w-full px-1 py-1.5 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-accent transition-all"
              >
                <Settings className="w-4 h-4" />
                Профиль и кэшбэк
              </Link>
              <button
                onClick={() => {
                  logout();
                  setOpen(false);
                }}
                className="flex items-center gap-2 w-full px-1 py-1.5 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-accent transition-all"
              >
                <LogOut className="w-4 h-4" />
                Выйти
              </button>
            </>
          ) : (
            <div className="flex flex-col gap-2">
              <p className="text-sm text-muted-foreground px-1">Войдите, чтобы сохранять корзины и предпочтения.</p>
              <TelegramLoginButton onSuccess={() => setOpen(false)} />
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AuthButton;
