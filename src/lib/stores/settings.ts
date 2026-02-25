import { writable } from 'svelte/store';

export interface Settings {
	azureKey: string;
	azureRegion: string;
	sourceLanguage: string;
	targetLanguage: string;
	audioDeviceId: string;
	phrases: string[];
}

const defaultSettings: Settings = {
	azureKey: '',
	azureRegion: 'westeurope',
	sourceLanguage: 'en-US',
	targetLanguage: '',
	audioDeviceId: '',
	phrases: []
};

function createSettingsStore() {
	let initial = defaultSettings;

	if (typeof localStorage !== 'undefined') {
		const stored = localStorage.getItem('livesubs-settings');
		if (stored) {
			try {
				initial = { ...defaultSettings, ...JSON.parse(stored) };
			} catch {
				// ignore corrupt data
			}
		}
	}

	const { subscribe, set, update } = writable<Settings>(initial);

	subscribe((value) => {
		if (typeof localStorage !== 'undefined') {
			localStorage.setItem('livesubs-settings', JSON.stringify(value));
		}
	});

	return { subscribe, set, update };
}

export const settings = createSettingsStore();
