<!--
	Which calendar the day is computed in — the general one, or one of the
	national calendars layered over it.

	## Why a grid of flags and not a `<select>`

	It was a native `<select>` of country names until now, and the thing that
	made it wrong was not its looks: a select is a list of WORDS, and the
	reader of this control already knows the answer before they read anything.
	They are not choosing between alternatives they have to weigh — they are
	looking for their own country, which they recognise by its flag faster than
	they can read a column of names in an alphabet that may not even be theirs.
	A grid also shows the whole set at once, where a select shows four rows and
	a scrollbar; "which countries does this site have?" is a question the
	control can now answer by being opened.

	The name is not dropped — it is the `title` and the `aria-label` on every
	cell, so it is one hover or one screen-reader stop away, and the trigger
	prints the current one in full. What the grid removes is the need to read
	sixteen names to find one flag.

	## The flags are emoji, and the fallback is the country code

	Two regional-indicator code points per country (`BR` → 🇧🇷), composed here
	from the same ISO 3166-1 alpha-2 code the calendar is keyed by. No image
	assets, no sprite sheet, no per-flag licence question, and nothing to keep
	in step with the calendar list — a country added to `national/` arrives
	here with its flag already drawn.

	The known cost is Windows, whose system emoji font ships no country flags:
	Chrome and Edge there render the pair as the two boxed letters "BR"
	instead. That is a legible fallback rather than a broken one — it is the
	country's own code, which is what the cell means — and it is why the cells
	are sized for a two-letter glyph pair rather than for a picture.

	## The general calendar is a row, not a cell

	It sits above the grid with its name printed, and wears the Vatican flag
	because that is the flag of the see whose calendar it is. It is deliberately
	not the seventeenth square: it is the DEFAULT and the thing the other
	sixteen are layers over (see `national/index.ts`), and a row that says so in
	words is worth more than the four millimetres it costs.
-->
<script lang="ts">
	import { bcp47, t } from '$lib/i18n.svelte';
	import { keepInViewport } from '$lib/floating';
	import Icon from './Icon.svelte';
	import { Menu } from './menu.svelte';

	interface Props {
		/** The chosen calendar's id — `'general'` or an alpha-2 country code. */
		value: string;
		/** Country codes to offer, in the order they should be offered in. */
		countries: readonly string[];
		/** The interface language, for the country names. */
		lang: string;
		onchoose: (id: string) => void;
	}

	let { value, countries, lang, onchoose }: Props = $props();

	const menu = new Menu();

	/**
	 * The flag of an ISO 3166-1 alpha-2 code.
	 *
	 * Regional indicator symbols are U+1F1E6..U+1F1FF in the same order as
	 * A..Z, so the whole mapping is one offset — there is no table to keep,
	 * and a country the calendar gains needs nothing added here.
	 */
	function flag(code: string): string {
		return String.fromCodePoint(
			...code
				.toUpperCase()
				.split('')
				.map((c) => 0x1f1e6 + c.charCodeAt(0) - 65)
		);
	}

	/**
	 * A country's name, in the reader's own language, from the platform.
	 *
	 * `Intl.DisplayNames` is what the language menu already uses for language
	 * names (`menu-filter.ts`), and it earns its place here for the same
	 * reason: sixteen country names in thirty-odd interface languages is a
	 * table nobody would maintain, and every browser already knows them. A tag
	 * it cannot name falls back to the code, which is at least the ISO name of
	 * the country.
	 *
	 * `bcp47`, for the reason `menu-filter.ts`'s own `Intl` call gives: `zht`
	 * is structurally valid and unresolvable, so it does not throw into the
	 * `catch` below — it answers in the browser's locale, which reads as a bug
	 * in the country list rather than in the tag.
	 */
	function countryName(code: string, uiLang: string): string {
		const upper = code.toUpperCase();
		try {
			return new Intl.DisplayNames([bcp47(uiLang)], { type: 'region' }).of(upper) ?? upper;
		} catch {
			return upper;
		}
	}

	const generalName = $derived(t('calendar.which.general'));
	const rows = $derived(
		countries.map((code) => ({ code, name: countryName(code, lang), flag: flag(code) }))
	);
	const currentName = $derived(value === 'general' ? generalName : countryName(value, lang));
	const currentFlag = $derived(flag(value === 'general' ? 'VA' : value));

	function choose(id: string) {
		onchoose(id);
		menu.closeAndRefocus();
	}
</script>

<svelte:window onclick={menu.onWindowClick} />

<div class="menu" bind:this={menu.containerEl}>
	<button
		type="button"
		bind:this={menu.triggerEl}
		class="menu-trigger wide calendar-trigger"
		aria-haspopup="menu"
		aria-expanded={menu.open}
		aria-label={`${t('calendar.calendar')}: ${currentName}`}
		title={currentName}
		onclick={menu.toggle}
	>
		<span class="flag" aria-hidden="true">{currentFlag}</span>
		<span class="trigger-name">{currentName}</span>
	</button>
	{#if menu.open}
		<!-- A `<div>` rather than the `<ul>` the plain panels are: this one holds
		     a row AND a grid, so `role="menu"` cannot sit on a single list. It
		     goes on each of the two instead, and Escape is handled on the
		     wrapper's two children for the same reason. -->
		<div class="panel-surface menu-panel calendar-panel" use:keepInViewport>
			<ul class="menu-list" role="menu" aria-label={t('calendar.calendar')}>
				<li role="none">
					<button
						type="button"
						role="menuitemradio"
						aria-checked={value === 'general'}
						class="menu-item general-row"
						class:current={value === 'general'}
						onclick={() => choose('general')}
						onkeydown={menu.onPanelKeydown}
					>
						<span class="menu-item-main">
							<span class="check-slot"
								>{#if value === 'general'}<Icon name="check" />{/if}</span
							>
							<span class="flag" aria-hidden="true">{flag('VA')}</span>
							<span>{generalName}</span>
						</span>
					</button>
				</li>
			</ul>
			<ul class="flag-grid" role="menu" aria-label={t('calendar.calendar')}>
				{#each rows as row (row.code)}
					{@const isCurrent = value === row.code}
					<li role="none">
						<button
							type="button"
							role="menuitemradio"
							aria-checked={isCurrent}
							class="flag-cell"
							class:current={isCurrent}
							aria-label={row.name}
							title={row.name}
							onclick={() => choose(row.code)}
							onkeydown={menu.onPanelKeydown}
						>
							<span class="flag" aria-hidden="true">{row.flag}</span>
						</button>
					</li>
				{/each}
			</ul>
		</div>
	{/if}
</div>

<style>
	/* Wide enough for the longest of the names it prints ("General Roman
	   Calendar"), and capped so a long one in another language truncates
	   rather than pushing the controls row into a second line. */
	.calendar-trigger {
		max-width: min(16rem, 60vw);
		font-size: 0.85rem;
	}

	.trigger-name {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.calendar-panel {
		min-width: min(17rem, 90vw);
	}

	/*
	 * A COLOUR FONT, NAMED. The flags are the only glyphs on the site whose
	 * point is their colour, and the reading faces (`--font-sans` is a text
	 * stack) carry no country flags at all — so without a stack that names the
	 * platform's emoji font, the pair falls back per-glyph and can come out as
	 * two tofu boxes rather than as the two letters that are the intended
	 * fallback.
	 */
	.flag {
		font-family:
			'Noto Color Emoji', 'Apple Color Emoji', 'Segoe UI Emoji', 'Twemoji Mozilla', sans-serif;
		line-height: 1;
	}

	.general-row .flag {
		font-size: 1.1em;
	}

	/* The hairline is the only thing separating the default from the layers
	   over it; the row above is a sentence and the grid below is a picture, so
	   nothing else is needed to tell them apart. */
	.flag-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(2.5rem, 1fr));
		gap: 0.15rem;
		margin: 0.35rem 0 0;
		padding: 0.35rem 0 0;
		border-top: 1px solid var(--color-border);
		list-style: none;
	}

	/*
	 * A SQUARE, sized for the two-letter fallback rather than for the flag.
	 * Where the flags draw, 1.5rem of emoji sits comfortably inside 2.4rem;
	 * where they do not, the cell holds "BR" at the same size without the
	 * grid changing shape between platforms.
	 */
	.flag-cell {
		display: flex;
		align-items: center;
		justify-content: center;
		inline-size: 100%;
		block-size: 2.4rem;
		padding: 0;
		border: 1px solid transparent;
		border-radius: var(--radius-md);
		background: transparent;
		font-size: 1.5rem;
		line-height: 1;
		cursor: pointer;
	}

	.flag-cell:hover {
		background: var(--color-bg-elevated);
		border-color: var(--color-border);
	}

	/* The chosen cell carries no tick — a check glyph over a flag hides the
	   thing the reader is identifying it by. The accent ring says the same and
	   covers nothing; `aria-checked` is what actually carries the state. */
	.flag-cell.current {
		border-color: var(--color-accent);
		background: var(--color-bg-elevated);
	}

	/* Same fixed slot LanguageMenu's grid uses, and for the same reason: the
	   row's label has to start at one place whether or not it is ticked. */
	.check-slot {
		display: inline-flex;
		justify-content: center;
		inline-size: 0.9em;
		flex: none;
	}
</style>
