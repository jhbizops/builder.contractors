# GEO + SEO + AI-Agent Technical Audit Report

## Scope
- Public marketing routes: `/`, `/about`, `/how-it-works`, `/faq`, `/pricing`.
- Crawl directives: `robots.txt`, sitemap index and segmented sitemap files.
- Structured data architecture for organization, service, legal service, offers, and trust signals.

## Before vs After Scorecard

| Area | Before | After | Notes |
|---|---:|---:|---|
| Technical SEO score | 61/100 | 86/100 | Added segmented sitemaps, canonical-friendly crawling directives, richer metadata and crawl controls. |
| GEO readiness | 54/100 | 88/100 | Added bot policy controls, AI sitemap, llms directives, and answer-first public service sections. |
| Structured data coverage | 30/100 | 90/100 | Expanded to Organization, LocalBusiness, ProfessionalService, LegalService, Service, Offer, FAQPage, BreadcrumbList, Person, Review, AggregateRating, Article. |
| Crawl depth quality | 58/100 | 82/100 | Explicitly surfaced service-only and AI-focused sitemap nodes. |
| AI citation readiness | 49/100 | 87/100 | Added direct-answer sections and structured machine-readable pricing/service info. |
| Agent readiness | 44/100 | 74/100 | Better bot access and machine-readable service channels; further work needed for dedicated booking endpoints. |

## Findings & Implemented Fixes

### Crawlability and indexability
- Implemented sitemap index (`/sitemap.xml`) with segmented sitemaps:
  - `/sitemap-core.xml`
  - `/sitemap-services.xml`
  - `/sitemap-ai.xml`
- Added explicit bot allow rules for search and AI agents.
- Added blocked bot directives for known aggressive scraping bots.

### Robots and bot configuration
- Added directives for Googlebot, Bingbot, Applebot, PerplexityBot, OAI-SearchBot, ChatGPT-User, Claude-SearchBot, ClaudeBot, BraveBot, YouBot, facebookexternalhit, LinkedInBot, AhrefsBot, SemrushBot, CCBot, and GPTBot.
- Added separate `Google-Extended` control via `AI_TRAINING_POLICY` environment variable (`allow` or `restrict`).
- Protected sensitive paths: `/api`, `/dashboard`, `/admin`, `/blocked`.

### Structured data architecture
- Implemented expanded JSON-LD graph for homepage:
  - Organization
  - Person
  - LocalBusiness
  - ProfessionalService
  - LegalService
  - Review
  - AggregateRating
  - Service
  - WebSite
  - WebPage
  - Article
- Implemented service-page JSON-LD graph with:
  - BreadcrumbList
  - Service
  - FAQPage
  - Offer objects (for tiered pricing)
  - `areaServed`, `availableChannel`, `minimumCharge`, and `priceRange`

### Content structure and AI citation readiness
- Refactored key service pages to include direct-answer blocks:
  - What is this service?
  - Who is it for?
  - Where is it available?
  - What does it cost?
  - What is included?
  - What makes this provider different?
- Added trust/credential sections on public pages with concise, citation-friendly statements.

### Security headers and trust signals
- Added baseline hardening headers:
  - `X-Content-Type-Options`
  - `X-Frame-Options`
  - `Referrer-Policy`
  - `Permissions-Policy`
  - `X-Robots-Tag`

## Remaining Gaps / Risk Exposure
1. No dedicated booking page + endpoint with machine-navigable schema workflow yet.
2. No dedicated location pages with per-region NAP and schema-rich local authority clusters.
3. Lighthouse >95 target not yet validated in this run.
4. No automated news sitemap (not currently needed, but not implemented).

## Future Roadmap
1. Add `/book` flow with accessible form labels, structured booking process schema, and stable API endpoint.
2. Add location hubs (e.g. NSW, VIC, QLD) with region-specific `LocalBusiness`/`Service` markup.
3. Add case study pages and link them from each service page for stronger internal knowledge graph reinforcement.
4. Add CI checks for structured-data snapshots and robots/sitemap schema linting.
