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
	 * `CccParagraphText.svelte`). This component assumes the *whole* string
	 * is citation-shaped, which is true for a footnote or a `ccc_refs`
	 * string but not for running prose.
	 */
	import { normalizeCitationSpacing, parseRefs, refHref, type RefSegment } from '$lib/refs';
	import { content } from '$lib/content.svelte';
	import { i18n } from '$lib/i18n.svelte';

	interface Props {
		text: string;
		/** Bare content language driving the citation grammar (PT's comma separator, its own book-abbreviation table). Falls back to the current UI language. */
		lang?: string;
		class?: string;
	}

	let { text, lang, class: className }: Props = $props();

	const effectiveLang = $derived(lang ?? i18n.lang);
	const segments = $derived(parseRefs(normalizeCitationSpacing(text), { lang: effectiveLang }));
	const bibleWorkId = $derived(content.workIdFor('bible'));

	/** Tooltip for an unresolved segment: the document expansion when we have one, otherwise just the raw citation text (better than nothing, no worse than the plain text it sits next to). */
	function tooltipFor(seg: RefSegment): string {
		return seg.kind === 'document' && seg.expansion
			? `${seg.sigla} — ${seg.expansion}`
			: seg.kind === 'text'
				? ''
				: seg.raw;
	}
</script>

<span class={className}>
	{#each segments as seg, i (i)}
		{#if seg.kind === 'text'}{seg.text}{:else}
			{@const href = refHref(seg, { bibleWorkId, lang: effectiveLang })}
			{#if href}
				<a class="ref-link" {href}>{seg.raw}</a>
			{:else}
				<span class="ref-unresolved" title={tooltipFor(seg)}>{seg.raw}</span>
			{/if}
		{/if}
	{/each}
</span>

<style>
	/*
	 * "Quiet" by design — a footnote or ccc_refs line is already small/muted
	 * type (see CccParagraphText.svelte's .citation-text, the compendium
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

	.ref-unresolved {
		cursor: help;
		border-bottom: 1px dotted var(--color-text-muted);
	}
</style>
