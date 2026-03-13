# Architecture

## System Overview

```
User / Bot (TG, WA, FB)
    │
    ▼
Nginx (443 HTTPS)
    ├── minprice.kz → Node.js SSR proxy (:3000)
    │       ├── human → dist/index.html (Vite SPA)
    │       └── bot → fetch API + inject OG meta
    ├── backend.minprice.kz → Django/Gunicorn
    └── minprice.xyz/api/* → Django/Gunicorn
        minprice.xyz/* → 301 → minprice.kz
```

## Frontend Data Flow

```
Page Component
    ↓ calls
useApi hook (src/hooks/useApi.ts)
    ↓ uses
React Query (caching, refetching)
    ↓ calls
API client (src/lib/api.ts)
    ↓ fetches
Backend API (backend.minprice.kz/api)
    ↓ returns
Raw API response
    ↓ transformed by
transformers.ts (src/lib/transformers.ts)
    ↓ returns
UI-ready data → Component renders
```

## State Management

| Layer | Tool | Scope |
|-------|------|-------|
| Server state | TanStack React Query | API data, caching, refetching |
| City selection | CityContext + localStorage | Global, persisted |
| Cart | CartContext | Global, synced with API |
| UI state | useState | Component-local |
| Meta tags | react-helmet-async | Per-page SEO |

### Query Key Strategy

All product queries include `cityId` for automatic invalidation on city change:
- `['bestDeals', cityId]`
- `['search', query, cityId]`
- `['product', uuid, cityId]`
- `['priceHistory', uuid, cityId]`

When `cityId` changes → all queries with that key segment auto-refetch.

## API Client (`src/lib/api.ts`)

- Wraps `fetch` with typed methods: `get<T>`, `post<T>`, `patch<T>`, `delete`
- Auto-initializes guest session on first call (sets `guest_uuid` cookie)
- Sends `X-Guest-UUID` header on every request
- No auth token management — fully guest-based

## Data Transformation (`src/lib/transformers.ts`)

Converts raw API responses to UI models:
- Constructs full logo URLs (adds `https://backend.minprice.kz/media/` prefix)
- Calculates discount percentages and savings
- Maps store-specific colors
- Normalizes product fields for `ProductCard` component

## SSR Meta Proxy (`server.js`)

Express server that serves the SPA but intercepts bot requests:
1. Checks User-Agent against bot patterns (Telegram, WhatsApp, Facebook, Twitter, LinkedIn)
2. For bots on `/product/:id` routes: fetches product data from API, returns HTML with OG meta tags
3. For humans: serves `dist/index.html` as normal SPA
4. Caching: 5min for bot responses, 1yr for static assets with hash

## Component Patterns

### shadcn/ui
- All base UI components live in `src/components/ui/`
- Generated via `npx shadcn-ui@latest add <name>` — do not hand-edit
- Configured in `components.json` (New York style, zinc theme)
- Uses `class-variance-authority` for variant props
- Utility: `cn()` from `src/lib/utils.ts` (merges Tailwind classes)

### Product Display
- `ProductCard` — card with image, prices, discount badge, store logos
- `StoreLogo` — renders chain logo (API URL preferred, local SVG fallback)
- Store colors assigned by `getStoreColor()` in transformers

### Forms
- React Hook Form + Zod schemas for validation
- `@hookform/resolvers` bridges the two
