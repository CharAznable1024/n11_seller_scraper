import { describe, expect, it } from 'vitest';

import { DEFAULT_SEARCH_QUERIES, normalizeInput } from '../src/input.js';

describe('normalizeInput', () => {
    it('normalizes tracing and defaults', () => {
        const input = normalizeInput({ campaignId: 'cmp_1', shardId: 'shd_1', searchQueries: [' kulaklık ', 'kulaklık'] });
        expect(input.campaignId).toBe('cmp_1');
        expect(input.shardId).toBe('shd_1');
        expect(input.searchQueries).toEqual(['kulaklık']);
        expect(input.maxSellers).toBe(10);
    });

    it('accepts N11 request-list URL objects', () => {
        const input = normalizeInput({ startUrls: [{ url: 'https://www.n11.com/magaza/musiclightmarket' }] });
        expect(input.startUrls).toEqual(['https://www.n11.com/magaza/musiclightmarket']);
    });

    it('uses balanced default categories and validates tracing IDs', () => {
        expect(normalizeInput({}).searchQueries).toEqual(DEFAULT_SEARCH_QUERIES);
        expect(() => normalizeInput({ searchQueries: ['phone'], campaignId: 'bad id' })).toThrow('campaignId is invalid');
    });

    it('rejects non-N11 start URLs', () => {
        expect(() => normalizeInput({ startUrls: ['https://example.com'] })).toThrow('N11 HTTPS URLs');
    });
});
