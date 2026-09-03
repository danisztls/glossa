/**
 * Dansk UI strings.
 *
 * One module per interface language (see `../i18n.svelte.ts` for the store
 * that picks between them). Keys are the English module's, in its order;
 * anything left out falls back to English rather than showing the key.
 *
 * Added 2026-08-31, with the other content languages that had no interface.
 * The corpus holds 3 editions in Dansk and its readers were reading
 * them inside English chrome, which is the combination `../ui-langs.ts` says
 * the interface list should never leave standing.
 *
 * COMPLETE SINCE 2026-09-02, colophon included. The long colophon prose was
 * deliberately omitted when this file was written: a machine translation of the
 * page explaining how carefully this site handles other people's words would be
 * the one page whose form contradicts its content. That was reversed on the
 * judgement that a reader who cannot read the page cannot weigh it either, and
 * that an English wall is not more honest than a translation -- see
 * `docs/decisions.md`. IT HAS NOT BEEN READ BY A NATIVE SPEAKER.
 * `colophon.whatThisIsStanding` and `footer.notEndorsed` (the canonical
 * standing statement, Can. 216 CIC, at full length and in the one line the
 * footer of every page carries) and `colophon.copyrightBody3` (how a rights
 * holder reaches us) are the ones to check first: all three are operative
 * rather than descriptive. Deleting a
 * doubtful line is a valid fix -- it falls back to English.
 * Every key `CHROME_KEYS` requires is here, since an unnamed chrome page fails
 * the sync rather than falling back.
 *
 * The language names in `LanguageMenu.svelte` and `corpus.ts` are written in
 * their own language on purpose and are not translated here.
 */

import type { Dictionary } from '../i18n.svelte';

export const da: Dictionary = {
	'nav.bible': 'Bibelen',
	'nav.ccc': 'Katekismus',
	'nav.compendium': 'Kompendium',
	'nav.magisterium': 'Læreembedet',
	'nav.socialDoctrine': 'Sociallære',
	'socialDoctrine.landing.title': 'Kompendium over Kirkens sociallære',
	'socialDoctrine.landing.tagline': 'Hvad Kirken lærer om livet i samfundet, i 583 numre.',
	'nav.prayers': 'Bønner',
	'nav.bookmarks': 'Bogmærker',
	'nav.menu': 'Menu',
	'nav.summa': 'Summa',
	'home.title': 'Glossa Catholica',
	'home.continueReading': 'Fortsæt læsning',
	'home.works': 'Bibliotek',
	'home.ccc.heading': 'Katekismus og Kompendium',
	'home.magisterium.mostRecent': 'Nyeste',
	'home.prayers.heading': 'Bønner',
	'unitNav.previous': 'Forrige',
	'unitNav.next': 'Næste',
	'bible.landing.title': 'Bibelen',
	'bible.landing.tagline': 'Læs hele Bibelen, bog for bog, kapitel for kapitel.',
	// All nine, because `bible-groups.test.ts` requires the set to be
	// complete in every interface language rather than partial: one
	// English heading among eight translated ones reads as a bug.
	'bible.group.pentateuch': 'Pentateuken',
	'bible.group.historical': 'Historiske bøger',
	'bible.group.wisdom': 'Visdomsbøger',
	'bible.group.prophetic': 'Profetiske bøger',
	'bible.group.gospels': 'Evangelierne',
	'bible.group.acts': 'Apostlenes Gerninger',
	'bible.group.pauline': 'Paulusbrevene',
	'bible.group.catholicLetters': 'De katolske breve',
	'bible.group.revelation': 'Åbenbaringen',
	'ccc.landing.title': 'Den Katolske Kirkes Katekismus',
	'ccc.landing.tagline':
		'<strong>Katekismen</strong> fremlægger den katolske lære i 2.865 nummererede afsnit. <strong>Kompendiet</strong> gengiver den samme lære som 598 spørgsmål og svar efter samme disposition.',
	'document.library.tagline':
		'Encyklikaer, konciliære konstitutioner, dekreter og erklæringer fra Læreembedet.',
	'doctores.landing.title': 'Kirkelærere',
	'doctores.landing.tagline': 'Kirkefædrenes og kirkelærernes teologiske værker.',
	'summa.landing.title': 'Summa Theologiae',
	'summa.landing.tagline': 'Thomas Aquinas, på engelsk og på det latin han skrev.',
	'prayers.landing.title': 'Almindelige bønner',
	'prayers.landing.tagline': 'Bønner med den latinske tekst ved siden af.',
	'colophon.title': 'Kolofon',
	'colophon.lede':
		'Hvad dette websted er, hvor teksterne kommer fra, og hvor vi står med hensyn til at gengive dem.',
	'colophon.whatThisIs': 'Hvad dette er',
	'colophon.whatThisIsBody':
		'Glossa Catholica er et læsested for Skriften, Katekismen, Kompendiet og Læreembedets dokumenter, på engelsk, portugisisk og latin. Det findes for at blive læst, og der bedes ikke om andet af dig for at læse det:',
	'colophon.pointFree':
		'Gratis, og altid gratis. Ingen betalingsmur, intet abonnement, intet at købe.',
	'colophon.pointNoAds': 'Ingen reklamer og ingen sponsoreret placering af nogen art.',
	'colophon.pointNoAccounts': 'Ingen konti. Intet at tilmelde sig, intet at logge ind på.',
	'colophon.pointNoTracking':
		'Ingen sporingsscripts, ingen tredjepartskode, ingen cookies. Kun anonyme brugstællinger, uden noget der identificerer dig.',
	'colophon.pointOffline':
		'Bygget til at blive ved med at virke offline, når du først har besøgt det, så en dårlig forbindelse ikke behøver være en hindring for læsningen.',
	'colophon.whatThisIsStanding':
		'Glossa Catholica er et privat foretagende af lægfolk. Det bærer ingen kirkelig godkendelse og taler med ingen myndighed af sig selv.',
	'footer.notEndorsed': 'Ikke godkendt af Den Hellige Stol',
	'colophon.textsTitle': 'Teksterne',
	'colophon.textsBody':
		'Hver tekst kommer fra en navngiven kilde, og hvert værk angiver sin udgave, sin kildeside og datoen, hvor den blev hentet. Skriften bruger oversættelser i det offentlige domæne; Katekismen, Kompendiet og Læreembedets dokumenter kommer fra Den Hellige Stols egne udgivne tekster.',
	'colophon.textsFidelity':
		'Teksten forkortes aldrig, parafraseres aldrig, omskrives aldrig og placeres aldrig ved siden af reklamer. Vi udbedrer dog åbenlyse fejl — et bortfaldet ord, en forvansket henvisning, opmærkning der slugte et afsnit — altid i retning af hvad kilden selv trykker, aldrig i retning af hvad vi mener den burde sige.',
	'colophon.countBible': 'bibeludgaver',
	'colophon.countDocuments': 'dokumenter fra Læreembedet',
	'colophon.copyrightTitle': 'Ophavsret',
	'colophon.copyrightBody1':
		'Katekismen, Kompendiet og Læreembedets dokumenter tilhører deres rettighedshavere — først og fremmest Libreria Editrice Vaticana og Dikasteriet for Kommunikation.',
	'colophon.copyrightBody2':
		'Hvert værk viser sin rettighedshavers egen ophavsretsmeddelelse, med deres ordlyd, og henviser til den side, det er taget fra.',
	'colophon.copyrightBody3':
		'Hvis du har rettigheder til nogen tekst her og hellere så, at den ikke blev offentliggjort, så skriv til os.',
	'colophon.contactTitle': 'Kontakt',
	'colophon.contactBody': 'For hvad som helst, herunder ovenstående:',
	'colophon.contactPending':
		'Der er endnu ikke oprettet en kontaktadresse. Dette websted bør ikke offentliggøres, før det har en — forpligtelsen ovenfor betyder intet uden en måde at nå os på.',
	'colophon.illustrationsTitle': 'Illustrationerne',
	'colophon.illustrationsBody':
		'Bibelen bærer Gustave Dorés stik, hvert placeret ved det vers, det skildrer — den sidste og største af hans bibelcyklusser, skåret i træ efter hans tegninger og trykt sammen med teksten frem for samlet bagest.',
	'colophon.illustrationsRights':
		'De er i det offentlige domæne, som datoerne nedenfor viser, og en tro fotografisk gengivelse af et stik i det offentlige domæne bærer ingen ny ophavsret af sig selv.',
	'colophon.countPlates': 'stik',
	'colophon.countPlateChapters': 'illustrerede kapitler',
	'colophon.typeTitle': 'Skriften',
	'colophon.typeBody':
		'Sat med EB Garamond, Georg Duffner og Octavio Pardos genoplivning af de typer, Claude Garamont skar i 1590erne — den humanistiske tradition, Kirken har trykt i siden renæssancen. Dens kyrilliske er af de samme hænder, men genopliver intet: der blev aldrig skåret en kyrillisk Garamond, så russisk er sat i en form tegnet til at stå ved siden af resten.',
	'colophon.typeArabic':
		'Arabisk er helt uden for dens rækkevidde og er sat med Amiri — Khaled Hosnys genoplivning af den naskh, der blev skåret til Bulaq-trykkeriet i Kairo i 1905, valgt ud fra samme ræsonnement som tekstskriften: en bestemt historisk bogtype frem for en nutidig tegning.',
	'colophon.typeInitials':
		'Åbningsinitialerne er Pirata One, en gotisk skrift hvis versaler forbliver læselige i den størrelse, en initial kræver, og — for russisk — Ponomar, som gengiver Synodaltrykkeriets kirkeslaviske type. Ponomar sætter initialen og aldrig teksten: en moderne encyklika sat helt igennem med synodaltype ville sige noget usandt om, hvad den er. Alle er licenseret under SIL Open Font License og leveres fra dette websted frem for fra en tredjepart, så det at læse en side ikke beder om noget fra en andens server.'
};
