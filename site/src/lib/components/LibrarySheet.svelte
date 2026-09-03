<!--
	The offline library: what is on this device, what the rest would cost, and
	the two buttons that change it.

	WHAT IT IS FOR. Offline mode shipped before this did, and that was the wrong
	order: a switch saying "only texts already on this device will open" beside
	no way to put anything there. The automatic waves put the shell, the
	prayers, the Compendium and ONE Catechism edition on the device
	(`sw-policy.ts`'s `AUTOMATIC_WAVES`); Scripture, the magisterium and the
	Summa are 23-28 MB each and were reachable only by a `CACHE_WAVE` that
	nothing sent. This is what sends it.

	THE ROWS ARE WAVES, NOT WORKS, and the difference is worth knowing before
	changing it. A wave is every edition of a kind in the reader's language
	chain, so "Bible" may be two editions and 24 MB. `requestWork` and
	`assetsForWork` already exist for the finer grain a reader arguably thinks
	in ("the CPDV", "the Clementina"), and adding it means a second level in
	this list rather than anything new underneath. Waves first because they are
	the unit `planWaves` prices and orders, and the order IS the advice: it is
	descending value per byte.

	A `<dialog>` AND NOT A PANEL. Six rows, byte counts, a progress bar and a
	destructive action do not fit an 11rem popover, and this is not a place a
	reader passes through — they come to it, watch it, and leave. It wears the
	shell and sheet chrome every other dialog here wears (`.dialog-bare`,
	`.sheet`, `.sheet-*`), full-bleed on a phone and a centred card above
	34rem, which is `TocMenu`'s arrangement for `TocMenu`'s reason: a screen
	with room to read around the panel should still show the page.

	IT IS NOT A ROUTE, deliberately. An address would mean `corpus-routes.json`,
	`isCanonicalPath`, the sitemap, `route-titles.json`, `assertNamed` and an
	`hreflang` cluster — the whole address grammar in `route-manifest.ts` — for
	a control surface with nothing to index and nothing to link to. `/signata`
	is a page because a reader's bookmarks are a place; a download queue is a
	button that took a while.

	MOUNTED IN THE ROOT LAYOUT, opened from `SettingsMenu`'s Advanced fold
	through `library.open`. It has to outlive its trigger: the popover closes
	the instant the row is used, and a dialog inside it would be unmounted
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
	/** Two-click removal. Reset whenever the panel closes, so a confirmation
	 *  cannot wait around from a previous visit and catch the next click. */
	let confirmingForget = $state(false);

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
		confirmingForget = false;
	}

	function forget() {
		if (!confirmingForget) {
			confirmingForget = true;
			return;
		}
		confirmingForget = false;
		void library.forget();
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
<dialog bind:this={dialogEl} class="dialog-bare sheet library-dialog" onclose={onClose}>
	{#if library.open}
		<div class="sheet-panel">
			<div class="sheet-head">
				<h2 class="sheet-title">{t('library.title')}</h2>
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
										{formatBytes(row.heldBytes, i18n.lang)} / {formatBytes(row.bytes, i18n.lang)}
									{:else}
										{formatBytes(row.bytes, i18n.lang)}
									{/if}
								</span>
								{#if row.complete}
									<!-- The words are visually hidden rather than a `title`:
									     a `title` beside inner text is announced twice by
									     some readers, and the check is the visual half of
									     the same statement, not a remark about it. -->
									<span class="held">
										<Icon name="check" />
										<span class="visually-hidden">{t('library.downloaded')}</span>
									</span>
								{:else}
									<button
										type="button"
										class="download"
										disabled={blocked || !!running}
										onclick={() => library.download(row.id)}
									>
										{t('library.download')}
									</button>
								{/if}
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
					<div class="foot">
						<p class="total">
							{formatBytes(library.total.heldBytes, i18n.lang)} / {formatBytes(
								library.total.bytes,
								i18n.lang
							)}
						</p>
						{#if library.total.heldBytes > 0}
							<button
								type="button"
								class="forget"
								class:confirming={confirmingForget}
								onclick={forget}
							>
								{confirmingForget ? t('library.forgetConfirm') : t('library.forget')}
							</button>
						{/if}
					</div>
				{/if}
			</div>
		</div>
	{/if}
</dialog>

<style>
	.lede {
		margin: 0 0 0.9rem;
		font-size: 0.85rem;
		line-height: 1.5;
		color: var(--color-text-muted);
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

	.shelf + .shelf {
		margin-block-start: 0.15rem;
		border-block-start: 1px solid var(--color-border);
		padding-block-start: 0.15rem;
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

	/* One width for the action cell whichever of the two it holds, so the
	   sizes above stay in their column as rows finish. */
	.download,
	.held {
		flex: none;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		min-inline-size: 5.5rem;
	}

	.download {
		padding: 0.3rem 0.7rem;
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		background: var(--color-bg-elevated);
		color: var(--color-text);
		font: inherit;
		font-size: 0.8rem;
		line-height: 1.5;
		cursor: pointer;
	}

	.download:hover:not(:disabled) {
		border-color: var(--color-accent);
		color: var(--color-accent);
	}

	.download:disabled {
		opacity: 0.45;
		cursor: not-allowed;
	}

	.held {
		color: var(--color-accent);
	}

	.bar {
		block-size: 0.25rem;
		margin-block-end: 0.45rem;
		border-radius: 999px;
		background: var(--color-border);
		overflow: hidden;
	}

	.bar-fill {
		block-size: 100%;
		background: var(--color-accent);
		transition: inline-size 200ms linear;
	}

	.foot {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.6rem;
		margin-block-start: 1rem;
		border-block-start: 1px solid var(--color-border);
		padding-block-start: 0.7rem;
	}

	.total {
		margin: 0;
		font-variant-numeric: tabular-nums;
		font-size: 0.8rem;
		color: var(--color-text-muted);
	}

	/* Quiet until it is armed. A destructive action that looks like a primary
	   button invites the click it then asks to confirm; this one has to be
	   found on purpose, and only says so once it means it. */
	.forget {
		padding: 0.3rem 0.6rem;
		border: 1px solid transparent;
		border-radius: var(--radius-md);
		background: none;
		color: var(--color-text-muted);
		font: inherit;
		font-size: 0.8rem;
		line-height: 1.5;
		cursor: pointer;
	}

	.forget:hover,
	.forget.confirming {
		border-color: var(--color-border);
		color: var(--color-text);
	}

	/*
	 * ...AND ABOVE 34rem IT IS A CARD, centred rather than anchored — there is
	 * no trigger left to anchor to, since the popover it was opened from has
	 * closed. `inset: 0` with `margin: auto` is the browser's own centring for
	 * a fixed-position dialog; the shared `.sheet` sets `margin: 0`, which is
	 * the declaration being undone here.
	 *
	 * A scoped selector compiles to `.library-dialog.svelte-hash` and outranks
	 * the global single class without `!important` — `TocMenu` does the same
	 * at its own breakpoint, for the same reason.
	 */
	@media (min-width: 34rem) {
		.library-dialog {
			inline-size: min(30rem, 92vw);
			block-size: auto;
			max-block-size: min(34rem, 80vh);
			margin: auto;
			border: 1px solid var(--color-border);
			border-radius: var(--radius-lg);
			box-shadow: var(--shadow-panel);
			overflow: hidden;
		}
	}
</style>
