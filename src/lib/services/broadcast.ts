import { get } from 'svelte/store';
import { subtitles, type SubtitleState } from '$lib/stores/subtitles';
import { style, type SubtitleStyle } from '$lib/stores/style';

export type BroadcastMessage =
	| { type: 'subtitle-update'; lines: SubtitleState['lines']; partialText: string; connectionStatus: SubtitleState['connectionStatus']; errorMessage: string; lastActivityTimestamp: number }
	| { type: 'style-update'; style: SubtitleStyle }
	| { type: 'ping' };

const CHANNEL_NAME = 'livesubs';
const THROTTLE_MS = 200;
const PING_INTERVAL_MS = 3000;

let channel: BroadcastChannel | null = null;
let unsubSubtitles: (() => void) | null = null;
let unsubStyle: (() => void) | null = null;
let pingTimer: ReturnType<typeof setInterval> | null = null;
let throttleTimer: ReturnType<typeof setTimeout> | null = null;
let pendingPartial = false;

function sendSubtitleState(state: SubtitleState) {
	channel?.postMessage({
		type: 'subtitle-update',
		lines: state.lines,
		partialText: state.partialText,
		connectionStatus: state.connectionStatus,
		errorMessage: state.errorMessage,
		lastActivityTimestamp: state.lastActivityTimestamp
	} satisfies BroadcastMessage);
}

export function startBroadcasting() {
	if (channel) return;
	channel = new BroadcastChannel(CHANNEL_NAME);

	let prevLines = get(subtitles).lines;
	let prevStatus = get(subtitles).connectionStatus;

	unsubSubtitles = subtitles.subscribe((state) => {
		const linesChanged = state.lines !== prevLines;
		const statusChanged = state.connectionStatus !== prevStatus;
		prevLines = state.lines;
		prevStatus = state.connectionStatus;

		// Send immediately on final line or status change
		if (linesChanged || statusChanged) {
			if (throttleTimer) {
				clearTimeout(throttleTimer);
				throttleTimer = null;
			}
			pendingPartial = false;
			sendSubtitleState(state);
			return;
		}

		// Throttle partial-text-only updates to max 5/sec
		if (!throttleTimer) {
			sendSubtitleState(state);
			throttleTimer = setTimeout(() => {
				throttleTimer = null;
				if (pendingPartial) {
					pendingPartial = false;
					sendSubtitleState(get(subtitles));
				}
			}, THROTTLE_MS);
		} else {
			pendingPartial = true;
		}
	});

	unsubStyle = style.subscribe((s) => {
		channel?.postMessage({ type: 'style-update', style: s } satisfies BroadcastMessage);
	});

	pingTimer = setInterval(() => {
		channel?.postMessage({ type: 'ping' } satisfies BroadcastMessage);
	}, PING_INTERVAL_MS);
}

export function stopBroadcasting() {
	if (unsubSubtitles) { unsubSubtitles(); unsubSubtitles = null; }
	if (unsubStyle) { unsubStyle(); unsubStyle = null; }
	if (pingTimer) { clearInterval(pingTimer); pingTimer = null; }
	if (throttleTimer) { clearTimeout(throttleTimer); throttleTimer = null; }
	pendingPartial = false;
	if (channel) { channel.close(); channel = null; }
}
