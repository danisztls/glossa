/**
 * The public-domain paintings the landing pages are illustrated with: one
 * each on `/schola` and `/bibliotheca`, and no other picture on either. A
 * banner over `/schola`'s title; on `/bibliotheca` a 300px band under the
 * last shelf since 2026-09-06, opening to the whole picture on a press,
 * because a catalogue's reader came for the catalogue. `BANNERS` is now the
 * derivation's name rather than the role, the same way the filenames are.
 *
 * ## IT WAS FOUR OVER ONE PAGE, AND IS TWO OVER TWO
 *
 * Raphael's *Disputa* headed "The four pillars" and Millet's *Gleaners* headed
 * "The Church's social teaching"; both routes were removed on 2026-09-05, and a
 * banner with nothing under it is a picture the reader downloads for no reason.
 * The two that survived then swapped pages, which is the arrangement each was
 * always better suited to: **Antonello's Jerome is a man alone in a room full
 * of books, which is a library**, and **Rembrandt's preaching Christ is
 * somebody being taught, which is what `/schola` is**. They had been the other
 * way round only because `/schola` was illustrated first and took the best
 * picture in the set for its masthead.
 *
 * `assets/README.md` keeps the source URL, SHA-256 and crop line for all six,
 * so a page that wants one back gets it from one fetch and one crop — which
 * is the whole reason deleting one is cheap. **The FILENAMES are the
 * derivation's names and not the pages' roles**
 * (`hero-jerome` is now Library's, `gospels-preaching` is now the only
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
 * ## Re-deriving one
 *
 * `assets/README.md` records the source URL, the SHA-256 of the file that was
 * downloaded, and the crop box and encoder line for each. A faithful crop
 * keeps no master: the command reproduces the asset exactly and a master is
 * tens of megabytes in a public repository, so the recipe is the copy.
 *
 * **TWO OF THE THREE ARE NOT FAITHFUL CROPS AND BOTH KEEP THEIR MASTERS.**
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

export interface Artwork {
	/** The hashed build-asset URL Vite resolved the import to. */
	src: string;
	width: number;
	height: number;
	/** `Artist, Title, year. Institution.` — never a sentence. */
	credit: string;
	/** True when the caption should say the image is a crop. */
	detail: boolean;
	/** Ink on paper, so the scan's white may multiply away. See above. */
	paper: boolean;
	/** The Commons file page: licence tag, digitizer, and the master. */
	source: string;
}

/**
 * THE TWO ARE NO LONGER ONE SHAPE, and `BANNER` — a `{ width: 1800, height:
 * 720 }` spread into both — went with the assumption. A banner IS 2.5:1
 * whatever hangs under it, and `/bibliotheca`'s picture stopped being one on
 * 2026-09-06 when it moved under the last shelf.
 *
 * **THE FILE'S RATIO AND THE SLOT'S ARE NOW TWO DIFFERENT QUESTIONS, which is
 * why one constant could not answer both.** `hero-jerome` is 1600×727,
 * cropped to the study and no tighter, because that is how much painting is
 * worth having; `/bibliotheca` draws it 300px tall with `object-fit: cover`,
 * because that is how much page a tailpiece may take under a catalogue.
 * Nothing is lost between the two — the band is a window, and a press opens
 * the file whole in `PlateViewer`.
 *
 * So these two numbers are the intrinsic pixels and nothing more: the `<img>`
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
	}
};
