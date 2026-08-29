<!--
	The keyboard shortcuts: one window listener, and the sheet that draws them.

	WHICH KEY MEANS WHAT IS NOT HERE — it is `$lib/shortcuts.ts`, because the
	`node` test environment cannot mount a component and logic left in a
	`.svelte` file is logic nothing checks. This file is the half that has to
	touch the DOM: finding the links and the numbers, and moving focus.

	## The two actions

	BETWEEN DOCUMENTS is `rel="prev"`/`rel="next"`, which `UnitNav` already
	renders on every reading page that has a neighbour — Bible chapter, CCC
	paragraph, Compendium question, Summa question, prayer. So this costs no
	per-route registration, no context store and no props: the address is
	already in the markup, in the one element whose whole job is to name it.
	Following it with `.click()` rather than `goto()` is deliberate — it takes
	the same delegated router path the reader's own click takes, so there is
	one code path to reason about instead of two that have to stay in step.

	WITHIN A DOCUMENT is `.reference-number`, which is the one affordance all
	four readers share (CCC paragraphs, Compendium questions, document
	sections, Scripture verses, and compare mode's gutter). The step moves
	FOCUS rather than the URL, for three reasons that all point the same way:

	  - Only the Bible has in-page fragments. On `/catechismus/caput/{n}` and
	    `/documenta/{slug}` the numbers link AWAY to the unit's own page, so
	    there is no hash to step and a hash-based cursor would work on one
	    route out of four.
	  - Stepping the hash through Psalm 119 is 176 history entries, and the
	    back button is how a reader returns from a cross-reference.
	  - The number is an `<a href>` whose plain click opens `AnchorMenu`
	    (copy, copy link, open, bookmark) — and that interception is why the
	    panel had no keyboard path at all before this. Focus plus Enter is now
	    the whole workflow.

	The scroll comes free: `styles/base.css` puts `scroll-padding-top` on the
	scrollport for the sticky reading bar, and focus-driven scroll-into-view
	honours it. Nothing here computes a header offset, and nothing should.

	## The sheet

	It DRAWS THE CLUSTERS rather than listing letters, because a row printing
	"W A S D" beside keycaps reading ص ش س ي teaches nothing. The shape is what
	a reader recognises, and `navigator.keyboard.getLayoutMap()` relabels it
	with their own keycaps where the browser has it. See `readKeycaps` for the
	one thing that must never happen to that reading.

	Two ways in, and the button is the load-bearing one: a shortcut nobody can
	find is dead code, and `?` is only discoverable to a reader who already
	suspects there is something to discover. The header trigger is what makes
	the eight keys findable at all.

	It is the fourth dialog on the site and wears the shell and sheet chrome
	the other three share (`.dialog-bare`, `.sheet`, `.sheet-*` in
	`styles/menus.css`); only the clusters below are its own.
-->
<script lang="ts">
	import { tick } from 'svelte';
	import Icon from './Icon.svelte';
	import type { IconName } from './Icon.svelte';
	import { i18n, t } from '$lib/i18n.svelte';
	import {
		REFERENCE_LINE,
		indexAtReferenceLine,
		isOverlayOpen,
		isTypingTarget,
		neighbourIndex,
		resolveShortcut,
		type ShortcutAction
	} from '$lib/shortcuts';

	/**
	 * One keycap: the letter it prints on a Latin layout, the direction it
	 * moves, and which axis that puts it on.
	 *
	 * The ARROW IS THE KEY'S OWN DIRECTION, not the action's, and under a
	 * right-to-left interface those differ: `KeyA` still points left, and left
	 * is where `UnitNav` puts *next* in Arabic. That is the honest drawing —
	 * the keycap says where the key sits, the legend says what the axis does,
	 * and the arrows on the page itself are what say which way "back" is.
	 */
	const KEYS: Record<string, { letter: string; arrow: IconName; axis: 'x' | 'y' }> = {
		KeyW: { letter: 'W', arrow: 'arrow-up', axis: 'y' },
		KeyA: { letter: 'A', arrow: 'arrow-left', axis: 'x' },
		KeyS: { letter: 'S', arrow: 'arrow-down', axis: 'y' },
		KeyD: { letter: 'D', arrow: 'arrow-right', axis: 'x' },
		KeyH: { letter: 'H', arrow: 'arrow-left', axis: 'x' },
		KeyJ: { letter: 'J', arrow: 'arrow-down', axis: 'y' },
		KeyK: { letter: 'K', arrow: 'arrow-up', axis: 'y' },
		KeyL: { letter: 'L', arrow: 'arrow-right', axis: 'x' }
	};

	/** The two clusters, as their physical shapes. `null` is an empty cell:
	 *  W sits above S with A and D beside it, which is the shape the reader
	 *  recognises and the reason this is a grid rather than a list. */
	const CLUSTERS: { name: string; columns: number; cells: (string | null)[] }[] = [
		{ name: 'wasd', columns: 3, cells: [null, 'KeyW', null, 'KeyA', 'KeyS', 'KeyD'] },
		{ name: 'hjkl', columns: 4, cells: ['KeyH', 'KeyJ', 'KeyK', 'KeyL'] }
	];

	let helpOpen = $state(false);
	let helpDialog: HTMLDialogElement | undefined = $state();

	/** Per-code keycap characters for this reader's layout, empty until the
	 *  sheet is opened and empty forever in browsers without the API. */
	let keycaps = $state(new Map<string, string>());

	function onWindowKeydown(e: KeyboardEvent) {
		const action = resolveShortcut(
			{
				code: e.code,
				key: e.key,
				ctrlKey: e.ctrlKey,
				metaKey: e.metaKey,
				altKey: e.altKey,
				isComposing: e.isComposing
			},
			{
				typing: isTypingTarget(e.target),
				overlay: isOverlayOpen(document),
				rtl: i18n.rtl
			}
		);
		if (!action) return;
		// Only on success, so a horizontal arrow at the last chapter still
		// scrolls a wide table the way it would have.
		if (run(action)) e.preventDefault();
	}

	function run(action: ShortcutAction): boolean {
		switch (action) {
			case 'help':
				void openHelp();
				return true;
			case 'previousDocument':
				return stepDocument('prev');
			case 'nextDocument':
				return stepDocument('next');
			case 'previousReference':
				return stepReference(-1);
			case 'nextReference':
				return stepReference(1);
		}
	}

	/**
	 * `rel` is a token list, hence `~=`. The Bible's chapter route renders
	 * `UnitNav` twice — once in each of its two layouts — so this can match
	 * two elements; they carry the same href by construction, and taking the
	 * first is therefore not a choice between them.
	 */
	function stepDocument(rel: 'prev' | 'next'): boolean {
		const link = document.querySelector<HTMLAnchorElement>(`a[rel~="${rel}"]`);
		if (!link) return false;
		link.click();
		return true;
	}

	/**
	 * Move the cursor one reference number along.
	 *
	 * A PAGE WITH FEWER THAN TWO NUMBERS FALLS THROUGH to the horizontal axis.
	 * `/catechismus/{n}`, `/catechismus/compendium/{n}`, `/doctores/summa/{part}/{q}`
	 * and `/preces/{slug}` each render exactly one, so "the next reference"
	 * and "the next document" are the same movement there. Sending it on means
	 * the pair always steps, at whatever granularity the page has, and the
	 * reader never has to know which kind of page they are on.
	 */
	function stepReference(delta: 1 | -1): boolean {
		const nodes = Array.from(document.querySelectorAll<HTMLAnchorElement>('a.reference-number'));
		if (nodes.length < 2) return stepDocument(delta === 1 ? 'next' : 'prev');

		const current = nodes.indexOf(document.activeElement as HTMLAnchorElement);
		const target =
			current >= 0
				? neighbourIndex(current, delta, nodes.length)
				: indexAtReferenceLine(
						// Measured only on the first step, when there is no cursor to
						// move from and the answer has to come from the viewport.
						nodes.map((node) => node.getBoundingClientRect().top),
						window.innerHeight * REFERENCE_LINE,
						delta
					);
		if (target === null) return false;
		nodes[target].focus();
		return true;
	}

	/**
	 * Relabel the drawn clusters with this reader's own keycaps.
	 *
	 * THE READING MUST NEVER LEAVE THE PAGE. A keyboard layout is a
	 * fingerprinting surface, and this site's measurement is a fixed
	 * vocabulary of coarse buckets with no identifier in it
	 * (`usage-schema.ts`, and the promise `colophon.pointNoTracking` makes).
	 * It is read to draw a diagram and nothing else; it does not go near a
	 * beacon.
	 *
	 * Chromium only, and a secure context — hence the fallback letters in
	 * `KEYS` rather than an empty keycap, and the silent catch: a reader whose
	 * browser cannot answer gets the Latin shape, which is what they would
	 * have had anyway.
	 */
	async function readKeycaps() {
		try {
			const kb = (
				navigator as Navigator & {
					keyboard?: { getLayoutMap?: () => Promise<Map<string, string>> };
				}
			).keyboard;
			if (!kb?.getLayoutMap) return;
			const layout = await kb.getLayoutMap();
			const next = new Map<string, string>();
			for (const code of Object.keys(KEYS)) {
				const cap = layout.get(code);
				if (cap) next.set(code, cap.toUpperCase());
			}
			keycaps = next;
		} catch {
			// Layout unknown. The Latin letters stand.
		}
	}

	/** `await tick()` before `showModal()`, as the other three dialogs do: the
	 *  panel is behind `{#if helpOpen}` and has to exist to be shown. */
	async function openHelp() {
		if (helpDialog?.open) return;
		helpOpen = true;
		void readKeycaps();
		await tick();
		helpDialog?.showModal();
	}

	/** A click on the dimmed surround arrives with the transparent `<dialog>`
	 *  as its target, the panel inside carrying all the padding. */
	function onDialogClick(e: MouseEvent) {
		if (e.target === helpDialog) helpDialog.close();
	}

	const cap = (code: string) => keycaps.get(code) ?? KEYS[code].letter;
</script>

<svelte:window onkeydown={onWindowKeydown} />

<!--
	THE BUTTON PRINTS THE KEY, not a keyboard glyph, because the two are the
	same control and naming it twice would teach the reader two things to
	remember instead of one. It is also what replaced the `/` hint `JumpBox`
	used to carry in the header: one control saying which key opens it was a
	convention the row could only afford once, and it is worth more on the
	shortcut sheet — `/` announced a key for a control the reader can already
	see and click, where `?` is the only visible way to the ones they cannot.

	Hidden below 640px on `JumpBox`'s reasoning and at its breakpoint: there is
	no physical keyboard to press any of this on, and a sheet describing eight
	keys is worse than no sheet at all on a phone.
-->
<button
	type="button"
	class="menu-trigger shortcuts-trigger"
	aria-haspopup="dialog"
	aria-expanded={helpOpen}
	aria-label={t('shortcuts.title')}
	title={t('shortcuts.title')}
	onclick={openHelp}
>
	<span aria-hidden="true">?</span>
</button>

<dialog
	bind:this={helpDialog}
	class="dialog-bare sheet"
	aria-label={t('shortcuts.title')}
	onclose={() => (helpOpen = false)}
	onclick={onDialogClick}
>
	{#if helpOpen}
		<div class="sheet-panel">
			<div class="sheet-head">
				<h2 class="sheet-title">{t('shortcuts.title')}</h2>
				<button
					type="button"
					class="sheet-close"
					aria-label={t('ui.close')}
					title={t('ui.close')}
					onclick={() => helpDialog?.close()}
				>
					<Icon name="x" />
				</button>
			</div>
			<div class="sheet-body shortcuts-body">
				<!--
					`aria-hidden`: the clusters are a picture of a keyboard, and
					read aloud they are eight letters and eight arrows in an order
					that means nothing. The list below carries the same content as
					sentences, which is what a screen reader should get — and is
					the reason it repeats the letters rather than only illustrating
					them.
				-->
				<div class="clusters" aria-hidden="true">
					{#each CLUSTERS as cluster (cluster.name)}
						<div class="cluster" style="--columns: {cluster.columns}">
							{#each cluster.cells as code, i (i)}
								{#if code}
									<kbd class="key axis-{KEYS[code].axis}">
										<span class="cap">{cap(code)}</span>
										<Icon name={KEYS[code].arrow} class="key-arrow" />
									</kbd>
								{:else}
									<span class="key-gap"></span>
								{/if}
							{/each}
						</div>
					{/each}
				</div>

				<dl class="legend">
					<dt><span class="swatch axis-x"></span>{t('shortcuts.betweenDocuments')}</dt>
					<dd>A · D &nbsp; H · L</dd>
					<dt><span class="swatch axis-y"></span>{t('shortcuts.withinDocument')}</dt>
					<dd>W · S &nbsp; K · J</dd>
				</dl>

				<ul class="others">
					<li>
						<span class="keys">
							<kbd class="key plain"><Icon name="arrow-left" class="key-arrow" /></kbd>
							<kbd class="key plain"><Icon name="arrow-right" class="key-arrow" /></kbd>
						</span>
						<span>{t('shortcuts.betweenDocuments')}</span>
					</li>
					<li>
						<span class="keys">
							<kbd class="key plain"><Icon name="arrow-up" class="key-arrow" /></kbd>
							<kbd class="key plain"><Icon name="arrow-down" class="key-arrow" /></kbd>
						</span>
						<span>{t('shortcuts.withinDocument')}</span>
					</li>
					<li>
						<span class="keys">
							<kbd class="key plain"><span class="cap">/</span></kbd>
							<kbd class="key plain wide"><span class="cap">Ctrl K</span></kbd>
						</span>
						<span>{t('jumpbox.short')}</span>
					</li>
					<li>
						<span class="keys">
							<kbd class="key plain"><span class="cap">?</span></kbd>
						</span>
						<span>{t('shortcuts.show')}</span>
					</li>
				</ul>
			</div>
		</div>
	{/if}
</dialog>

<style>
	/*
	 * `?` is a character where the row's other controls are icons, so it has to
	 * be sized rather than inherited: `.menu-trigger` centres a 1.25rem drawing,
	 * and a glyph at the body size sits smaller and lower than the marks beside
	 * it. `line-height: 1` is what stops the descender space from pushing it off
	 * the row's optical centre.
	 */
	.shortcuts-trigger span {
		font-family: var(--font-sans);
		font-size: 1rem;
		font-weight: 650;
		line-height: 1;
	}

	@media (max-width: 640px) {
		.shortcuts-trigger {
			display: none;
		}
	}

	.shortcuts-body {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}

	/*
	 * The clusters read left-to-right in every interface language, RTL
	 * included: a keyboard is a physical object, and the W key does not move
	 * to the other side of it in Arabic. `direction: ltr` is the narrow,
	 * correct exception to a stylesheet that is otherwise entirely logical.
	 */
	.clusters {
		direction: ltr;
		display: flex;
		flex-wrap: wrap;
		gap: 1.75rem;
		justify-content: center;
	}

	.cluster {
		display: grid;
		grid-template-columns: repeat(var(--columns), 2.75rem);
		gap: 0.3rem;
	}

	.key {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 0.1rem;
		aspect-ratio: 1;
		padding: 0.3rem;
		border: 1px solid var(--color-border);
		border-radius: 0.35rem;
		background: var(--color-bg);
		font-family: var(--font-sans);
		line-height: 1;
		/* The keycap's depth, and the one place a shadow says something: it is
		   what makes eight boxes read as keys rather than as table cells. */
		box-shadow: 0 1px 0 var(--color-border);
	}

	.cap {
		font-size: 0.85rem;
		font-weight: 650;
	}

	.key :global(.key-arrow) {
		width: 0.7rem;
		height: 0.7rem;
		opacity: 0.75;
	}

	/*
	 * Colour is the SECOND cue, never the only one: the arrow inside each
	 * keycap already says which axis it is on, so the two accents are
	 * reinforcement for readers who see them and cost nothing to readers who
	 * do not — including the ones on `--mono`.
	 */
	.axis-x {
		color: var(--color-accent);
		border-color: color-mix(in srgb, var(--color-accent) 45%, var(--color-border));
	}

	.axis-y {
		color: var(--color-apparatus);
		border-color: color-mix(in srgb, var(--color-apparatus) 45%, var(--color-border));
	}

	.key.plain {
		color: var(--color-apparatus);
		aspect-ratio: auto;
		min-width: 2rem;
		height: 2rem;
	}

	.key.wide {
		padding-inline: 0.5rem;
	}

	.legend {
		display: grid;
		grid-template-columns: auto 1fr;
		align-items: baseline;
		gap: 0.4rem 1rem;
		margin: 0;
		font-size: 0.9rem;
	}

	.legend dt {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.legend dd {
		margin: 0;
		color: var(--color-apparatus);
		font-family: var(--font-sans);
		font-size: 0.85rem;
		/* The cluster names, like the clusters themselves, are not a sentence. */
		direction: ltr;
		text-align: start;
	}

	.swatch {
		width: 0.7rem;
		height: 0.7rem;
		border-radius: 0.2rem;
		background: currentColor;
	}

	.others {
		display: flex;
		flex-direction: column;
		gap: 0.6rem;
		margin: 0;
		padding: 0;
		list-style: none;
		font-size: 0.9rem;
	}

	.others li {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}

	.keys {
		display: flex;
		gap: 0.3rem;
		/* Latin key names in a right-to-left sentence, for the same reason the
		   clusters are: `Ctrl K` is a label printed on a keyboard. */
		direction: ltr;
	}
</style>
