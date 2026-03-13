# Product Module

## Files

- `src/pages/ProductPage.tsx` — Product detail with price comparison and history chart
- `src/components/ProductCard.tsx` — Card component used in listings
- `src/components/StoreLogo.tsx` — Chain logo display (API URL + local fallback)
- `src/hooks/useApi.ts` → `useProduct(uuid)`, `usePriceHistory(uuid)`
- `src/lib/transformers.ts` — API → UI model transformation

## Product Page Flow

1. Route: `/product/:id` (id = product UUID)
2. `useProduct(uuid)` fetches detail with `price_range` (store comparison)
3. `usePriceHistory(uuid)` fetches chart data (default 180 days)
4. Price history rendered via Recharts line chart
5. Store prices displayed with logos, discount badges, external links

## Data Transformation

API `stores[]` → UI `StorePrice[]`:
- Logo URL: adds `/media/` prefix if relative path
- Discount: calculated from `price` vs `previous_price`
- Color: assigned per chain via `getStoreColor()`

## SSR Meta Tags

`server.js` intercepts bot requests to `/product/:id`:
- Fetches product from API
- Injects OG title, description, image, price
- Enables rich previews in Telegram, WhatsApp, etc.
