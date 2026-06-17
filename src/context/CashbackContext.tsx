import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { apiClient, API_ENDPOINTS } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

export interface CashbackChain {
  id: number;
  name: string;
  slug: string;
  source: string;
  logo: string | null;
}

interface CashbackResponse {
  enabled_chains: CashbackChain[];
  rates: Record<string, number>; // { "<chain_id>": percent }
}

interface CashbackContextValue {
  enabledChains: CashbackChain[];
  rates: Record<string, number>;
  loading: boolean;
  // Display preference: apply to the price (true) or just show the cashback aside (false).
  applyEnabled: boolean;
  toggleApply: () => void;
  setApplyEnabled: (v: boolean) => void;
  // Helpers (return 0 when no cashback / not logged in).
  getPercent: (chainId?: number) => number;
  effectivePrice: (price: number, chainId?: number) => number;
  setRate: (chainId: number, percent: number) => Promise<void>;
  refresh: () => Promise<void>;
}

const APPLY_KEY = "minprice_cashback_apply";

const CashbackContext = createContext<CashbackContextValue | undefined>(undefined);

export const CashbackProvider = ({ children }: { children: ReactNode }) => {
  const { isAuthenticated } = useAuth();
  const [enabledChains, setEnabledChains] = useState<CashbackChain[]>([]);
  const [rates, setRates] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);
  const [applyEnabled, setApplyEnabledState] = useState<boolean>(
    () => localStorage.getItem(APPLY_KEY) === "1"
  );

  const setApplyEnabled = useCallback((v: boolean) => {
    setApplyEnabledState(v);
    localStorage.setItem(APPLY_KEY, v ? "1" : "0");
  }, []);
  const toggleApply = useCallback(() => setApplyEnabled(!applyEnabled), [applyEnabled, setApplyEnabled]);

  const refresh = useCallback(async () => {
    if (!isAuthenticated) {
      setEnabledChains([]);
      setRates({});
      return;
    }
    setLoading(true);
    try {
      const data = await apiClient.get<CashbackResponse>(API_ENDPOINTS.cashback());
      setEnabledChains(data.enabled_chains || []);
      setRates(data.rates || {});
    } catch (e) {
      console.error("Failed to load cashback:", e);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  // Load (and clear on logout) whenever auth state changes.
  useEffect(() => { refresh(); }, [refresh]);

  const setRate = useCallback(async (chainId: number, percent: number) => {
    // Optimistic local update, then persist.
    setRates((prev) => {
      const next = { ...prev };
      if (percent > 0) next[String(chainId)] = percent;
      else delete next[String(chainId)];
      return next;
    });
    try {
      const data = await apiClient.patch<CashbackResponse>(API_ENDPOINTS.cashback(), {
        rates: { [String(chainId)]: percent },
      });
      setRates(data.rates || {});
    } catch (e) {
      console.error("Failed to save cashback rate:", e);
      await refresh(); // revert to server truth
    }
  }, [refresh]);

  const getPercent = useCallback(
    (chainId?: number) => (chainId == null ? 0 : (rates[String(chainId)] || 0)),
    [rates]
  );

  const effectivePrice = useCallback(
    (price: number, chainId?: number) => {
      const pct = getPercent(chainId);
      return pct > 0 ? price * (1 - pct / 100) : price;
    },
    [getPercent]
  );

  return (
    <CashbackContext.Provider
      value={{
        enabledChains, rates, loading, applyEnabled, toggleApply, setApplyEnabled,
        getPercent, effectivePrice, setRate, refresh,
      }}
    >
      {children}
    </CashbackContext.Provider>
  );
};

export const useCashback = () => {
  const ctx = useContext(CashbackContext);
  if (!ctx) throw new Error("useCashback must be used within CashbackProvider");
  return ctx;
};
