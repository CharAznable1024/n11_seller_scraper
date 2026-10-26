import { describe, expect, it } from 'vitest';

import { extractProductUrls, parseMerchantProfile, parseProductPage } from '../src/parser.js';

const model = (value: unknown) => `<script>window.model = ${JSON.stringify(value)};</script>`;

describe('N11 parsers', () => {
    it('extracts and deduplicates product URLs', () => {
        const html = '<a href="/urun/test-123?magaza=store">A</a><a href="https://www.n11.com/urun/test-123?magaza=store">B</a>';
        expect(extractProductUrls(html, 'https://www.n11.com/arama?q=test')).toEqual(['https://www.n11.com/urun/test-123?magaza=store']);
    });

    it('parses product, seller, favorite, refund, and installment evidence', () => {
        const html = model({
            product: {
                groupId: 4969157, defaultSkuId: '127260224240', title: 'Behringer Headphones', productBrand: 'Behringer',
                productUrl: 'https://www.n11.com/urun/behringer-4969157', price: '1.712,27 TL', priceFloat: 1712.27,
                displayPrice: '1.923,90 TL', displayPriceFloat: 1923.9, shippingFree: true,
                category: { name: 'Kulaklıklar' }, breadcrumb: [{ name: 'Müzik' }, { name: 'Kulaklıklar' }],
                productReviewStatisticsDTO: { satisfyScore: 4.5, totalReviewCountWithNullContent: 67, commentCount: 43 },
                catalogDescription: '<p>Public description</p>', refundChangeInfo: '<p>14-day return policy</p>',
                installmentDTO: { installmentAvailable: true, installmentCount: 9 },
                seller: {
                    id: 3589774, nickName: 'MusicLightMarket', sellerShopText: 'Özel Mağaza', quickSeller: true,
                    quickSellerText: 'Hızlı Gönderim', topSellerBadge: true,
                    sellerFeedbackStatistics: { sellerGrade: 100, totalFeedbackCount: 216 },
                },
            },
            campaigns: [{ title: 'Sepette indirim' }],
        }) + '<div class="favorites-count">704</div><span>Taksit Seçenekleri 182,06 TL\'den başlayan taksitlerle</span>';
        const output = parseProductPage(html, 'https://www.n11.com/urun/behringer-4969157?magaza=musiclightmarket');
        expect(output).toMatchObject({
            seller_id: '3589774', seller_name: 'MusicLightMarket', seller_rating: 10, seller_review_count: 216,
            favorite_count: 704, product_rating: 4.5, product_review_count: 67, product_comment_count: 43,
            price: 1712.27, list_price: 1923.9, free_shipping: true, refund_policy: '14-day return policy',
            product_description: 'Public description',
        });
        expect(output?.seller_badges).toEqual(['Özel Mağaza', 'Hızlı Gönderim', 'Başarılı Mağaza']);
        expect(output?.promotion_info).toContain('Sepette indirim');
        expect(output?.installment_terms).toContain('9 taksit');
    });

    it('parses store profile and public business fields', () => {
        const html = model({ sellerInfo: {
            sellerShopBookmarkableUrlForSeo: 'musiclightmarket', sellerProductsCount: 653,
            sellerShopDto: {
                sellerId: 3589774, sellerName: 'MusicLightMarket', sellerGradeDecimal: '10.0',
                sellerDTO: {
                    id: 3589774, nickName: 'MusicLightMarket', averageShipmentSpeed: '14 Saat', sellerAnswerTime: '2-4 saat',
                    timeInPlatform: '5-6 Yıl', headquarterCity: 'İstanbul', companyName: 'MLM ELEKTRONİK A.Ş.',
                    registeredTrademark: 'MLM', registeredEmail: 'mlm@example.com', taxNumber: '6221909881',
                    mersisNo: '0622190988100001', addressInfoMessage: 'Verified address is on file', quickSeller: true,
                    quickSellerText: 'Hızlı Gönderim', topSellerBadge: true,
                    sellerFeedbackStatistics: { sellerGrade: 100, totalFeedbackCount: 216 },
                },
            },
        } });
        expect(parseMerchantProfile(html)).toMatchObject({
            seller_id: '3589774', seller_name: 'MusicLightMarket', seller_rating: 10, seller_review_count: 216,
            product_count: 653, average_shipping_time: '14 Saat', customer_service_response_time: '2-4 saat',
            time_on_n11: '5-6 Yıl', headquarter_city: 'İstanbul', company_name: 'MLM ELEKTRONİK A.Ş.',
            registered_trademark: 'MLM', tax_number: '6221909881', mersis_number: '0622190988100001',
        });
    });
});
