import { Actor, log } from 'apify';

import { AdaptivePageFetcher } from './access.js';
import { CrawlState, type PageProgress } from './crawl-state.js';
import { applyDedupe } from './dedupe.js';
import { normalizeInput } from './input.js';
import { extractProductUrls, isProductUrl, isStoreUrl, parseMerchantProfile, parseProductPage } from './parser.js';
import type { ActorInput, MerchantCandidate, MerchantProfile, ProductEvidence, RunSummary, SellerLead, SourceCursor } from './types.js';

await Actor.init();

const input = normalizeInput(await Actor.getInput<ActorInput>());
const runId = process.env.APIFY_ACTOR_RUN_ID?.trim() || process.env.ACTOR_RUN_ID?.trim() || 'local';
const datasetId = process.env.APIFY_DEFAULT_DATASET_ID?.trim() || process.env.ACTOR_DEFAULT_DATASET_ID?.trim() || 'default';
const brightDataApiKey = process.env.BRIGHT_DATA_API_KEY?.trim();
if (!brightDataApiKey) throw new Error('BRIGHT_DATA_API_KEY is required for automatic N11 Cloudflare fallback');

const pageFetcher = new AdaptivePageFetcher({
    apiKey: brightDataApiKey,
    zone: process.env.BRIGHT_DATA_ZONE?.trim() || 'ebay_live_unlocker',
    timeoutMillis: input.navigationTimeoutSecs * 1_000,
    maxAttempts: input.maxRequestRetries + 1,
    directTimeoutMillis: 8_000,
});
const dedupeStore = await Actor.openKeyValueStore(input.dedupeStoreName);
const crawlState = new CrawlState(dedupeStore, 'pg');
const startedAt = new Date().toISOString();
const failedSources: Array<{ source: string; error: string }> = [];
const productUrls = new Map<string, Set<string>>();
const candidates = new Map<string, MerchantCandidate>();
const knownProfiles = new Map<string, MerchantProfile>();
const discoveredSellerIds = new Set<string>();
const sourceCursors = new Map<string, SourceCursor>();

let productDetailAttempted = 0;
let productDetailSucceeded = 0;
let sellerProfileAttempted = 0;
let sellerProfileSucceeded = 0;
let sellerProfileFailed = 0;
let qualifiedLeadCount = 0;
let emittedLeadCount = 0;
let duplicateSuppressedCount = 0;
let pageAttempted = 0;
let pageCompleted = 0;
let pageSkipped = 0;
let pageResumed = 0;
let productCacheHits = 0;
let sellerProfileCacheHits = 0;
let productDetailFetches = 0;
let sellerCandidateProcessed = 0;

const discoverySources: Array<{ url: string; label: string }> = [];
const directProductUrls: Array<{ url: string; label: string }> = [];

function paginatedUrl(value: string, page: number): string {
    const url = new URL(value);
    if (page > 1) url.searchParams.set('pg', String(page));
    return url.toString();
}

for (const query of input.searchQueries) {
    const base = `https://www.n11.com/arama?q=${encodeURIComponent(query)}`;
    discoverySources.push({ url: base, label: query });
}
for (const startUrl of input.startUrls) {
    if (isProductUrl(startUrl)) {
        directProductUrls.push({ url: startUrl, label: startUrl });
        continue;
    }
    discoverySources.push({ url: startUrl, label: startUrl });
}

function summary(status: RunSummary['status']): RunSummary {
    const cursors = [...sourceCursors.values()];
    return {
        status,
        schema_version: '1.0',
        campaign_id: input.campaignId,
        shard_id: input.shardId,
        run_id: runId,
        dataset_id: datasetId,
        scanned_count: sellerProfileAttempted,
        qualified_count: emittedLeadCount,
        next_cursor: cursors.length ? { version: 1, sources: cursors } : null,
        has_more: cursors.some((cursor) => !cursor.exhausted),
        start_page: input.startPage,
        resume_from_checkpoint: input.resumeFromCheckpoint,
        page_attempted: pageAttempted,
        page_completed: pageCompleted,
        page_skipped: pageSkipped,
        page_resumed: pageResumed,
        product_cache_hits: productCacheHits,
        seller_profile_cache_hits: sellerProfileCacheHits,
        search_queries: input.searchQueries,
        start_urls: input.startUrls,
        discovery_source_count: discoverySources.length,
        discovered_product_count: productUrls.size,
        discovered_seller_count: discoveredSellerIds.size,
        product_detail_attempted: productDetailAttempted,
        product_detail_succeeded: productDetailSucceeded,
        seller_profile_attempted: sellerProfileAttempted,
        seller_profile_succeeded: sellerProfileSucceeded,
        seller_profile_failed: sellerProfileFailed,
        qualified_lead_count: qualifiedLeadCount,
        emitted_lead_count: emittedLeadCount,
        duplicate_suppressed_count: duplicateSuppressedCount,
        failed_sources: failedSources,
        access_usage: { ...pageFetcher.usage },
        started_at: startedAt,
        ...(status === 'RUNNING' ? {} : { finished_at: new Date().toISOString() }),
    };
}

async function checkpoint(): Promise<void> {
    await Actor.setValue('PROGRESS', summary('RUNNING'));
}

Actor.on('aborting', async () => {
    log.warning('Run is aborting; persisting partial progress.');
    await Actor.setValue('OUTPUT', summary('ABORTED'));
});

async function mapConcurrent<T, R>(values: T[], concurrency: number, worker: (value: T, index: number) => Promise<R>): Promise<R[]> {
    const output = new Array<R>(values.length);
    let next = 0;
    const workers = Array.from({ length: Math.min(concurrency, values.length) }, async () => {
        while (next < values.length) {
            const index = next;
            next += 1;
            output[index] = await worker(values[index], index);
        }
    });
    await Promise.all(workers);
    return output;
}

function addEvidence(evidence: NonNullable<ReturnType<typeof parseProductPage>>, labels: Set<string>): void {
    discoveredSellerIds.add(evidence.seller_id);
    const existing = candidates.get(evidence.seller_id);
    if (existing) {
        if (!existing.evidences.some((item) => item.product_url === evidence.product_url)) existing.evidences.push(evidence);
        existing.seller_badges = [...new Set([...existing.seller_badges, ...evidence.seller_badges])];
        for (const label of labels) existing.source_queries.add(label);
        return;
    }
    candidates.set(evidence.seller_id, {
        seller_id: evidence.seller_id,
        seller_name: evidence.seller_name,
        seller_profile_url: evidence.seller_profile_url,
        seller_rating: evidence.seller_rating,
        seller_review_count: evidence.seller_review_count,
        seller_badges: evidence.seller_badges,
        evidences: [evidence],
        source_queries: new Set(labels),
    });
}

function addProfileOnlyCandidate(profile: MerchantProfile, source: string): void {
    discoveredSellerIds.add(profile.seller_id);
    knownProfiles.set(profile.seller_id, profile);
    if (candidates.has(profile.seller_id)) return;
    candidates.set(profile.seller_id, {
        seller_id: profile.seller_id,
        seller_name: profile.seller_name,
        seller_profile_url: profile.seller_profile_url,
        seller_rating: profile.seller_rating,
        seller_review_count: profile.seller_review_count,
        seller_badges: profile.seller_badges,
        evidences: [],
        source_queries: new Set([source]),
    });
}

function normalize(value: string | null): string {
    return (value ?? '').toLocaleUpperCase('tr-TR').trim();
}

function qualifies(lead: SellerLead): boolean {
    if (input.minSellerRating > 0 && (lead.seller_rating ?? -1) < input.minSellerRating) return false;
    if (input.minProductCount > 0 && (lead.product_count ?? -1) < input.minProductCount) return false;
    if (input.minSellerReviewCount > 0 && (lead.seller_review_count ?? -1) < input.minSellerReviewCount) return false;
    if (input.sellerCities.length && !input.sellerCities.some((city) => normalize(city) === normalize(lead.headquarter_city))) return false;
    if (input.sellerBadges.length && !input.sellerBadges.some((requested) => lead.seller_badges.some((badge) => normalize(badge) === normalize(requested)))) return false;
    return true;
}

function leadScore(profile: MerchantProfile | null, candidate: MerchantCandidate): number {
    const rating = profile?.seller_rating ?? candidate.seller_rating ?? 0;
    const reviews = profile?.seller_review_count ?? candidate.seller_review_count ?? 0;
    const products = profile?.product_count ?? 0;
    const legalCompleteness = [profile?.company_name, profile?.registered_trademark, profile?.tax_number, profile?.mersis_number, profile?.headquarter_city].filter(Boolean).length;
    return Math.min(100, Math.round(rating * 6 + Math.log10(reviews + 1) * 7 + Math.log10(products + 1) * 7 + legalCompleteness * 3));
}

function buildLead(candidate: MerchantCandidate, profile: MerchantProfile | null): SellerLead {
    const primary = candidate.evidences[0] ?? null;
    const scrapedAt = new Date().toISOString();
    const sellerBadges = [...new Set([...candidate.seller_badges, ...(profile?.seller_badges ?? [])])];
    return {
        record_type: 'merchant_lead',
        schema_version: '1.0',
        campaign_id: input.campaignId,
        shard_id: input.shardId,
        run_id: runId,
        seller_id: candidate.seller_id,
        seller_name: profile?.seller_name ?? candidate.seller_name,
        seller_profile_url: profile?.seller_profile_url ?? candidate.seller_profile_url,
        seller_rating: profile?.seller_rating ?? candidate.seller_rating,
        seller_review_count: profile?.seller_review_count ?? candidate.seller_review_count,
        product_count: profile?.product_count ?? null,
        seller_badges: sellerBadges,
        seller_country: 'Türkiye',
        seller_country_code: 'TR',
        headquarter_city: profile?.headquarter_city ?? null,
        average_shipping_time: profile?.average_shipping_time ?? null,
        customer_service_response_time: profile?.customer_service_response_time ?? null,
        time_on_n11: profile?.time_on_n11 ?? null,
        company_name: profile?.company_name ?? null,
        registered_trademark: profile?.registered_trademark ?? null,
        registered_email: profile?.registered_email ?? null,
        tax_number: profile?.tax_number ?? null,
        mersis_number: profile?.mersis_number ?? null,
        address_disclosure: profile?.address_disclosure ?? null,
        brands: [...new Set(candidate.evidences.flatMap((item) => item.brand ?? []))],
        categories: [...new Set(candidate.evidences.flatMap((item) => item.categories))],
        matched_product_count: candidate.evidences.length,
        sample_product_urls: [...new Set(candidate.evidences.map((item) => item.product_url))].slice(0, 5),
        source_queries: [...candidate.source_queries],
        product_id: primary?.product_id ?? null,
        sku: primary?.sku ?? null,
        product_url: primary?.product_url ?? null,
        product_title: primary?.product_title ?? null,
        favorite_count: primary?.favorite_count ?? null,
        product_rating: primary?.product_rating ?? null,
        product_review_count: primary?.product_review_count ?? null,
        product_comment_count: primary?.product_comment_count ?? null,
        price: primary?.price ?? null,
        list_price: primary?.list_price ?? null,
        price_currency: primary?.price_currency ?? null,
        free_shipping: primary?.free_shipping ?? null,
        promotion_info: primary?.promotion_info ?? [],
        refund_policy: primary?.refund_policy ?? null,
        product_description: primary?.product_description ?? null,
        installment_terms: primary?.installment_terms ?? [],
        lead_score: leadScore(profile, candidate),
        qualification: 'QUALIFIED',
        qualification_reasons: [
            `seller_rating>=${input.minSellerRating}`,
            `product_count>=${input.minProductCount}`,
            `seller_review_count>=${input.minSellerReviewCount}`,
        ],
        dedupe_status: 'new',
        first_seen_at: scrapedAt,
        last_seen_at: scrapedAt,
        times_seen: 1,
        scraped_at: scrapedAt,
    };
}

async function loadProductEvidence(url: string): Promise<ProductEvidence | null> {
    const cached = await crawlState.getProduct<ProductEvidence>(url);
    if (cached) {
        productCacheHits += 1;
        return cached;
    }
    if (productDetailFetches >= input.maxProductDetails) return null;
    productDetailFetches += 1;
    productDetailAttempted += 1;
    try {
        const html = await pageFetcher.fetchHtml(url);
        const evidence = parseProductPage(html, url);
        if (!evidence) throw new Error('No N11 product/seller model found');
        productDetailSucceeded += 1;
        await crawlState.setProduct(url, evidence);
        return evidence;
    } catch (error) {
        failedSources.push({ source: url, error: String(error) });
        log.warning('Product detail failed', { url, error: String(error) });
        return null;
    }
}

async function loadSellerProfile(candidate: MerchantCandidate): Promise<MerchantProfile | null> {
    const known = knownProfiles.get(candidate.seller_id);
    if (known) return known;
    const cached = await crawlState.getProfile<MerchantProfile>(candidate.seller_id);
    if (cached) {
        sellerProfileCacheHits += 1;
        return cached;
    }
    sellerProfileAttempted += 1;
    try {
        const html = await pageFetcher.fetchHtml(candidate.seller_profile_url);
        const profile = parseMerchantProfile(html);
        if (!profile) throw new Error('No N11 seller profile model found');
        sellerProfileSucceeded += 1;
        await crawlState.setProfile(candidate.seller_id, profile);
        return profile;
    } catch (error) {
        sellerProfileFailed += 1;
        failedSources.push({ source: candidate.seller_profile_url, error: String(error) });
        return null;
    }
}

async function processCandidate(candidate: MerchantCandidate, profile: MerchantProfile | null, progress: PageProgress): Promise<boolean> {
    if (input.requireSellerProfile && !profile) return false;
    const lead = buildLead(candidate, profile);
    if (qualifies(lead)) {
        qualifiedLeadCount += 1;
        const dedupe = await applyDedupe(dedupeStore, lead, input.dedupeMode);
        if (dedupe.emit) {
            await Actor.pushData(dedupe.lead);
            emittedLeadCount += 1;
        } else {
            duplicateSuppressedCount += 1;
        }
    }
    await crawlState.markSellerProcessed(progress, candidate.seller_id);
    await checkpoint();
    return true;
}

async function processSourcePage(source: { url: string; label: string }, page: number): Promise<boolean> {
    const pageUrl = paginatedUrl(source.url, page);
    let progress = await crawlState.getPage(source.url, page);
    if (progress?.status === 'completed') {
        pageSkipped += 1;
        sourceCursors.set(progress.source_id, await crawlState.cursor(source.url, source.label, page + 1));
        return true;
    }

    candidates.clear();
    knownProfiles.clear();

    if (progress) {
        pageResumed += 1;
    } else {
        pageAttempted += 1;
        try {
            const html = await pageFetcher.fetchHtml(pageUrl);
            const discovered = extractProductUrls(html, pageUrl).slice(0, input.maxProductsPerSource);
            progress = await crawlState.beginPage(source.url, source.label, page, discovered);
            if (isStoreUrl(source.url)) {
                const profile = parseMerchantProfile(html);
                if (profile) {
                    addProfileOnlyCandidate(profile, source.label);
                    await crawlState.setProfile(profile.seller_id, profile);
                }
            }
        } catch (error) {
            failedSources.push({ source: pageUrl, error: String(error) });
            log.warning('Discovery source failed', { url: pageUrl, error: String(error) });
            const cursor = await crawlState.cursor(source.url, source.label, page);
            sourceCursors.set(cursor.source_id, cursor);
            return false;
        }
    }

    if (progress.product_urls.length === 0 && candidates.size === 0) {
        await crawlState.completePage(progress, true);
        pageCompleted += 1;
        sourceCursors.set(progress.source_id, await crawlState.cursor(source.url, source.label, page));
        return true;
    }

    let pageSucceeded = true;
    const labels = new Set([source.label]);
    const productResults = await mapConcurrent(progress.product_urls, input.maxConcurrency, async (url) => {
        productUrls.set(url, labels);
        return { url, evidence: await loadProductEvidence(url) };
    });
    for (const { evidence } of productResults) {
        if (!evidence) {
            pageSucceeded = false;
            continue;
        }
        addEvidence(evidence, labels);
    }
    await checkpoint();

    const processed = new Set(progress.processed_seller_ids);
    const pendingCandidates = [...candidates.values()].filter((candidate) => !processed.has(candidate.seller_id));
    let offset = 0;
    while (offset < pendingCandidates.length) {
        if (sellerCandidateProcessed >= input.maxSellerCandidates || emittedLeadCount >= input.maxSellers) {
            pageSucceeded = false;
            break;
        }
        const remainingCapacity = input.maxSellerCandidates - sellerCandidateProcessed;
        const remainingOutputCapacity = input.maxSellers - emittedLeadCount;
        const batch = pendingCandidates.slice(offset, offset + Math.min(input.maxProfileConcurrency, remainingCapacity, remainingOutputCapacity));
        offset += batch.length;
        sellerCandidateProcessed += batch.length;
        const results = await mapConcurrent(batch, input.maxProfileConcurrency, async (candidate) => ({
            candidate,
            profile: await loadSellerProfile(candidate),
        }));
        for (const { candidate, profile } of results) {
            if (!await processCandidate(candidate, profile, progress)) pageSucceeded = false;
        }
    }

    const processedAfter = new Set(progress.processed_seller_ids);
    if ([...candidates.keys()].some((sellerId) => !processedAfter.has(sellerId))) pageSucceeded = false;
    if (pageSucceeded) {
        await crawlState.completePage(progress, false);
        pageCompleted += 1;
    }
    sourceCursors.set(progress.source_id, await crawlState.cursor(source.url, source.label, pageSucceeded ? page + 1 : page));
    return pageSucceeded;
}

await Actor.setValue('OUTPUT', summary('RUNNING'));
log.info('N11 seller discovery started', { campaignId: input.campaignId, shardId: input.shardId, runId, datasetId });

try {
    for (const source of discoverySources) {
        const startPage = await crawlState.resolveStartPage(source.url, input.startPage, input.resumeFromCheckpoint);
        const initialCursor = await crawlState.cursor(source.url, source.label, startPage);
        sourceCursors.set(initialCursor.source_id, initialCursor);
        for (let page = startPage; page < startPage + input.maxPagesPerSource; page += 1) {
            if (emittedLeadCount >= input.maxSellers) break;
            if (!await processSourcePage(source, page)) break;
            const cursor = await crawlState.cursor(source.url, source.label, page + 1);
            if (cursor.exhausted) break;
        }
    }

    for (const direct of directProductUrls) {
        if (emittedLeadCount >= input.maxSellers) break;
        const synthetic = await crawlState.getPage(direct.url, 1)
            ?? await crawlState.beginPage(direct.url, direct.label, 1, [direct.url]);
        if (synthetic.status !== 'completed') await processSourcePage(direct, 1);
    }

    const output = summary('SUCCEEDED');
    await Actor.setValue('OUTPUT', output);
    log.info('N11 seller discovery finished', output);
} catch (error) {
    await Actor.setValue('OUTPUT', summary('FAILED'));
    throw error;
} finally {
    await Actor.exit();
}
