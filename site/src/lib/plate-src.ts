/**
 * `srcset` and `src` for one plate.
 *
 * SEPARATE FROM `plates.ts` BECAUSE OF WHO READS THAT FILE. `plates.ts` holds
 * the vocabulary both ends share, and one of those ends is
 * `scripts/sync-corpus.mjs` running under plain Node — which strips the types
 * and executes the rest. `import.meta.glob` is a Vite construct that exists
 * only inside a Vite transform, so importing `./plate-urls` from `plates.ts`
 * would take the sync down at startup, long before anything about plates was
 * in question.
 *
 * It also has to be a module under `src/lib/` rather than an import inside the
 * component: `vite.config.ts`'s dev substitution matches the RELATIVE
 * specifier `./plate-urls`, because `vite:alias` resolves `$lib/...` before
 * any other plugin can see it. A `$lib/plate-urls` import from a `.svelte`
 * file would silently get the real glob in dev — one module request per
 * rendition of every plate, no error.
 */
import { PLATE_DETAIL_WIDTH, PLATE_WIDTHS, plateImageName } from './plates';
import { plateUrl } from './plate-urls';

/** The `srcset` for a plate, or undefined when this build emitted none of its
 *  renditions — an unsynced corpus, where the reader gets no figure at all
 *  rather than a broken image. */
export function plateSrcset(id: string): string | undefined {
	const candidates = PLATE_WIDTHS.map((width) => {
		const url = plateUrl(plateImageName(id, width));
		return url ? `${url} ${width}w` : undefined;
	}).filter((entry): entry is string => entry !== undefined);
	return candidates.length > 0 ? candidates.join(', ') : undefined;
}

/** The fallback `src`, for a browser that ignores `srcset`. The smallest
 *  rendition: it is the one every viewport can use. */
export function plateSrc(id: string): string | undefined {
	return plateUrl(plateImageName(id, PLATE_WIDTHS[0]));
}

/**
 * The zoom rendition, or undefined when this build has none.
 *
 * NOT IN THE `srcset` ABOVE, and this function is the whole reason the width
 * is a separate constant — see `PLATE_DETAIL_WIDTH`. Nothing renders this into
 * markup; `PlateViewer` asks for it at the moment a reader zooms, so the fetch
 * is an answer to a gesture rather than a candidate the browser may pick.
 *
 * UNDEFINED IS AN ORDINARY ANSWER, not an error: a corpus derived before this
 * width existed has the two served renditions and not the third, and the
 * viewer then behaves exactly as it did — fit, and the loaded file's own
 * natural size. So the site works against an older corpus without a flag.
 */
export function plateDetailSrc(id: string): string | undefined {
	return plateUrl(plateImageName(id, PLATE_DETAIL_WIDTH));
}
