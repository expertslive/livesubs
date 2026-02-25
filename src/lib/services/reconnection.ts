import { subtitles } from '$lib/stores/subtitles';
import { startRecognition } from '$lib/services/speech';

const BASE_DELAY = 1000;
const MAX_DELAY = 30000;
const MAX_RETRIES = 10;

let enabled = false;
let attempt = 0;
let timeoutId: ReturnType<typeof setTimeout> | null = null;

export function enableAutoReconnect() {
	enabled = true;
	attempt = 0;
}

export function disableAutoReconnect() {
	enabled = false;
	attempt = 0;
	if (timeoutId) {
		clearTimeout(timeoutId);
		timeoutId = null;
	}
}

export function resetBackoff() {
	attempt = 0;
}

export function getAttempt(): number {
	return attempt;
}

export function isAutoReconnectEnabled(): boolean {
	return enabled;
}

export function attemptReconnect() {
	if (!enabled) return;
	if (attempt >= MAX_RETRIES) {
		subtitles.setStatus('error', `Reconnection failed after ${MAX_RETRIES} attempts.`);
		enabled = false;
		return;
	}

	attempt++;
	const delay = Math.min(BASE_DELAY * Math.pow(2, attempt - 1), MAX_DELAY);

	subtitles.setStatus('reconnecting', `Reconnecting (attempt ${attempt})...`);

	timeoutId = setTimeout(async () => {
		timeoutId = null;
		if (!enabled) return;
		try {
			await startRecognition();
		} catch {
			// startRecognition sets error status internally; attemptReconnect
			// will be called again from the canceled/sessionStopped handler
		}
	}, delay);
}
