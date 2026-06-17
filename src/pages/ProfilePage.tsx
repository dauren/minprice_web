import { useState } from "react";
import { UserCircle } from "lucide-react";
import Header from "@/components/Header";
import PageMeta from "@/components/PageMeta";
import StoreLogo from "@/components/StoreLogo";
import { useAuth } from "@/context/AuthContext";
import { useCashback, CashbackChain } from "@/context/CashbackContext";

// One chain row: local input state, commits to backend on blur / Enter.
const CashbackRow = ({ chain }: { chain: CashbackChain }) => {
  const { getPercent, setRate } = useCashback();
  const [value, setValue] = useState<string>(() => {
    const p = getPercent(chain.id);
    return p ? String(p) : "";
  });

  const commit = () => {
    const pct = value === "" ? 0 : Math.max(0, Math.min(100, parseFloat(value) || 0));
    setValue(pct ? String(pct) : "");
    setRate(chain.id, pct);
  };

  return (
    <div className="flex items-center justify-between gap-3 border-b border-border py-3">
      <div className="flex items-center gap-2.5 min-w-0">
        <StoreLogo store={chain.name} logoUrl={chain.logo || undefined} size="md" />
        <span className="text-sm font-medium text-black truncate">{chain.name}</span>
      </div>
      <div className="flex items-center gap-1.5 shrink-0">
        <input
          type="number"
          inputMode="decimal"
          min={0}
          max={100}
          step={0.5}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); }}
          placeholder="0"
          className="h-9 w-20 bg-white px-2 text-right text-sm font-medium text-black focus:outline-none border border-border"
        />
        <span className="text-sm text-black/45">%</span>
      </div>
    </div>
  );
};

const ProfilePage = () => {
  const { isAuthenticated, user, loading } = useAuth();
  const { enabledChains, applyEnabled, toggleApply, loading: cbLoading } = useCashback();

  return (
    <div className="min-h-screen bg-background pb-32 sm:pb-16">
      <PageMeta title="Профиль" description="Профиль и настройки на arzan.kz" url="/profile" />
      <Header />

      <div className="mx-auto max-w-2xl px-3 pt-4 sm:px-6 sm:pt-6">
        <div className="mb-5 flex items-center gap-3 pb-3">
          <div className="flex h-10 w-10 items-center justify-center bg-white text-black">
            <UserCircle className="h-5 w-5" />
          </div>
          <div>
            <span className="az-kicker mb-1">account</span>
            <h1 className="text-2xl font-semibold text-black sm:text-3xl">Профиль</h1>
          </div>
        </div>

        {loading ? (
          <div className="h-24 bg-secondary/50 animate-pulse" />
        ) : !isAuthenticated ? (
          <div className="mx-auto max-w-md bg-white py-14 text-center">
            <p className="font-medium text-black">Войдите, чтобы настроить профиль</p>
            <p className="text-xs text-muted-foreground mt-1.5">Кэшбэк и предпочтения доступны после входа.</p>
          </div>
        ) : (
          <>
            {/* User */}
            <div className="mb-6 flex items-center gap-3 bg-white p-4">
              {user?.avatar_url ? (
                <img src={user.avatar_url} alt="" className="h-12 w-12 rounded-full object-cover" />
              ) : (
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent text-lg font-semibold">
                  {(user?.first_name || user?.email || "?").charAt(0).toUpperCase()}
                </div>
              )}
              <div className="min-w-0">
                <p className="text-sm font-medium text-black truncate">
                  {[user?.first_name, user?.last_name].filter(Boolean).join(" ") || user?.email || "Профиль"}
                </p>
                {user?.email && <p className="text-xs text-black/45 truncate">{user.email}</p>}
              </div>
            </div>

            {/* Cashback */}
            <div className="bg-white p-4">
              <div className="mb-3 flex items-center justify-between gap-3 border-b-2 border-foreground pb-2">
                <h2 className="text-sm font-semibold text-black">Кэшбэк</h2>
                <label className="flex items-center gap-2 text-xs font-medium text-black/60 cursor-pointer">
                  <input type="checkbox" checked={applyEnabled} onChange={toggleApply} className="accent-[#148a42]" />
                  Учитывать в ценах
                </label>
              </div>

              <p className="mb-2 text-xs text-muted-foreground">
                Укажите свой кэшбэк по сетям (например, по карте). Цены с учётом кэшбэка
                {applyEnabled ? " показываются в цене." : " показываются в скобках рядом с ценой."}
              </p>

              {cbLoading ? (
                <div className="h-20 bg-secondary/40 animate-pulse" />
              ) : enabledChains.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">
                  Кэшбэк пока недоступен ни для одной сети.
                </p>
              ) : (
                <div>
                  {enabledChains.map((c) => <CashbackRow key={c.id} chain={c} />)}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ProfilePage;
