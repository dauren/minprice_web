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

## Metadata and concurrent reads

Deploy the backend supporting `compact=true` first. Active-cart discovery uses
`/carts/?is_active=true&compact=true`; the list uses `/carts/?compact=true`.
Lists use `items_count` and contain no product graph. They do not request a price
summary for every cart. Prices are fetched for the selected cart and city only;
unknown list totals are left blank.

`src/lib/cartReads.ts` shares unfinished reads by identity and endpoint, with no
completed-result cache. Successful cart writes abort obsolete reads. Old identity
responses are discarded; later attempts after failures issue a fresh request.
