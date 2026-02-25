import { writable } from 'svelte/store';

export interface SubtitleStyle {
	fontFamily: string;
	fontSize: number;
	textColor: string;
	backgroundColor: string;
	textOutline: boolean;
	outlineColor: string;
	position: 'top' | 'center' | 'bottom';
	maxLines: number;
	textAlign: 'left' | 'center' | 'right';
}

export const defaultStyle: SubtitleStyle = {
	fontFamily: 'Arial, sans-serif',
	fontSize: 48,
	textColor: '#FFFFFF',
	backgroundColor: 'transparent',
	textOutline: true,
	outlineColor: '#000000',
	position: 'bottom',
	maxLines: 2,
	textAlign: 'center'
};

function createStyleStore() {
	let initial = defaultStyle;

	if (typeof localStorage !== 'undefined') {
		const stored = localStorage.getItem('livesubs-style');
		if (stored) {
			try {
				initial = { ...defaultStyle, ...JSON.parse(stored) };
			} catch {
				// ignore corrupt data
			}
		}
	}

	const { subscribe, set, update } = writable<SubtitleStyle>(initial);

	subscribe((value) => {
		if (typeof localStorage !== 'undefined') {
			localStorage.setItem('livesubs-style', JSON.stringify(value));
		}
	});

	return { subscribe, set, update };
}

export const style = createStyleStore();
