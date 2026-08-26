/**
 * The zone's one rate limiting rule, kept here rather than only in a dashboard.
 *
 * `wrangler.jsonc` already states the reason for writing infrastructure down:
 * "this file, not an account someone else cannot see, is the record of where
 * the worker is reachable". The same argument applies to the rule that decides
 * which requests reach the worker at all — more so, because this one is
 * invisible from the repository and silently governs the site's cost.
 *
 * WHAT IT IS FOR. Every HTML navigation costs one Worker invocation against the
 * free plan's 100,000/day (`wrangler.jsonc`, `run_worker_first`). The sitemap
 * advertises ~5,800 canonical addresses, so one full crawl is ~6% of a day.
 * Nothing bounds how many crawls happen. A rule that runs in the WAF, before
 * the Worker, is the only lever that costs nothing to exercise: per Cloudflare's
 * pricing page, "only requests that hit a Worker will count against your limits
 * and your bill", and a challenged request never gets there.
 *
 * WHAT IT IS NOT FOR, and this is the honest part. The free plan allows ONE
 * rule, counting by IP, over a 10-second window, with a 10-second mitigation
 * timeout (waf/rate-limiting-rules, Availability). A 10-second window cannot
 * bound a daily total: a scraper pacing itself just under the threshold stays
 * under it all day. This rule stops the pathological case — the crawler that
 * takes the whole budget in twenty minutes — and nothing subtler. The levers
 * that bound the total are the AI-crawler controls and an accurate sitemap
 * `lastmod` (`scripts/lastmod.mjs`).
 *
 * WHY THE EXCLUSIONS ARE LOAD-BEARING. A reader who accepts the offline library
 * pulls ~2,240 content assets in a burst from one IP (`src/lib/sw-policy.ts`).
 * Counting those would rate-limit the site's own headline feature at exactly the
 * moment it works. So the expression excludes the same static prefixes
 * `run_worker_first` negates, which is also precisely the set that is free to
 * serve — there is nothing to protect there. What remains is the navigation
 * shell plus the eight one-per-visit files the service worker precaches from
 * outside those prefixes (`/service-worker.js`, `/manifest.webmanifest`,
 * `/favicon.ico`, `/corpus-routes.json`, `/reference-coverage.json`,
 * `/offline.html`, `/robots.txt`, `/llms.txt`), so a human cold visit spends
 * NINE of the allowance and an in-app route change spends none at all: the SPA
 * changes address with `pushState` and never asks the edge again.
 *
 * WHY `cf.client.bot` RATHER THAN A USER-AGENT TEST. The free plan restricts
 * this expression to two fields, Path and Verified Bot, and that restriction is
 * a good one: it makes the rule exempt Googlebot and Bingbot by Cloudflare's own
 * verification (reverse DNS, published ranges) instead of by a string anyone can
 * send. `cf.client.bot` is the all-plans spelling and "provides the same
 * information" as `cf.bot_management.verified_bot`. A crawler we WANT is
 * verified and uncapped; a crawler pretending to be one is not.
 *
 * BLOCK, BECAUSE IT IS THE ONLY ACTION THE FREE PLAN OFFERS HERE. Managed
 * challenge was the first choice and is not on the menu; the dashboard's action
 * list for a free-plan rate limiting rule holds Block and nothing else.
 *
 * For the traffic this rule is actually aimed at, that is an improvement rather
 * than a concession. A blocked request answers **429**, which is the
 * standardised "you are going too fast" signal — Google documents backing off
 * on it, and any crawler worth keeping does the same. A challenge says nothing
 * a crawler can act on; a 429 says exactly the thing we want said.
 *
 * The loss is entirely in the false-positive case, and it is why the threshold
 * below moved. A shared exit address — a household, an office, a university, a
 * mobile carrier's CGNAT — is many readers on one IP, and a 10-second
 * characteristic cannot tell them apart. Under a challenge a false positive was
 * an invisible moment; under Block it is a hard 429 for ten seconds. So the
 * rule is set where a false positive is implausible rather than merely
 * unlikely, and accepts a slower cap in exchange.
 *
 * Usage (needs an API token with Zone -> WAF -> Edit on this zone; the OAuth
 * token wrangler holds is `zone:read` only and cannot write this):
 *
 *     node scripts/waf-rate-limit.mjs                     # print the payload
 *     CLOUDFLARE_API_TOKEN=... npm run waf:rate-limit -- --apply
 */

const ZONE_ID = process.env.CLOUDFLARE_ZONE_ID ?? 'd3137ec7fc9d5a583546986da0e71e9d';
const API = 'https://api.cloudflare.com/client/v4';

/** Identifies our rule in a ruleset we are about to replace wholesale. Changing
 *  this string orphans the rule already deployed under the old one. */
const DESCRIPTION = 'glossa: cap unverified bursts on navigations';

/**
 * Requests per 10 seconds per IP before the block starts.
 *
 * Almost nothing a reader does counts, and the offline library — the thing
 * that looks like it would — counts LEAST: all 2,764 content assets are
 * emitted under `/_app/immutable/assets/`, so the ~2,240-file background fill
 * is excluded in full by the first exclusion above. An in-app route change is
 * a `pushState` and never reaches the edge, and a returning reader is served
 * the shell by their own service worker — so a RETURNING reader spends zero.
 * What counts is a cold visit: the navigation plus the eight precached files
 * listed in the header, so NINE, and only the first time.
 *
 * 120 is therefore roughly thirteen simultaneous FIRST-TIME readers behind one
 * address in the same ten seconds. That is the headroom Block buys: it was 40
 * while the action was a managed challenge, where being wrong cost nothing.
 *
 * It caps an unverified client at 12 requests/second, which still stops the
 * case this rule exists for — a runaway crawler taking the day's 100,000
 * invocations in twenty minutes needs 83/second. It does NOT bound a daily
 * total, and no 10-second rule can; see the header.
 */
const REQUESTS_PER_PERIOD = 120;

const STATIC_PREFIXES = ['/_app/', '/fonts/', '/icons/'];

const rule = {
	description: DESCRIPTION,
	// Free plan: Path and Verified Bot are the only fields permitted here.
	expression: [
		...STATIC_PREFIXES.map((p) => `not starts_with(http.request.uri.path, "${p}")`),
		'not cf.client.bot'
	].join(' and '),
	action: 'block',
	enabled: true,
	ratelimit: {
		// `cf.colo.id` is required alongside the counting characteristic: the
		// counter is per data centre, not global, which is another reason this
		// bounds a burst rather than a daily total.
		characteristics: ['ip.src', 'cf.colo.id'],
		period: 10,
		requests_per_period: REQUESTS_PER_PERIOD,
		mitigation_timeout: 10
	}
};

const apply = process.argv.includes('--apply');
const force = process.argv.includes('--force');

if (!apply) {
	console.log(JSON.stringify({ zone: ZONE_ID, rules: [rule] }, null, 2));
	console.log('\nDry run. Re-run with --apply and CLOUDFLARE_API_TOKEN set to deploy.');
	process.exit(0);
}

const token = process.env.CLOUDFLARE_API_TOKEN;
if (!token) {
	console.error('CLOUDFLARE_API_TOKEN is not set (needs Zone -> WAF -> Edit on this zone).');
	process.exit(1);
}

/**
 * @param {string} path
 * @param {RequestInit} [init]
 */
async function api(path, init) {
	const response = await fetch(`${API}${path}`, {
		...init,
		headers: {
			Authorization: `Bearer ${token}`,
			'Content-Type': 'application/json',
			...init?.headers
		}
	});
	const body = await response.json();
	if (!body.success) {
		const detail = (body.errors ?? []).map((e) => `${e.code}: ${e.message}`).join('; ');
		throw new Error(`${path} failed -- ${detail || response.status}`);
	}
	return body.result;
}

const phase = `/zones/${ZONE_ID}/rulesets/phases/http_ratelimit/entrypoint`;

// The free plan holds ONE rule and this script PUTs the whole ruleset, so a
// rule somebody added by hand would disappear without being mentioned. Read
// first and stop rather than clobber: an unexplained rule in a zone is more
// likely deliberate than stale.
const existing = await api(phase).catch(() => undefined);
const strangers = (existing?.rules ?? []).filter((r) => r.description !== DESCRIPTION);
if (strangers.length && !force) {
	console.error('Refusing to replace rate limiting rules this script did not write:');
	for (const r of strangers) console.error(`  - ${r.description || '(no description)'}`);
	console.error('Re-run with --force if replacing them is what you meant.');
	process.exit(1);
}

const result = await api(phase, { method: 'PUT', body: JSON.stringify({ rules: [rule] }) });
console.log(`Applied to zone ${ZONE_ID}. Ruleset version ${result.version}:`);
for (const r of result.rules ?? []) {
	console.log(
		`  ${r.action}  ${r.ratelimit?.requests_per_period}/${r.ratelimit?.period}s  ${r.description}`
	);
}
