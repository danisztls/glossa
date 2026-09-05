<!--
	Where else the corpus speaks of this prayer: the Gospel it is drawn from,
	the Catechism's article on it, the Compendium's questions.

	IT IS WHAT THE NOTES WITH NO HEADWORD BECAME (2026-09-05). The apparatus
	stored every run of CCC 2676-2677 and every answer of Compendium 578-598,
	and two thirds of them quoted no clause of the prayer — so they hung at its
	foot, which on a seven-line text is the Catechism reprinted beside the Ave
	rather than a gloss on it. A commentary's job at this size is to mark the
	words it explains; what a book says about the prayer AS A WHOLE is a place
	to go and read it, which is this.

	SO IT RIDES THE APPARATUS'S OWN SWITCH AND ITS OWN FETCH. These arrive in
	the same file as the notes and appear when the notes do, because they are
	the same act of reading two books beside a prayer — and because a reader who
	has turned the apparatus off has said what they want under the text.

	IT IS `CitedBy`'S PANEL, ONE FACT TURNED AROUND. That component answers
	"who cites this address"; this answers "where is this prayer treated", and a
	reader wants both in the same glance and in the same place — under the text,
	quiet, small. So it takes that panel's treatment: the rule above it, 0.85rem,
	a work's name said once and muted with its loci beside it. A prayer is seven
	lines set at 1.1x the reading base, so anything here at body size argues with
	the prayer for the page.

	WHAT IT DOES NOT TAKE IS THE COLUMN. `CitedBy` files addresses in a fixed
	column because a concordance is dozens of rows to scan down; this is three
	or four groups, and one per line under a seven-line prayer reads as more
	apparatus than there is. One wrapping line, breaking between groups.

	AND THE LINKS PREVIEW, which is the reason there is no `data-link-preview`
	marker on this block. That opt-out is for navigation chrome — a table of
	contents previewing every destination is noise. This is supplementary
	reading: `CCC 2759` is a paragraph the reader may want to see before
	deciding to leave the prayer, which is exactly what the card is for.

	THE RANGES ARE THE PIPELINE'S AND ARE CHECKED THERE (`prayers_glossa.py`'s
	`check_references`): every number names a paragraph, question or verse the
	corpus actually holds, refused at build time rather than rendered as a link
	that lands nowhere. Nothing here validates and nothing here invents — the
	one thing this file decides is how a range is written down.
-->
<script lang="ts">
	import { hrefFor } from '$lib/address';
	import { content } from '$lib/content.svelte';
	import { getCanonicalBook, getWork } from '$lib/corpus';
	import { t } from '$lib/i18n.svelte';
	import type { PrayerReference } from '$lib/types';

	interface Props {
		references: PrayerReference[];
		/** The annotated edition's language, which decides which CCC and which
		    Compendium give up their short titles. */
		lang: string;
	}

	let { references, lang }: Props = $props();

	/** An en dash and no spaces, `2676–2677`, and a single number where the
	 *  range is one: a citation is written the way the works themselves write
	 *  one, and `2676–2676` is not a range anybody prints. */
	function span(first: number, last: number): string {
		return first === last ? `${first}` : `${first}–${last}`;
	}

	/**
	 * A book's name in the reader's own edition, the same fall-through
	 * `suggest.ts` and the chapter picker use: `CanonicalBook` carries one name
	 * per edition precisely so a name is never invented here. The OSIS code is
	 * the last resort and is at least true.
	 */
	function bookName(osis: string): string {
		const names = getCanonicalBook(osis)?.namesByWorkId ?? {};
		const preferred = content.workIdFor('bible');
		return (preferred && names[preferred]) || Object.values(names)[0] || osis;
	}

	/** The siglum a numbered work is cited by, out of the corpus and never a
	 *  literal — `CommentaryGloss` names a note's locus the same way, and the
	 *  two must agree: `CCC` in every language, the Compendium headed in its
	 *  own (`Compêndio`, `Lilla katekesen`). */
	function siglum(work: 'ccc' | 'compendium'): string {
		const source = getWork(`${work}.${lang}`);
		return source?.short_title || source?.title || work.toUpperCase();
	}

	/** The column a reference is filed under: the BOOK where the work is the
	 *  Bible (Matthew and Luke are two rows, as they are two books) and the
	 *  work itself everywhere else. */
	function group(ref: PrayerReference): string {
		return ref.work === 'bible' ? `bible:${ref.osis}` : ref.work;
	}

	function label(ref: PrayerReference): string {
		return ref.work === 'bible'
			? `${ref.chapter}:${span(ref.first, ref.last)}`
			: span(ref.first, ref.last);
	}

	function href(ref: PrayerReference): string {
		if (ref.work === 'bible') {
			return hrefFor({
				kind: 'bible',
				osis: ref.osis,
				chapter: ref.chapter,
				from: ref.first,
				to: ref.last
			});
		}
		// `first` alone: a range is a place to start reading, and both works are
		// addressed one paragraph or one question at a time.
		return hrefFor({ kind: ref.work, n: ref.first });
	}

	interface Row {
		key: string;
		name: string;
		items: { key: string; label: string; href: string }[];
	}

	/**
	 * The references as rows, a work named once with its loci beside it —
	 * `CitedBy`'s grouping and for its reason: naming the work on every line is
	 * most of the panel, and the reader is scanning for a book, not for a
	 * number.
	 *
	 * The order is the pipeline's, which is Scripture first and then the two
	 * books in the order they are cited. Nothing sorts here: an order the page
	 * imposes would have to be defended, and the one the corpus wrote already
	 * is.
	 */
	const rows = $derived.by(() => {
		const byGroup = new Map<string, Row>();
		for (const ref of references) {
			const key = group(ref);
			let row = byGroup.get(key);
			if (!row) {
				row = {
					key,
					name: ref.work === 'bible' ? bookName(ref.osis) : siglum(ref.work),
					items: []
				};
				byGroup.set(key, row);
			}
			const item = { key: `${key}:${label(ref)}`, label: label(ref), href: href(ref) };
			// Two enabled commentaries could offer the same passage; one row is
			// what it means either way.
			if (!row.items.some((existing) => existing.key === item.key)) row.items.push(item);
		}
		return [...byGroup.values()];
	});
</script>

{#if rows.length}
	<section class="prayer-references" aria-labelledby="prayer-see-also">
		<h2 id="prayer-see-also" class="label-micro">{t('prayers.seeAlso')}</h2>
		<p class="rows">
			{#each rows as row (row.key)}
				<span class="row">
					<span class="work">{row.name}</span><span class="loci"
						>{#each row.items as item, i (item.key)}{#if i > 0}<span class="sep" aria-hidden="true"
									>·</span
								><wbr />{/if}<a href={item.href}>{item.label}</a>{/each}</span
					>
				</span>
			{/each}
		</p>
	</section>
{/if}

<style>
	/* `CitedBy`'s panel, rule for rule — see the docblock on why this is the
	   same thing rather than merely similar. */
	.prayer-references {
		margin-top: 2.5rem;
		padding-top: 1rem;
		border-top: 1px solid var(--color-border);
		font-size: 0.85rem;
	}

	.prayer-references h2 {
		margin: 0 0 0.6rem;
		font-weight: 600;
	}

	/*
	 * ONE LINE, NOT A COLUMN. `CitedBy` puts its addresses in a fixed column
	 * because a concordance is dozens of rows and a reader scans down it; this
	 * is three or four groups and nothing to scan — set as rows it was a stack
	 * of two-word lines under a seven-line prayer, which reads as more apparatus
	 * than there is. It is `.sources` in that same component: a flex row that
	 * wraps between groups, never inside one.
	 */
	.rows {
		margin: 0;
		display: flex;
		flex-wrap: wrap;
		gap: 0.15rem 1.1rem;
	}

	/* A group breaks only at the `<wbr />` after each separator, so a work's
	   name and its first locus stay together — there is no whitespace between
	   them to break on — while a long run of numbers wraps rather than running
	   off a phone's right edge. */
	.row {
		font-variant-numeric: tabular-nums;
	}

	/* The work's name, said once per group and quiet relative to the loci beside
	   it: those are the links, this is the label saying what they are. */
	.work {
		color: var(--color-text-muted);
	}

	.loci {
		margin-inline-start: 0.3em;
	}

	.sep {
		margin-inline: 0.3em;
		color: var(--color-text-muted);
	}

	a {
		text-decoration-color: var(--color-border);
		text-underline-offset: 0.15em;
	}
</style>
