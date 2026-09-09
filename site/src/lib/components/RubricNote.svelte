<!--
	A mystery set's own rubric, behind an `i`.

	"(recited Tuesday and Friday)", "(da recitare lunedì e sabato)" — the
	parenthetical the source prints under each set's name, saying which days it
	is appointed to. It was set as a line under the heading, and on the six
	editions with a day control above it that line is the third thing on the
	page saying the same thing: the strip shows the week, the reader has just
	pressed a day on it, and the set's name is what they came for. A rubric is
	worth keeping and worth reading once.

	SO IT IS ASKED FOR RATHER THAN PRINTED, in `ArtFigure`'s arrangement and
	its clothes: `AnchoredPanel`, a native popover in the top layer, `.hint`
	glyph alone as the trigger. `role="note"` is ARIA's own word for content
	ancillary to the thing it hangs off, which a rubric exactly is — not
	`tooltip`, which describes its anchor and is summoned rather than asked
	for. The panel is `position: fixed` in the top layer, so opening it costs
	no layout and nothing on the page moves.

	IT IS A COMPONENT BECAUSE THE PANEL IS STATE. `AnchoredPanel` is one
	instance per trigger and a snippet cannot hold one, and `PrayerMysteries`
	draws this in two places: once beside the day strip on the editions that
	rotate, and once per set on the three that print all four. A snippet with
	one shared panel would open the same rubric from four different marks.

	THE TRIGGER'S LABEL IS MANDATORY AND IS NOT THE RUBRIC. An icon has no text
	to fall back on; `Icon.svelte` enforces the other half by making every icon
	`aria-hidden` with no label prop to reach for. The label says what pressing
	it reveals, and the rubric itself is inside, marked as the source's own
	language rather than the reader's.
-->
<script lang="ts">
	import Icon from '$lib/components/Icon.svelte';
	import { AnchoredPanel } from '$lib/floating.svelte';
	import { t } from '$lib/i18n.svelte';

	interface Props {
		/** The source's parenthetical, verbatim. */
		rubric: string;
		/** The edition's language — the rubric is the source's own words. */
		lang: string;
	}

	let { rubric, lang }: Props = $props();

	// Per INSTANCE: `popovertarget` names an id, and a page can draw four of
	// these. `$props.id()` has to be a bare variable declaration initializer,
	// so it cannot be passed straight to the constructor.
	const uid = $props.id();
	const note = new AnchoredPanel(uid);
</script>

<button
	bind:this={note.trigger}
	type="button"
	class="menu-trigger rubric-trigger"
	popovertarget={note.id}
	aria-expanded={note.open}
	aria-label={t('prayers.rosary.whenPrayed')}
>
	<Icon name="info" class="hint" />
</button>
<span
	bind:this={note.panel}
	id={note.id}
	popover="auto"
	role="note"
	ontoggle={note.onToggle}
	class="panel-surface floating-panel rubric-note"
	{lang}>{rubric}</span
>

<style>
	/* `.menu-trigger` is an icon square (styles/menus.css) and carries the
	   size, the hit area and the focus ring; this adds only that the glyph is
	   quieter than a control the reader is meant to press, because a rubric is
	   apparatus and not a way onward. */
	.rubric-trigger {
		color: var(--color-text-muted);
	}

	.rubric-trigger:hover {
		color: var(--color-accent);
	}

	/* Sized to its own words: a rubric is one short parenthesis, and a panel
	   at the reading measure would be a wide box with a line in the corner. */
	.rubric-note {
		max-inline-size: 22rem;
		padding: 0.5rem 0.7rem;
		font-family: var(--font-sans);
		font-size: max(var(--font-size-min), 0.85rem);
		font-style: italic;
		color: var(--color-text-muted);
	}
</style>
