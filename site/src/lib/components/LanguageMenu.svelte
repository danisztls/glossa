<!--
	UI language switch.

	Now a dropdown on the same `.menu`/`.menu-trigger`/`.menu-panel`
	primitives as AppearanceMenu/EditionMenu, rather than the
	side-by-side EN|PT segmented control it used to be. The earlier shape was
	argued for on the grounds that UI language drives content language
	(i18n.svelte.ts) and so deserved to look different from the "reading
	settings" controls — but being the odd one out in a row of otherwise
	identical dropdowns reads as an inconsistency to fix, not as emphasis.
	It used to take its prominence from sitting outside the `.reading-controls`
	pill, on the grounds that this control changes *content* while those change
	*appearance*. That pill is gone — the header is one row of identical
	triggers now — so the distinction is no longer carried by chrome. It does
	not need to be: the label reads "EN", which says what the control is more
	plainly than any grouping did.

	The trigger shows the current language's own code (EN / PT / AR …) as
	text. No icon: a globe or speech-bubble glyph next to two letters that
	already spell the answer is decoration, and the two-letter code is both
	shorter and less ambiguous than any icon for this particular job. The
	codes stay in the Latin alphabet even for the languages that do not use
	one — a two-letter code is an identifier, and `AR` is what the reader will
	have seen on vatican.va's own language bar.
-->
<script lang="ts">
	import { i18n, t } from '$lib/i18n.svelte';
	import type { UiLang } from '$lib/i18n.svelte';
	import Icon from './Icon.svelte';
	import { Menu } from './menu.svelte';

	// Each label is written in its OWN language, not translated into the
	// current one: a reader who has landed on the wrong interface language
	// needs to recognize their language in the list, and "Portuguese" is no
	// help to someone who only reads Portuguese. That was worth stating with
	// two entries and is the whole usability of the control with ten.
	//
	// Order matches `UI_LANGS` (i18n.svelte.ts), which is not alphabetical:
	// English, Portuguese and Latin lead because they are what the corpus is
	// in, and the seven that came with Magnifica Humanitas follow.
	//
	// `Latina` is the label rather than `Lingua Latina` for the same reason
	// `Deutsch` is not `Deutsche Sprache` — and it is what `corpus.ts`'s
	// `LANGUAGE_NAMES` already calls the Clementine's language in the edition
	// menu, which sits two triggers away in the same header.
	const OPTIONS: { code: UiLang; short: string; label: string }[] = [
		{ code: 'en', short: 'EN', label: 'English' },
		{ code: 'pt', short: 'PT', label: 'Português' },
		{ code: 'la', short: 'LA', label: 'Latina' },
		{ code: 'de', short: 'DE', label: 'Deutsch' },
		{ code: 'es', short: 'ES', label: 'Español' },
		{ code: 'fr', short: 'FR', label: 'Français' },
		{ code: 'it', short: 'IT', label: 'Italiano' },
		{ code: 'pl', short: 'PL', label: 'Polski' },
		{ code: 'ru', short: 'RU', label: 'Русский' },
		{ code: 'ar', short: 'AR', label: 'العربية' }
	];

	const menu = new Menu();

	const current = $derived(OPTIONS.find((o) => o.code === i18n.lang) ?? OPTIONS[0]);

	function choose(code: UiLang) {
		i18n.set(code);
		menu.closeAndRefocus();
	}
</script>

<svelte:window onclick={menu.onWindowClick} />

<div class="menu" bind:this={menu.containerEl}>
	<button
		type="button"
		bind:this={menu.triggerEl}
		class="menu-trigger lang-trigger"
		aria-haspopup="menu"
		aria-expanded={menu.open}
		aria-label={`${t('lang.label')}: ${current.label}`}
		title={t('lang.label')}
		onclick={menu.toggle}
	>
		{current.short}
	</button>
	{#if menu.open}
		<ul class="menu-panel" role="menu" aria-label={t('lang.label')} onkeydown={menu.onPanelKeydown}>
			{#each OPTIONS as opt (opt.code)}
				{@const isCurrent = i18n.lang === opt.code}
				<li role="none">
					<button
						type="button"
						role="menuitemradio"
						aria-checked={isCurrent}
						class="menu-item"
						class:current={isCurrent}
						onclick={() => choose(opt.code)}
					>
						<span class="menu-item-main">
							{#if isCurrent}<Icon name="check" />{/if}
							<span lang={opt.code}>{opt.label}</span>
						</span>
					</button>
				</li>
			{/each}
		</ul>
	{/if}
</div>

<style>
	/*
	 * `.menu-trigger` is sized for a single icon glyph; this one holds two
	 * letters instead. The fix is to size the label to the square, NOT to give
	 * the square its own padding: it is a fixed 2.25rem with `box-sizing:
	 * border-box`, so the `padding-inline: 0.55rem` that used to sit here left a
	 * ~16px content box for a ~20px word and squeezed "EN" against its own
	 * border. The square already centres what is inside it.
	 *
	 * Tabular figures so EN and PT occupy the same width and the header does not
	 * shift by a pixel when the language changes.
	 */
	.lang-trigger {
		font-size: 0.85rem;
		font-weight: 600;
		font-variant-numeric: tabular-nums;
		letter-spacing: 0.03em;
	}
</style>
