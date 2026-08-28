/**
 * Every Doré plate this build emitted, keyed by file name.
 *
 * The same glob-with-`?url` mechanism as `content-urls.ts`, and a separate
 * module for the same reason that one is separate: the glob is the only way
 * to learn the hashed asset URL a build assigns, and it must be written once.
 * See `content-urls.ts` for the full argument, and `vite.config.ts` for the
 * `assetsInlineLimit` rule that keeps anything under `corpus-data/` out of
 * the boot chunk — a base64'd plate would defeat the whole deferred-load
 * design silently, exactly as it did for the document outlines.
 *
 * A FUNCTION RATHER THAN THE EXPORTED MAP `content-urls.ts` uses, because
 * that is what lets the dev twin be a formula instead of an inventory: in
 * `vite dev` a `?url` import resolves to the file's own path under the project
 * root, so `plates/OT-001-800.avif` is derivable and 482 module requests are
 * not worth spending to be told it.
 */

const globbed = import.meta.glob('./corpus-data/plates/*.avif', {
	eager: true,
	query: '?url',
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
