import { describe, expect, it } from 'vitest';
import { ENGAGEMENT_THRESHOLD_MS, isIosLike, shouldOfferIosHint } from './install.svelte';

const IPHONE =
	'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1';
// iPadOS 13+ defaults to "Request Desktop Website", and this is what it sends:
// byte-for-byte a desktop Safari-on-Mac string.
const IPAD_DESKTOP_UA =
	'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15';
const CHROME_IOS =
	'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/126.0 Mobile/15E148 Safari/604.1';
const ANDROID =
	'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Mobile Safari/537.36';

describe('isIosLike', () => {
	it('matches iPhone', () => {
		expect(isIosLike(IPHONE, 5)).toBe(true);
	});

	it('matches non-Safari iOS browsers, which are WebKit and share the Share sheet', () => {
		expect(isIosLike(CHROME_IOS, 5)).toBe(true);
	});

	// The whole reason this function takes a touch-point count.
	it('matches an iPad hiding behind a desktop Macintosh user-agent', () => {
		expect(isIosLike(IPAD_DESKTOP_UA, 5)).toBe(true);
	});

	it('does not match a real Mac sending the identical user-agent', () => {
		expect(isIosLike(IPAD_DESKTOP_UA, 0)).toBe(false);
	});

	it('does not match Android, which gets the Chromium button instead', () => {
		expect(isIosLike(ANDROID, 5)).toBe(false);
	});

	it('does not match a user-agent that merely contains the letters', () => {
		expect(isIosLike('Mozilla/5.0 (X11; Linux x86_64) Chrome/126.0 Safari/537.36', 0)).toBe(false);
		expect(isIosLike('SomeBot/1.0 (+http://example.com/iPhoneCrawler)', 0)).toBe(false);
	});
});

describe('shouldOfferIosHint', () => {
	const eligible = {
		iosLike: true,
		standalone: false,
		dismissed: false,
		engagedMs: ENGAGEMENT_THRESHOLD_MS
	};

	it('offers the hint once the threshold is reached', () => {
		expect(shouldOfferIosHint(eligible)).toBe(true);
	});

	it('holds off below the threshold', () => {
		expect(shouldOfferIosHint({ ...eligible, engagedMs: ENGAGEMENT_THRESHOLD_MS - 1 })).toBe(false);
		expect(shouldOfferIosHint({ ...eligible, engagedMs: 0 })).toBe(false);
	});

	it('never offers on a platform that has a real install API', () => {
		expect(shouldOfferIosHint({ ...eligible, iosLike: false })).toBe(false);
	});

	it('never offers inside the already-installed app', () => {
		expect(shouldOfferIosHint({ ...eligible, standalone: true })).toBe(false);
	});

	it('stays dismissed for good', () => {
		expect(shouldOfferIosHint({ ...eligible, dismissed: true })).toBe(false);
	});
});
