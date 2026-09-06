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
	 * A PERICOPE WITH NO CITATION IS PRINTED AS ITS NAME AND NOTHING ELSE.
	 * Christmas Day's acclamation and the Easter sequences are not Scripture,
	 * so the source prints no address for them; showing an empty link, or
	 * dropping the row, would each say something false — that the site lost a
	 * citation, or that the Mass has no sequence.
	 */
	import { AnchoredPanel } from '$lib/floating.svelte';
	import { i18n, t } from '$lib/i18n.svelte';
	import { slotKey, type MassReadings, type Pericope } from '$lib/lectionary';
	import { localizeCite } from '$lib/lectionary/cite';
	import Icon from './Icon.svelte';
	import RefText from './RefText.svelte';

	interface Props {
		masses: MassReadings[];
	}
	let { masses }: Props = $props();

	// Per INSTANCE, and the home page and the calendar can both be on screen
	// with one of these each: `$props.id()` has to be a bare declaration, so it
	// cannot be passed straight to the constructor.
	const uid = $props.id();
	const card = new AnchoredPanel(uid);

	// The citation as the reader's language writes it, and the language it is
	// then written in — which is what `RefText` must parse it under, and is
	// English wherever nothing could be rewritten.
	const cite = (text: string) => localizeCite(text, i18n.lang, t('lectionary.cf'));

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
								<!-- No address because the text is not Scripture. -->
								<span class="unscriptured">{t('lectionary.notScripture')}</span>
							{/if}
						</dd>
					</div>
				{/each}
			</dl>
		</div>
	{/each}

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
	.unscriptured {
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
		.caveat-print {
			display: block;
			margin: 0.7rem 0 0;
			font-size: 0.75rem;
			line-height: 1.45;
			color: var(--color-text-muted);
		}
	}
</style>
