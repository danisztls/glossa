<!--
	UI language switch.

	Now a dropdown on the same `.menu`/`.menu-trigger`/`.menu-panel`
	primitives as ThemeMenu/FontSizeMenu/EditionMenu, rather than the
	side-by-side EN|PT segmented control it used to be. The earlier shape was
	argued for on the grounds that UI language drives content language
	(i18n.svelte.ts) and so deserved to look different from the "reading
	settings" controls — but being the odd one out in a row of otherwise
	identical dropdowns reads as an inconsistency to fix, not as emphasis.
	Prominence now comes from sitting outside the `.reading-controls` group,
	which is the distinction that actually matters: this control changes
	*content*, those change *appearance*.

	The trigger shows the current language's own code (EN / PT) as text. No
	icon: a globe or speech-bubble glyph next to two letters that already
	spell the answer is decoration, and the two-letter code is both shorter
	and less ambiguous than any icon for this particular job.
-->
<script lang="ts">
	import { i18n, t } from '$lib/i18n.svelte';
	import type { UiLang } from '$lib/i18n.svelte';
	import Icon from './Icon.svelte';

	// Each label is written in its OWN language, not translated into the
	// current one: a reader who has landed on the wrong interface language
	// needs to recognize their language in the list, and "Portuguese" is no
	// help to someone who only reads Portuguese.
	const OPTIONS: { code: UiLang; short: string; label: string }[] = [
		{ code: 'en', short: 'EN', label: 'English' },
		{ code: 'pt', short: 'PT', label: 'Português' }
	];

	let open = $state(false);
	let menuEl: HTMLDivElement | undefined = $state();
	let triggerEl: HTMLButtonElement | undefined = $state();

	const current = $derived(OPTIONS.find((o) => o.code === i18n.lang) ?? OPTIONS[0]);

	function close() {
		open = false;
	}

	function choose(code: UiLang) {
		i18n.set(code);
		close();
		triggerEl?.focus();
	}

	function onWindowClick(e: MouseEvent) {
		if (!open) return;
		if (menuEl && e.target instanceof Node && !menuEl.contains(e.target)) close();
	}

	function onPanelKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') {
			e.preventDefault();
			close();
			triggerEl?.focus();
		}
	}
</script>

<svelte:window onclick={onWindowClick} />

<div class="menu" bind:this={menuEl}>
	<button
		type="button"
		bind:this={triggerEl}
		class="menu-trigger lang-trigger"
		aria-haspopup="menu"
		aria-expanded={open}
		aria-label={`${t('lang.label')}: ${current.label}`}
		title={t('lang.label')}
		onclick={() => (open = !open)}
	>
		{current.short}
	</button>
	{#if open}
		<ul class="menu-panel" role="menu" aria-label={t('lang.label')} onkeydown={onPanelKeydown}>
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
	/* `.menu-trigger` is sized for a single icon glyph; this one holds two
	   letters instead, so it needs its own horizontal padding and a tabular
	   font so EN and PT occupy the same width and the header doesn't shift
	   by a pixel when the language changes. */
	.lang-trigger {
		padding-inline: 0.55rem;
		font-size: 0.85rem;
		font-weight: 600;
		font-variant-numeric: tabular-nums;
		letter-spacing: 0.03em;
	}
</style>
