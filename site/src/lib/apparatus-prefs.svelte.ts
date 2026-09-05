/**
 * Which apparatus the reader wants set beside the text: the edition's own
 * notes, and any commentary written on it. Persisted to localStorage alongside
 * theme (`theme.svelte.ts`), reading size (`prefs.svelte.ts`), content
 * language (`content.svelte.ts`) and compare mode (`compare-pref.svelte.ts`).
 *
 * NAMED APART FROM `apparatus.ts`, WHICH IS A DIFFERENT THING. That module is
 * the edge's cross-reference table — which Catechism paragraphs and documents
 * cite a verse. This one is a reading preference about footnotes. The
 * collision is unfortunate and the word is right for both; the file names are
 * what keep them apart, so do not "tidy" either into the other's name.
 *
 * A SET, NOT A CHOICE, AND THAT IS WHY IT IS NOT `content.svelte.ts`. Every
 * other edition-shaped preference on this site resolves to exactly one work —
 * `Override` holds one `workId`, `CompareStore.target` one id or `AUTO`. An
 * apparatus is not exclusive: a reader can have Challoner's notes and
 * Haydock's catena beside the same verse, which is the arrangement the site is
 * named for. So the stored value is a set of ids and the control is a row of
 * toggles rather than a menu of radio items.
 *
 * THE IDS ARE WORK IDS, INCLUDING THE EDITION'S OWN. An edition's notes are
 * identified by the edition itself (`bible.douay-rheims.en`), a commentary by
 * its own id (`commentary.haydock.en`). One vocabulary for both is what lets
 * the panel be one list: the reader is choosing among apparatus, and whether a
 * given apparatus happens to be stored inside the edition or beside it is our
 * problem, not theirs.
 *
 * WHAT IS STORED IS THE DIFFERENCE FROM THE DEFAULT, NOT THE STATE. An
 * edition's own notes are ON unless switched off, and a commentary is OFF
 * until switched on unless the work says otherwise — so the two halves are
 * stored as `off` and `on` lists rather than one "enabled" list. Storing the
 * state outright would make the default unrepresentable: a reader who has
 * never touched the panel and a reader who has switched everything off would
 * both hold an empty set, and the next edition ingested would arrive silently
 * switched off for the first of them. Both defaults MOVE — `subsumes_notes`
 * and `default_on` are properties of a work, so which list an id belongs in
 * is a question its caller has to answer, never a constant here.
 *
 * IT IS NOT LANGUAGE-SCOPED, unlike `content.svelte.ts`'s overrides. That
 * store expires a choice when the interface language moves because an edition
 * choice is downstream of the reader's language. An apparatus choice is not:
 * "I want the commentary" survives a change of interface language, and a work
 * id that means nothing on the current page simply never comes up.
 */

import { readStoredJson, writeStoredJson } from './storage';
import type { WorkManifest } from './types';

const STORAGE_KEY = 'glossa:apparatus';

interface Stored {
	/** Apparatus the reader switched OFF against a default of on. */
	off: string[];
	/** Apparatus the reader switched ON against a default of off. */
	on: string[];
}

const EMPTY: Stored = { off: [], on: [] };

class ApparatusStore {
	#state: Stored = $state(readStoredJson<Stored>(STORAGE_KEY, EMPTY));

	/**
	 * Whether an edition's own footnotes are set beside its text.
	 *
	 * Defaults ON, and that asymmetry with `commentaryEnabled` is the point:
	 * an edition's notes are part of the edition the reader already chose. A
	 * reader who picks the Douay-Rheims has picked Challoner's apparatus,
	 * because that is what distinguishes it from the four other English texts;
	 * turning them off is a deliberate act and so is what gets stored.
	 *
	 * EXCEPT WHERE A COMMENTARY ALREADY CONTAINS THEM, which is `subsumed`.
	 * Haydock published Challoner's text with Challoner's notes absorbed into
	 * his catena, so with both apparatuses on a reader met 1,399 of the
	 * Douay-Rheims's 1,916 notes twice, a hand's width apart, one of the two
	 * signed "Challoner". The manifest states the fact
	 * (`CommentaryManifest.subsumes_notes`); this decides only what to do
	 * about it, and what it does is flip the DEFAULT rather than suppress
	 * anything. The overlap is 73% and not 100%, so the 517 notes Haydock does
	 * not carry are one switch away and the panel still offers them.
	 *
	 * WHICH IS WHY THE DEFAULT HAS TO BE AN ARGUMENT AND NOT A CONSTANT. This
	 * store's whole invariant is that it holds the DIFFERENCE from the
	 * default, so a default that moves needs both lists: `off` is what the
	 * reader switched off against a default of on, `on` what they switched on
	 * against a default of off. An edition id and a commentary id never
	 * collide, so the two lists carry both kinds without ambiguity.
	 */
	editionNotesEnabled(workId: string | undefined, subsumed = false): boolean {
		if (!workId) return true;
		if (this.#state.off.includes(workId)) return false;
		if (this.#state.on.includes(workId)) return true;
		return !subsumed;
	}

	/**
	 * Whether a commentary is set beside the text it annotates.
	 *
	 * Defaults OFF, and `defaultOn` is the work saying otherwise
	 * (`CommentaryManifest.default_on`, which is where the argument for either
	 * default belongs). A commentary is normally the largest body of text in
	 * the corpus and nobody opening a chapter asked for it; switching it on is
	 * what causes it to be fetched at all (`commentary.svelte.ts`). The
	 * prayers' apparatus is the exception on every count.
	 */
	commentaryEnabled(workId: string, defaultOn = false): boolean {
		if (has(this.#state.off, workId)) return false;
		if (has(this.#state.on, workId)) return true;
		return defaultOn;
	}

	/** `subsumed` is the same flag `editionNotesEnabled` takes, and it has to be
	 *  passed here too: what gets stored is the difference from the default, so
	 *  which list the id belongs in depends on which way the default points. */
	setEditionNotes(workId: string, enabled: boolean, subsumed = false) {
		this.#write({
			off: withMembership(this.#state.off, workId, !subsumed && !enabled),
			on: withMembership(this.#state.on, workId, subsumed && enabled)
		});
	}

	/** `defaultOn` is the same flag `commentaryEnabled` takes, and it has to be
	 *  passed here too: what gets stored is the difference from the default, so
	 *  which list the id belongs in depends on which way the default points. */
	setCommentary(workId: string, enabled: boolean, defaultOn = false) {
		this.#write({
			off: withCommentary(this.#state.off, workId, defaultOn && !enabled),
			on: withCommentary(this.#state.on, workId, !defaultOn && enabled)
		});
	}

	#write(next: Stored) {
		this.#state = next;
		writeStoredJson(STORAGE_KEY, next);
	}
}

/** The list with `id` present or absent, sorted, and never duplicated —
 *  sorted so two readers who made the same choices in a different order hold
 *  the same stored value, which is what makes the stored form comparable. */
function withMembership(list: string[], id: string, present: boolean): string[] {
	const set = new Set(list);
	if (present) set.add(id);
	else set.delete(id);
	return [...set].sort();
}

/**
 * A COMMENTARY'S CHOICE IS NOT PER LANGUAGE, and this is the whole of how.
 *
 * `commentary.preces.*` is fifteen works, one per language, and the reader
 * meets exactly one of them — whichever annotates the edition in front of
 * them. Stored per work id, switching the apparatus off under the English Ave
 * would leave it on under the Portuguese one, and a reader who turned it off
 * would meet it again on the next prayer they opened in another language.
 * Stored per FAMILY — `commentary.preces`, the id without its language, which
 * is what `commentary.{slug}.{lang}` means — the choice is about the
 * commentary, which is what the reader thought they were choosing.
 *
 * An edition's own notes are NOT family-scoped and must not be: the
 * Douay-Rheims and the CPDV are two editions with two apparatuses, and a
 * reader turning one off has said nothing about the other.
 */
function familyOf(workId: string): string {
	const parts = workId.split('.');
	return parts.length > 2 ? parts.slice(0, 2).join('.') : workId;
}

/** Whether a list holds this commentary — under its family, or under a full
 *  work id stored before the family was the key. Both are read so a reader who
 *  had switched Haydock on before 2026-09-05 still has him on; only the family
 *  is ever written. That branch is deliberately untested: the store reads
 *  storage once at module load, so a legacy value cannot be put in front of it
 *  from a test without exporting the class for no other reason. */
function has(list: string[], workId: string): boolean {
	return list.includes(familyOf(workId)) || list.includes(workId);
}

/** The list with this commentary present or absent. It always drops the full
 *  work id: leaving one behind would let a stale entry outvote the choice just
 *  made, since `has` reads either form. */
function withCommentary(list: string[], workId: string, present: boolean): string[] {
	const set = new Set(list);
	set.delete(workId);
	set.delete(familyOf(workId));
	if (present) set.add(familyOf(workId));
	return [...set].sort();
}

export const apparatusPrefs = new ApparatusStore();

/**
 * Which way a commentary's switch points before the reader touches it.
 *
 * A NARROWING AND NOT A POLICY: `default_on` is a field on a commentary
 * manifest and every caller holds a `WorkManifest`, so each of them would
 * otherwise write the same type test — and one of them would write it
 * differently. The policy itself is the work's, stated by whichever scraper
 * wrote the manifest (`CommentaryManifest.default_on`).
 */
export function commentaryDefaultsOn(work: WorkManifest): boolean {
	return work.type === 'commentary' && work.default_on === true;
}
