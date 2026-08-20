/**
 * Per-work reading position, persisted to localStorage. No accounts —
 * see docs/decisions.md ("Reading mode ... remembers position per work").
 *
 * Read on the home screen to render "continue reading" affordances;
 * written from reading routes as the reader moves through them. Never
 * used for auto-redirects — the home screen only ever offers a link.
 */

import { readStoredJson, writeStoredJson } from './storage';

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
