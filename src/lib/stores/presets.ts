import { writable, get } from 'svelte/store';
import { settings, type Settings } from '$lib/stores/settings';
import { style, type SubtitleStyle } from '$lib/stores/style';

export interface Preset {
	name: string;
	settings: Partial<Settings>;
	style: SubtitleStyle;
	createdAt: number;
}

function createPresetsStore() {
	let initial: Preset[] = [];

	if (typeof localStorage !== 'undefined') {
		const stored = localStorage.getItem('livesubs-presets');
		if (stored) {
			try {
				initial = JSON.parse(stored);
			} catch {
				// ignore corrupt data
			}
		}
	}

	const { subscribe, set, update } = writable<Preset[]>(initial);

	subscribe((value) => {
		if (typeof localStorage !== 'undefined') {
			localStorage.setItem('livesubs-presets', JSON.stringify(value));
		}
	});

	return {
		subscribe,

		savePreset(name: string) {
			const s = get(settings);
			const st = get(style);
			// Exclude azureKey for safety
			const { azureKey, ...settingsWithoutKey } = s;
			const preset: Preset = {
				name,
				settings: settingsWithoutKey,
				style: { ...st },
				createdAt: Date.now()
			};
			update((presets) => {
				// Replace existing preset with same name
				const filtered = presets.filter((p) => p.name !== name);
				return [...filtered, preset];
			});
		},

		loadPreset(preset: Preset) {
			settings.update((s) => ({ ...s, ...preset.settings }));
			style.set({ ...preset.style });
		},

		deletePreset(name: string) {
			update((presets) => presets.filter((p) => p.name !== name));
		}
	};
}

export const presets = createPresetsStore();
