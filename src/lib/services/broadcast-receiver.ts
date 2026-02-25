import { subtitles } from '$lib/stores/subtitles';
import { style } from '$lib/stores/style';
import type { BroadcastMessage } from './broadcast';

const CHANNEL_NAME = 'livesubs';
const ALIVE_TIMEOUT_MS = 5000;

let channel: BroadcastChannel | null = null;
let lastMessageTime = 0;

function handleMessage(event: MessageEvent<BroadcastMessage>) {
	const msg = event.data;
	lastMessageTime = Date.now();

	if (msg.type === 'subtitle-update') {
		subtitles.setBroadcastState({
			lines: msg.lines,
			partialText: msg.partialText,
			connectionStatus: msg.connectionStatus,
			errorMessage: msg.errorMessage,
			lastActivityTimestamp: msg.lastActivityTimestamp
		});
	} else if (msg.type === 'style-update') {
		style.set(msg.style);
	}
	// ping: just updates lastMessageTime
}

export function startReceiving(): Promise<boolean> {
	if (channel) return Promise.resolve(true);
	channel = new BroadcastChannel(CHANNEL_NAME);

	// Return a promise that resolves true if a message arrives within 2s, false otherwise
	return new Promise((resolve) => {
		const timeout = setTimeout(() => {
			if (channel) channel.onmessage = handleMessage;
			resolve(false);
		}, 2000);

		channel!.onmessage = (event: MessageEvent<BroadcastMessage>) => {
			handleMessage(event);
			clearTimeout(timeout);
			channel!.onmessage = handleMessage;
			resolve(true);
		};
	});
}

export function stopReceiving() {
	if (channel) {
		channel.close();
		channel = null;
	}
	lastMessageTime = 0;
}

export function isReceiving(): boolean {
	return lastMessageTime > 0 && (Date.now() - lastMessageTime) < ALIVE_TIMEOUT_MS;
}
