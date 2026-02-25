interface TranscriptEntry {
	text: string;
	timestamp: number;
}

let entries: TranscriptEntry[] = [];
let sessionStart = 0;

export function startSession() {
	entries = [];
	sessionStart = Date.now();
}

export function addTranscriptEntry(text: string) {
	if (!text.trim()) return;
	entries.push({ text: text.trim(), timestamp: Date.now() });
}

export function getEntryCount(): number {
	return entries.length;
}

function formatTime(ms: number): string {
	const totalSeconds = Math.floor(ms / 1000);
	const hours = Math.floor(totalSeconds / 3600);
	const minutes = Math.floor((totalSeconds % 3600) / 60);
	const seconds = totalSeconds % 60;
	return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

function formatSrtTime(ms: number): string {
	const totalSeconds = Math.floor(ms / 1000);
	const hours = Math.floor(totalSeconds / 3600);
	const minutes = Math.floor((totalSeconds % 3600) / 60);
	const seconds = totalSeconds % 60;
	const millis = ms % 1000;
	return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')},${String(millis).padStart(3, '0')}`;
}

export function exportAsText(): string {
	return entries
		.map((e) => `[${formatTime(e.timestamp - sessionStart)}] ${e.text}`)
		.join('\n');
}

export function exportAsSrt(): string {
	return entries
		.map((e, i) => {
			const offset = e.timestamp - sessionStart;
			const duration = 3000; // default 3s display per subtitle
			const start = formatSrtTime(offset);
			const end = formatSrtTime(offset + duration);
			return `${i + 1}\n${start} --> ${end}\n${e.text}\n`;
		})
		.join('\n');
}

export function downloadFile(content: string, filename: string) {
	const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
	const url = URL.createObjectURL(blob);
	const a = document.createElement('a');
	a.href = url;
	a.download = filename;
	a.click();
	URL.revokeObjectURL(url);
}
