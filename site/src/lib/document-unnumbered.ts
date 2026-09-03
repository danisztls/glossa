/**
 * Placing a document's UNNUMBERED matter: the runs of prose the source prints
 * with no number on them, and the headings that stand over them.
 *
 * `appendix.json` holds the text and knows its own title; `structure.json`
 * holds the heading and knows the anchor the body renders it at. Neither half
 * can reach the reader alone, and pairing them is what restores the ordinary
 * `#h{i}` anchor instead of inventing a second scheme — so the two tables of
 * contents need no special href, and the rows they must NOT link (a heading
 * with no text behind it) fall out as the rows this returns no anchor for.
 *
 * It lives here rather than inside the route because it is the only piece of
 * that page anything can check without a browser, and because it is the piece
 * that goes wrong quietly: a unit claimed twice renders twice, and a unit
 * claimed by nobody vanishes from a page that still lists its heading.
 *
 * THREE KINDS OF UNNUMBERED MATTER, and the split between them is what this
 * function is for:
 *
 * - **Trailing** — what a numbered document appends after its last paragraph
 *   (Lumen Gentium's Nota Explicativa Praevia, Laudato Si's closing prayers).
 * - **A whole edition** — the entire text of one that numbers nothing
 *   anywhere, of which this corpus has eight. It has no numbered flow to be
 *   before or after, so it is trailing by default and reads correctly there.
 * - **Leading** — text the source prints BEFORE its numbered flow, marked
 *   `position: "leading"` by the scraper. Only the First Vatican Council has
 *   any: Dei Filius teaches in four unnumbered CAPUTs and then anathematizes
 *   the denial of what they taught in eighteen numbered canons, so rendering
 *   them after the canons prints the constitution backwards.
 */

import type { DocumentAppendixUnit, DocumentNode } from './types';

export interface StructureRow {
	node: DocumentNode;
	depth: number;
	anchor: string;
}

/** A heading, the text under it, or both — whichever of the two exists. */
export interface UnnumberedRow {
	anchor?: string;
	node?: DocumentNode;
	unit?: DocumentAppendixUnit;
}

const normTitle = (s: string | undefined) => (s ?? '').replace(/\s+/g, ' ').trim().toLowerCase();

/**
 * Split a document's unnumbered matter into what renders before its numbered
 * sections and what renders after, each already paired with its heading.
 *
 * Matching is on title, first unclaimed row wins, so a document that prints
 * the same heading twice still pairs them in order. A unit whose title matches
 * nothing still renders, with no heading of its own — which is how the
 * untitled run that can open either half reaches the page at all.
 *
 * The LEADING half is keyed off the UNIT's flag and not the row's, because
 * that untitled run has no heading to carry one: Dei Filius opens with its
 * address to the Church, above the first CAPUT and under no heading. Pairing
 * by title cannot place that run; the flag can.
 *
 * The TAILING half is what it always was — the rows after the last anchored
 * one that anchor no section — computed over what is left once leading matter
 * is set aside, so nothing is claimed twice. For every document but Vatican
 * I's, nothing is set aside and this is exactly the old computation.
 */
export function splitUnnumbered(
	rows: StructureRow[],
	units: DocumentAppendixUnit[]
): { lead: UnnumberedRow[]; tail: UnnumberedRow[] } {
	const leadUnits = units.filter((u) => u.position === 'leading');
	const tailUnits = units.filter((u) => u.position !== 'leading');
	const leadRows = rows.filter((r) => r.node.position === 'leading');
	const tailRows = rows.filter((r) => r.node.position !== 'leading');

	const claimedRows = new Set<number>();
	const lead: UnnumberedRow[] = leadUnits.map((unit) => {
		const key = normTitle(unit.title);
		const hit = leadRows.findIndex(
			(r, i) => !claimedRows.has(i) && key !== '' && normTitle(r.node.title) === key
		);
		if (hit >= 0) claimedRows.add(hit);
		return hit >= 0 ? { unit, node: leadRows[hit].node, anchor: leadRows[hit].anchor } : { unit };
	});

	let lastAnchored = -1;
	tailRows.forEach((row, i) => {
		if (Number.isFinite(row.node.before)) lastAnchored = i;
	});
	const backMatter = tailRows.filter(
		(row, i) => i > lastAnchored && !Number.isFinite(row.node.before)
	);

	// MERGED IN DOCUMENT ORDER, both sides at once. Both arrays are already in
	// document order — `structure.json` is flat and ordered, `appendix.json` is
	// an ordered array — so walking the units and taking each one's heading
	// from a cursor that only moves forward keeps the text in the order the
	// source prints it, and lets a unit no heading names sit where it belongs
	// rather than at the end.
	//
	// IT USED TO WALK THE HEADINGS AND APPEND THE REST, which put an
	// edition's OPENING paragraph after its last section. It is the untitled
	// unit that pays: a title of `''` matches no heading by construction, so
	// it always fell into the "unclaimed" bucket at the end. Measured over the
	// corpus: every edition that numbers nothing anywhere AND prints prose
	// before its first heading — `ad-catholici-sacerdotii.it` reads its
	// opening paragraph after twenty-five headed units, and Pastor Aeternus
	// read its address to the Church after all four of its chapters.
	const tail: UnnumberedRow[] = [];
	let cursor = 0;
	for (const unit of tailUnits) {
		const key = normTitle(unit.title);
		const hit =
			key === ''
				? -1
				: backMatter.findIndex((row, i) => i >= cursor && normTitle(row.node.title) === key);
		if (hit < 0) {
			tail.push({ unit });
			continue;
		}
		// Headings the units skipped over are real headings the source prints
		// with nothing under them (Lumen Gentium's `From the Acts of the
		// Council`, a secretary's signature) — emitted in place, not dropped.
		for (let i = cursor; i < hit; i++) {
			tail.push({ anchor: backMatter[i].anchor, node: backMatter[i].node });
		}
		tail.push({ anchor: backMatter[hit].anchor, node: backMatter[hit].node, unit });
		cursor = hit + 1;
	}
	for (let i = cursor; i < backMatter.length; i++) {
		tail.push({ anchor: backMatter[i].anchor, node: backMatter[i].node });
	}
	return { lead, tail };
}
