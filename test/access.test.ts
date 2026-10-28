import type { ProxyConfiguration } from 'apify';
import { describe, expect, it, vi } from 'vitest';

import { AdaptivePageFetcher } from '../src/access.js';
import { ApifyResidentialFetcher } from '../src/apify-proxy.js';

describe('AdaptivePageFetcher', () => {
    it('uses Apify Proxy first and falls back to Bright Data without a direct probe', async () => {
        const proxy = { newUrl: async () => 'http://user:pass@proxy.example:8000' } as unknown as ProxyConfiguration;
        const proxyFetcher = new ApifyResidentialFetcher(proxy, 1_000, 1, async () => ({
            statusCode: 403,
            body: '<html>Access denied</html>',
        }));
        const mockFetcher = vi.fn(async () => new Response('<html>N11 content</html>', { status: 200 }));
        const fetcher = new AdaptivePageFetcher({
            accessMode: 'auto', apiKey: 'token', zone: 'zone', timeoutMillis: 1_000,
            maxAttempts: 1, apifyProxyFetcher: proxyFetcher,
        }, mockFetcher as unknown as typeof fetch);
        await expect(fetcher.fetchHtml('https://www.n11.com/arama?q=test')).resolves.toContain('N11 content');
        await expect(fetcher.fetchHtml('https://www.n11.com/urun/test-1')).resolves.toContain('N11 content');
        expect(fetcher.usage.direct_attempts).toBe(0);
        expect(fetcher.usage.apify_proxy_failed_attempts).toBe(2);
        expect(fetcher.usage.unlocker_successful_requests).toBe(2);
        expect(fetcher.usage.estimated_unlocker_cost_usd).toBe(0.003);
        expect(mockFetcher).toHaveBeenCalledTimes(2);
    });
});
