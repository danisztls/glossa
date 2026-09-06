<script lang="ts">
	/**
	 * One card in a catalogue: a mark, a name, a sentence, and a way in.
	 *
	 * ## Why it is a component
	 *
	 * `/bibliotheca` and the home page drew this card twice, in two files,
	 * under two names (`.shelf` and `.door`) — and the comments in both said so
	 * at length, each pointing at the other for the declarations it had copied.
	 * Two of the copies had already drifted apart on the grid track and on
	 * whether the heading was an `<h3>` or a `<span>`, which is what a
	 * resemblance does when it is maintained by hand. When the home page's
	 * doors became the catalogue itself (2026-09-06) there was nothing left for
	 * the second copy to be, so the card moved here and `$lib/shelves.ts` took
	 * the list. The grid stays on each page: the CARD is one object, the number
	 * of columns it is laid out in is that page's argument.
	 *
	 * ## The `<li>` is the component's, and so is the `<h3>`
	 *
	 * The caller supplies the `<ul>` and its grid; a card is a list item in it,
	 * so the item comes with the card rather than being something four callers
	 * must remember to wrap it in.
	 *
	 * An `<h3>` rather than a `<span>`: a catalogue is a list of named things
	 * and a reader moving by heading should meet all of them. `<a>` takes flow
	 * content, so the whole card is one anchor with a heading inside it — which
	 * this could not be while a card held rows of its own, an anchor inside an
	 * anchor being ambiguous before it is invalid. Both pages that draw this
	 * put it under an `h2`, hidden or not, so the level is right on both.
	 */
	import Icon from './Icon.svelte';
	import type { IconName } from './Icon.svelte';

	interface Props {
		href: string;
		/** Decorative, which `Icon.svelte` enforces rather than offers: the name
		 *  beside it is the label. */
		icon: IconName;
		title: string;
		/**
		 * Set as HTML, on the same terms as `/catechismus`'s masthead: every
		 * sentence that reaches this is a literal in a checked-in dictionary,
		 * named by a key in `$lib/shelves.ts` or beside the call, and nothing is
		 * passed through from the corpus or from a URL.
		 */
		tagline: string;
	}
	let { href, icon, title, tagline }: Props = $props();
</script>

<li>
	<a class="shelf" {href}>
		<h3 class="shelf-heading">
			<span class="shelf-icon"><Icon name={icon} /></span>
			<span class="shelf-title">{title}</span>
		</h3>
		<span class="shelf-tagline">{@html tagline}</span>
	</a>
</li>

<style>
	/* `height: 100%` rather than a stretched item's default, because the `<li>`
	   is what the grid stretches and the anchor inside it has to be told to
	   follow — without it a short card's target stops above the bottom of its
	   own outline. */
	.shelf {
		display: block;
		height: 100%;
		padding: 0.9rem 1rem;
		text-decoration: none;
		color: var(--color-text);
		background: var(--color-bg-elevated);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
	}

	/* `.book-btn`'s hover, which is the same object: a name out of a grid,
	   leading into the text. */
	.shelf:hover,
	.shelf:focus-visible {
		border-color: var(--color-accent);
	}

	/*
	 * THE MARK SITS ON THE HEADING'S FIRST LINE, centred against it — and it
	 * used to be baseline-aligned, which is the wrong rule for a glyph even
	 * though it is the right one for two runs of text. A box with no text in it
	 * has no baseline of its own, so the flex line took its BOTTOM EDGE as one:
	 * a 1em square stood on the baseline and rose a full em, where the capitals
	 * beside it reach about seven tenths of that, and every mark on the page
	 * floated above its own name. `CopyrightNotice` documents the same fact
	 * about a bare inline `<svg>` and drops it by hand.
	 *
	 * A grid instead, so the glyph is centred in a box exactly ONE LINE tall
	 * (`1lh`, which is why `.shelf-icon` sets no `line-height` of its own — the
	 * unit reads the heading's) and the box is placed at the START of the text
	 * column. Centring a line box against a line box needs no font metrics and
	 * no magic number, and the Catechism card is what needs the `start`: its
	 * title runs to two lines and the mark belongs beside the first, not
	 * halfway down both.
	 */
	.shelf-heading {
		display: grid;
		grid-template-columns: auto minmax(0, 1fr);
		align-items: start;
		column-gap: 0.5rem;
		font-family: var(--font-serif);
		font-size: 1.15rem;
		font-weight: inherit;
		margin: 0;
	}

	/*
	 * `/schola`'s `.book-icon`, in its two load-bearing declarations: the accent
	 * at 75%, lighting to full where the card is under the pointer. A mark at
	 * full strength beside every heading is seven marks competing with seven
	 * names; at 75% it is a mark, and the difference is what hover has to say.
	 * No `:has()` guard is needed now that the whole card is the anchor —
	 * anywhere the mark lights, the pointer is on the target.
	 */
	.shelf-icon {
		display: grid;
		place-items: center;
		block-size: 1lh;
		color: var(--color-accent);
		opacity: 0.75;
	}

	.shelf:hover .shelf-icon,
	.shelf:focus-visible .shelf-icon {
		opacity: 1;
	}

	.shelf:hover .shelf-title,
	.shelf:focus-visible .shelf-title {
		color: var(--color-accent);
	}

	.shelf-tagline {
		display: block;
		margin-top: 0.3rem;
		font-size: 0.85rem;
		line-height: 1.45;
		color: var(--color-text-muted);
	}

	@media print {
		.shelf {
			background: none;
			break-inside: avoid;
		}
	}
</style>
