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
	A grid also shows the whole set at once, where a select showed four rows and
	a scrollbar; "which countries does this site have?" is a question the
	control can now answer by being opened.

	The name is not dropped — it is the `title` and the `aria-label` on every
	cell, so it is one hover or one screen-reader stop away, and the trigger
	prints the current one in full. What the grid removes is the need to read
	fifty names to find one flag.

	## Grouped by region, and filtered by name

	Sixteen flags are a grid; fifty are a wall. So they are grouped the way
	GCatholic groups them — which is also how the reader will have met the list
	if they met it there — and a reader looking for Ecuador knows which
	continent it is on before they know what its flag looks like.

	The box above them is the other half, and it is the same argument
	`LanguageMenu` makes for its own: the grouping is a guess about where a
	reader will look, and a guess is only tolerable where being wrong is cheap.
	Typing searches EVERY region and ignores the grouping entirely — a filtered
	list that silently omitted matches would be the one failure neither half
	could recover from. It searches the country's name in the reader's own
	language and its code, so a Portuguese reader finds Germany by typing
	"alemanha" and anyone finds it by typing "de".

	ORDERED INSIDE A REGION BY THE READER'S OWN ALPHABET, with `Intl.Collator`,
	because a list of country names sorted in English is sorted for nobody
	else. `national/index.ts` therefore stores the regions and not the order.

	## The flags are emoji, and the fallback is the country code

	Two regional-indicator code points per country (`BR` → 🇧🇷), composed here
	from the same ISO 3166-1 alpha-2 code the calendar is keyed by. No image
	assets, no sprite sheet, no per-flag licence question, and nothing to keep
	in step with the calendar list — a country added to `national/` arrives
	here with its flag already drawn.

	England, Scotland and Wales are the exception at both ends: their ids are
	ISO 3166-2 subdivision tags, so the flag is a TAG SEQUENCE (a black flag
	followed by the tagged code) and the name comes from a table rather than
	from `Intl` — see `SUBDIVISION_NAMES`.

	The known cost is Windows, whose system emoji font ships no country flags:
	Chrome and Edge there render the pair as the two boxed letters "BR"
	instead. That is a legible fallback rather than a broken one — it is the
	country's own code, which is what the cell means — and it is why the cells
	are sized for a two-letter glyph pair rather than for a picture.

	## The general calendar is a row, not a cell

	It sits above the grid with its name printed. It is deliberately not one
	more square: it is the DEFAULT and the thing every other one is a layer
	over (see `national/index.ts`), and a row that says so in words is worth
	more than the four millimetres it costs.

	IT WORE THE VATICAN FLAG FOR A DAY AND THAT WAS A FACTUAL ERROR. Vatican
	City is not the general calendar — it keeps the Diocese of Rome's, which
	GCatholic publishes as `IT-rome0` and this directory carries as `va`, with
	eleven propers of its own that no other calendar has (Peter's chair, the
	dedication of the Lateran as the cathedral's own, the anniversary of the
	pope's election). So the flag was on two different calendars in one
	control, and on the one it does not belong to it said that the universal
	calendar is a country's. 🌐 is the mark instead: a globe is not a
	territory, which is the whole claim the row makes.

	## The value is a TERRITORY, and the calendar is looked up from it

	Eleven of the ninety-six places here have no calendar of their own — Israel,
	Jordan and Cyprus keep the Latin Patriarchate of Jerusalem's, the Faroes and
	Greenland keep Denmark's. So four cells select one layer, and a control
	whose value was the LAYER could not tell which of them had been pressed: it
	found the first cell matching and printed that, so choosing Israel put
	"Cyprus" in the trigger. The value is the cell's own code and the route
	resolves it through `TERRITORY_CALENDARS`, which is one lookup and cannot
	be ambiguous in that direction.
-->
<script lang="ts">
	import { bcp47, t } from '$lib/i18n.svelte';
	import { keepInViewport } from '$lib/floating';
	import { matchesQuery } from '$lib/highlight';
	import { CALENDAR_REGIONS, SUBDIVISION_NAMES, TERRITORY_CALENDARS } from '$lib/calendar/national';
	import Icon from './Icon.svelte';
	import { Menu } from './menu.svelte';

	interface Props {
		/** The chosen TERRITORY's code, or `'general'` — never a layer id, for
		 *  the reason in the docblock above. */
		value: string;
		/** The interface language, for the territory names and their order. */
		lang: string;
		onchoose: (id: string) => void;
	}

	let { value, lang, onchoose }: Props = $props();

	const menu = new Menu();
	let query = $state('');
	let filterEl: HTMLInputElement | undefined = $state();

	/**
	 * The flag of a territory.
	 *
	 * Regional indicator symbols are U+1F1E6..U+1F1FF in the same order as
	 * A..Z, so an alpha-2 code is one offset and there is no table to keep. A
	 * subdivision (`gb-eng`) is the other Unicode form: a black flag followed
	 * by the tag characters of its code and a cancel tag, which is the
	 * sequence that draws the three British flags.
	 */
	function flag(code: string): string {
		if (code.includes('-')) {
			const tag = code.replace('-', '');
			return String.fromCodePoint(
				0x1f3f4,
				...[...tag].map((c) => 0xe0000 + c.charCodeAt(0)),
				0xe007f
			);
		}
		return String.fromCodePoint(
			...[...code.toUpperCase()].map((c) => 0x1f1e6 + c.charCodeAt(0) - 65)
		);
	}

	/**
	 * A territory's name, in the reader's own language, from the platform.
	 *
	 * `Intl.DisplayNames` is what the language menu already uses for language
	 * names (`menu-filter.ts`), and it earns its place here for the same
	 * reason: fifty territory names in thirty-odd interface languages is a
	 * table nobody would maintain, and every browser already knows them. A tag
	 * it cannot name falls back to `SUBDIVISION_NAMES` and then to the code,
	 * which is at least the ISO name of the place.
	 *
	 * `bcp47`, for the reason `menu-filter.ts`'s own `Intl` call gives: `zht`
	 * is structurally valid and unresolvable, so it does not throw into the
	 * `catch` below — it answers in the browser's locale, which reads as a bug
	 * in the country list rather than in the tag.
	 */
	function territoryName(code: string, uiLang: string): string {
		if (SUBDIVISION_NAMES[code]) return SUBDIVISION_NAMES[code];
		const upper = code.toUpperCase();
		try {
			return new Intl.DisplayNames([bcp47(uiLang)], { type: 'region' }).of(upper) ?? upper;
		} catch {
			return upper;
		}
	}

	/** The mark on the general calendar's row. NOT a flag — see the docblock:
	 *  the Vatican has a calendar of its own and a cell of its own. */
	const GENERAL_MARK = '🌐';

	const generalName = $derived(t('calendar.which.general'));

	/** The regions, each with its own territories named and sorted for this
	 *  reader. `TERRITORY_CALENDARS` is what filters: a territory whose
	 *  calendar `held.ts` withdrew resolves to nothing and gets no cell, which
	 *  takes Oman and Yemen out with Southern Arabia's layer and the Faroes
	 *  and Greenland out with Denmark's — correct, since what is held for a
	 *  country is held for everyone who keeps that country's calendar. */
	const regions = $derived(
		CALENDAR_REGIONS.map((region) => {
			const collator = new Intl.Collator(bcp47(lang));
			const cells = region.territories
				.filter((code) => TERRITORY_CALENDARS[code])
				.map((code) => ({
					code,
					name: territoryName(code, lang),
					flag: flag(code)
				}))
				.sort((a, b) => collator.compare(a.name, b.name));
			return { id: region.id, cells };
		}).filter((region) => region.cells.length > 0)
	);

	const filtered = $derived(
		query.trim()
			? regions
					.map((region) => ({
						...region,
						cells: region.cells.filter((cell) => matchesQuery(`${cell.name} ${cell.code}`, query))
					}))
					.filter((region) => region.cells.length > 0)
			: regions
	);

	const matches = $derived(filtered.flatMap((region) => region.cells));

	const currentCell = $derived(regions.flatMap((r) => r.cells).find((cell) => cell.code === value));
	const currentName = $derived(value === 'general' ? generalName : (currentCell?.name ?? value));
	const currentFlag = $derived(value === 'general' ? GENERAL_MARK : (currentCell?.flag ?? ''));

	// The box is what the panel is for at this size, so it takes focus on open
	// — a reader who already knows their country types three letters and is
	// done, and one who does not still sees the flags under it.
	$effect(() => {
		if (menu.open) filterEl?.focus();
		else query = '';
	});

	function choose(id: string) {
		onchoose(id);
		menu.closeAndRefocus();
	}

	/** Enter takes the only cell left, and does nothing while there is more
	 *  than one — `LanguageMenu`'s own rule, and for its reason: with two on
	 *  screen a first-match Enter picks one for reasons the reader cannot see. */
	function onFilterKeydown(event: KeyboardEvent) {
		menu.onPanelKeydown(event);
		if (event.key !== 'Enter' || matches.length !== 1) return;
		event.preventDefault();
		choose(matches[0].code);
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
		     a box, a row and several grids, so `role="menu"` cannot sit on a
		     single list. It goes on each list instead. -->
		<div class="panel-surface menu-panel calendar-panel" use:keepInViewport>
			<input
				type="search"
				class="menu-filter"
				bind:this={filterEl}
				bind:value={query}
				onkeydown={onFilterKeydown}
				placeholder={t('calendar.filter')}
				aria-label={t('calendar.filter')}
			/>
			{#if !query.trim()}
				<ul class="menu-list" role="menu" aria-label={t('calendar.which.general')}>
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
								<span class="flag" aria-hidden="true">{GENERAL_MARK}</span>
								<span>{generalName}</span>
							</span>
						</button>
					</li>
				</ul>
			{/if}
			{#if matches.length === 0}
				<p class="menu-empty">{t('menu.noMatches')}</p>
			{:else}
				{#each filtered as region (region.id)}
					<p class="label-micro region-heading">{t(`calendar.region.${region.id}`)}</p>
					<ul
						class="flag-grid"
						role="menu"
						aria-label={t(`calendar.region.${region.id}`)}
						onkeydown={menu.onPanelKeydown}
					>
						{#each region.cells as cell (cell.code)}
							{@const isCurrent = value === cell.code}
							<li role="none">
								<button
									type="button"
									role="menuitemradio"
									aria-checked={isCurrent}
									class="flag-cell"
									class:current={isCurrent}
									aria-label={cell.name}
									title={cell.name}
									onclick={() => choose(cell.code)}
								>
									<span class="flag" aria-hidden="true">{cell.flag}</span>
								</button>
							</li>
						{/each}
					</ul>
				{/each}
			{/if}
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
		min-width: min(19rem, 90vw);
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

	/* The heading is the only thing separating one region's flags from the
	   next; a rule between them would be a second divider saying the same. */
	.region-heading {
		margin: 0.6rem 0 0.2rem;
		padding-inline: 0.4rem;
	}

	.flag-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(2.5rem, 1fr));
		gap: 0.15rem;
		margin: 0;
		padding: 0;
		list-style: none;
	}

	/*
	 * A SQUARE, sized for the two-letter fallback rather than for the flag.
	 * Where the flags draw, 1.5rem of emoji sits comfortably inside 2.4rem;
	 * where they do not, the cell holds "BR" at the same size without the grid
	 * changing shape between platforms.
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
