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
 * until switched on — so the two halves are stored as `off` and `on` lists
 * rather than one "enabled" list. Storing the state outright would make the
 * default unrepresentable: a reader who has never touched the panel and a
 * reader who has switched everything off would both hold an empty set, and
 * the next edition ingested would arrive silently switched off for the first
 * of them.
 *
 * IT IS NOT LANGUAGE-SCOPED, unlike `content.svelte.ts`'s overrides. That
 * store expires a choice when the interface language moves because an edition
 * choice is downstream of the reader's language. An apparatus choice is not:
 * "I want the commentary" survives a change of interface language, and a work
 * id that means nothing on the current page simply never comes up.
 */

import { readStoredJson, writeStoredJson } from './storage';

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
	 * Defaults OFF. A commentary is the largest body of text in the corpus and
	 * nobody opening a chapter asked for it; switching it on is what causes it
	 * to be fetched at all (`commentary.svelte.ts`).
	 */
	commentaryEnabled(workId: string): boolean {
		return this.#state.on.includes(workId);
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

	setCommentary(workId: string, enabled: boolean) {
		this.#write({
			...this.#state,
			on: withMembership(this.#state.on, workId, enabled)
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

export const apparatusPrefs = new ApparatusStore();
