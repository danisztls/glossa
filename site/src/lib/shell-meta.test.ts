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

	// Equal to the English `home.title`, which the root layout assigns at
	// hydration: if they drift, the title visibly changes as the app boots.
	it('titles the shell the same as the root layout does', () => {
		const declared = /<title>([^<]*)<\/title>/.exec(read('src/app.html'))?.[1];
		const layoutTitle = /'home\.title':\s*'([^']*)'/.exec(read('src/lib/i18n/en.ts'))?.[1];

		expect(layoutTitle, "no `'home.title'` found in src/lib/i18n/en.ts").toBeDefined();
		expect(declared).toBe(layoutTitle);
	});
});
