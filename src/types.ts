export type DedupeMode = 'all' | 'new_only' | 'new_and_updated';

export interface ActorInput {
    campaignId?: unknown;
    shardId?: unknown;
    searchQueries?: unknown;
    startUrls?: unknown;
    sellerCities?: unknown;
    sellerBadges?: unknown;
    maxPagesPerSource?: unknown;
    maxProductsPerSource?: unknown;
    maxProductDetails?: unknown;
    maxSellerCandidates?: unknown;
    maxSellers?: unknown;
    minSellerRating?: unknown;
    minProductCount?: unknown;
    minSellerReviewCount?: unknown;
    requireSellerProfile?: unknown;
    maxConcurrency?: unknown;
    maxProfileConcurrency?: unknown;
    maxRequestRetries?: unknown;
    navigationTimeoutSecs?: unknown;
    dedupeMode?: unknown;
    dedupeStoreName?: unknown;
}

export interface Input {
    campaignId: string | null;
    shardId: string | null;
    searchQueries: string[];
    startUrls: string[];
    sellerCities: string[];
    sellerBadges: string[];
    maxPagesPerSource: number;
    maxProductsPerSource: number;
    maxProductDetails: number;
    maxSellerCandidates: number;
    maxSellers: number;
    minSellerRating: number;
    minProductCount: number;
    minSellerReviewCount: number;
    requireSellerProfile: boolean;
    maxConcurrency: number;
    maxProfileConcurrency: number;
    maxRequestRetries: number;
    navigationTimeoutSecs: number;
    dedupeMode: DedupeMode;
    dedupeStoreName: string;
}

export interface AccessUsage {
    logical_requests: number;
    direct_attempts: number;
    direct_successes: number;
    direct_failures: number;
    direct_disabled: boolean;
    unlocker_request_attempts: number;
    unlocker_successful_requests: number;
    unlocker_failed_attempts: number;
    estimated_unlocker_cost_usd: number;
}

export interface ProductEvidence {
    seller_id: string;
    seller_name: string;
    seller_profile_url: string;
    seller_rating: number | null;
    seller_review_count: number | null;
    seller_badges: string[];
    seller_country: 'Türkiye';
    seller_country_code: 'TR';
    product_id: string | null;
    sku: string | null;
    product_url: string;
    product_title: string | null;
    brand: string | null;
    categories: string[];
    favorite_count: number | null;
    product_rating: number | null;
    product_review_count: number | null;
    product_comment_count: number | null;
    price: number | null;
    list_price: number | null;
    price_currency: 'TRY';
    free_shipping: boolean | null;
    promotion_info: string[];
    refund_policy: string | null;
    product_description: string | null;
    installment_terms: string[];
}

export interface MerchantProfile {
    seller_id: string;
    seller_slug: string;
    seller_name: string;
    seller_profile_url: string;
    seller_rating: number | null;
    seller_review_count: number | null;
    product_count: number | null;
    average_shipping_time: string | null;
    customer_service_response_time: string | null;
    time_on_n11: string | null;
    headquarter_city: string | null;
    company_name: string | null;
    registered_trademark: string | null;
    registered_email: string | null;
    tax_number: string | null;
    mersis_number: string | null;
    address_disclosure: string | null;
    seller_badges: string[];
}

export interface MerchantCandidate {
    seller_id: string;
    seller_name: string;
    seller_profile_url: string;
    seller_rating: number | null;
    seller_review_count: number | null;
    seller_badges: string[];
    evidences: ProductEvidence[];
    source_queries: Set<string>;
}

export interface SellerLead {
    record_type: 'merchant_lead';
    schema_version: '1.0';
    campaign_id: string | null;
    shard_id: string | null;
    run_id: string;
    seller_id: string;
    seller_name: string;
    seller_profile_url: string;
    seller_rating: number | null;
    seller_review_count: number | null;
    product_count: number | null;
    seller_badges: string[];
    seller_country: 'Türkiye';
    seller_country_code: 'TR';
    headquarter_city: string | null;
    average_shipping_time: string | null;
    customer_service_response_time: string | null;
    time_on_n11: string | null;
    company_name: string | null;
    registered_trademark: string | null;
    registered_email: string | null;
    tax_number: string | null;
    mersis_number: string | null;
    address_disclosure: string | null;
    brands: string[];
    categories: string[];
    matched_product_count: number;
    sample_product_urls: string[];
    source_queries: string[];
    product_id: string | null;
    sku: string | null;
    product_url: string | null;
    product_title: string | null;
    favorite_count: number | null;
    product_rating: number | null;
    product_review_count: number | null;
    product_comment_count: number | null;
    price: number | null;
    list_price: number | null;
    price_currency: 'TRY' | null;
    free_shipping: boolean | null;
    promotion_info: string[];
    refund_policy: string | null;
    product_description: string | null;
    installment_terms: string[];
    lead_score: number;
    qualification: 'QUALIFIED';
    qualification_reasons: string[];
    dedupe_status: 'new' | 'updated' | 'unchanged' | 'all';
    first_seen_at: string;
    last_seen_at: string;
    times_seen: number;
    scraped_at: string;
}

export interface RunSummary {
    status: 'RUNNING' | 'SUCCEEDED' | 'FAILED' | 'ABORTED';
    schema_version: '1.0';
    campaign_id: string | null;
    shard_id: string | null;
    run_id: string;
    dataset_id: string;
    scanned_count: number;
    qualified_count: number;
    next_cursor: null;
    has_more: boolean;
    search_queries: string[];
    start_urls: string[];
    discovery_source_count: number;
    discovered_product_count: number;
    discovered_seller_count: number;
    product_detail_attempted: number;
    product_detail_succeeded: number;
    seller_profile_attempted: number;
    seller_profile_succeeded: number;
    seller_profile_failed: number;
    qualified_lead_count: number;
    emitted_lead_count: number;
    duplicate_suppressed_count: number;
    failed_sources: Array<{ source: string; error: string }>;
    access_usage: AccessUsage;
    started_at: string;
    finished_at?: string;
}
