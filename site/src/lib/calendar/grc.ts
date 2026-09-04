/**
 * The General Roman Calendar — the fixed celebrations, by date.
 *
 * ## Why this table is here and not in the corpus
 *
 * Because nobody publishes it where the corpus could reach it. The *Universal
 * Norms on the Liturgical Year and the Calendar* and the *Calendarium Romanum
 * Generale* they accompany were promulgated by Paul VI's *Mysterii Paschalis*
 * (14 February 1969), and vatican.va publishes the motu proprio and NOT the
 * two documents it approves: the page carries the letter, ends at *Datum
 * Romae*, and the Norms and the Calendar are printed in the Roman Missal
 * after the General Instruction. Searched 2026-09-03: vatican.va's own
 * `liturgical_year/` section is six descriptive pages on the seasons, and the
 * Congregation for Divine Worship's notification on particular calendars
 * gives norms for drawing one up rather than a dated list.
 *
 * So this is the first content on the site that is OURS rather than
 * reproduced, and it is deliberately a table in this repository rather than a
 * work in `glossa-corpus`: nothing was fetched to make it, so there is no
 * `raw/` page it could sit beside, and the corpus's whole discipline is that
 * its contents are someone else's words held write-once. `pontificates.ts` is
 * the precedent and the argument is the same one — a fact about the world
 * that no source upstream states, kept as a table here, with the code that
 * needs it.
 *
 * ## What makes it trustworthy is not care, it is the oracle
 *
 * A table of two hundred saints written from published lists is exactly the
 * kind of thing that is 98% right and silently wrong in the remaining 2%, and
 * no amount of re-reading finds those. `oracle.test.ts` compares every day of
 * three years, in all eight transfer variants, against calendars computed
 * independently by GCatholic — see `pipeline/scrapers/liturgical_calendar.py` for what
 * the oracle is and why it is an oracle rather than a source. The Latin names
 * are the Calendarium's own formulae and are asserted against it; the English
 * and Portuguese are the Missal's wordings in those languages and are NOT,
 * because GCatholic's vernaculars are its own house style and a comparison
 * would report a difference on nearly every line while meaning nothing by it.
 *
 * ## Latin is required, the vernaculars are not
 *
 * The Calendarium Romanum Generale is a Latin book, so the Latin name is the
 * celebration's own and every other is a translation of it. A reader whose
 * language this table does not carry falls back through the corpus's existing
 * `CONTENT_LANG_FALLBACK` chain to English and then to Latin, exactly as they
 * do for a work the corpus does not hold in their language — which is why the
 * site can offer this in thirty-four interface languages without claiming to
 * have translated two hundred saints into all of them.
 */

import { PRECEDENCE, type Celebration, type Colour, type Precedence, type Rank } from './types';

/**
 * A row's rank, abbreviated so the table stays readable at a glance.
 *
 * `F` AND `f` ARE NOT THE SAME RANK, and the distinction is the one that
 * decides real days. Both are feasts; a feast OF THE LORD is line 5 of the
 * Table of Liturgical Days and a feast of a saint is line 7, and a Sunday in
 * Ordinary Time sits between them at line 6. So the Transfiguration displaces
 * a Sunday and St Lawrence does not, though both are `rank: 'feast'`. The
 * same split exists for solemnities and is not spelled here only because
 * every solemnity in this table — of the Lord or of a saint — is line 3.
 */
type RankCode =
	| 's' // solemnity
	| 'F' // feast of the Lord
	| 'f' // feast of a saint
	| 'm' // obligatory memorial
	| 'o'; // optional memorial

const RANK_OF: Record<RankCode, Rank> = {
	s: 'solemnity',
	F: 'feast',
	f: 'feast',
	m: 'memorial',
	o: 'optional-memorial'
};

const PRECEDENCE_OF: Record<RankCode, Precedence> = {
	s: PRECEDENCE.SOLEMNITY,
	F: PRECEDENCE.FEAST_OF_THE_LORD,
	f: PRECEDENCE.FEAST,
	m: PRECEDENCE.MEMORIAL,
	o: PRECEDENCE.OPTIONAL_MEMORIAL
};

/**
 * One row: the date it is kept on, a stable id, the three names, the rank,
 * and the colour where it is not white.
 *
 * WHITE IS THE DEFAULT AND RED IS ALWAYS WRITTEN OUT, because red is what a
 * martyr's day is kept in (GIRM 346) and a martyr is the commonest thing in
 * this table — leaving it implicit would make the one property most likely to
 * be wrong the one least visible. Green never appears: a saint's day is never
 * green, and a day with no saint takes its colour from the season.
 */
type Row = readonly [
	day: string,
	id: string,
	la: string,
	en: string,
	pt: string,
	rank: RankCode,
	colour?: Colour
];

/* eslint-disable prettier/prettier */
// prettier-ignore
const ROWS: readonly Row[] = [
	// ------------------------------------------------------------ January
	['01-02', 'basil-gregory', 'Ss. Basilii Magni et Gregorii Nazianzeni, episcoporum et Ecclesiae doctorum', 'Saints Basil the Great and Gregory Nazianzen, Bishops and Doctors of the Church', 'Santos Basílio Magno e Gregório Nazianzeno, bispos e doutores da Igreja', 'm'],
	['01-03', 'holy-name-of-jesus', 'Sanctissimi Nominis Iesu', 'The Most Holy Name of Jesus', 'Santíssimo Nome de Jesus', 'o'],
	['01-07', 'raymond-of-penyafort', 'S. Raymundi de Penyafort, presbyteri', 'Saint Raymond of Penyafort, Priest', 'São Raimundo de Penyafort, presbítero', 'o'],
	['01-13', 'hilary', 'S. Hilarii, episcopi et Ecclesiae doctoris', 'Saint Hilary, Bishop and Doctor of the Church', 'Santo Hilário, bispo e doutor da Igreja', 'o'],
	['01-17', 'anthony-abbot', 'S. Antonii, abbatis', 'Saint Anthony, Abbot', 'Santo Antão, abade', 'm'],
	['01-20', 'fabian', 'S. Fabiani, papae et martyris', 'Saint Fabian, Pope and Martyr', 'São Fabiano, papa e mártir', 'o', 'red'],
	['01-20', 'sebastian', 'S. Sebastiani, martyris', 'Saint Sebastian, Martyr', 'São Sebastião, mártir', 'o', 'red'],
	['01-21', 'agnes', 'S. Agnetis, virginis et martyris', 'Saint Agnes, Virgin and Martyr', 'Santa Inês, virgem e mártir', 'm', 'red'],
	['01-22', 'vincent-deacon', 'S. Vincentii, diaconi et martyris', 'Saint Vincent, Deacon and Martyr', 'São Vicente, diácono e mártir', 'o', 'red'],
	['01-24', 'francis-de-sales', 'S. Francisci de Sales, episcopi et Ecclesiae doctoris', 'Saint Francis de Sales, Bishop and Doctor of the Church', 'São Francisco de Sales, bispo e doutor da Igreja', 'm'],
	['01-25', 'conversion-of-paul', 'In Conversione S. Pauli, apostoli', 'The Conversion of Saint Paul the Apostle', 'Conversão de São Paulo, apóstolo', 'f'],
	['01-26', 'timothy-titus', 'Ss. Timothei et Titi, episcoporum', 'Saints Timothy and Titus, Bishops', 'Santos Timóteo e Tito, bispos', 'm'],
	['01-27', 'angela-merici', 'S. Angelae Merici, virginis', 'Saint Angela Merici, Virgin', 'Santa Ângela Merici, virgem', 'o'],
	['01-28', 'thomas-aquinas', 'S. Thomae de Aquino, presbyteri et Ecclesiae doctoris', 'Saint Thomas Aquinas, Priest and Doctor of the Church', 'São Tomás de Aquino, presbítero e doutor da Igreja', 'm'],
	['01-31', 'john-bosco', 'S. Ioannis Bosco, presbyteri', 'Saint John Bosco, Priest', 'São João Bosco, presbítero', 'm'],

	// ----------------------------------------------------------- February
	['02-02', 'presentation-of-the-lord', 'In Praesentatione Domini', 'The Presentation of the Lord', 'Apresentação do Senhor', 'F'],
	['02-03', 'blaise', 'S. Blasii, episcopi et martyris', 'Saint Blaise, Bishop and Martyr', 'São Brás, bispo e mártir', 'o', 'red'],
	['02-03', 'ansgar', 'S. Ansgarii, episcopi', 'Saint Ansgar, Bishop', 'Santo Anscário, bispo', 'o'],
	['02-05', 'agatha', 'S. Agathae, virginis et martyris', 'Saint Agatha, Virgin and Martyr', 'Santa Águeda, virgem e mártir', 'm', 'red'],
	['02-06', 'paul-miki', 'Ss. Pauli Miki et sociorum, martyrum', 'Saints Paul Miki and Companions, Martyrs', 'Santos Paulo Miki e companheiros, mártires', 'm', 'red'],
	['02-08', 'jerome-emiliani', 'S. Hieronymi Emiliani', 'Saint Jerome Emiliani', 'São Jerônimo Emiliani', 'o'],
	['02-08', 'josephine-bakhita', 'S. Iosephinae Bakhita, virginis', 'Saint Josephine Bakhita, Virgin', 'Santa Josefina Bakhita, virgem', 'o'],
	['02-10', 'scholastica', 'S. Scholasticae, virginis', 'Saint Scholastica, Virgin', 'Santa Escolástica, virgem', 'm'],
	['02-11', 'our-lady-of-lourdes', 'Beatae Mariae Virginis de Lourdes', 'Our Lady of Lourdes', 'Nossa Senhora de Lourdes', 'o'],
	['02-14', 'cyril-methodius', 'Ss. Cyrilli, monachi, et Methodii, episcopi', 'Saints Cyril, Monk, and Methodius, Bishop', 'Santos Cirilo, monge, e Metódio, bispo', 'm'],
	['02-17', 'seven-founders', 'Ss. Septem Fundatorum Ordinis Servorum Beatae Mariae Virginis', 'The Seven Holy Founders of the Servite Order', 'Santos Sete Fundadores da Ordem dos Servos de Maria', 'o'],
	['02-21', 'peter-damian', 'S. Petri Damiani, episcopi et Ecclesiae doctoris', 'Saint Peter Damian, Bishop and Doctor of the Church', 'São Pedro Damião, bispo e doutor da Igreja', 'o'],
	['02-22', 'chair-of-peter', 'Cathedrae S. Petri, apostoli', 'The Chair of Saint Peter the Apostle', 'Cátedra de São Pedro, apóstolo', 'f'],
	['02-23', 'polycarp', 'S. Polycarpi, episcopi et martyris', 'Saint Polycarp, Bishop and Martyr', 'São Policarpo, bispo e mártir', 'm', 'red'],
	['02-27', 'gregory-of-narek', 'S. Gregorii Narecensis, abbatis et Ecclesiae doctoris', 'Saint Gregory of Narek, Abbot and Doctor of the Church', 'São Gregório de Narek, abade e doutor da Igreja', 'o'],

	// -------------------------------------------------------------- March
	['03-04', 'casimir', 'S. Casimiri', 'Saint Casimir', 'São Casimiro', 'o'],
	['03-07', 'perpetua-felicity', 'Ss. Perpetuae et Felicitatis, martyrum', 'Saints Perpetua and Felicity, Martyrs', 'Santas Perpétua e Felicidade, mártires', 'm', 'red'],
	['03-08', 'john-of-god', 'S. Ioannis a Deo, religiosi', 'Saint John of God, Religious', 'São João de Deus, religioso', 'o'],
	['03-09', 'frances-of-rome', 'S. Franciscae Romanae, religiosae', 'Saint Frances of Rome, Religious', 'Santa Francisca Romana, religiosa', 'o'],
	['03-17', 'patrick', 'S. Patricii, episcopi', 'Saint Patrick, Bishop', 'São Patrício, bispo', 'o'],
	['03-18', 'cyril-of-jerusalem', 'S. Cyrilli Hierosolymitani, episcopi et Ecclesiae doctoris', 'Saint Cyril of Jerusalem, Bishop and Doctor of the Church', 'São Cirilo de Jerusalém, bispo e doutor da Igreja', 'o'],
	['03-19', 'joseph', 'S. Ioseph, Sponsi Beatae Mariae Virginis', 'Saint Joseph, Spouse of the Blessed Virgin Mary', 'São José, esposo da Bem-Aventurada Virgem Maria', 's'],
	['03-23', 'turibius', 'S. Turibii de Mogrovejo, episcopi', 'Saint Turibius of Mogrovejo, Bishop', 'Santo Toríbio de Mogrovejo, bispo', 'o'],
	['03-25', 'annunciation', 'In Annuntiatione Domini', 'The Annunciation of the Lord', 'Anunciação do Senhor', 's'],

	// -------------------------------------------------------------- April
	['04-02', 'francis-of-paola', 'S. Francisci de Paola, eremitae', 'Saint Francis of Paola, Hermit', 'São Francisco de Paula, eremita', 'o'],
	['04-04', 'isidore', 'S. Isidori, episcopi et Ecclesiae doctoris', 'Saint Isidore, Bishop and Doctor of the Church', 'Santo Isidoro, bispo e doutor da Igreja', 'o'],
	['04-05', 'vincent-ferrer', 'S. Vincentii Ferrer, presbyteri', 'Saint Vincent Ferrer, Priest', 'São Vicente Ferrer, presbítero', 'o'],
	['04-07', 'john-baptist-de-la-salle', 'S. Ioannis Baptistae de la Salle, presbyteri', 'Saint John Baptist de la Salle, Priest', 'São João Batista de La Salle, presbítero', 'm'],
	['04-11', 'stanislaus', 'S. Stanislai, episcopi et martyris', 'Saint Stanislaus, Bishop and Martyr', 'São Estanislau, bispo e mártir', 'm', 'red'],
	['04-13', 'martin-i', 'S. Martini I, papae et martyris', 'Saint Martin I, Pope and Martyr', 'São Martinho I, papa e mártir', 'o', 'red'],
	['04-21', 'anselm', 'S. Anselmi, episcopi et Ecclesiae doctoris', 'Saint Anselm, Bishop and Doctor of the Church', 'Santo Anselmo, bispo e doutor da Igreja', 'o'],
	['04-23', 'george', 'S. Georgii, martyris', 'Saint George, Martyr', 'São Jorge, mártir', 'o', 'red'],
	['04-23', 'adalbert', 'S. Adalberti, episcopi et martyris', 'Saint Adalbert, Bishop and Martyr', 'Santo Adalberto, bispo e mártir', 'o', 'red'],
	['04-24', 'fidelis', 'S. Fidelis a Sigmaringa, presbyteri et martyris', 'Saint Fidelis of Sigmaringen, Priest and Martyr', 'São Fidélis de Sigmaringen, presbítero e mártir', 'o', 'red'],
	['04-25', 'mark', 'S. Marci, evangelistae', 'Saint Mark, Evangelist', 'São Marcos, evangelista', 'f', 'red'],
	['04-28', 'peter-chanel', 'S. Petri Chanel, presbyteri et martyris', 'Saint Peter Chanel, Priest and Martyr', 'São Pedro Chanel, presbítero e mártir', 'o', 'red'],
	['04-28', 'louis-de-montfort', 'S. Ludovici Mariae Grignion de Montfort, presbyteri', 'Saint Louis Grignion de Montfort, Priest', 'São Luís Maria Grignion de Montfort, presbítero', 'o'],
	['04-29', 'catherine-of-siena', 'S. Catharinae Senensis, virginis et Ecclesiae doctoris', 'Saint Catherine of Siena, Virgin and Doctor of the Church', 'Santa Catarina de Sena, virgem e doutora da Igreja', 'm'],
	['04-30', 'pius-v', 'S. Pii V, papae', 'Saint Pius V, Pope', 'São Pio V, papa', 'o'],

	// ---------------------------------------------------------------- May
	['05-01', 'joseph-the-worker', 'S. Ioseph opificis', 'Saint Joseph the Worker', 'São José operário', 'o'],
	['05-02', 'athanasius', 'S. Athanasii, episcopi et Ecclesiae doctoris', 'Saint Athanasius, Bishop and Doctor of the Church', 'Santo Atanásio, bispo e doutor da Igreja', 'm'],
	['05-03', 'philip-james', 'Ss. Philippi et Iacobi, apostolorum', 'Saints Philip and James, Apostles', 'Santos Filipe e Tiago, apóstolos', 'f', 'red'],
	['05-10', 'john-of-avila', 'S. Ioannis de Ávila, presbyteri et Ecclesiae doctoris', 'Saint John of Ávila, Priest and Doctor of the Church', 'São João de Ávila, presbítero e doutor da Igreja', 'o'],
	['05-12', 'nereus-achilleus', 'Ss. Nerei et Achillei, martyrum', 'Saints Nereus and Achilleus, Martyrs', 'Santos Nereu e Aquileu, mártires', 'o', 'red'],
	['05-12', 'pancras', 'S. Pancratii, martyris', 'Saint Pancras, Martyr', 'São Pancrácio, mártir', 'o', 'red'],
	['05-13', 'our-lady-of-fatima', 'Beatae Mariae Virginis de Fatima', 'Our Lady of Fatima', 'Nossa Senhora de Fátima', 'o'],
	['05-14', 'matthias', 'S. Matthiae, apostoli', 'Saint Matthias, Apostle', 'São Matias, apóstolo', 'f', 'red'],
	['05-18', 'john-i', 'S. Ioannis I, papae et martyris', 'Saint John I, Pope and Martyr', 'São João I, papa e mártir', 'o', 'red'],
	['05-20', 'bernardine-of-siena', 'S. Bernardini Senensis, presbyteri', 'Saint Bernardine of Siena, Priest', 'São Bernardino de Sena, presbítero', 'o'],
	['05-21', 'christopher-magallanes', 'S. Christophori Magallanes, presbyteri, et sociorum, martyrum', 'Saint Christopher Magallanes, Priest, and Companions, Martyrs', 'São Cristóvão Magallanes, presbítero, e companheiros, mártires', 'o', 'red'],
	['05-22', 'rita-of-cascia', 'S. Ritae de Cascia, religiosae', 'Saint Rita of Cascia, Religious', 'Santa Rita de Cássia, religiosa', 'o'],
	['05-25', 'bede', 'S. Bedae Venerabilis, presbyteri et Ecclesiae doctoris', 'Saint Bede the Venerable, Priest and Doctor of the Church', 'São Beda Venerável, presbítero e doutor da Igreja', 'o'],
	['05-25', 'gregory-vii', 'S. Gregorii VII, papae', 'Saint Gregory VII, Pope', 'São Gregório VII, papa', 'o'],
	['05-25', 'mary-magdalene-de-pazzi', 'S. Mariae Magdalenae de Pazzi, virginis', 'Saint Mary Magdalene de’ Pazzi, Virgin', 'Santa Maria Madalena de Pazzi, virgem', 'o'],
	['05-26', 'philip-neri', 'S. Philippi Neri, presbyteri', 'Saint Philip Neri, Priest', 'São Filipe Néri, presbítero', 'm'],
	['05-27', 'augustine-of-canterbury', 'S. Augustini Cantuariensis, episcopi', 'Saint Augustine of Canterbury, Bishop', 'Santo Agostinho de Cantuária, bispo', 'o'],
	['05-29', 'paul-vi', 'S. Pauli VI, papae', 'Saint Paul VI, Pope', 'São Paulo VI, papa', 'o'],
	['05-31', 'visitation', 'In Visitatione Beatae Mariae Virginis', 'The Visitation of the Blessed Virgin Mary', 'Visitação da Bem-Aventurada Virgem Maria', 'f'],

	// --------------------------------------------------------------- June
	['06-01', 'justin', 'S. Iustini, martyris', 'Saint Justin, Martyr', 'São Justino, mártir', 'm', 'red'],
	['06-02', 'marcellinus-peter', 'Ss. Marcellini et Petri, martyrum', 'Saints Marcellinus and Peter, Martyrs', 'Santos Marcelino e Pedro, mártires', 'o', 'red'],
	['06-03', 'charles-lwanga', 'Ss. Caroli Lwanga et sociorum, martyrum', 'Saints Charles Lwanga and Companions, Martyrs', 'Santos Carlos Lwanga e companheiros, mártires', 'm', 'red'],
	['06-05', 'boniface', 'S. Bonifatii, episcopi et martyris', 'Saint Boniface, Bishop and Martyr', 'São Bonifácio, bispo e mártir', 'm', 'red'],
	['06-06', 'norbert', 'S. Norberti, episcopi', 'Saint Norbert, Bishop', 'São Norberto, bispo', 'o'],
	['06-09', 'ephrem', 'S. Ephraem, diaconi et Ecclesiae doctoris', 'Saint Ephrem, Deacon and Doctor of the Church', 'Santo Efrém, diácono e doutor da Igreja', 'o'],
	['06-11', 'barnabas', 'S. Barnabae, apostoli', 'Saint Barnabas, Apostle', 'São Barnabé, apóstolo', 'm', 'red'],
	['06-13', 'anthony-of-padua', 'S. Antonii de Padua, presbyteri et Ecclesiae doctoris', 'Saint Anthony of Padua, Priest and Doctor of the Church', 'Santo Antônio de Pádua, presbítero e doutor da Igreja', 'm'],
	['06-19', 'romuald', 'S. Romualdi, abbatis', 'Saint Romuald, Abbot', 'São Romualdo, abade', 'o'],
	['06-21', 'aloysius-gonzaga', 'S. Aloisii Gonzaga, religiosi', 'Saint Aloysius Gonzaga, Religious', 'São Luís Gonzaga, religioso', 'm'],
	['06-22', 'paulinus-of-nola', 'S. Paulini Nolani, episcopi', 'Saint Paulinus of Nola, Bishop', 'São Paulino de Nola, bispo', 'o'],
	['06-22', 'fisher-more', 'Ss. Ioannis Fisher, episcopi, et Thomae More, martyrum', 'Saints John Fisher, Bishop, and Thomas More, Martyrs', 'Santos João Fisher, bispo, e Tomás Moro, mártires', 'o', 'red'],
	['06-24', 'birth-of-john-the-baptist', 'In Nativitate S. Ioannis Baptistae', 'The Nativity of Saint John the Baptist', 'Natividade de São João Batista', 's'],
	['06-27', 'cyril-of-alexandria', 'S. Cyrilli Alexandrini, episcopi et Ecclesiae doctoris', 'Saint Cyril of Alexandria, Bishop and Doctor of the Church', 'São Cirilo de Alexandria, bispo e doutor da Igreja', 'o'],
	['06-28', 'irenaeus', 'S. Irenaei, episcopi, martyris et Ecclesiae doctoris', 'Saint Irenaeus, Bishop, Martyr and Doctor of the Church', 'Santo Ireneu, bispo, mártir e doutor da Igreja', 'm', 'red'],
	['06-29', 'peter-and-paul', 'Ss. Petri et Pauli, apostolorum', 'Saints Peter and Paul, Apostles', 'Santos Pedro e Paulo, apóstolos', 's', 'red'],
	['06-30', 'first-martyrs-of-rome', 'Ss. Protomartyrum sanctae Ecclesiae Romanae', 'The First Martyrs of the Holy Roman Church', 'Santos Primeiros Mártires da Igreja de Roma', 'o', 'red'],

	// --------------------------------------------------------------- July
	['07-03', 'thomas-apostle', 'S. Thomae, apostoli', 'Saint Thomas, Apostle', 'São Tomé, apóstolo', 'f', 'red'],
	['07-04', 'elizabeth-of-portugal', 'S. Elisabeth Lusitaniae', 'Saint Elizabeth of Portugal', 'Santa Isabel de Portugal', 'o'],
	['07-05', 'anthony-zaccaria', 'S. Antonii Mariae Zaccaria, presbyteri', 'Saint Anthony Zaccaria, Priest', 'Santo Antônio Maria Zaccaria, presbítero', 'o'],
	['07-06', 'maria-goretti', 'S. Mariae Goretti, virginis et martyris', 'Saint Maria Goretti, Virgin and Martyr', 'Santa Maria Goretti, virgem e mártir', 'o', 'red'],
	['07-09', 'augustine-zhao-rong', 'Ss. Augustini Zhao Rong, presbyteri, et sociorum, martyrum', 'Saint Augustine Zhao Rong, Priest, and Companions, Martyrs', 'Santo Agostinho Zhao Rong, presbítero, e companheiros, mártires', 'o', 'red'],
	['07-11', 'benedict', 'S. Benedicti, abbatis', 'Saint Benedict, Abbot', 'São Bento, abade', 'm'],
	['07-13', 'henry', 'S. Henrici', 'Saint Henry', 'São Henrique', 'o'],
	['07-14', 'camillus', 'S. Camilli de Lellis, presbyteri', 'Saint Camillus de Lellis, Priest', 'São Camilo de Lellis, presbítero', 'o'],
	['07-15', 'bonaventure', 'S. Bonaventurae, episcopi et Ecclesiae doctoris', 'Saint Bonaventure, Bishop and Doctor of the Church', 'São Boaventura, bispo e doutor da Igreja', 'm'],
	['07-16', 'our-lady-of-mount-carmel', 'Beatae Mariae Virginis de Monte Carmelo', 'Our Lady of Mount Carmel', 'Nossa Senhora do Carmo', 'o'],
	['07-20', 'apollinaris', 'S. Apollinaris, episcopi et martyris', 'Saint Apollinaris, Bishop and Martyr', 'Santo Apolinário, bispo e mártir', 'o', 'red'],
	['07-21', 'lawrence-of-brindisi', 'S. Laurentii a Brundusio, presbyteri et Ecclesiae doctoris', 'Saint Lawrence of Brindisi, Priest and Doctor of the Church', 'São Lourenço de Brindisi, presbítero e doutor da Igreja', 'o'],
	['07-22', 'mary-magdalene', 'S. Mariae Magdalenae', 'Saint Mary Magdalene', 'Santa Maria Madalena', 'f'],
	['07-23', 'bridget', 'S. Birgittae, religiosae', 'Saint Bridget, Religious', 'Santa Brígida, religiosa', 'o'],
	['07-24', 'sharbel', 'S. Sarbelii Makhluf, presbyteri', 'Saint Sharbel Makhluf, Priest', 'São Charbel Makhluf, presbítero', 'o'],
	['07-25', 'james', 'S. Iacobi, apostoli', 'Saint James, Apostle', 'São Tiago, apóstolo', 'f', 'red'],
	['07-26', 'joachim-anne', 'Ss. Ioachim et Annae, parentum Beatae Mariae Virginis', 'Saints Joachim and Anne, Parents of the Blessed Virgin Mary', 'Santos Joaquim e Ana, pais da Bem-Aventurada Virgem Maria', 'm'],
	['07-29', 'martha-mary-lazarus', 'Ss. Marthae, Mariae et Lazari', 'Saints Martha, Mary and Lazarus', 'Santos Marta, Maria e Lázaro', 'm'],
	['07-30', 'peter-chrysologus', 'S. Petri Chrysologi, episcopi et Ecclesiae doctoris', 'Saint Peter Chrysologus, Bishop and Doctor of the Church', 'São Pedro Crisólogo, bispo e doutor da Igreja', 'o'],
	['07-31', 'ignatius-of-loyola', 'S. Ignatii de Loyola, presbyteri', 'Saint Ignatius of Loyola, Priest', 'Santo Inácio de Loyola, presbítero', 'm'],

	// ------------------------------------------------------------- August
	['08-01', 'alphonsus-liguori', 'S. Alfonsi Mariae de Liguori, episcopi et Ecclesiae doctoris', 'Saint Alphonsus Liguori, Bishop and Doctor of the Church', 'Santo Afonso Maria de Ligório, bispo e doutor da Igreja', 'm'],
	['08-02', 'eusebius-of-vercelli', 'S. Eusebii Vercellensis, episcopi', 'Saint Eusebius of Vercelli, Bishop', 'Santo Eusébio de Vercelli, bispo', 'o'],
	['08-02', 'peter-julian-eymard', 'S. Petri Iuliani Eymard, presbyteri', 'Saint Peter Julian Eymard, Priest', 'São Pedro Julião Eymard, presbítero', 'o'],
	['08-04', 'john-vianney', 'S. Ioannis Mariae Vianney, presbyteri', 'Saint John Vianney, Priest', 'São João Maria Vianney, presbítero', 'm'],
	['08-05', 'dedication-st-mary-major', 'In Dedicatione basilicae S. Mariae', 'The Dedication of the Basilica of Saint Mary Major', 'Dedicação da Basílica de Santa Maria Maior', 'o'],
	['08-06', 'transfiguration', 'In Transfiguratione Domini', 'The Transfiguration of the Lord', 'Transfiguração do Senhor', 'F'],
	['08-07', 'sixtus-ii', 'Ss. Xysti II, papae, et sociorum, martyrum', 'Saint Sixtus II, Pope, and Companions, Martyrs', 'São Sisto II, papa, e companheiros, mártires', 'o', 'red'],
	['08-07', 'cajetan', 'S. Caietani, presbyteri', 'Saint Cajetan, Priest', 'São Caetano, presbítero', 'o'],
	['08-08', 'dominic', 'S. Dominici, presbyteri', 'Saint Dominic, Priest', 'São Domingos, presbítero', 'm'],
	['08-09', 'teresa-benedicta', 'S. Teresiae Benedictae a Cruce, virginis et martyris', 'Saint Teresa Benedicta of the Cross, Virgin and Martyr', 'Santa Teresa Benedita da Cruz, virgem e mártir', 'o', 'red'],
	['08-10', 'lawrence', 'S. Laurentii, diaconi et martyris', 'Saint Lawrence, Deacon and Martyr', 'São Lourenço, diácono e mártir', 'f', 'red'],
	['08-11', 'clare', 'S. Clarae, virginis', 'Saint Clare, Virgin', 'Santa Clara, virgem', 'm'],
	['08-12', 'jane-frances-de-chantal', 'S. Ioannae Franciscae de Chantal, religiosae', 'Saint Jane Frances de Chantal, Religious', 'Santa Joana Francisca de Chantal, religiosa', 'o'],
	['08-13', 'pontian-hippolytus', 'Ss. Pontiani, papae, et Hippolyti, presbyteri, martyrum', 'Saints Pontian, Pope, and Hippolytus, Priest, Martyrs', 'Santos Ponciano, papa, e Hipólito, presbítero, mártires', 'o', 'red'],
	['08-14', 'maximilian-kolbe', 'S. Maximiliani Mariae Kolbe, presbyteri et martyris', 'Saint Maximilian Kolbe, Priest and Martyr', 'São Maximiliano Maria Kolbe, presbítero e mártir', 'm', 'red'],
	['08-15', 'assumption', 'In Assumptione Beatae Mariae Virginis', 'The Assumption of the Blessed Virgin Mary', 'Assunção da Bem-Aventurada Virgem Maria', 's'],
	['08-16', 'stephen-of-hungary', 'S. Stephani Hungariae', 'Saint Stephen of Hungary', 'Santo Estêvão da Hungria', 'o'],
	['08-19', 'john-eudes', 'S. Ioannis Eudes, presbyteri', 'Saint John Eudes, Priest', 'São João Eudes, presbítero', 'o'],
	['08-20', 'bernard', 'S. Bernardi, abbatis et Ecclesiae doctoris', 'Saint Bernard, Abbot and Doctor of the Church', 'São Bernardo, abade e doutor da Igreja', 'm'],
	['08-21', 'pius-x', 'S. Pii X, papae', 'Saint Pius X, Pope', 'São Pio X, papa', 'm'],
	['08-22', 'queenship-of-mary', 'Beatae Mariae Virginis Reginae', 'The Queenship of the Blessed Virgin Mary', 'Nossa Senhora Rainha', 'm'],
	['08-23', 'rose-of-lima', 'S. Rosae de Lima, virginis', 'Saint Rose of Lima, Virgin', 'Santa Rosa de Lima, virgem', 'o'],
	['08-24', 'bartholomew', 'S. Bartholomaei, apostoli', 'Saint Bartholomew, Apostle', 'São Bartolomeu, apóstolo', 'f', 'red'],
	['08-25', 'louis', 'S. Ludovici', 'Saint Louis', 'São Luís', 'o'],
	['08-25', 'joseph-calasanz', 'S. Ioseph de Calasanz, presbyteri', 'Saint Joseph Calasanz, Priest', 'São José de Calasanz, presbítero', 'o'],
	['08-27', 'monica', 'S. Monicae', 'Saint Monica', 'Santa Mônica', 'm'],
	['08-28', 'augustine', 'S. Augustini, episcopi et Ecclesiae doctoris', 'Saint Augustine, Bishop and Doctor of the Church', 'Santo Agostinho, bispo e doutor da Igreja', 'm'],
	['08-29', 'passion-of-john-the-baptist', 'In Passione S. Ioannis Baptistae', 'The Passion of Saint John the Baptist', 'Martírio de São João Batista', 'm', 'red'],

	// ---------------------------------------------------------- September
	['09-03', 'gregory-the-great', 'S. Gregorii Magni, papae et Ecclesiae doctoris', 'Saint Gregory the Great, Pope and Doctor of the Church', 'São Gregório Magno, papa e doutor da Igreja', 'm'],
	['09-05', 'teresa-of-calcutta', 'S. Teresiae de Calcutta, virginis', 'Saint Teresa of Calcutta, Virgin', 'Santa Teresa de Calcutá, virgem', 'o'],
	['09-08', 'nativity-of-mary', 'In Nativitate Beatae Mariae Virginis', 'The Nativity of the Blessed Virgin Mary', 'Natividade da Bem-Aventurada Virgem Maria', 'f'],
	['09-09', 'peter-claver', 'S. Petri Claver, presbyteri', 'Saint Peter Claver, Priest', 'São Pedro Claver, presbítero', 'o'],
	['09-12', 'holy-name-of-mary', 'Sanctissimi Nominis Mariae', 'The Most Holy Name of Mary', 'Santíssimo Nome de Maria', 'o'],
	['09-13', 'john-chrysostom', 'S. Ioannis Chrysostomi, episcopi et Ecclesiae doctoris', 'Saint John Chrysostom, Bishop and Doctor of the Church', 'São João Crisóstomo, bispo e doutor da Igreja', 'm'],
	['09-14', 'exaltation-of-the-cross', 'In Exaltatione sanctae Crucis', 'The Exaltation of the Holy Cross', 'Exaltação da Santa Cruz', 'F', 'red'],
	['09-15', 'our-lady-of-sorrows', 'Beatae Mariae Virginis Perdolentis', 'Our Lady of Sorrows', 'Nossa Senhora das Dores', 'm'],
	['09-16', 'cornelius-cyprian', 'Ss. Cornelii, papae, et Cypriani, episcopi, martyrum', 'Saints Cornelius, Pope, and Cyprian, Bishop, Martyrs', 'Santos Cornélio, papa, e Cipriano, bispo, mártires', 'm', 'red'],
	['09-17', 'robert-bellarmine', 'S. Roberti Bellarmino, episcopi et Ecclesiae doctoris', 'Saint Robert Bellarmine, Bishop and Doctor of the Church', 'São Roberto Belarmino, bispo e doutor da Igreja', 'o'],
	['09-17', 'hildegard', 'S. Hildegardis Bingensis, virginis et Ecclesiae doctoris', 'Saint Hildegard of Bingen, Virgin and Doctor of the Church', 'Santa Hildegarda de Bingen, virgem e doutora da Igreja', 'o'],
	['09-19', 'januarius', 'S. Ianuarii, episcopi et martyris', 'Saint Januarius, Bishop and Martyr', 'São Januário, bispo e mártir', 'o', 'red'],
	['09-20', 'andrew-kim', 'Ss. Andreae Kim Taegon, presbyteri, et Pauli Chong Hasang et sociorum, martyrum', 'Saints Andrew Kim Tae-gon, Priest, Paul Chong Ha-sang, and Companions, Martyrs', 'Santos André Kim Taegon, presbítero, Paulo Chong Hasang e companheiros, mártires', 'm', 'red'],
	['09-21', 'matthew', 'S. Matthaei, apostoli et evangelistae', 'Saint Matthew, Apostle and Evangelist', 'São Mateus, apóstolo e evangelista', 'f', 'red'],
	['09-23', 'padre-pio', 'S. Pii de Pietrelcina, presbyteri', 'Saint Pius of Pietrelcina, Priest', 'São Pio de Pietrelcina, presbítero', 'm'],
	['09-26', 'cosmas-damian', 'Ss. Cosmae et Damiani, martyrum', 'Saints Cosmas and Damian, Martyrs', 'Santos Cosme e Damião, mártires', 'o', 'red'],
	['09-27', 'vincent-de-paul', 'S. Vincentii de Paul, presbyteri', 'Saint Vincent de Paul, Priest', 'São Vicente de Paulo, presbítero', 'm'],
	['09-28', 'wenceslaus', 'S. Wenceslai, martyris', 'Saint Wenceslaus, Martyr', 'São Venceslau, mártir', 'o', 'red'],
	['09-28', 'lawrence-ruiz', 'Ss. Laurentii Ruiz et sociorum, martyrum', 'Saint Lawrence Ruiz and Companions, Martyrs', 'São Lourenço Ruiz e companheiros, mártires', 'o', 'red'],
	['09-29', 'archangels', 'Ss. Michaelis, Gabrielis et Raphaelis, archangelorum', 'Saints Michael, Gabriel and Raphael, Archangels', 'Santos Miguel, Gabriel e Rafael, arcanjos', 'f'],
	['09-30', 'jerome', 'S. Hieronymi, presbyteri et Ecclesiae doctoris', 'Saint Jerome, Priest and Doctor of the Church', 'São Jerônimo, presbítero e doutor da Igreja', 'm'],

	// ------------------------------------------------------------ October
	['10-01', 'therese-of-lisieux', 'S. Teresiae a Iesu Infante, virginis et Ecclesiae doctoris', 'Saint Thérèse of the Child Jesus, Virgin and Doctor of the Church', 'Santa Teresinha do Menino Jesus, virgem e doutora da Igreja', 'm'],
	['10-02', 'guardian-angels', 'Ss. Angelorum Custodum', 'The Holy Guardian Angels', 'Santos Anjos da Guarda', 'm'],
	['10-04', 'francis-of-assisi', 'S. Francisci Assisiensis', 'Saint Francis of Assisi', 'São Francisco de Assis', 'm'],
	['10-05', 'faustina', 'S. Faustinae Kowalska, virginis', 'Saint Faustina Kowalska, Virgin', 'Santa Faustina Kowalska, virgem', 'o'],
	['10-06', 'bruno', 'S. Brunonis, presbyteri', 'Saint Bruno, Priest', 'São Bruno, presbítero', 'o'],
	['10-07', 'our-lady-of-the-rosary', 'Beatae Mariae Virginis a Rosario', 'Our Lady of the Rosary', 'Nossa Senhora do Rosário', 'm'],
	['10-09', 'denis', 'Ss. Dionysii, episcopi, et sociorum, martyrum', 'Saint Denis, Bishop, and Companions, Martyrs', 'São Dionísio, bispo, e companheiros, mártires', 'o', 'red'],
	['10-09', 'john-leonardi', 'S. Ioannis Leonardi, presbyteri', 'Saint John Leonardi, Priest', 'São João Leonardi, presbítero', 'o'],
	['10-09', 'john-henry-newman', 'S. Ioannis Henrici Newman, presbyteri et Ecclesiae doctoris', 'Saint John Henry Newman, Priest and Doctor of the Church', 'São John Henry Newman, presbítero e doutor da Igreja', 'o'],
	['10-11', 'john-xxiii', 'S. Ioannis XXIII, papae', 'Saint John XXIII, Pope', 'São João XXIII, papa', 'o'],
	['10-14', 'callistus-i', 'S. Callisti I, papae et martyris', 'Saint Callistus I, Pope and Martyr', 'São Calisto I, papa e mártir', 'o', 'red'],
	['10-15', 'teresa-of-avila', 'S. Teresiae a Iesu, virginis et Ecclesiae doctoris', 'Saint Teresa of Jesus, Virgin and Doctor of the Church', 'Santa Teresa de Jesus, virgem e doutora da Igreja', 'm'],
	['10-16', 'hedwig', 'S. Hedvigis, religiosae', 'Saint Hedwig, Religious', 'Santa Eduviges, religiosa', 'o'],
	['10-16', 'margaret-mary-alacoque', 'S. Margaritae Mariae Alacoque, virginis', 'Saint Margaret Mary Alacoque, Virgin', 'Santa Margarida Maria Alacoque, virgem', 'o'],
	['10-17', 'ignatius-of-antioch', 'S. Ignatii Antiocheni, episcopi et martyris', 'Saint Ignatius of Antioch, Bishop and Martyr', 'Santo Inácio de Antioquia, bispo e mártir', 'm', 'red'],
	['10-18', 'luke', 'S. Lucae, evangelistae', 'Saint Luke, Evangelist', 'São Lucas, evangelista', 'f', 'red'],
	['10-19', 'north-american-martyrs', 'Ss. Ioannis de Brébeuf et Isaac Jogues, presbyterorum, et sociorum, martyrum', 'Saints John de Brébeuf and Isaac Jogues, Priests, and Companions, Martyrs', 'Santos João de Brébeuf e Isaac Jogues, presbíteros, e companheiros, mártires', 'o', 'red'],
	['10-19', 'paul-of-the-cross', 'S. Pauli a Cruce, presbyteri', 'Saint Paul of the Cross, Priest', 'São Paulo da Cruz, presbítero', 'o'],
	['10-22', 'john-paul-ii', 'S. Ioannis Pauli II, papae', 'Saint John Paul II, Pope', 'São João Paulo II, papa', 'o'],
	['10-23', 'john-of-capistrano', 'S. Ioannis de Capestrano, presbyteri', 'Saint John of Capistrano, Priest', 'São João de Capistrano, presbítero', 'o'],
	['10-24', 'anthony-mary-claret', 'S. Antonii Mariae Claret, episcopi', 'Saint Anthony Mary Claret, Bishop', 'Santo Antônio Maria Claret, bispo', 'o'],
	['10-28', 'simon-jude', 'Ss. Simonis et Iudae, apostolorum', 'Saints Simon and Jude, Apostles', 'Santos Simão e Judas, apóstolos', 'f', 'red'],

	// ----------------------------------------------------------- November
	['11-01', 'all-saints', 'Omnium Sanctorum', 'All Saints', 'Todos os Santos', 's'],
	['11-03', 'martin-de-porres', 'S. Martini de Porres, religiosi', 'Saint Martin de Porres, Religious', 'São Martinho de Porres, religioso', 'o'],
	['11-04', 'charles-borromeo', 'S. Caroli Borromeo, episcopi', 'Saint Charles Borromeo, Bishop', 'São Carlos Borromeu, bispo', 'm'],
	['11-09', 'dedication-of-the-lateran', 'In Dedicatione basilicae Lateranensis', 'The Dedication of the Lateran Basilica', 'Dedicação da Basílica de Latrão', 'F'],
	['11-10', 'leo-the-great', 'S. Leonis Magni, papae et Ecclesiae doctoris', 'Saint Leo the Great, Pope and Doctor of the Church', 'São Leão Magno, papa e doutor da Igreja', 'm'],
	['11-11', 'martin-of-tours', 'S. Martini Turonensis, episcopi', 'Saint Martin of Tours, Bishop', 'São Martinho de Tours, bispo', 'm'],
	['11-12', 'josaphat', 'S. Iosaphat, episcopi et martyris', 'Saint Josaphat, Bishop and Martyr', 'São Josafá, bispo e mártir', 'm', 'red'],
	['11-15', 'albert-the-great', 'S. Alberti Magni, episcopi et Ecclesiae doctoris', 'Saint Albert the Great, Bishop and Doctor of the Church', 'Santo Alberto Magno, bispo e doutor da Igreja', 'o'],
	['11-16', 'margaret-of-scotland', 'S. Margaritae Scotiae', 'Saint Margaret of Scotland', 'Santa Margarida da Escócia', 'o'],
	['11-16', 'gertrude', 'S. Gertrudis, virginis', 'Saint Gertrude, Virgin', 'Santa Gertrudes, virgem', 'o'],
	['11-17', 'elizabeth-of-hungary', 'S. Elisabeth Hungariae, religiosae', 'Saint Elizabeth of Hungary, Religious', 'Santa Isabel da Hungria, religiosa', 'm'],
	['11-18', 'dedication-of-peter-and-paul', 'In Dedicatione basilicarum Ss. Petri et Pauli, apostolorum', 'The Dedication of the Basilicas of Saints Peter and Paul, Apostles', 'Dedicação das Basílicas de São Pedro e São Paulo, apóstolos', 'o'],
	['11-21', 'presentation-of-mary', 'In Praesentatione Beatae Mariae Virginis', 'The Presentation of the Blessed Virgin Mary', 'Apresentação da Bem-Aventurada Virgem Maria', 'm'],
	['11-22', 'cecilia', 'S. Caeciliae, virginis et martyris', 'Saint Cecilia, Virgin and Martyr', 'Santa Cecília, virgem e mártir', 'm', 'red'],
	['11-23', 'clement-i', 'S. Clementis I, papae et martyris', 'Saint Clement I, Pope and Martyr', 'São Clemente I, papa e mártir', 'o', 'red'],
	['11-23', 'columban', 'S. Columbani, abbatis', 'Saint Columban, Abbot', 'São Columbano, abade', 'o'],
	['11-24', 'andrew-dung-lac', 'Ss. Andreae Dung-Lac, presbyteri, et sociorum, martyrum', 'Saints Andrew Dung-Lac, Priest, and Companions, Martyrs', 'Santos André Dung-Lac, presbítero, e companheiros, mártires', 'm', 'red'],
	['11-25', 'catherine-of-alexandria', 'S. Catharinae Alexandrinae, virginis et martyris', 'Saint Catherine of Alexandria, Virgin and Martyr', 'Santa Catarina de Alexandria, virgem e mártir', 'o', 'red'],
	['11-30', 'andrew', 'S. Andreae, apostoli', 'Saint Andrew, Apostle', 'Santo André, apóstolo', 'f', 'red'],

	// ----------------------------------------------------------- December
	['12-03', 'francis-xavier', 'S. Francisci Xavier, presbyteri', 'Saint Francis Xavier, Priest', 'São Francisco Xavier, presbítero', 'm'],
	['12-04', 'john-damascene', 'S. Ioannis Damasceni, presbyteri et Ecclesiae doctoris', 'Saint John Damascene, Priest and Doctor of the Church', 'São João Damasceno, presbítero e doutor da Igreja', 'o'],
	['12-06', 'nicholas', 'S. Nicolai, episcopi', 'Saint Nicholas, Bishop', 'São Nicolau, bispo', 'o'],
	['12-07', 'ambrose', 'S. Ambrosii, episcopi et Ecclesiae doctoris', 'Saint Ambrose, Bishop and Doctor of the Church', 'Santo Ambrósio, bispo e doutor da Igreja', 'm'],
	['12-08', 'immaculate-conception', 'In Conceptione immaculata Beatae Mariae Virginis', 'The Immaculate Conception of the Blessed Virgin Mary', 'Imaculada Conceição da Bem-Aventurada Virgem Maria', 's'],
	['12-09', 'juan-diego', 'S. Ioannis Didaci Cuauhtlatoatzin', 'Saint Juan Diego Cuauhtlatoatzin', 'São Juan Diego Cuauhtlatoatzin', 'o'],
	['12-10', 'our-lady-of-loreto', 'Beatae Mariae Virginis Lauretanae', 'Our Lady of Loreto', 'Nossa Senhora de Loreto', 'o'],
	['12-11', 'damasus-i', 'S. Damasi I, papae', 'Saint Damasus I, Pope', 'São Dâmaso I, papa', 'o'],
	['12-12', 'our-lady-of-guadalupe', 'Beatae Mariae Virginis Guadalupensis', 'Our Lady of Guadalupe', 'Nossa Senhora de Guadalupe', 'o'],
	['12-13', 'lucy', 'S. Luciae, virginis et martyris', 'Saint Lucy, Virgin and Martyr', 'Santa Luzia, virgem e mártir', 'm', 'red'],
	['12-14', 'john-of-the-cross', 'S. Ioannis a Cruce, presbyteri et Ecclesiae doctoris', 'Saint John of the Cross, Priest and Doctor of the Church', 'São João da Cruz, presbítero e doutor da Igreja', 'm'],
	['12-21', 'peter-canisius', 'S. Petri Canisii, presbyteri et Ecclesiae doctoris', 'Saint Peter Canisius, Priest and Doctor of the Church', 'São Pedro Canísio, presbítero e doutor da Igreja', 'o'],
	['12-23', 'john-of-kanty', 'S. Ioannis de Kety, presbyteri', 'Saint John of Kanty, Priest', 'São João de Kanty, presbítero', 'o'],
	['12-26', 'stephen', 'S. Stephani, protomartyris', 'Saint Stephen, the First Martyr', 'Santo Estêvão, primeiro mártir', 'f', 'red'],
	['12-27', 'john-evangelist', 'S. Ioannis, apostoli et evangelistae', 'Saint John, Apostle and Evangelist', 'São João, apóstolo e evangelista', 'f'],
	['12-28', 'holy-innocents', 'Ss. Innocentium, martyrum', 'The Holy Innocents, Martyrs', 'Santos Inocentes, mártires', 'f', 'red'],
	['12-29', 'thomas-becket', 'S. Thomae Becket, episcopi et martyris', 'Saint Thomas Becket, Bishop and Martyr', 'São Tomás Becket, bispo e mártir', 'o', 'red'],
	['12-31', 'sylvester-i', 'S. Silvestri I, papae', 'Saint Sylvester I, Pope', 'São Silvestre I, papa', 'o']
];
/* eslint-enable prettier/prettier */

/**
 * The celebrations that are OF Our Lady, so that the Saturday memorial of the
 * Blessed Virgin Mary is not also offered beside them (Universal Norms n. 15
 * gives that Saturday to her; a Saturday that is already hers does not need
 * it twice). Measured against the oracle: 12 September 2026 is a Saturday and
 * the Most Holy Name of Mary, and the oracle offers that alone.
 */
const MARIAN = new Set([
	'our-lady-of-lourdes',
	'our-lady-of-fatima',
	'our-lady-of-mount-carmel',
	'holy-name-of-mary',
	'our-lady-of-sorrows',
	'our-lady-of-the-rosary',
	'our-lady-of-loreto',
	'our-lady-of-guadalupe',
	'queenship-of-mary',
	'presentation-of-mary',
	'dedication-st-mary-major',
	'visitation',
	'nativity-of-mary',
	'immaculate-conception',
	'assumption'
]);

/**
 * The first civil year a celebration was in the General Roman Calendar, for
 * the ones inscribed recently enough to matter.
 *
 * THE CALENDAR CHANGES, and a table with no dates in it quietly claims it
 * never did. The oracle caught this on its first run: GCatholic's 2025
 * calendar has nothing on 9 October but John Leonardi and Denis, and its 2026
 * and 2027 calendars add John Henry Newman — who was inscribed as an optional
 * memorial, and named a Doctor of the Church, in the interval. A calendar for
 * 2025 that shows him is wrong about 2025.
 *
 * Only additions inside the range anyone asks about need a row. Nothing here
 * records a REMOVAL yet; when one happens it wants an `until` beside this.
 */
const SINCE: Record<string, number> = {
	'john-henry-newman': 2026
};

/**
 * Solemnities that are ANTICIPATED when impeded rather than deferred.
 *
 * Saint Joseph is the only one. When 19 March falls in Holy Week it is kept
 * on the free day before — 15 March in 2008, the Saturday before Palm Sunday
 * — while the Annunciation in the same position goes forward past the whole
 * Octave of Easter. Both directions are "the closest day not listed under
 * nn. 1–8" from where each stands, and neither is derivable from the other,
 * which is why this is a table rather than a rule.
 */
const ANTICIPATED = new Set(['joseph']);

function toCelebration(row: Row): Celebration {
	const [, id, la, en, pt, rank, colour] = row;
	return {
		id,
		names: { la, en, pt },
		rank: RANK_OF[rank],
		precedence: PRECEDENCE_OF[rank],
		colour: colour ?? 'white',
		source: 'grc',
		...(MARIAN.has(id) ? { marian: true } : {}),
		...(SINCE[id] ? { since: SINCE[id] } : {}),
		// Only a solemnity is moved rather than dropped when a higher class
		// takes its day (n. 60). Everything below is simply omitted that year.
		...(rank === 's' ? { transferable: true } : {}),
		...(ANTICIPATED.has(id) ? { anticipated: true } : {})
	};
}

/**
 * `MM-DD` -> the celebrations the General Roman Calendar fixes on that date,
 * in the order the Calendar prints them.
 *
 * Several dates carry more than one — 20 January is Fabian and Sebastian, 25
 * May is three — and they do not compete: they are optional memorials, of
 * which any may be chosen. `resolveDay` puts the whole list on the day and
 * lets the ranking pick a winner only where ranks actually differ.
 */
export const GRC: ReadonlyMap<string, readonly Celebration[]> = (() => {
	const map = new Map<string, Celebration[]>();
	for (const row of ROWS) {
		const list = map.get(row[0]);
		if (list) list.push(toCelebration(row));
		else map.set(row[0], [toCelebration(row)]);
	}
	return map;
})();

/**
 * All Souls — 2 November, and the one celebration in the Calendar that is not
 * ranked by the ordinary vocabulary.
 *
 * The Table of Liturgical Days puts "the Commemoration of All the Faithful
 * Departed" on line 3, WITH the solemnities, while nothing calls it a
 * solemnity. So it is here rather than in the table above: giving it
 * `rank: 'solemnity'` to obtain line 3 would state something the Calendar
 * does not, and giving it a lower rank would let a Sunday displace it, which
 * is exactly what line 3 exists to prevent.
 */
export const ALL_SOULS: Celebration = {
	id: 'all-souls',
	names: {
		la: 'In Commemoratione omnium fidelium defunctorum',
		en: 'The Commemoration of All the Faithful Departed (All Souls’ Day)',
		pt: 'Comemoração de Todos os Fiéis Defuntos'
	},
	rank: 'feast',
	precedence: PRECEDENCE.SOLEMNITY,
	colour: 'violet'
};

/**
 * The Saturday memorial of the Blessed Virgin Mary.
 *
 * Not a fixed date and not a movable feast: an optional memorial available on
 * ANY Saturday in Ordinary Time on which no other obligatory celebration
 * falls (Universal Norms n. 15). It is therefore produced by `resolveDay`
 * rather than sitting in a table, and it is the commonest optional memorial
 * in the year — which is why leaving it out would show as a difference on
 * some forty Saturdays against the oracle.
 */
export const SATURDAY_MEMORIAL_OF_MARY: Celebration = {
	id: 'saturday-memorial-of-mary',
	names: {
		la: 'De sancta Maria in sabbato',
		en: 'Saturday Memorial of the Blessed Virgin Mary',
		pt: 'Memória de Nossa Senhora no Sábado'
	},
	rank: 'optional-memorial',
	precedence: PRECEDENCE.OPTIONAL_MEMORIAL,
	colour: 'white',
	source: 'grc',
	marian: true
};

/**
 * The holy days of obligation of the universal law — CIC c. 1246 §1, which
 * the corpus holds in seven languages and which the calendar page cites.
 *
 * Sunday is the first of them and is not in this list, because it is not a
 * celebration with an id: the canon names it separately as the primordial
 * feast day, and every Sunday is one. A conference may suppress or move any
 * of the rest under §2, which is what `NationalCalendar.notObligatory` is
 * for — so this is the universal law's list and never a country's.
 */
export const HOLY_DAYS_OF_OBLIGATION: readonly string[] = [
	'christmas',
	'epiphany',
	'ascension',
	'corpus-christi',
	'mary-mother-of-god',
	'immaculate-conception',
	'assumption',
	'joseph',
	'peter-and-paul',
	'all-saints'
];
