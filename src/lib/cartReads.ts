import { apiClient, API_ENDPOINTS, ensureGuestSession, getGuestUuid } from "@/lib/api";


interface CartMetadata {
  uuid: string;
  name?: string;
  is_active?: boolean;
  items_count?: number;
  item_count?: number;
  created_at?: string;
  updated_at?: string;
}
interface CartListResponse { results?: CartMetadata[] }

// Share unfinished reads only. An invalidation aborts obsolete transport; a failed
// read never sticks around as a cached failure. Values contain no product graph.
const pending = new Map<string, { controller: AbortController; promise: Promise<unknown> }>();
let revision = 0;
const identity = () => getGuestUuid();

export const invalidateCartReads = () => {
  revision++;
  for (const flight of pending.values()) flight.controller.abort();
  pending.clear();
};

export const isCartReadCancelled = (error: unknown) =>
  error instanceof Error && error.name === "AbortError";

const read = async <T>(endpoint: string): Promise<T> => {
  const requested = revision;
  await ensureGuestSession();
  if (requested !== revision) throw new DOMException("Cart context changed", "AbortError");
  const owner = identity();
  const key = JSON.stringify([owner, endpoint]);
  const existing = pending.get(key);
  if (existing) return existing.promise as Promise<T>;
  const controller = new AbortController();
  const flight = {
    controller,
    promise: Promise.resolve(undefined) as Promise<T>,
  };
  flight.promise = apiClient.get<T>(endpoint, controller.signal).then((result) => {
    if (controller.signal.aborted || owner !== identity()) {
      throw new DOMException("Cart context changed", "AbortError");
    }
    return result;
  }).finally(() => {
    if (pending.get(key) === flight) pending.delete(key);
  });
  pending.set(key, flight);
  return flight.promise;
};

export const readCartList = (active = false): Promise<CartListResponse> =>
  read(`${API_ENDPOINTS.carts()}?${active ? "is_active=true&" : ""}compact=true`);

export const readCartSummary = <T>(uuid: string, cityId: number): Promise<T> =>
  read<T>(API_ENDPOINTS.cartSummary(uuid, cityId));
