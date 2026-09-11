#!/usr/bin/env node
/**
 * Lab Core Web Vitals over the built site, for comparing one build against
 * another.
 *
 * WHAT THIS IS FOR IS A DIFFERENCE, not a score. The question it was written
 * to answer — does prerendering a chrome page beat serving the SPA shell —
 * is a question about two builds, and an absolute number from this machine
 * answers it no better than a number from anyone else's. So the interface is
 * `--label`, the output is a JSON file per build, and `--compare` prints the
 * delta. Treat anything inside the run-to-run spread as noise.
 *
 * IT IS NOT FIELD DATA. What Google ranks on is CrUX, collected from real
 * Chrome users on real connections; this is one machine under synthetic
 * throttling. It tells you direction and rough magnitude and nothing about
 * what the corpus of your actual readers experiences.
 *
 * ## Why it drives Chromium directly
 *
 * No Lighthouse, no Playwright, no dependency at all: Node 24 has a global
 * `WebSocket`, Chromium speaks CDP over one, and the four numbers below are
 * four `PerformanceObserver`s. `site/` carries two runtime dependencies on
 * purpose, and a measurement tool is the last place to spend a third.
 *
 * ## The cold-visit bias, which is deliberate
 *
 * A fresh profile per run, and a fresh browser per run to guarantee it. `/`
 * is precached and served cache-first by the service worker
 * (`src/service-worker.ts`), so a second visit in one profile measures the
 * cache and not the build. The first visit is also the only one prerendering
 * could help, which makes it the case worth holding still.
 *
 * Usage:
 *   node scripts/vitals.mjs --label baseline            # measure the current build/
 *   node scripts/vitals.mjs --compare .vitals/a.json .vitals/b.json
 */

import { spawn } from 'node:child_process';
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const SITE_DIR = path.resolve(fileURLToPath(new URL('..', import.meta.url)));

const VERBOSE = process.env.VITALS_VERBOSE === '1';
const verbose = (message) => VERBOSE && console.error(`  · ${message}`);

/** Lighthouse's mobile defaults, so the numbers mean what people expect them
 *  to mean: a Moto-G-class phone on "Slow 4G". */
const THROTTLE = {
	cpuRate: Number(process.env.VITALS_CPU ?? 4),
	latencyMs: Number(process.env.VITALS_LATENCY ?? 150),
	downloadBps: (Number(process.env.VITALS_DOWN_MBPS ?? 1.6) * 1024 * 1024) / 8,
	uploadBps: (750 * 1024) / 8,
	width: 412,
	height: 823,
	scaleFactor: 1.75
};

/**
 * How long to keep watching after `load`.
 *
 * A FIXED DELAY IS WRONG IN BOTH DIRECTIONS on this site: the SPA shell paints
 * nothing until its data has landed, so a short wait records `lcp: 0` for a
 * page that was merely still loading, while a wait long enough for the slowest
 * case pays that cost on every run. So the reading is taken when the page goes
 * quiet — no new LCP candidate and no new long task for `QUIET_MS` — and
 * `MAX_WATCH_MS` is only the refusal to wait for ever.
 */
const QUIET_MS = 2000;
const MAX_WATCH_MS = 25_000;

const DEFAULT_URLS = ['/', '/pt', '/ar', '/catechismus', '/pt/catechismus'];

function parseArgs(argv) {
	const args = {
		runs: 5,
		port: 8788,
		out: '.vitals',
		urls: DEFAULT_URLS,
		label: null,
		compare: null
	};
	for (let i = 0; i < argv.length; i++) {
		const arg = argv[i];
		if (arg === '--label') args.label = argv[++i];
		else if (arg === '--runs') args.runs = Number(argv[++i]);
		else if (arg === '--port') args.port = Number(argv[++i]);
		else if (arg === '--out') args.out = argv[++i];
		else if (arg === '--urls') args.urls = argv[++i].split(',');
		else if (arg === '--compare') args.compare = [argv[++i], argv[++i]];
		else throw new Error(`unknown argument: ${arg}`);
	}
	return args;
}

// ---------------------------------------------------------------- CDP client

/** The smallest thing that can drive a browser: ids out, results and events
 *  back. `sessionId` rides on every page-scoped call because the attachment
 *  is flat (one socket, many targets). */
class Cdp {
	#socket;
	#nextId = 1;
	#pending = new Map();
	#listeners = new Map();
	#closed = false;

	static async connect(url) {
		const client = new Cdp();
		client.#socket = new WebSocket(url);
		client.#socket.addEventListener('message', (event) => client.#receive(String(event.data)));
		// A browser that dies mid-session takes every in-flight call with it,
		// and a promise nobody rejects is a hang with no message. This is the
		// difference between a failed run and a run that never ends.
		client.#socket.addEventListener('close', () => client.#fail('devtools socket closed'));
		client.#socket.addEventListener('error', () => client.#fail('devtools socket errored'));
		await new Promise((resolve, reject) => {
			client.#socket.addEventListener('open', resolve, { once: true });
			client.#socket.addEventListener('error', reject, { once: true });
		});
		return client;
	}

	#fail(reason) {
		this.#closed = true;
		for (const { reject } of this.#pending.values()) reject(new Error(reason));
		this.#pending.clear();
	}

	#receive(raw) {
		const message = JSON.parse(raw);
		if (message.id !== undefined) {
			const pending = this.#pending.get(message.id);
			if (!pending) return;
			this.#pending.delete(message.id);
			if (message.error) pending.reject(new Error(JSON.stringify(message.error)));
			else pending.resolve(message.result);
			return;
		}
		for (const listener of this.#listeners.get(message.method) ?? []) listener(message.params);
	}

	send(method, params = {}, sessionId) {
		if (this.#closed) return Promise.reject(new Error(`${method} after the socket closed`));
		const id = this.#nextId++;
		const payload = { id, method, params };
		if (sessionId) payload.sessionId = sessionId;
		this.#socket.send(JSON.stringify(payload));
		verbose(`cdp -> ${method}`);
		return new Promise((resolve, reject) => {
			const timer = setTimeout(() => {
				this.#pending.delete(id);
				reject(new Error(`${method} did not answer within 20s`));
			}, 20_000);
			this.#pending.set(id, {
				resolve: (value) => {
					clearTimeout(timer);
					resolve(value);
				},
				reject: (error) => {
					clearTimeout(timer);
					reject(error);
				}
			});
		});
	}

	once(method) {
		return new Promise((resolve) => {
			const listeners = this.#listeners.get(method) ?? [];
			const listener = (params) => {
				this.#listeners.set(
					method,
					(this.#listeners.get(method) ?? []).filter((entry) => entry !== listener)
				);
				resolve(params);
			};
			this.#listeners.set(method, [...listeners, listener]);
		});
	}

	close() {
		this.#socket.close();
	}
}

// ------------------------------------------------------------- the collector

/**
 * Injected before anything on the page runs, so the observers exist before the
 * events they are watching for. `buffered: true` covers the gap anyway, but
 * only for the entry types that support it.
 *
 * `longtask` is here because TBT is the lab proxy for INP, which cannot be
 * measured without an interaction to measure — a page that never gets clicked
 * has no INP at all.
 */
const COLLECTOR = `
window.__vitals = { lcp: 0, lcpElement: '', fcp: 0, cls: 0, longTasks: [], shifts: [], changedAt: 0 };
new PerformanceObserver((list) => {
	const entries = list.getEntries();
	const last = entries[entries.length - 1];
	if (!last) return;
	window.__vitals.lcp = last.startTime;
	window.__vitals.changedAt = performance.now();
	const el = last.element;
	window.__vitals.lcpElement = el
		? el.tagName.toLowerCase() + (el.className ? '.' + String(el.className).trim().split(/\\s+/)[0] : '')
		: last.url || '';
}).observe({ type: 'largest-contentful-paint', buffered: true });
new PerformanceObserver((list) => {
	for (const entry of list.getEntries()) {
		if (entry.hadRecentInput) return;
		window.__vitals.cls += entry.value;
		// WHAT MOVED, not just how much. A CLS number says a page shifted and
		// nothing about which element, which is the only part anybody can act
		// on — and a prerendered page's shifts have a short list of causes
		// (a late font, an image with no reserved box, a client-only card).
		const node = entry.sources && entry.sources[0] && entry.sources[0].node;
		if (entry.value > 0.01) {
			window.__vitals.shifts.push([
				Math.round(entry.value * 1000) / 1000,
				node
					? node.tagName.toLowerCase() +
						(node.className ? '.' + String(node.className).trim().split(/\s+/)[0] : '')
					: '?'
			]);
		}
	}
}).observe({ type: 'layout-shift', buffered: true });
new PerformanceObserver((list) => {
	for (const entry of list.getEntries())
		if (entry.name === 'first-contentful-paint') window.__vitals.fcp = entry.startTime;
}).observe({ type: 'paint', buffered: true });
new PerformanceObserver((list) => {
	for (const entry of list.getEntries()) window.__vitals.longTasks.push([entry.startTime, entry.duration]);
	window.__vitals.changedAt = performance.now();
}).observe({ type: 'longtask', buffered: true });
`;

/** True once nothing has moved for `QUIET_MS`. Read in a poll rather than
 *  pushed, because a page with no long tasks at all never calls back. */
const QUIET_PROBE = `(() => {
	const v = window.__vitals;
	return JSON.stringify({ lcp: v.lcp, quietFor: performance.now() - (v.changedAt || 0) });
})()`;

/** Read out of the page once it has settled. TBT counts blocking time after
 *  FCP, which is where a reader is already looking at something. */
const REPORTER = `
(() => {
	const v = window.__vitals;
	const nav = performance.getEntriesByType('navigation')[0] || {};
	const blocking = ([, duration]) => Math.max(0, duration - 50);
	const sum = (entries) => entries.reduce((total, entry) => total + blocking(entry), 0);
	return JSON.stringify({
		lcp: v.lcp,
		lcpElement: v.lcpElement,
		fcp: v.fcp,
		cls: v.cls,
		// TBT proper counts only what blocks AFTER first paint, which on a shell
		// that paints last is close to nothing: every long task ran while the
		// screen was blank. Prerendering moves FCP earlier and therefore moves
		// work INTO this window, so a rise here is the metric working rather
		// than a regression. blockingTotal is the number that does not move for
		// that reason, and the two are only comparable to their own kind.
		tbt: sum(v.longTasks.filter(([start]) => start >= v.fcp)),
		blockingTotal: sum(v.longTasks),
		ttfb: nav.responseStart || 0,
		domContentLoaded: nav.domContentLoadedEventEnd || 0,
		load: nav.loadEventEnd || 0,
		transferBytes: performance.getEntriesByType('resource').reduce((n, r) => n + (r.transferSize || 0), 0),
		bodyText: (document.body.innerText || '').replace(/\\s+/g, ' ').trim().length,
		shifts: v.shifts.sort((a, b) => b[0] - a[0]).slice(0, 4)
	});
})()
`;

// ----------------------------------------------------------------- the server

async function startServer(port) {
	// Wrangler wants to write `~/.config/.wrangler`, which the agent sandbox
	// denies; a private XDG root keeps it off that path and out of the real one.
	const configHome = mkdtempSync(path.join(tmpdir(), 'vitals-xdg-'));
	const child = spawn(
		path.join(SITE_DIR, 'node_modules/.bin/wrangler'),
		['dev', '--port', String(port), '--ip', '127.0.0.1'],
		{
			cwd: SITE_DIR,
			env: { ...process.env, XDG_CONFIG_HOME: configHome },
			stdio: ['ignore', 'pipe', 'pipe'],
			// Its own process group, because killing the wrangler CLI does not kill
			// the workerd it spawned — which keeps the port and makes the next run
			// fail to start against a server it cannot see.
			detached: true
		}
	);
	const log = [];
	child.stdout.on('data', (chunk) => log.push(String(chunk)));
	child.stderr.on('data', (chunk) => log.push(String(chunk)));

	const deadline = Date.now() + 60_000;
	while (Date.now() < deadline) {
		try {
			const response = await fetch(`http://127.0.0.1:${port}/`);
			if (response.ok) {
				await response.arrayBuffer();
				return { child, configHome };
			}
		} catch {
			// not up yet
		}
		await new Promise((resolve) => setTimeout(resolve, 250));
	}
	stopServer(child);
	throw new Error(`wrangler dev did not answer on :${port}\n${log.join('')}`);
}

/** Kill the whole group, so no workerd survives to hold the port. */
function stopServer(child) {
	try {
		process.kill(-child.pid, 'SIGKILL');
	} catch {
		child.kill('SIGKILL');
	}
}

// ---------------------------------------------------------------- one reading

async function measure(url, devtoolsPort) {
	const profile = mkdtempSync(path.join(tmpdir(), 'vitals-chrome-'));
	const chrome = spawn(
		'chromium',
		[
			'--headless=new',
			`--remote-debugging-port=${devtoolsPort}`,
			`--user-data-dir=${profile}`,
			'--no-first-run',
			'--no-default-browser-check',
			'--disable-gpu',
			'--no-sandbox',
			'--disable-dev-shm-usage',
			'--hide-scrollbars',
			'about:blank'
		],
		{ stdio: ['ignore', 'ignore', 'pipe'] }
	);
	const chromeLog = [];
	chrome.stderr.on('data', (chunk) => chromeLog.push(String(chunk)));
	chrome.on('exit', (code) => verbose(`chromium exited: ${code}`));

	try {
		let wsUrl;
		const deadline = Date.now() + 30_000;
		while (Date.now() < deadline) {
			try {
				const response = await fetch(`http://127.0.0.1:${devtoolsPort}/json/version`);
				wsUrl = (await response.json()).webSocketDebuggerUrl;
				if (wsUrl) break;
			} catch {
				// not up yet
			}
			await new Promise((resolve) => setTimeout(resolve, 100));
		}
		if (!wsUrl)
			throw new Error(`chromium did not expose a devtools endpoint\n${chromeLog.join('')}`);
		verbose(`devtools at ${wsUrl}`);

		const cdp = await Cdp.connect(wsUrl);
		const { targetId } = await cdp.send('Target.createTarget', { url: 'about:blank' });
		const { sessionId } = await cdp.send('Target.attachToTarget', { targetId, flatten: true });

		await cdp.send('Page.enable', {}, sessionId);
		await cdp.send('Network.enable', {}, sessionId);
		await cdp.send('Runtime.enable', {}, sessionId);
		await cdp.send('Network.clearBrowserCache', {}, sessionId);
		await cdp.send(
			'Emulation.setDeviceMetricsOverride',
			{
				width: THROTTLE.width,
				height: THROTTLE.height,
				deviceScaleFactor: THROTTLE.scaleFactor,
				mobile: true
			},
			sessionId
		);
		await cdp.send('Emulation.setCPUThrottlingRate', { rate: THROTTLE.cpuRate }, sessionId);
		await cdp.send(
			'Network.emulateNetworkConditions',
			{
				offline: false,
				latency: THROTTLE.latencyMs,
				downloadThroughput: THROTTLE.downloadBps,
				uploadThroughput: THROTTLE.uploadBps
			},
			sessionId
		);
		await cdp.send('Page.addScriptToEvaluateOnNewDocument', { source: COLLECTOR }, sessionId);

		const loaded = cdp.once('Page.loadEventFired');
		await cdp.send('Page.navigate', { url }, sessionId);
		await Promise.race([loaded, new Promise((resolve) => setTimeout(resolve, MAX_WATCH_MS))]);

		const quietBy = Date.now() + MAX_WATCH_MS;
		while (Date.now() < quietBy) {
			await new Promise((resolve) => setTimeout(resolve, 250));
			const { result } = await cdp.send(
				'Runtime.evaluate',
				{ expression: QUIET_PROBE, returnByValue: true },
				sessionId
			);
			const probe = JSON.parse(result.value);
			if (probe.lcp > 0 && probe.quietFor > QUIET_MS) break;
		}

		const { result } = await cdp.send(
			'Runtime.evaluate',
			{ expression: REPORTER, returnByValue: true },
			sessionId
		);
		cdp.close();
		const reading = JSON.parse(result.value);
		// A page that never reported an LCP candidate did not finish; recording
		// its zero would quietly pull a median down.
		if (!reading.lcp) throw new Error(`${url} reported no LCP within ${MAX_WATCH_MS / 1000}s`);
		verbose(`${url} lcp=${Math.round(reading.lcp)} fcp=${Math.round(reading.fcp)}`);
		return reading;
	} finally {
		chrome.kill('SIGKILL');
		rmSync(profile, { recursive: true, force: true });
	}
}

// ------------------------------------------------------------------ reporting

const median = (numbers) => {
	const sorted = [...numbers].sort((a, b) => a - b);
	const middle = Math.floor(sorted.length / 2);
	return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
};

const METRICS = [
	'lcp',
	'fcp',
	'cls',
	'tbt',
	'blockingTotal',
	'ttfb',
	'load',
	'transferBytes',
	'bodyText'
];

function summarise(readings) {
	const summary = {};
	for (const metric of METRICS) {
		const values = readings.map((reading) => reading[metric]);
		summary[metric] = {
			median: median(values),
			min: Math.min(...values),
			max: Math.max(...values)
		};
	}
	summary.lcpElement = readings.at(-1).lcpElement;
	summary.shifts = readings.at(-1).shifts ?? [];
	return summary;
}

const ms = (value) => `${Math.round(value)}`;
const fmt = {
	lcp: ms,
	fcp: ms,
	tbt: ms,
	ttfb: ms,
	load: ms,
	cls: (v) => v.toFixed(3),
	transferBytes: (v) => `${(v / 1024).toFixed(0)}K`,
	bodyText: (v) => `${Math.round(v)}`
};

function printTable(label, results) {
	console.log(`\n${label}  (median of ${results.runs} runs, Slow 4G / 4× CPU)`);
	console.log(
		['url'.padEnd(20), 'LCP', 'FCP', 'CLS', 'TBT', 'TTFB', 'load', 'bytes', 'text', 'LCP element']
			.map((head, i) => (i === 0 ? head : head.padStart(i < 7 ? 6 : 8)))
			.join(' ')
	);
	for (const [url, summary] of Object.entries(results.urls)) {
		console.log(
			[
				url.padEnd(20),
				fmt.lcp(summary.lcp.median).padStart(6),
				fmt.fcp(summary.fcp.median).padStart(6),
				fmt.cls(summary.cls.median).padStart(6),
				fmt.tbt(summary.tbt.median).padStart(6),
				fmt.ttfb(summary.ttfb.median).padStart(6),
				fmt.load(summary.load.median).padStart(6),
				fmt.transferBytes(summary.transferBytes.median).padStart(8),
				fmt.bodyText(summary.bodyText.median).padStart(8),
				' ' + summary.lcpElement
			].join(' ')
		);
		if (summary.shifts.length > 0) {
			console.log(
				'   '.padEnd(21) +
					'shifted: ' +
					summary.shifts.map(([value, what]) => `${what} ${value}`).join(', ')
			);
		}
	}
}

function printComparison(before, after) {
	console.log(`\n${before.label} -> ${after.label}   (median, negative is faster)`);
	const header = ['url'.padEnd(20), 'LCP', 'ΔLCP', 'FCP', 'ΔFCP', 'CLS', 'ΔCLS', 'TBT', 'ΔTBT'];
	console.log(header.map((head, i) => (i === 0 ? head : head.padStart(8))).join(' '));
	for (const url of Object.keys(after.urls)) {
		const a = before.urls[url];
		const b = after.urls[url];
		if (!a) continue;
		const delta = (metric, format) => {
			const diff = b[metric].median - a[metric].median;
			return `${diff >= 0 ? '+' : ''}${format(diff)}`;
		};
		console.log(
			[
				url.padEnd(20),
				fmt.lcp(b.lcp.median).padStart(8),
				delta('lcp', fmt.lcp).padStart(8),
				fmt.fcp(b.fcp.median).padStart(8),
				delta('fcp', fmt.fcp).padStart(8),
				fmt.cls(b.cls.median).padStart(8),
				delta('cls', fmt.cls).padStart(8),
				fmt.tbt(b.tbt.median).padStart(8),
				delta('tbt', fmt.tbt).padStart(8)
			].join(' ')
		);
	}
	console.log(
		'\nSpread (min-max) of the after run, to judge what counts as signal:' +
			Object.entries(after.urls)
				.map(
					([url, s]) =>
						`\n  ${url.padEnd(20)} LCP ${ms(s.lcp.min)}-${ms(s.lcp.max)}  FCP ${ms(s.fcp.min)}-${ms(s.fcp.max)}`
				)
				.join('')
	);
}

// ----------------------------------------------------------------------- main

async function main() {
	const args = parseArgs(process.argv.slice(2));

	if (args.compare) {
		const [before, after] = args.compare.map((file) => JSON.parse(readFileSync(file, 'utf8')));
		printComparison(before, after);
		return;
	}
	if (!args.label) throw new Error('--label <name> is required (or --compare a.json b.json)');

	const { child, configHome } = await startServer(args.port);
	const results = { label: args.label, runs: args.runs, when: new Date().toISOString(), urls: {} };
	try {
		for (const url of args.urls) {
			const readings = [];
			for (let run = 0; run < args.runs; run++) {
				const target = `http://127.0.0.1:${args.port}${url}`;
				// One retry: a browser that fails to come up is a fact about this
				// machine, not about the build being measured.
				try {
					readings.push(await measure(target, 9222 + run));
				} catch (error) {
					console.error(`\n  retrying ${url} run ${run + 1}: ${error.message.split('\n')[0]}`);
					readings.push(await measure(target, 9222 + run));
				}
				process.stdout.write(`  ${url} run ${run + 1}/${args.runs}\r`);
			}
			results.urls[url] = summarise(readings);
		}
	} finally {
		stopServer(child);
		rmSync(configHome, { recursive: true, force: true });
	}

	mkdirSync(path.join(SITE_DIR, args.out), { recursive: true });
	const file = path.join(SITE_DIR, args.out, `${args.label}.json`);
	writeFileSync(file, JSON.stringify(results, null, '\t'));
	printTable(args.label, results);
	console.log(`\nwrote ${path.relative(SITE_DIR, file)}`);
}

await main();
