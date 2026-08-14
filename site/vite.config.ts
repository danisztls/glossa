import adapter from '@sveltejs/adapter-static';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [
		sveltekit({
			compilerOptions: {
				// Force runes mode for the project, except for libraries. Can be removed in svelte 6.
				runes: ({ filename }) =>
					filename.split(/[/\\]/).includes('node_modules') ? undefined : true
			},

			// Fully static output: the whole site is prerendered at build
			// time. See docs/decisions.md — offline-first PWA, no server
			// runtime.
			adapter: adapter({
				pages: 'build',
				assets: 'build',
				fallback: undefined,
				precompress: false,
				strict: true
			}),
			prerender: {
				// Every route in this app is prerenderable; fail the build
				// loudly if that ever stops being true instead of silently
				// skipping pages.
				handleHttpError: 'fail',
				handleMissingId: 'fail'
			}
		})
	]
});
