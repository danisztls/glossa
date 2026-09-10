<!--
	The wash on a bookmark that quoted something: the sentence, not the
	paragraph it sits in.

	MOUNTED ONCE IN `+layout.svelte`, like `LinkPreview` and `SelectionMenu`,
	and reading the same markup they do — `data-unit-href` for which unit a
	block is, `data-edition` for which text it is. No route renders this, no
	route knows it exists, and it draws nothing of its own.

	THE LADDER, AND EVERY RUNG IS A REAL ANSWER:

	  same edition, words found   → the words are washed
	  different edition           → the unit is washed
	  words not found             → the unit is washed
	  no Custom Highlight API     → the unit is washed

	The whole-unit wash is what the site did before this existed, so every way
	this can decline lands on a mark that was already correct. That is what
	makes a search safe here: it is an improvement on a good answer rather than
	the only thing between the reader and none.

	A DIFFERENT EDITION IS NOT A FAILED SEARCH, and the difference matters. The
	words of a Latin bookmark are not in the Portuguese text and must not be
	hunted for there — a fold loose enough to cross a translation would be
	loose enough to mark a sentence nobody chose. So the edition is compared
	first and the text is only searched when it is the text the words came
	from.

	`CSS.highlights` RATHER THAN MARKUP, for one reason that decides it: this
	paints ranges without touching the DOM, so it cannot fight Svelte over
	nodes Svelte owns. Wrapping the words in a `<mark>` would mean editing the
	rendered output of `ProseBlocks`, `AnnotatedText`, `PrayerBlocks` and every
	other renderer — from the outside, where the next re-render undoes it, or
	from the inside, which is a segment threaded through all of them for a
	preference two of their callers care about. The cost is that a highlight
	pseudo-element does not print, and that a browser without the API shows
	the unit wash instead; both land on the rung above.

	IT REPAINTS ON A MUTATION, NOT ON A TIMER OR A GUESS. The text this marks
	arrives at least four ways — a route rendering, a late edition fetch on
	`/documenta`, a compare column opening, a bookmark being made in the
	popover — and there is no one event for all of them. An observer on the
	reading surfaces answers each of them the same way, and the work is a
	string search over the units on screen, behind a frame.
-->
<script lang="ts">
	import { bookmarks } from '$lib/bookmarks.svelte';
	import { APPARATUS_SELECTOR } from '$lib/selection';
	import { locateQuote } from '$lib/quote-mark';

	/** The name this component registers its ranges under, and what
	 *  `::highlight()` in `reading-chrome.css` paints. */
	const HIGHLIGHT = 'bookmark-quote';

	/** Set on a unit whose words were found and marked, so the stylesheet can
	 *  stand the block wash down for that one unit alone. An attribute rather
	 *  than a class: Svelte owns the `class` of these elements and rewrites it
	 *  on render, and it owns no `data-` attribute it did not write. */
	const MARKED = 'data-quote-marked';

	let frame: number | undefined;

	/** Every text node of a unit that is TEXT — the apparatus is skipped for
	 *  the same reason the copy skips it (`APPARATUS_SELECTOR`): a verse
	 *  number and a footnote marker are letters and digits too, and folded
	 *  into the haystack they would break a match that runs across them. */
	function textNodes(unit: Element): Text[] {
		const walker = document.createTreeWalker(unit, NodeFilter.SHOW_TEXT, {
			acceptNode: (node) =>
				node.parentElement?.closest(APPARATUS_SELECTOR)
					? NodeFilter.FILTER_REJECT
					: NodeFilter.FILTER_ACCEPT
		});
		const out: Text[] = [];
		for (let n = walker.nextNode(); n; n = walker.nextNode()) out.push(n as Text);
		return out;
	}

	/** A range over `[from, to)` of the concatenated text of `nodes`. */
	function rangeAt(nodes: Text[], from: number, to: number): Range | undefined {
		const range = document.createRange();
		let seen = 0;
		let started = false;
		for (const node of nodes) {
			const len = node.data.length;
			if (!started && from < seen + len) {
				range.setStart(node, from - seen);
				started = true;
			}
			if (started && to <= seen + len) {
				range.setEnd(node, to - seen);
				return range;
			}
			seen += len;
		}
		return undefined;
	}

	/**
	 * Mark every unit on screen whose bookmark quoted words this edition has.
	 *
	 * One `Highlight` for the whole page rather than one per unit: a chapter
	 * can carry a dozen marked verses, and they are one kind of mark with one
	 * appearance.
	 */
	function paint() {
		if (typeof CSS === 'undefined' || !CSS.highlights) return;
		for (const el of document.querySelectorAll(`[${MARKED}]`)) el.removeAttribute(MARKED);

		const ranges: Range[] = [];
		for (const surface of document.querySelectorAll<HTMLElement>('.reading-text')) {
			const edition = surface.dataset.edition;
			if (!edition) continue;
			for (const unit of surface.querySelectorAll<HTMLElement>('[data-unit-href]')) {
				const href = unit.dataset.unitHref;
				const saved = href ? bookmarks.get(href) : undefined;
				// The edition decides before the text is searched at all.
				if (!saved?.quote || saved.quotedFrom !== edition) continue;

				const nodes = textNodes(unit);
				const at = locateQuote(nodes.map((n) => n.data).join(''), saved.quote);
				if (!at) continue;
				const range = rangeAt(nodes, at.from, at.to);
				if (!range) continue;
				ranges.push(range);
				unit.setAttribute(MARKED, '');
			}
		}

		if (ranges.length === 0) CSS.highlights.delete(HIGHLIGHT);
		else CSS.highlights.set(HIGHLIGHT, new Highlight(...ranges));
	}

	function schedule() {
		if (frame !== undefined) return;
		frame = requestAnimationFrame(() => {
			frame = undefined;
			paint();
		});
	}

	$effect(() => {
		// Read so the effect re-runs when a mark is made or dropped — a
		// bookmark taken in the popover has to appear under the words at once,
		// and the DOM has not changed at all. `count` reads the whole map,
		// which every write replaces, so it tracks a changed row as well as an
		// added one.
		void bookmarks.count;
		schedule();

		// `attributes` is deliberately NOT observed: `paint` sets one on every
		// unit it marks, and observing them would make this its own trigger.
		const watcher = new MutationObserver(schedule);
		watcher.observe(document.body, { childList: true, subtree: true, characterData: true });
		return () => {
			watcher.disconnect();
			if (frame !== undefined) cancelAnimationFrame(frame);
			frame = undefined;
			if (typeof CSS !== 'undefined') CSS.highlights?.delete(HIGHLIGHT);
		};
	});
</script>
