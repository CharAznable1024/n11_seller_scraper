# N11 Seller Scraper

Custom Apify Actor for discovering N11 merchant leads. It starts from public keyword, category, product, or store URLs, discovers sellers from product pages, and enriches each seller from the public N11 store model. If the caller supplies no discovery source, the resumable full-catalog flow starts from `https://www.n11.com/elektronik`.

## Resumable full-catalog crawl

Each Run handles a bounded page shard. Set `startPage` to assign a page range explicitly, or omit it with `resumeFromCheckpoint: true` to continue from the cursor stored in `dedupeStoreName`. A page is marked complete only after its selected product details and seller candidates have been processed. Partial pages retain their seller progress and retry only unfinished work.

The persistent state store caches completed pages, parsed product details, and parsed seller profiles. Re-running a completed page therefore makes no request for that page; overlapping pages/categories reuse product and profile results. Use one store name per campaign and avoid running the same source/page concurrently. The default `dedupeMode` is `new_only`, so the Dataset emits one row per N11 `seller_id`; Aime should still upsert by `platform + seller_id` during cross-Run aggregation.

`OUTPUT.next_cursor.sources[]` contains `source_id`, `source_url`, `next_page`, and `exhausted`. Aime can either pass `next_page` back as `startPage` or leave `startPage` unset and let the Actor resume from the stored checkpoint.

## Data flow

```text
searchQueries / startUrls
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

N11 currently returns Cloudflare HTTP 403 to direct cloud traffic. The Actor performs one short direct probe per Run. If the probe is blocked, direct access is disabled for the rest of that Run and all pages automatically use the configured Bright Data Web Unlocker. Operators do not select a proxy mode.

With the current Bright Data plan, each successful unlocked page costs approximately **$0.0015**. Estimated request count is:

```text
listing pages + product detail pages + unique seller profile pages
```

## Input

| Field | Meaning |
| --- | --- |
| `campaignId`, `shardId` | Optional Aime pass-through tracing IDs |
| `searchQueries` | Optional product, brand, or category phrases; empty uses balanced default categories |
| `startUrls` | Search/category/product/store URLs |
| `maxSellers` | Maximum qualified sellers checkpointed to Dataset |
| `maxSellerCandidates` | Maximum public store profiles inspected |
| `minSellerRating`, `minProductCount`, `minSellerReviewCount` | Seller qualification filters |
| `sellerCities`, `sellerBadges` | Optional public profile filters |
| `dedupeMode`, `dedupeStoreName` | Cross-Run seller deduplication |

Both discovery fields may be empty. In that case the Actor crawls the Electronics category and stops after `maxSellers` qualified leads or the configured page shard is complete.

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

Local live runs require `BRIGHT_DATA_API_KEY`. Cloud deployment injects the configured Apify secret through `.actor/actor.json`.
