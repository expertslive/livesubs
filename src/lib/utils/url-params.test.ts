import { describe, it, expect, beforeEach, vi } from 'vitest';
import { get } from 'svelte/store';

describe('url-params', () => {
	beforeEach(() => {
		vi.resetModules();
		localStorage.clear();
	});

	async function loadModules() {
		const urlParams = await import('./url-params');
		const { settings } = await import('$lib/stores/settings');
		const { style } = await import('$lib/stores/style');
		return { ...urlParams, settings, style };
	}

	describe('buildShareUrl', () => {
		it('includes settings params', async () => {
			const { buildShareUrl, settings } = await loadModules();
			settings.update((s) => ({
				...s,
				azureRegion: 'eastus',
				sourceLanguage: 'nl-NL',
				targetLanguage: 'en'
			}));

			const url = buildShareUrl();
			expect(url).toContain('region=eastus');
			expect(url).toContain('source=nl-NL');
			expect(url).toContain('target=en');
		});

		it('excludes key by default', async () => {
			const { buildShareUrl, settings } = await loadModules();
			settings.update((s) => ({ ...s, azureKey: 'secret-key' }));

			const url = buildShareUrl();
			expect(url).not.toContain('key=');
			expect(url).not.toContain('secret-key');
		});

		it('includes key when requested', async () => {
			const { buildShareUrl, settings } = await loadModules();
			settings.update((s) => ({ ...s, azureKey: 'secret-key' }));

			const url = buildShareUrl(true);
			expect(url).toContain('key=secret-key');
		});
	});

	describe('buildOverlayUrl', () => {
		it('targets /overlay path', async () => {
			const { buildOverlayUrl } = await loadModules();
			const url = buildOverlayUrl();
			expect(url).toContain('/overlay');
		});

		it('includes bg=transparent', async () => {
			const { buildOverlayUrl } = await loadModules();
			const url = buildOverlayUrl();
			expect(url).toContain('bg=transparent');
		});
	});

	describe('applyUrlParams', () => {
		it('applies query params to settings store', async () => {
			Object.defineProperty(window, 'location', {
				value: {
					search: '?region=northeurope&source=de-DE&target=nl',
					pathname: '/',
					origin: 'http://localhost'
				},
				writable: true
			});

			const replaceStateSpy = vi.fn();
			Object.defineProperty(window, 'history', {
				value: { replaceState: replaceStateSpy },
				writable: true
			});

			const { applyUrlParams, settings } = await loadModules();
			applyUrlParams();

			const s = get(settings);
			expect(s.azureRegion).toBe('northeurope');
			expect(s.sourceLanguage).toBe('de-DE');
			expect(s.targetLanguage).toBe('nl');
		});

		it('strips key from URL', async () => {
			const replaceStateSpy = vi.fn();
			Object.defineProperty(window, 'location', {
				value: {
					search: '?region=eastus&key=secret',
					pathname: '/',
					origin: 'http://localhost'
				},
				writable: true
			});
			Object.defineProperty(window, 'history', {
				value: { replaceState: replaceStateSpy },
				writable: true
			});

			const { applyUrlParams, settings } = await loadModules();
			applyUrlParams();

			// Key should be applied to settings
			expect(get(settings).azureKey).toBe('secret');

			// But URL should be rewritten without key
			expect(replaceStateSpy).toHaveBeenCalled();
			const newUrl = replaceStateSpy.mock.calls[0][2];
			expect(newUrl).not.toContain('key=');
			expect(newUrl).toContain('region=eastus');
		});
	});
});
