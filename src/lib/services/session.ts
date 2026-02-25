import { get } from 'svelte/store';
import { settings } from '$lib/stores/settings';
import { subtitles } from '$lib/stores/subtitles';
import { startRecognition, stopRecognition } from '$lib/services/speech';
import { createAudioLevelMonitor, type AudioLevelMonitor, getAudioInputDevices, watchDeviceChanges } from '$lib/services/audio';
import { enableAutoReconnect, disableAutoReconnect } from '$lib/services/reconnection';
import { requestWakeLock, releaseWakeLock } from '$lib/services/wakelock';
import { startSession as startTranscriptSession, getEntryCount } from '$lib/services/transcript';

let audioMonitor: AudioLevelMonitor | null = null;
let audioLevelInterval: ReturnType<typeof setInterval> | null = null;
let unwatchDevices: (() => void) | null = null;

function handleDeviceDisconnect() {
	subtitles.setStatus('error', 'Audio device disconnected. Please reconnect and restart.');
	stopSession();
}

async function handleDeviceChange() {
	const s = get(subtitles);
	const running = ['connecting', 'connected', 'reconnecting'].includes(s.connectionStatus);
	if (!running) return;
	const deviceId = get(settings).audioDeviceId;
	if (!deviceId) return;
	const devices = await getAudioInputDevices();
	const stillPresent = devices.some((d) => d.deviceId === deviceId);
	if (!stillPresent) {
		handleDeviceDisconnect();
	}
}

export async function startSession(deviceId?: string) {
	const resolvedDeviceId = deviceId ?? get(settings).audioDeviceId;
	startTranscriptSession();
	subtitles.setSessionStart(Date.now());
	enableAutoReconnect();

	try {
		audioMonitor = await createAudioLevelMonitor(
			resolvedDeviceId || undefined,
			handleDeviceDisconnect
		);
		audioLevelInterval = setInterval(() => {
			if (audioMonitor) {
				subtitles.setAudioLevel(audioMonitor.getLevel());
			}
		}, 100);
	} catch {
		// Audio monitor is optional
	}

	unwatchDevices = watchDeviceChanges(handleDeviceChange);
	await requestWakeLock();
	await startRecognition();
}

export async function stopSession() {
	disableAutoReconnect();
	releaseWakeLock();
	await stopRecognition();
	subtitles.setSessionStart(0);

	if (unwatchDevices) {
		unwatchDevices();
		unwatchDevices = null;
	}
	if (audioLevelInterval) {
		clearInterval(audioLevelInterval);
		audioLevelInterval = null;
	}
	if (audioMonitor) {
		audioMonitor.stop();
		audioMonitor = null;
	}
	subtitles.setAudioLevel(0);
}

export function getSessionTranscriptCount(): number {
	return getEntryCount();
}
