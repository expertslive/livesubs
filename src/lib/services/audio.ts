export interface AudioDevice {
	deviceId: string;
	label: string;
}

export async function getAudioInputDevices(): Promise<AudioDevice[]> {
	await navigator.mediaDevices.getUserMedia({ audio: true });
	const devices = await navigator.mediaDevices.enumerateDevices();
	return devices
		.filter((d) => d.kind === 'audioinput')
		.map((d) => ({
			deviceId: d.deviceId,
			label: d.label || `Microphone (${d.deviceId.slice(0, 8)})`
		}));
}

export interface AudioLevelMonitor {
	getLevel: () => number;
	stop: () => void;
	resume: () => void;
}

let activeMonitor: AudioLevelMonitor | null = null;

export async function createAudioLevelMonitor(
	deviceId?: string,
	onTrackEnded?: () => void
): Promise<AudioLevelMonitor> {
	const constraints: MediaStreamConstraints = {
		audio: deviceId ? { deviceId: { exact: deviceId } } : true
	};

	const stream = await navigator.mediaDevices.getUserMedia(constraints);
	const audioContext = new AudioContext();
	const source = audioContext.createMediaStreamSource(stream);
	const analyser = audioContext.createAnalyser();
	analyser.fftSize = 256;
	analyser.smoothingTimeConstant = 0.8;
	source.connect(analyser);

	const dataArray = new Uint8Array(analyser.frequencyBinCount);

	// Watch for track ended (device unplugged)
	if (onTrackEnded) {
		for (const track of stream.getTracks()) {
			track.addEventListener('ended', onTrackEnded);
		}
	}

	const monitor: AudioLevelMonitor = {
		getLevel(): number {
			analyser.getByteFrequencyData(dataArray);
			let sum = 0;
			for (let i = 0; i < dataArray.length; i++) {
				sum += dataArray[i];
			}
			return sum / dataArray.length / 255;
		},
		stop() {
			source.disconnect();
			audioContext.close();
			for (const track of stream.getTracks()) {
				track.stop();
			}
			if (activeMonitor === monitor) {
				activeMonitor = null;
			}
		},
		resume() {
			if (audioContext.state === 'suspended') {
				audioContext.resume();
			}
		}
	};

	activeMonitor = monitor;
	return monitor;
}

export function resumeActiveMonitor() {
	if (activeMonitor) {
		activeMonitor.resume();
	}
}

export function watchDeviceChanges(callback: () => void): () => void {
	let timeout: ReturnType<typeof setTimeout> | null = null;

	const handler = () => {
		if (timeout) clearTimeout(timeout);
		timeout = setTimeout(callback, 500);
	};

	navigator.mediaDevices.addEventListener('devicechange', handler);

	return () => {
		navigator.mediaDevices.removeEventListener('devicechange', handler);
		if (timeout) clearTimeout(timeout);
	};
}
