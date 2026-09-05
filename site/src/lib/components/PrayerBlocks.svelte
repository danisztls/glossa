<!--
	Renders a prayer's flowing text — one `PrayerLine[]` list, flattened from
	the corpus's blocks by `$lib/prayer-lines.ts`. The same component renders a
	vernacular prayer's `blocks`, the Rosary's `instructions.blocks`, a Latin
	companion's, and one line of any of them inside a compare cell — all the
	identical shape, so there is exactly one renderer rather than four
	near-duplicates.

	IT TAKES LINES AND NOT BLOCKS, since 2026-09-03, and compare mode is why.
	`CompareGrid` aligns two columns by giving each row its own grid sized to
	the taller cell, so whatever the reader wants aligned has to be a ROW —
	and line-for-line alignment means the row is a printed line. The split
	therefore cannot happen inside this component's render, where nothing
	outside could see the lines. Everything the flattening knew and a lone line
	would not (which block it came from, whether that block was broken into
	lines, whether it is the block's first or last) travels on the line itself.

	THE LABEL IS VERBATIM SOURCE TEXT, RENDERED AS PRINTED, NEVER REGENERATED
	FROM THE BLOCK KIND: a `versicle` block doesn't imply "V." — most sources
	print that, but PT's own Angelus and Rosary-closing dialogue print "D."/
	"C." for the identical leader/assembly roles (docs/corpus-schema.md
	"Prayers"). Synthesizing a label from `line.kind` would silently erase
	that real difference between how each source page typesets the same
	prayer; `label` is shown exactly as the corpus stored it instead.

	NOT `aria-hidden` on the label: unlike a decorative bullet or rule, "V."/
	"R." is content a reader following along in a missal expects to hear
	announced, the same way the label is expected to be SEEN in print — so a
	screen reader gets it too, read inline before the line it prefixes.
-->
<script lang="ts">
	import InlineText from './InlineText.svelte';
	import CommentaryGloss from './CommentaryGloss.svelte';
	import type { InlineNode } from '$lib/inline-html';
	import { plainLine, type PrayerLine } from '$lib/prayer-lines';
	import { buildSegments } from '$lib/annotated-segments';
	import { placePrayerCommentary, type CommentaryEntry } from '$lib/commentary-placement';
	import { splitDropCap } from '$lib/dropcap';

	interface Props {
		lines: PrayerLine[];
		/** Set illuminated initials on this text. The caller decides, exactly as
		    it does for `ProseBlocks`: this component cannot see whether the lines
		    it was handed OPEN the reading or conclude it, and the Rosary's
		    `blocks` are its closing prayer, printed below four mystery groups. */
		dropCap?: boolean;
		/**
		 * The commentaries switched on for this prayer, with their notes on it.
		 *
		 * RENDERED HERE AND NOT BY THE ROUTE, for `AnnotatedText`'s reason: a
		 * mark sits at the words its note quotes, and only the component that
		 * owns a line can cut it. Absent while comparing — two columns of a
		 * prayer are already two texts to hold in view, and an apparatus is a
		 * third.
		 */
		commentary?: CommentaryEntry[];
	}

	let { lines, dropCap = false, commentary }: Props = $props();

	/**
	 * The lines as the strings an anchor is an offset into, and where each
	 * commentary's marks fall among them.
	 *
	 * A line that is not plain text contributes an empty string, so no lemma
	 * can be found in it and its notes fall to the trailing mark — see
	 * `plainLine`, which is the same refusal one layer down.
	 */
	const texts = $derived(lines.map((line) => plainLine(line) ?? ''));
	const placement = $derived(placePrayerCommentary(texts, commentary));

	/** Which inline commentary marks are open, by their index in `placed`. */
	let openMarks: (boolean | undefined)[] = $state([]);

	/** One line's text cut at the words its notes quote. `buildSegments` is
	 *  `AnnotatedText`'s, handed the simplest input it has: one text piece, no
	 *  edition lemmas (a prayer carries no footnote apparatus of its own) and
	 *  this line's marks. */
	function segmentsFor(line: PrayerLine) {
		return buildSegments(
			texts[line.n],
			[{ text: texts[line.n] }],
			new Map(),
			placement.byLine[line.n] ?? []
		);
	}

	/**
	 * The opening of a PROSE block, split into the pieces `dropcaps.css`'s
	 * `.drop-cap-letter` / `.drop-cap-lead` need — null wherever no initial is
	 * warranted. `splitDropCap` decides that for the text (it declines a digit,
	 * a lowercase opening and a joining script, $lib/dropcap.ts); what this
	 * decides is which lines may ask at all.
	 *
	 * VERSE TAKES NO INITIAL, and the whole of 2026-09-03 was spent finding out
	 * why. A drop cap is a device for the top of a column of running prose: the
	 * letter is sized in LINES and the lines beside it indent around it, which
	 * is right where those lines are the viewport's and wrong where they are the
	 * source's — a three-line cap on the Pai Nosso indented `santificado` and
	 * `venha` so that two printed lines read as continuations of the first. A
	 * one-line versal fixes that (nothing is left to indent) and was set on
	 * every line opening on a capital, which the lowercase rule keeps to about
	 * one line in five. What it could not fix is that verse does not want the
	 * device at all: a prayer is seven lines under its own `<h1>`, so the eye
	 * already has its way in and each initial only competes with the heading two
	 * lines above it. Long running text needs an entry point; a hymn does not.
	 *
	 * So the initial belongs to a block the source printed as ONE RUN — the
	 * Memorare, the three Eastern prayers, the Act of Contrition — where there
	 * is a paragraph for the cap to bite into and the lines beside it really are
	 * wraps. And only to the FIRST such block: a later one is a further
	 * paragraph of the same prayer, not a second beginning. `ProseBlocks`
	 * excludes a `quote` block for the neighbouring reason (a blockquote is a
	 * second opening competing with the cap); a prayer has no such block.
	 *
	 * The split comes off the line's first TEXT run rather than off its markup:
	 * a line opening `<i>Sancta Maria</i>` would otherwise put a tag inside the
	 * initial.
	 */
	function capFor(line: PrayerLine) {
		// AND NOT TO A DIALOGUE'S OPENING TURN, which is a layout fact rather
		// than a judgment: a versicle's text sits in a flex item, a flex item is
		// a block formatting context, and so it CONTAINS the cap's float instead
		// of letting it escape. The Angelus opens `V. The Angel of the Lord
		// declared unto Mary.` — one line — so the cap would stand alone in a row
		// three lines tall with the label beside its shoulder and nothing wrapped
		// around it. Three prayers in the corpus open this way (EN, FR and PT
		// Angelus); every other opening block is prose.
		// AND NOT TO A GLOSSED LINE. A drop cap owns the opening of a run and a
		// commentary's first mark may fall inside those same words; rather than
		// arbitrate, the initial stands down — it is a flourish and the mark is
		// the apparatus. Unreachable today (every glossed prayer is set as
		// verse, which takes no initial anyway) and cheaper to state than to
		// rediscover.
		if (placement.byLine[line.n]?.length) return null;
		if (!dropCap || line.verse || line.kind !== 'prose') return null;
		if (!(line.block === 0 && line.first)) return null;
		const head = line.nodes[0];
		if (head?.kind !== 'text') return null;
		const split = splitDropCap(head.text);
		if (split.first === '') return null;
		const restNodes: InlineNode[] = [{ kind: 'text', text: split.rest }, ...line.nodes.slice(1)];
		return { ...split, restNodes };
	}
</script>

<!-- The initial, in the two pieces `dropcaps.css` sets: the letter, and the
     punctuation that leads into it at body size on its shoulder. -->
{#snippet capMark(c: { lead: string; first: string })}<span class="drop-cap-letter"
		>{#if c.lead}<span class="drop-cap-lead">{c.lead}</span>{/if}{c.first}</span
	>{/snippet}

<!-- One line's text, with its initial where it takes one. -->
{#snippet gloss(entry: (typeof placement.placed)[number], mark: number | undefined)}
	<CommentaryGloss
		notes={entry.notes}
		lang={entry.work.language}
		work={entry.work.id}
		title={entry.work.short_title || entry.work.title}
		onopen={mark === undefined ? undefined : (on: boolean) => (openMarks[mark] = on)}
	/>
{/snippet}

<!-- THE WORDS A NOTE QUOTES, lit while its card is open, exactly as
     `AnnotatedText` does it inside a verse: a `<span>` that says nothing and a
     class that lights, never a `<mark>`. -->
{#snippet body(line: PrayerLine)}{@const c =
		capFor(
			line
		)}{#if placement.byLine[line.n]?.length}{#each segmentsFor(line) as seg, i (i)}{#if seg.kind === 'mark'}{@render gloss(
					placement.placed[seg.mark],
					seg.mark
				)}{:else if seg.kind === 'quoted'}<span
					class="note-lemma"
					class:highlighted={openMarks[seg.mark]}>{seg.text}</span
				>{:else if seg.kind === 'text'}{seg.text}{/if}{/each}{:else if c}{@render capMark(
			c
		)}<InlineText nodes={c.restNodes} />{:else}<InlineText nodes={line.nodes} />{/if}{/snippet}

<!--
	VERSE AND PROSE ARE SET DIFFERENTLY, and which one a line is is not a field
	on its block — it is whether the source broke that block into lines. A line
	the source printed gets its own `.prayer-verse-line`; a block printed as one
	run gets `.prayer-prose`, because there are no source lines for a wrap to be
	confused with.

	THE GAP BETWEEN BLOCKS IS CARRIED BY EACH BLOCK'S LAST LINE. Every line is
	its own element now, so a margin on all of them would space the lines of one
	stanza as widely as the stanzas themselves.
-->
{#each lines as line (line.n)}
	{#if line.kind === 'versicle' || line.kind === 'response'}
		<p
			class="prayer-line"
			class:prayer-versicle={line.kind === 'versicle'}
			class:block-end={line.last}
		>
			<!-- The column is reserved for every line of a LABELLED block, so the
			     turn's continuation lines stay under its own opening rather than
			     stepping back to the margin; a block whose source prints no label
			     reserves nothing. -->
			{#if line.labelled}<span class="prayer-line-label">{line.label ?? ''}</span>{/if}
			<span class="prayer-line-text">{@render body(line)}</span>
		</p>
	{:else if line.verse}
		<p class="prayer-verse-line" class:block-end={line.last}>{@render body(line)}</p>
	{:else}
		<p class="prayer-prose" class:block-end={line.last}>{@render body(line)}</p>
	{/if}
{/each}

<!-- THE NOTES NO WORDS IN THE PRAYER CARRY, on one mark after the whole text.
     A verse ends and its unplaced notes hang there; a prayer has no such place
     until its last line, and hanging them off whichever line happened to be
     last would set an apparatus in the middle of the text the moment a later
     line took no mark. With the inline marks these PARTITION the prayer's
     notes — no note behind two marks, and none behind none. -->
{#if placement.trailing.length}
	<p class="prayer-trailing">
		{#each placement.trailing as entry, i (i)}{@render gloss(entry, undefined)}{/each}
	</p>
{/if}

<style>
	.prayer-prose,
	.prayer-verse-line,
	.prayer-line {
		margin: 0;
	}

	.prayer-prose.block-end,
	.prayer-verse-line.block-end {
		margin-block-end: 1rem;
	}

	/*
	 * ONE LINE THE SOURCE PRINTED.
	 *
	 * IT USED TO HANG: `text-indent: -1.15em` with matching padding, so a line
	 * the viewport broke sat in from the margin and was visibly a continuation
	 * rather than a new verse -- which is how a printed missal sets the same
	 * text. That is the right device for a hymnal and the wrong one for this
	 * column, because the premise it rests on is that a wrap is the exception.
	 * Here it is not. Prayers set at 1.1x the reading base in the prose
	 * column's width (the route's own docblock) is 56.7 characters per line,
	 * and the source's `<br>`s are not always verse -- the Nicene Creed's are
	 * sense-lines running to 84 characters, so 8 of its 24 wrap and the indent
	 * opened a gap at the head of every one of them. A mark that fires on a
	 * third of the lines has stopped marking anything.
	 *
	 * THE ELEMENT PER LINE STAYS, and earns its keep twice over without the
	 * indent: `text-wrap: pretty` applies per block, so each PRINTED line
	 * balances its own wrap and stops stranding one word of itself
	 * ("...begotten of the / Father,"), and compare mode needs a line to be a
	 * thing before it can put one beside another. Neither is reachable from a
	 * single `<p>` full of `<br>`s, which has one block for the whole prayer.
	 */
	.prayer-verse-line {
		text-wrap: pretty;
	}

	/* Versicle/response set as a hanging-label line -- the label sits in its
	   own fixed-width column so a run of several V./R. pairs (the Angelus)
	   lines up as a dialogue rather than reading as an inline abbreviation
	   glued to each line's first word. */
	.prayer-line {
		display: flex;
		gap: 0.6em;
	}

	.prayer-line.block-end {
		margin-block-end: 0.4rem;
	}

	/* The text column is what carries the lines; the row must not, because the
	   label already sits in its own fixed column and indenting the flex row
	   would push it out of alignment with the ones above and below it. */
	.prayer-line-text {
		min-width: 0;
	}

	/* The trailing mark's own line. It carries nothing but marks, so it needs
	   no measure of its own — only the gap that says the prayer has ended and
	   the apparatus begun. */
	.prayer-trailing {
		margin-block: 0.75rem 0;
	}

	.prayer-line-label {
		flex-shrink: 0;
		width: 1.6em;
		font-family: var(--font-sans);
		font-weight: 700;
		color: var(--color-text-muted);
	}

	/* The versicle (leader's line) is set slightly muted against the
	   response (the assembly's reply) -- a plain-text way to distinguish the
	   two voices for a sighted reader without inventing a color that isn't
	   one of the theme tokens. */
	.prayer-versicle .prayer-line-text {
		color: var(--color-text-muted);
	}
</style>
