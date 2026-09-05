/**
 * The ten public-domain works `/schola` is illustrated with.
 *
 * ## Why this file holds prose that is not in a dictionary
 *
 * A caption here is `Artist, Title, year. Institution.` — proper nouns and a
 * date, in the language the work is catalogued in, and nothing else. There is
 * no sentence to translate, which is the whole reason the identification lives
 * beside the asset rather than as thirty-seven `schola.art.*` keys. The one
 * word that IS interface text is "detail", and it is a key.
 *
 * The images are `alt=""` and the caption carries the identification, the
 * arrangement `Plate.svelte` already uses for Doré: an illustration beside a
 * route is not information the page would be incomplete without, and a screen
 * reader that reads out "Antonello da Messina, Saint Jerome in his Study,
 * c. 1475" twice — once as alt, once as caption — is worse served than one
 * that reads it once.
 *
 * ## Public domain, and how far that is checked
 *
 * The latest death here is Millet, 1875, so every work is out of copyright in
 * every jurisdiction; the Trent panel is anonymous and sixteenth-century. A
 * faithful photograph of a flat public-domain work originates no new copyright
 * of its own — the position `pipeline/scrapers/dore/dore.py` argues at length
 * for the engravings, citing Bridgeman v. Corel, and it is the same position
 * here. `source` is the Commons file page, which carries the licence tag and
 * the digitizing institution's own terms.
 *
 * ## `paper`
 *
 * Ink on a WHITE sheet, which the Rembrandt etching alone is. It takes
 * `--plate-blend`, so the paper multiplies away into the page the way an
 * engraving in a reading column does. A painting must not: the blend is tuned
 * for a grey scan on white and turns an oil into mud. Neither may a drawing on
 * a prepared ground — Dürer's hands are ink on paper and the paper is blue, so
 * the same blend would only darken it. Under `[data-mono]` all ten are
 * desaturated instead: a reader who asked for one grey ramp is not handed four
 * colour paintings.
 *
 * ## Re-deriving one
 *
 * `assets/README.md` records the source URL, the SHA-256 of the file that was
 * downloaded, and the crop box and encoder line for each. No master is kept:
 * these are faithful crops with no retouching, so the command reproduces the
 * asset exactly, and the ten masters are 77 MB in a public repository. The
 * reynard drollery keeps its master because it was cut and painted by hand and
 * no command reproduces it.
 */

import heroJerome from '$lib/assets/schola/hero-jerome.avif';
import pillarsDisputa from '$lib/assets/schola/pillars-disputa.avif';
import gospelsPreaching from '$lib/assets/schola/gospels-preaching.avif';
import socialGleaners from '$lib/assets/schola/social-gleaners.avif';
import shelfScripture from '$lib/assets/schola/shelf-scripture.avif';
import shelfCatechism from '$lib/assets/schola/shelf-catechism.avif';
import shelfMagisterium from '$lib/assets/schola/shelf-magisterium.avif';
import shelfLaw from '$lib/assets/schola/shelf-law.avif';
import shelfTheologian from '$lib/assets/schola/shelf-theologian.avif';
import shelfPrayers from '$lib/assets/schola/shelf-prayers.avif';

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

const BANNER = { width: 1800, height: 720 } as const;
const VIGNETTE = { width: 400, height: 400 } as const;

/** The banner over the page's title, and over each route. */
export const BANNERS: Readonly<Record<string, Artwork>> = {
	hero: {
		...BANNER,
		src: heroJerome,
		credit: 'Antonello da Messina, Saint Jerome in his Study, c. 1475. National Gallery, London.',
		detail: true,
		paper: false,
		source:
			'https://commons.wikimedia.org/wiki/File:Antonello_da_Messina_-_St_Jerome_in_his_study_-_National_Gallery_London.jpg'
	},
	pillars: {
		...BANNER,
		src: pillarsDisputa,
		credit: 'Raphael, Disputation of the Holy Sacrament, 1509–11. Stanza della Segnatura, Vatican.',
		detail: true,
		paper: false,
		source:
			'https://commons.wikimedia.org/wiki/File:Sanzio,_Raffaello_-_Disputa_del_Sacramento_-_1508-1511_-_hi_res.jpg'
	},
	gospels: {
		...BANNER,
		src: gospelsPreaching,
		credit:
			'Rembrandt van Rijn, Christ Preaching (“La Petite Tombe”), c. 1657. Metropolitan Museum of Art.',
		detail: true,
		paper: true,
		source:
			'https://commons.wikimedia.org/wiki/File:Christ_Preaching,_called_La_Petite_Tombe_MET_DP832290.jpg'
	},
	social: {
		...BANNER,
		src: socialGleaners,
		credit: 'Jean-François Millet, The Gleaners, 1857. Musée d’Orsay, Paris.',
		detail: true,
		paper: false,
		source:
			'https://commons.wikimedia.org/wiki/File:Jean-Fran%C3%A7ois_Millet_-_Gleaners_-_Google_Art_Project_2.jpg'
	}
};

/**
 * One per shelf, keyed by the shelf's own key in `/schola`.
 *
 * Each is a portrait of the kind of book the shelf holds rather than a
 * decoration: an evangelist being dictated to, a disputation, a council in
 * session, a pope promulgating law, a theologian with his own book open, and
 * hands. That is the axis the shelves are sorted on.
 */
export const VIGNETTES: Readonly<Record<string, Artwork>> = {
	scripture: {
		...VIGNETTE,
		src: shelfScripture,
		credit: 'Caravaggio, The Inspiration of Saint Matthew, 1602. San Luigi dei Francesi, Rome.',
		detail: true,
		paper: false,
		source:
			'https://commons.wikimedia.org/wiki/File:The_Inspiration_of_Saint_Matthew-Caravaggio_(1602).jpg'
	},
	catechism: {
		...VIGNETTE,
		src: shelfCatechism,
		credit:
			'Albrecht Dürer, Christ among the Doctors, 1506. Museo Nacional Thyssen-Bornemisza, Madrid.',
		detail: true,
		paper: false,
		source:
			'https://commons.wikimedia.org/wiki/File:Albrecht_D%C3%BCrer_-_Jesus_among_the_Doctors_-_Google_Art_Project.jpg'
	},
	magisterium: {
		...VIGNETTE,
		src: shelfMagisterium,
		credit: 'The Council of Trent, anonymous, 16th century. Museo del Buonconsiglio, Trento.',
		detail: true,
		paper: false,
		source: 'https://commons.wikimedia.org/wiki/File:Concilio_Trento_Museo_Buonconsiglio.jpg'
	},
	law: {
		...VIGNETTE,
		src: shelfLaw,
		credit: 'Raphael, Gregory IX Approving the Decretals, 1511. Stanza della Segnatura, Vatican.',
		detail: true,
		paper: false,
		source:
			'https://commons.wikimedia.org/wiki/File:Gregory_IX_approving_decretals_Raphael_Rooms.jpg'
	},
	theologian: {
		...VIGNETTE,
		src: shelfTheologian,
		credit: 'Benozzo Gozzoli, The Triumph of Saint Thomas Aquinas, 1471. Musée du Louvre, Paris.',
		detail: true,
		paper: false,
		source:
			'https://commons.wikimedia.org/wiki/File:Le_Triomphe_de_saint_Thomas_d%27Aquin_-_Benozzo_Gozzoli_-_Mus%C3%A9e_du_Louvre_Peintures_INV_104_;_MR_255_-_avec_cadre.jpg'
	},
	prayers: {
		...VIGNETTE,
		src: shelfPrayers,
		credit: 'Albrecht Dürer, Praying Hands, 1508. Albertina, Vienna.',
		detail: true,
		// Ink on paper, but the paper is PREPARED BLUE. The blend multiplies a
		// white sheet away and would only darken this one.
		paper: false,
		source:
			'https://commons.wikimedia.org/wiki/File:Albrecht_D%C3%BCrer_-_Praying_Hands,_1508_-_Google_Art_Project.jpg'
	}
};
