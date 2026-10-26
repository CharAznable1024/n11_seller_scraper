import type { AccessUsage } from './types.js';

interface AccessOptions {
    apiKey: string;
    zone: string;
    timeoutMillis: number;
    maxAttempts: number;
    directTimeoutMillis?: number;
}

type DirectProbe = { state: 'available'; html: string } | { state: 'blocked' };

export class AdaptivePageFetcher {
    readonly usage: AccessUsage = {
        logical_requests: 0,
        direct_attempts: 0,
        direct_successes: 0,
        direct_failures: 0,
        direct_disabled: false,
        unlocker_request_attempts: 0,
        unlocker_successful_requests: 0,
        unlocker_failed_attempts: 0,
        estimated_unlocker_cost_usd: 0,
    };

    private directState: 'unknown' | 'available' | 'blocked' = 'unknown';
    private directProbe: Promise<DirectProbe> | null = null;

    constructor(private readonly options: AccessOptions, private readonly fetcher: typeof fetch = fetch) {}

    async fetchHtml(url: string): Promise<string> {
        this.usage.logical_requests += 1;
        if (this.directState === 'blocked') return this.fetchUnlocked(url);
        if (this.directState === 'unknown') {
            const probeOwner = this.directProbe === null;
            if (!this.directProbe) this.directProbe = this.probeDirect(url);
            const result = await this.directProbe;
            this.directState = result.state;
            this.usage.direct_disabled = result.state === 'blocked';
            if (probeOwner && result.state === 'available') return result.html;
            if (result.state === 'blocked') return this.fetchUnlocked(url);
        }
        try {
            return await this.fetchDirect(url);
        } catch {
            this.directState = 'blocked';
            this.usage.direct_disabled = true;
            return this.fetchUnlocked(url);
        }
    }

    private async probeDirect(url: string): Promise<DirectProbe> {
        try {
            return { state: 'available', html: await this.fetchDirect(url) };
        } catch {
            return { state: 'blocked' };
        }
    }

    private async fetchDirect(url: string): Promise<string> {
        this.usage.direct_attempts += 1;
        try {
            const response = await this.fetcher(url, {
                headers: {
                    'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/140.0.0.0 Safari/537.36',
                    'accept-language': 'tr-TR,tr;q=0.9,en;q=0.8',
                },
                signal: AbortSignal.timeout(this.options.directTimeoutMillis ?? 8_000),
            });
            const html = await response.text();
            if (!response.ok || isBlockedPage(html)) throw new Error(`Direct request blocked with HTTP ${response.status}`);
            if (!html.trim()) throw new Error('Direct request returned an empty body');
            this.usage.direct_successes += 1;
            return html;
        } catch (error) {
            this.usage.direct_failures += 1;
            throw error;
        }
    }

    private async fetchUnlocked(url: string): Promise<string> {
        let lastError: unknown;
        for (let attempt = 1; attempt <= this.options.maxAttempts; attempt += 1) {
            this.usage.unlocker_request_attempts += 1;
            try {
                const response = await this.fetcher('https://api.brightdata.com/request', {
                    method: 'POST',
                    headers: { authorization: `Bearer ${this.options.apiKey}`, 'content-type': 'application/json' },
                    body: JSON.stringify({
                        zone: this.options.zone,
                        url,
                        format: 'raw',
                        country: 'tr',
                        render: 'false',
                    }),
                    signal: AbortSignal.timeout(this.options.timeoutMillis),
                });
                const html = await response.text();
                if (!response.ok) throw new Error(`Web Unlocker returned HTTP ${response.status}: ${html.slice(0, 300)}`);
                const brightDataError = response.headers.get('x-brd-error');
                if (brightDataError) throw new Error(`Bright Data error: ${brightDataError}`);
                if (!html.trim() || isBlockedPage(html)) throw new Error('Web Unlocker returned a blocked or empty page');
                this.usage.unlocker_successful_requests += 1;
                this.usage.estimated_unlocker_cost_usd = Number((this.usage.unlocker_successful_requests * 0.0015).toFixed(6));
                return html;
            } catch (error) {
                lastError = error;
                this.usage.unlocker_failed_attempts += 1;
                if (attempt < this.options.maxAttempts) await new Promise((resolve) => setTimeout(resolve, attempt * 2_000));
            }
        }
        throw lastError;
    }
}

export function isBlockedPage(html: string): boolean {
    const preview = stripHtml(html).slice(0, 3_000);
    return /attention required|sorry, you have been blocked|access denied|verify you are human|cf-error-details/i.test(preview);
}

export function stripHtml(html: string): string {
    return html
        .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, ' ')
        .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, ' ')
        .replace(/<[^>]+>/g, ' ')
        .replace(/&#x([0-9a-f]+);/gi, (_, hex: string) => String.fromCodePoint(Number.parseInt(hex, 16)))
        .replace(/&#(\d+);/g, (_, decimal: string) => String.fromCodePoint(Number.parseInt(decimal, 10)))
        .replace(/&quot;/gi, '"')
        .replace(/&apos;|&#39;/gi, "'")
        .replace(/&amp;/gi, '&')
        .replace(/&nbsp;/gi, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}
