/**
 * Per-work reading position, persisted to localStorage. No accounts —
 * see docs/decisions.md ("Reading mode ... remembers position per work").
 *
 * Read on the home screen to render "continue reading" affordances;
 * written from reading routes as the reader moves through them. Never
 * used for auto-redirects — the home screen only ever offers a link.
 */

export interface ReadingPosition {
	workId: string;
	/** Human-readable label, e.g. "John 3" or "CCC 1234". */
	label: string;
	/** Where to send the reader back to. */
	href: string;
	updatedAt: string;
}

const STORAGE_KEY = 'depositum:positions';

function readAll(): Record<string, ReadingPosition> {
	if (typeof localStorage === 'undefined') return {};
	try {
		const raw = localStorage.getItem(STORAGE_KEY);
		return raw ? (JSON.parse(raw) as Record<string, ReadingPosition>) : {};
	} catch {
		return {};
	}
}

function writeAll(positions: Record<string, ReadingPosition>) {
	if (typeof localStorage === 'undefined') return;
	localStorage.setItem(STORAGE_KEY, JSON.stringify(positions));
}

export function setPosition(workId: string, label: string, href: string): void {
	const positions = readAll();
	positions[workId] = {
		workId,
		label,
		href,
		updatedAt: new Date().toISOString()
	};
	writeAll(positions);
}

export function getPosition(workId: string): ReadingPosition | undefined {
	return readAll()[workId];
}

/** All remembered positions, most recently updated first. */
export function listPositions(): ReadingPosition[] {
	return Object.values(readAll()).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}
