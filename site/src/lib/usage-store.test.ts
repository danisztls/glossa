import { beforeEach, describe, expect, it } from 'vitest';
import { validatePayload, SCHEMA_VERSION } from './usage-schema';
import {
	DAILY_CAP,
	recordSession,
	resetUsageCap,
	utcDay,
	type D1Database,
	type D1PreparedStatement
} from './usage-store';

/** A D1 stand-in that records every statement it is handed. Enough surface to
 *  exercise the two invariants worth protecting: that the country never
 *  reaches the session row, and that the cap actually stops writes. */
class FakeStatement implements D1PreparedStatement {
	constructor(
		private db: FakeDb,
		readonly sql: string,
		readonly args: unknown[] = []
	) {}
	bind(...values: unknown[]): FakeStatement {
		return new FakeStatement(this.db, this.sql, values);
	}
	async first<T>(): Promise<T | null> {
		return this.db.answer(this.sql, this.args) as T | null;
	}
}

class FakeDb implements D1Database {
	written: { sql: string; args: unknown[] }[] = [];
	rowsToday = 0;
	throws = false;
	#nextId = 1;

	prepare(sql: string): FakeStatement {
		if (this.throws) throw new Error('D1 unavailable');
		return new FakeStatement(this, sql);
	}
	answer(sql: string, args: unknown[]): unknown {
		if (sql.includes('count(*)')) return { n: this.rowsToday };
		if (sql.startsWith('insert into session (')) {
			this.written.push({ sql, args });
			return { id: this.#nextId++ };
		}
		return null;
	}
	async batch(statements: D1PreparedStatement[]): Promise<unknown> {
		for (const statement of statements as FakeStatement[]) {
			this.written.push({ sql: statement.sql, args: statement.args });
		}
		return undefined;
	}

	rows(fragment: string) {
		return this.written.filter((row) => row.sql.includes(fragment));
	}
}

const NOW = Date.parse('2026-08-27T09:15:00Z');

function payload(overrides: Record<string, unknown> = {}) {
	const validated = validatePayload({
		v: SCHEMA_VERSION,
		days28: '4-7',
		visits: '3-5',
		age: '8-30d',
		mode: 'app',
		device: 'phone',
		minutes: '5-15',
		entry: 'deep',
		ui: 'pt',
		compare: 0,
		offline: 1,
		refs: '3-10',
		jump: 'hit',
		library: 'partial',
		behind: '0',
		work: ['ccc.pt'],
		content: ['pt', 'la'],
		section: ['catechismus'],
		refKind: ['scripture'],
		...overrides
	});
	if (!validated) throw new Error('test payload does not validate');
	return validated;
}

beforeEach(() => resetUsageCap());

describe('utcDay', () => {
	it('files a beacon under the UTC date, not a local one', () => {
		expect(utcDay(Date.parse('2026-08-27T23:59:59Z'))).toBe('2026-08-27');
		expect(utcDay(Date.parse('2026-08-28T00:00:01Z'))).toBe('2026-08-28');
	});
});

describe('recordSession', () => {
	it('stores the session and its tags', async () => {
		const db = new FakeDb();
		expect(await recordSession(db, payload(), 'BR', NOW)).toBe('stored');

		expect(db.rows('insert into session (')).toHaveLength(1);
		const tags = db.rows('session_tag');
		expect(tags.map((row) => row.args)).toEqual([
			[1, 'work', 'ccc.pt'],
			[1, 'content', 'pt'],
			[1, 'content', 'la'],
			[1, 'section', 'catechismus'],
			[1, 'refKind', 'scripture']
		]);
	});

	it('never puts the country in the session row', async () => {
		// The entire privacy argument for storing the country at all. If this
		// fails, `geo_lang` has stopped being a separate observation and the
		// session row has become a quasi-identifier.
		const db = new FakeDb();
		await recordSession(db, payload(), 'BR', NOW);
		const session = db.rows('insert into session (')[0];
		expect(session.sql).not.toContain('country');
		expect(session.args).not.toContain('BR');
	});

	it('counts the country once per content language read', async () => {
		const db = new FakeDb();
		await recordSession(db, payload(), 'BR', NOW);
		expect(db.rows('geo_lang').map((row) => row.args)).toEqual([
			['2026-08-27', 'BR', 'pt', 'pt'],
			['2026-08-27', 'BR', 'pt', 'la']
		]);
	});

	it("records a session that opened no text under 'none'", async () => {
		const db = new FakeDb();
		await recordSession(db, payload({ content: [] }), 'MG', NOW);
		expect(db.rows('geo_lang').map((row) => row.args)).toEqual([
			['2026-08-27', 'MG', 'pt', 'none']
		]);
	});

	it('has no session id anywhere in the geo rows', async () => {
		const db = new FakeDb();
		await recordSession(db, payload(), 'BR', NOW);
		for (const row of db.rows('geo_lang')) expect(row.args).not.toContain(1);
	});

	it('stops writing once the day is at the cap', async () => {
		const db = new FakeDb();
		db.rowsToday = DAILY_CAP;
		expect(await recordSession(db, payload(), 'BR', NOW)).toBe('capped');
		expect(db.rows('insert into session (')).toHaveLength(0);
	});

	it('caches the count rather than reading it per beacon', async () => {
		const db = new FakeDb();
		db.rowsToday = DAILY_CAP - 2;
		expect(await recordSession(db, payload(), 'BR', NOW)).toBe('stored');
		expect(await recordSession(db, payload(), 'BR', NOW + 1_000)).toBe('stored');
		// Third would exceed the cap using the locally incremented count, with
		// no second read of D1.
		expect(await recordSession(db, payload(), 'BR', NOW + 2_000)).toBe('capped');
		expect(db.written.filter((row) => row.sql.includes('count(*)'))).toHaveLength(0);
	});

	it('re-reads the count when the UTC day rolls over', async () => {
		const db = new FakeDb();
		db.rowsToday = DAILY_CAP;
		expect(await recordSession(db, payload(), 'BR', NOW)).toBe('capped');
		db.rowsToday = 0;
		const tomorrow = NOW + 24 * 60 * 60 * 1000;
		expect(await recordSession(db, payload(), 'BR', tomorrow)).toBe('stored');
	});

	it('never throws when D1 does', async () => {
		const db = new FakeDb();
		db.throws = true;
		expect(await recordSession(db, payload(), 'BR', NOW)).toBe('failed');
	});
});
