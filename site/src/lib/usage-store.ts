/**
 * Writing a validated beacon to D1 — the edge worker's decisions, as pure
 * functions, for the same reason `sw-policy.ts` and `route-manifest.ts` exist:
 * `src/worker.ts` cannot be imported by a test, and everything it *decides*
 * should be exercisable directly.
 *
 * Two things happen here that are worth reading before changing either.
 *
 * THE COUNTRY NEVER MEETS THE SESSION. `recordSession` writes two independent
 * things — the session row, which has no country column, and a `geo_lang`
 * counter, which has no session id. There is deliberately no key between them.
 * That is what lets the country be recorded at all: eighteen bucketed fields
 * in one row is already a weak quasi-identifier, and the country is the field
 * that would make an unusual reader unique in the table.
 *
 * THE DAILY CAP IS A CIRCUIT BREAKER, NOT A RATE LIMIT. `/a` is an open POST
 * endpoint and D1's free tier allows 100,000 row writes a day. The damage
 * worth preventing is not a skewed statistic — a poisoned window is dropped
 * with one `delete ... where day = ?` — but the quota being eaten, which stops
 * genuine rows being written for the rest of the day. That is the same shape
 * of failure as the `run_worker_first` outage: a free-tier ceiling reached
 * quietly, and the thing that degrades is the feature being relied on.
 *
 * The count is read from D1 at most once a minute per isolate and incremented
 * locally in between, so the check costs roughly nothing per beacon. It is
 * approximate across isolates — several may each be holding a minute-old
 * count — which is fine for a backstop set an order of magnitude below the
 * quota it protects.
 */

import type { UsagePayload } from './usage-schema';

// Minimal structural declarations rather than `@cloudflare/workers-types`.
// `worker.ts` already declares its asset binding this way; the surface used
// here is four methods wide and a dependency would be the larger change.

export interface D1PreparedStatement {
	bind(...values: unknown[]): D1PreparedStatement;
	first<T = Record<string, unknown>>(): Promise<T | null>;
}

export interface D1Database {
	prepare(query: string): D1PreparedStatement;
	batch(statements: D1PreparedStatement[]): Promise<unknown>;
}

/** Rows per UTC day, across every isolate, before beacons start being dropped.
 *  An order of magnitude below D1's free-tier write quota, and two orders
 *  above any traffic this site has seen. */
export const DAILY_CAP = 20_000;

/** How stale the cached row count may be. One D1 read per isolate per minute. */
const CAP_RECHECK_MS = 60_000;

let capState: { day: string; count: number; checkedAt: number } | undefined;

/** Forget the cached count. For tests; the worker never needs it, since a new
 *  deploy is a new isolate. */
export function resetUsageCap(): void {
	capState = undefined;
}

/** The UTC date a beacon is filed under. Assigned here rather than sent by the
 *  client: a clock the sender controls is a clock that can backdate rows. */
export function utcDay(now: number): string {
	return new Date(now).toISOString().slice(0, 10);
}

async function claimSlot(db: D1Database, day: string, now: number): Promise<boolean> {
	if (!capState || capState.day !== day || now - capState.checkedAt > CAP_RECHECK_MS) {
		const row = await db
			.prepare('select count(*) as n from session where day = ?')
			.bind(day)
			.first<{ n: number }>();
		capState = { day, count: Number(row?.n ?? 0), checkedAt: now };
	}
	if (capState.count >= DAILY_CAP) return false;
	capState.count += 1;
	return true;
}

/**
 * How long a stored row lives. THIRTEEN MONTHS, and the extra month past a year
 * is the whole reason for the number: comparing a month against the same month
 * a year earlier needs both endpoints present, which twelve months exactly does
 * not give you.
 *
 * The ANPD cookie guide asks for a retention period proportionate to the
 * purpose and rejects indeterminate durations outright. A period that is only
 * applied when someone remembers to type `--prune` IS indeterminate, whatever
 * the constant says — which is why `scheduled()` in `src/worker.ts` runs this
 * daily and the script's flag is only a manual escape hatch.
 *
 * Deliberately NOT the same as `RECORD_MAX_DAYS` (365, in `usage-device.ts`).
 * They bound different things for different reasons: that one is how long a
 * device may remember itself, this one is how long an anonymous aggregate is
 * useful. Collapsing them into one number would make both harder to argue.
 */
export const RETENTION_DAYS = 400;

/**
 * Drop everything past the retention window.
 *
 * Tags go first and are selected by their session's day rather than by a list
 * of ids: doing it the other way round leaves orphaned tags behind the moment
 * the session rows are gone, and nothing would ever collect them.
 *
 * Never throws, for the same reason `recordSession` does not — this runs from a
 * cron handler with nobody watching, and a failed prune is a retry tomorrow.
 */
export async function pruneExpired(db: D1Database, now: number): Promise<'pruned' | 'failed'> {
	const cutoff = utcDay(now - RETENTION_DAYS * 86_400_000);
	try {
		await db.batch([
			db
				.prepare(
					'delete from session_tag where session_id in (select id from session where day < ?)'
				)
				.bind(cutoff),
			db.prepare('delete from session where day < ?').bind(cutoff),
			db.prepare('delete from geo_lang where day < ?').bind(cutoff)
		]);
		return 'pruned';
	} catch {
		return 'failed';
	}
}

export type RecordOutcome = 'stored' | 'capped' | 'failed';

/**
 * Store one validated payload.
 *
 * Never throws: the caller answers 204 whatever happens here, because the
 * sender is a `sendBeacon` that has already discarded the response and a
 * reader must never see a page fail over a statistic.
 */
export async function recordSession(
	db: D1Database,
	payload: UsagePayload,
	country: string,
	now: number
): Promise<RecordOutcome> {
	const day = utcDay(now);
	try {
		if (!(await claimSlot(db, day, now))) return 'capped';

		const inserted = await db
			.prepare(
				`insert into session (
					day, days28, visits, age, mode, device, minutes, entry, ui,
					compare, offline, refs, jump, miss_kind, miss_book, library,
					sw_fail, behind, install_prompt
				) values (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?) returning id`
			)
			.bind(
				day,
				payload.days28,
				payload.visits,
				payload.age,
				payload.mode,
				payload.device,
				payload.minutes,
				payload.entry,
				payload.ui,
				payload.compare,
				payload.offline,
				payload.refs,
				payload.jump,
				payload.missKind ?? null,
				payload.missBook ?? null,
				payload.library,
				payload.swFail ?? null,
				payload.behind,
				payload.installPrompt ?? null
			)
			.first<{ id: number }>();

		const id = inserted?.id;
		if (id === undefined) return 'failed';

		const statements: D1PreparedStatement[] = [];
		const tag = db.prepare('insert into session_tag (session_id, kind, value) values (?,?,?)');
		for (const kind of ['work', 'content', 'section', 'refKind'] as const) {
			for (const value of payload[kind]) statements.push(tag.bind(id, kind, value));
		}

		// One geo row per content language read, so a compare-mode session
		// counting in two languages is counted in both — which means the
		// content columns of that report sum higher than its session count, and
		// the report says so. A session that opened no corpus text at all is
		// still counted, under 'none': "arrived, read nothing" is a fact about
		// a country worth being able to see.
		const geo = db.prepare(
			`insert into geo_lang (day, country, ui, content, n) values (?,?,?,?,1)
			 on conflict (day, country, ui, content) do update set n = n + 1`
		);
		const langs = payload.content.length > 0 ? payload.content : ['none'];
		for (const lang of langs) statements.push(geo.bind(day, country, payload.ui, lang));

		if (statements.length > 0) await db.batch(statements);
		return 'stored';
	} catch {
		// A D1 outage, a quota refusal, a schema drift. None of it is the
		// reader's problem and none of it is worth an invocation spent retrying.
		return 'failed';
	}
}
