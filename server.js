/**
 * minprice.kz — SSR Meta Proxy
 *
 * Для людей → отдаёт dist/index.html (обычный SPA)
 * Для ботов (TG, WA, FB, VK, crawler) → подтягивает данные с API
 *   и отдаёт HTML с мета-тегами, JSON-LD и видимыми фактами о ценах
 */

import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { readFileSync } from "fs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3000;

const API_BASE = process.env.API_BASE_URL || "https://backend.minprice.kz/api";

const SITE_URL = "https://minprice.kz";
const DIST_DIR = path.join(__dirname, "dist");

// Читаем index.html один раз при старте
const indexHtml = readFileSync(path.join(DIST_DIR, "index.html"), "utf-8");

// Паттерны User-Agent мессенджеров и поисковых ботов
const BOT_RE =
    /telegrambot|whatsapp|facebookexternalhit|vkshare|twitterbot|linkedinbot|slackbot|discordbot|applebot|yandexbot|googlebot|bingbot|pinterest|viber/i;

const isBot = (ua) => BOT_RE.test(ua || "");

// ─── Утилита: вставить мета-теги в index.html ─────────────────────────────
function escapeHtml(value) {
    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/"/g, "&quot;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
}

function slugify(value) {
    return String(value || "")
        .toLowerCase()
        .normalize("NFKD")
        .replace(/[^\p{Letter}\p{Number}]+/gu, "-")
        .replace(/^-+|-+$/g, "") || "product";
}

function productCanonicalUrl(product) {
    return `${SITE_URL}/product/${product.uuid}/${slugify(product.title)}/`;
}

function offerRows(product) {
    return product.price_range?.stores || product.stores || [];
}

function buildJsonLd(product, url, image, description) {
    const stores = offerRows(product);
    const offers = stores
        .filter((store) => Number.isFinite(Number(store.price)))
        .map((store) => ({
            "@type": "Offer",
            "url": store.ext_product_url || store.url || url,
            "price": Number(store.price),
            "priceCurrency": store.currency || "KZT",
            "availability": store.in_stock === false ? "https://schema.org/OutOfStock" : "https://schema.org/InStock",
            "seller": {
                "@type": "Organization",
                "name": store.chain_name || store.store_name,
            },
            "areaServed": store.city_name ? {
                "@type": "City",
                "name": store.city_name,
            } : undefined,
            "dateModified": store.updated_at,
        }));

    const inStockPrices = offers
        .filter((offer, index) => stores[index]?.in_stock !== false)
        .map((offer) => offer.price);

    return JSON.stringify({
        "@context": "https://schema.org",
        "@graph": [
            {
                "@type": "Organization",
                "@id": `${SITE_URL}/#organization`,
                "name": "minprice.kz",
                "url": SITE_URL,
            },
            {
                "@type": "WebSite",
                "@id": `${SITE_URL}/#website`,
                "name": "minprice.kz",
                "url": SITE_URL,
                "publisher": { "@id": `${SITE_URL}/#organization` },
                "potentialAction": {
                    "@type": "SearchAction",
                    "target": `${SITE_URL}/search/?q={search_term_string}`,
                    "query-input": "required name=search_term_string",
                },
            },
            {
                "@type": "Product",
                "@id": `${url}#product`,
                "name": product.title,
                "description": product.description || description,
                "url": url,
                "image": image,
                "brand": (product.brand_canonical || product.brand) ? {
                    "@type": "Brand",
                    "name": product.brand_canonical || product.brand,
                } : undefined,
                "category": product.canonical_categories?.join(" > ") || product.categories?.join(" > "),
                "gtin13": product.barcodes?.[0],
                "offers": offers.length ? {
                    "@type": "AggregateOffer",
                    "priceCurrency": "KZT",
                    "lowPrice": inStockPrices.length ? Math.min(...inStockPrices) : undefined,
                    "highPrice": inStockPrices.length ? Math.max(...inStockPrices) : undefined,
                    "offerCount": offers.length,
                    "offers": offers,
                } : undefined,
            },
            {
                "@type": "BreadcrumbList",
                "@id": `${url}#breadcrumb`,
                "itemListElement": [
                    { "@type": "ListItem", "position": 1, "name": "Главная", "item": `${SITE_URL}/` },
                    { "@type": "ListItem", "position": 2, "name": "Товар", "item": url },
                ],
            },
        ],
    });
}

function renderProductFacts(product, url, jsonLd) {
    const stores = offerRows(product);
    const inStock = stores.filter((store) => store.in_stock !== false && Number.isFinite(Number(store.price)));
    const minPrice = inStock.length ? Math.min(...inStock.map((store) => Number(store.price))) : null;
    const lastUpdated = stores
        .map((store) => store.updated_at)
        .filter(Boolean)
        .sort()
        .pop();

    const rows = stores.map((store) => `
        <tr>
          <td>${escapeHtml(store.chain_name || store.store_name)}</td>
          <td>${escapeHtml(store.city_name || "Казахстан")}</td>
          <td>${escapeHtml(store.in_stock === false ? "Нет в наличии" : "В наличии")}</td>
          <td>${escapeHtml(store.price ? `${Math.round(Number(store.price))} ${store.currency || "KZT"}` : "")}</td>
          <td>${escapeHtml(store.previous_price ? `${Math.round(Number(store.previous_price))} ${store.currency || "KZT"}` : "")}</td>
          <td><time datetime="${escapeHtml(store.updated_at || "")}">${escapeHtml(store.updated_at || "")}</time></td>
          <td>${store.ext_product_url || store.url ? `<a href="${escapeHtml(store.ext_product_url || store.url)}" rel="nofollow noopener">Источник</a>` : ""}</td>
        </tr>
    `).join("");

    return `
      <script type="application/ld+json">${jsonLd}</script>
      <style>
        body{font-family:system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;margin:0;color:#1f2937;background:#f3f4f6}
        main{max-width:960px;margin:0 auto;padding:32px 16px}
        .card{background:#fff;border:1px solid #e5e7eb;border-radius:12px;padding:24px;margin-bottom:16px}
        h1{font-size:32px;line-height:1.2;margin:0 0 12px}
        table{width:100%;border-collapse:collapse;background:#fff}
        th,td{text-align:left;border-bottom:1px solid #e5e7eb;padding:10px;font-size:14px;vertical-align:top}
        th{color:#4b5563;background:#f9fafb}
        .facts{display:flex;gap:8px;flex-wrap:wrap;margin-top:12px}
        .pill{border:1px solid #d1d5db;border-radius:999px;padding:6px 10px;background:#f9fafb;font-size:14px}
        a{color:#15803d}
      </style>
      <main>
        <article class="card">
          <p><a href="${SITE_URL}/">minprice.kz</a></p>
          <h1>${escapeHtml(product.title)}</h1>
          <p>${escapeHtml(product.brand_canonical || product.brand || "")}</p>
          <div class="facts">
            ${minPrice ? `<span class="pill">Цена от ${Math.round(minPrice)} ₸</span>` : ""}
            <span class="pill">Предложений: ${stores.length}</span>
            ${lastUpdated ? `<span class="pill">Цены обновлены: <time datetime="${escapeHtml(lastUpdated)}">${escapeHtml(lastUpdated)}</time></span>` : ""}
          </div>
          ${product.image_url ? `<p><img src="${escapeHtml(product.image_url)}" alt="${escapeHtml(product.title)}" width="240"></p>` : ""}
          <p>${escapeHtml(product.description || "Сравнение цен, наличие, магазины и время обновления на minprice.kz.")}</p>
          <p>Каноническая страница: <a href="${escapeHtml(url)}">${escapeHtml(url)}</a></p>
        </article>
        <section class="card">
          <h2>Цены в магазинах</h2>
          <table>
            <thead><tr><th>Магазин</th><th>Город</th><th>Наличие</th><th>Цена</th><th>Предыдущая цена</th><th>Обновлено</th><th>Источник</th></tr></thead>
            <tbody>${rows || '<tr><td colspan="7">Нет доступных предложений</td></tr>'}</tbody>
          </table>
        </section>
      </main>`;
}

function injectMeta(html, { title, description, image, url, body = "", jsonLd = "" }) {
    const escaped = (s) =>
        String(s ?? "")
            .replace(/&/g, "&amp;")
            .replace(/"/g, "&quot;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;");

    const t = escaped(title);
    const d = escaped(description);
    const img = escaped(image);
    const u = escaped(url);

    const meta = `
    <title>${t}</title>
    <meta name="description" content="${d}" />
    <meta name="robots" content="index,follow" />
    <link rel="canonical" href="${u}" />
    <meta property="og:site_name" content="minprice.kz" />
    <meta property="og:type" content="product" />
    <meta property="og:url" content="${u}" />
    <meta property="og:title" content="${t}" />
    <meta property="og:description" content="${d}" />
    <meta property="og:image" content="${img}" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta property="og:locale" content="ru_KZ" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${t}" />
    <meta name="twitter:description" content="${d}" />
    <meta name="twitter:image" content="${img}" />`;

    return html
        // Удалить существующие title и meta og:/twitter:/description из index.html
        .replace(/<title>.*?<\/title>/gs, "")
        .replace(/<meta\s+name="description"[^>]*>/gi, "")
        .replace(/<meta\s+property="og:[^"]*"[^>]*>/gi, "")
        .replace(/<meta\s+name="twitter:[^"]*"[^>]*>/gi, "")
        .replace(/<link\s+rel="canonical"[^>]*>/gi, "")
        // Вставить динамические теги сразу после <head>
        .replace("<head>", `<head>${meta}`)
        .replace('<div id="root"></div>', `<div id="root">${body || ""}</div>${jsonLd ? `<script type="application/ld+json">${jsonLd}</script>` : ""}`);
}

async function proxySeoDiscovery(req, res) {
    try {
        const response = await fetch(`https://backend.minprice.kz${req.path}`, {
            headers: { Accept: req.path.endsWith(".txt") ? "text/plain" : "application/xml" },
            signal: AbortSignal.timeout(5000),
        });
        if (!response.ok) throw new Error(`backend ${response.status}`);
        const text = await response.text();
        res.setHeader("Cache-Control", "public, max-age=300");
        res.type(req.path.endsWith(".txt") ? "text/plain" : "application/xml");
        res.send(text);
    } catch (err) {
        console.error("SEO discovery proxy error:", err.message);
        if (req.path === "/robots.txt") {
            res.type("text/plain").send(`User-agent: *\nAllow: /\nSitemap: ${SITE_URL}/sitemap.xml\n`);
        } else {
            res.type("application/xml").send('<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>');
        }
    }
}

app.get(
    ["/robots.txt", "/sitemap.xml", "/sitemap-products.xml", "/sitemap-categories.xml", "/sitemap-stores.xml", "/sitemap-static.xml"],
    proxySeoDiscovery
);

// ─── Статика (JS, CSS, assets) ────────────────────────────────────────────
app.use(
    express.static(DIST_DIR, {
        // index.html обрабатываем сами ниже
        index: false,
        // Долгое кэширование для хэшированных файлов
        maxAge: "1y",
        immutable: true,
        setHeaders(res, filePath) {
            // index.html не кэшируем
            if (filePath.endsWith("index.html")) {
                res.setHeader("Cache-Control", "no-cache");
            }
        },
    })
);

// ─── Страница продукта (/product/:uuid) ───────────────────────────────────
app.get(["/product/:uuid", "/product/:uuid/:slug"], async (req, res) => {
    const { uuid } = req.params;
    const ua = req.headers["user-agent"];

    if (!isBot(ua)) {
        // Обычный пользователь — отдаём SPA
        return res.send(indexHtml);
    }

    try {
        const response = await fetch(`${API_BASE}/products/${uuid}/`, {
            headers: { Accept: "application/json" },
            signal: AbortSignal.timeout(5000),
        });

        if (!response.ok) throw new Error(`API ${response.status}`);

        const product = await response.json();

        const name = product.title || "Товар";
        const qty = product.measure_unit_qty ?? "";
        const unit = product.measure_unit_kind || product.measure_unit || "";
        const weight = qty ? `${qty}${unit}` : unit;

        // Минимальная цена
        const stores =
            product.price_range?.stores || product.stores || [];
        const prices = stores.map((s) => s.price).filter(Boolean);
        const minPrice = prices.length ? Math.min(...prices) : null;

        const title = `${name}${weight ? ` ${weight}` : ""} — minprice.kz`;
        const description = minPrice
            ? `${name} — от ${minPrice} ₸. Сравните цены в магазинах Казахстана.`
            : `${name} — сравнение цен в Казахстане на minprice.kz`;
        const image = product.image_url || `${SITE_URL}/og-image.png`;
        const url = productCanonicalUrl(product);
        const jsonLd = buildJsonLd(product, url, image, description);
        const body = renderProductFacts(product, url, jsonLd);

        const html = injectMeta(indexHtml, { title, description, image, url, body });
        res.setHeader("Cache-Control", "public, max-age=300"); // кэш 5 мин для ботов
        res.send(html);
    } catch (err) {
        console.error("Meta proxy error:", err.message);
        res.status(200).send(injectMeta(indexHtml, {
            title: "Товар — minprice.kz",
            description: "Страница товара minprice.kz. Цены, магазины и наличие временно недоступны для предварительного просмотра.",
            image: `${SITE_URL}/og-image.png`,
            url: `${SITE_URL}/product/${uuid}`,
            body: `<main><h1>Товар minprice.kz</h1><p>Цены и наличие временно недоступны для предварительного просмотра.</p><p>Идентификатор товара: ${escapeHtml(uuid)}</p></main>`,
        }));
    }
});

app.get([
    "/catalog",
    "/catalog/",
    "/catalog/:categoryId/:slug",
    "/catalog/:categoryId/:slug/",
    "/city/:citySlug/catalog/:categoryId/:slug",
    "/city/:citySlug/catalog/:categoryId/:slug/",
    "/stores/:chainSlug",
    "/stores/:chainSlug/",
    "/city/:citySlug/stores/:chainSlug",
    "/city/:citySlug/stores/:chainSlug/",
], async (req, res) => {
    const ua = req.headers["user-agent"];

    if (!isBot(ua)) {
        return res.send(indexHtml);
    }

    try {
        const response = await fetch(`https://backend.minprice.kz${req.path}`, {
            headers: { Accept: "text/html" },
            signal: AbortSignal.timeout(5000),
        });
        if (!response.ok) throw new Error(`backend ${response.status}`);
        const html = await response.text();
        res.setHeader("Cache-Control", "public, max-age=300");
        res.type("text/html").send(html);
    } catch (err) {
        console.error("SEO HTML proxy error:", err.message);
        res.send(indexHtml);
    }
});

// ─── Все остальные роуты SPA → index.html ─────────────────────────────────
app.use((_req, res) => {
    res.send(indexHtml);
});

app.listen(PORT, () => {
    console.log(`minprice.kz server running on http://localhost:${PORT}`);
});
