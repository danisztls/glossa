/**
 * The offline library, as rows a reader can act on: what each wave holds, how
 * much of it is already on the device, and what it would cost to finish.
 *
 * WHY THIS EXISTS AT ALL. `planWaves` has computed per-wave byte counts since
 * the corpus was split, and its own docblock says the number is there so a UI
 * can price a download *before* committing a reader to it. Nothing ever asked
 * for it: `requestWave`, `requestWork` and `WaveProgress` sat written and
 * unused, and offline mode shipped (2026-09-02) as the second half of a
 * feature whose first half did not exist — a switch that says "only what is
 * already here" beside no way to put anything here. This is the first half.
 *
 * PURE, AND SEPARATE FROM THE STORE, for the reason CLAUDE.md gives about
 * `inline-html.ts`: logic inside a `.svelte` file is logic no test in this
 * repo can reach, and the arithmetic here is the part that can silently be
 * wrong. A `heldBytes` that never matches — one side a pathname, the other an
 * absolute href — renders "0 of 24 MB" for a reader whose library is complete,
 * and nothing errors.
 */

import type { Wave, WaveId } from './sw-policy';
import { bcp47 } from './ui-langs';

/** One shelf: a wave, priced, and measured against what is on the device. */
export interface LibraryRow {
	id: WaveId;
	/** Files in the wave, and how many of them are already cached. */
	count: number;
	heldCount: number;
	/**
	 * RAW bytes, not transfer size — `Wave.bytes`'s own docblock says this is
	 * the number to show, because `content-length` is only knowable after
	 * fetching, which is too late to ask. It over-states the download by
	 * roughly three (the corpus gzips to about a third), and over-stating is
	 * the safe direction for a reader deciding whether to spend it.
	 */
	bytes: number;
	heldBytes: number;
	/** Nothing left to fetch. Not `heldBytes === bytes`: a wave is finished
	 *  when every file is present, and equal byte totals with a missing file
	 *  is not a state that should read as done. */
	complete: boolean;
}

/**
 * Waves that are never offered as a row.
 *
 * `neighbours` is the chunk either side of what the reader has open — a
 * prefetch of the next page, not a shelf. It is a different set on every
 * navigation, it is already automatic, and a row for it would offer a reader
 * a download whose contents change while they look at it.
 */
const NOT_A_SHELF: ReadonlySet<WaveId> = new Set<WaveId>(['neighbours']);

/**
 * The order the shelves are READ in, which is not the order they download in.
 *
 * `WAVE_ORDER` is a priority — descending value per byte — and that is the one
 * thing about it that must not be disturbed: it decides what an interrupted
 * fill got to, so `illustrations` (103 MB of engravings) belongs at its very
 * end. But a panel is a list of the library's parts, and Doré's plates are a
 * thing about the Bible. Held apart by the download priority they sat two rows
 * below it with the Summa in between, reading as an unrelated shelf.
 *
 * Only the reading order moves. Nothing downstream reads a row's position, and
 * `planWaves` is untouched, so the two orders can differ without either being
 * wrong. A wave missing from this list sorts last rather than vanishing.
 */
const SHELF_ORDER: readonly WaveId[] = [
	'essentials',
	'catechism',
	'scripture',
	'illustrations',
	'illustrations-detail',
	'magisterium',
	'summa',
	'other'
];

/**
 * The rows for one reader, in `SHELF_ORDER`.
 *
 * An EMPTY wave is dropped rather than shown at 0 MB: a reader whose language
 * chain holds no Summa has no Summa to download, and a row saying so is a row
 * about a work they cannot have. This is also why the panel cannot be a static
 * list of six — it is a property of the reader's languages.
 */
export function libraryRows(waves: readonly Wave[], held: ReadonlySet<string>): LibraryRow[] {
	const rows: LibraryRow[] = [];
	for (const wave of waves) {
		if (NOT_A_SHELF.has(wave.id) || wave.assets.length === 0) continue;
		let heldCount = 0;
		let heldBytes = 0;
		for (const asset of wave.assets) {
			if (!held.has(asset.path)) continue;
			heldCount += 1;
			heldBytes += asset.bytes;
		}
		rows.push({
			id: wave.id,
			count: wave.assets.length,
			heldCount,
			bytes: wave.bytes,
			heldBytes,
			complete: heldCount === wave.assets.length
		});
	}
	const place = (id: WaveId) => {
		const at = SHELF_ORDER.indexOf(id);
		return at === -1 ? SHELF_ORDER.length : at;
	};
	return rows.sort((a, b) => place(a.id) - place(b.id));
}

/**
 * The pathnames a cache holds, from its keys.
 *
 * THE COMPARISON THIS FEEDS IS THE ONE THAT FAILS SILENTLY. A cache key is a
 * Request whose `url` is absolute; `ContentEntry.path` is what `contentPath`
 * produced, which is a pathname. Comparing the two raw matches nothing, every
 * row reads 0, and no error is raised anywhere — the same class of mismatch
 * `sw-policy.ts`'s `contentPath` docblock is written about, one layer up.
 */
export function heldPaths(keys: readonly { url: string }[]): Set<string> {
	const paths = new Set<string>();
	for (const key of keys) {
		try {
			paths.add(new URL(key.url).pathname);
		} catch {
			// A key that is not a URL cannot be one of ours.
		}
	}
	return paths;
}

/** Sum of every row, for the one line that answers "how much have I got". */
export function libraryTotal(rows: readonly LibraryRow[]): {
	bytes: number;
	heldBytes: number;
	complete: boolean;
} {
	let bytes = 0;
	let heldBytes = 0;
	let complete = true;
	for (const row of rows) {
		bytes += row.bytes;
		heldBytes += row.heldBytes;
		if (!row.complete) complete = false;
	}
	return { bytes, heldBytes, complete: complete && rows.length > 0 };
}

/**
 * A size a reader can read, in their own number formatting.
 *
 * Megabytes and kilobytes as SI powers of ten, matching what
 * `service-worker.ts` already prints (`bytes / 1e6`) and what a phone's own
 * data counter says. The unit symbols are deliberately untranslated: MB and KB
 * are read as symbols rather than as words, the way `%` is in the size
 * stepper, and a translated unit in a table of numbers reads as prose.
 *
 * `lang` rather than the ambient locale, because the interface language is the
 * reader's stated choice and `undefined` would follow the browser's instead —
 * so a Portuguese reader would be shown `24.1` in a panel that says `24,1`
 * everywhere else.
 */
export function formatBytes(bytes: number, lang: string): string {
	if (bytes >= 1e6) return `${number(bytes / 1e6, lang, 1)} MB`;
	if (bytes >= 1e3) return `${number(bytes / 1e3, lang, 0)} KB`;
	return `${number(bytes, lang, 0)} B`;
}

function number(value: number, lang: string, decimals: number): string {
	try {
		// `bcp47`, or the paragraph above is false for one reader: `zht` is a
		// structurally valid tag `Intl` cannot resolve, so it does not throw
		// into the `catch` — it quietly returns the browser's default locale,
		// which is the exact outcome passing `lang` at all exists to prevent.
		return new Intl.NumberFormat(bcp47(lang), {
			minimumFractionDigits: decimals,
			maximumFractionDigits: decimals
		}).format(value);
	} catch {
		// An unknown or malformed tag. The number still has to render.
		return value.toFixed(decimals);
	}
}
