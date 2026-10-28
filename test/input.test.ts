import { describe, expect, it } from 'vitest';

import { DEFAULT_CATEGORY_URLS, normalizeInput } from '../src/input.js';

describe('normalizeInput', () => {
    it('normalizes tracing and defaults', () => {
        const input = normalizeInput({ campaignId: 'cmp_1', shardId: 'shd_1', searchQueries: [' kulaklık ', 'kulaklık'] });
        expect(input.campaignId).toBe('cmp_1');
        expect(input.shardId).toBe('shd_1');
        expect(input.searchQueries).toEqual(['kulaklık']);
        expect(input.maxSellers).toBe(10);
        expect(input.minProductCount).toBe(0);
        expect(input.startPage).toBeNull();
        expect(input.resumeFromCheckpoint).toBe(true);
        expect(input.dedupeMode).toBe('new_only');
    });

    it('accepts N11 request-list URL objects', () => {
        const input = normalizeInput({ startUrls: [{ url: 'https://www.n11.com/magaza/musiclightmarket' }] });
        expect(input.startUrls).toEqual(['https://www.n11.com/magaza/musiclightmarket']);
    });

    it('starts from Electronics and validates tracing IDs', () => {
        const input = normalizeInput({});
        expect(input.searchQueries).toEqual([]);
        expect(input.startUrls).toEqual(DEFAULT_CATEGORY_URLS);
        expect(() => normalizeInput({ searchQueries: ['phone'], campaignId: 'bad id' })).toThrow('campaignId is invalid');
    });

    it('accepts an explicit page shard', () => {
        const input = normalizeInput({ startPage: 11, maxPagesPerSource: 5, resumeFromCheckpoint: false });
        expect(input.startPage).toBe(11);
        expect(input.maxPagesPerSource).toBe(5);
        expect(input.resumeFromCheckpoint).toBe(false);
    });

    it('rejects non-N11 start URLs', () => {
        expect(() => normalizeInput({ startUrls: ['https://example.com'] })).toThrow('N11 HTTPS URLs');
    });
});
