import { describe, expect, it, vi } from 'vitest';

import { AdaptivePageFetcher } from '../src/access.js';

describe('AdaptivePageFetcher', () => {
    it('probes direct once, disables it after Cloudflare, and falls back automatically', async () => {
        const mockFetcher = vi.fn(async (input: string | URL | Request) => {
            if (String(input).startsWith('https://api.brightdata.com/')) return new Response('<html>N11 content</html>', { status: 200 });
            return new Response('<title>Attention Required! | Cloudflare</title>Sorry, you have been blocked', { status: 403 });
        });
        const fetcher = new AdaptivePageFetcher({ apiKey: 'token', zone: 'zone', timeoutMillis: 1_000, maxAttempts: 1 }, mockFetcher as unknown as typeof fetch);
        await expect(fetcher.fetchHtml('https://www.n11.com/arama?q=test')).resolves.toContain('N11 content');
        await expect(fetcher.fetchHtml('https://www.n11.com/urun/test-1')).resolves.toContain('N11 content');
        expect(fetcher.usage.direct_attempts).toBe(1);
        expect(fetcher.usage.direct_disabled).toBe(true);
        expect(fetcher.usage.unlocker_successful_requests).toBe(2);
        expect(fetcher.usage.estimated_unlocker_cost_usd).toBe(0.003);
    });
});
