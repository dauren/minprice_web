import { createContext, useContext, useState, useEffect, useRef, useCallback, ReactNode } from "react";
import { apiClient, API_ENDPOINTS, ApiError } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface FavoritesContextValue {
  isFavorite: (uuid: string) => boolean;
  count: number;
  toggleFavorite: (uuid: string) => void;
  isLoading: boolean;
  refresh: () => Promise<void>;
}

// Collapses rapid on/off spamming of the same heart into a single request.
const DEBOUNCE_MS = 350;

const FavoritesContext = createContext<FavoritesContextValue | undefined>(undefined);

export const FavoritesProvider = ({ children }: { children: ReactNode }) => {
  const { isAuthenticated, promptLogin } = useAuth();
  const { toast } = useToast();
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);

  // Kept in refs to avoid stale closures inside debounced callbacks:
  //  - syncedRef  = last state confirmed by the server (truth)
  //  - desiredRef = what the user wants now (drives the UI)
  //  - timersRef  = per-uuid debounce timers
  const syncedRef = useRef<Set<string>>(new Set());
  const desiredRef = useRef<Set<string>>(new Set());
  const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const hydrate = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await apiClient.get<{ product_uuids: string[] }>(API_ENDPOINTS.favoriteIds());
      const ids = new Set(data.product_uuids || []);
      syncedRef.current = new Set(ids);
      desiredRef.current = new Set(ids);
      setFavoriteIds(ids);
    } catch (e) {
      console.error("Failed to load favorites:", e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Runs on mount and whenever auth flips (login merges guest favorites server-side).
  useEffect(() => { hydrate(); }, [isAuthenticated, hydrate]);

  const revertToSynced = useCallback((uuid: string) => {
    if (syncedRef.current.has(uuid)) desiredRef.current.add(uuid);
    else desiredRef.current.delete(uuid);
    setFavoriteIds(new Set(desiredRef.current));
  }, []);

  const flush = useCallback(async (uuid: string) => {
    timersRef.current.delete(uuid);
    const desired = desiredRef.current.has(uuid);
    if (desired === syncedRef.current.has(uuid)) return; // already in sync, nothing to send

    try {
      if (desired) {
        await apiClient.post(API_ENDPOINTS.favorites(), { product_uuid: uuid });
        syncedRef.current.add(uuid);
      } else {
        await apiClient.delete(API_ENDPOINTS.favoriteRemove(uuid));
        syncedRef.current.delete(uuid);
      }
    } catch (e) {
      if (e instanceof ApiError && e.status === 403) {
        revertToSynced(uuid); // cap reached — undo the optimistic add
        if (e.data?.require_auth) {
          promptLogin();
          toast({
            title: "Войдите, чтобы сохранить больше",
            description: `Гостям доступно до ${e.data?.limit ?? 10} избранных — войдите, чтобы хранить больше.`,
          });
        } else {
          toast({
            title: "Достигнут лимит избранного",
            description: `Максимум ${e.data?.limit ?? 50} товаров.`,
          });
        }
        return;
      }
      console.error("Favorite sync failed:", e);
      revertToSynced(uuid);
    }
  }, [promptLogin, toast, revertToSynced]);

  const toggleFavorite = useCallback((uuid: string) => {
    // Optimistic flip — UI updates instantly, request is debounced below.
    if (desiredRef.current.has(uuid)) desiredRef.current.delete(uuid);
    else desiredRef.current.add(uuid);
    setFavoriteIds(new Set(desiredRef.current));

    const existing = timersRef.current.get(uuid);
    if (existing) clearTimeout(existing);
    timersRef.current.set(uuid, setTimeout(() => flush(uuid), DEBOUNCE_MS));
  }, [flush]);

  const isFavorite = useCallback((uuid: string) => favoriteIds.has(uuid), [favoriteIds]);

  return (
    <FavoritesContext.Provider
      value={{ isFavorite, count: favoriteIds.size, toggleFavorite, isLoading, refresh: hydrate }}
    >
      {children}
    </FavoritesContext.Provider>
  );
};

export const useFavorites = () => {
  const ctx = useContext(FavoritesContext);
  if (!ctx) throw new Error("useFavorites must be used within FavoritesProvider");
  return ctx;
};
