# N11 Seller Scraper

Custom Apify Actor for discovering N11 merchant leads. The default `full_platform` scope traverses a versioned manifest of product-bearing second-level categories extracted from the current public navigation. Navigation-only landing pages are excluded. Custom keyword, category, product, and store URL discovery remains available through `crawlScope: "custom"`.

## Resumable full-catalog crawl

Each Run handles a bounded number of categories and pages. In `full_platform` mode, `maxCategoriesPerRun` selects the first unfinished categories and every category owns an independent cursor in `dedupeStoreName`. A page is marked complete only after its selected product details and seller candidates have been processed. Partial pages retain their seller progress and retry only unfinished work.

The persistent state store caches completed pages, parsed product details, and parsed seller profiles. Re-running a completed page therefore makes no request for that page; overlapping pages/categories reuse product and profile results. Use one store name per campaign and avoid running the same source/page concurrently. The default `dedupeMode` is `new_only`, so the Dataset emits one row per N11 `seller_id`; Aime should still upsert by `platform + seller_id` during cross-Run aggregation.

`OUTPUT.next_cursor.sources[]` contains `source_id`, `source_url`, `next_page`, and `exhausted` for all manifest categories. `total_category_count`, `completed_category_count`, `remaining_category_count`, `categories_processed_this_run`, and `current_category` expose platform-level progress. Aime should leave `startPage` unset and start another shard while `has_more` is true.

## Data flow

```text
crawlScope=full_platform / versioned category manifest
        |
        v
N11 search/category/store pages -- extract product URLs
        |
        v
Product window.model -- selected seller + product evidence
        |
        v
Store window.model -- rating, products, logistics, legal fields
        |
        v
qualification + cross-run dedupe -- incremental Dataset checkpoint
```

The parser reads N11's server-rendered `window.model` JSON instead of generated CSS classes. Missing public values remain `null` or empty arrays.

## Access strategy

N11 has returned Cloudflare HTTP 403 to direct cloud traffic. `accessMode: "apify_proxy"` routes every request through Apify Residential Proxy with Turkey routing and never calls Bright Data. `bright_data` uses Web Unlocker directly, while `auto` tries direct, Apify Proxy, then Bright Data when configured.

With the current Bright Data plan, each successful unlocked page costs approximately **$0.0015**. Estimated request count is:

```text
listing pages + product detail pages + unique seller profile pages
```

## Input

| Field | Meaning |
| --- | --- |
| `campaignId`, `shardId` | Optional Aime pass-through tracing IDs |
| `crawlScope` | `full_platform` (default) or `custom` |
| `maxCategoriesPerRun` | Maximum unfinished manifest categories scheduled in one Run |
| `accessMode`, `apifyProxyCountry` | Network path: direct, Apify Residential Proxy, Bright Data, or fallback chain |
| `searchQueries`, `startUrls` | Custom-mode discovery sources; leave empty in full-platform mode |
| `maxSellers` | Maximum qualified sellers checkpointed to Dataset |
| `maxSellerCandidates` | Maximum public store profiles inspected |
| `minSellerRating`, `minProductCount`, `minSellerReviewCount` | Seller qualification filters |
| `sellerCities`, `sellerBadges` | Optional public profile filters |
| `dedupeMode`, `dedupeStoreName` | Cross-Run seller deduplication |

When both discovery fields are empty, the Actor traverses the complete built-in platform manifest. It automatically skips exhausted categories and continues the first unfinished category in later Runs that use the same `dedupeStoreName`.

## Output

One Dataset row is one seller. It includes:

- tracing: `campaign_id`, `shard_id`, `run_id`, `seller_id`;
- store: name/profile, score, feedback count, product count, and badges;
- operations: headquarters city, average shipping time, question-answer response time, and time on N11;
- public business registration: company name, registered trademark/email, VKN, MERSIS, and public address disclosure;
- representative product: brand, categories, favorite count, title, score/reviews, price, promotion, refund policy, description, and installment terms;
- quality/dedupe: lead score, qualification reasons, first/last seen, and times seen.

Qualified rows are written immediately with `Actor.pushData`, so checkpointed records survive timeout or abort. `OUTPUT` and `PROGRESS` contain shard-level counts, access usage, and the default Dataset ID. Aime remains responsible for campaign scheduling and cross-Run aggregation using `campaign_id + seller_id`.

## Local validation

```bash
npm install
npm test
npm run typecheck
npm run build
apify validate-schema
```

Local Bright Data runs require `BRIGHT_DATA_API_KEY`. Apify Residential Proxy is intended for cloud Actor runs; local external proxy access depends on the Apify account plan.
