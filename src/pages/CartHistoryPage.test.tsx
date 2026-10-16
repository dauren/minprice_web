import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, expect, it, vi } from "vitest";
import CartHistoryPage from "@/pages/CartHistoryPage";
import { apiClient } from "@/lib/api";
import { invalidateCartReads } from "@/lib/cartReads";

vi.mock("@/components/Header", () => ({ default: () => <div /> }));
vi.mock("@/context/CartContext", () => ({
  useCart: () => ({ cartUuid: null, fetchCart: vi.fn(), deleteCart: vi.fn() }),
}));
vi.mock("@/lib/api", () => ({
  apiClient: { get: vi.fn() },
  API_ENDPOINTS: { carts: () => "/carts/" },
  ensureGuestSession: async () => "guest",
  getGuestUuid: () => "guest",
}));

beforeEach(() => { invalidateCartReads(); vi.mocked(apiClient.get).mockReset(); });

it("renders counts from compact metadata without loading a summary for every archived cart", async () => {
  vi.mocked(apiClient.get).mockResolvedValue({ results: [
    { uuid: "first", name: "Weekly", is_active: false, items_count: 82, created_at: "2026-10-16T00:00:00Z" },
    { uuid: "second", name: "Saved", is_active: false, items_count: 4, created_at: "2026-10-15T00:00:00Z" },
  ] });
  render(<MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}><CartHistoryPage /></MemoryRouter>);
  expect(await screen.findByText("Weekly")).toBeVisible();
  expect(screen.getByText(/82 товаров/)).toBeVisible();
  expect(screen.getByText("Saved")).toBeVisible();
  expect(apiClient.get).toHaveBeenCalledTimes(1);
  expect(apiClient.get).toHaveBeenCalledWith("/carts/?compact=true", expect.any(AbortSignal));
});
