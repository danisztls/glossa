/**
 * Every Doré plate this build emitted, keyed by file name.
 *
 * The same glob-with-`?url` mechanism as `content-urls.ts`, and a separate
 * module for the same reason that one is separate: the glob is the only way
 * to learn the hashed asset URL a build assigns, and it must be written once.
 * See `content-urls.ts` for the full argument, and for why the `no-inline`
 * below is on the import rather than left to `vite.config.ts`'s
 * `assetsInlineLimit`: the service-worker bundle reads this module through a
 * Vite build that never sees that config. No plate is anywhere near the 4 KB
 * limit today, so this one is a statement of the requirement rather than a
 * fix — a base64'd plate would defeat the whole deferred-load design
 * silently, exactly as it did for the document outlines.
 *
 * A FUNCTION RATHER THAN THE EXPORTED MAP `content-urls.ts` uses, because
 * that is what lets the dev twin be a formula instead of an inventory: in
 * `vite dev` a `?url` import resolves to the file's own path under the project
 * root, so `plates/OT-001-800.avif` is derivable and one module request per
 * rendition of every plate is not worth spending to be told it.
 */

const globbed = import.meta.glob('./corpus-data/plates/*.avif', {
	eager: true,
	query: '?url&no-inline',
	import: 'default'
}) as Record<string, string>;

const byName: Record<string, string> = Object.fromEntries(
	Object.entries(globbed).map(([globPath, url]) => [
		globPath.slice(globPath.lastIndexOf('/') + 1),
		url
	])
);

/** The hashed URL for `OT-001-800.avif`, or undefined when this build has no
 *  such image — an unsynced corpus, or a plate whose master never fetched. */
export function plateUrl(name: string): string | undefined {
	return byName[name];
}
