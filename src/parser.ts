import { stripHtml } from './access.js';
import type { MerchantProfile, ProductEvidence } from './types.js';

type UnknownRecord = Record<string, unknown>;

const record = (value: unknown): UnknownRecord | null => value && typeof value === 'object' && !Array.isArray(value) ? value as UnknownRecord : null;
const array = (value: unknown): unknown[] => Array.isArray(value) ? value : [];
const text = (value: unknown): string | null => typeof value === 'string' && value.trim() ? value.trim() : null;
const numeric = (value: unknown): number | null => {
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    if (typeof value === 'string' && value.trim()) {
        const cleaned = value.replace(/[^\d,.-]/g, '');
        const normalized = cleaned.includes(',') ? cleaned.replace(/\./g, '').replace(',', '.') : cleaned;
        const parsed = Number(normalized);
        return Number.isFinite(parsed) ? parsed : null;
    }
    return null;
};
const boolean = (value: unknown): boolean | null => typeof value === 'boolean' ? value : null;

function extractBalancedObject(source: string, marker: string): string | null {
    const markerIndex = source.indexOf(marker);
    if (markerIndex < 0) return null;
    const start = source.indexOf('{', markerIndex + marker.length);
    if (start < 0) return null;
    let depth = 0;
    let inString = false;
    let escaped = false;
    for (let index = start; index < source.length; index += 1) {
        const char = source[index];
        if (inString) {
            if (escaped) escaped = false;
            else if (char === '\\') escaped = true;
            else if (char === '"') inString = false;
            continue;
        }
        if (char === '"') inString = true;
        else if (char === '{') depth += 1;
        else if (char === '}') {
            depth -= 1;
            if (depth === 0) return source.slice(start, index + 1);
        }
    }
    return null;
}

export function parseWindowModel(html: string): UnknownRecord | null {
    const raw = extractBalancedObject(html, 'window.model =');
    if (!raw) return null;
    try {
        return record(JSON.parse(raw));
    } catch {
        return null;
    }
}

export function isProductUrl(value: string): boolean {
    try { return /^\/urun\/[^/]+/i.test(new URL(value).pathname); } catch { return false; }
}

export function isStoreUrl(value: string): boolean {
    try { return /^\/magaza\/[^/]+/i.test(new URL(value).pathname); } catch { return false; }
}

export function extractProductUrls(html: string, baseUrl: string): string[] {
    const values = [...html.matchAll(/href=["']([^"']*\/urun\/[^"'#]+)["']/gi)]
        .map((match) => match[1].replace(/&amp;/gi, '&'))
        .flatMap((value) => {
            try {
                const url = new URL(value, baseUrl);
                if (!/(^|\.)n11\.com$/i.test(url.hostname)) return [];
                url.hash = '';
                return [url.toString()];
            } catch { return []; }
        });
    return [...new Set(values)];
}

function sellerSlug(sourceUrl: string, seller: UnknownRecord): string | null {
    try {
        const fromQuery = new URL(sourceUrl).searchParams.get('magaza');
        if (fromQuery) return fromQuery.toLocaleLowerCase('tr-TR');
    } catch {}
    const bookmarkable = text(seller.sellerShopBookmarkableUrl);
    if (bookmarkable) return bookmarkable;
    return text(seller.nickName ?? seller.businessName)?.toLocaleLowerCase('tr-TR') ?? null;
}

function badges(seller: UnknownRecord): string[] {
    return [...new Set([
        text(seller.sellerShopText),
        seller.officialSeller === true ? text(seller.officialSellerText) : null,
        seller.quickSeller === true ? text(seller.quickSellerText) : null,
        seller.topSellerBadge === true ? 'Başarılı Mağaza' : null,
    ].filter((value): value is string => Boolean(value)))];
}

function readableCampaigns(value: unknown, depth = 0): string[] {
    if (depth > 4 || value === null || value === undefined) return [];
    if (typeof value === 'string') return value.trim() && value.length <= 300 ? [value.trim()] : [];
    if (Array.isArray(value)) return value.flatMap((item) => readableCampaigns(item, depth + 1)).slice(0, 10);
    const object = record(value);
    if (!object) return [];
    return Object.entries(object)
        .filter(([key]) => /title|name|text|description|message|label/i.test(key))
        .flatMap(([, item]) => readableCampaigns(item, depth + 1))
        .slice(0, 10);
}

function favoriteCount(html: string): number | null {
    const match = html.match(/class=["'][^"']*favorites-count[^"']*["'][^>]*>\s*([\d.]+)/i);
    return match ? numeric(match[1]) : null;
}

function installmentTerms(html: string, product: UnknownRecord): string[] {
    const installment = record(product.installmentDTO);
    const count = numeric(installment?.installmentCount);
    const visible = stripHtml(html);
    const visibleMatch = visible.match(/Taksit Seçenekleri\s+(.{1,100}?)(?=Bunlar İlgini|$)/i);
    return [...new Set([
        count && count > 1 ? `${count} taksit` : null,
        visibleMatch?.[1]?.trim() ?? null,
    ].filter((value): value is string => Boolean(value)))];
}

export function parseProductPage(html: string, sourceUrl: string): ProductEvidence | null {
    const model = parseWindowModel(html);
    const product = record(model?.product ?? record(model?.data)?.product);
    const seller = record(product?.seller);
    if (!product || !seller) return null;
    const sellerId = numeric(seller.id);
    const sellerName = text(seller.nickName ?? seller.businessName);
    const slug = sellerSlug(sourceUrl, seller);
    if (sellerId === null || !sellerName || !slug) return null;
    const stats = record(seller.sellerFeedbackStatistics);
    const reviewStats = record(product.productReviewStatisticsDTO);
    const category = record(product.category);
    const breadcrumb = array(product.breadcrumb).map(record).flatMap((item) => text(item?.name) ?? []);
    const categories = [...new Set([...breadcrumb, ...(text(category?.name) ? [String(category?.name)] : [])])];
    const price = numeric(product.priceFloat ?? product.price);
    const listPrice = numeric(product.displayPriceFloat ?? product.displayPrice);
    const promotions = [...new Set([
        ...readableCampaigns(model?.campaigns),
        price !== null && listPrice !== null && price < listPrice ? `SEPETTE ${product.price ?? `${price} TL`}` : null,
        product.shippingFree === true ? 'Ücretsiz Kargo' : null,
    ].filter((value): value is string => Boolean(value)))].slice(0, 10);
    const rating = numeric(stats?.sellerGrade);
    return {
        seller_id: String(sellerId),
        seller_name: sellerName,
        seller_profile_url: `https://www.n11.com/magaza/${encodeURIComponent(slug)}`,
        seller_rating: rating === null ? numeric(product.sellerGrade) : rating / 10,
        seller_review_count: numeric(stats?.totalFeedbackCount),
        seller_badges: badges(seller),
        seller_country: 'Türkiye',
        seller_country_code: 'TR',
        product_id: text(product.groupId === undefined ? null : String(product.groupId)),
        sku: text(product.defaultSkuId === undefined ? null : String(product.defaultSkuId)),
        product_url: text(product.productUrl ?? product.productUrlWithoutSellerShop) ?? sourceUrl,
        product_title: text(product.title),
        brand: text(product.productBrand),
        categories,
        favorite_count: favoriteCount(html),
        product_rating: numeric(reviewStats?.satisfyScore) ?? (numeric(product.score) === null ? null : Number(numeric(product.score)) / 20),
        product_review_count: numeric(reviewStats?.totalReviewCountWithNullContent ?? product.reviewCount ?? product.totalReviewCount),
        product_comment_count: numeric(reviewStats?.commentCount ?? product.commentCount),
        price,
        list_price: listPrice,
        price_currency: 'TRY',
        free_shipping: boolean(product.shippingFree),
        promotion_info: promotions,
        refund_policy: text(product.refundChangeInfo) ? stripHtml(String(product.refundChangeInfo)) : null,
        product_description: text(product.catalogDescription ?? model?.description) ? stripHtml(String(product.catalogDescription ?? model?.description)) : null,
        installment_terms: installmentTerms(html, product),
    };
}

export function parseMerchantProfile(html: string): MerchantProfile | null {
    const model = parseWindowModel(html);
    const sellerInfo = record(model?.sellerInfo);
    const shop = record(sellerInfo?.sellerShopDto);
    const seller = record(shop?.sellerDTO);
    const sellerId = numeric(shop?.sellerId ?? seller?.id);
    const sellerName = text(shop?.sellerName ?? seller?.nickName ?? seller?.businessName);
    const slug = text(sellerInfo?.sellerShopBookmarkableUrlForSeo);
    if (!seller || sellerId === null || !sellerName || !slug) return null;
    const feedback = record(seller.sellerFeedbackStatistics);
    const grade = numeric(shop?.sellerGradeDecimal ?? seller?.sellerShopPoint);
    return {
        seller_id: String(sellerId),
        seller_slug: slug,
        seller_name: sellerName,
        seller_profile_url: `https://www.n11.com/magaza/${encodeURIComponent(slug)}`,
        seller_rating: grade,
        seller_review_count: numeric(feedback?.totalFeedbackCount),
        product_count: numeric(sellerInfo?.sellerProductsCount),
        average_shipping_time: text(seller.averageShipmentSpeed),
        customer_service_response_time: text(seller.sellerAnswerTime),
        time_on_n11: text(seller.timeInPlatform),
        headquarter_city: text(seller.headquarterCity),
        company_name: text(seller.companyName),
        registered_trademark: text(seller.registeredTrademark),
        registered_email: text(seller.registeredEmail),
        tax_number: text(seller.taxNumber),
        mersis_number: text(seller.mersisNo),
        address_disclosure: text(seller.addressInfoMessage),
        seller_badges: badges(seller),
    };
}
