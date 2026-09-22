# OnePickGame Improvement Handoff - 2026-09-22

## Included

- Category pages are now indexable in `SEOManager`.
- `CategoryPage` now renders localized SEO title, description, canonical, and hreflang through `Seo`.
- Sitemap generation now includes 16-language category URLs.
- Sitemap `lastmod` now falls back through `updated_at || modified_at || created_at`.
- Worldcup title/description fallback now uses the original field before falling back, avoiding English as an accidental middle fallback.
- The legacy `1234` admin helper no longer grants admin mode.
- Added focused regression tests for localization fallback.
- Tier List and Quiz home cards received a small visual consistency pass:
  card shadow, thumbnail focus, metadata readability, and Quiz search height were aligned more closely with the Bracket home rhythm.

## Intentionally Not Changed

- `Match.js` and `MatchPage.js` were not edited.
- No database schema change is required.
- The active admin flow in `App.js` was not migrated to a new DB role column because the target schema/RLS was not confirmed.
- Bigger engagement features such as favorites/trending RPC were left out of this safety pass to reduce deployment risk.
- `Match.js` and tournament gameplay state logic were still left untouched during the design pass.

## Verification Commands

```bash
npm test -- --watchAll=false
npm run build
```

If sitemap generation cannot reach Supabase in a restricted network, run the React build directly:

```bash
./node_modules/.bin/react-scripts build
```
