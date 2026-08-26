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
 * shell plus a handful of one-per-visit files (`/service-worker.js`,
 * `/manifest.webmanifest`, `/corpus-routes.json`, `/favicon.ico`), so a human
 * cold visit spends about six of the allowance and an in-app route change
 * spends none at all: the SPA changes address with `pushState` and never asks
 * the edge again.
 *
 * WHY `cf.client.bot` RATHER THAN A USER-AGENT TEST. The free plan restricts
 * this expression to two fields, Path and Verified Bot, and that restriction is
 * a good one: it makes the rule exempt Googlebot and Bingbot by Cloudflare's own
 * verification (reverse DNS, published ranges) instead of by a string anyone can
 * send. `cf.client.bot` is the all-plans spelling and "provides the same
 * information" as `cf.bot_management.verified_bot`. A crawler we WANT is
 * verified and uncapped; a crawler pretending to be one is not.
 *
 * WHY MANAGED CHALLENGE RATHER THAN BLOCK. A shared exit address — a household,
 * an office, a VPN, a university — is several readers on one IP, and with only
 * a 10-second characteristic there is no way to tell them apart. A managed
 * challenge is invisible to a browser that can solve it and fatal to a scraper
 * that cannot, so the failure mode for a false positive is a moment's delay
 * rather than a locked door.
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
 * Requests per 10 seconds per IP before the challenge starts.
 *
 * A cold human visit spends ~6 (see the exclusions note above) and an in-app
 * route change spends none, so 40 is roughly six simultaneous cold readers
 * behind one address. It caps a scraper at 4 requests/second, which is slower
 * than the 2-second courtesy this project already extends to vatican.va.
 */
const REQUESTS_PER_PERIOD = 40;

const STATIC_PREFIXES = ['/_app/', '/fonts/', '/icons/'];

const rule = {
	description: DESCRIPTION,
	// Free plan: Path and Verified Bot are the only fields permitted here.
	expression: [
		...STATIC_PREFIXES.map((p) => `not starts_with(http.request.uri.path, "${p}")`),
		'not cf.client.bot'
	].join(' and '),
	action: 'managed_challenge',
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
