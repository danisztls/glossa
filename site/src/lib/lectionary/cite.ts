/**
 * A lectionary citation, written the way the READER's language writes one.
 *
 * THE SOURCE IS ENGLISH AND THE READER IS NOT. Every citation in `table.json`
 * comes off USCCB's pages and is spelled the way English spells one —
 * `Ezekiel 33:7-9` — so a Portuguese reader met a column of English book names
 * and English punctuation under a heading, a date and a day's name that were
 * all in Portuguese. Nowhere else on the site does that happen: a citation
 * elsewhere is printed by the work being read, in that work's own language,
 * and reproducing it verbatim is exactly right. Here the citation is not a
 * quotation of anything the reader is reading. It is an ADDRESS this site
 * resolves, and an address has no language of its own — `PrayerReferences`
 * reached the same conclusion from the other end, and writes its references
 * out of the address rather than out of a stored string.
 *
 * IT IS A STRING IN AND A STRING OUT, AND THAT IS THE WHOLE DESIGN. The
 * alternative was a second renderer beside `RefText` that walks segments and
 * draws links from parts — a copy of the one component whose contract is that
 * it reproduces its input exactly. Instead this rewrites the citation into the
 * reader's own grammar and hands it back to `RefText` to be parsed IN THAT
 * GRAMMAR, so there is still one renderer, one parser and one set of link
 * rules. What comes back is the string and the language it is now written in.
 *
 * THE ROUND TRIP IS THE SAFETY PROPERTY, and it is what `cite.test.ts` checks
 * over every citation the table holds: a localized citation must parse, in its
 * new language, to the same books, chapters and verses the English one parsed
 * to. That is available because the pieces are not invented — the book form
 * comes from `bookAbbrev`, which returns a variant out of the very table the
 * parser matches against, and the separator from `grammarSurface`, which is
 * that language's own. Write either by hand and the round trip is where it
 * would be caught.
 *
 * THE BOOK IS ABBREVIATED, AND ENGLISH IS NOT EXEMPT FROM IT. Two reasons, and
 * the second is the one that decides: the tables hold abbreviations rather than
 * names — the oracle derived them from citations, and citations abbreviate — so
 * a form the parser is certain to read back is an abbreviation for eight of the
 * eleven languages that have a table at all; and a reading list is where an
 * abbreviation belongs, every hand missal and parish sheet printing `Ez 33,7-9`.
 * `/schola` already teaches exactly that notation out of these same two
 * functions, so printing the full name here would contradict the page that
 * teaches the citation form.
 *
 * English took the source's own spelling for a day, on no better ground than
 * that it was already there, and the card then carried two conventions decided
 * by the reader's language: `Ezekiel 33:7-9` for one reader and `Ez 33,7-9` for
 * the next. The source's language is not a reason to print differently, so the
 * only tag treated specially here is one with no table.
 *
 * A CITATION IS LOCALIZED WHOLE OR NOT AT ALL. Half the interface languages
 * have no book table (`hasBookAbbrevs`), and the derived tables that exist are
 * derived from citations, so a book the Catechism never cites is simply absent
 * from them — 7 books missing in Italian, 8 in Spanish. Swapping the
 * separator and leaving `Ezekiel` in place would produce a string the target
 * grammar cannot read at all, and the reference would go from an English link
 * to no link: the one outcome worse than the complaint. So a book with no form
 * in the reader's language leaves the whole citation in English, where it at
 * least resolves.
 */

// The GRAMMAR half and not `$lib/refs`, which is the usual import: nothing
// here asks whether an address exists, so nothing here needs the corpus —
// `suggest.ts` reaches the tables the same way and for the same reason.
import {
	bookAbbrev,
	citationParts,
	grammarSurface,
	hasBookAbbrevs,
	parseRefs,
	type RefSegment
} from '$lib/refs-grammar';

/** The language the table's citations are written in. USCCB's pages are
 *  English and the grammar has to read them as English whatever the reader's
 *  interface is; this is that fact, named rather than spelled `'en'` at four
 *  call sites. */
export const CITE_SOURCE_LANG = 'en';

export interface LocalizedCite {
	/** The citation as it should be printed. */
	text: string;
	/** The language `text` is written in, for `RefText` to parse it under.
	 *  `CITE_SOURCE_LANG` whenever nothing was rewritten. */
	lang: string;
}

/** What the source puts before a citation it is only pointing at — USCCB
 *  writes both, 90 times between them. Matched as a whole text segment, which
 *  is what the grammar leaves them as, so nothing inside a citation can be
 *  hit by this. */
const CF_LEAD_RE = /^(\s*)(?:See|Cf\.?)(\s+)$/i;

/**
 * The citation `cite`, rewritten for a reader whose interface is `lang`.
 *
 * `cf` is the word to print where the source printed "See" or "Cf." — the
 * caller's, because this module has no business reading the dictionary. Leave
 * it out and the source's own word stands.
 */
export function localizeCite(cite: string, lang: string, cf?: string): LocalizedCite {
	const unchanged: LocalizedCite = { text: cite, lang: CITE_SOURCE_LANG };
	const tag = lang.toLowerCase().split('-')[0];
	if (!hasBookAbbrevs(tag)) return unchanged;

	const segments = parseRefs(cite, { lang: CITE_SOURCE_LANG });
	const sep = grammarSurface(tag).chapterVerseSep;
	const out: string[] = [];
	for (const seg of segments) {
		if (seg.kind === 'text') {
			const said = cf ? seg.text.replace(CF_LEAD_RE, `$1${cf}$2`) : seg.text;
			// A chapter mark inside a tail the grammar did not consume —
			// `–10:1` of `Matthew 9:35–10:1`, which is a reference this module
			// links no better than it did, but which would otherwise print half
			// in the reader's punctuation and half in the source's. Bounded by
			// digits on both sides, so it can only be a chapter mark.
			out.push(sep === ':' ? said : said.replace(/(?<=\d):(?=\d)/g, sep));
			continue;
		}
		if (seg.kind !== 'scripture') return unchanged; // a lectionary citation names Scripture and nothing else
		const parts = citationParts(seg, { lang: CITE_SOURCE_LANG });
		// A bookless continuation clause (`64:2-7` after `Isaiah 63:16b-17`)
		// has no book to rewrite and takes the locus alone, exactly as the
		// source printed it minus the separator swap.
		const book = parts.book ? bookAbbrev(seg.osis, tag) : '';
		if (book === undefined) return unchanged; // this language cannot name this book — see the docblock
		out.push(book ? `${book} ` : '');
		out.push(restyleLocus(parts, sep));
	}

	const text = out.join('');
	// Nothing was rewritten, so there is nothing to gain and a language to
	// lose: a string still spelled in English must be READ as English, or the
	// target grammar makes something of it that the source's never did. `2 Sm
	// 12:7-10, 13` is the case — a form the English table does not carry and
	// the Portuguese one does, where PT's `:` is a clause separator, so
	// re-reading it in Portuguese invents a whole-chapter link to a citation
	// that names four verses.
	if (text === cite) return unchanged;
	return addressesAgree(segments, parseRefs(text, { lang: tag })) ? { text, lang: tag } : unchanged;
}

/** Every scripture segment of a parse, as the only thing about it that must
 *  survive being rewritten: which book, which chapter, which verses. */
function addresses(segments: RefSegment[]): string[] {
	return segments
		.filter((s) => s.kind === 'scripture')
		.map((s) => `${s.osis} ${s.chapter}:${s.verses.join(',')}`);
}

/**
 * Whether the rewritten citation still names exactly what the source's did.
 *
 * THE ROUND TRIP IS CHECKED AT RENDER AND NOT ONLY IN A TEST, because the two
 * grammars differ in ways no rewriting rule can anticipate and every one of
 * them fails silently — a citation that still reads plausibly, pointing
 * somewhere else. Three were found the first time this ran over the table, and
 * they are three different mechanisms: `2 Timothy 3:14-4:2` keeps its verse in
 * English, where a `:` after a range's far end marks a chapter crossing, and
 * loses it in Portuguese, where that mark is unavailable and the range expands
 * backwards to nothing; `Romans 5:12-19 or 5:12, 17-19` gains a link to Romans
 * 12 out of the half the English parse left as text, PT's `:` being a clause
 * separator; `Baruch 3:9-15, 32-4:4` drops verse 32.
 *
 * So the rule is the module's own, applied to itself: a citation is localized
 * only where localizing it demonstrably changes nothing but the spelling.
 * Everything else stays English, which is where it started and where it
 * resolves. `cite.test.ts` measures what that costs — it is a handful of
 * citations per language, and it is not zero and should not be forced to be.
 */
function addressesAgree(source: RefSegment[], rewritten: RefSegment[]): boolean {
	const a = addresses(source);
	const b = addresses(rewritten);
	return a.length === b.length && a.every((address, i) => address === b[i]);
}

/**
 * The numbers of one citation, punctuated as `sep`'s language punctuates them.
 *
 * TWO MARKS MOVE AND THE DIGITS NEVER DO. `:` becomes whatever the language
 * puts between chapter and verse — a comma across the Romance tables, which is
 * then no longer available to separate one passage from the next, so those
 * take the `.` that the same tables already chain a verse list with (`Rm 11,
 * 17-18. 24`, quoted in `parseVerseList`'s own docblock). Everything else is
 * reproduced: the ranges, the `16b` and `1bc-2` subdivisions the OLM prints on
 * 140 of its citations, the spacing.
 *
 * The groups are what make that possible — they say which commas are between
 * passages and which are inside one — and where the parse found none (a
 * whole-chapter reference, or a locus the grammar reads only the head of) the
 * swap is applied to the string and nothing is re-punctuated.
 */
function restyleLocus(
	parts: { locus: string; groups: { start: number; end: number }[] },
	sep: string
): string {
	const { locus, groups } = parts;
	if (sep === ':') return locus;
	const swap = (s: string) => s.replaceAll(':', sep);
	if (groups.length < 2) return swap(locus);
	const between = sep === ',' ? '. ' : ', ';
	const head = swap(locus.slice(0, groups[0].start));
	const passages = groups.map((g) => locus.slice(g.start, g.end)).join(between);
	return head + passages + swap(locus.slice(groups[groups.length - 1].end));
}
