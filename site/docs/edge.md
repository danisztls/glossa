# The edge

What `src/worker.ts` does on a navigation, what it costs, and what a consumer
that never renders is told.

## Status

**A bogus reference-shaped URL gets a 404, not the shell with a 200.** The
host's ordinary SPA fallback would make every mistyped citation look like a
citable resource, on a site whose whole point is citable deep links.
`corpus-routes.json` is an address-only manifest checked at the edge, generated
from the same indexes the client uses.

**A HEAD answered 404 on every canonical address** until `isNavigation` stopped
requiring `GET`. Nothing on this site issues one, which is why it went unseen;
link checkers, unfurlers and crawlers probing before they fetch issue little
else.

## Cost

**`run_worker_first` is a list of navigation patterns, never `true`.** As a
boolean it routes every request through the worker and every one is a billed
invocation — returning early costs nothing, because the invocation is already
spent. One cold visitor filling the offline library cost ~2,240 of the free
plan's 100,000 per day, and past the limit the platform answers 429 rather than
falling back to the asset, so the whole site goes dark until 00:00 UTC.

**An invocation is one inbound request that reaches the worker, and nothing the
worker does internally multiplies it.** Cloudflare does not bill subrequests
and static assets are free on both plans. **So the only thing that costs
anything here is a navigation, and that is structural**: the worker must run to
decide 200 against 404. The head rewrite rides along on an invocation already
being spent, so there is nothing to reclaim by undoing it, and the client
cannot take it over — only the origin can set a status code.

**Workers Cache stays off**: enabling it bills every request at the standard
rate _including static assets_, so under the attack case it is worse than
neutral.

**Prerendering one shell per canonical address is a real option and is not
done.** The 20,000-file ceiling is per Worker _version_ and Paid raises it, so
it is not the wall it was believed to be; with `not_found_handling: "404-page"`
already set, ~5,957 head-only files would give exactly the worker's semantics
with no invocation at all, and `headFor`/`headHtml`/`noscriptHtml` are already
pure functions of a path. **The order is subscribe first, prerender second, and
they are not the same fix**: Paid turns an overage from an outage into a bill,
where prerendering stops the bill varying with traffic at all.

## The rate limiting rule

**The zone has one rate limiting rule, and it lives in the Cloudflare
dashboard**, because it runs before the worker and is the only lever that costs
nothing to exercise. Block an unverified client at **120 requests per 10
seconds**, per `ip.src` and `cf.colo.id`, over paths outside `/_app/`,
`/fonts/` and `/icons/` and excluding `cf.client.bot`. It was written as a
script that could never apply anything — Wrangler's OAuth token cannot write
that ruleset — and the script was deleted, because **a script that cannot run
reads as though it does.** This is its record.

**`not cf.client.bot` is the SEO clause rather than a concession.** Cloudflare
warns that limiting verified bots may affect indexing, and this site is
deliberately indexable and competing with vatican.va for its own paragraphs. It
gives up less than it looks, since a 10-second per-colo counter clips one
address's burst and never bounded a distributed crawl; and it is Cloudflare's
own verification, so a scraper claiming to be Googlebot is still counted.

**The expression is written in the only two fields the plan allows** — Path and
Verified Bot — which is why the `/a` guard is a custom rule and the burst
exclusion is here.

**The three path exclusions must stay equal to the first three
`run_worker_first` negations.** A reader accepting the offline library pulls
~2,240 assets in a burst from one IP, and counting those would rate-limit the
site's headline feature at the moment it works; that set is also exactly what
is free to serve. What remains is the navigation plus eight precached files, so
a cold visit spends **nine** and a returning reader spends **zero**, and 120 is
about thirteen simultaneous first-time readers behind one address.

**Block, because it is the only action the free plan offers here** — and for
this traffic that is an improvement, since a block answers **429**, the
standardised back-off signal, where a challenge says nothing. The loss is
entirely in the false-positive case, which is why the threshold is 120 rather
than the 40 it would have been under a challenge: a shared exit address is many
readers on one IP.

**What it does not do is bound a daily total.** One rule, per IP, over a
10-second window, so a scraper pacing itself under the threshold stays under it
all day. This stops the crawler that takes the whole budget in twenty minutes
and nothing subtler.

**AI Labyrinth is off**: it works by adding honeypot links so a crawler follows
an endless chain — more requests to a zone whose documented failure mode is too
many navigations — and it injects into HTML, of which this site serves exactly
one file.

## What a crawler that does not render is told

`ssr = false` means the one document served for all ~6,000 addresses is the
whole of what a non-rendering consumer receives, and it had no `<title>` at all
and one library-wide description — the textbook signature of duplicated
content. **The edge writes the head**: an `HTMLRewriter` on every navigation
gives each address its own title, description, OG tags, canonical, `og:url`, a
`BreadcrumbList` and a `<noscript>` with real links.

**The boundary.** What the worker reads is `static/route-titles.json` —
**names**: book names, document titles, prayer titles, Summa question titles,
and the paragraph spans of every titled division. A name is the imprint of a
work, the same class of fact `sitemap.xml` already publishes an address for. No
paragraph, answer or verse reaches the edge, and none may.

**The cost, measured because the objection asked for it**: 6.24 ms mean without
the rewrite and 6.56 ms with it, against a 10 ms CPU limit the asset subrequest
already dominates. One extra subrequest per isolate, none per request.

**Two files, two promises.** `corpus-routes.json` decides the STATUS and
`route-titles.json` only the `<head>`, read through separate module-global
promises, so losing the second costs a name and never a page.

**What guards it is a build assert, not a test.** `assertNamed` refuses a build
where any address in `sitemapPaths` has no name of its own or shares a title
with another. It belongs in the sync because the failure is invisible
everywhere a person looks — the page titles itself at hydration, so a browser
shows the right thing whatever the table holds, and only the consumers that
never render see the gap. Its distinctness check is per language, because a
chrome cluster's members share a title on purpose.

**The reading routes were retitled to match**, because the edge writing one
title and the route assigning another at hydration is a visible rearrangement
on every load. Two were wrong as well as different: the Bible chapter route
suffixed with the EDITION's short title at an address that is deliberately
edition-free, and the Summa route named the work where every other route names
the site.

**The canonical and the sitemap have one definition of the origin.** `<loc>`
and `<link rel="canonical">` are a claim and a confirmation about the same URL,
and a crawler that finds them disagreeing resolves it against the site.
`SITE_ORIGIN` is fixed rather than read from `request.url` for two reasons
found in testing: a request over plain HTTP mints a canonical under `http://`,
and a preview hostname would declare itself canonical. **The 404 head declares
no canonical at all**, since a canonical asserts that this address is the
preferred spelling of a real resource.

**The `<noscript>` is the half a sitemap cannot do.** Every cross-reference is
written by script, so the corpus has no link graph to a consumer that does not
render, and a sitemap says what exists but not what is near what. It is a
`<noscript>` and not a hidden element — content withheld from a rendering
browser but served to a crawler is cloaking.

**`og:url` is written by the edge and omitted from `app.html`.** The static
file is not about any one address, and the only value it could carry is the
site root, which would retitle every deep-link preview to the home page.
`og:locale` is omitted for the same shape of reason.

**The card is generated, not drawn** (`scripts/og-image.mjs`): the site's own
lockup in its own faces, with the words read from `manifest.webmanifest` so the
image cannot claim a name the site does not — drawing it by hand produces a
second wordmark. It is one image in one theme, because a card is served to a
reader whose `prefers-color-scheme` it cannot know. The script is run by hand
and the PNG committed, since it shells out to `woff2_decompress` and
`rsvg-convert`. Nothing on this site fetches the file, which puts it in
`CRAWLER_FILES` and in the `run_worker_first` negations.

## `lastmod`

**The sitemap dates each URL from the English text, because that is the text
the URL serves a crawler.** `<lastmod>` comes from a committed ledger of
per-address fingerprints rather than the build clock — git's granularity is the
work, so one paragraph's correction would read as a change to all 2,865
addresses, which is the lie the element is discounted for. The ledger first
unioned every edition answering at an address, and that was the same lie one
level down: **there is exactly one URL per address and no `hreflang`
alternates**, and a crawler arrives with no preference. The other languages are
one preference away at the same URL and simply get no vote on when it changed.

Narrowing the basis moved every multi-edition hash at once, which is what the
change ceiling exists to refuse, so the migration was a `LEDGER_VERSION` bump —
an unrecognised version re-seeds from each work's own corpus commit date, which
is true. It produced identical dates.

**The eight static pages carry no `lastmod`**, deliberately: they are chrome,
whose content changes with the app, and the ledger does not fingerprint the
app. **The `ETag` is not worth reasoning about either way, and it is worth
saying so** rather than leaving it to look like a compensating mechanism:
`/sitemap.xml` is negated in `run_worker_first`, so the request was already
free of invocations, and what schedules a recrawl is the `<lastmod>` values a
crawler receiving a 304 already holds.

**Deploy guards measure the corpus, not the page count.** Preflight refuses a
fixture-sized build, and one whose reference coverage fell more than 3% below
the committed baseline in any family — every grammar regression so far was
silent. A deliberate drop is recorded with `npm run coverage:accept` and shows
in the diff. There is no CI; a deploy ships one person's working tree.
