/**
 * The compact, public description of canonical reader URLs.
 *
 * This deliberately contains addresses and no reading text. It is generated
 * from the same corpus indexes the client uses, then consulted by the edge
 * worker before it returns the SPA shell. Keeping the grammar here makes the
 * client and the worker testable without giving either one a special case for
 * individual works.
 */

export interface RouteManifest {
	version: 1;
	/** Deployment guard only; not used to decide any one URL. */
	workCount: number;
	/** Deployment guard only; not used to decide any one URL. */
	contentAssetCount: number;
	bible: Record<string, number[]>;
	ccc: number[];
	cccChapters: number[];
	compendium: number[];
	compendiumChapters: number[];
	documents: string[];
	prayers: string[];
}

const STATIC_PATHS = new Set([
	'/',
	'/scriptura',
	'/catechismus',
	'/compendium',
	'/documenta',
	'/preces',
	'/colophon',
	'/404'
]);

function canonicalNumber(segment: string): number | undefined {
	// Reader routes have never emitted leading zeroes. Rejecting them here
	// means one resource has one canonical spelling, rather than making
	// /catechismus/01234 and /catechismus/1234 indistinguishable cache keys.
	if (!/^[1-9]\d*$/.test(segment)) return undefined;
	const value = Number(segment);
	return Number.isSafeInteger(value) ? value : undefined;
}

function hasNumber(numbers: number[], segment: string): boolean {
	const value = canonicalNumber(segment);
	return value !== undefined && numbers.includes(value);
}

/** True exactly for an address the corpus or the app shell can resolve. */
export function isCanonicalPath(pathname: string, manifest: RouteManifest): boolean {
	if (STATIC_PATHS.has(pathname)) return true;

	const parts = pathname.split('/').filter(Boolean);
	if (parts[0] === 'scriptura' && parts.length === 3) {
		return hasNumber(manifest.bible[parts[1]] ?? [], parts[2]);
	}
	if (parts[0] === 'catechismus') {
		if (parts.length === 2) return hasNumber(manifest.ccc, parts[1]);
		if (parts.length === 3 && parts[1] === 'caput') {
			return hasNumber(manifest.cccChapters, parts[2]);
		}
		return false;
	}
	if (parts[0] === 'compendium') {
		if (parts.length === 2) return hasNumber(manifest.compendium, parts[1]);
		if (parts.length === 3 && parts[1] === 'caput') {
			return hasNumber(manifest.compendiumChapters, parts[2]);
		}
		return false;
	}
	if (parts[0] === 'documenta' && parts.length === 2) {
		return manifest.documents.includes(parts[1]);
	}
	if (parts[0] === 'preces' && parts.length === 2) {
		return manifest.prayers.includes(parts[1]);
	}

	return false;
}
