<!--
	The wordmark: "Glossa" over "Catholica", in the blackletter the site already
	carries. One lockup, two sizes.

	  - `hero` (default) — the home page's h1.
	  - `brand` — the header. Below 30rem this swaps to a "GC" monogram, the same
	    two initials in the same two colours as the favicon, so the tab and the
	    phone header carry one mark. The header also forces the same swap at any
	    width via the `compact` prop, once the reader scrolls away from the top
	    (see `+layout.svelte`'s `scrolled` state) — two triggers, one mark.

	The variants differ by exactly one declaration each: the wrapper's
	`font-size`. Everything inside is expressed in `em`, so the lockup is one
	design scaled, not two designs kept in sync — add a third size by adding a
	third font-size and nothing else. Two earlier attempts got this wrong (the
	header once set "Catholica" in the text face, then later gave it its own
	tracking), and both times the mark quietly became two marks.

	That purity is also what makes the small size work. With the second line
	sized to match the first (see `.word-catholica`), the header's "Catholica"
	renders at ~17px rather than the ~12px an arbitrary ratio gave it, which is
	the whole reason it no longer needs a legibility concession of its own.

	Live type, not an image. The mark is real text in the document — selectable,
	searchable, correct in the accessibility tree, and it costs no new asset:
	`Pirata One Subset` is the same 5.9 KB file already fetched for drop caps
	(`app.css`'s `--font-display`), and its subset range covers U+0061-007A, so
	every letter here was already in the file before the wordmark existed.

	Why the initial is coloured. `--color-initial` is the drop-cap vermilion, not
	`--color-accent` (the link red) — see the palette docblock in `app.css`. Using
	it here is the whole point of the treatment: the reader meets this exact
	letterform, in this exact colour, at the head of every chapter, so the
	wordmark and the chapter openings read as one system instead of two ideas.
	Drop it back to `inherit` and the mark still works; it just stops rhyming.

	No `font-weight` anywhere below. The subset is a single 400 master, so any
	heavier value gets a synthesized bold, and synthesizing bold on an already
	dense blackletter produces an inkblot — the same reason `.drop-cap` carries
	that warning. This is also why the header brand's old `font-weight: 700` had
	to be deleted rather than inherited.

	The two words are separate elements with real whitespace between them in the
	source, which is what keeps a screen reader saying "Glossa Catholica" rather
	than running them together.

	`home.title` is the plain-text form of this same name, used in every page's
	`<title>`. If one changes, change both.
-->

<script lang="ts">
	let {
		variant = 'hero',
		compact = false
	}: { variant?: 'hero' | 'brand'; compact?: boolean } = $props();
</script>

<span class="wordmark is-{variant}" class:is-compact={compact}>
	<span class="lockup">
		<span class="word-glossa"><span class="initial">G</span>lossa</span>
		<span class="word-catholica">Catholica</span>
	</span>
	{#if variant === 'brand'}
		<!--
			The phone-width mark. Note what does NOT happen at that width: the
			lockup above is visually hidden, not removed, so the link's accessible
			name stays "Glossa Catholica" while the eye gets "GC". `display: none`
			here would have shipped a header link that announces itself as "GC",
			which is not the name of anything.

			`aria-hidden` on the monogram is the other half of the same trick —
			without it a screen reader would read the name twice, once spelled out.
		-->
		<span class="monogram" aria-hidden="true"><span class="initial">G</span>C</span>
	{/if}
</span>

<style>
	/*
	 * Both lines scale off the wrapper's own font-size, so the lockup keeps its
	 * proportions at any size — a variant sets one number and the pair follows.
	 */
	.wordmark {
		display: flex;
		font-family: var(--font-display);
		line-height: 0.95;
		/* Contains the absolutely-positioned lockup at phone width (see the
		   `is-brand` media query at the bottom). */
		position: relative;
	}

	.lockup {
		display: flex;
		flex-direction: column;
	}

	.monogram {
		display: none;
		letter-spacing: 0.01em;
	}

	.word-glossa {
		/* Blackletter sets tight by default; a hair of tracking keeps the
		   minuscules from knitting into one texture at display size. */
		letter-spacing: 0.01em;
	}

	.word-catholica {
		/*
		 * Both lines are the same length, and this number is what makes that
		 * true rather than approximately true. Derived from the font's own
		 * advance widths (Pirata One, 1000/em):
		 *
		 *   "Glossa"    advances 2.2920em, + 5 gaps x 0.01em tracking = 2.3420em
		 *   "Catholica" advances 3.1490em, + 8 gaps x 0.08em tracking = 3.7890em
		 *   2.3420 / 3.7890 = 0.6181
		 *
		 * Note "Catholica" is the WIDER word at equal size — nine letters against
		 * six — so the second line is set smaller to match, not larger. Gaps are
		 * (n - 1), not n: CSS puts a letter-space after the final character too,
		 * but that one is empty space rather than ink, and it is the ink that has
		 * to line up. The negative end margin below removes it from the box so the
		 * element's width is the mark's visible width.
		 *
		 * Change either word, either tracking value, or the typeface and this
		 * number is wrong — recompute it, don't nudge it.
		 */
		font-size: 0.6181em;
		letter-spacing: 0.08em;
		margin-inline-end: -0.08em;
		/* Optical, not metric: the cap G's shoulder already carries the eye down,
		   so the second line sits closer than a line-height alone would put it. */
		margin-block-start: 0.15em;
	}

	.initial {
		color: var(--color-initial);
	}

	/* ---- hero: the home page's h1 ---- */

	.is-hero {
		font-size: clamp(3.5rem, 13vw, 5.5rem);
	}

	/* ---- brand: the header ---- */

	.is-brand {
		font-size: 1.75rem;
	}

	/*
	 * At phone width the header drops to the monogram — the same two initials,
	 * the same two colours, as the favicon. A two-line lockup and five controls
	 * do not both fit across 380px, and shrinking the lockup until it did was
	 * the previous answer: it left "Catholica" at about 8px, which is texture,
	 * not a word.
	 *
	 * 30rem is `app.css`'s own phone breakpoint (the one that turns drop caps
	 * off), reused rather than invented so the site has one idea of "narrow".
	 */
	@media (max-width: 30rem) {
		.is-brand .lockup {
			/* Visually hidden, NOT display:none — see the markup comment. */
			position: absolute;
			width: 1px;
			height: 1px;
			overflow: hidden;
			clip-path: inset(50%);
			white-space: nowrap;
		}

		.is-brand .monogram {
			display: block;
			font-size: 1.15em;
		}
	}

	/*
	 * The scroll-triggered equivalent of the media query above — same swap,
	 * same declarations, but keyed on the `compact` prop instead of viewport
	 * width, so it fires at any screen size once `+layout.svelte` decides the
	 * reader has scrolled. A plain selector can't be OR'd into that `@media`
	 * block, so this is a second copy of the two rules rather than a shared one.
	 */
	.is-brand.is-compact .lockup {
		position: absolute;
		width: 1px;
		height: 1px;
		overflow: hidden;
		clip-path: inset(50%);
		white-space: nowrap;
	}

	.is-brand.is-compact .monogram {
		display: block;
		font-size: 1.15em;
	}
</style>
