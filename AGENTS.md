# minprice.kz Frontend

Price comparison SPA for Kazakhstan supermarkets (Magnum, Arbuz, Airba Fresh, A-Store, Small).

## Tech Stack

- React 18.3, TypeScript 5.8, Vite 5.4
- Tailwind CSS 3.4 + shadcn/ui (Radix primitives)
- TanStack React Query 5 (server state)
- React Router DOM 6 (routing)
- Recharts 2.15 (price history charts)
- React Hook Form + Zod (forms/validation)
- Express 5 SSR meta proxy (`server.js`, port 3000)

## Commands

```bash
npm run dev        # Vite dev server on :8080
npm run build      # Production build → dist/
npm run preview    # Preview production build
npm start          # SSR meta proxy server on :3000
npm test           # Vitest
npm test:watch     # Vitest watch mode
npm run lint       # ESLint
```

## Architecture

**Provider hierarchy** (in `src/App.tsx`):
HelmetProvider → QueryClientProvider → TooltipProvider → CityProvider → CartProvider → BrowserRouter

**Key directories:**
- `src/pages/` — route pages (Index, Search, Catalog, Product, Cart, Discounts, SharedCart)
- `src/components/` — reusable components; `components/ui/` is shadcn (do not hand-edit)
- `src/hooks/useApi.ts` — ALL React Query hooks (data fetching entry point)
- `src/lib/api.ts` — API client, endpoint definitions, session/guest UUID management
- `src/lib/transformers.ts` — API response → UI model mapping
- `src/context/` — CityContext (city selection + localStorage), CartContext (cart state)
- `src/types/api.ts` — TypeScript interfaces for API responses

**API pattern:**
- Base URL: `https://backend.minprice.kz/api`
- Guest identity via `guest_uuid` cookie (auto-initialized, 1-year TTL)
- All product endpoints take `city_id` param (default: 1 = Almaty)
- Query keys include `cityId` for automatic cache invalidation on city switch

**SSR meta proxy** (`server.js`):
- Detects bot User-Agents (Telegram, WhatsApp, Facebook, Twitter)
- Injects OG/Twitter meta tags for product pages via API fetch
- Regular users get the SPA (`dist/index.html`)

## Code Conventions

- Components: PascalCase files (`ProductCard.tsx`)
- Hooks: `use` prefix, camelCase (`useCart`, `useBestDeals`)
- Types: PascalCase (`Product`, `CartItem`, `StorePrice`)
- Path alias: `@/*` → `src/*`
- TS strictness is relaxed: `strictNullChecks: false`, `noImplicitAny: false`
- No `.env` — API base URL is hardcoded in `src/lib/api.ts`

## Routes

| Path | Page | Key hook |
|------|------|----------|
| `/` | Index | `useBestDeals`, `usePriceDrops`, `usePriceIncreases` |
| `/search` | SearchPage | `useSearch` |
| `/catalog/:categoryId?` | CatalogPage | `useCategories` |
| `/product/:id` | ProductPage | `useProduct`, `usePriceHistory` |
| `/cart` | CartPage | CartContext |
| `/cart/:uuid` | SharedCartPage | `useCartSummary` |
| `/discounts` | DiscountsPage | `useDiscounts` |

## Critical Constraints

- Never run migrations (backend is Django, managed separately)
- Logo URLs from API need `/media/` prefix — handled in `transformers.ts`
- Cities: Almaty (ID 1, default), Astana (ID 2) — stored in localStorage key `minprice_city_id`
- Currency is always KZT, no multi-currency support
- shadcn/ui components in `src/components/ui/` are generated — add new ones via `npx shadcn-ui@latest add <component>`

## Deeper Docs

- @docs/api.md — Full API reference (all endpoints, params, response shapes)
- @docs/architecture.md — Data flow, state management, caching strategy
- @docs/testing.md — Test setup and conventions
- @docs/deploy.md — Server setup, Nginx config, PM2, redeploy steps
