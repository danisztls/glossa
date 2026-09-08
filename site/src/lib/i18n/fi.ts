/**
 * Suomi UI strings.
 *
 * One module per interface language (see `../i18n.svelte.ts` for the store
 * that picks between them). Keys are the English module's, in its order;
 * anything left out falls back to English rather than showing the key.
 *
 * Added 2026-08-31, with the other content languages that had no interface.
 * The corpus holds 2 editions in Suomi and its readers were reading
 * them inside English chrome, which is the combination `../ui-langs.ts` says
 * the interface list should never leave standing.
 *
 * COMPLETE SINCE 2026-09-02, colophon included. The long colophon prose was
 * deliberately omitted when this file was written: a machine translation of the
 * page explaining how carefully this site handles other people's words would be
 * the one page whose form contradicts its content. That was reversed on the
 * judgement that a reader who cannot read the page cannot weigh it either, and
 * that an English wall is not more honest than a translation -- see
 * `site/docs/colophon.md`. The confidence note below governs
 * the colophon too.
 * `colophon.whatThisIsStanding` and `footer.notEndorsed` (the canonical
 * standing statement, Can. 216 CIC, at full length and in the one line the
 * footer of every page carries) and `colophon.copyrightBody3` (how a rights
 * holder reaches us) are the ones to check first: all three are operative
 * rather than descriptive.
 *
 * TRANSLATION CONFIDENCE: MEDIUM. Written by an LLM with no native reader
 * in the loop. The chrome vocabulary here is conventional and is likely
 * right; the longer taglines are what to check first. Deleting a doubtful
 * line is a valid fix — English fills the gap per key.
 *
 * THE READER-FACING CONTROLS ARRIVED 2026-09-06 -- the jump box, settings,
 * dark mode, text size, the edition and language pickers, chapter navigation
 * and bookmarks. This file was the shelf titles and the colophon until then,
 * so its reader met their own language around an English interface. Same
 * caveat as everything above: not read by a native speaker.
 *
 * THE CALENDAR ARRIVED 2026-09-06, in two passes on one day -- the 44
 * `calendar.*` keys `/calendarium` labels itself with, its seasons, ranks and
 * colours among them, and then the 31 that TEACH those words
 * (`calendar.gloss.*`, `calendar.primer.*`). Those 31 are prose rather than
 * labels and are what held the page out of `CHROME_PATHS`: both keys
 * `CHROME_KEYS` reads are labels, so the coded gate would have opened on a
 * page whose whole primer was English. Same caveat as everything above.
 *
 * The language names in `lang-names.ts` are written in
 * their own language on purpose and are not translated here.
 */

import type { Dictionary } from '../i18n.svelte';

export const fi: Dictionary = {
	'nav.bible': 'Raamattu',
	'nav.ccc': 'Katekismus',
	'nav.compendium': 'Kompendium',
	'nav.magisterium': 'Opetusvirka',
	'nav.socialDoctrine': 'Sosiaalioppi',
	'socialDoctrine.landing.title': 'Kirkon sosiaaliopin kompendium',
	'socialDoctrine.landing.tagline': 'Mitä kirkko opettaa yhteiskuntaelämästä, 583 numerossa.',
	'nav.canonLaw': 'Kanoninen oikeus',
	'canonLaw.landing.title': 'Kanonisen oikeuden koodeksi',
	'canonLaw.landing.tagline': 'Latinalaisen kirkon oikeus, 1752 kaanonia seitsemässä kirjassa.',
	'canonLaw.canon': 'Kaanon',
	'canonLaw.canons': 'Kaanonit',
	'canonLaw.prevCanon': 'Edellinen kaanon',
	'canonLaw.nextCanon': 'Seuraava kaanon',
	'canonLaw.readFullTitle': 'Lue koko osasto',
	'canonLaw.superseded': 'Sanamuodon korvasi',
	'nav.prayers': 'Rukoukset',
	'nav.bookmarks': 'Kirjanmerkit',
	'nav.menu': 'Valikko',
	'nav.sections': 'Osiot',
	'nav.works': 'Teokset',
	'nav.pages': 'Sivut',
	'nav.summa': 'Summa',
	'home.title': 'Glossa Catholica',
	'reading.continue': 'Jatka lukemista',
	'home.tagline':
		'Lukusivusto Raamatulle, Katekismukselle ja opetusviran asiakirjoille — ilmainen, toimii ilman verkkoyhteyttä, eikä mihinkään tarvitse rekisteröityä.',
	'home.doors.heading': 'Minne mennä',
	'home.find.heading': 'Tai kirjoita viite',
	'nav.library': 'Kirjasto',
	'nav.learn': 'Opi',
	'library.landing.tagline':
		'Koko kokoelma, hylly hyllyltä — ja mihin jäit ja mitä olet merkinnyt.',
	'schola.landing.title': 'Mistä aloittaa',
	'schola.landing.tagline':
		'Lyhyt opas siihen, mitä täällä on: mikä kukin näistä kirjoista on, miten viittaus siihen kirjoitetaan, miten kohta löydetään, ja lukujärjestyksiä, joita kirkko on esittänyt.',
	'schola.start.heading': 'Onko katolisuus sinulle uutta?',
	'schola.start.body': 'Paras aloitus on tämä: ',
	'schola.start.bodyAfter':
		' — sama opetus kuin Katekismuksessa, paljon lyhyempänä, kysymyksinä ja vastauksina. Se on noin kymmenesosan mittainen eikä oleta mitään.',
	'schola.bible.heading': 'Etkö ole koskaan lukenut Raamattua?',
	'schola.bible.library':
		'Se ei ole yksi kirja vaan seitsemänkymmentäkolme, kirjoitettuja yli tuhannen vuoden aikana ja koottuja siihen järjestykseen, johon kirkko päätyi — ei siihen järjestykseen, jossa asiat tapahtuivat, eikä siihen, joka on helpoin lukea. Useimmat aloittavat ensimmäiseltä sivulta ja lopettavat muutamaa viikkoa myöhemmin, keskellä pitkää muinaisen lain lukua, koska kukaan ei ole vielä kertonut heille, mitä varten se on.',
	'schola.bible.step.gospel': 'Aloita evankeliumista',
	'schola.bible.start':
		'Yksi neljästä lyhyestä kirjasta Jeesuksen elämästä, syvällä sisällä eikä edessä. Ajatus ei ole meidän: kirkon kirkolliskokous pyysi, että opetettaisiin Raamatun oikeaa käyttöä, ”erityisesti Uuden testamentin ja ennen kaikkea evankeliumien”. Se ei nimennyt yhtäkään erikseen, emmekä mekään nimeä.',
	'schola.bible.whichGospel':
		'Kolmea ehdotetaan tavallisesti, kolmesta eri syystä. Mikä tahansa niistä on hyvä paikka olla.',
	'schola.bible.gospel.mark':
		'Lyhyin. Voit lukea sen kokonaan yhtenä iltapäivänä, ja yhden loppuun saattaminen on alussa arvokkaampaa kuin parhaan valitseminen.',
	'schola.bible.gospel.luke':
		'Kirjoitettu uskon ulkopuolella olevalle, joka halusi kertomuksen järjestykseen pantuna — mikä saatat olla juuri sinä. Se jatkuu suoraan Apostolien tekoihin, joten se on oikeastaan pidemmän kirjan ensimmäinen puolisko.',
	'schola.bible.gospel.john':
		'Se, joka sanoo suoraan miksi se kirjoitettiin: ”että te uskoisitte”. Yksinkertaisia sanoja, ja se käy suoraan kysymykseen siitä, kuka Jeesus on.',
	'schola.bible.step.acts': 'Sitten mitä tapahtui seuraavaksi',
	'schola.bible.thenActs':
		'Kun olet saanut yhden luettua, lue mitä hänet tunteneet tekivät sen jälkeen kun hän oli poissa.',
	'schola.bible.acts.why':
		'Kolmekymmentä vuotta evankeliumien päättymisen jälkeen: muutama kymmenkunta peloissaan olevaa ihmistä, ja se miten se mitä he olivat nähneet ylsi valtakunnan toiseen laitaan.',
	'schola.bible.step.old': 'Sitten vanhempi puolisko',
	'schola.bible.thenOld':
		'Ei ensimmäiseltä sivulta, eikä kokonaan. Muutama kohta kantaa kertomusta, ja juuri niihin evankeliumit alituiseen viittaavat takaisin.',
	'schola.bible.ot.beginnings': 'Kuinka se alkaa, ja kuinka se menee pieleen.',
	'schola.bible.ot.promise':
		'Yksi suku, ja sille annettu lupaus, joka elää kaikkien siihen kuuluvien yli.',
	'schola.bible.ot.exodus': 'Kansa, joka tuotiin pois orjuudesta, ja laki, jonka mukaan elää.',
	'schola.bible.ot.psalms':
		'Ei kertomus: sataviisikymmentä rukousta ja laulua. Lue yksi kerrallaan, missä järjestyksessä tahansa. Kirkko rukoilee näitä yhä joka päivä.',
	'schola.bible.bothWays':
		'Tunnistat asioita, ja se on tarkoitus eikä sattuma. Kirkko lukee vanhemmat kirjat Kristuksen valossa ja uudemmat sen valossa mikä tuli ennen — kumpikin puolisko selittää toista, ja siksi kumpaakaan ei lueta yksin.',
	'schola.books.heading': 'Mitä täällä on, ja miten se yksilöidään',
	'schola.books.lede':
		'Jokainen näistä on eri laji kirja, ja jokaiseen viitataan omalla numerollaan. Esimerkit näyttävät muodon: kirjoita sellainen hakukenttään, niin päädyt kohtaan.',
	'schola.cite.label': 'Yksilöidään',
	'schola.what.scripture':
		'Raamattu sellaisena kuin kirkko sen vastaanottaa, molemmissa testamenteissa. Kaikki muu täällä luetaan sen valossa.',
	'schola.cite.scripture': 'kirja, luku ja jae, niillä lyhenteillä joita oma laitoksesi painaa',
	'schola.what.catechism':
		'Tiivistelmä siitä, mitä katolinen kirkko uskoo, yhtenä niteenä. Se ei itse ole lähde: se kokoaa Raamatun, isät, liturgian ja kirkon opetuksen, ja jokainen kohta kertoo mistä se on peräisin mitä se sanoo.',
	'schola.cite.catechism': 'kohdan numeron mukaan, juoksevana ensimmäiseltä sivulta viimeiselle',
	'schola.what.compendium':
		'Sama opetus esitettynä kysymyksinä ja vastauksina, noin kymmenesosan mitassa.',
	'schola.cite.compendium': 'kysymyksen numeron mukaan',
	'schola.what.magisterium':
		'Se mitä paavit ja kirkolliskokoukset ovat tosiasiassa kirjoittaneet — kiertokirjeitä, konstituutioita, dekreettejä, julistuksia — kukin osoitettu määrättyyn hetkeen ja määrättyyn kysymykseen. Kukin tunnetaan latinankielisistä alkusanoistaan.',
	'schola.cite.magisterium': 'asiakirjan nimen mukaan, sitten sen sisäisen jakson numeron mukaan',
	'schola.what.social':
		'Kirkon opetus työstä, omistuksesta, perheestä, politiikasta ja rauhasta, koottuna noista asiakirjoista yhdeksi kirjaksi.',
	'schola.cite.social': 'kohdan numeron mukaan, sen lyhenteen alla jota teos käyttää itsestään',
	'schola.what.law': 'Oikeutta eikä oppia. Se sanoo mitä kirkko vaatii, ja sitä muutetaan.',
	'schola.cite.law': 'kaanonin mukaan, joksi sen numeroituja yksiköitä kutsutaan',
	'schola.what.doctors':
		'Ne teologit, jotka kirkko on nimennyt kirkonopettajiksi. Se ei kanna virallista arvovaltaa, olipa tekijä kuinka suuri tahansa.',
	'schola.cite.doctors': 'osan mukaan, sitten kysymyksen — Summan omat jaottelut',
	'schola.what.prayers': 'Ne sanat, joilla kirkko rukoilee, latina vierellään.',
	'schola.cite.prayers': 'nimeltä; numeroita ei ole viitattavaksi',
	'schola.places.heading': 'Ei tekstejä, vaan paikkoja tällä sivustolla',
	'schola.what.library':
		'Kaikki sivuston teokset yhtenä luettelona, ryhmiteltyinä aiheen eikä lajin mukaan.',
	'schola.what.calendar':
		'Liturginen päivä — aika, väri ja ketä vietetään — sen maan mukaan, jonka kalenteria noudatat.',
	'schola.what.bookmarks':
		'Kohdat jotka olet merkinnyt, ja mihin viimeksi jäit kussakin teoksessa. Molemmat pysyvät tässä selaimessa eikä niitä lähetetä minnekään.',
	'ccc.noCounterpart': 'Ei vastinetta toisessa teoksessa',
	'jumpbox.placeholder': 'Siirry… (esim. jn 3:16, ccc 1234)',
	'jumpbox.short': 'Haku',
	'jumpbox.hint': 'Paina / tai Ctrl+K siirtyäksesi viitteeseen',
	'jumpbox.noMatch': 'Ei osumia',
	'jumpbox.suggestions': 'Ehdotukset',
	'settings.label': 'Asetukset',
	'apparatus.label': 'Apparaatti',
	'apparatus.editionNotes': 'Tämän laitoksen huomautukset',
	'apparatus.commentary': 'Kommentaari',
	'apparatus.inCommentary': 'Sisältyy yllä olevaan kommentaariin.',
	'darkMode.label': 'Tumma tila',
	'darkMode.auto': 'Auto',
	'darkMode.on': 'Päällä',
	'darkMode.off': 'Pois',
	'sepia.label': 'Seepia',
	'sepia.lightOnly': 'Vain vaalea tila',
	'sepia.noHue': 'Ei mustavalkoisessa',
	'oled.label': 'OLED-musta',
	'oled.darkOnly': 'Vain tumma tila',
	'mono.label': 'Mustavalkoinen',
	'mono.hint':
		'Asettaa koko sivun yhdeksi harmaan sävyksi, jottei mitään eroteta värin perusteella. Seepia kytkeytyy pois sen ollessa päällä.',
	'advanced.label': 'Lisäasetukset',
	'library.title': 'Offline-kirjasto',
	'library.lede': 'Tälle laitteelle tallennetut tekstit avautuvat ilman verkkoyhteyttä.',
	'library.essentials': 'Rukoukset ja Kompendium',
	'library.illustrations': 'Raamattu (kuvitukset)',
	'library.illustrationsDetail': 'Raamattu (kuvitukset, korkea resoluutio)',
	'library.other': 'Muut tekstit',
	'library.everything': 'Kaikki',
	'library.downloadAll': 'Lataa kaikki',
	'library.download': 'Lataa',
	'library.downloaded': 'Tällä laitteella',
	'library.offlineNote': 'Poista offline-tila käytöstä ladataksesi mitään.',
	'library.remove': 'Poista tältä laitteelta',
	'library.removeConfirm': 'Poistetaanko?',
	'library.forget': 'Poista lataukset',
	'library.forgetConfirm': 'Poistetaanko kaikki?',
	'offline.label': 'Offline-tila',
	'offline.hint':
		'Ei käytä lainkaan verkkoa: mitään ei ladata, päivityksiä ei tarkisteta, mitään ei mitata. Vain jo tälle laitteelle tallennetut tekstit avautuvat.',
	'offline.notDownloaded': 'Ei tällä laitteella',
	'loadFailed.title': 'Tämä ei latautunut',
	'loadFailed.hint':
		'Sivu on olemassa — sen noutamisessa meni jokin pieleen. Uusi yritys yleensä riittää.',
	'loadFailed.retry': 'Yritä uudelleen',
	'loadFailed.retrying': 'Yritetään…',
	'offline.turnOff': 'Poista offline-tila käytöstä',
	'type.label': 'Tekstin koko ja kirjasin',
	'fontSize.label': 'Tekstin koko',
	'fontSize.small': 'Pieni',
	'fontSize.medium': 'Keskikoko',
	'fontSize.large': 'Suuri',
	'fontSize.xlarge': 'Erittäin suuri',
	'fontSize.xxlarge': 'Suurin',
	'face.label': 'Kirjasin',
	'face.serif': 'Antiikva',
	'face.sans': 'Groteski',
	'print.label': 'Tulosta tämä sivu',
	'toTop.label': 'Takaisin ylös',
	'install.label': 'Asenna Glossa',
	'install.hint.label': 'Lisää aloitusnäytölle',
	'install.hint.title': 'Lisää Glossa aloitusnäytöllesi',
	'install.hint.stepBefore': 'Se avautuu kuin sovellus ja toimii ilman verkkoyhteyttä. Napauta',
	'install.hint.stepAfter': ' sitten ”Lisää aloitusnäytölle”.',
	'install.hint.dismiss': 'Hylkää',
	'update.label': 'Uusi laitos on saatavilla',
	'update.title': 'Uusi laitos on valmis',
	'update.body': 'Lataa sivu uudelleen saadaksesi uusimmat tekstit ja korjaukset.',
	'update.action': 'Lataa uudelleen',
	'update.dismiss': 'Ei nyt',
	'edition.label': 'Laitos',
	'edition.select': 'Valitse laitos',
	'edition.current': 'Nykyinen laitos',
	'edition.filter': 'Hae laitoksia',
	'menu.noMatches': 'Ei osumia',
	'unitNav.previous': 'Edellinen',
	'unitNav.next': 'Seuraava',
	'bible.prevChapter': 'Edellinen luku',
	'bible.nextChapter': 'Seuraava luku',
	'bible.pickBook': 'Kirjat ja luvut',
	'bible.landing.title': 'Raamattu',
	'bible.landing.tagline': 'Lue koko Raamattu, kirja kirjalta, luku luvulta.',
	'bible.landing.random': 'Yllätä minut',
	'bible.landing.books': 'Kirjat',
	'bible.chapterUnavailable': 'Ei saatavilla tässä laitoksessa',
	'bible.introduction': 'Johdanto',
	'bible.introUnavailable': 'Ei vielä johdantoa tällä kielellä',
	'bible.introSource': 'Johdannot eivät ole osa raamatuntekstiä.',
	'bible.testament.ot': 'Vanha testamentti',
	'bible.testament.nt': 'Uusi testamentti',
	// All nine, because `bible-groups.test.ts` requires the set to be
	// complete in every interface language rather than partial: one
	// English heading among eight translated ones reads as a bug.
	'bible.group.pentateuch': 'Pentateukki',
	'bible.group.historical': 'Historialliset kirjat',
	'bible.group.wisdom': 'Viisauskirjat',
	'bible.group.prophetic': 'Profeetalliset kirjat',
	'bible.group.gospels': 'Evankeliumit',
	'bible.group.acts': 'Apostolien teot',
	'bible.group.pauline': 'Paavalin kirjeet',
	'bible.group.catholicLetters': 'Katoliset kirjeet',
	'bible.group.revelation': 'Ilmestyskirja',
	'ccc.prevParagraph': 'Edellinen kohta',
	'ccc.nextParagraph': 'Seuraava kohta',
	'ccc.inBrief': 'Lyhyesti',
	'ccc.landing.title': 'Katolisen kirkon katekismus',
	'ccc.landing.pairTitle': 'Katekismus ja Kompendium',
	'ccc.landing.tagline':
		'<strong>Katekismus</strong> esittää katolisen opin 2 865 numeroidussa kohdassa. <strong>Kompendium</strong> esittää saman opin 598 kysymyksenä ja vastauksena samaa jäsennystä noudattaen.',
	'ccc.landing.pairTagline':
		'Katolisen kirkon katekismus 2 865 kohdassa ja sen Kompendium 598 kysymyksessä.',
	'ccc.tableOfContents': 'Sisällys',
	'ccc.related': 'Katso myös',
	'compendium.landing.title': 'Katekismuksen kompendium',
	'compendium.landing.tagline':
		'Kysymyksiä ja vastauksia, jotka tiivistävät Katolisen kirkon katekismuksen.',
	'compendium.question': 'Kysymys',
	'compendium.answer': 'Vastaus',
	'compendium.tableOfContents': 'Sisällys',
	'compendium.prevQuestion': 'Edellinen kysymys',
	'compendium.nextQuestion': 'Seuraava kysymys',
	'compendium.condenses': 'Tiivistää KKK ¶¶',
	'ccc.abbrev': 'KKK',
	'ccc.condensedIn': 'Kompendiumissa',
	'compendium.abbrev': 'Komp.',
	'compendium.noQuestionNumber': 'Tässä korpuksessa ei ole kysymysnumeroa',
	'document.library.tagline':
		'Kiertokirjeitä, konsiilin konstituutioita, dekreettejä ja opetusviran julistuksia.',
	'document.filter.heading': 'Suodata',
	'document.filter.author': 'Tekijä',
	'document.filter.kind': 'Tyyppi',
	'document.filter.subject': 'Aihe',
	'document.filter.search': 'Hae asiakirjoja',
	'document.filter.clear': 'Tyhjennä',
	'document.filter.results': 'Näytetyt asiakirjat',
	'document.filter.noResults': 'Mikään asiakirja ei vastaa näitä suodattimia.',
	'document.tableOfContents': 'Sisällys',
	'document.startReading': 'Aloita lukeminen',
	'document.readFullDocument': 'Lue koko asiakirja',
	'document.section': 'Jakso',
	'document.prevSection': 'Edellinen',
	'document.nextSection': 'Seuraava',
	'document.kind.conciliarConstitution': 'Konstituutio',
	'document.kind.conciliarDecree': 'Dekreetti',
	'document.kind.conciliarDeclaration': 'Julistus',
	'document.kind.encyclical': 'Kiertokirje',
	'document.kind.apostolicExhortation': 'Apostolinen kehotuskirje',
	'document.kind.apostolicConstitution': 'Apostolinen konstituutio',
	'document.kind.cdfDeclaration': 'Uskonopin kongregaation julistus',
	'document.kind.cdfInstruction': 'Uskonopin kongregaation ohje',
	'document.kind.cdfLetter': 'Uskonopin kongregaation kirje',
	'document.kind.cdfDoctrinalNote': 'Uskonopin kongregaation opillinen huomautus',
	'document.kind.cdfResponsum': 'Uskonopin kongregaation vastaus',
	'document.kind.cdfConsiderations': 'Uskonopin kongregaation huomioita',
	'document.kindPlural.conciliarConstitution': 'Konstituutiot',
	'document.kindPlural.conciliarDecree': 'Dekreetit',
	'document.kindPlural.conciliarDeclaration': 'Julistukset',
	'document.kindPlural.encyclical': 'Kiertokirjeet',
	'document.kindPlural.apostolicExhortation': 'Apostoliset kehotuskirjeet',
	'document.kindPlural.apostolicConstitution': 'Apostoliset konstituutiot',
	'document.kindPlural.cdfDeclaration': 'Uskonopin kongregaation julistukset',
	'citation.unavailable': 'Tälle huomautukselle ei ole saatavilla lähdetekstiä.',
	'doctores.landing.title': 'Kirkonopettajat',
	'doctores.landing.tagline': 'Kirkkoisien ja kirkonopettajien teologiset teokset.',
	'summa.landing.title': 'Summa Theologiae',
	'summa.landing.tagline':
		'Tuomas Akvinolainen, englanniksi ja sillä latinalla jota hän kirjoitti.',
	'summa.tableOfContents': 'Sisällys',
	'summa.part': 'Osa',
	'summa.question': 'Kysymys',
	'summa.article': 'Artikkeli',
	'summa.questionShort': 'K',
	'summa.articleShort': 'Art.',
	'summa.titleFromEdition': 'Otsikko {lang}-laitoksesta',
	'summa.titlesFromEdition': 'Otsikot {lang}-laitoksesta — tässä ei paineta yhtään',
	'summa.prologue': 'Prologi',
	'summa.objection': 'Vastaväite',
	'summa.sedContra': 'Toisaalta',
	'summa.corpus': 'Vastaus',
	'summa.reply': 'Vastaus vastaväitteeseen',
	'summa.preamble': 'Huomautus',
	'summa.prevQuestion': 'Edellinen kysymys',
	'summa.nextQuestion': 'Seuraava kysymys',
	'summa.noEditionInYourLanguage':
		'Summalla ei ole laitosta omalla kielelläsi. Näytetään kielellä {lang}.',
	'summa.noLatinSupplement':
		'Täydennysosa on olemassa vain englanniksi — se koottiin Akvinolaisen kuoleman jälkeen.',
	'index.division': 'Jakso',
	'index.showSubsections': 'Näytä alaosiot',
	'index.hideSubsections': 'Piilota alaosiot',
	'prayers.landing.title': 'Tavalliset rukoukset',
	'prayers.landing.tagline': 'Rukoukset latinankielisen tekstin rinnalla.',
	'prayers.tableOfContents': 'Sisällys',
	'prayers.gloss.versicle':
		'Versikkeli — säe, jonka rukousta johtava lausuu tai laulaa yksin. Seurakunta vastaa siihen seuraavalla vastauksella.',
	'prayers.gloss.response':
		'Vastaus — säe, jonka seurakunta lausuu tai laulaa yhdessä vastaukseksi edeltävään versikkeliin.',
	'prayers.seeAlso': 'Katso myös',
	'prayers.prevPrayer': 'Edellinen rukous',
	'prayers.nextPrayer': 'Seuraava rukous',
	'prayers.rosary.today': 'Tänään',
	'prayers.rosary.todayHeading': 'Tämän päivän salaisuudet',
	'prayers.rosary.openingPrayer': 'Aloitusrukous',
	'prayers.rosary.decadePrayers': 'Kymmenyksen rukoukset',
	'ref.tooltip.loading': 'Ladataan…',
	'ref.tooltip.openCcc': 'Avaa Katekismuksessa',
	'ref.tooltip.openBible': 'Avaa Raamatussa',
	'ref.tooltip.openCompendium': 'Avaa Kompendiumissa',
	'ref.preview.open': 'Avaa',
	'ref.cf': 'vrt.',
	'anchor.actions': 'Viitteen toiminnot',
	'anchor.copy': 'Kopioi teksti',
	'anchor.copyLink': 'Kopioi linkki',
	'anchor.view': 'Näytä',
	'anchor.copied': 'Kopioitu',
	'anchor.copyFailed': 'Kopiointi ei onnistunut',
	'bookmark.add': 'Merkitse',
	'bookmark.remove': 'Poista kirjanmerkki',
	'bookmark.library': 'Kirjanmerkit',
	'bookmark.library.tagline': 'Kaikki, minkä olet lukiessasi merkinnyt.',
	'bookmark.empty': 'Mitään ei ole vielä merkitty.',
	'bookmark.emptyHint':
		'Napsauta jakeen tai kappaleen numeroa ja valitse Merkitse, tai käytä sivun kirjanmerkkipainiketta.',
	'bookmark.about': 'Näistä kirjanmerkeistä',
	'bookmark.deviceOnly':
		'Kirjanmerkit säilyvät vain tässä selaimessa. Niitä ei lähetetä mihinkään, ja selaimen tietojen tyhjentäminen poistaa ne.',
	'bookmark.unavailable': 'Ei siinä laitoksessa, jota luet',
	'colophon.title': 'Kolofoni',
	'colophon.lede':
		'Mikä tämä sivusto on, mistä sen tekstit ovat peräisin ja mikä on kantamme niiden toisintamiseen.',
	'colophon.whatThisIs': 'Mikä tämä on',
	'colophon.whatThisIsBody':
		'Glossa Catholica on lukusivusto Raamatulle, Katekismukselle, Kompendiumille ja opetusviran asiakirjoille, englanniksi, portugaliksi ja latinaksi. Se on olemassa luettavaksi, eikä sinulta pyydetä mitään muuta sen lukemiseksi:',
	'colophon.pointFree':
		'Ilmainen, ja aina ilmainen. Ei maksumuuria, ei tilausta, ei mitään ostettavaa.',
	'colophon.pointNoAds': 'Ei mainoksia eikä minkäänlaista sponsoroitua sijoittelua.',
	'colophon.pointNoAccounts':
		'Ei tilejä. Ei mitään mihin rekisteröityä, ei mitään mihin kirjautua.',
	'colophon.pointNoTracking':
		'Ei seurantaskriptejä, ei kolmannen osapuolen koodia, ei evästeitä. Vain nimettömiä käyttölaskureita, ilman mitään sinut tunnistavaa.',
	'colophon.pointOffline':
		'Rakennettu toimimaan yhä ilman verkkoyhteyttä ensimmäisen käynnin jälkeen, jottei heikko yhteys olisi este lukemiselle.',
	'colophon.whatThisIsStanding':
		'Glossa Catholica on maallikkouskovien yksityinen hanke. Sillä ei ole kirkollista hyväksyntää eikä se puhu millään omalla auktoriteetilla.',
	'footer.notEndorsed': 'Ei Pyhän istuimen hyväksymä',
	'colophon.textsTitle': 'Tekstit',
	'colophon.textsBody':
		'Jokainen teksti tulee nimetystä lähteestä, ja jokainen teos kirjaa laitoksensa, lähdesivunsa ja päivän, jona se noudettiin. Raamattu käyttää vapaassa käytössä olevia käännöksiä; Katekismus, Kompendium ja opetusviran asiakirjat tulevat Pyhän istuimen omista julkaistuista teksteistä.',
	'colophon.textsFidelity':
		'Tekstiä ei koskaan lyhennetä, koskaan mukailla, koskaan kirjoiteta uudelleen eikä koskaan aseteta mainosten viereen. Ilmeiset viat kyllä korjaamme — pudonneen sanan, turmeltuneen viitteen, merkkauksen joka nieli kappaleen — aina kohti sitä mitä lähde itse painaa, ei koskaan kohti sitä mitä mielestämme sen pitäisi sanoa.',
	'colophon.countBible': 'raamatunlaitosta',
	'colophon.countDocuments': 'opetusviran asiakirjaa',
	'colophon.privacyTitle': 'Yksityisyys',
	'colophon.privacyBody1':
		'Ei tilejä, ei evästeitä, ei mainontaa, ei kolmannen osapuolen koodia. Mikään täällä ei seuraa sinua tämän sivuston ulkopuolelle.',
	'colophon.privacyBody2':
		'Laskemme kyllä sivuston käyttöä: yksi mittaus per käynti, jokainen kenttä vaihteluvälinä eikä yksittäisenä arvona — kuinka kauan viivyit, kuinka usein olet käynyt täällä, mitkä teokset avasit. Maasi lasketaan erikseen, eikä sitä yhdistetä muuhun. Se kuvaa käyntiä eikä kävijää, ja säilytetään {days} päivää.',
	'colophon.privacyBody3':
		'Ei koskaan lähetetä: mitä kirjoitat hakukenttään, mikä kohta sinulla oli auki, tai mitään mikä voisi tunnistaa laitteesi uudelleen. Asetuksesi, kirjanmerkkisi ja ladatut tekstisi pysyvät laitteellasi.',
	'colophon.copyrightTitle': 'Tekijänoikeus',
	'colophon.copyrightBody1':
		'Katekismus, Kompendium ja opetusviran asiakirjat ovat oikeudenhaltijoidensa omaisuutta — ennen muuta Libreria Editrice Vaticanan ja viestinnän dikasterion.',
	'colophon.copyrightBody2':
		'Jokainen teos näyttää oikeudenhaltijansa oman tekijänoikeusilmoituksen heidän sanamuodossaan ja linkittää sivulle, jolta se on otettu.',
	'colophon.copyrightBody3':
		'Jos sinulla on oikeuksia johonkin täällä olevaan tekstiin etkä soisi sen olevan julkaistuna, kirjoita meille.',
	'colophon.contactTitle': 'Yhteystiedot',
	'colophon.contactBody': 'Mitä tahansa varten, myös yllä olevaa:',
	'colophon.contactPending':
		'Yhteysosoitetta ei ole vielä asetettu. Tätä sivustoa ei pitäisi julkistaa ennen kuin sellainen on — yllä oleva sitoumus ei merkitse mitään ilman tapaa tavoittaa meidät.',
	'colophon.illustrationsTitle': 'Kuvitukset',
	'colophon.illustrationsBody':
		'Raamattu kantaa Gustave Dorén kaiverruksia, kukin sijoitettuna sen jakeen kohdalle jota se kuvaa — viimeinen ja laajin hänen raamattusarjoistaan, puuhun leikattu hänen piirustustensa mukaan ja painettu tekstin lomaan eikä koottu loppuun.',
	'colophon.illustrationsRights':
		'Ne ovat vapaassa käytössä, kuten alla olevat vuosiluvut osoittavat, eikä uskollinen valokuvajäljennös vapaassa käytössä olevasta kaiverruksesta kanna mitään uutta omaa tekijänoikeutta.',
	'colophon.countPlates': 'kaiverrusta',
	'colophon.countPlateChapters': 'kuvitettua lukua',
	'plates.scansBy': 'Skannaukset tarjonnut',
	'plates.enlarge': 'Suurenna {title}',
	'plates.zoom': 'Zoomaa',
	'art.about': 'Tästä kuvasta',
	'art.detail': 'yksityiskohta',
	'colophon.typeTitle': 'Kirjasin',
	'colophon.typeBody':
		'Ladottu EB Garamondilla, Georg Duffnerin ja Octavio Pardon herätyksellä kirjasimista jotka Claude Garamont leikkasi 1590-luvulla — humanistisesta perinteestä jossa Kirkko on painanut renessanssista asti. Sen kyrillinen on samojen käsien työtä mutta ei herätä mitään: kyrillistä Garamondia ei koskaan leikattu, joten venäjä on ladottu muodolla joka on piirretty seisomaan muun rinnalla.',
	'colophon.typeArabic':
		'Arabia on sen ulottumattomissa kokonaan ja on ladottu Amirilla — Khaled Hosnyn herätyksellä naskhista joka leikattiin Bulaqin kirjapainolle Kairossa 1905, valittuna samalla perusteella kuin tekstikirjasin: tietty historiallinen kirjatyyppi eikä nykyaikainen piirros.',
	'colophon.typeInitials':
		'Aloitusalkukirjaimet ovat Pirata One, fraktuura jonka versaalit pysyvät luettavina siinä koossa jota anfangi vaatii, ja — venäjää varten — Ponomar, joka toistaa Synodaalipainon kirkkoslaavilaisen kirjasimen. Ponomar latoo alkukirjaimen eikä koskaan tekstiä: nykyaikainen kiertokirje ladottuna kauttaaltaan synodaalikirjasimella sanoisi jotain epätotta siitä mikä se on. Kaikki ovat lisensoituja SIL Open Font Licensen alla ja tarjoillaan tältä sivustolta eikä kolmannelta osapuolelta, joten sivun lukeminen ei pyydä mitään kenenkään muun palvelimelta.',
	'refs.citedIn': 'Mainittu kohdassa',
	'refs.externalVolume': 'Osa {volume} sivustolla {host} — skannattu PDF',
	'bible.wholeChapter': 'Tämä luku',
	'bible.verseNotInEdition':
		'Tätä jakeen numeroa ei ole tässä laitoksessa — katso huomautus sivun lähteestä',
	'bible.verseAbbrev': 'j.',
	'bible.note': 'Huomautus',
	'bible.noteMissing': 'Tämä huomautus puuttuu korpuksesta',
	'bible.chapterArgument': 'Luvun sisältö',
	'ccc.readFullChapter': 'Lue koko luku',
	'ccc.noParagraphNumber': 'Tässä korpuksessa ei ole kohdan numeroa',
	'copyright.sourceTitle': 'Avaa alkuperäinen lähdesivu',
	'copyright.sourceLabel': 'Lähde',
	'lang.label': 'Kieli',
	'lang.filter': 'Hae kieliä',
	'lang.more': 'lisää kieliä',
	'notFound.title': 'Ei mitään tässä osoitteessa',
	'notFound.lede': 'Pyytämääsi sivua ei ole täällä.',
	'notFound.body':
		'Linkki saattaa olla väärin kirjoitettu tai vanhentunut, tai se saattaa osoittaa tekstiin, jota tämä sivusto ei sisällä.',
	'notFound.searchHint':
		'Jos tiedät etsimäsi viitteen — kirjan ja luvun, Katekismuksen kohdan — kirjoita se tämän sivun yläreunan hakukenttään.',
	'notFound.credit': 'Perustuu British Libraryn käsikirjoitukseen Royal MS 10 E IV, f. 49v',
	'notFound.elsewhere': 'Tai aloita jostain näistä:',
	'notFound.home': 'Etusivu',
	'compare.enter': 'Vertaa laitoksia',
	'compare.exit': 'Poistu vertailusta',
	'compare.missing': 'Ei tässä laitoksessa',
	'compare.versificationNote':
		'Nämä kaksi laitosta jakavat tämän luvun jakeet paikoin eri tavalla (tekstuaalinen eroavaisuus, ei käännösratkaisu) — sama jakeen numero ei aina merkitse samaa virkettä molemmissa sarakkeissa.',
	'compare.loading': 'Ladataan toista kieltä…',
	'ui.close': 'Sulje',
	'shortcuts.title': 'Pikanäppäimet',
	'shortcuts.betweenDocuments': 'Asiakirjojen välillä',
	'shortcuts.withinDocument': 'Asiakirjan sisällä',
	'shortcuts.show': 'Näytä tämä lista',
	'help.title': 'Ohje',
	'help.top.heading': 'Palkki jokaisen sivun yläreunassa',
	'help.reading.heading': 'Palkki tekstin yläpuolella',
	'help.feature.search':
		'Kirjoita viite yläreunan kenttään — luku ja jae, kappaleen numero, asiakirjan nimi — ja se täydentyy kirjoittaessasi.',
	'help.feature.offline':
		'Lisää sivusto aloitusnäytöllesi, niin se avautuu kuin sovellus. Voit ladata kokonaisia teoksia luettavaksi ilman verkkoyhteyttä.',
	'help.feature.contents':
		'Sen teoksen jaottelu, jossa olet — kirjat, osat, luvut — jotta voit liikkua sen sisällä palaamatta alkuun.',
	'help.feature.compare':
		'Saman kohdan kaksi laitosta rinnakkain — latina oman kielesi vierellä, tai käännös toisen käännöksen vierellä.',
	'help.feature.apparatus':
		'Laitoksen omat huomautukset, ja mikä tahansa tekstiin kirjoitettu selitys, tarjotaan sen vierellä eikä sen alla. Tekstin sisäiset viittaukset ovat linkkejä, joten viite vie sinne minne se osoittaa.',
	'help.feature.focus':
		'Siivoaa kaiken muun paitsi tekstin. Ulospääsy jää siihen missä palkki oli, jottei mikään jää sen taakse.',
	'zen.enter': 'Keskittymistila',
	'zen.exit': 'Poistu keskittymistilasta',
	'nav.calendar': 'Kalenteri',
	'calendar.title': 'Liturginen kalenteri',
	'calendar.tagline':
		'Yleinen roomalainen kalenteri, laskettuna mille tahansa päivälle — sen aika, sen arvo, sen väri.',
	'calendar.calendar': 'Kalenteri',
	'calendar.which.general': 'Yleinen roomalainen kalenteri',
	'calendar.filter': 'Hae maita',
	'calendar.region.europe': 'Eurooppa',
	'calendar.region.americas': 'Amerikat',
	'calendar.region.africa': 'Afrikka',
	'calendar.region.middleEast': 'Lähi-itä',
	'calendar.region.asia': 'Aasia',
	'calendar.region.oceania': 'Oseania',
	'calendar.today': 'Tänään',
	'calendar.previousMonth': 'Edellinen kuukausi',
	'calendar.nextMonth': 'Seuraava kuukausi',
	'calendar.plainDays': 'Tavalliset arkipäivät',
	'calendar.noSuchDay': 'Tälle päivämäärälle ei lasketa liturgista päivää.',
	'calendar.week': 'viikko',
	'calendar.alsoToday': 'Tänään vietetään myös',
	'calendar.alsoObserved': 'Tänään muistetaan myös',
	'calendar.obligation': 'Velvoittava juhlapyhä',
	'calendar.obligationCanon': 'CIC kaanon 1246',
	'calendar.sundayCycle': 'Sunnuntaikierto',
	'calendar.weekdayCycle': 'Arkikierto',
	'calendar.psalterWeek': 'Psalttiviikko',
	'lectionary.heading': 'Messun lukukappaleet',
	'lectionary.slot.reading': 'Lukukappale',
	'lectionary.slot.reading1': 'Ensimmäinen lukukappale',
	'lectionary.slot.reading2': 'Toinen lukukappale',
	'lectionary.slot.reading3': 'Kolmas lukukappale',
	'lectionary.slot.reading4': 'Neljäs lukukappale',
	'lectionary.slot.reading5': 'Viides lukukappale',
	'lectionary.slot.reading6': 'Kuudes lukukappale',
	'lectionary.slot.reading7': 'Seitsemäs lukukappale',
	'lectionary.slot.psalm': 'Vastuupsalmi',
	'lectionary.slot.epistle': 'Epistola',
	'lectionary.slot.acclamation': 'Evankeliumin akklamaatio',
	'lectionary.slot.gospel': 'Evankeliumi',
	'lectionary.slot.sequence': 'Sekvenssi',
	'lectionary.or': 'tai',
	'lectionary.cf': 'Vrt.',
	'lectionary.about': 'Näistä lukukappaleista',
	'lectionary.caveat':
		'Kohdat, jotka Ordo Lectionum Missae määrää, linkitettyinä tämän sivuston omiin laitoksiin — ei mihinkään tiettyyn seurakuntaan julistettuun käännökseen, ja piispainkokous voi mukauttaa aikataulua.',
	'calendar.transferredFrom': 'Siirretty päivältä',
	'calendar.season.advent': 'Adventti',
	'calendar.season.christmas': 'Jouluaika',
	'calendar.season.lent': 'Paastonaika',
	'calendar.season.triduum': 'Pääsiäistriduum',
	'calendar.season.easter': 'Pääsiäisaika',
	'calendar.season.ordinary': 'Kirkkovuoden aika',
	'calendar.colour.white': 'Valkoinen',
	'calendar.colour.red': 'Punainen',
	'calendar.colour.green': 'Vihreä',
	'calendar.colour.violet': 'Violetti',
	'calendar.colour.rose': 'Ruusunpunainen',
	'calendar.colour.black': 'Musta',
	'calendar.colour.blue': 'Sininen',
	'calendar.rank.solemnity': 'Juhlapyhä',
	'calendar.rank.feast': 'Juhla',
	'calendar.rank.memorial': 'Pakollinen muistopäivä',
	'calendar.rank.optional-memorial': 'Vapaaehtoinen muistopäivä',
	'calendar.rank.commemoration': 'Muistaminen',
	'calendar.rank.sunday': 'Sunnuntai',
	'calendar.rank.weekday': 'Arkipäivä',
	'calendar.gloss.season.advent':
		'Neljä viikkoa ennen joulua: valmistautuminen Herran tulemiseen ja kirkkovuoden alku.',
	'calendar.gloss.season.christmas':
		'Joulusta Herran kasteeseen, jolloin vietetään Herran syntymää ja hänen ilmestymistään maailmalle.',
	'calendar.gloss.season.lent':
		'Neljäkymmentä päivää tuhkakeskiviikosta Herran ehtoollisen iltamessuun: katumus, almu ja valmistautuminen pääsiäiseen.',
	'calendar.gloss.season.triduum':
		'Kolme päivää kiirastorstain illasta pääsiäissunnuntain iltaan — Herran kärsimys, kuolema ja ylösnousemus, koko vuoden huippu.',
	'calendar.gloss.season.easter':
		'Viisikymmentä päivää pääsiäisestä helluntaihin, vietettynä yhtenä ainoana juhlana — ”yhtenä suurena sunnuntaina”.',
	'calendar.gloss.season.ordinary':
		'Kolmekymmentäkolme tai kolmekymmentäneljä viikkoa muiden aikojen ulkopuolella. Ei ”tavallinen” vaan järjestetty: viikot on numeroitu, ja kirkko lukee Herran elämän ja opetuksen läpi järjestyksessä. Se tulee kahdessa jaksossa — joulunajan jälkeen paastonaikaan asti, ja helluntain jälkeen adventtiin asti.',
	'calendar.gloss.rank.solemnity':
		'Korkein aste: pääsiäinen, joulu, taivaaseenastuminen, paikan oma suojeluspyhä. Vietetään Kunnia- ja uskontunnustuksen kanssa, ja alkaa edellisenä iltana.',
	'calendar.gloss.rank.feast':
		'Vietetään itse päivän sisällä. Apostolit ja evankelistat sekä Herran ja Neitsyt Marian suuremmat päivät.',
	'calendar.gloss.rank.memorial':
		'Pyhä, jota muistetaan omana päivänään, ajanjakson oman messun ja hetkipalveluksen sisällä. Velvoittava siellä, missä sitä vietetään.',
	'calendar.gloss.rank.optional-memorial':
		'Voidaan viettää tai olla viettämättä, papin tai yhteisön valinnan mukaan. Viettämättä jätettynä päivä on yksinkertaisesti arkipäivä.',
	'calendar.gloss.rank.commemoration':
		'Se, miksi muistopäivä muuttuu paastonaikana: rukous, joka lisätään arkipäivän messuun, jonka aika muutoin säilyttää ehjänä.',
	'calendar.gloss.rank.sunday':
		'Alkuperäinen juhlapäivä — Herran päivä, vietetty joka viikko ylösnousemuksesta lähtien. Vain juhlapyhä tai Herran juhla saa syrjäyttää sen, eivätkä adventissa, paastonaikana ja pääsiäisaikana edes ne.',
	'calendar.gloss.rank.weekday':
		'Päivä ilman omaa viettoa. Messu ja hetkipalvelus ovat ajanjakson omia — mikä tekee ajanjaksosta sen, mikä kannattaa tuntea.',
	'calendar.gloss.colour.white':
		'Ilo. Pääsiäis- ja jouluaika, Herran päivät hänen kärsimyksensä ulkopuolella, Neitsyt Maria, enkelit ja ne pyhät, jotka eivät olleet marttyyreja.',
	'calendar.gloss.colour.red':
		'Veri ja tuli. Palmusunnuntai ja pitkäperjantai, helluntai, apostolit ja evankelistat sekä marttyyrit.',
	'calendar.gloss.colour.green': 'Kirkkovuoden tavallinen aika: toivon ja kasvavan väri.',
	'calendar.gloss.colour.violet': 'Adventti ja paastonaika, ja käytetään myös vainajien messuissa.',
	'calendar.gloss.colour.rose':
		'Käytetään kahdesti vuodessa — Gaudete-sunnuntaina, adventin kolmantena, ja Laetare-sunnuntaina, paaston neljäntenä — missä paasto kevenee ja loppu on näkyvissä.',
	'calendar.gloss.colour.black': 'Voidaan käyttää vainajien messuissa.',
	'calendar.gloss.colour.blue':
		'Sinisen erioikeus: käytetään Neitsyt Marian perisynnittömän sikiämisen juhlassa Espanjassa, Filippiineillä ja niissä harvoissa muissa paikoissa, joille Pyhä istuin on sen myöntänyt.',
	'calendar.gloss.sundayCycle':
		'Sunnuntain lukukappaleet kulkevat kolmen vuoden yli — A, B ja C — lukien vuorollaan Matteusta, Markusta ja Luukasta, Johanneksen kanssa paastonaikana ja pääsiäisaikana. Kierto vaihtuu adventin ensimmäisenä sunnuntaina, kirkkovuoden mukana.',
	'calendar.gloss.weekdayCycle':
		'Arkipäivien lukukappaleet kulkevat kahden vuoden yli, I ja II: ensimmäinen lukukappale vaihtuu, evankeliumi ei. Liturginen vuosi nimetään sen kalenterivuoden mukaan, johon se päättyy — parittomat vuodet ovat I, parilliset II.',
	'calendar.gloss.psalterWeek':
		'Hetkipalvelus jakaa psalmit neljälle viikolle, I–IV, jotka toistuvat läpi vuoden. Tämä on se viikko, jonka psalmit ovat tämän päivän, jokaiselle joka rukoilee hetkipalvelusta.',
	'calendar.gloss.obligation':
		'Päivä, jona uskovat ovat velvollisia osallistumaan messuun ja pidättäytymään töistä, jotka sen estäisivät. Jokainen sunnuntai, ja ne muut päivät, jotka kukin piispainkokous on määrännyt.',
	'calendar.primer.title': 'Ensimmäistä kertaa täällä?',
	'calendar.primer.lead':
		'Kirkko pitää omaa vuottaan. Se alkaa adventista, kääntyy pääsiäisen ympäri, ja antaa jokaiselle päivälle nimen, asteen ja värin — ja ne ratkaisevat, mitä sinä päivänä rukoillaan ja luetaan messussa ja hetkipalveluksessa. Niinpä ”kirkkovuoden 23. sunnuntai” on osoite: se kertoo papille, kuorolle tai kotona rukoilevalle, mitkä rukoukset ja lukukappaleet kuuluvat tähän päivään.',
	'calendar.primer.seasons': 'Ajanjaksot',
	'calendar.primer.ranks': 'Mitä päivä voi olla',
	'calendar.primer.colours': 'Värit',
	'calendar.primer.cycles': 'Kierrot',
	'calendar.primer.cyclesLead':
		'Kolme laskuria, jotka yhdessä kertovat, mitkä lukukappaleet ja psalmit on määrätty tälle päivälle.'
};
