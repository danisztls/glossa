<script lang="ts">
	/**
	 * One paragraph of the corpus's narrowed inline markup, with scripture
	 * references linkified — for prose that carries no footnote apparatus.
	 *
	 * Distinct from `InlineText` (headings, TOC rows: no links at all, because
	 * a heading is itself a link target) and from `CccParagraphText` (which
	 * additionally turns `<sup data-fn>` into a citation disclosure). What all
	 * three share is `parseInlineHtml`, where the markup rules live, and
	 * `InlineNodes`, which walks the parsed nodes.
	 */
	import { content } from '$lib/content.svelte';
	import { linkifyInline, parseInlineHtml } from '$lib/inline-html';
	import { linkifyProse, refHref, type RefSegment } from '$lib/refs';
	import InlineNodes from './InlineNodes.svelte';

	let { html, lang }: { html: string; lang: string } = $props();

	const nodes = $derived(
		linkifyInline(parseInlineHtml(html), (text: string) => linkifyProse(text, { lang }))
	);

	function hrefFor(seg: RefSegment): string | undefined {
		return refHref(seg, { bibleWorkId: content.workIdFor('bible'), lang });
	}
</script>

<p><InlineNodes {nodes} {hrefFor} /></p>
