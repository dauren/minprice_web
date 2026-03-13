# Search Module

## Files

- `src/pages/SearchPage.tsx` — Search results with chain/category filters
- `src/hooks/useApi.ts` → `useSearch(query)` hook
- `src/lib/api.ts` → `search` endpoint definition

## How It Works

1. User enters query → navigates to `/search?q=...`
2. `useSearch` calls `GET /api/search/?q=...&city_id=...`
3. Backend uses Algolia (`prod_canonical_products` index)
4. Results transformed via `transformers.ts` for `ProductCard` rendering

## Search Params

| Param | Description |
|-------|-------------|
| `q` | Search query (required) |
| `city_id` | City filter (from CityContext) |
| `chain_ids` | Comma-separated chain IDs for store filter |
| `page` | **0-indexed** (Algolia convention) |
| `hitsPerPage` | Default 20, max 100 |

## Filters

- Chain filter: populated from `useChains()` hook
- Category filter: from `useCategories()` hook
- Both filters applied as query params to search endpoint
