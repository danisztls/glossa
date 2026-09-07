<script lang="ts">
	/**
	 * The Mass readings appointed for one day, as resolved citations.
	 *
	 * EVERY CITATION IS A LINK INTO THIS SITE'S OWN BIBLES and never a text
	 * reproduced here — `$lib/lectionary` says why at length. `RefText` does
	 * the resolving, which means the Hebrew-to-Vulgate psalm mapping is
	 * applied on the way without this component knowing about it (`refs.ts`
	 * calls `resolveVulgate` for every scripture segment).
	 *
	 * THE NOTE IS NOT DECORATION AND IS NOW BEHIND A MARK. A reader who arrives
	 * at a page headed with today's date and a list of readings will reasonably
	 * take it for what is read at their parish, and for two reasons it may not
	 * be: the translation is this corpus's, not the one proclaimed aloud, and
	 * the schedule is the universal Ordo Lectionum Missae, which a conference
	 * may adapt. That is the colophon's own posture — `site/docs/colophon.md` —
	 * said where the claim is actually made rather than on a page few readers
	 * reach.
	 *
	 * SET UNDER THE LIST IT WAS THREE LINES OF SMALL PRINT UNDER FIVE LINES OF
	 * CITATIONS, on a card that also carries the day's name, its season, its
	 * rank and its colour — the longest text in the block, and read once. It is
	 * `ArtFigure`'s arrangement now: the `info` glyph beside the heading, a
	 * native popover, `role="note"`, which is what the rest of the site already
	 * does with a line that qualifies something rather than saying it. The
	 * trigger has no text of its own, so the `aria-label` is mandatory and not
	 * a courtesy, and the note stays in the reading order behind the heading it
	 * qualifies.
	 *
	 * THE CITATIONS ARE WRITTEN IN THE READER'S OWN LANGUAGE, and `./cite.ts`
	 * in `$lib/lectionary` is the whole of how — this file only asks. The
	 * source is USCCB and spells every citation in English; nothing else on the
	 * site prints a citation the reader's language did not print, because
	 * everywhere else the citation is a quotation of the work being read. Here
	 * it is an address, and an address has no language.
	 *
	 * A PERICOPE WITH NO CITATION KEEPS ITS ROW AND SAYS WHAT IS MISSING.
	 * Christmas Day's acclamation and the Easter sequences are printed by the
	 * source with their words and no address, so there is nothing to resolve and
	 * the words are the lectionary's own; showing an empty link, or dropping the
	 * row, would each say something false — that the site lost a citation, or
	 * that the Mass has no sequence. `lectionary.textMissing` argues why the
	 * line names the absence rather than the text.
	 */
	import { content } from '$lib/content.svelte';
	import { AnchoredPanel } from '$lib/floating.svelte';
	import { i18n, t } from '$lib/i18n.svelte';
	import { slotKey, type MassReadings, type Pericope } from '$lib/lectionary';
	import { localizeCite } from '$lib/lectionary/cite';
	import Icon from './Icon.svelte';
	import RefText from './RefText.svelte';

	interface Props {
		masses: MassReadings[];
		/**
		 * The way from this list of citations to the page that sets the passages
		 * out, printed as a word at the foot of the list.
		 *
		 * IT BELONGS TO THE READINGS AND NOT TO THE CARD, which is the whole
		 * reason it is a prop here rather than in `LiturgicalDayCard`. What it
		 * offers is more of THIS — the same pericopes, at length — so it sits
		 * where they end, not in a corner of a card whose other four sections are
		 * about the day's rank, its colour and its optional memorials. It follows
		 * from that placement that a day the lectionary cannot answer for shows no
		 * link, which is correct: there is nothing further to read.
		 *
		 * `title` is the accessible name and the tooltip both; `label` is what is
		 * printed. See `LinkPreview`'s `ref.preview.open`, whose marker this is at
		 * this list's scale.
		 */
		read?: { href: string; label: string; title: string };
	}
	let { masses, read }: Props = $props();

	// Per INSTANCE, and the home page and the calendar can both be on screen
	// with one of these each: `$props.id()` has to be a bare declaration, so it
	// cannot be passed straight to the constructor.
	const uid = $props.id();
	const card = new AnchoredPanel(uid);

	// The citation as the reader's language writes it, and the language it is
	// then written in — which is what `RefText` must parse it under, and is
	// English wherever nothing could be rewritten.
	//
	// THE BIBLE EDITION'S LANGUAGE AND NOT THE INTERFACE'S, which is the rule
	// every surface that writes a citation follows: `PrayerReferences` names
	// the book out of that edition, and both notation specimens are drawn from
	// it (`scriptureSpecimen`). A citation is an address into the edition this
	// link opens, so it is written the way that edition's language writes one —
	// otherwise a reader on the Clementina is shown one convention and taken to
	// a page printing another. Safe because `vulgateNumbering` is a property of
	// a WORK and never of a language, so naming a language here cannot switch
	// off the Hebrew-to-Vulgate conversion these psalm citations need.
	const citeLang = $derived(content.langFor('bible'));
	const cite = (text: string) => localizeCite(text, citeLang, t('lectionary.cf'));

	function label(p: Pericope, readings: Pericope[]): string {
		const key = slotKey(p, readings);
		return key ? t(key) : (p.label ?? '');
	}
</script>

<section class="readings" aria-labelledby="readings-heading">
	<div class="head">
		<h3 id="readings-heading">{t('lectionary.heading')}</h3>
		<button
			bind:this={card.trigger}
			type="button"
			class="menu-trigger about"
			popovertarget={card.id}
			aria-expanded={card.open}
			aria-label={t('lectionary.about')}
		>
			<Icon name="info" class="hint" />
		</button>
		<!-- `role="note"` — ARIA's own word for content ancillary to the thing
		     it hangs off, which this exactly is. Not `tooltip`, which describes
		     its anchor and is summoned rather than asked for. -->
		<span
			bind:this={card.panel}
			id={card.id}
			popover="auto"
			role="note"
			ontoggle={card.onToggle}
			class="panel-surface floating-panel caveat">{t('lectionary.caveat')}</span
		>
	</div>

	{#each masses as mass (mass.olm)}
		<div class="mass">
			{#if mass.label}
				<!-- Named only where the day has more than one Mass to tell
				     apart; the source names it, and this does not invent one. -->
				<h4>{mass.label}</h4>
			{/if}
			<dl>
				{#each mass.readings as reading, i (i)}
					<div class="row">
						<dt lang={i18n.lang}>{label(reading, mass.readings)}</dt>
						<dd>
							{#if reading.cite}
								{@const main = cite(reading.cite)}
								<RefText text={main.text} lang={main.lang} />
								{#each reading.orElse ?? [] as alt (alt)}
									{@const other = cite(alt)}
									<span class="alt">
										<span class="or">{t('lectionary.or')}</span>
										<RefText text={other.text} lang={other.lang} />
									</span>
								{/each}
							{:else}
								<!-- The source printed an antiphon or a sequence and no address
								     for it, so there is nothing to resolve and the words are the
								     lectionary's own. What is said is what is MISSING, not what
								     the text is — `lectionary.textMissing` has the argument. -->
								<span class="text-missing">{t('lectionary.textMissing')}</span>
							{/if}
						</dd>
					</div>
				{/each}
			</dl>
		</div>
	{/each}

	<!-- LAST OF THE LIST, because it is what the list continues into. Printed as
	     a word rather than drawn as a glyph — `LinkPreview`'s "Open" marker at
	     this scale — and `title` carries the accessible name, which contains the
	     visible word rather than replacing it. -->
	{#if read}
		<p class="read-on">
			<a class="read-link" href={read.href} title={read.title} aria-label={read.title}
				>{read.label}</a
			>
		</p>
	{/if}

	<!-- Paper gets it unconditionally, and under the list where it used to
	     stand for everyone, on `ArtFigure`'s reasoning: a popover never prints
	     — top layer, and closed besides — and this is the one copy whose reader
	     cannot press anything. `aria-hidden` so it is not read twice. -->
	<p class="caveat-print" aria-hidden="true">{t('lectionary.caveat')}</p>
</section>

<style>
	.readings {
		margin-top: 1rem;
		padding-top: 0.75rem;
		border-top: 1px solid var(--color-border);
	}
	/* The heading and its mark on one line, the mark sized to the heading and
	   not to the card: it qualifies this list, so it sits with the words that
	   name the list. */
	.head {
		display: flex;
		align-items: center;
		gap: 0.3rem;
		margin-bottom: 0.5rem;
	}
	h3 {
		margin: 0;
		font-size: 0.8rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.06em;
		color: var(--color-text-muted);
	}
	/* `.menu-trigger` is the site's button and this adds only its size: the
	   header's 2.25rem square is a control in a bar, and this one stands
	   beside 0.8rem type. */
	.about {
		inline-size: 1.4rem;
		block-size: 1.4rem;
		font-size: 0.8rem;
		color: var(--color-text-muted);
	}
	h4 {
		margin: 0.75rem 0 0.3rem;
		font-size: 0.85rem;
		font-weight: 600;
	}
	.mass:first-of-type h4 {
		margin-top: 0;
	}
	dl {
		margin: 0;
		display: grid;
		/* The label column sizes to the longest label and stops there, so a
		   translation longer than English's does not push the citations off a
		   narrow screen — it wraps instead. */
		grid-template-columns: minmax(min-content, max-content) 1fr;
		gap: 0.2rem 0.75rem;
	}
	.row {
		display: contents;
	}
	dt {
		margin: 0;
		font-size: 0.85rem;
		color: var(--color-text-muted);
		hyphens: auto;
	}
	dd {
		margin: 0;
		font-size: 0.9rem;
	}
	.alt {
		white-space: nowrap;
	}
	.or {
		color: var(--color-text-muted);
		font-style: italic;
		margin: 0 0.15rem 0 0.35rem;
	}
	.text-missing {
		color: var(--color-text-muted);
		font-style: italic;
	}
	/* `SiglumGloss`'s card at this one's measure: where it goes is
	   `.floating-panel` in app.css, and what is left here is that a sentence
	   and a half wants a narrower column than a paragraph of commentary. */
	.caveat {
		max-inline-size: min(22rem, calc(100vw - 1rem));
		padding: 0.5rem 0.7rem;
		font-size: 0.8rem;
		line-height: 1.5;
		color: var(--color-text-muted);
		overflow-wrap: break-word;
	}
	.caveat-print {
		display: none;
	}

	/*
	 * `LinkPreview`'s "Open" marker at this list's scale: link colour, 0.66rem,
	 * 600, uppercased in CSS rather than in the dictionaries so a script with no
	 * case (ar) is left alone by the property instead of having a shouting
	 * translation written for it.
	 *
	 * On a row of its own at the list's end rather than floated onto a last
	 * line, because what it follows is a `<dl>` and not a paragraph — there is
	 * no last line for it to ride.
	 *
	 * AT THE INLINE START, which is the edge every label in the list above
	 * begins from and the edge the card's own text is set against. Ranged right
	 * it was the one thing on the card aligned to nothing.
	 */
	.read-on {
		margin: 0.35rem 0 0;
	}
	.read-link {
		color: var(--color-link);
		font-family: var(--font-sans);
		font-size: 0.66rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.08em;
		text-decoration: none;
		white-space: nowrap;
	}
	.read-link:hover,
	.read-link:focus-visible {
		text-decoration: underline;
		text-underline-offset: 0.25em;
	}

	@media (max-width: 26rem) {
		/* Two columns stop helping once the label column is most of the width:
		   the citation is the answer and gets the full measure. */
		dl {
			grid-template-columns: 1fr;
			gap: 0 0;
		}
		.row {
			display: block;
			margin-bottom: 0.4rem;
		}
	}

	@media print {
		/* The control becomes the line it opens. */
		.about {
			display: none;
		}
		/* A link is nothing on paper, and the page it leads to is this list with
		   its passages set out — which is the page to print if that is what was
		   wanted. */
		.read-on {
			display: none;
		}
		.caveat-print {
			display: block;
			margin: 0.7rem 0 0;
			font-size: 0.75rem;
			line-height: 1.45;
			color: var(--color-text-muted);
		}
	}
</style>
