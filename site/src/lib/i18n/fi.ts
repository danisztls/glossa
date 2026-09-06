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
	'schola.start.heading': 'Jos tämä kaikki on sinulle uutta',
	'schola.start.body': 'Paras aloitus on tämä: ',
	'schola.start.bodyAfter':
		' — sama opetus kuin Katekismuksessa, paljon lyhyempänä, kysymyksinä ja vastauksina. Se on noin kymmenesosan mittainen eikä oleta mitään.',
	'schola.bible.heading': 'Jos et ole koskaan lukenut Raamattua',
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
	'schola.guide.heading': 'Miten löydät perille',
	'schola.guide.lede':
		'Teksti on koko sivu; kaikki muu on säädin, jonka voit sivuuttaa kunnes haluat sen.',
	'schola.guide.top.heading': 'Palkki jokaisen sivun yläreunassa',
	'schola.guide.reading.heading': 'Palkki tekstin yläpuolella',
	'schola.feature.search':
		'Kirjoita viite yläreunan kenttään — luku ja jae, kappaleen numero, asiakirjan nimi — ja se täydentyy kirjoittaessasi. Paina mistä tahansa / tai Ctrl+K, ja ? muita pikanäppäimiä varten.',
	'schola.feature.languages':
		'Käyttöliittymä ja teksti valitaan erikseen, joten voit lukea teosta yhdellä kielellä painikkeiden pysyessä toisella. Missä teoksesta on useita laitoksia sinun kielelläsi, valitset myös niiden välillä.',
	'schola.feature.settings':
		'Tekstin koko, vaalea tai tumma, seepia, ja kuinka paljon selitysaineistoa haluat tekstin viereen.',
	'schola.feature.offline':
		'Lisää sivusto aloitusnäytöllesi, niin se avautuu kuin sovellus. Voit ladata kokonaisia teoksia luettavaksi ilman verkkoyhteyttä.',
	'schola.feature.contents':
		'Sen teoksen jaottelu, jossa olet — kirjat, osat, luvut — jotta voit liikkua sen sisällä palaamatta alkuun.',
	'schola.feature.compare':
		'Saman kohdan kaksi laitosta rinnakkain — latina oman kielesi vierellä, tai käännös toisen käännöksen vierellä.',
	'schola.feature.apparatus':
		'Laitoksen omat huomautukset, ja mikä tahansa tekstiin kirjoitettu selitys, tarjotaan sen vierellä eikä sen alla. Tekstin sisäiset viittaukset ovat linkkejä, joten viite vie sinne minne se osoittaa.',
	'schola.feature.focus':
		'Siivoaa kaiken muun paitsi tekstin. Ulospääsy jää siihen missä palkki oli, jottei mikään jää sen taakse.',
	'schola.books.heading': 'Mitä täällä on, ja miten siihen viitataan',
	'schola.books.lede':
		'Jokainen näistä on eri laji kirja, ja jokaiseen viitataan omalla numerollaan. Esimerkit näyttävät muodon: kirjoita sellainen hakukenttään, niin päädyt kohtaan.',
	'schola.cite.label': 'Viitataan',
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
	'jumpbox.placeholder': 'Siirry… (esim. jn 3:16, ccc 1234)',
	'jumpbox.short': 'Haku',
	'jumpbox.hint': 'Paina / tai Ctrl+K siirtyäksesi viitteeseen',
	'jumpbox.noMatch': 'Ei osumia',
	'jumpbox.suggestions': 'Ehdotukset',
	'settings.label': 'Asetukset',
	'darkMode.label': 'Tumma tila',
	'darkMode.auto': 'Auto',
	'darkMode.on': 'Päällä',
	'darkMode.off': 'Pois',
	'loadFailed.title': 'Tämä ei latautunut',
	'loadFailed.hint':
		'Sivu on olemassa — sen noutamisessa meni jokin pieleen. Uusi yritys yleensä riittää.',
	'loadFailed.retry': 'Yritä uudelleen',
	'loadFailed.retrying': 'Yritetään…',
	'fontSize.label': 'Tekstin koko',
	'fontSize.larger': 'Suurempi teksti',
	'fontSize.smaller': 'Pienempi teksti',
	'print.label': 'Tulosta tämä sivu',
	'toTop.label': 'Takaisin ylös',
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
	'bible.landing.books': 'Kirjat',
	'bible.introduction': 'Johdanto',
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
	'ccc.landing.title': 'Katolisen kirkon katekismus',
	'ccc.landing.pairTitle': 'Katekismus ja Kompendium',
	'ccc.landing.tagline':
		'<strong>Katekismus</strong> esittää katolisen opin 2 865 numeroidussa kohdassa. <strong>Kompendium</strong> esittää saman opin 598 kysymyksenä ja vastauksena samaa jäsennystä noudattaen.',
	'ccc.landing.pairTagline':
		'Katolisen kirkon katekismus 2 865 kohdassa ja sen Kompendium 598 kysymyksessä.',
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
	'compendium.abbrev': 'Komp.',
	'compendium.noQuestionNumber': 'Tässä korpuksessa ei ole kysymysnumeroa',
	'document.library.tagline':
		'Kiertokirjeitä, konsiilin konstituutioita, dekreettejä ja opetusviran julistuksia.',
	'doctores.landing.title': 'Kirkonopettajat',
	'doctores.landing.tagline': 'Kirkkoisien ja kirkonopettajien teologiset teokset.',
	'summa.landing.title': 'Summa Theologiae',
	'summa.landing.tagline':
		'Tuomas Akvinolainen, englanniksi ja sillä latinalla jota hän kirjoitti.',
	'index.division': 'Jakso',
	'prayers.landing.title': 'Tavalliset rukoukset',
	'prayers.landing.tagline': 'Rukoukset latinankielisen tekstin rinnalla.',
	'prayers.seeAlso': 'Katso myös',
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
	'art.about': 'Tästä kuvasta',
	'art.detail': 'yksityiskohta',
	'colophon.typeTitle': 'Kirjasin',
	'colophon.typeBody':
		'Ladottu EB Garamondilla, Georg Duffnerin ja Octavio Pardon herätyksellä kirjasimista jotka Claude Garamont leikkasi 1590-luvulla — humanistisesta perinteestä jossa Kirkko on painanut renessanssista asti. Sen kyrillinen on samojen käsien työtä mutta ei herätä mitään: kyrillistä Garamondia ei koskaan leikattu, joten venäjä on ladottu muodolla joka on piirretty seisomaan muun rinnalla.',
	'colophon.typeArabic':
		'Arabia on sen ulottumattomissa kokonaan ja on ladottu Amirilla — Khaled Hosnyn herätyksellä naskhista joka leikattiin Bulaqin kirjapainolle Kairossa 1905, valittuna samalla perusteella kuin tekstikirjasin: tietty historiallinen kirjatyyppi eikä nykyaikainen piirros.',
	'colophon.typeInitials':
		'Aloitusalkukirjaimet ovat Pirata One, fraktuura jonka versaalit pysyvät luettavina siinä koossa jota anfangi vaatii, ja — venäjää varten — Ponomar, joka toistaa Synodaalipainon kirkkoslaavilaisen kirjasimen. Ponomar latoo alkukirjaimen eikä koskaan tekstiä: nykyaikainen kiertokirje ladottuna kauttaaltaan synodaalikirjasimella sanoisi jotain epätotta siitä mikä se on. Kaikki ovat lisensoituja SIL Open Font Licensen alla ja tarjoillaan tältä sivustolta eikä kolmannelta osapuolelta, joten sivun lukeminen ei pyydä mitään kenenkään muun palvelimelta.',
	'copyright.sourceTitle': 'Avaa alkuperäinen lähdesivu',
	'copyright.sourceLabel': 'Lähde',
	'lang.label': 'Kieli',
	'lang.filter': 'Hae kieliä',
	'lang.more': 'lisää kieliä'
};
