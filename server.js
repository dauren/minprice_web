/**
 * SSR Meta Proxy
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
const BACKEND_BASE = API_BASE.replace(/\/api\/?$/, "");

const SITE_URL = process.env.SITE_URL || "https://arzan.kz";
const SITE_NAME = process.env.SITE_NAME || "arzan.kz";
const SITE_LANG = process.env.SITE_LANG || "kk";
const ALTERNATE_SITE_URL = process.env.ALTERNATE_SITE_URL || "https://minprice.kz";
const ALTERNATE_SITE_LANG = process.env.ALTERNATE_SITE_LANG || "ru";

const DIST_DIR = path.join(__dirname, "dist");
const SEO_DISCOVERY_RE = /^\/(?:sitemap(?:-products(?:-\d+)?)?\.xml|sitemap-(?:categories|stores|static)\.xml)$/;

// Читаем index.html один раз при старте
const indexHtml = readFileSync(path.join(DIST_DIR, "index.html"), "utf-8");

// Паттерны User-Agent мессенджеров и поисковых ботов
const BOT_RE =
    /telegrambot|whatsapp|facebookexternalhit|vkshare|twitterbot|linkedinbot|slackbot|discordbot|applebot|yandexbot|googlebot|bingbot|pinterest|viber/i;

const isBot = (ua) => BOT_RE.test(ua || "");

const SSR_SOURCES = [
    [/telegrambot/i,        'telegram'],
    [/whatsapp|viber/i,     'whatsapp'],
    [/facebookexternalhit/i,'facebook'],
    [/vkshare/i,            'vk'],
    [/twitterbot/i,         'twitter'],
    [/linkedinbot/i,        'linkedin'],
    [/slackbot/i,           'slack'],
    [/discordbot/i,         'discord'],
    [/googlebot/i,          'google'],
    [/yandexbot/i,          'yandex'],
    [/bingbot/i,            'bing'],
    [/applebot/i,           'apple'],
    [/pinterest/i,          'pinterest'],
];
const getSsrSource = (ua) => {
    for (const [re, name] of SSR_SOURCES) if (re.test(ua || '')) return name;
    return 'other';
};

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

    const productNode = {
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
    };
    if (product.title_kz) productNode["alternateHeadline"] = product.title_kz;

    return JSON.stringify({
        "@context": "https://schema.org",
        "@graph": [
            {
                "@type": "Organization",
                "@id": `${SITE_URL}/#organization`,
                "name": SITE_NAME,
                "url": SITE_URL,
            },
            {
                "@type": "WebSite",
                "@id": `${SITE_URL}/#website`,
                "name": SITE_NAME,
                "url": SITE_URL,
                "publisher": { "@id": `${SITE_URL}/#organization` },
                "potentialAction": {
                    "@type": "SearchAction",
                    "target": `${SITE_URL}/search/?q={search_term_string}`,
                    "query-input": "required name=search_term_string",
                },
            },
            productNode,
            {
                "@type": "BreadcrumbList",
                "@id": `${url}#breadcrumb`,
                "itemListElement": [
                    { "@type": "ListItem", "position": 1, "name": SITE_LANG === "kk" ? "Басты бет" : "Главная", "item": `${SITE_URL}/` },
                    { "@type": "ListItem", "position": 2, "name": SITE_LANG === "kk" ? "Тауар" : "Товар", "item": url },
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

    const isKk = SITE_LANG === "kk";
    const labels = {
        store:    isKk ? "Дүкен"          : "Магазин",
        city:     isKk ? "Қала"           : "Город",
        stock:    isKk ? "Қолжетімділік"  : "Наличие",
        price:    isKk ? "Баға"           : "Цена",
        prevPrice:isKk ? "Бұрынғы баға"   : "Предыдущая цена",
        updated:  isKk ? "Жаңартылды"     : "Обновлено",
        source:   isKk ? "Дереккөз"       : "Источник",
        inStock:  isKk ? "Бар"            : "В наличии",
        outStock: isKk ? "Жоқ"            : "Нет в наличии",
        priceFrom:isKk ? "Бағасы бастап"  : "Цена от",
        offers:   isKk ? "Ұсыныстар"      : "Предложений",
        updated2: isKk ? "Бағалар жаңартылды" : "Цены обновлены",
        pricesAt: isKk ? "Дүкендердегі бағалар" : "Цены в магазинах",
        canonical:isKk ? "Канондық бет"   : "Каноническая страница",
    };

    const rows = stores.map((store) => `
        <tr>
          <td>${escapeHtml(store.chain_name || store.store_name)}</td>
          <td>${escapeHtml(store.city_name || "Казахстан")}</td>
          <td>${escapeHtml(store.in_stock === false ? labels.outStock : labels.inStock)}</td>
          <td>${escapeHtml(store.price ? `${Math.round(Number(store.price))} ${store.currency || "KZT"}` : "")}</td>
          <td>${escapeHtml(store.previous_price ? `${Math.round(Number(store.previous_price))} ${store.currency || "KZT"}` : "")}</td>
          <td><time datetime="${escapeHtml(store.updated_at || "")}">${escapeHtml(store.updated_at || "")}</time></td>
          <td>${store.ext_product_url || store.url ? `<a href="${escapeHtml(store.ext_product_url || store.url)}" rel="nofollow noopener">${labels.source}</a>` : ""}</td>
        </tr>
    `).join("");

    const primaryTitle = product.title_kz || product.title;
    const secondaryTitle = product.title_kz ? product.title : null;

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
          <p><a href="${SITE_URL}/">${SITE_NAME}</a></p>
          <h1 lang="${SITE_LANG}">${escapeHtml(primaryTitle)}</h1>
          ${secondaryTitle ? `<p lang="ru">${escapeHtml(secondaryTitle)}</p>` : ""}
          <p>${escapeHtml(product.brand_canonical || product.brand || "")}</p>
          <div class="facts">
            ${minPrice ? `<span class="pill">${labels.priceFrom} ${Math.round(minPrice)} ₸</span>` : ""}
            <span class="pill">${labels.offers}: ${stores.length}</span>
            ${lastUpdated ? `<span class="pill">${labels.updated2}: <time datetime="${escapeHtml(lastUpdated)}">${escapeHtml(lastUpdated)}</time></span>` : ""}
          </div>
          ${product.image_url ? `<p><img src="${escapeHtml(product.image_url)}" alt="${escapeHtml(primaryTitle)}" width="240"></p>` : ""}
          <p>${escapeHtml(product.description || "")}</p>
          <p>${labels.canonical}: <a href="${escapeHtml(url)}">${escapeHtml(url)}</a></p>
        </article>
        <section class="card">
          <h2>${labels.pricesAt}</h2>
          <table>
            <thead><tr><th>${labels.store}</th><th>${labels.city}</th><th>${labels.stock}</th><th>${labels.price}</th><th>${labels.prevPrice}</th><th>${labels.updated}</th><th>${labels.source}</th></tr></thead>
            <tbody>${rows || `<tr><td colspan="7">${isKk ? "Ұсыныстар жоқ" : "Нет доступных предложений"}</td></tr>`}</tbody>
          </table>
        </section>
      </main>`;
}

function injectMeta(html, { title, description, image, url, body = "", lang = SITE_LANG }) {
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
    const ogLocale = lang === "kk" ? "kk_KZ" : "ru_KZ";
    const ogLocaleAlt = lang === "kk" ? "ru_KZ" : "kk_KZ";
    const altUrl = escaped(url.replace(SITE_URL, ALTERNATE_SITE_URL));

    const meta = `
    <title>${t}</title>
    <meta name="description" content="${d}" />
    <meta name="robots" content="index,follow" />
    <link rel="canonical" href="${u}" />
    <link rel="alternate" hreflang="${SITE_LANG}" href="${u}" />
    <link rel="alternate" hreflang="${ALTERNATE_SITE_LANG}" href="${altUrl}" />
    <link rel="alternate" hreflang="x-default" href="${altUrl}" />
    <meta property="og:site_name" content="${escaped(SITE_NAME)}" />
    <meta property="og:type" content="product" />
    <meta property="og:url" content="${u}" />
    <meta property="og:title" content="${t}" />
    <meta property="og:description" content="${d}" />
    <meta property="og:image" content="${img}" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta property="og:locale" content="${ogLocale}" />
    <meta property="og:locale:alternate" content="${ogLocaleAlt}" />
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
        // Обновить lang атрибут у <html>
        .replace(/(<html[^>]*)\slang="[^"]*"/, `$1 lang="${lang}"`)
        .replace('<div id="root"></div>', `<div id="root">${body || ""}</div>`);
}

async function proxySeoDiscovery(req, res) {
    try {
        const response = await fetch(`${BACKEND_BASE}${req.path}`, {
            headers: { Accept: "application/xml", "X-Platform": "ssr", "X-SSR-Source": getSsrSource(req.headers["user-agent"]) },
            signal: AbortSignal.timeout(5000),
        });
        let text = await response.text();
        const contentType = response.headers.get("content-type");
        const cacheControl = response.headers.get("cache-control");

        // Rewrite backend domain in sitemap URLs so Google indexes the correct site
        if (SITE_URL !== "https://minprice.kz") {
            text = text.replaceAll("https://minprice.kz/", `${SITE_URL}/`);
        }

        if (cacheControl) {
            res.setHeader("Cache-Control", cacheControl);
        } else if (response.ok) {
            res.setHeader("Cache-Control", "public, max-age=300");
        }

        res.setHeader("Content-Type", contentType || "application/xml");
        res.status(response.status).send(text);
    } catch (err) {
        console.error(`SEO discovery proxy error for ${req.path}:`, err.message);
        res.status(502).type("application/xml").send("SEO discovery upstream unavailable");
    }
}

// ─── robots.txt — served directly so Sitemap URL reflects this deployment ──
app.get("/robots.txt", (_req, res) => {
    res.type("text/plain").send(
        `User-agent: Googlebot\nAllow: /\n\nUser-agent: Bingbot\nAllow: /\n\nUser-agent: Twitterbot\nAllow: /\n\nUser-agent: facebookexternalhit\nAllow: /\n\nUser-agent: *\nAllow: /\n\nDisallow: /api/public/\nDisallow: /api/agent/\n\nSitemap: ${SITE_URL}/sitemap.xml`
    );
});

// ─── site.webmanifest — served dynamically so name reflects this deployment ─
app.get("/site.webmanifest", (_req, res) => {
    try {
        const manifest = JSON.parse(readFileSync(path.join(DIST_DIR, "site.webmanifest"), "utf-8"));
        res.type("application/manifest+json").json({ ...manifest, name: SITE_NAME, short_name: SITE_NAME });
    } catch {
        res.type("application/manifest+json").json({ name: SITE_NAME, short_name: SITE_NAME });
    }
});

app.get(SEO_DISCOVERY_RE, proxySeoDiscovery);

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
            headers: { Accept: "application/json", "X-Platform": "ssr", "X-SSR-Source": getSsrSource(ua) },
            signal: AbortSignal.timeout(5000),
        });

        if (!response.ok) throw new Error(`API ${response.status}`);

        const product = await response.json();

        const nameRu = product.title || "Товар";
        const nameKz = product.title_kz || nameRu;
        const primaryName = SITE_LANG === "kk" ? nameKz : nameRu;

        const qty = product.measure_unit_qty ?? "";
        const unit = product.measure_unit_kind || product.measure_unit || "";
        const weight = qty ? `${qty}${unit}` : unit;

        // Минимальная цена
        const stores = product.price_range?.stores || product.stores || [];
        const prices = stores.map((s) => s.price).filter(Boolean);
        const minPrice = prices.length ? Math.min(...prices) : null;

        const title = `${primaryName}${weight ? ` ${weight}` : ""} — ${SITE_NAME}`;
        const description = minPrice
            ? SITE_LANG === "kk"
                ? `${nameKz} — ${minPrice} ₸-дан. Қазақстандағы дүкендердегі бағаларды салыстырыңыз.`
                : `${nameRu} — от ${minPrice} ₸. Сравните цены в магазинах Казахстана.`
            : SITE_LANG === "kk"
                ? `${nameKz} — Қазақстанда ${SITE_NAME} сайтында бағаларды салыстыру`
                : `${nameRu} — сравнение цен в Казахстане на ${SITE_NAME}`;

        const image = product.image_url || `${SITE_URL}/og-image.png`;
        const url = productCanonicalUrl(product);
        const jsonLd = buildJsonLd(product, url, image, description);
        const body = renderProductFacts(product, url, jsonLd);

        const html = injectMeta(indexHtml, { title, description, image, url, body });
        res.setHeader("Cache-Control", "public, max-age=300"); // кэш 5 мин для ботов
        res.send(html);
    } catch (err) {
        console.error("Meta proxy error:", err.message);
        const fallbackTitle = SITE_LANG === "kk" ? `Тауар — ${SITE_NAME}` : `Товар — ${SITE_NAME}`;
        const fallbackDesc = SITE_LANG === "kk"
            ? `${SITE_NAME} тауар беті. Бағалар мен дүкендер уақытша қолжетімсіз.`
            : `Страница товара ${SITE_NAME}. Цены, магазины и наличие временно недоступны для предварительного просмотра.`;
        res.status(200).send(injectMeta(indexHtml, {
            title: fallbackTitle,
            description: fallbackDesc,
            image: `${SITE_URL}/og-image.png`,
            url: `${SITE_URL}/product/${uuid}`,
            body: `<main><h1>${SITE_LANG === "kk" ? `${SITE_NAME} тауары` : `Товар ${SITE_NAME}`}</h1><p>${fallbackDesc}</p><p>${escapeHtml(uuid)}</p></main>`,
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
        const response = await fetch(`${BACKEND_BASE}${req.path}`, {
            headers: { Accept: "text/html", "X-Platform": "ssr", "X-SSR-Source": getSsrSource(ua) },
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
    console.log(`${SITE_NAME} server running on http://localhost:${PORT}`);
});
