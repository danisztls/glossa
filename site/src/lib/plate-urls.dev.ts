/**
 * `plate-urls.ts` for the dev server, substituted for it by `vite.config.ts`'s
 * `glossa:dev-content-urls` plugin. Never in a build.
 *
 * The argument is `content-urls.dev.ts`'s, one step shorter. An eager glob is
 * one module request per matched file on every full reload, and the plates are
 * three per engraving — on their own not the ~2,590 that took the dev server
 * past what a browser will open, but added to that count for no gain, since in
 * dev there are no hashed URLs to learn: Vite serves a `?url` import straight
 * back as the file's own path under the project root.
 *
 * So the URL is computed rather than looked up, and the one thing that cannot
 * be assumed — the prefix Vite is actually serving `corpus-data/` from — is
 * MEASURED, by the same single `?url` import of the content manifest that
 * `content-urls.dev.ts` uses. Hardcoding `/src/lib/corpus-data/` would work
 * until this file moved or `base` stopped being `/`.
 *
 * It answers for a name whether or not the file exists, which the real module
 * does not. That is not a divergence worth closing: the only caller reads
 * names out of `content/dore.tours/plates.json`, and the sync writes that file
 * from the same loop that copies the images.
 */

const MANIFEST_REL_PATH = 'index/content-manifest.json';

const manifestUrls = import.meta.glob('./corpus-data/index/content-manifest.json', {
	eager: true,
	query: '?url',
	import: 'default'
}) as Record<string, string>;

const prefix = (() => {
	const url = Object.values(manifestUrls)[0];
	if (!url?.endsWith(MANIFEST_REL_PATH)) return undefined;
	return url.slice(0, url.length - MANIFEST_REL_PATH.length);
})();

export function plateUrl(name: string): string | undefined {
	return prefix ? `${prefix}plates/${name}` : undefined;
}
