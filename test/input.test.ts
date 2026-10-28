import { describe, expect, it } from 'vitest';

import { normalizeInput } from '../src/input.js';

describe('normalizeInput', () => {
    it('normalizes tracing and defaults', () => {
        const input = normalizeInput({ campaignId: 'cmp_1', shardId: 'shd_1', searchQueries: [' kulaklık ', 'kulaklık'] });
        expect(input.campaignId).toBe('cmp_1');
        expect(input.shardId).toBe('shd_1');
        expect(input.searchQueries).toEqual(['kulaklık']);
        expect(input.crawlScope).toBe('custom');
        expect(input.accessMode).toBe('bright_data');
        expect(input.apifyProxyCountry).toBe('TR');
        expect(input.maxSellers).toBe(10);
        expect(input.minProductCount).toBe(0);
        expect(input.startPage).toBeNull();
        expect(input.resumeFromCheckpoint).toBe(true);
        expect(input.dedupeMode).toBe('new_only');
        expect(input.dedupeStoreName).toBe('n11-seller-lead-state-v1');
    });

    it('accepts N11 request-list URL objects', () => {
        const input = normalizeInput({ startUrls: [{ url: 'https://www.n11.com/magaza/musiclightmarket' }] });
        expect(input.startUrls).toEqual(['https://www.n11.com/magaza/musiclightmarket']);
    });

    it('starts the versioned full-platform crawl and validates tracing IDs', () => {
        const input = normalizeInput({});
        expect(input.crawlScope).toBe('full_platform');
        expect(input.maxCategoriesPerRun).toBe(1);
        expect(input.searchQueries).toEqual([]);
        expect(input.startUrls).toEqual([]);
        expect(input.dedupeStoreName).toBe('n11-full-platform-v1');
        expect(() => normalizeInput({ searchQueries: ['phone'], campaignId: 'bad id' })).toThrow('campaignId is invalid');
    });

    it('accepts an explicit page shard in custom mode', () => {
        const input = normalizeInput({ searchQueries: ['telefon'], startPage: 11, maxPagesPerSource: 5, resumeFromCheckpoint: false });
        expect(input.startPage).toBe(11);
        expect(input.maxPagesPerSource).toBe(5);
        expect(input.resumeFromCheckpoint).toBe(false);
    });

    it('rejects non-N11 start URLs', () => {
        expect(() => normalizeInput({ startUrls: ['https://example.com'] })).toThrow('N11 HTTPS URLs');
    });

    it('rejects custom sources and explicit pages in full-platform mode', () => {
        expect(() => normalizeInput({ crawlScope: 'full_platform', searchQueries: ['telefon'] })).toThrow('must be empty');
        expect(() => normalizeInput({ crawlScope: 'full_platform', startPage: 2 })).toThrow('only supported in custom mode');
    });

    it('normalizes Apify Residential Proxy settings', () => {
        const input = normalizeInput({ accessMode: 'apify_proxy', apifyProxyCountry: 'tr' });
        expect(input.accessMode).toBe('apify_proxy');
        expect(input.apifyProxyCountry).toBe('TR');
    });
});
