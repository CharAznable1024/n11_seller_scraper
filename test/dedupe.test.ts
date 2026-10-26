import { describe, expect, it } from 'vitest';

import { applyDedupe } from '../src/dedupe.js';
import type { SellerLead } from '../src/types.js';

const lead = (): SellerLead => ({
    record_type: 'merchant_lead', schema_version: '1.0', campaign_id: null, shard_id: null, run_id: 'run', seller_id: '1', seller_name: 'Store', seller_profile_url: 'https://www.n11.com/magaza/store',
    seller_rating: 10, seller_review_count: 20, product_count: 30, seller_badges: ['Başarılı Mağaza'], seller_country: 'Türkiye', seller_country_code: 'TR', headquarter_city: 'İstanbul',
    average_shipping_time: '14 Saat', customer_service_response_time: '2-4 saat', time_on_n11: '5-6 Yıl', company_name: 'Store A.Ş.', registered_trademark: 'Store', registered_email: null,
    tax_number: '123', mersis_number: '456', address_disclosure: null, brands: [], categories: [], matched_product_count: 0, sample_product_urls: [], source_queries: [], product_id: null, sku: null,
    product_url: null, product_title: null, favorite_count: null, product_rating: null, product_review_count: null, product_comment_count: null, price: null, list_price: null, price_currency: null,
    free_shipping: null, promotion_info: [], refund_policy: null, product_description: null, installment_terms: [], lead_score: 80, qualification: 'QUALIFIED', qualification_reasons: [],
    dedupe_status: 'new', first_seen_at: '2026-01-01T00:00:00.000Z', last_seen_at: '2026-01-01T00:00:00.000Z', times_seen: 1, scraped_at: '2026-01-01T00:00:00.000Z',
});

describe('applyDedupe', () => {
    it('suppresses unchanged sellers', async () => {
        const values = new Map<string, unknown>();
        const store = { getValue: async <T>(key: string) => (values.get(key) as T | undefined) ?? null, setValue: async (key: string, value: unknown) => { values.set(key, value); } };
        expect((await applyDedupe(store, lead(), 'new_and_updated')).emit).toBe(true);
        const second = await applyDedupe(store, { ...lead(), scraped_at: '2026-01-02T00:00:00.000Z' }, 'new_and_updated');
        expect(second.emit).toBe(false);
        expect(second.lead.dedupe_status).toBe('unchanged');
    });
});
