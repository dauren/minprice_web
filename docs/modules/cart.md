# Cart Module

## Files

- `src/context/CartContext.tsx` — Cart state provider (active cart, items, CRUD operations)
- `src/pages/CartPage.tsx` — Cart page with store grouping and totals
- `src/pages/CartHistoryPage.tsx` — Archived carts list
- `src/pages/SharedCartPage.tsx` — Public cart view by UUID (`/cart/:uuid`)

## How It Works

1. Guest gets `guest_uuid` cookie on first API call
2. `CartContext` manages the active cart state and syncs with API
3. Cart items are products with quantities
4. `POST /cart/add/` auto-creates a cart if none exists (convenience endpoint)
5. Cart summary endpoint (`/carts/{uuid}/summary/`) returns optimized breakdown:
   - Cheapest option per product across stores
   - Products grouped by store with totals
   - Unavailable products list

## Sharing

- Each cart has a UUID
- Route: `/cart/:uuid` renders `SharedCartPage`
- `is_owner` flag in API response controls edit permissions

## Key API Endpoints

See @docs/api.md § Cart section for full endpoint reference.
