<!--
	UI language switch.

	Now a dropdown on the same `.menu`/`.menu-trigger`/`.menu-panel`
	primitives as SettingsMenu/EditionMenu, rather than the
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

	## Thirty-four languages, a search box, and a fold

	The list tripled on 2026-08-31 and the two-column grid that had absorbed
	fourteen did not absorb thirty-four: the panel became a scroller, which is
	the state the grid was introduced to end. The comment left here said the
	real answer was a filter box or grouping and that patching would not do.
	This is that answer, and it is both — a search box over every language, and
	a fold under which the rest wait behind "+ more". `menu-filter.ts` holds the
	two decisions in it that are not markup: what leads the list, and what the
	box reads.

	WHAT LEADS IT IS THE READER'S OWN LANGUAGES, from `navigator.languages`,
	in the order the reader put them in — the same list `app.html` negotiated
	the chrome out of before this component existed. Corpus weight fills the
	tier out below them. It used to BE the tier, which meant a Korean reader
	already reading Korean chrome had to open "+ more" to find Korean.

	The two halves cover for each other. The fold is a guess about which
	twelve of them a reader wants, and a guess is only tolerable where
	being wrong is cheap; the box is what makes it cheap, since a language
	below the fold is three keystrokes away rather than a scroll and a hunt.
	Typing therefore searches ALL of them and ignores the fold entirely —
	a filtered list that silently omitted matches would be the one failure
	neither half could recover from.
-->
<script lang="ts">
	import { i18n, t } from '$lib/i18n.svelte';
	import { navigatorUiLangs, type UiLang } from '$lib/ui-langs';
	import { listWorks } from '$lib/corpus';
	import { matchesQuery } from '$lib/highlight';
	import {
		langWeights,
		orderUiLangs,
		uiLangSearchText,
		UI_LANG_NAMES as NAMES
	} from '$lib/menu-filter';
	import Icon from './Icon.svelte';
	import { Menu } from './menu.svelte';
	import { keepInViewport } from '$lib/floating';

	const menu = new Menu();

	let query = $state('');
	let expanded = $state(false);
	let filterEl: HTMLInputElement | undefined = $state();

	// Neither of these changes under a running page, so both are read once
	// rather than per keystroke: the corpus moves when it is re-synced and a
	// deploy is what delivers that, and a browser's language list is a setting
	// the reader leaves the site to change.
	const weights = langWeights(listWorks());
	const browser = navigatorUiLangs();

	// ONE ORDER, whether folded, expanded or filtered. `primary` is what shows
	// before "+ more" and `rest` is the remainder, so concatenating them is the
	// sequence the panel always reads in — a filtered list that reordered
	// itself would make the box and the fold two different menus.
	const ordered = $derived(orderUiLangs(browser, weights, i18n.lang));

	// The haystack is rebuilt when the INTERFACE language changes, because one
	// of its three surfaces is the language's name as this reader reads it
	// (`Intl.DisplayNames`) — a Portuguese reader should find German by typing
	// "alemão". The other two, the code and the native name, are constant.
	const rowFor = (code: UiLang) => ({
		code,
		name: NAMES[code],
		haystack: uiLangSearchText(code, NAMES[code], i18n.lang)
	});
	const rows = $derived([...ordered.primary, ...ordered.rest].map(rowFor));

	// Typing searches everything; the fold applies only to an untouched box.
	// `expanded` is not consulted while filtering for the same reason: a
	// reader who has typed has already said what they are looking for, and
	// answering with a subset of the matches would be a lie the panel tells
	// silently.
	const visible = $derived(
		query.trim()
			? rows.filter((row) => matchesQuery(row.haystack, query))
			: expanded
				? rows
				: rows.slice(0, ordered.primary.length)
	);

	const hidden = $derived(rows.length - visible.length);
	const showMore = $derived(!query.trim() && !expanded && hidden > 0);

	const current = $derived(NAMES[i18n.lang]);
	const currentShort = $derived(i18n.lang.toUpperCase());

	// The box is what the panel is for at this size, so it takes focus on open
	// — a reader who already knows their language types three letters and is
	// done, and one who does not still sees the list under it.
	$effect(() => {
		if (menu.open) filterEl?.focus();
		else {
			query = '';
			expanded = false;
		}
	});

	// Awaited because `i18n.set` fetches the language's dictionary first (see
	// i18n.svelte.ts): the menu closes once the interface can actually be in
	// the language the reader picked, rather than closing onto English and
	// changing under them a moment later. The chunk is ~15 KB and usually
	// resolves within the click's own frame.
	async function choose(code: UiLang) {
		await i18n.set(code);
		menu.closeAndRefocus();
	}

	/**
	 * "+ more" hands focus back to the box, which is not a nicety.
	 *
	 * The button renders only while there is more to show, so taking it
	 * destroys it — and focus with it, to `<body>`, where neither the box's
	 * keydown handler nor the list's can see an Escape. The reader would then
	 * be in an open panel that only a click could close. Returning focus to
	 * the box restores that, and is where a reader who has just asked for
	 * twenty-two more languages most likely wants to be anyway.
	 *
	 * The self-destruction has a second consequence, and it is handled once
	 * for every menu in `menu.svelte.ts`: a detached element is contained by
	 * nothing, so the outside-click check read this as a click on the page and
	 * shut the panel it had just expanded.
	 */
	function expandAll() {
		expanded = true;
		filterEl?.focus();
	}

	/**
	 * Enter in the box takes the only row left, and does nothing when there is
	 * more than one.
	 *
	 * The reader has narrowed thirty-four to one and the only remaining act is
	 * to click it; asking for the click is asking them to move a hand they had
	 * already put on the keyboard. It is deliberately not "take the first
	 * match" — with two rows on screen a first-match Enter picks one of them
	 * for reasons the reader cannot see, which in a control that changes the
	 * whole interface is the wrong way to be wrong.
	 */
	function onFilterKeydown(event: KeyboardEvent) {
		// Composes, as `onPanelKeydown`'s own docblock promises: it acts on
		// Escape alone and leaves everything else to whatever runs after it.
		menu.onPanelKeydown(event);
		if (event.key !== 'Enter' || visible.length !== 1) return;
		event.preventDefault();
		choose(visible[0].code);
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
		aria-label={`${t('lang.label')}: ${current}`}
		title={t('lang.label')}
		onclick={menu.toggle}
	>
		{currentShort}
	</button>
	{#if menu.open}
		<!-- A `<div>`, not the `<ul>` the unfiltered panels are: an input is not
		     a list item, so `role="menu"` moves down onto the list. Escape is
		     handled on the box and on the list rather than on this wrapper,
		     which is where it would read as an interactive element with no
		     role — those two are the only things in here focus can be in. -->
		<div class="panel-surface menu-panel menu-panel-filtered lang-panel" use:keepInViewport>
			<!-- `type="search"` for the clear affordance browsers give it; the
			     accessible name is an `aria-label` because a visible label in a
			     panel this size would only repeat the placeholder. -->
			<input
				type="search"
				class="menu-filter"
				bind:this={filterEl}
				bind:value={query}
				onkeydown={onFilterKeydown}
				placeholder={t('lang.filter')}
				aria-label={t('lang.filter')}
			/>
			{#if visible.length === 0}
				<p class="menu-empty">{t('menu.noMatches')}</p>
			{:else}
				<ul
					class="menu-list lang-list"
					role="menu"
					aria-label={t('lang.label')}
					onkeydown={menu.onPanelKeydown}
				>
					{#each visible as row (row.code)}
						{@const isCurrent = i18n.lang === row.code}
						<li role="none">
							<button
								type="button"
								role="menuitemradio"
								aria-checked={isCurrent}
								class="menu-item"
								class:current={isCurrent}
								onclick={() => choose(row.code)}
							>
								<span class="menu-item-main">
									<span class="check-slot"
										>{#if isCurrent}<Icon name="check" />{/if}</span
									>
									<span lang={row.code}>{row.name}</span>
								</span>
							</button>
						</li>
					{/each}
				</ul>
			{/if}
			{#if showMore}
				<button type="button" class="menu-more" onclick={expandAll}>
					+ {t('lang.more')} ({hidden})
				</button>
			{/if}
		</div>
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

	.lang-panel {
		min-width: min(18.5rem, 90vw);
	}

	/*
	 * TWO COLUMNS, BECAUSE THIS MENU IS A NAME LIST AND THE OTHERS ARE NOT.
	 *
	 * The shared `.menu-panel` is a single column of rows, which is right for
	 * every other consumer: an edition row carries a title and a `.menu-item-meta`
	 * line under it, an appearance row is a setting with a state. Those are
	 * sentences, and sentences stack. A language row is a single word the
	 * reader is SCANNING for — they know which one they want and are looking
	 * for its shape, not reading down the list — and a scan is what a short
	 * two-column grid serves better than a long column.
	 *
	 * The count is what turned this from preference into a defect. Ten rows sat
	 * just inside the panel's `max-height: min(24rem, 70vh)`; fourteen do not,
	 * so the language a reader wants can be below the fold of a menu whose
	 * whole job is to be looked at once. Two columns absorbed fourteen.
	 *
	 * They did not absorb thirty-four, and that is what the fold above them is
	 * for rather than a third column: twelve names in two columns is six rows,
	 * which is the shape this grid was measured for in the first place. The
	 * grid still matters at the "+ more" size — thirty-four rows is a scroll
	 * either way, and half as tall a scroll is half the hunt.
	 *
	 * `auto-fit` rather than a hard `repeat(2, …)`: the panel is capped at
	 * `90vw`, so on a narrow phone there is not room for two columns of names,
	 * and the grid drops to one on its own rather than crushing "Slovenščina"
	 * into six characters and an ellipsis. The panel's `min-width` is
	 * `min(…, 90vw)` for the same reason — a bare `18.5rem` would win over the
	 * shared `max-width` (min beats max in CSS) and hang the panel off the side
	 * of a 320px screen.
	 */
	.lang-list {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(8rem, 1fr));
		gap: 0.1rem;
		align-content: start;
	}

	/*
	 * The tick is a column, not a prefix. In one column an indented current
	 * row reads as emphasis; in a grid the labels form two vertical edges, and
	 * one row starting 1.3rem further in breaks both of them. So the slot is
	 * always there and only sometimes filled — `aria-checked` on the button is
	 * what actually carries the state, and the glyph is decorative (Icon
	 * enforces `aria-hidden`), so an empty box says nothing to a screen reader
	 * that the row has not already said.
	 */
	.check-slot {
		display: inline-flex;
		justify-content: center;
		inline-size: 0.9em;
		flex: none;
	}
</style>
