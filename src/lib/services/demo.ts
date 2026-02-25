import { subtitles } from '$lib/stores/subtitles';

const samplePhrases = [
	'Welcome to Experts Live, the premier IT conference in the Netherlands.',
	'Today we will be discussing the latest trends in cloud computing and AI.',
	'Azure OpenAI Service enables developers to build intelligent applications.',
	'Infrastructure as Code with Bicep simplifies Azure resource deployment.',
	'Zero Trust security architecture is essential for modern enterprises.',
	'GitHub Copilot is transforming how developers write and review code.',
	'Kubernetes and containerization continue to drive DevOps transformation.',
	'Microsoft Entra ID provides comprehensive identity and access management.',
	'Observability with Azure Monitor gives full-stack visibility into your applications.',
	'Power Platform enables citizen developers to build business solutions.',
	'The shift to hybrid work has accelerated digital transformation initiatives.',
	'Let us now take a look at a live demonstration of these technologies.'
];

let running = false;
let timeoutId: ReturnType<typeof setTimeout> | null = null;
let phraseIndex = 0;

function simulatePhrase(text: string): Promise<void> {
	return new Promise((resolve) => {
		const words = text.split(' ');
		let wordIndex = 0;

		function nextWord() {
			if (!running) {
				resolve();
				return;
			}
			wordIndex++;
			const partial = words.slice(0, wordIndex).join(' ');

			if (wordIndex < words.length) {
				subtitles.setPartial(partial);
				timeoutId = setTimeout(nextWord, 80 + Math.random() * 120);
			} else {
				subtitles.addFinalLine(text);
				resolve();
			}
		}

		timeoutId = setTimeout(nextWord, 200);
	});
}

async function runLoop() {
	subtitles.setStatus('connected');

	while (running) {
		const phrase = samplePhrases[phraseIndex % samplePhrases.length];
		phraseIndex++;
		await simulatePhrase(phrase);

		if (!running) break;

		// Pause between phrases
		await new Promise<void>((resolve) => {
			timeoutId = setTimeout(resolve, 1500 + Math.random() * 1000);
		});
	}
}

export function startDemo() {
	running = true;
	phraseIndex = 0;
	runLoop();
}

export function stopDemo() {
	running = false;
	if (timeoutId) {
		clearTimeout(timeoutId);
		timeoutId = null;
	}
	subtitles.setPartial('');
	subtitles.setStatus('disconnected');
}

export function isDemoRunning(): boolean {
	return running;
}
