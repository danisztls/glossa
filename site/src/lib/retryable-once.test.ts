import { describe, expect, it } from 'vitest';
import { retryableOnce } from './retryable-once';

describe('retryableOnce', () => {
	it('runs the initialiser once for any number of resolved reads', async () => {
		let calls = 0;
		const once = retryableOnce(async () => ++calls);

		expect(await once()).toBe(1);
		expect(await once()).toBe(1);
		expect(await once()).toBe(1);
		expect(calls).toBe(1);
	});

	it('collapses concurrent callers onto one in-flight promise', async () => {
		let calls = 0;
		let release: (() => void) | undefined;
		const gate = new Promise<void>((resolve) => (release = resolve));
		const once = retryableOnce(async () => {
			calls++;
			await gate;
			return calls;
		});

		const both = Promise.all([once(), once()]);
		release?.();
		expect(await both).toEqual([1, 1]);
		expect(calls, 'the second caller started a second load').toBe(1);
	});

	it('retries after a rejection instead of handing back the dead promise', async () => {
		// The whole point. `corpus.ts`'s `readContent` learned this for the
		// content tier; an index primer that keeps a rejection turns every valid
		// address in a work type into a 404 for the life of the page.
		let calls = 0;
		const once = retryableOnce(async () => {
			if (++calls === 1) throw new Error('transient');
			return 'ok';
		});

		await expect(once()).rejects.toThrow('transient');
		expect(await once()).toBe('ok');
		expect(calls).toBe(2);
	});

	it('rejects every concurrent caller of a failed load, and still retries after', async () => {
		let calls = 0;
		const once = retryableOnce(async () => {
			if (++calls === 1) throw new Error('transient');
			return 'ok';
		});

		const [a, b] = await Promise.allSettled([once(), once()]);
		expect(a.status).toBe('rejected');
		expect(b.status).toBe('rejected');
		expect(calls, 'concurrent callers should share the one failing load').toBe(1);
		expect(await once()).toBe('ok');
	});

	it('does not memoise a synchronous throw', async () => {
		let calls = 0;
		const once = retryableOnce(() => {
			if (++calls === 1) throw new Error('sync');
			return Promise.resolve('ok');
		});

		expect(() => once()).toThrow('sync');
		expect(await once()).toBe('ok');
	});

	it('keeps the resolved value identical across calls', async () => {
		const value = { table: [1, 2, 3] };
		const once = retryableOnce(async () => value);

		expect(await once()).toBe(await once());
	});
});
