# Ferryclip – Cloudflare guide

Public site `public/index.html` · private admin `/admin` · API in `functions/`.
Posts are stored in Cloudflare D1. Downloads need ONE external service (see step B).

## A. Deploy on Cloudflare (free plan is enough)
1. `npm i -g wrangler` then `wrangler login`
2. `wrangler d1 create ferryclip-db` – paste the printed `database_id` into `wrangler.toml`
3. `wrangler d1 execute ferryclip-db --remote --file=schema.sql`
3b. Add the 3 starter articles: `wrangler d1 execute ferryclip-db --remote --file=seed.sql`
4. `wrangler pages deploy public --project-name ferryclip`
5. Domain: Cloudflare dashboard > Workers & Pages > ferryclip > Custom domains > add `ferryclip.com`
   (if the domain is registered elsewhere, add it to Cloudflare first and switch its nameservers).

## B. Make the downloaders work (needs a provider API)
Browsers cannot fetch videos from TikTok, Instagram or YouTube directly, so `functions/api/resolve.js` asks a media-download API that you subscribe to.
1. Pick a provider (for example one sold on an API marketplace). Read its terms and pricing and check that it supports the platforms you want.
2. In `wrangler.toml` set `DOWNLOAD_API_URL` to the provider's endpoint. Write `{url}` where the video link goes, e.g. `https://host/api?url={url}`.
3. Put the provider's key in a secret, as JSON of request headers:
   `wrangler pages secret put DOWNLOAD_API_HEADERS --project-name ferryclip`
   value example: `{"X-RapidAPI-Key":"YOUR_KEY","X-RapidAPI-Host":"provider-host"}` (use the exact header names your provider documents).
4. Deploy again (A4) and test with a real link. The function collects any media URLs in the provider's JSON; if your provider uses an odd format, edit `collect()` in `resolve.js`.
TikTok and YouTube previews (title, thumbnail) use their public oEmbed and need no key.

## C. Private admin (only you)
1. Cloudflare Zero Trust > Access > Applications > Add > Self-hosted. Paths on your domain: `/admin*` and `/api/admin*`. Policy: allow only your email.
2. Copy the application's AUD tag. Set `ACCESS_AUD` and `ACCESS_TEAM` (your Zero Trust team name) in `wrangler.toml`. Deploy again.
3. Open `https://ferryclip.com/admin`, sign in with the email code and write posts. Each post gets its own page at `/blog/ID`.

## D. Protect it from abuse
- Dashboard > Security > WAF > Rate limiting rules: limit `/api/resolve` (for example 20 requests per minute per IP).
- Keep your provider quota in mind; every Download click is one API call.

## E. Before applying to AdSense
- Replace `support@yourdomain.com` in `index.html` with your real email.
- Publish 10+ original blog posts; keep the About, Privacy, Terms and DMCA pages.

## F. Bot protection (recommended before real traffic)
1. Cloudflare dashboard > Turnstile > Add widget (your domain). Copy the Site key and Secret key.
2. In `public/index.html` set `const TS="YOUR_SITE_KEY";`
3. `wrangler pages secret put TURNSTILE_SECRET --project-name ferryclip` and paste the secret.
4. Deploy again. The Download button then needs the check; repeated links are cached for 10 minutes and cost no API quota.

## G. Search engines and growth
- Google Search Console: add `https://ferryclip.com`, then submit `https://ferryclip.com/sitemap.xml`. Do the same in Bing Webmaster Tools.
- Every page gets its own title, description and canonical link (`functions/_middleware.js`). Edit the texts there.
- Publish 1-2 posts per week. Good topics: how-to guides for creators, tool explainers, comparison and troubleshooting posts.
- Before AdSense in the EU/UK, add a cookie-consent banner (Google's consent tool or a certified CMP).

## H. Security checklist (already in the code)
- Admin API verifies the Cloudflare Access token, same-origin check, JSON-only writes.
- All post text is HTML-escaped; database queries are parameterized.
- Security headers in `public/_headers`; strict CSP on `/admin`. Add AdSense hosts before adding a CSP to public pages.
- Provider key lives only in a Cloudflare secret, never in the page.
