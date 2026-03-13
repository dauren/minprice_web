# API Reference

Base URL: `https://backend.minprice.kz/api`

Authentication: Most endpoints are public. Admin endpoints require `IsAdminUser`. Guest identity tracked via `guest_uuid` cookie (initialized by `GET /api/session/init/`).

---

## Session & Preferences

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/session/init/` | Returns `{ guest_uuid }`, sets cookie |
| GET | `/store-preferences/` | Get preferred store IDs |
| PATCH | `/store-preferences/` | Update preferred store IDs. Body: `{ store_ids: [1,2,3] }` |

## Reference Data

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/cities/` | Returns `{ cities: [{ id, name, slug }] }` |
| GET | `/chains/` | Returns `{ chains: [{ id, name, slug, source, logo }] }` |
| GET | `/categories/` | Returns `{ categories: [{ id, name, emoji, level, priority, children }] }` |

## Products

### List: `GET /products/`

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `city_id` | int | 1 | Filter by city |
| `page` | int | 1 | Pagination (1-indexed) |
| `search` | string | — | Full-text search |
| `brand` | string | — | Exact brand match |
| `canonical_category_id` | int | — | Filter by category |
| `ordering` | string | — | `created_at`, `updated_at`, `title`, `min_price`, `max_price` |

Response: `{ count, next, previous, results: [Product] }`

### Detail: `GET /products/{uuid}/`

Query: `city_id` (default 1). Returns Product + `description`, `barcodes`, `additional_images`, `product_links`, `price_range`.

**`price_range`**: `{ min, max, avg, savings, savings_percent, stores: [{ store_name, chain_name, chain_logo, price, previous_price, discount_amount, in_stock, url, ... }] }`

### Price History: `GET /products/{uuid}/price-history/`

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `days` | int | 30 | Lookback (max 365) |
| `city_id` | int | — | Filter by city |

Response: `{ product_uuid, product_title, days, stores: [{ store_id, store_name, chain_source, prices: [{ date, price, in_stock }] }] }`

## Search (Algolia)

### `GET /search/`

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `q` | string | **required** | Search query |
| `hitsPerPage` | int | 20 | Max 100 |
| `page` | int | 0 | **0-indexed** |
| `city_id` | int | 1 | City filter |
| `chain_ids` | string | — | Comma-separated IDs |

Response: `{ hits: [Product], nbHits, page, nbPages, hitsPerPage, query }`

### `GET /algolia-config/` — Returns `{ app_id, search_api_key, index_name }`

## Deals & Discounts

| Method | Endpoint | Key Params | Response |
|--------|----------|------------|----------|
| GET | `/best-deals/` | `city_id`, `limit` (max 50), `min_score` | `{ deals: [Product] }` |
| GET | `/price-drops/` | `city_id`, `page`, `page_size` | `{ results, total, page, total_pages }` |
| GET | `/price-increases/` | same as price-drops | same shape |
| GET | `/discounts/` | `city_id`, `page`, `page_size`, `min_discount`, `canonical_category`, `chain_ids`, `sort_by` | `{ results, total, page, total_pages }` |

## Cart

Guest carts use `guest_uuid` cookie.

| Method | Endpoint | Body | Response |
|--------|----------|------|----------|
| GET | `/carts/` | — | `{ count, results: [Cart] }` |
| GET | `/carts/{uuid}/` | — | Cart + `is_owner` |
| POST | `/carts/` | `{ name }` | Cart |
| DELETE | `/carts/{uuid}/` | — | 204 |
| PATCH | `/carts/{uuid}/update_name/` | `{ name }` | `{ cart_uuid, name }` |
| POST | `/carts/{uuid}/add_item/` | `{ product_uuid, quantity }` | CartItem (201 new / 200 updated) |
| POST | `/carts/{uuid}/remove_item/` | `{ product_uuid }` | 204 |
| PATCH | `/carts/{uuid}/update_quantity/` | `{ product_uuid, quantity }` | CartItem |
| POST | `/cart/add/` | `{ product_uuid, quantity }` | `{ cart_uuid, item, items_count }` (auto-creates cart) |
| POST | `/carts/{uuid}/archive/` | — | `{ archived_cart_uuid, new_cart_uuid }` |
| POST | `/carts/{uuid}/set_active/` | — | `{ cart_uuid, message }` |
| GET | `/carts/{uuid}/summary/` | `city_id` | Full breakdown: `cheapest_per_product`, `grouped_by_store`, `unavailable_products` |

## Admin Endpoints (require IsAdminUser)

| Method | Endpoint | Body |
|--------|----------|------|
| POST | `/merge-products/` | `{ product_ids: [uuid...] }` |
| POST | `/unlink-product/` | `{ product_uuid, ext_product_id }` |
| POST | `/unlink-and-create-product/` | same |
| POST | `/relink-ext-product/` | `{ ext_product_id, source_product_uuid, target_product_uuid }` |
| POST | `/mark-duplicate-ext-products/` | `{ primary_ext_product_id, duplicate_ext_product_ids }` |
| PATCH | `/update-product-title/` | `{ product_uuid, new_title }` |
| POST | `/products/{uuid}/approve-all-links/` | — |
| POST | `/products/{uuid}/sync-measure/` | — |

## Important Notes

- **Pagination**: Product list is 1-indexed, Algolia search is 0-indexed
- **Currency**: All prices in KZT
- **Chain sources**: `mgo`, `arbuz`, `instashop`, `wolt`, `airbafresh`
- **Server caching**: Cities/chains/categories cached 24h; deals cached 6h
- **Stock**: Products not crawled for 1+ day auto-marked out of stock
