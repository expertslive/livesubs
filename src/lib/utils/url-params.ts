import { get } from 'svelte/store';
import { settings, type Settings } from '$lib/stores/settings';
import { style, type SubtitleStyle } from '$lib/stores/style';

const SETTINGS_PARAMS: (keyof Settings)[] = ['azureRegion', 'sourceLanguage', 'targetLanguage', 'audioDeviceId'];
const STYLE_PARAMS: Record<string, keyof SubtitleStyle> = {
	font: 'fontFamily',
	fontSize: 'fontSize',
	maxLines: 'maxLines',
	position: 'position',
	align: 'textAlign'
};

export function applyUrlParams() {
	if (typeof window === 'undefined') return;

	const params = new URLSearchParams(window.location.search);
	if (params.size === 0) return;

	// Apply settings params
	settings.update((s) => {
		const updated = { ...s };
		if (params.has('region')) updated.azureRegion = params.get('region')!;
		if (params.has('source')) updated.sourceLanguage = params.get('source')!;
		if (params.has('target')) updated.targetLanguage = params.get('target')!;
		if (params.has('device')) updated.audioDeviceId = params.get('device')!;
		if (params.has('key')) updated.azureKey = params.get('key')!;
		return updated;
	});

	// Apply style params
	style.update((s) => {
		const updated = { ...s } as Record<string, unknown>;
		for (const [param, field] of Object.entries(STYLE_PARAMS)) {
			if (params.has(param)) {
				const val = params.get(param)!;
				if (field === 'fontSize' || field === 'maxLines') {
					updated[field] = parseInt(val, 10);
				} else {
					updated[field] = val;
				}
			}
		}
		return updated as SubtitleStyle;
	});

	// Strip key from URL bar to avoid leaking in screenshots
	if (params.has('key')) {
		params.delete('key');
		const newSearch = params.toString();
		const newUrl = window.location.pathname + (newSearch ? '?' + newSearch : '');
		history.replaceState(null, '', newUrl);
	}
}

export function buildShareUrl(includeKey = false): string {
	const s = get(settings);
	const st = get(style);

	const params = new URLSearchParams();
	if (s.azureRegion) params.set('region', s.azureRegion);
	if (s.sourceLanguage) params.set('source', s.sourceLanguage);
	if (s.targetLanguage) params.set('target', s.targetLanguage);
	if (s.audioDeviceId) params.set('device', s.audioDeviceId);
	if (includeKey && s.azureKey) params.set('key', s.azureKey);

	if (st.fontFamily) params.set('font', st.fontFamily);
	if (st.fontSize) params.set('fontSize', String(st.fontSize));
	if (st.maxLines) params.set('maxLines', String(st.maxLines));
	if (st.position) params.set('position', st.position);
	if (st.textAlign) params.set('align', st.textAlign);

	const base = typeof window !== 'undefined' ? window.location.origin + window.location.pathname : '';
	return base + '?' + params.toString();
}

export function buildOverlayUrl(includeKey = false): string {
	const s = get(settings);
	const st = get(style);

	const params = new URLSearchParams();
	params.set('bg', 'transparent');
	if (s.azureRegion) params.set('region', s.azureRegion);
	if (s.sourceLanguage) params.set('source', s.sourceLanguage);
	if (s.targetLanguage) params.set('target', s.targetLanguage);
	if (includeKey && s.azureKey) params.set('key', s.azureKey);

	if (st.fontFamily) params.set('font', st.fontFamily);
	if (st.fontSize) params.set('fontSize', String(st.fontSize));
	if (st.maxLines) params.set('maxLines', String(st.maxLines));
	if (st.position) params.set('position', st.position);
	if (st.textAlign) params.set('align', st.textAlign);

	const base = typeof window !== 'undefined' ? window.location.origin + '/overlay' : '/overlay';
	return base + '?' + params.toString();
}
