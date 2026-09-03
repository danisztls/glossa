<!--
	The Advanced panel: the offline library, and the offline switch that
	decides what the library is for.

	WHY THE TWO ARE ONE PANEL. They were a fold inside `SettingsMenu`'s
	popover — a "+ Advanced" row that uncovered a switch and a link to a second
	dialog. Two problems, and the second is the one that mattered. The panel is
	~11rem wide, so a switch whose price is a whole sentence could only carry
	that sentence as a `title` nobody hovers on a phone. And the pair are one
	subject read in one order: the library is what you fill, offline mode is
	what you then live on. Splitting them across a popover and a dialog made
	the reader assemble that themselves, and the popover's width was why they
	were split.

	THE ORDER IS THE ARGUMENT. The library comes first because it is the
	prerequisite: offline mode turns downloads OFF, so a reader who meets the
	switch first flips it and then finds a library they can no longer fill.
	`library.offlineNote` is what that reader gets instead of six inert
	buttons.

	THE ROWS ARE WAVES, NOT WORKS, and the difference is worth knowing before
	changing it. A wave is every edition of a kind in the reader's language
	chain, so "Bible" may be two editions and 24 MB. `requestWork` and
	`assetsForWork` already exist for the finer grain a reader arguably thinks
	in ("the CPDV", "the Clementina"), and adding it means a second level in
	this list rather than anything new underneath. Waves first because they are
	the unit `planWaves` prices and orders, and the order IS the advice: it is
	descending value per byte.

	THE LIBRARY HALF IS GATED ON `serviceWorker.controlled` and the switch is
	not, because only one of them needs a worker: a Download button with no
	worker to receive the message is a button that silently does nothing
	(`sw.svelte.ts`'s `#post` returns on a null controller), while offline mode
	still stops the beacon and the update check on its own. `controlled` is
	false under `npm run dev`, which registers no worker at all, and on a first
	visit until the new worker claims the page.

	A `<dialog>` AND NOT A PANEL. Six rows, byte counts, a progress bar, a
	destructive action and a paragraph do not fit an 11rem popover, and this is
	not a place a reader passes through — they come to it, watch it, and leave.
	It wears the shell and sheet chrome every other dialog here wears
	(`.dialog-bare`, `.sheet`, `.sheet-*`), full-bleed on a phone and a centred
	card above 34rem, which is `TocMenu`'s arrangement for `TocMenu`'s reason: a
	screen with room to read around the panel should still show the page.

	IT IS NOT A ROUTE, deliberately. An address would mean `corpus-routes.json`,
	`isCanonicalPath`, the sitemap, `route-titles.json`, `assertNamed` and an
	`hreflang` cluster — the whole address grammar in `route-manifest.ts` — for
	a control surface with nothing to index and nothing to link to. `/signata`
	is a page because a reader's bookmarks are a place; a download queue is a
	button that took a while.

	MOUNTED IN THE ROOT LAYOUT, opened from `SettingsMenu` through
	`library.open`. It has to outlive its trigger: the popover closes the
	instant the row is used, and a dialog inside it would be unmounted
	mid-`showModal()`.

	MEASURED, NEVER ASSUMED. Every number here is read back from the content
	cache (`library.svelte.ts`), including after a download this page watched.
	The alternative — adding up what we just asked for — is how a panel comes
	to claim a library the device does not have.
-->
<script lang="ts">
	import { library } from '$lib/library.svelte';
	import { formatBytes } from '$lib/library';
	import { offline } from '$lib/offline.svelte';
	import { serviceWorker } from '$lib/sw.svelte';
	import { i18n, t } from '$lib/i18n.svelte';
	import type { WaveId } from '$lib/sw-policy';
	import Icon from './Icon.svelte';

	let dialogEl: HTMLDialogElement | undefined = $state();
	/**
	 * Which deletion is armed: one shelf, `'all'`, or nothing.
	 *
	 * ONE piece of state for every destructive control in the panel, so arming
	 * a second disarms the first — two buttons both sitting one click from
	 * firing is how a reader loses the wrong one. Every delete here is
	 * two-click for the same reason: what it destroys is re-downloadable, but
	 * a mis-tap costs 24 MB on the metered connection this panel exists for.
	 *
	 * Reset whenever the panel closes, so a confirmation cannot wait around
	 * from a previous visit and catch the next click.
	 */
	let armed = $state<WaveId | 'all' | undefined>(undefined);

	/**
	 * A wave's name, and five of the seven come from keys the translators have
	 * already written — the cheap way to add a surface, per CLAUDE.md. Only
	 * `essentials` (prayers, Compendium and the Bible introductions together)
	 * and `other` name something the interface had no word for.
	 *
	 * `neighbours` is here to satisfy the record and is never rendered:
	 * `libraryRows` drops it, because the chunk either side of the open page is
	 * a prefetch and not a shelf.
	 */
	const WAVE_LABEL: Record<WaveId, string> = {
		neighbours: 'library.essentials',
		essentials: 'library.essentials',
		catechism: 'nav.ccc',
		scripture: 'nav.bible',
		magisterium: 'nav.magisterium',
		summa: 'summa.landing.title',
		illustrations: 'library.illustrations',
		other: 'library.other'
	};

	/** Downloads are the one thing offline mode exists to stop, so the panel
	 *  says so rather than offering a button that would silently do nothing —
	 *  `sw.svelte.ts`'s `#send` returns early while the switch is on. */
	const blocked = $derived(offline.enabled);
	const running = $derived(serviceWorker.progress);

	/* Open and close follow the store, so the trigger in `SettingsMenu` can be
	   a one-line assignment. `showModal()` rather than `show()`: the panel
	   covers the screen on a phone, and an overlay a reader can tab out of
	   into text they cannot see is worse than no overlay. */
	$effect(() => {
		if (library.open && !dialogEl?.open) {
			dialogEl?.showModal();
			void library.refresh();
		} else if (!library.open && dialogEl?.open) {
			dialogEl.close();
		}
	});

	/* A finished fill re-measures, which is why `completed` is a counter: two
	   downloads in one session have to be two signals. Reading `rows` here
	   would be a loop — this depends on the count alone. */
	$effect(() => {
		serviceWorker.completed;
		if (library.open) void library.refresh();
	});

	function onClose() {
		library.open = false;
		armed = undefined;
	}

	/** First click arms, second fires. A third control's click disarms this
	 *  one on the way, because `armed` holds one target. */
	function confirm(target: WaveId | 'all', run: () => void) {
		if (armed !== target) {
			armed = target;
			return;
		}
		armed = undefined;
		run();
	}

	/** How far the running wave has got, as a percentage for the bar's width.
	 *  Guarded against a zero total, which would be `NaN` and render nothing. */
	function percentOf(done: number, total: number): number {
		if (total <= 0) return 0;
		return Math.min(100, Math.round((done / total) * 100));
	}
</script>

<!--
	Always in the markup, empty until opened — `showModal()` needs an element to
	call on, and a closed `<dialog>` is `display: none`, so nothing inside is
	reachable, focusable or announced meanwhile. No `role="dialog"` and no
	`aria-modal`: `showModal()` carries both.
-->
<dialog bind:this={dialogEl} class="dialog-bare sheet advanced-dialog" onclose={onClose}>
	{#if library.open}
		<div class="sheet-panel">
			<div class="sheet-head">
				<h2 class="sheet-title">{t('advanced.label')}</h2>
				<button
					type="button"
					class="sheet-close"
					aria-label={t('ui.close')}
					title={t('ui.close')}
					onclick={() => dialogEl?.close()}
				>
					<Icon name="x" />
				</button>
			</div>

			<div class="sheet-body">
				{#if serviceWorker.controlled}
					<section class="block">
						<h3 class="block-title label-micro">{t('library.title')}</h3>
						<p class="lede">{t('library.lede')}</p>
						{#if blocked}
							<p class="blocked">{t('library.offlineNote')}</p>
						{/if}

						<ul class="shelves">
							{#each library.rows as row (row.id)}
								{@const active = running?.wave === row.id}
								<li class="shelf">
									<div class="shelf-line">
										<span class="shelf-name">{t(WAVE_LABEL[row.id])}</span>
										<span class="shelf-size">
											{#if row.complete}
												{formatBytes(row.bytes, i18n.lang)}
											{:else if row.heldBytes > 0}
												<!-- "3.1 / 24.1 MB" — a reader part-way through wants
												     to know what is left, not what the whole shelf
												     weighs. -->
												{formatBytes(row.heldBytes, i18n.lang)} / {formatBytes(
													row.bytes,
													i18n.lang
												)}
											{:else}
												{formatBytes(row.bytes, i18n.lang)}
											{/if}
										</span>
										<!--
											TWO SLOTS, ALWAYS BOTH, so the sizes above stay in one
											column whatever a row's state is: take-it and drop-it
											are independent (a part-filled shelf offers both), and
											a cell that shrank when one was missing would step the
											column left on that row alone.
										-->
										<div class="actions">
											{#if row.complete}
												<!-- The words are visually hidden rather than a
												     `title`: a `title` beside inner text is announced
												     twice by some readers, and the check is the
												     visual half of the same statement, not a remark
												     about it. -->
												<span class="act held">
													<Icon name="check" />
													<span class="visually-hidden">{t('library.downloaded')}</span>
												</span>
											{:else}
												<!-- Icon-only, so the name is on the button. Both
												     `aria-label` and `title`: the first is the
												     accessible name, the second is what a pointer
												     user gets, and an icon with no text has no other
												     way to say which it is. -->
												<button
													type="button"
													class="act download"
													aria-label={t('library.download')}
													title={t('library.download')}
													disabled={blocked || !!running}
													onclick={() => library.download(row.id)}
												>
													<Icon name="download" />
												</button>
											{/if}

											{#if row.heldBytes > 0}
												{@const confirming = armed === row.id}
												<button
													type="button"
													class="act remove"
													class:confirming
													aria-label={confirming ? t('library.removeConfirm') : t('library.remove')}
													title={confirming ? t('library.removeConfirm') : t('library.remove')}
													disabled={!!running}
													onclick={() => confirm(row.id, () => void library.remove(row.id))}
												>
													<Icon name="trash-2" />
												</button>
											{:else}
												<span class="act" aria-hidden="true"></span>
											{/if}
										</div>
									</div>
									{#if active && running}
										<!-- The bar is the only place a byte count moves, so it is
										     `aria-live="off"`: a screen reader announcing every
										     progress message would talk over the page for the whole
										     download. The percentage is on the element instead, for
										     a reader who asks. -->
										<div
											class="bar"
											role="progressbar"
											aria-valuemin={0}
											aria-valuemax={100}
											aria-valuenow={percentOf(running.bytes, running.ofBytes)}
										>
											<div
												class="bar-fill"
												style:inline-size="{percentOf(running.bytes, running.ofBytes)}%"
											></div>
										</div>
									{/if}
								</li>
							{/each}
						</ul>

						{#if !library.measuring && library.rows.length > 0}
							<!--
								THE FOOT IS A ROW LIKE THE OTHERS, with the totals where a
								shelf's size goes and the same two slots at the end. That is
								what makes "everything" legible as one more thing to press
								rather than a different kind of control: same column, same
								icons, same two-click delete — one line lower and ruled off.
							-->
							<div class="shelf-line foot">
								<span class="shelf-name label-micro">{t('library.everything')}</span>
								<span class="shelf-size">
									{formatBytes(library.total.heldBytes, i18n.lang)} / {formatBytes(
										library.total.bytes,
										i18n.lang
									)}
								</span>
								<div class="actions">
									{#if library.total.complete}
										<span class="act held">
											<Icon name="check" />
											<span class="visually-hidden">{t('library.downloaded')}</span>
										</span>
									{:else}
										<button
											type="button"
											class="act download"
											aria-label={t('library.downloadAll')}
											title={t('library.downloadAll')}
											disabled={blocked || !!running}
											onclick={() => library.download('all')}
										>
											<Icon name="download" />
										</button>
									{/if}

									{#if library.total.heldBytes > 0}
										{@const confirming = armed === 'all'}
										<button
											type="button"
											class="act remove"
											class:confirming
											aria-label={confirming ? t('library.forgetConfirm') : t('library.forget')}
											title={confirming ? t('library.forgetConfirm') : t('library.forget')}
											disabled={!!running}
											onclick={() => confirm('all', () => void library.forget())}
										>
											<Icon name="trash-2" />
										</button>
									{:else}
										<span class="act" aria-hidden="true"></span>
									{/if}
								</div>
							</div>
						{/if}
					</section>
				{/if}

				<!--
					`role="switch"` and not the popover's `menuitemcheckbox`: the same
					control, but the container it is in is what decides how it is
					announced, and this one is a dialog rather than a menu.
				-->
				<section class="block">
					<div class="switch-line">
						<h3 class="block-title label-micro">{t('offline.label')}</h3>
						<button
							type="button"
							role="switch"
							aria-checked={offline.enabled}
							aria-label={t('offline.label')}
							class="switch-btn"
							onclick={() => offline.toggle()}
						>
							<span class="switch" class:on={offline.enabled}></span>
						</button>
					</div>
					<!-- The sentence the popover could only afford as a `title`, which
					     is the width this panel was opened to buy. -->
					<p class="lede">{t('offline.hint')}</p>
				</section>
			</div>
		</div>
	{/if}
</dialog>

<style>
	/* Two subjects, one panel: the rule is the only thing that says where one
	   ends. Nothing above the first block, so a device with no worker — where
	   the library half does not render — gets a panel with no stray line at
	   the top of it. */
	.block + .block {
		margin-block-start: 1.1rem;
		border-block-start: 1px solid var(--color-border);
		padding-block-start: 0.9rem;
	}

	.block-title {
		margin: 0 0 0.35rem;
		font-weight: 600;
	}

	.lede {
		margin: 0 0 0.9rem;
		font-size: 0.85rem;
		line-height: 1.5;
		color: var(--color-text-muted);
	}

	/* The last thing in its block is the sentence under the switch, and a
	   bottom margin there would be a gap the panel does not need. */
	.block:last-child .lede {
		margin-block-end: 0;
	}

	/* The switch sits at the end of its own title's row, which is `.shelf-line`
	   above rearranged: the name reads first and the control is where every
	   other control in this panel is, in a column down the trailing edge. */
	.switch-line {
		display: flex;
		align-items: center;
		gap: 0.6rem;
		margin-block-end: 0.35rem;
	}

	.switch-line .block-title {
		flex: 1;
		min-width: 0;
		margin: 0;
	}

	/* The one sentence that explains why a button is inert. Bordered rather
	   than merely coloured: it is a condition of the panel, not a remark about
	   a row. */
	.blocked {
		margin: 0 0 0.9rem;
		padding: 0.5rem 0.6rem;
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		font-size: 0.8rem;
		line-height: 1.4;
		color: var(--color-text-muted);
	}

	.shelves {
		list-style: none;
		margin: 0;
		padding: 0;
	}

	/* Positioned so the progress bar can hang off the row's bottom edge without
	   being in the flow — see `.bar`. */
	.shelf {
		position: relative;
	}

	/* NO RULE BETWEEN THE SHELVES. Six lines through six short rows is more
	   structure than the list has: the names are one column, the sizes a
	   second and the controls a third, and that alignment already says where a
	   row begins and ends. The rule under the last one stays, because the
	   totals line below it is a different kind of thing — see `.foot`. */
	.shelf + .shelf {
		margin-block-start: 0.1rem;
	}

	.shelf-line {
		display: flex;
		align-items: center;
		gap: 0.6rem;
		padding-block: 0.45rem;
	}

	.shelf-name {
		flex: 1;
		min-width: 0;
		font-size: 0.9rem;
	}

	/* Tabular figures and `flex: none`: the sizes are a column, and a column
	   whose digits are proportional wobbles as a download counts up. */
	.shelf-size {
		flex: none;
		font-variant-numeric: tabular-nums;
		font-size: 0.8rem;
		color: var(--color-text-muted);
	}

	/* One width for the pair whatever each slot holds, so the sizes above stay
	   in their column as rows finish. */
	.actions {
		flex: none;
		display: flex;
		align-items: center;
		gap: 0.2rem;
	}

	/* Every slot is the same square, the empty one included — that is what
	   holds the column. 2.25rem is a tap target rather than an icon's size:
	   the reader this panel is for is on a phone. */
	.act {
		flex: none;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		inline-size: 2.25rem;
		block-size: 1.9rem;
		padding: 0;
		border: 1px solid transparent;
		border-radius: var(--radius-md);
		background: none;
		color: var(--color-text-muted);
		font: inherit;
		font-size: 0.9rem;
	}

	/* The two that are buttons. The check and the empty slot are the same
	   square and neither is pressable, so neither claims to be. */
	.download,
	.remove {
		cursor: pointer;
	}

	/* The one thing on the row a reader came to press, so it is the one that
	   is drawn as a control. Its icon says which it is; the border says it is
	   pressable at all. */
	.download {
		border-color: var(--color-border);
		background: var(--color-bg-elevated);
		color: var(--color-text);
	}

	.download:hover:not(:disabled),
	.remove:hover:not(:disabled) {
		border-color: var(--color-accent);
		color: var(--color-accent);
	}

	.act:disabled {
		opacity: 0.45;
		cursor: not-allowed;
	}

	/* Quiet until it is armed, exactly as `.forget` is: a destructive control
	   drawn like the primary one beside it invites the click it then asks to
	   confirm. Armed, it takes the border it lacked — the shelf's own
	   two-click state, said where the click will land. */
	.remove.confirming {
		border-color: var(--color-accent);
		background: var(--color-bg-elevated);
		color: var(--color-accent);
	}

	.held {
		color: var(--color-accent);
	}

	/*
	 * OUT OF THE FLOW, along the row's own bottom rule, because a bar that
	 * takes height appears and disappears — and it did: starting a download
	 * pushed every shelf below the running one down by its height, and
	 * finishing pulled them back up, under the reader's finger. Reserving the
	 * space instead would cost the height on all seven rows for ever, which is
	 * the panel's own scrollbar bought back at the same price. Overlaying the
	 * rule costs nothing and is where a progress bar belongs anyway.
	 */
	.bar {
		position: absolute;
		inset-inline: 0;
		inset-block-end: 0;
		block-size: 2px;
		border-radius: 999px;
		background: var(--color-border);
		overflow: hidden;
	}

	.bar-fill {
		block-size: 100%;
		background: var(--color-accent);
		transition: inline-size 200ms linear;
	}

	/* A row, set off from the shelves by a rule and a little air rather than by
	   being built differently. The size cell holds a sum instead of a shelf's
	   own bytes, which is the only thing about it that is not a shelf. */
	.foot {
		margin-block-start: 0.55rem;
		border-block-start: 1px solid var(--color-border);
		padding-block-start: 0.55rem;
	}

	/* Uppercase and muted, so the totals line is read as the column's summary
	   and not as a seventh shelf competing with the six above it. */
	.foot .shelf-name {
		font-size: 0.72rem;
	}

	.foot .shelf-size {
		font-weight: 500;
		color: var(--color-text);
	}

	/*
	 * ...AND ABOVE 34rem IT IS A CARD, centred rather than anchored — there is
	 * no trigger left to anchor to, since the popover it was opened from has
	 * closed. `inset: 0` with `margin: auto` is the browser's own centring for
	 * a fixed-position dialog; the shared `.sheet` sets `margin: 0`, which is
	 * the declaration being undone here.
	 *
	 * A scoped selector compiles to `.advanced-dialog.svelte-hash` and outranks
	 * the global single class without `!important` — `TocMenu` does the same
	 * at its own breakpoint, for the same reason.
	 *
	 * THE CAP IS SET SO THE CONTENT FITS UNDER IT, which is the whole point of
	 * the number: this panel is a short list that ends, not a table of
	 * contents, and every one of its rows is a control. At 34rem it was two
	 * rows short of its own content, so the panel every reader opens opened
	 * scrolled — with the offline switch, the thing the panel is named for,
	 * below the fold. `block-size: auto` still shrinks it to whatever the
	 * reader's own language chain produced; the cap only decides when a short
	 * window takes over, and `90vh` is what answers for the window.
	 */
	@media (min-width: 34rem) {
		.advanced-dialog {
			inline-size: min(32rem, 92vw);
			/*
			 * `fit-content` AND NOT `auto`, which is what the two `inset: 0`
			 * edges turn into a stretch: with both block insets pinned and the
			 * height auto, the box is solved to fill its containing block and
			 * the auto margins get nothing to centre with — so the panel grew
			 * to the cap and stood over its own content in empty space. A
			 * `fit-content` height is a definite size, so the box shrinks to
			 * the content and the auto margins do the centring they are there
			 * for. The cap still clamps it, and `.sheet-body` still scrolls
			 * once it bites.
			 */
			block-size: fit-content;
			max-block-size: min(44rem, 90vh);
			margin: auto;
			border: 1px solid var(--color-border);
			border-radius: var(--radius-lg);
			box-shadow: var(--shadow-panel);
			overflow: hidden;
		}
	}
</style>
