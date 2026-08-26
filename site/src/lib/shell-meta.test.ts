import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';

/**
 * The static `<head>` of the SPA shell.
 *
 * `src/routes/+layout.ts` sets `ssr = false` and the build emits no per-route
 * HTML, so `src/app.html` is the document every address is served. Anything a
 * consumer that does not run JavaScript is meant to read has to be in it
 * literally, and nothing on a rendered page shows whether it still is.
 */
const read = (p: string) => readFileSync(path.join(process.cwd(), p), 'utf8');

describe('app.html', () => {
	// The manifest's `description` is shown by the install prompt; app.html's
	// is shown by search results and link unfurls. They are the same sentence
	// deliberately, and they are two copies by necessity — the manifest is
	// JSON the browser fetches on its own, with nowhere to interpolate from.
	it('carries a meta description equal to the manifest description', () => {
		const manifest = JSON.parse(read('static/manifest.webmanifest')) as { description: string };
		const declared = /<meta\s+name="description"\s+content="([^"]*)"/.exec(
			read('src/app.html')
		)?.[1];

		expect(declared, 'no `<meta name="description">` found in src/app.html').toBeDefined();
		expect(declared).toBe(manifest.description);
	});

	// The shell shipped without one for months. An untitled document is what
	// every non-rendering consumer saw at all 5,812 addresses, and nothing on a
	// rendered page — where the route's own title has long since replaced it —
	// shows that the static one is missing.
	it('carries a static title, so a consumer that does not render has a name for the page', () => {
		const declared = /<title>([^<]*)<\/title>/.exec(read('src/app.html'))?.[1];
		expect(declared, 'no `<title>` found in src/app.html').toBeDefined();
		expect(declared?.trim()).not.toBe('');
	});

	// SvelteKit fills the head and body placeholders with
	// `String.replace(string, …)` (core/sync/write_server.js), which rewrites
	// the first occurrence in the file and no other. So a second one anywhere
	// — a comment explaining the shell is how it happened — swallows the real
	// substitution and leaves the token at the foot of the `<head>` as text,
	// which the parser moves into the body: the page prints `%sveltekit.head%`
	// at the top and never boots, because the module script went into the
	// comment. Nothing else fails; the build succeeds and every test but this
	// one passes.
	it.each(['head', 'body'])('spells the %s placeholder exactly once', (name) => {
		const token = `%sveltekit.${name}%`;
		const occurrences = read('src/app.html').split(token).length - 1;
		expect(occurrences, `\`${token}\` must appear once in src/app.html`).toBe(1);
	});

	// Equal to the English `home.title`, which the root layout assigns at
	// hydration: if they drift, the title visibly changes as the app boots.
	it('titles the shell the same as the root layout does', () => {
		const declared = /<title>([^<]*)<\/title>/.exec(read('src/app.html'))?.[1];
		const layoutTitle = /'home\.title':\s*'([^']*)'/.exec(read('src/lib/i18n/en.ts'))?.[1];

		expect(layoutTitle, "no `'home.title'` found in src/lib/i18n/en.ts").toBeDefined();
		expect(declared).toBe(layoutTitle);
	});
});

/**
 * The link-preview card.
 *
 * Three files have to agree and none of them imports another: `src/app.html`
 * declares the tags, `static/og.png` is the image they point at, and
 * `scripts/og-image.mjs` generated it from `static/manifest.webmanifest`. A
 * card is also the one part of the site nobody working on it ever looks at —
 * it renders in someone else's chat client — so nothing but this file notices
 * when a rename leaves the image saying the old name, or a redesign leaves the
 * declared dimensions describing the old PNG.
 */
describe('app.html Open Graph', () => {
	const html = read('src/app.html');
	const property = (name: string) =>
		new RegExp(`<meta\\s+property="${name}"\\s+content="([^"]*)"`).exec(html)?.[1] ??
		// Prettier breaks a long tag across lines, putting the attributes on
		// their own; match that shape too rather than depending on the width of
		// any one value.
		new RegExp(`property="${name}"\\s+content="([^"]*)"`).exec(html)?.[1];

	// The unfurl is a second rendering of the title and description the rest of
	// the head already carries. Two consumers, one claim.
	it('titles and describes the card the same as the page', () => {
		expect(property('og:title')).toBe(/<title>([^<]*)<\/title>/.exec(html)?.[1]);
		expect(property('og:description')).toBe(
			/<meta\s+name="description"\s+content="([^"]*)"/.exec(html)?.[1]
		);
	});

	// Absolute because a scraper is not a browser and has no document to
	// resolve a rooted path against — and on the host `wrangler.jsonc` routes,
	// not on whatever the last environment happened to be.
	it('points at the image absolutely, on the canonical host', () => {
		expect(property('og:image')).toBe('https://glossacatholica.org/og.png');
	});

	/**
	 * Declared so an unfurler can lay the card out before the bytes arrive —
	 * which makes them a claim about the file, checked here against the file's
	 * own PNG header (bytes 16-23 of IHDR).
	 */
	it('declares the dimensions static/og.png actually has', () => {
		const header = readFileSync(path.join(process.cwd(), 'static/og.png')).subarray(0, 24);
		expect(property('og:image:width')).toBe(String(header.readUInt32BE(16)));
		expect(property('og:image:height')).toBe(String(header.readUInt32BE(20)));
	});

	// The one thing Open Graph cannot say. Without it the card is a square
	// thumbnail with the wordmark cropped out of it.
	it('asks for the large card shape', () => {
		expect(/<meta\s+name="twitter:card"\s+content="([^"]*)"/.exec(html)?.[1]).toBe(
			'summary_large_image'
		);
	});

	/**
	 * `og:url` names the canonical address of the thing being unfurled, and one
	 * document answers 5,812 of them here — so any value it could carry would
	 * redirect every deep-link preview to the home page. Absent, the unfurler
	 * uses the URL it fetched. This is an assertion that it STAYS absent,
	 * because adding it looks like completing the set.
	 */
	it('declares no og:url', () => {
		expect(property('og:url')).toBeUndefined();
	});

	// Alt text describes the image to a reader who cannot see it, and an unfurl
	// is often the only thing a screen reader gets of a shared link.
	it('describes the image', () => {
		expect(property('og:image:alt')?.length).toBeGreaterThan(20);
	});
});
