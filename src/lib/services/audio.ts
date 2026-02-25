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
}

export async function createAudioLevelMonitor(deviceId?: string): Promise<AudioLevelMonitor> {
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

	return {
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
		}
	};
}
