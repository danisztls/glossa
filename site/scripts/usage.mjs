/**
 * Read the usage measurement — the report end of `src/lib/usage.ts`.
 *
 * Queries D1 through `wrangler d1 execute --remote`, which needs no credential
 * beyond the wrangler OAuth token already on this machine (its `d1` scope
 * covers it). There is no dashboard and no web UI: the rest of this project's
 * instrumentation is a terminal report — `audit.py`, `census.py`,
 * `reference-coverage.mjs` — and a number worth acting on is a number worth
 * printing beside the others.
 *
 *   npm run usage                    last 30 days
 *   npm run usage -- --days 7
 *   npm run usage -- --all           include cells below the suppression floor
 *   npm run usage -- --json          the same figures, unformatted
 *   npm run usage -- --sql "..."     one ad-hoc query
 *   npm run usage -- --prune         force the retention prune (the worker's
 *                                    daily cron is what normally does it)
 *
 * WHY CELLS BELOW FIVE ARE HIDDEN BY DEFAULT. Not because a count of three is
 * dangerous — nothing here identifies anyone — but because a single-reader cell
 * invites you to read a person into it, and that is the habit worth not
 * forming. `--all` is there for the days when the whole site has eleven
 * sessions and the floor hides everything.
 *
 * See docs/decisions.md §Usage measurement.
 */
import { execFileSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';

const ARGV = process.argv.slice(2);

/**
 * One row of a breakdown. `bucket` for a scalar column, `value` for a tag;
 * `bar` reads whichever is present so the two shapes render identically.
 *
 * @typedef {{ bucket?: string, value?: string, n: number, withRefs?: number }} Row
 * @typedef {{ country: string, ui: string, content: string, n: number }} GeoRow
 * @typedef {{
 *   since: number,
 *   totals: Record<string, number>,
 *   daily: { day: string, n: number }[],
 *   days28: Row[], visits: Row[], age: Row[], entry: Row[], minutes: Row[],
 *   behind: Row[], swFail: Row[], missKind: Row[], missBook: Row[],
 *   works: Row[], sections: Row[], refKinds: Row[],
 *   geo: GeoRow[]
 * }} Report
 */

/** @param {string} name */
function flag(name) {
	return ARGV.includes(`--${name}`);
}

/**
 * @param {string} name
 * @param {string} [fallback]
 * @returns {string | undefined}
 */
function option(name, fallback) {
	const at = ARGV.indexOf(`--${name}`);
	return at >= 0 && ARGV[at + 1] ? ARGV[at + 1] : fallback;
}

const DATABASE = option('db') ?? 'glossa-usage';
const DAYS = Number(option('days') ?? '30');
const SHOW_ALL = flag('all');
/** Rows in a breakdown below this are folded away unless `--all`. */
const FLOOR = 5;
/**
 * Retention window, in days. MUST equal `RETENTION_DAYS` in
 * `src/lib/usage-store.ts` — this script runs in plain Node and cannot import
 * the TypeScript, so the number is duplicated and `usage-report.test.ts`
 * asserts the two agree.
 *
 * The POLICY is the worker's daily cron (`scheduled()` in `src/worker.ts`,
 * declared in `wrangler.jsonc`); `--prune` here is a manual way to force it,
 * not the mechanism. A retention period that only ran when someone remembered
 * to type a flag would be an indeterminate retention period however firmly the
 * constant were written down.
 */
const KEEP_DAYS = 400;

if (!Number.isFinite(DAYS) || DAYS <= 0) {
	console.error('--days must be a positive number');
	process.exit(1);
}

/**
 * Run one statement and return its rows.
 *
 * @param {string} sql
 * @returns {any[]}
 */
function query(sql) {
	let raw;
	try {
		raw = execFileSync(
			'npx',
			['wrangler', 'd1', 'execute', DATABASE, '--remote', '--json', '--command', sql],
			{ encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], maxBuffer: 32 * 1024 * 1024 }
		);
	} catch (err) {
		const e = /** @type {{ stderr?: string, stdout?: string, message?: string }} */ (err);
		const detail = (e.stderr || e.stdout || e.message || '').toString().trim();
		console.error(`\nCould not reach D1 (${DATABASE}).\n${detail}\n`);
		console.error(
			'If the database does not exist yet:\n' +
				`  npx wrangler d1 create ${DATABASE}\n` +
				`  npx wrangler d1 migrations apply ${DATABASE} --remote\n`
		);
		process.exit(1);
	}
	// Wrangler prints progress lines before the JSON payload.
	const start = raw.indexOf('[');
	const parsed = JSON.parse(start >= 0 ? raw.slice(start) : raw);
	return parsed[0]?.results ?? [];
}

const SINCE = `date('now', '-${DAYS} day')`;

// --- Queries --------------------------------------------------------------

/** @param {string} column @returns {Row[]} */
function scalarBreakdown(column) {
	return query(
		`select ${column} as bucket, count(*) as n from session
		 where day >= ${SINCE} group by 1 order by 1`
	);
}

/** @param {string} kind @param {number} [limit] @returns {Row[]} */
function tagBreakdown(kind, limit = 25) {
	return query(
		`select t.value as value, count(*) as n from session_tag t
		 join session s on s.id = t.session_id
		 where t.kind = '${kind}' and s.day >= ${SINCE}
		 group by 1 order by n desc limit ${limit}`
	);
}

/** @returns {Report} */
function collect() {
	const totals =
		query(
			`select count(*) as sessions,
		        sum(case when mode = 'app' then 1 else 0 end) as installed,
		        sum(case when device = 'phone' then 1 else 0 end) as phone,
		        sum(case when offline = 1 then 1 else 0 end) as offline,
		        sum(case when library = 'full' then 1 else 0 end) as libraryFull,
		        sum(case when sw_fail is not null then 1 else 0 end) as swFail,
		        sum(case when compare = 1 then 1 else 0 end) as compared,
		        sum(case when refs != '0' then 1 else 0 end) as followedRefs,
		        sum(case when jump != 'none' then 1 else 0 end) as usedJump,
		        sum(case when jump = 'miss' then 1 else 0 end) as jumpMiss
		 from session where day >= ${SINCE}`
		)[0] ?? {};

	return {
		since: DAYS,
		totals,
		daily: query(
			`select day, count(*) as n from session where day >= ${SINCE} group by 1 order by 1`
		),
		days28: scalarBreakdown('days28'),
		visits: scalarBreakdown('visits'),
		age: scalarBreakdown('age'),
		entry: scalarBreakdown('entry'),
		minutes: scalarBreakdown('minutes'),
		behind: scalarBreakdown('behind'),
		swFail: query(
			`select sw_fail as bucket, count(*) as n from session
			 where day >= ${SINCE} and sw_fail is not null group by 1 order by n desc`
		),
		missKind: query(
			`select miss_kind as bucket, count(*) as n from session
			 where day >= ${SINCE} and miss_kind is not null group by 1 order by n desc`
		),
		missBook: query(
			`select miss_book as value, count(*) as n from session
			 where day >= ${SINCE} and miss_book is not null group by 1 order by n desc limit 15`
		),
		works: query(
			`select t.value as value, count(*) as n,
			        sum(case when s.refs != '0' then 1 else 0 end) as withRefs
			 from session_tag t join session s on s.id = t.session_id
			 where t.kind = 'work' and s.day >= ${SINCE}
			 group by 1 order by n desc limit 25`
		),
		sections: tagBreakdown('section'),
		refKinds: tagBreakdown('refKind'),
		geo: query(
			`select country, ui, content, sum(n) as n from geo_lang
			 where day >= ${SINCE} group by 1, 2, 3 order by n desc`
		)
	};
}

// --- Rendering ------------------------------------------------------------

/** @param {number} part @param {number} whole */
const pct = (part, whole) => (whole > 0 ? `${Math.round((part / whole) * 100)}%` : '—');

/** @param {string} title @param {string} body */
function section(title, body) {
	return `\n${title}\n${body}`;
}

/** @param {{ day: string, n: number }[]} daily */
function sparkline(daily) {
	if (daily.length === 0) return '  —';
	const marks = '▁▂▃▄▅▆▇█';
	const peak = Math.max(...daily.map((row) => row.n));
	const line = daily
		.map(
			(row) => marks[Math.min(marks.length - 1, Math.floor((row.n / peak) * (marks.length - 1)))]
		)
		.join('');
	return `  ${line}  peak ${peak}/day over ${daily.length} day(s)`;
}

/**
 * @param {Report} data
 * @param {{ days?: number, all?: boolean, floor?: number }} [opts]
 */
export function render(data, opts = {}) {
	const DAYS = opts.days ?? data.since;
	const SHOW_ALL = opts.all ?? false;
	const FLOOR = opts.floor ?? 5;

	/**
	 * THE FLOOR IS FOR POPULATION BREAKDOWNS, NOT FOR DIAGNOSTICS. Hiding a
	 * cell below five keeps you from reading a person into "one reader in
	 * Malta" — but a service-worker failure, a query that missed, or a book
	 * someone asked for and did not get names no reader at all, and their whole
	 * value is in the long tail. Three quota failures is a defect report, and a
	 * report that suppressed it would have defeated the reason that column
	 * exists. Those callers pass `floor: 0`.
	 *
	 * Defined here rather than at module scope because it has to read THIS
	 * call's floor: `render` takes them as options so the renderer can be
	 * tested without a database, and a `bar` closing over the module-level
	 * constants would silently ignore both.
	 */
	/** @param {Row[]} rows @param {number} total @param {number} [floor] */
	const bar = (rows, total, floor = FLOOR) => {
		const visible = SHOW_ALL || floor === 0 ? rows : rows.filter((row) => row.n >= floor);
		const hidden = rows.length - visible.length;
		const width = Math.max(0, ...visible.map((row) => String(row.bucket ?? row.value).length));
		const lines = visible.map((row) => {
			const label = String(row.bucket ?? row.value).padEnd(width);
			return `  ${label}  ${String(row.n).padStart(6)}  ${pct(row.n, total).padStart(4)}`;
		});
		if (hidden > 0) lines.push(`  (${hidden} row(s) below ${floor} not shown; --all)`);
		return lines.join('\n') || '  —';
	};
	const sessions = Number(data.totals.sessions ?? 0);
	if (sessions === 0) {
		return `\nNo sessions recorded in the last ${DAYS} day(s).\n`;
	}
	const t = data.totals;
	const out = [];

	out.push(`\nUSAGE — last ${DAYS} day(s), ${sessions} session(s)`);
	// A poisoning attempt is a spike, and a spike you can see is a day you can
	// drop. This is the whole abuse defence at the reporting end.
	out.push(section('DAILY', sparkline(data.daily)));

	out.push(
		section(
			'REACH',
			[
				`  installed app  ${String(t.installed ?? 0).padStart(6)}  ${pct(t.installed, sessions).padStart(4)}`,
				`  phone          ${String(t.phone ?? 0).padStart(6)}  ${pct(t.phone, sessions).padStart(4)}`,
				`  compared       ${String(t.compared ?? 0).padStart(6)}  ${pct(t.compared, sessions).padStart(4)}`
			].join('\n')
		)
	);

	out.push(section('RETURN — days active of the last 28', bar(data.days28, sessions)));
	out.push(section('RETURN — lifetime visits', bar(data.visits, sessions)));
	out.push(
		section('RETURN — device age', bar(data.age, sessions)) +
			'\n  (a device record expires after a year, so `new` over-counts by about\n' +
			'   one session per device per year — 0.3% of a daily reader\u2019s sessions,\n' +
			'   8% of a monthly one\u2019s)'
	);
	out.push(section('SESSION — visible minutes', bar(data.minutes, sessions)));
	out.push(section('SESSION — entry', bar(data.entry, sessions)));

	out.push(
		section(
			'APPARATUS',
			[
				`  followed a citation  ${String(t.followedRefs ?? 0).padStart(6)}  ${pct(t.followedRefs, sessions).padStart(4)}`,
				`  used the jump box    ${String(t.usedJump ?? 0).padStart(6)}  ${pct(t.usedJump, sessions).padStart(4)}`,
				`  ...and it missed     ${String(t.jumpMiss ?? 0).padStart(6)}  ${pct(t.jumpMiss, t.usedJump).padStart(4)}`,
				'',
				'  by family:',
				bar(data.refKinds, sessions),
				'',
				'  why a query missed:',
				bar(data.missKind, Number(t.jumpMiss ?? 0), 0),
				'',
				'  books asked for and not served:',
				bar(data.missBook, Number(t.jumpMiss ?? 0), 0)
			].join('\n')
		)
	);

	out.push(
		section(
			'WORKS — sessions that opened each',
			(SHOW_ALL ? data.works : data.works.filter((row) => row.n >= FLOOR))
				.map((row) => {
					const label = String(row.value).padEnd(
						Math.max(...data.works.map((r) => String(r.value).length))
					);
					return `  ${label}  ${String(row.n).padStart(6)}  refs ${pct(row.withRefs ?? 0, row.n).padStart(4)}`;
				})
				.join('\n') || '  —'
		)
	);

	out.push(section('SECTIONS', bar(data.sections, sessions)));

	out.push(
		section(
			'OFFLINE',
			[
				`  library full        ${String(t.libraryFull ?? 0).padStart(6)}  ${pct(t.libraryFull, sessions).padStart(4)}`,
				`  read while offline  ${String(t.offline ?? 0).padStart(6)}  ${pct(t.offline, sessions).padStart(4)}`,
				`  sw install failed   ${String(t.swFail ?? 0).padStart(6)}  ${pct(t.swFail, sessions).padStart(4)}`,
				data.swFail.length > 0 ? bar(data.swFail, Number(t.swFail ?? 0), 0) : ''
			]
				.filter(Boolean)
				.join('\n')
		)
	);

	out.push(
		section('UPDATES — consecutive sessions on an unaccepted update', bar(data.behind, sessions))
	);

	// The cross-tab this table was added for: interface language and content
	// language diverging is `CONTENT_LANG_FALLBACK` doing the work, and this is
	// the only place the number of readers living in that state is visible.
	/** @type {Map<string, { total: number, ui: Map<string, number>, content: Map<string, number> }>} */
	const byCountry = new Map();
	for (const row of data.geo) {
		const entry = byCountry.get(row.country) ?? { total: 0, ui: new Map(), content: new Map() };
		entry.total += Number(row.n);
		entry.ui.set(row.ui, (entry.ui.get(row.ui) ?? 0) + Number(row.n));
		entry.content.set(row.content, (entry.content.get(row.content) ?? 0) + Number(row.n));
		byCountry.set(row.country, entry);
	}
	const geoLines = [...byCountry.entries()]
		.filter(([, entry]) => SHOW_ALL || entry.total >= FLOOR)
		.sort((a, b) => b[1].total - a[1].total)
		.map(([country, entry]) => {
			/** @param {Map<string, number>} map */
			const list = (map) =>
				[...map.entries()]
					.sort((a, b) => b[1] - a[1])
					.map(([key, n]) => `${key} ${n}`)
					.join(' · ');
			return `  ${country}  chrome ${list(entry.ui)}\n      content ${list(entry.content)}`;
		});
	out.push(
		section('GEOGRAPHY × LANGUAGE', geoLines.join('\n') || '  —') +
			'\n  (content counts a compare-mode session in both languages, so they sum higher)'
	);

	return `${out.join('\n')}\n`;
}

// --- Entry ----------------------------------------------------------------

function main() {
	if (flag('prune')) {
		query(`delete from session_tag where session_id in
		       (select id from session where day < date('now', '-${KEEP_DAYS} day'))`);
		query(`delete from session where day < date('now', '-${KEEP_DAYS} day')`);
		query(`delete from geo_lang where day < date('now', '-${KEEP_DAYS} day')`);
		console.log(`Pruned rows older than ${KEEP_DAYS} days.`);
		return;
	}

	const adHoc = option('sql', undefined);
	if (adHoc) {
		console.log(JSON.stringify(query(adHoc), null, 2));
		return;
	}

	const data = collect();
	console.log(
		flag('json')
			? JSON.stringify(data, null, 2)
			: render(data, { days: DAYS, all: SHOW_ALL, floor: FLOOR })
	);
}

// Importable for its renderer without running a query — the same guard
// `reference-coverage.mjs` uses.
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
