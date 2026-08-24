/**
 * Display casing for the Summa's own headings.
 *
 * THE SOURCE IS NOT WRONG, SO THIS IS NOT A CORRECTION. CCEL's Dominican
 * Fathers edition prints every question title and every treatise heading in
 * full capitals -- `OF THE SIMPLICITY OF GOD (EIGHT ARTICLES)`,
 * `TREATISE ON THE ONE GOD (QQ[2]-26)` -- and `raw/`, `works/` and the index
 * tier all carry them that way verbatim, which is where the record of what
 * the source said belongs. What a page renders is a separate question, and
 * shouting a heading at a reader is a typographic accident of the 1920s
 * edition rather than something it is asserting. So the recasing lives here,
 * at the display layer, and is reversible by deleting one import.
 *
 * IT KEYS OFF THE STRING'S SHAPE, NOT THE LANGUAGE. `isShouted` measures how
 * much of a string is capitals, so an article title (already sentence case in
 * the same source) passes through untouched, and so would a future edition
 * that cases its own headings sanely. The Latin edition prints no question
 * titles whatsoever, so nothing here ever runs against it -- but the rule
 * would still be the right one if the Corpus Thomisticum started printing
 * them tomorrow.
 *
 * EVERY RULE BELOW WAS WRITTEN AGAINST A SWEEP OF ALL 611 QUESTION TITLES,
 * 3,113 article titles and 33 headings, not against a handful of samples.
 * Two of them exist only because that sweep refuted the obvious version --
 * see `isShouted` and `splitQuestion`, which each say which case broke them.
 *
 * Three entry points, differing in what they strip:
 *
 *  - `summaQuestionTitle`, for the reading page's `<h1>`, drops the trailing
 *    `(EIGHT ARTICLES)` count -- the articles are listed immediately beneath
 *    it, numbered, so the parenthetical is a table of contents for something
 *    already on screen -- and keeps the translator's note where there is one.
 *  - `summaQuestionLabel`, for the compact lists, drops the note too.
 *  - `summaHeadingTitle` KEEPS the question range on a treatise heading --
 *    that is the one thing it says about where the treatise sits -- and only
 *    unpicks the square brackets CCEL wraps the first number in (`Q[1]`,
 *    `QQ[2]-26`), which are its own cross-reference anchors leaking into the
 *    heading text. Verified against `raw/summa-en/summa.xml`: the brackets
 *    are in the source, not something our parser introduced.
 */

/**
 * Tokens that must survive title-casing as they are: the part sigla CCEL
 * prints in its own headings (`FP`, `FS`, ...), its question abbreviations,
 * and Roman numerals, which a naive capitalize-first-letter would render
 * `Ii` / `Viii`.
 */
const KEEP_UPPER = new Set([
	'Q',
	'QQ',
	'FP',
	'FS',
	'SS',
	'TP',
	'XP',
	'I',
	'II',
	'III',
	'IV',
	'V',
	'VI',
	'VII',
	'VIII',
	'IX',
	'X'
]);

/**
 * Lowercased mid-title, in the ordinary way of English headline case. Never
 * applied to the first word, nor to a word opening a new clause after a colon
 * -- `TREATISE ON HUMAN ACTS: ACTS PECULIAR TO MAN` has two starts, not one.
 */
const MINOR = new Set([
	'a',
	'an',
	'and',
	'as',
	'at',
	'but',
	'by',
	'for',
	'from',
	'in',
	'into',
	'nor',
	'of',
	'on',
	'or',
	'over',
	'per',
	'the',
	'to',
	'under',
	'upon',
	'with'
]);

/**
 * Whether a string is set in capitals, measured as a RATIO rather than as
 * "contains no lowercase at all".
 *
 * The absolute test was the first version and the corpus refuted it: CCEL
 * prints `TREATISE ON HABITS IN PARTICULAR (QQ 55-89) GOOD HABITS, i.e.
 * VIRTUES (QQ 55-70)`, whose two lowercase letters live entirely inside an
 * `i.e.` and left the whole heading shouting. Four fifths is comfortably
 * above anything a sentence-cased article title reaches (they run about one
 * uppercase letter in forty) and comfortably below a heading with an
 * abbreviation or two in it.
 *
 * The floor of four cased letters keeps a two-word fragment from being
 * recased on the strength of a single initial.
 */
function isShouted(title: string): boolean {
	const upper = (title.match(/\p{Lu}/gu) ?? []).length;
	const lower = (title.match(/\p{Ll}/gu) ?? []).length;
	if (upper + lower < 4) return false;
	return upper / (upper + lower) >= 0.8;
}

/**
 * A trailing translator's note, which eleven question titles carry:
 * `OF MERCY (FOUR ARTICLES) [*The one Latin word "misericordia" signifies
 * either pity or mercy...]`. Set in ordinary sentence case by the same
 * edition that shouts the title it follows, and often a paragraph long.
 *
 * Held apart from the title proper for both reasons: recasing must not touch
 * it, and the compact lists (`summaQuestionLabel`) need a form without it.
 * The `[*` opener is what makes this specific -- a title merely ending in a
 * bracket is not a note.
 */
const NOTE_RE = /\s*(\[\*[\s\S]*\])\s*$/;

/**
 * The article count, spelled out rather than numeric ("TEN ARTICLES"), so
 * matching the noun beats enumerating number words.
 */
const COUNT_RE = /\s*\([^()]*\bARTICLES?\)\s*$/i;

/**
 * Peel the note and the article count off the end of a question title.
 *
 * A LOOP, NOT TWO STRIPS IN A FIXED ORDER, because the source uses both
 * orders: `OF MERCY (FOUR ARTICLES) [*The one Latin word...]` and
 * `OF BACKBITING [*Or detraction] (FOUR ARTICLES)` are both real. Peeling in
 * one order left half of them with the other suffix still attached -- and
 * worse than cosmetically, since a lowercase note still stuck to the head is
 * enough lowercase to drag `isShouted` under its threshold, so exactly those
 * titles kept their capitals. This is what the sweep over all 611 caught.
 *
 * A note the source puts MID-title (`OF ENJOYMENT [*Or, Fruition], WHICH IS
 * AN ACT OF THE WILL`) is not peeled, and should not be: it is a gloss on one
 * word rather than a footnote to the whole, and it belongs where the edition
 * put it. It recases along with the rest, which is right for a note set in
 * the same capitals as its title.
 */
function splitQuestion(title: string): { head: string; note: string } {
	let head = title.trim();
	let note = '';
	for (;;) {
		const asNote = NOTE_RE.exec(head);
		if (asNote) {
			note = note ? `${asNote[1]} ${note}` : asNote[1];
			head = head.slice(0, asNote.index).trim();
			continue;
		}
		const asCount = COUNT_RE.exec(head);
		if (asCount) {
			head = head.slice(0, asCount.index).trim();
			continue;
		}
		return { head, note };
	}
}

/**
 * Capitalize a single word, leaving any leading punctuation (`(`, `"`) alone
 * and capitalizing again after an internal hyphen, so `SELF-EVIDENT` comes
 * out `Self-Evident` rather than `Self-evident`. An apostrophe is NOT such a
 * boundary: `GOD'S` is one word and wants `God's`.
 */
function capitalize(word: string): string {
	return word
		.toLowerCase()
		.replace(/(^|-)(\p{L})/gu, (_, sep: string, ch: string) => sep + ch.toUpperCase());
}

function titleCase(title: string): string {
	// Split on whitespace but KEEP it, so the original spacing (including the
	// double space CCEL occasionally leaves) survives the round trip.
	const parts = title.split(/(\s+)/);
	let startOfClause = true;

	return parts
		.map((part) => {
			if (/^\s+$/.test(part) || part === '') return part;

			// The bare word, with surrounding punctuation set aside: `(QQ[2]-26)`
			// must be recognised as `QQ` for `KEEP_UPPER`, and `DOCTRINE?` as
			// `doctrine` for `MINOR`.
			const core = part.replace(/^[^\p{L}\p{N}]+/u, '').replace(/[^\p{L}\p{N}]+$/u, '');
			const wasStart = startOfClause;
			// A colon or a dash ends the clause; the next word starts a new one.
			startOfClause = /[:;—–-]$/.test(part);

			if (KEEP_UPPER.has(core)) return part;
			// A token carrying lowercase of its own is already cased -- the
			// `i.e.` inside an otherwise-shouted heading, which `capitalize`
			// would render `I.e.`. Only shouted tokens get recased.
			if (/\p{Ll}/u.test(part)) return part;
			if (!wasStart && MINOR.has(core.toLowerCase())) return part.toLowerCase();
			return capitalize(part);
		})
		.join('');
}

/** `TREATISE ON THE ONE GOD (QQ[2]-26)` -> `Treatise on the One God (QQ 2-26)`. */
export function summaHeadingTitle(title: string): string {
	// `QQ[2]-26` -> `QQ 2-26`; a bracketed number anywhere else just loses the
	// brackets, since the space only reads correctly after the abbreviation.
	const unbracketed = title.replace(/\b(QQ?)\[(\d+)\]/g, '$1 $2').replace(/\[(\d+)\]/g, '$1');
	return isShouted(unbracketed) ? titleCase(unbracketed) : unbracketed;
}

/** The title alone, note and article count both removed. */
function questionHead(title: string): string {
	const { head } = splitQuestion(title);
	return isShouted(head) ? titleCase(head) : head;
}

/**
 * A heading split into its title and the translator's note that follows it —
 * because they are a TITLE AND A SUBTITLE, not one long line.
 *
 * 28 article titles and 17 question titles carry a trailing `[* … ]` note,
 * and run together they read as one runaway sentence:
 *
 *     Whether goodness is rightly divided into the virtuous*, the useful and
 *     the pleasant? [*"Bonum honestum" is the virtuous good considered as
 *     fitting. (cf. SS, Q[141], A[3]; SS, Q[145])]
 *
 * The note is the edition explaining a term it knew would read oddly in
 * English, so it is neither part of the title nor droppable — it wants its
 * own line, in its own weight, which is what returning the two separately
 * lets a caller do. Cross-references inside it are debracketed like any
 * other (`summaRefLabel`); they are the same CCEL artifact.
 *
 * A note the source sets MID-title (`Whether there is knowledge [*Scientia]?`)
 * is a gloss on one word rather than a subtitle, and stays in `title` where
 * the edition put it — `splitQuestion` peels only trailing notes.
 *
 * `note` is `''` when there is none, which is the common case by far.
 */
export function summaTitleParts(title: string): { title: string; note: string } {
	const { note } = splitQuestion(title);
	return { title: questionHead(title), note: note ? summaRefLabel(note) : '' };
}

/**
 * The same title for a COMPACT LIST -- the landing page's question grid and
 * the reading sidebar -- where a paragraph-long translator's note is not
 * supplementary but overwhelming: eleven rows would run several times the
 * height of every other row in a 17rem column. The note stays on the reading
 * page, one click away, which is where a reader who wants it is going.
 */
export function summaQuestionLabel(title: string): string {
	return questionHead(title);
}

/**
 * A self-citation's visible text, with CCEL's anchor brackets unpicked:
 * `Q[74], A[2]` -> `Q 74, A 2`, `(A[3])` -> `(A 3)`.
 *
 * The same artifact `summaHeadingTitle` removes from a treatise heading, in
 * the place it actually occurs 5,180 times. The brackets are how CCEL wrote
 * the anchor text around the numbers it linked; they are not a citation
 * convention anyone reads or writes, and now that the link itself is restored
 * (`parseStoredRef`) they are doubly odd — a bracketed number inside a live
 * link to the thing it names.
 *
 * DEBRACKETING ONLY, not rewriting. `Q 74, A 2` is not how a scholastic
 * citation is normally set (`q. 74, a. 2` is), but normalising the notation
 * would be rewriting the edition's words rather than removing an artifact of
 * its markup, and the line between those two is the whole reason this module
 * is a display layer and not a corrections file.
 */
export function summaRefLabel(text: string): string {
	return text.replace(/\b(QQ?|AA?)\[(\d+)\]/g, '$1 $2');
}
