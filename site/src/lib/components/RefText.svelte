<script lang="ts">
	/**
	 * Presentation layer over `$lib/refs.ts`'s `parseRefs` — renders a raw
	 * reference string (a CCC footnote citation, a `related` list, a
	 * Compendium `ccc_refs` string) with every resolvable reference woven in
	 * as a link and everything else left as plain text, reproducing the
	 * original string exactly. All grammar/resolution logic lives in
	 * `refs.ts`; this component only walks its segment list and picks a
	 * presentation per segment kind — see that module's docblock for what
	 * "resolvable" means and why some segments (document sigla) never
	 * resolve to a link at all.
	 *
	 * The one thing it does not reproduce byte for byte is the source's loose
	 * spacing: `normalizeCitationSpacing` tidies a stray space after "(",
	 * before ")", or before a comma/period ("( Sl 105, 3)", "Cf . Lc 1, 38")
	 * first. Those are typesetting defects, common across every vatican.va
	 * mirror the corpus is built from, and they read as errors on the page.
	 * Whitespace only — see that function's docblock for why the corpus still
	 * stores the source's own spelling and this is the layer that adjusts it.
	 *
	 * Deliberately NOT the right tool for in-prose text (a CCC paragraph's
	 * own body, which mixes real prose with the occasional "cf. 1212") —
	 * that's `linkifyProse`, meant to be rendered by hand alongside the
	 * text-marker splitting a paragraph already needs (see
	 * `ProseBlocks.svelte`). This component assumes the *whole* string
	 * is citation-shaped, which is true for a footnote or a `ccc_refs`
	 * string but not for running prose.
	 *
	 * THREE PRESENTATIONS, NOT TWO. A segment that resolves is a link; one that
	 * does not but has something to disclose is a `SiglumGloss`, the card that
	 * says what `AAS` stands for; and everything else is the plain text the
	 * source printed. That third branch used to carry the cue as well -- a
	 * dotted underline, `cursor: help` and a `title` -- over segments where the
	 * `title` merely repeated the words under it, and a cue that opens nothing
	 * is what `CitedBy` means by drawing the affordance only on a label that
	 * shortens something. `glossOf` decides both halves, so they cannot drift.
	 */
	import { glossOf, normalizeCitationSpacing, parseRefs, refHref } from '$lib/refs';
	import { content } from '$lib/content.svelte';
	import { i18n } from '$lib/i18n.svelte';
	import SiglumGloss from './SiglumGloss.svelte';

	interface Props {
		text: string;
		/** Bare content language driving the citation grammar (PT's comma separator, its own book-abbreviation table). Falls back to the current UI language. */
		lang?: string;
		/** Corpus work id of the text being read, when the caller knows it. Only
		    the few works listed in `refs-grammar.ts`'s `WORK_CONFIGS` read
		    differently for it — works of the Douay tradition, which name the
		    books of Kings its way and number the Psalter the Vulgate's — and passing nothing reads the work as its language
		    reads. */
		work?: string;
		class?: string;
	}

	let { text, lang, work, class: className }: Props = $props();

	const effectiveLang = $derived(lang ?? i18n.lang);
	const segments = $derived(
		parseRefs(normalizeCitationSpacing(text), { lang: effectiveLang, work })
	);
	const bibleWorkId = $derived(content.workIdFor('bible'));
</script>

<span class={className}>
	{#each segments as seg, i (i)}
		{#if seg.kind === 'text'}{seg.text}{:else}
			{@const href = refHref(seg, { bibleWorkId, lang: effectiveLang, work })}
			{@const gloss = glossOf(seg)}
			{#if href}
				<a class="ref-link" {href}>{seg.raw}</a>
			{:else if gloss}
				<SiglumGloss label={seg.raw} {gloss} lang={effectiveLang} />
			{:else}{seg.raw}{/if}
		{/if}
	{/each}
</span>

<style>
	/*
	 * "Quiet" by design — a footnote or ccc_refs line is already small/muted
	 * type (see ProseBlocks.svelte's .citation-text, the compendium
	 * page's .ccc-refs), so a link here should read as "this word is also a
	 * link" rather than compete with the page's actual accent color. Color
	 * inherits from context; only the underline marks it as interactive,
	 * and only hover/focus reach for --color-link.
	 */
	.ref-link {
		color: inherit;
		text-decoration: underline;
		text-decoration-color: var(--color-border);
		text-underline-offset: 0.15em;
	}

	.ref-link:hover,
	.ref-link:focus-visible {
		color: var(--color-link);
		text-decoration-color: currentColor;
	}

	.ref-link:focus-visible {
		outline: 2px solid var(--color-focus-ring);
		outline-offset: 2px;
		border-radius: 2px;
	}
</style>
