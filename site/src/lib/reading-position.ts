/**
 * Per-work reading position, persisted to localStorage. No accounts —
 * see docs/decisions.md ("Reading mode ... remembers position per work").
 *
 * Read on the home screen to render "continue reading" affordances;
 * written from reading routes as the reader moves through them. Never
 * used for auto-redirects — the home screen only ever offers a link.
 */

import { readStoredJson, writeStoredJson } from './storage';
import type { WorkType } from './types';

export interface ReadingPosition {
	workId: string;
	/** Human-readable label, e.g. "John 3" or "CCC 1234". */
	label: string;
	/** Where to send the reader back to. */
	href: string;
	updatedAt: string;
}

const STORAGE_KEY = 'glossa:positions';

type Positions = Record<string, ReadingPosition>;

export function setPosition(workId: string, label: string, href: string): void {
	const positions = readStoredJson<Positions>(STORAGE_KEY, {});
	positions[workId] = {
		workId,
		label,
		href,
		updatedAt: new Date().toISOString()
	};
	writeStoredJson(STORAGE_KEY, positions);
}

export function getPosition(workId: string): ReadingPosition | undefined {
	return readStoredJson<Positions>(STORAGE_KEY, {})[workId];
}

/** All remembered positions, most recently updated first. */
export function listPositions(): ReadingPosition[] {
	return Object.values(readStoredJson<Positions>(STORAGE_KEY, {})).sort((a, b) =>
		b.updatedAt.localeCompare(a.updatedAt)
	);
}

/**
 * The remembered positions collapsed to ONE ROW PER WORK TYPE, newest first.
 *
 * One row per type rather than per edition or per document: a reader who has
 * opened both the English and the Portuguese Bible would otherwise get two
 * Bible rows, which reads as clutter rather than as two genuinely different
 * shortcuts, and the corpus's ~1,600 individual documents collapse the same
 * way — to whichever one was read last.
 *
 * THE TYPES ARE DISCOVERED, NOT LISTED, and that is the whole reason this
 * function exists rather than a `filter` at each call site. The home page kept
 * a literal `['bible', 'catechism', 'compendium', 'document']`, written before
 * the Social Doctrine and the Code were ingested and never revisited — so a
 * reader halfway through the Code got no row, and would have got none for
 * every work type added after. A list of the types that exist is a list that
 * has to be remembered; the positions themselves already know.
 *
 * `typeOf` is injected rather than imported so this module stays a leaf over
 * `storage.ts`: the resolver is `getWork(id)?.type`, and `corpus.ts` is the
 * far heavier module of the two.
 */
export function continueRows(
	positions: ReadingPosition[],
	typeOf: (workId: string) => WorkType | undefined
): ReadingPosition[] {
	const seen = new Set<WorkType>();
	const out: ReadingPosition[] = [];
	for (const position of positions) {
		const type = typeOf(position.workId);
		// A position whose work is not in this build — a partial sync, an
		// edition withdrawn — is dropped rather than shown as a dead link.
		if (!type || seen.has(type)) continue;
		seen.add(type);
		out.push(position);
	}
	return out;
}
