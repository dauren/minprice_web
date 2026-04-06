import { Helmet } from "react-helmet-async";

const SITE_NAME = "minprice.kz";
const BASE_URL = "https://minprice.kz";
const DEFAULT_IMAGE = `${BASE_URL}/og-image.png`;
const DEFAULT_DESCRIPTION =
    "Сравнивайте цены на продукты питания в супермаркетах Казахстана. Находим минимальную цену среди Magnum, Arbuz, Airba Fresh, A-Store и других.";

interface PageMetaProps {
    title?: string;
    description?: string;
    image?: string;
    url?: string;
    type?: "website" | "article" | "product";
}

const PageMeta = ({
    title,
    description = DEFAULT_DESCRIPTION,
    image = DEFAULT_IMAGE,
    url,
    type = "website",
}: PageMetaProps) => {
    const fullTitle = title ? `${title} — ${SITE_NAME}` : `${SITE_NAME} — сравнение цен на продукты`;
    const fullUrl = url ? `${BASE_URL}${url}` : BASE_URL;

    return (
        <Helmet>
            <title>{fullTitle}</title>
            <meta name="description" content={description} />

            {/* Open Graph */}
            <meta property="og:site_name" content={SITE_NAME} />
            <meta property="og:type" content={type} />
            <meta property="og:url" content={fullUrl} />
            <meta property="og:title" content={fullTitle} />
            <meta property="og:description" content={description} />
            <meta property="og:image" content={image} />
            <meta property="og:image:width" content="1200" />
            <meta property="og:image:height" content="630" />
            <meta property="og:locale" content="ru_KZ" />

            {/* Twitter Card */}
            <meta name="twitter:card" content="summary_large_image" />
            <meta name="twitter:title" content={fullTitle} />
            <meta name="twitter:description" content={description} />
            <meta name="twitter:image" content={image} />
        </Helmet>
    );
};

export default PageMeta;
