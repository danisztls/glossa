/**
 * The public-domain paintings the landing pages are illustrated with: one
 * each on `/schola`, `/bibliotheca`, `/quaestiones` and `/scriptura`, and no
 * other picture on any of them. A banner over `/schola`'s title; a band under
 * the last of what `/bibliotheca` and `/quaestiones` came to offer; and on
 * `/scriptura` a band in the MIDDLE of the list, on the seam between the
 * Testaments. All three bands open to more of the picture on a press, because
 * an index's reader came for the index. `BANNERS` is now the derivation's name
 * rather than the role, the same way the filenames are — and it was never the
 * position either.
 *
 * ## A picture earns its page by a sentence, and the sentence is about both
 *
 * Antonello's Jerome is a man alone in a room full of books, which is a
 * library; Rembrandt's preaching Christ is somebody being taught, which is
 * what `/schola` is; Raphael's disputing doctors are people arguing about one
 * thing with the answer on the table between them, which is what
 * `/quaestiones` is; Michelangelo's two hands are Genesis 2:7, which is the
 * first thing that happens in the first of the books `/scriptura` lists, and
 * they do not touch — what crosses the gap is a word, which is what a text
 * is. A picture with no such sentence is decoration, and the test is that the
 * sentence discriminates — one true of every page is worth nothing.
 *
 * It was four over one page before 2026-09-05. Raphael's *Disputa* headed
 * "The four pillars" and Millet's *Gleaners* headed "The Church's social
 * teaching"; both routes were removed, and a banner with nothing under it is a
 * picture the reader downloads for no reason. The two that survived then
 * swapped pages, each to the page its own sentence named — they had been the
 * other way round only because `/schola` was illustrated first and took the
 * best picture in the set for its masthead.
 *
 * The *Disputa* came back on 2026-09-11 for a page that did not exist when it
 * left, and it is a different picture now: what ships is the earthly register
 * alone. Cropping the heaven off is what makes the sentence true, since the
 * whole fresco is the Church agreeing with itself in glory and the half below
 * the clouds is an argument.
 *
 * `/scriptura` was illustrated the same day, and is the one page whose picture
 * was not cut HERE: the panel was cut, rotated and straightened by an editor
 * on Commons and published as a file in its own right, so what this repository
 * does is fetch it.
 *
 * `assets/README.md` keeps the source URL, SHA-256 and crop line for every
 * one of them, withdrawn ones included, so a page that wants a picture back
 * gets it from one fetch and one crop — which is the whole reason deleting
 * one is cheap. **The FILENAMES are the derivation's names and not the pages'
 * roles** (`hero-jerome` is now Library's, `gospels-preaching` is now the only
 * picture on `/schola`); renaming them would mean re-deriving both assets and
 * rewriting the table that reproduces them, to fix nothing a reader can see.
 *
 * ## Why this file holds prose that is not in a dictionary
 *
 * A caption here is `Artist, Title, year. Institution.` — proper nouns and a
 * date, in the language the work is catalogued in, and nothing else. There is
 * no sentence to translate, which is the whole reason the identification lives
 * beside the asset rather than as a `schola.art.*` key per picture in every
 * dictionary. The two strings that ARE interface text — the word "detail" and
 * the name of the control that shows the credit — are keys.
 *
 * The images are `alt=""` and the credit carries the identification, the
 * arrangement `Plate.svelte` already uses for Doré: an illustration over a
 * section is not information the page would be incomplete without, and a screen
 * reader that reads out "Antonello da Messina, Saint Jerome in his Study,
 * c. 1475" twice — once as alt, once as caption — is worse served than one
 * that reads it once. `ArtFigure.svelte` puts the credit behind the same
 * caption trigger a plate uses, so the identification is one press away
 * instead of set as a line under every picture.
 *
 * ## THE SHELVES HAD PAINTINGS TOO, AND NOW HAVE ICONS
 *
 * "What each of these is" carried six 400px vignettes — an evangelist being
 * dictated to, a disputation, a council, a pope promulgating law, a theologian
 * with his own book open, and Dürer's hands. They were the best-argued part of
 * the set and they were still wrong for that section, which is the one place
 * on this page that is not illustration: it is six definitions of what kind of
 * authority a shelf carries, and a reader arrives at it not knowing the
 * difference between a catechism and a council. A painting of a council is a
 * picture to look at while reading the definition. A glyph is a mark that
 * belongs to the row, reads at a glance, and does not compete with the
 * sentence beside it — which is what that section is FOR.
 *
 * They are `Icon.svelte` names, chosen on each work's own axis (see
 * `/schola`'s `WORKS`), and they cost no bytes: `@lucide/svelte` tree-shakes
 * to the icons actually named. That also took 147 KB of AVIF out of the build.
 *
 * ## Public domain, and how far that is checked
 *
 * The latest death here is Rembrandt, 1669, so every work is out of copyright
 * in every jurisdiction — it was Millet, 1875, until his *Gleaners* left with
 * the social-teaching route. A faithful photograph of a flat public-domain work
 * originates no new copyright of its own — the position
 * `pipeline/scrapers/dore/dore.py` argues at length for the engravings, citing
 * Bridgeman v. Corel, and it is the same position here. `source` is the
 * Commons file page, which carries the licence tag and the digitizing
 * institution's own terms.
 *
 * ## `paper`
 *
 * Ink on a WHITE sheet, which the Rembrandt etching alone is. It takes
 * `--plate-blend`, so the paper multiplies away into the page the way an
 * engraving in a reading column does. A painting must not: the blend is tuned
 * for a grey scan on white and turns an oil into mud. Under `[data-mono]` both
 * are desaturated instead: a reader who asked for one grey ramp is not handed
 * an oil painting.
 *
 * ## `whole`, and why one picture ships twice
 *
 * A band is a window on the file, and until 2026-09-11 what a press opened was
 * the rest of that same file — Jerome's ceiling and floor, one fetch already
 * spent. The *Disputa* cannot work that way: the band is the earthly register,
 * and the thing worth opening is not more of that strip but the fresco it was
 * cut from, heaven included. So the artwork carries a second rendition at a
 * different FRAMING, and `ArtFigure` opens the viewer on it.
 *
 * This is not `PlateViewer`'s `detailSrc`, which is the same framing at more
 * pixels and is fetched only on an explicit zoom. Two framings need two
 * intrinsic ratios, and that view reserves its stage from the ones it is
 * handed.
 *
 * What it costs is the claim that opening is free: the band is in the cache
 * and the whole is not, so a press is a fetch. Only a reader who asks for the
 * fresco pays it, which is the right reader to charge.
 *
 * **THE FIELD IS NAMED FOR THE FIRST CASE AND IS NOT LIMITED TO IT.** What it
 * holds is what a press opens, and `/scriptura` runs the relation the other
 * way. Its FILE is the Creation panel entire; what the page draws is a band of
 * the two hands, `--art-height` cropping it at the seam between the Testaments;
 * and what opens is neither of those but the panel in its SETTING, the vault
 * around it with the ignudi and the painted architecture. So a press there
 * restores what the slot cropped AND adds where the thing is, in one move.
 * Both directions answer the same question, which is whether pressing the
 * picture shows the reader anything they cannot already see.
 *
 * It is worth being exact about what that costs, because it is the one case
 * where the chain skips a rung: the reader never meets the panel at its own
 * framing, the band going straight to the vault. That is the right trade only
 * because the vault CONTAINS the panel whole — nothing the band cropped is
 * unreachable, it is merely smaller. A `whole` that did not contain the band
 * would be a different thing and would need saying so.
 *
 * **AND THE SECOND FRAMING MAY BE A SECOND FILE, in which case it is a second
 * file page too.** The *Disputa*'s two renditions came off one download and
 * the Creation's did not — but they are not two photographs. The band is a
 * Commons DERIVATIVE of the very file `whole` ships: one editor's rotation,
 * crop and perspective correction of `Creación de Adán.jpg`, published as a
 * file of its own, which is why no crop box in `assets/README.md` can
 * reproduce it and why it is fetched rather than cut. So `whole` may carry its
 * own `source`, and `ArtFigure` links whichever file the reader is actually
 * looking at. A credit that names the wrong file is the same defect as a
 * credit that links nothing — it asks to be taken on trust.
 *
 * **Commons declares the relation, which is what makes the pair checkable
 * rather than our assertion**: the band's file page carries `Extracted from`
 * naming the parent, so a reader following either link can see the other. The
 * pairing is somebody else's published claim, not a resemblance noticed here.
 *
 * The visible cost is GEOMETRY and not colour — the two agree to within a
 * point on every channel's mean, having one photograph behind them. What
 * shifts on a press is the perspective: the panel straightened toward what the
 * fresco would show laid flat, against the vault as the camera found it. That
 * is the price of showing the setting at all, since the alternative is the
 * corrected panel pasted into the uncorrected vault, which would be a
 * composite and would need saying so.
 *
 * ## Re-deriving one
 *
 * `assets/README.md` records the source URL, the SHA-256 of the file that was
 * downloaded, and the crop box and encoder line for each. A faithful crop
 * keeps no master: the command reproduces the asset exactly and a master is
 * tens of megabytes in a public repository, so the recipe is the copy. Both
 * of the Creation's renditions are that recipe minus the crop — a fetch and a
 * resize, no box at all.
 *
 * **HAND WORK SOMEBODY ELSE PUBLISHED NEEDS NO MASTER HERE.** The band is a
 * rotation, a crop and a perspective correction, which is exactly the kind of
 * work the rule below says keeps its master — and that master is a Commons
 * file with a page, a licence tag and a SHA-256 in `assets/README.md`. The
 * rule is about a derivation nobody else can reproduce, not about who moved
 * the pixels.
 *
 * **TWO OF THEM ARE NOT FAITHFUL CROPS AND BOTH KEEP THEIR MASTERS.**
 * The reynard drollery was cut and painted by hand, and `hero-jerome` was
 * cropped and tone-corrected by hand on 2026-09-06 — brightened and pulled
 * open, because the National Gallery's photograph is dark and yellow and the
 * shelves behind Jerome close into one brown at the size the page draws them.
 * No command reproduces either, and hand work with no master is gone the next
 * time the slot wants a different shape, which is exactly what happened that
 * day.
 *
 * **AND JEROME'S MASTER IS NOT IN THIS REPOSITORY.** It is 12 MB, this
 * repository is public, and the corpus repo already tracks binaries that size
 * through LFS for the Doré scans — so it is
 * `authored/art/hero-jerome-adjusted.jpg` in `glossa-corpus`, which is
 * `authored/` by that repo's own second question: the site serves what comes
 * off it, and a person decided it here. The drollery's master stays put at
 * 777 KB, because the rule is the bytes and not the principle.
 */

import heroJerome from '$lib/assets/schola/hero-jerome.avif';
import gospelsPreaching from '$lib/assets/schola/gospels-preaching.avif';
import disputaSacramento from '$lib/assets/schola/disputa-sacramento.avif';
import disputaSacramentoWhole from '$lib/assets/schola/disputa-sacramento-whole.avif';
import creationAdam from '$lib/assets/schola/creation-adam.avif';
import creationAdamWhole from '$lib/assets/schola/creation-adam-whole.avif';

export interface Artwork {
	/** The hashed build-asset URL Vite resolved the import to. */
	src: string;
	width: number;
	height: number;
	/** `Artist, Title, year. Institution.` — never a sentence. */
	credit: string;
	/**
	 * True when the caption should say the image is a crop — a claim about
	 * WHAT THE READER SEES, not about the file. Three of these ship cropped;
	 * the Creation's file is the panel entire and is still `true`, because the
	 * slot it hangs in takes a band across the middle of it with
	 * `object-fit: cover`. A picture the page crops is a detail however whole
	 * the bytes were.
	 */
	detail: boolean;
	/** Ink on paper, so the scan's white may multiply away. See above. */
	paper: boolean;
	/** The Commons file page: licence tag, digitizer, and the master. */
	source: string;
	/**
	 * What a press opens, when the picture on the page is not all there is
	 * to see — see `whole` above. Its own intrinsic pixels, because a second
	 * framing is a second ratio. Absent where a press has nothing new to
	 * show.
	 *
	 * `source` only where the second framing is a second SCAN and therefore
	 * a second file page; it falls back to the artwork's, which is right
	 * whenever both framings were cut from one download.
	 */
	whole?: { src: string; width: number; height: number; source?: string };
}

/**
 * THESE ARE NOT ONE SHAPE, and `BANNER` — a `{ width: 1800, height: 720 }`
 * spread into every entry — went with the assumption. A banner IS 2.5:1
 * whatever hangs under it, and `/bibliotheca`'s picture stopped being one on
 * 2026-09-06 when it moved under the last shelf.
 *
 * **THE FILE'S RATIO AND THE SLOT'S ARE TWO DIFFERENT QUESTIONS, which is why
 * one constant could not answer both.** `hero-jerome` is 1600×727, cropped to
 * the study and no tighter, because that is how much painting is worth having;
 * `/bibliotheca` draws it 300px tall with `object-fit: cover`, because that is
 * how much page a tailpiece may take under a catalogue.
 *
 * The two answers may also disagree, and on `/quaestiones` they do. That band
 * is 4.21:1 against a slot that is 3.71:1 at the column's full width, so cover
 * takes a little off each END rather than off the top — the outermost figure
 * at the parapet and the frame at the right. A frieze is the one shape where
 * that matters, its whole subject being the span, which is the second reason
 * that picture ships a `whole` and Jerome does not.
 *
 * **AND ON `/scriptura` THE SLOT IS NOT AT THE FOOT OF THE PAGE AT ALL**, so
 * the second question is asked by a third thing: what a picture may take in
 * the MIDDLE of a list. That band hangs on the seam between the Testaments
 * with 46 books above it and 27 below, and everything under it is still the
 * index — so where a tailpiece may take the room a tailpiece takes, this one
 * is 11rem of a 69.5rem column against a file that would draw itself 32rem
 * tall. The picture is 2.15:1 and the slot is 6.3:1; `cover` takes the sky and
 * Adam's legs and leaves the two hands, which is the one crop of this painting
 * everybody already knows. That is also why its `detail` is true while its
 * file is whole.
 *
 * So these numbers are the intrinsic pixels and nothing more: the `<img>`
 * attributes, the ratio the viewer's stage reserves. They stopped being a
 * layout instruction the moment `--art-height` existed.
 */

/** One painting per landing page, keyed by the page's own path segment. */
export const BANNERS: Readonly<Record<string, Artwork>> = {
	schola: {
		width: 1800,
		height: 720,
		src: gospelsPreaching,
		credit:
			'Rembrandt van Rijn, Christ Preaching (“La Petite Tombe”), c. 1657. Metropolitan Museum of Art.',
		detail: true,
		paper: true,
		source:
			'https://commons.wikimedia.org/wiki/File:Christ_Preaching,_called_La_Petite_Tombe_MET_DP832290.jpg'
	},
	bibliotheca: {
		width: 1600,
		height: 727,
		src: heroJerome,
		credit: 'Antonello da Messina, Saint Jerome in his Study, c. 1475. National Gallery, London.',
		detail: true,
		paper: false,
		source:
			'https://commons.wikimedia.org/wiki/File:Antonello_da_Messina_-_St_Jerome_in_his_study_-_National_Gallery_London.jpg'
	},
	quaestiones: {
		width: 1600,
		height: 380,
		src: disputaSacramento,
		credit:
			'Raffaello Sanzio, Disputa del Sacramento, 1509–1510. Stanza della Segnatura, Musei Vaticani.',
		detail: true,
		paper: false,
		source: 'https://commons.wikimedia.org/wiki/File:Disputa_del_Sacramento_(Rafael).jpg',
		whole: { src: disputaSacramentoWhole, width: 1600, height: 1154 }
	},
	scriptura: {
		width: 1600,
		height: 745,
		src: creationAdam,
		credit:
			'Michelangelo Buonarroti, Creazione di Adamo, c. 1511. Cappella Sistina, Musei Vaticani.',
		detail: true,
		paper: false,
		source: 'https://commons.wikimedia.org/wiki/File:The_Creation_of_Adam_perspective_fix.jpg',
		whole: {
			src: creationAdamWhole,
			width: 1600,
			height: 1069,
			source: 'https://commons.wikimedia.org/wiki/File:Creaci%C3%B3n_de_Ad%C3%A1n.jpg'
		}
	}
};
