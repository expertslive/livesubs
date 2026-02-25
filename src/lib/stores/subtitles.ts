import { writable, get } from 'svelte/store';

export interface SubtitleLine {
	id: string;
	text: string;
	isFinal: boolean;
	timestamp: number;
}

export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'reconnecting' | 'error';

export interface SubtitleState {
	lines: SubtitleLine[];
	partialText: string;
	connectionStatus: ConnectionStatus;
	errorMessage: string;
	audioLevel: number;
	lastActivityTimestamp: number;
	sessionStartTime: number;
}

const defaultState: SubtitleState = {
	lines: [],
	partialText: '',
	connectionStatus: 'disconnected',
	errorMessage: '',
	audioLevel: 0,
	lastActivityTimestamp: 0,
	sessionStartTime: 0
};

function createSubtitleStore() {
	const { subscribe, set, update } = writable<SubtitleState>(defaultState);

	let lineCounter = 0;

	return {
		subscribe,

		addFinalLine(text: string) {
			if (!text.trim()) return;
			update((state) => {
				const lines = [
					...state.lines,
					{
						id: `line-${++lineCounter}`,
						text: text.trim(),
						isFinal: true,
						timestamp: Date.now()
					}
				];
				// Trim buffer to 100 lines
				if (lines.length > 100) {
					lines.splice(0, lines.length - 100);
				}
				return { ...state, lines, partialText: '', lastActivityTimestamp: Date.now() };
			});
		},

		setPartial(text: string) {
			update((state) => ({ ...state, partialText: text, lastActivityTimestamp: Date.now() }));
		},

		setStatus(status: ConnectionStatus, errorMessage = '') {
			update((state) => ({ ...state, connectionStatus: status, errorMessage }));
		},

		setAudioLevel(level: number) {
			update((state) => ({ ...state, audioLevel: level }));
		},

		setSessionStart(time: number) {
			update((state) => ({ ...state, sessionStartTime: time }));
		},

		updateLine(id: string, newText: string) {
			if (!newText.trim()) return;
			update((state) => ({
				...state,
				lines: state.lines.map((line) =>
					line.id === id ? { ...line, text: newText.trim() } : line
				)
			}));
		},

		clear() {
			update((state) => ({
				...state,
				lines: [],
				partialText: ''
			}));
		},

		reset() {
			lineCounter = 0;
			set(defaultState);
		},

		/** Bulk-set state from broadcast data (avoids re-adding lines one-by-one) */
		setBroadcastState(data: {
			lines: SubtitleLine[];
			partialText: string;
			connectionStatus: ConnectionStatus;
			errorMessage: string;
			lastActivityTimestamp: number;
		}) {
			update((state) => ({
				...state,
				lines: data.lines,
				partialText: data.partialText,
				connectionStatus: data.connectionStatus,
				errorMessage: data.errorMessage,
				lastActivityTimestamp: data.lastActivityTimestamp
			}));
		}
	};
}

export const subtitles = createSubtitleStore();
