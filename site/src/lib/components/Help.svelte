<!--
	The help sheet: what the controls on this page do, and the keys that move
	the reader through a text. One window listener, one dialog.

	WHICH KEY MEANS WHAT IS NOT HERE — it is `$lib/shortcuts.ts`, because the
	`node` test environment cannot mount a component and logic left in a
	`.svelte` file is logic nothing checks. Neither is the guide: `$lib/help.ts`
	holds the rows and their order. This file is the half that has to touch the
	DOM — finding the links, the numbers and the controls, and moving focus.

	## IT ANSWERS FOR THE PAGE IN FRONT OF THE READER (2026-09-07)

	The chrome guide was a section of `/schola` until this sheet took it. A
	guide printed on a page of its own describes controls the reader cannot see
	while they read it, and it told a reader on a landing page what the compare
	button does — a button that page correctly does not have. Here the rows are
	read WITH the controls they name, so the sheet draws only the ones that are
	on this page.

	IT ASKS THE PAGE, AND THE PAGE ANSWERS IN THE MARKUP. Each control carries
	`data-help="<key>"`, this collects them, and `helpFor` turns that set into
	rows — no per-route registration, no context store, no list of selectors
	here to keep in step with eight components. It is the same bargain
	`stepDocument` strikes with `rel="prev"`: the address is already in the
	markup, in the element whose job is to be that control.

	VISIBLE IS NOT PRESENT, and `checkVisibility` is why the reading of the
	attributes is done at open time rather than once. The table of contents is
	a sidebar above 80rem and a panel in the reading bar below it — both are in
	the DOM at every width, and CSS decides which one the reader has. The same
	reading is what empties the sheet in focus mode: `zen.css` hides the chrome
	with `visibility`, so the mode that took the controls away also takes away
	the rows describing them, leaving the toggle that puts them back and the
	`Esc` row below.

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

	THE SCROLL DOES NOT COME FREE, and the version that assumed it did was the
	worst part of this: focus scrolls with `nearest` semantics, so the step
	moved the page by the minimum and left the number it had just reached
	pinned to the edge it entered from. Focus now moves with `preventScroll`
	and the page is scrolled here instead, to put the number on the reference
	line — `scrollTopForReference` in `$lib/shortcuts.ts` argues the geometry,
	including why a third of the way down the viewport still means nothing
	here computes a header offset, and nothing should.

	## The sheet

	THE KEYS DRAW THEIR CLUSTERS rather than listing letters, because a row
	printing "W A S D" beside keycaps reading ص ش س ي teaches nothing. The
	shape is what a reader recognises, and `navigator.keyboard.getLayoutMap()`
	relabels it with their own keycaps where the browser has it. See
	`readKeycaps` for the one thing that must never happen to that reading.

	THE TRIGGER IS NOW ON EVERY WIDTH, and the keyboard half is what the
	breakpoint hides instead. It was the sheet itself that stopped at 640px, on
	the argument that a phone has no keyboard to press eight keys on — sound
	while the sheet was only keys, and wrong the moment it became the only
	place the chrome is explained. A phone reader is the one with the least
	room for a control to explain itself in place. So the button stays, the
	clusters and the key rows go below 641px, and `.controls` wraps for the one
	more square this costs the narrowest header.

	It is the fourth dialog on the site and wears the shell and sheet chrome
	the other three share (`.dialog-bare`, `.sheet`, `.sheet-*` in
	`styles/menus.css`); the guide's rows and the clusters below are its own.
-->
<script lang="ts">
	import { tick } from 'svelte';
	import { springScrollTo } from '$lib/smooth-scroll';
	import Icon from './Icon.svelte';
	import type { IconName } from './Icon.svelte';
	import { i18n, t } from '$lib/i18n.svelte';
	import { helpFor, type HelpSheet } from '$lib/help';
	import {
		REFERENCE_LINE,
		indexAtReferenceLine,
		isOverlayOpen,
		isTypingTarget,
		neighbourIndex,
		resolveShortcut,
		scrollTopForReference,
		type ShortcutAction
	} from '$lib/shortcuts';
	import { zen } from '$lib/zen.svelte';

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

	/** The guide for the page the sheet was opened on, read off the markup —
	 *  empty until then, and read again on every open because which controls
	 *  a page shows changes with the route, the width and focus mode. */
	let guide: HelpSheet = $state({ sections: [], groups: [] });

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
				rtl: i18n.rtl,
				zen: zen.on
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
			case 'exitZen':
				// Unconditionally true: the resolver only answers this while the
				// mode is on, so there is no "nothing to do" case to hand the
				// key back for.
				zen.set(false);
				return true;
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
		// `preventScroll` and then our own scroll, never the browser's: see
		// `scrollTopForReference` for what `nearest` does to a run of steps.
		nodes[target].focus({ preventScroll: true });
		// An absolute document position rather than a delta, which is what makes
		// a held-down key correct: each keystroke re-measures against wherever
		// the page has got to and retargets, instead of adding a delta to a
		// position the animation has already left behind. `springScrollTo` is
		// what makes the retarget smooth rather than a restart — see
		// `$lib/smooth-scroll`, which owns the reduced-motion case too.
		springScrollTo(
			scrollTopForReference(
				nodes[target].getBoundingClientRect().top,
				window.scrollY,
				window.innerHeight
			)
		);
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

	/**
	 * Which controls this page is showing, by their own account.
	 *
	 * PRESENT IN THE MARKUP IS NOT THE QUESTION, which is why every hit is put
	 * through `checkVisibility`: the table of contents is a sidebar above 80rem
	 * and a panel in the reading bar below it, and both are in the document at
	 * every width — `layout.css` hands one to the reader and takes the other
	 * away. The same reading answers focus mode, where `zen.css` hides the
	 * chrome with `visibility` rather than removing it.
	 *
	 * `contentVisibilityAuto` and the two property flags are all three of the
	 * ways this page hides something; a browser without the method is told
	 * everything it holds is shown, which is the state of things before any of
	 * this was asked.
	 */
	function present(): Set<string> {
		const keys = new Set<string>();
		for (const el of document.querySelectorAll<HTMLElement>('[data-help]')) {
			const key = el.dataset.help;
			if (!key) continue;
			const shown =
				typeof el.checkVisibility === 'function'
					? el.checkVisibility({
							contentVisibilityAuto: true,
							opacityProperty: true,
							visibilityProperty: true
						})
					: true;
			if (shown) keys.add(key);
		}
		return keys;
	}

	/** `await tick()` before `showModal()`, as the other three dialogs do: the
	 *  panel is behind `{#if helpOpen}` and has to exist to be shown. The page
	 *  is read BEFORE the dialog opens, while it is still the page — an open
	 *  modal is the only thing on the screen, and the sheet's own rows are
	 *  markup this scan would otherwise have to be taught to skip. */
	async function openHelp() {
		if (helpDialog?.open) return;
		guide = helpFor(present());
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
	THE BUTTON PRINTS THE KEY, not a keyboard glyph or the word it is now named
	by. `?` is the key that opens it and the mark every interface has agreed
	means help, and the two being one control is the reason it says one thing.
	It is also what replaced the `/` hint `JumpBox` used to carry in the
	header: one control naming its own key was a convention the row could only
	afford once, and it is worth more here — `/` announced a key for a control
	the reader can already see and click, where `?` is the only visible way to
	the ones they cannot.

	ON EVERY WIDTH, where it stopped at 640px until 2026-09-07. See the
	docblock: the sheet is the site's only guide to its own chrome now, and the
	reader with the least room to work it out from the page is the one on a
	phone. The keys are what the breakpoint hides.
-->
<button
	type="button"
	class="menu-trigger help-trigger"
	aria-haspopup="dialog"
	aria-expanded={helpOpen}
	aria-label={t('help.title')}
	title={t('help.title')}
	onclick={openHelp}
>
	<span aria-hidden="true">?</span>
</button>

<dialog
	bind:this={helpDialog}
	class="dialog-bare sheet help-dialog"
	aria-label={t('help.title')}
	onclose={() => (helpOpen = false)}
	onclick={onDialogClick}
>
	{#if helpOpen}
		<div class="sheet-panel">
			<div class="sheet-head">
				<h2 class="sheet-title">{t('help.title')}</h2>
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
			<div class="sheet-body help-body">
				<!--
					A SECTION PER CONTROL THAT IS NOT A ROW, headed by the control's
					own label rather than by the bar it stands on — `$lib/help.ts`
					says which controls those are and why. A sentence is the whole
					of one: the jump box carried a syntax table here until its own
					panel grew a legend that teaches the same notation with the
					field in front of the reader.
				-->
				{#each guide.sections as section (section.key)}
					<section class="section">
						<h3 class="group">{t(section.nameKey)}</h3>
						<div class="feature">
							<span class="feature-icon"><Icon name={section.icon} /></span>
							<div class="feature-text">
								<p>{t(`help.feature.${section.key}`)}</p>
							</div>
						</div>
					</section>
				{/each}

				<!--
					ONE SECTION PER BAR, and a bar with nothing on this page is not
					drawn at all — `helpFor` has already dropped it, heading and
					all, which on a landing page is the whole of this list. The
					heading is what says WHERE the controls under it are, which is
					the half of the sentence a guide that only names a control has
					not finished.

					`h3` under the sheet's own `h2`, and `h4` for a control: a
					heading tree that skips a level is one a screen reader reads as
					a mistake.
				-->
				{#each guide.groups as group (group.headingKey)}
					<section class="section">
						<h3 class="group">{t(group.headingKey)}</h3>
						<ul class="feature-grid">
							{#each group.features as feature (feature.key)}
								<li class="feature">
									<!-- Decorative, so `aria-hidden` — which `Icon.svelte`
									     enforces rather than offers. The name beside it is
									     the name, and it is the control's own. -->
									<span class="feature-icon"><Icon name={feature.icon} /></span>
									<div class="feature-text">
										<h4>{t(feature.nameKey)}</h4>
										<p>{t(`help.feature.${feature.key}`)}</p>
									</div>
								</li>
							{/each}
						</ul>
					</section>
				{/each}

				<!--
					THE KEYS, AND THE ONE SECTION A WIDTH CAN TAKE AWAY. `.keyboard` is
					`display: none` below 641px (see the style block): a phone has
					no keyboard to press any of this on, and eight keycaps drawn
					for nobody push the rows that DO apply off the first screen.
				-->
				<section class="section keyboard">
					<h3 class="group">{t('shortcuts.title')}</h3>
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

					<!-- The `<div>` around each pair is what the grid lays out: a
					     `<dl>` in columns without it puts a term in one cell and its
					     definition in the next, so two axes read as four things.
					     HTML's own grouping element for exactly this. -->
					<dl class="legend">
						<div>
							<dt><span class="swatch axis-x"></span>{t('shortcuts.betweenDocuments')}</dt>
							<dd>A · D &nbsp; H · L</dd>
						</div>
						<div>
							<dt><span class="swatch axis-y"></span>{t('shortcuts.withinDocument')}</dt>
							<dd>W · S &nbsp; K · J</dd>
						</div>
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
						<!--
						ONLY WHILE THE MODE IS ON, unlike the four rows above it.
						`Escape` is the one binding here that is conditional (see
						`ShortcutContext.zen`), and a reference sheet listing a key
						that currently does nothing teaches the reader something
						untrue. Shown, it is the answer to the question a reader in
						focus mode opens this sheet to ask.
					-->
						{#if zen.on}
							<li>
								<span class="keys">
									<kbd class="key plain wide"><span class="cap">Esc</span></kbd>
								</span>
								<span>{t('zen.exit')}</span>
							</li>
						{/if}
					</ul>
				</section>
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
	.help-trigger span {
		font-family: var(--font-sans);
		font-size: 1rem;
		font-weight: 650;
		line-height: 1;
	}

	/*
	 * A CENTERED CARD, not the full-bleed sheet the shared chrome defaults to.
	 * `TocMenu` makes the same departure and its style block explains the
	 * mechanics; the difference here is that this panel anchors to nothing —
	 * it answers a question about the whole page rather than standing in for a
	 * sidebar — so it centres rather than tracking its trigger.
	 *
	 * `641px` is where every width decision in this file is made, and the same
	 * one `zen.css` and `ZenToggle` use: below it the sheet is full-bleed and
	 * the keyboard section is not drawn, above it the sheet is a card and the
	 * keys are in it. Written in px rather than rem so that a non-default root
	 * size cannot leave a band where the card is centred and the keys it was
	 * sized for are gone.
	 *
	 * THE CENTERING IS THE `<dialog>` UA RULE PUT BACK. A dialog is centred by
	 * default through `inset: 0; margin: auto` over a `fit-content` size, and
	 * `.sheet` overrides all three to fill the viewport. Restoring them is what
	 * centres it — `margin: auto` alone would not, because an abs-positioned
	 * box with `top`/`bottom` resolved and `block-size: auto` stretches instead,
	 * and its auto margins then compute to zero.
	 *
	 * `max-block-size` bounds the flex column so `.sheet-body` still scrolls
	 * rather than growing past the viewport — see the note on `.sheet` in
	 * `styles/menus.css`, which is why the column starts on the dialog and not
	 * on the panel. `overflow: hidden` is what makes the panel's square corners
	 * take the radius.
	 *
	 * No `!important`: a scoped selector compiles to
	 * `.help-dialog.svelte-hash`, which outranks the global single class.
	 */
	@media (min-width: 641px) {
		.help-dialog {
			inset: 0;
			margin: auto;
			inline-size: min(46rem, calc(100vw - 3rem));
			block-size: fit-content;
			max-block-size: min(56rem, 88vh);
			border: 1px solid var(--color-border);
			border-radius: var(--radius-lg);
			box-shadow: var(--shadow-panel);
			overflow: hidden;
		}
	}

	.help-body {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}

	/*
	 * A GROUP INSIDE THE SHEET: which bar the controls under it are on, or that
	 * the rows under it are keys. Serif, like every heading on the site, and
	 * muted — it names a place rather than saying anything.
	 */
	.group {
		font-family: var(--font-serif);
		font-size: 1rem;
		font-weight: 600;
		margin: 0 0 0.6rem;
		color: var(--color-text-muted);
	}

	/*
	 * THE ROWS ARE NOT CARDS, and `/schola` argues that at length: a bordered
	 * box per row says these are things to CHOOSE BETWEEN, and they are entries
	 * in a reference list read in sequence. A hairline above each row and the
	 * icon standing free in its own gutter is how a printed reference work sets
	 * one.
	 *
	 * TWO COLUMNS WHERE THE PANEL IS ITS FULL WIDTH, as `/schola` set the same
	 * rows. The card is at most 46rem, which it reaches at a viewport of about
	 * 49 — the query is 60rem so that the second column arrives when the panel
	 * has the room for it and not at the width where it merely stops growing.
	 * Below that a row's sentence would set to five or six words a line, which
	 * is a column of fragments rather than a list.
	 *
	 * `auto-fit` AND NOT `1fr 1fr`, because a group can be one row long: the
	 * header's list is a single row wherever the browser has not offered an
	 * install, and a fixed pair left it in the left half of the panel with an
	 * empty column beside it, which reads as a row whose neighbour failed to
	 * load. `auto-fit` collapses the empty track and the lone row takes the
	 * measure.
	 */
	.feature-grid {
		list-style: none;
		display: grid;
		gap: 0.5rem 1.25rem;
		margin: 0;
		padding: 0;
	}

	@media (min-width: 60rem) {
		.feature-grid {
			grid-template-columns: repeat(auto-fit, minmax(18rem, 1fr));
		}
	}

	.feature {
		display: flex;
		gap: 0.85rem;
		align-items: flex-start;
		padding: 0.6rem 0;
		border-block-start: 1px solid var(--color-border);
	}

	/* Sized once so glyphs of different natural weight sit on one line down the
	   list; `1em` of the size set here, which is `Icon.svelte`'s contract.
	   Nudged down by the cap height to sit on the title's optical centre. */
	.feature-icon {
		flex: 0 0 auto;
		display: grid;
		place-items: center;
		inline-size: 1.35rem;
		font-size: 1.2rem;
		line-height: 1;
		margin-block-start: 0.12rem;
		color: var(--color-accent);
	}

	.feature-text {
		flex: 1;
		min-width: 0;
	}

	/* The control's own name, in the face every heading on the site takes. */
	.feature h4 {
		font-family: var(--font-serif);
		font-size: 1rem;
		margin: 0 0 0.15rem;
	}

	.feature p {
		margin: 0;
		font-size: 0.85rem;
	}

	/* A SECTION'S OWN ROW carries no rule above it, where a group's rows are
	   ruled apart: the heading is already the line separating it from what came
	   before, and a hairline under a heading with one row beneath reads as an
	   empty table. Selected as the section's child, which a row in a group never
	   is — it is an `<li>` inside `.feature-grid`. */
	.section > .feature {
		padding-block-start: 0;
		border-block-start: 0;
	}

	/*
	 * THE KEYS ARE THE ONE SECTION A WIDTH TAKES AWAY. A phone has no keyboard
	 * to press eight keys on, and drawing them there would push the rows that
	 * do apply below the fold of a sheet that owns the whole viewport. The
	 * trigger and the guide are on every width; this is not.
	 */
	.keyboard {
		display: none;
	}

	@media (min-width: 641px) {
		.keyboard {
			display: flex;
			flex-direction: column;
			gap: 1.25rem;
		}
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
		margin: 0;
		font-size: 0.9rem;
	}

	/* Each axis is one cell: the swatch, the name, and the letters it is on.
	   The `<dt>`/`<dd>` pair stays the markup — this is a term and its
	   definition — and the grid above lays the PAIRS out, not their halves. */
	.legend div {
		display: flex;
		align-items: baseline;
		gap: 0.5rem;
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

	/*
	 * THE LEGEND AND THE KEY ROWS RUN IN COLUMNS, because each row is a pair of
	 * keycaps and three words: set one to a line they made a tall thin list
	 * under a wide picture of a keyboard, and pushed the `Esc` row — the one a
	 * reader in focus mode opened the sheet for — below the fold of the card.
	 * `auto-fit` so the count follows the panel rather than a number written
	 * here, and so a list of one row (which `zen.on` can make of neither, but
	 * the legend's pair could become) still takes the measure.
	 */
	.legend,
	.others {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(16rem, 1fr));
		gap: 0.5rem 1.25rem;
	}

	.others {
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
