import { describe, it, expect } from 'vitest';
import { splitUnnumbered, type StructureRow } from './document-unnumbered';
import type { DocumentAppendixUnit, DocumentNode } from './types';

const row = (node: Partial<DocumentNode>, i: number): StructureRow => ({
	node: { level: 1, title: '', before: null, ...node } as DocumentNode,
	depth: 0,
	anchor: `h${i}`
});

const unit = (u: Partial<DocumentAppendixUnit>): DocumentAppendixUnit => ({
	blocks: [{ html: 'text' }],
	citations: [],
	...u
});

describe('splitUnnumbered', () => {
	/* Every document in the corpus but Vatican I's two constitutions, which is
	   the case this function must not change. */
	describe('a document with only trailing matter', () => {
		it('pairs a tail heading with the unit under it', () => {
			const rows = [
				row({ title: 'CHAPTER I', before: 1 }, 0),
				row({ title: 'APPENDIX' }, 1),
				row({ title: 'NOTA PRAEVIA' }, 2)
			];
			const units = [unit({ title: 'APPENDIX' }), unit({ title: 'NOTA PRAEVIA' })];
			const { lead, tail } = splitUnnumbered(rows, units);
			expect(lead).toEqual([]);
			expect(tail.map((r) => [r.node?.title, r.unit?.title, r.anchor])).toEqual([
				['APPENDIX', 'APPENDIX', 'h1'],
				['NOTA PRAEVIA', 'NOTA PRAEVIA', 'h2']
			]);
		});

		it('keeps a heading that no unit matches, with no unit', () => {
			// Lumen Gentium's `From the Acts of the Council` and its secretary's
			// signature: real headings the source prints with no text under them.
			const rows = [row({ title: 'CHAPTER I', before: 1 }, 0), row({ title: 'PERICLE FELICI' }, 1)];
			const { tail } = splitUnnumbered(rows, []);
			expect(tail).toEqual([{ anchor: 'h1', node: rows[1].node, unit: undefined }]);
		});

		it('renders an untitled unit that no heading claims, in corpus order', () => {
			const { lead, tail } = splitUnnumbered([], [unit({}), unit({ title: 'CONCLUSIO' })]);
			expect(lead).toEqual([]);
			expect(tail.map((r) => r.unit?.title)).toEqual([undefined, 'CONCLUSIO']);
			expect(tail.every((r) => r.anchor === undefined)).toBe(true);
		});

		it('leaves an edition that numbers nothing entirely in the tail', () => {
			// The eight unnumbered editions, and Pastor Aeternus in both its
			// languages: no `position`, so nothing is set aside and the whole
			// text renders where it always has.
			const rows = [row({ title: 'CAPUT I', label: 'CAPUT I' }, 0), row({ title: 'CAPUT II' }, 1)];
			const units = [unit({}), unit({ title: 'CAPUT I' }), unit({ title: 'CAPUT II' })];
			const { lead, tail } = splitUnnumbered(rows, units);
			expect(lead).toEqual([]);
			expect(tail).toHaveLength(3);
		});

		it("keeps an edition's opening paragraph FIRST, above its headed units", () => {
			// The bug the two-pointer merge fixes. The opening run is untitled,
			// so it matches no heading by construction and used to be appended
			// after everything a heading did claim — `ad-catholici-sacerdotii.it`
			// read its first paragraph after twenty-five headed units, and
			// Pastor Aeternus read its address to the Church after all four of
			// its chapters.
			const rows = [row({ title: 'CAPUT I' }, 0), row({ title: 'CAPUT II' }, 1)];
			const units = [
				unit({ blocks: [{ html: 'the opening address' }] }),
				unit({ title: 'CAPUT I' }),
				unit({ title: 'CAPUT II' })
			];
			const { tail } = splitUnnumbered(rows, units);
			expect(tail.map((r) => r.unit?.title ?? '(opening)')).toEqual([
				'(opening)',
				'CAPUT I',
				'CAPUT II'
			]);
		});

		it('emits a heading the units skipped over in its own place', () => {
			const rows = [
				row({ title: 'NOTIFICATIONES' }, 0),
				row({ title: 'PERICLE FELICI' }, 1),
				row({ title: 'NOTA PRAEVIA' }, 2)
			];
			const units = [unit({ title: 'NOTIFICATIONES' }), unit({ title: 'NOTA PRAEVIA' })];
			const { tail } = splitUnnumbered(rows, units);
			expect(tail.map((r) => [r.node?.title, Boolean(r.unit)])).toEqual([
				['NOTIFICATIONES', true],
				['PERICLE FELICI', false],
				['NOTA PRAEVIA', true]
			]);
		});
	});

	/* Dei Filius, in the shape the scraper writes it: four leading chapters
	   above eighteen numbered canons, plus the closing address after them. */
	describe('a document with leading matter', () => {
		const rows = [
			row({ title: 'DE DEO RERUM OMNIUM CREATORE', label: 'CAPUT I', position: 'leading' }, 0),
			row({ title: 'DE REVELATIONE', label: 'CAPUT II', position: 'leading' }, 1),
			row({ title: 'CANONES', before: 1 }, 2),
			row({ level: 2, title: 'DE DEO RERUM OMNIUM CREATORE', label: 'I', before: 1 }, 3),
			row({ level: 2, title: 'DE REVELATIONE', label: 'II', before: 6 }, 4)
		];
		const units = [
			unit({ position: 'leading' }),
			unit({ title: 'DE DEO RERUM OMNIUM CREATORE', label: 'CAPUT I', position: 'leading' }),
			unit({ title: 'DE REVELATIONE', label: 'CAPUT II', position: 'leading' }),
			unit({})
		];

		it('puts every leading unit in the lead, in source order', () => {
			const { lead } = splitUnnumbered(rows, units);
			expect(lead.map((r) => r.unit?.title)).toEqual([
				undefined,
				'DE DEO RERUM OMNIUM CREATORE',
				'DE REVELATIONE'
			]);
		});

		it('anchors each leading chapter to its own heading', () => {
			const { lead } = splitUnnumbered(rows, units);
			// The opening address has no heading of its own and gets no anchor;
			// the two CAPUTs pair with theirs, and the CANON GROUP that repeats
			// one of their titles is not a candidate — it anchors a section.
			expect(lead.map((r) => r.anchor)).toEqual([undefined, 'h0', 'h1']);
		});

		it('leaves only the closing address in the tail', () => {
			const { tail } = splitUnnumbered(rows, units);
			expect(tail).toEqual([{ unit: units[3] }]);
		});

		it('never renders a unit twice', () => {
			const { lead, tail } = splitUnnumbered(rows, units);
			const seen = [...lead, ...tail].map((r) => r.unit).filter(Boolean);
			expect(seen).toHaveLength(units.length);
			expect(new Set(seen).size).toBe(units.length);
		});

		it('never lets an anchored canon-group heading reach either half', () => {
			// `before` is set on all three canon rows, so none of them is tail
			// matter — the bug this guards is a group heading rendering its own
			// title a second time under the canons it already introduced.
			const { lead, tail } = splitUnnumbered(rows, units);
			const titles = [...lead, ...tail].map((r) => r.node?.title);
			expect(titles).not.toContain('CANONES');
		});
	});
});
