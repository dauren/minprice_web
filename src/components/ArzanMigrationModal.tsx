import { useEffect, useState } from "react";
import { ArrowRight, Sparkles } from "lucide-react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import minpriceLogo from "@/assets/logo.png";
import arzanLockupIce from "@/assets/brand/arzan-lockup-ice-640.png";
import arzanMark from "@/assets/brand/arzan-logo-mark.png";

const DISMISS_KEY = "minprice_arzan_migration_dismissed_at";
const DISMISS_TTL_MS = 24 * 60 * 60 * 1000; // показываем снова через сутки
const YM_COUNTER_ID = 107056981;

// Метки, чтобы в аналитике arzan.kz было видно переходы с minprice.kz
export const ARZAN_URL =
  "https://arzan.kz/?utm_source=minprice.kz&utm_medium=referral&utm_campaign=rebrand_migration&utm_content=home_popup&from=minprice";

const shouldShow = () => {
  try {
    const dismissedAt = Number(localStorage.getItem(DISMISS_KEY));
    if (!dismissedAt) return true;
    return Date.now() - dismissedAt > DISMISS_TTL_MS;
  } catch {
    return true;
  }
};

const rememberDismiss = () => {
  try {
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
  } catch {
    /* приватный режим — просто покажем в следующий раз */
  }
};

const reachGoal = (goal: string) => {
  const ym = (window as unknown as { ym?: (id: number, method: string, goal: string) => void }).ym;
  if (typeof ym === "function") ym(YM_COUNTER_ID, "reachGoal", goal);
};

const ArzanMigrationModal = () => {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!shouldShow()) return;
    const timer = setTimeout(() => setOpen(true), 700);
    return () => clearTimeout(timer);
  }, []);

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (!next) rememberDismiss();
  };

  const handleGo = () => {
    rememberDismiss();
    reachGoal("arzan_migration_click");
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className="w-[calc(100%-2rem)] max-w-md gap-0 overflow-hidden rounded-2xl border-0 p-0 [&>button]:text-white/70 [&>button]:hover:text-white"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        {/* Шапка в фирменных цветах arzan.kz */}
        <div
          className="relative flex flex-col items-center overflow-hidden px-6 pb-8 pt-10 text-center"
          style={{ background: "linear-gradient(160deg, #15284E 0%, #1D3A78 55%, #2457C5 100%)" }}
        >
          {/* мягкое свечение фирменного голубого */}
          <div
            aria-hidden
            className="pointer-events-none absolute -top-16 left-1/2 h-40 w-56 -translate-x-1/2 rounded-full blur-3xl"
            style={{ background: "radial-gradient(closest-side, rgba(176,204,238,0.45), transparent)" }}
          />
          <img
            src={arzanLockupIce}
            alt="arzan.kz"
            className="relative z-10 h-11 w-auto object-contain drop-shadow-[0_4px_16px_rgba(0,0,0,0.35)]"
          />
          <p className="relative z-10 mt-4 text-sm font-medium" style={{ color: "#B0CCEE" }}>
            Мы переехали
          </p>
        </div>

        <div className="bg-white px-6 pb-6 pt-6 text-center dark:bg-[#0E1A33]">
          {/* minprice.kz → arzan.kz */}
          <div className="mb-5 flex items-center justify-center gap-3">
            <div className="flex flex-col items-center gap-1.5 opacity-60">
              <img src={minpriceLogo} alt="minprice.kz" className="h-10 w-10 object-contain grayscale" />
              <span className="text-[11px] text-muted-foreground line-through">minprice.kz</span>
            </div>

            <ArrowRight className="h-5 w-5 shrink-0" style={{ color: "#2F6FED" }} />

            <div className="flex flex-col items-center gap-1.5">
              <img src={arzanMark} alt="arzan.kz" className="h-12 w-12 object-contain" />
              <span className="text-[11px] font-semibold" style={{ color: "#2F6FED" }}>
                arzan.kz
              </span>
            </div>
          </div>

          <DialogTitle className="text-xl font-bold text-[#15284E] dark:text-white">
            minprice.kz теперь arzan.kz
          </DialogTitle>

          <DialogDescription className="mx-auto mt-2 max-w-xs text-sm leading-relaxed text-muted-foreground">
            Тот же сервис сравнения цен в супермаркетах — новое имя, новый дизайн и больше товаров.
          </DialogDescription>

          <a
            href={ARZAN_URL}
            onClick={handleGo}
            className="mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-xl text-base font-semibold text-white shadow-lg transition-transform hover:scale-[1.02] active:scale-[0.99]"
            style={{
              background: "linear-gradient(135deg, #2F6FED 0%, #2457C5 100%)",
              boxShadow: "0 10px 24px -10px rgba(47, 111, 237, 0.9)",
            }}
          >
            <Sparkles className="h-4 w-4" />
            Перейти на arzan.kz
          </a>

          <button
            type="button"
            onClick={() => handleOpenChange(false)}
            className="mt-3 text-xs text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline"
          >
            Остаться пока здесь
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ArzanMigrationModal;
