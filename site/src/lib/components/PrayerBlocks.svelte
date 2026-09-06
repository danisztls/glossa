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

	AND THE LABEL EXPLAINS ITSELF, because an abbreviation is only obvious to
	someone who has already met it: "V." is a whole word (versicle) reduced to
	a letter, and a reader who has not stood in a church while one was sung has
	nothing to expand it from. `TermGloss` is the site's device for exactly
	that — the dotted underline that means "an explanation is behind this word"
	— and it is the same one `/calendarium` teaches on `Memorial` and `Violet`.

	THE GLOSS IS KEYED BY `line.kind` AND THE LABEL IS NOT, which is the whole
	reason two strings cover four letters. What the reader is being told is who
	speaks the line, and that is the block's kind; the letter standing for it is
	whatever the source printed. So "V." and "D." open the same explanation, and
	it names the role rather than expanding the abbreviation — an expansion
	would be wrong for three of the four labels in the corpus.
-->
<script lang="ts">
	import InlineText from './InlineText.svelte';
	import CommentaryGloss from './CommentaryGloss.svelte';
	import TermGloss from './TermGloss.svelte';
	import { i18n, t } from '$lib/i18n.svelte';
	import { plainLine, type PrayerLine } from '$lib/prayer-lines';
	import { buildSegments, type PlacedAnchor } from '$lib/annotated-segments';
	import type {
		PlacedPrayerCommentary,
		PrayerCommentaryPlacement
	} from '$lib/commentary-placement';
	import { prayerCap, capNodes, capSegments, type PrayerCap } from '$lib/prayer-cap';

	interface Props {
		lines: PrayerLine[];
		/** Set illuminated initials on this text. The caller decides, exactly as
		    it does for `ProseBlocks`: this component cannot see whether the lines
		    it was handed OPEN the reading or conclude it, and the Rosary's
		    `blocks` are its closing prayer, printed below four mystery groups. */
		dropCap?: boolean;
		/**
		 * Where this prayer's switched-on commentaries put their marks —
		 * `placePrayerCommentary` over the WHOLE prayer, indexed by `line.n`.
		 *
		 * THE CUT IS MADE HERE AND THE PLACEMENT IS NOT, and compare mode is the
		 * reason for the split. A mark sits at the words its note quotes, so
		 * only the component that owns a line can cut it (`AnnotatedText`'s
		 * reason) — but a compare cell IS one line, and a placement taken over
		 * one line would lose a lemma the edition set across a break and could
		 * find the wrong occurrence of a repeated phrase. So the caller places
		 * over every line and each cell renders its own; `prayerTexts` is the
		 * argument to place over.
		 */
		placement?: PrayerCommentaryPlacement;
		/**
		 * Which marks are open, by their index in `placed` — one array per
		 * COLUMN, not per instance.
		 *
		 * A quotation the edition set across a break lights every line it covers
		 * while its card is open, and while comparing those lines are separate
		 * cells and so separate instances of this component. State kept here
		 * would light only the line that carries the dagger. A single column
		 * passes nothing and keeps its own.
		 */
		openMarks?: (boolean | undefined)[];
	}

	let { lines, dropCap = false, placement, openMarks }: Props = $props();

	/** Read through these rather than off `placement`, so the marks a line
	 *  carries and the notes behind one are the same two lookups whether or not
	 *  an apparatus is switched on at all. */
	const placed = $derived<PlacedPrayerCommentary[]>(placement?.placed ?? []);
	const byLine = $derived<PlacedAnchor[][]>(placement?.byLine ?? []);

	let ownMarks: (boolean | undefined)[] = $state([]);
	const open = $derived(openMarks ?? ownMarks);

	/** One line's text cut at the words its notes quote. `buildSegments` is
	 *  `AnnotatedText`'s, handed the simplest input it has: one text piece, no
	 *  edition lemmas (a prayer carries no footnote apparatus of its own) and
	 *  this line's marks.
	 *
	 *  The text comes off the LINE and the marks off `line.n`, never off a
	 *  position in `lines`: this component is handed the whole prayer in one
	 *  column and a single line in a compare cell, and only the line's own
	 *  number means the same thing in both. */
	function segmentsFor(line: PrayerLine) {
		const text = plainLine(line) ?? '';
		return buildSegments(text, [{ text }], new Map(), byLine[line.n] ?? []);
	}

	/**
	 * The initial this line takes, or null. `prayer-cap.ts` holds the whole
	 * decision and the arithmetic behind it; what this adds is the two things
	 * only the component knows — the caller's `dropCap`, and whether an
	 * apparatus has cut this line.
	 */
	function capFor(line: PrayerLine) {
		return prayerCap(line, {
			dropCap,
			segments: byLine[line.n]?.length ? segmentsFor(line) : undefined
		});
	}
</script>

<!-- The initial, in the two pieces `dropcaps.css` sets: the letter, and the
     punctuation that leads into it at body size on its shoulder. `versal` is
     the one-line size verse takes — see `capFor`. -->
{#snippet capMark(c: PrayerCap)}<span class="drop-cap-letter" class:drop-cap-versal={c.versal}
		>{#if c.lead}<span class="drop-cap-lead">{c.lead}</span>{/if}{c.first}</span
	>{/snippet}

<!-- One note's card, opened by the dagger at the end of the words it quotes.
     `lemmaMarked` unconditionally: every note this apparatus stores quotes a
     clause of the prayer and every one of them anchors, so the card would
     otherwise print a headword the line beside it is already lighting.

     `anchored` unconditionally, AND FOR THE SAME FACT — this apparatus has no
     trailing mark at all (`placePrayerCommentary`), so the `‡` a verse uses for
     notes with no place in the text can never appear on a prayer. If one ever
     did, `unplaced` would be non-empty and that is the thing to fix, not the
     glyph. -->
{#snippet gloss(entry: PlacedPrayerCommentary, mark: number | undefined)}
	<CommentaryGloss
		notes={entry.notes}
		lang={entry.work.language}
		work={entry.work.id}
		title={entry.work.short_title || entry.work.title}
		onopen={mark === undefined ? undefined : (on: boolean) => (open[mark] = on)}
		anchored
		lemmaMarked
	/>
{/snippet}

<!-- THE WORDS A NOTE QUOTES, lit while its card is open, exactly as
     `AnnotatedText` does it inside a verse: a `<span>` that says nothing and a
     class that lights, never a `<mark>`. -->
{#snippet body(line: PrayerLine)}{@const c =
		capFor(line)}{#if byLine[line.n]?.length}{#if c}{@render capMark(
				c
			)}{/if}{#each c ? capSegments(segmentsFor(line), c.consumed) : segmentsFor(line) as seg, i (i)}{#if seg.kind === 'mark'}{@render gloss(
					placed[seg.mark],
					seg.mark
				)}{:else if seg.kind === 'quoted'}<span
					class="note-lemma"
					class:highlighted={open[seg.mark]}>{seg.text}</span
				>{:else if seg.kind === 'text'}{seg.text}{/if}{/each}{:else if c}{@render capMark(
			c
		)}<InlineText nodes={capNodes(line, c)} />{:else}<InlineText
			nodes={line.nodes}
		/>{/if}{/snippet}

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
			     reserves nothing — which is why the column survives an empty
			     span and the gloss sits inside it rather than replacing it. -->
			{#if line.labelled}<span class="prayer-line-label"
					>{#if line.label}<TermGloss
							term={line.label}
							gloss={t(
								line.kind === 'versicle' ? 'prayers.gloss.versicle' : 'prayers.gloss.response'
							)}
							lang={i18n.lang}
						/>{/if}</span
				>{/if}
			<span class="prayer-line-text">{@render body(line)}</span>
		</p>
	{:else if line.kind === 'attribution'}
		<!-- THE CREDIT THE PAGE PRINTS UNDER THE PRAYER, and it is not a line of
		     the prayer: it says who wrote what is above it, in the source's own
		     words and parentheses (docs/corpus-schema.md). Set apart the way the
		     rest of this site sets what it says ABOUT a text rather than the text
		     — sans, smaller, muted — which is `.copyright-notice`'s treatment and
		     the reason it needs no colour of its own.

		     `<p>` and not `<cite>`: what stands here is a person as often as a
		     work ("Saint Alphonsus Liguori"), and `<cite>` names the work. The
		     line stays exactly as the source set it, brackets included, so
		     nothing here has to decide which it is. -->
		<p class="prayer-attribution" class:block-end={line.last}>{@render body(line)}</p>
	{:else if line.verse}
		<p class="prayer-verse-line" class:block-end={line.last}>{@render body(line)}</p>
	{:else}
		<p class="prayer-prose" class:block-end={line.last}>{@render body(line)}</p>
	{/if}
{/each}

<!-- NOTHING HANGS AT THE FOOT, and `placement.unplaced` says why in full: the
     apparatus is the marks in the text, every stored note quotes a clause, and
     what the two books say ABOUT the prayer rather than about one of its lines
     is offered as links under it (`PrayerReferences`, the route). -->

<style>
	.prayer-prose,
	.prayer-verse-line,
	.prayer-line,
	.prayer-attribution {
		margin: 0;
	}

	.prayer-prose.block-end,
	.prayer-verse-line.block-end {
		margin-block-end: 1rem;
	}

	/*
	 * `.copyright-notice`'s three signals — sans, smaller, muted — because this
	 * is the same kind of statement made about a prayer instead of a work, and
	 * a fourth signal would be a second vocabulary for one idea. The `em` is
	 * the prayer's own enlarged type, so `--font-size-min` floors it the way
	 * every other relative reduction on this site does.
	 *
	 * THE SPACE ABOVE IS WHAT SETS IT APART, and it is larger than the gap
	 * between the prayer's own blocks (1rem): run at that distance in a
	 * different face, a credit reads as a stanza that has changed voice.
	 *
	 * AND IT KEEPS THE ORDINARY GAP BELOW, because a credit is not always the
	 * last thing on the page. The Spiritual Communion is TWO acts, each with
	 * its own author, so St Alphonsus's line has Cardinal Merry del Val's
	 * prayer under it — and with no space beneath, the credit sat against the
	 * versal opening that prayer and read as its heading rather than as the
	 * previous one's signature. The asymmetry is the whole device: nearer to
	 * what it credits than to what follows.
	 */
	.prayer-attribution {
		margin-block-start: 1.4rem;
		margin-block-end: 1rem;
		font-family: var(--font-sans);
		font-size: max(var(--font-size-min), 0.72em);
		line-height: 1.5;
		color: var(--color-text-muted);
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
