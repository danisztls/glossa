/**
 * `html-minifier-terser` ships no types, and `scripts/minify-build.mjs` is the
 * only thing in this project that imports it.
 *
 * WHY A DECLARATION AND NOT `@types/html-minifier-terser`. The published types
 * describe ~50 options; this project passes four and asserts about them in
 * `MINIFY_OPTIONS`, which the build script exports precisely so the tests
 * exercise the real settings. A dependency whose only purpose is to type one
 * call is a dependency to keep current for no benefit — and the narrow surface
 * here is the more useful one, because a fifth option added to
 * `MINIFY_OPTIONS` fails to compile until someone writes down what it does.
 *
 * WHY IT LIVES UNDER `src/` rather than beside the script it serves. The
 * generated `.svelte-kit/tsconfig.json` includes `../src/**` and `../vite.config.ts`
 * and nothing else; `scripts/` is type-checked only where a test under `src/`
 * imports it. A `.d.ts` in `scripts/` would therefore be invisible, and the
 * `include` list cannot be extended from `tsconfig.json` — an `include` in an
 * extending config REPLACES the base's rather than merging with it, which
 * would silently drop `$types`, the ambient env and the route types.
 *
 * No top-level `import`/`export`: that is what keeps this an ambient script
 * file, so the `declare module` below is global rather than local to a module.
 */
declare module 'html-minifier-terser' {
	/** The four this project sets. Widen deliberately, never with an index signature. */
	export interface Options {
		collapseWhitespace?: boolean;
		removeComments?: boolean;
		minifyJS?: boolean;
		minifyCSS?: boolean;
	}

	export function minify(html: string, options?: Options): Promise<string>;
}
