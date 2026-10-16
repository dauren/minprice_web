import { beforeEach, describe, expect, it, vi } from "vitest";
import { apiClient } from "@/lib/api";
import { invalidateCartReads, readCartList } from "@/lib/cartReads";

const state = vi.hoisted(() => ({ guest: "guest-a", token: null as string | null }));
vi.mock("@/lib/api", () => ({
  apiClient: { get: vi.fn() },
  API_ENDPOINTS: { carts: () => "/carts/" },
  ensureGuestSession: vi.fn(async () => state.guest),
  getGuestUuid: () => state.guest,
}));

const deferred = <T,>() => {
  let resolve!: (value: T) => void;
  let reject!: (error: Error) => void;
  const promise = new Promise<T>((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
};

beforeEach(() => {
  invalidateCartReads();
  vi.mocked(apiClient.get).mockReset();
  state.guest = "guest-a";
  state.token = null;
});

describe("cart metadata requests", () => {
  it("shares twenty unfinished reads, sends compact=true, and never caches completed data", async () => {
    const gate = deferred<{ results: [] }>();
    vi.mocked(apiClient.get).mockReturnValue(gate.promise);
    const requests = Array.from({ length: 20 }, () => readCartList());
    await vi.waitFor(() => expect(apiClient.get).toHaveBeenCalledTimes(1));
    expect(apiClient.get).toHaveBeenCalledWith("/carts/?compact=true", expect.any(AbortSignal));
    gate.resolve({ results: [] });
    await Promise.all(requests);
    vi.mocked(apiClient.get).mockResolvedValue({ results: [] });
    await readCartList();
    expect(apiClient.get).toHaveBeenCalledTimes(2);
  });

  it("keeps active and all-cart reads separate", async () => {
    vi.mocked(apiClient.get).mockResolvedValue({ results: [] });
    await Promise.all([readCartList(), readCartList(true)]);
    expect(apiClient.get).toHaveBeenCalledTimes(2);
    expect(apiClient.get).toHaveBeenCalledWith("/carts/?is_active=true&compact=true", expect.any(AbortSignal));
  });

  it("starts a new request for a new guest and discards the old answer", async () => {
    const gate = deferred<{ results: [] }>();
    vi.mocked(apiClient.get).mockReturnValueOnce(gate.promise).mockResolvedValue({ results: [] });
    const old = readCartList();
    const rejected = expect(old).rejects.toMatchObject({ name: "AbortError" });
    await vi.waitFor(() => expect(apiClient.get).toHaveBeenCalledTimes(1));
    state.guest = "guest-b";
    await readCartList();
    gate.resolve({ results: [] });
    await rejected;
    expect(apiClient.get).toHaveBeenCalledTimes(2);
  });

  it("aborts obsolete reads after a write without deleting a replacement request", async () => {
    const oldGate = deferred<{ results: [] }>();
    const newGate = deferred<{ results: [] }>();
    vi.mocked(apiClient.get).mockReturnValueOnce(oldGate.promise).mockReturnValue(newGate.promise);
    const old = readCartList();
    const rejected = expect(old).rejects.toMatchObject({ name: "AbortError" });
    await vi.waitFor(() => expect(apiClient.get).toHaveBeenCalledTimes(1));
    const signal = vi.mocked(apiClient.get).mock.calls[0][1];
    invalidateCartReads();
    expect(signal?.aborted).toBe(true);
    const fresh = readCartList();
    await vi.waitFor(() => expect(apiClient.get).toHaveBeenCalledTimes(2));
    oldGate.resolve({ results: [] }); await rejected;
    const joining = readCartList();
    newGate.resolve({ results: [] });
    await Promise.all([fresh, joining]);
    expect(apiClient.get).toHaveBeenCalledTimes(2);
  });

  it("lets a later caller retry after a shared failure", async () => {
    const failure = new Error("offline");
    vi.mocked(apiClient.get).mockRejectedValueOnce(failure).mockResolvedValue({ results: [] });
    const first = await Promise.allSettled([readCartList(), readCartList()]);
    expect(first).toEqual([{ status: "rejected", reason: failure }, { status: "rejected", reason: failure }]);
    await readCartList();
    expect(apiClient.get).toHaveBeenCalledTimes(2);
  });

});
