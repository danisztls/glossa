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
});
