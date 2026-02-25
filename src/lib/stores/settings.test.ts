import { describe, it, expect, beforeEach, vi } from 'vitest';
import { get } from 'svelte/store';

describe('settings store', () => {
	beforeEach(() => {
		vi.resetModules();
		localStorage.clear();
	});

	async function loadSettings() {
		const mod = await import('./settings');
		return mod.settings;
	}

	it('has correct defaults when localStorage is empty', async () => {
		const settings = await loadSettings();
		const s = get(settings);

		expect(s.azureKey).toBe('');
		expect(s.azureRegion).toBe('westeurope');
		expect(s.sourceLanguage).toBe('en-US');
		expect(s.targetLanguage).toBe('');
		expect(s.audioDeviceId).toBe('');
		expect(s.phrases).toEqual([]);
		expect(s.profanityFilter).toBe('masked');
		expect(s.autoDetectLanguages).toEqual(['en-US', 'nl-NL', 'de-DE']);
		expect(s.silenceThresholdSeconds).toBe(15);
		expect(s.silenceAudioAlert).toBe(false);
	});

	it('loads persisted settings from localStorage', async () => {
		localStorage.setItem(
			'livesubs-settings',
			JSON.stringify({ azureKey: 'test-key', azureRegion: 'eastus' })
		);

		const settings = await loadSettings();
		const s = get(settings);

		expect(s.azureKey).toBe('test-key');
		expect(s.azureRegion).toBe('eastus');
	});

	it('merges persisted settings with defaults (new fields preserved)', async () => {
		localStorage.setItem(
			'livesubs-settings',
			JSON.stringify({ azureKey: 'my-key' })
		);

		const settings = await loadSettings();
		const s = get(settings);

		expect(s.azureKey).toBe('my-key');
		// Default fields still present
		expect(s.sourceLanguage).toBe('en-US');
		expect(s.profanityFilter).toBe('masked');
	});

	it('persists changes to localStorage on update', async () => {
		const settings = await loadSettings();
		settings.update((s) => ({ ...s, azureRegion: 'northeurope' }));

		const stored = JSON.parse(localStorage.getItem('livesubs-settings')!);
		expect(stored.azureRegion).toBe('northeurope');
	});

	it('ignores corrupt localStorage data', async () => {
		localStorage.setItem('livesubs-settings', 'not-valid-json{{{');

		const settings = await loadSettings();
		const s = get(settings);

		// Falls back to defaults
		expect(s.azureKey).toBe('');
		expect(s.azureRegion).toBe('westeurope');
	});
});
