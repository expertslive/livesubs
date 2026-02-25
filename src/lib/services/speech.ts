import * as SpeechSDK from 'microsoft-cognitiveservices-speech-sdk';
import { get } from 'svelte/store';
import { settings } from '$lib/stores/settings';
import { subtitles } from '$lib/stores/subtitles';
import { attemptReconnect, resetBackoff, isAutoReconnectEnabled } from '$lib/services/reconnection';
import { addTranscriptEntry } from '$lib/services/transcript';

let recognizer: SpeechSDK.SpeechRecognizer | SpeechSDK.TranslationRecognizer | null = null;

function needsTranslation(): boolean {
	const s = get(settings);
	if (!s.targetLanguage) return false;
	// Compare base language codes (e.g., "en" from "en-US" vs "en")
	const sourceBase = s.sourceLanguage.split('-')[0];
	return sourceBase !== s.targetLanguage;
}

function getTargetLanguageBcp47(targetLang: string): string {
	// Map short codes to BCP-47 for display purposes
	const map: Record<string, string> = {
		en: 'en',
		nl: 'nl',
		de: 'de',
		fr: 'fr',
		es: 'es'
	};
	return map[targetLang] || targetLang;
}

function createAudioConfig(deviceId: string): SpeechSDK.AudioConfig {
	if (deviceId) {
		return SpeechSDK.AudioConfig.fromMicrophoneInput(deviceId);
	}
	return SpeechSDK.AudioConfig.fromDefaultMicrophoneInput();
}

function loadPhrases(rec: SpeechSDK.SpeechRecognizer | SpeechSDK.TranslationRecognizer, phrases: string[]) {
	if (phrases.length === 0) return;
	const phraseList = SpeechSDK.PhraseListGrammar.fromRecognizer(rec);
	for (const phrase of phrases) {
		phraseList.addPhrase(phrase);
	}
}

function wireEvents(rec: SpeechSDK.SpeechRecognizer | SpeechSDK.TranslationRecognizer, useTranslation: boolean) {
	rec.recognizing = (_sender, event) => {
		let text: string;
		if (useTranslation && event.result.translations) {
			const s = get(settings);
			const targetLang = getTargetLanguageBcp47(s.targetLanguage);
			text = event.result.translations.get(targetLang) || event.result.text;
		} else {
			text = event.result.text;
		}
		subtitles.setPartial(text);
	};

	rec.recognized = (_sender, event) => {
		if (event.result.reason === SpeechSDK.ResultReason.RecognizedSpeech ||
			event.result.reason === SpeechSDK.ResultReason.TranslatedSpeech) {
			let text: string;
			if (useTranslation && event.result.translations) {
				const s = get(settings);
				const targetLang = getTargetLanguageBcp47(s.targetLanguage);
				text = event.result.translations.get(targetLang) || event.result.text;
			} else {
				text = event.result.text;
			}
			subtitles.addFinalLine(text);
			addTranscriptEntry(text);
		}
	};

	rec.canceled = (_sender, event) => {
		if (event.reason === SpeechSDK.CancellationReason.Error) {
			let message = 'Recognition error';
			let transient = false;
			switch (event.errorCode) {
				case SpeechSDK.CancellationErrorCode.ConnectionFailure:
					message = 'Connection failed. Check your internet connection and Azure region.';
					transient = true;
					break;
				case SpeechSDK.CancellationErrorCode.AuthenticationFailure:
					message = 'Authentication failed. Check your Azure Speech key.';
					break;
				case SpeechSDK.CancellationErrorCode.BadRequest:
					message = 'Bad request. Check your language settings.';
					break;
				case SpeechSDK.CancellationErrorCode.Forbidden:
					message = 'Access forbidden. Check your Azure subscription.';
					break;
				case SpeechSDK.CancellationErrorCode.ServiceUnavailable:
					message = 'Azure Speech service is temporarily unavailable.';
					transient = true;
					break;
				default:
					message = event.errorDetails || 'Unknown recognition error';
					transient = true;
			}
			if (transient && isAutoReconnectEnabled()) {
				attemptReconnect();
			} else {
				subtitles.setStatus('error', message);
			}
		}
	};

	rec.sessionStarted = () => {
		resetBackoff();
		subtitles.setStatus('connected');
	};

	rec.sessionStopped = () => {
		if (isAutoReconnectEnabled()) {
			attemptReconnect();
		} else {
			subtitles.setStatus('disconnected');
		}
	};
}

export async function startRecognition(): Promise<void> {
	if (recognizer) {
		await stopRecognition();
	}

	const s = get(settings);

	if (!s.azureKey || !s.azureRegion) {
		subtitles.setStatus('error', 'Azure Speech key and region are required.');
		return;
	}

	subtitles.setStatus('connecting');

	const useTranslation = needsTranslation();

	try {
		const audioConfig = createAudioConfig(s.audioDeviceId);

		if (useTranslation) {
			const translationConfig = SpeechSDK.SpeechTranslationConfig.fromSubscription(
				s.azureKey,
				s.azureRegion
			);
			translationConfig.speechRecognitionLanguage = s.sourceLanguage;
			translationConfig.addTargetLanguage(getTargetLanguageBcp47(s.targetLanguage));

			const rec = new SpeechSDK.TranslationRecognizer(translationConfig, audioConfig);
			loadPhrases(rec, s.phrases);
			wireEvents(rec, true);
			recognizer = rec;
		} else {
			const speechConfig = SpeechSDK.SpeechConfig.fromSubscription(
				s.azureKey,
				s.azureRegion
			);
			speechConfig.speechRecognitionLanguage = s.sourceLanguage;

			const rec = new SpeechSDK.SpeechRecognizer(speechConfig, audioConfig);
			loadPhrases(rec, s.phrases);
			wireEvents(rec, false);
			recognizer = rec;
		}

		await new Promise<void>((resolve, reject) => {
			recognizer!.startContinuousRecognitionAsync(
				() => resolve(),
				(err) => reject(new Error(err))
			);
		});
	} catch (err) {
		subtitles.setStatus('error', err instanceof Error ? err.message : 'Failed to start recognition');
		recognizer = null;
	}
}

export async function stopRecognition(): Promise<void> {
	if (!recognizer) return;

	const rec = recognizer;
	recognizer = null;

	await new Promise<void>((resolve) => {
		rec.stopContinuousRecognitionAsync(
			() => {
				rec.close();
				resolve();
			},
			() => {
				rec.close();
				resolve();
			}
		);
	});

	subtitles.setStatus('disconnected');
}

export function isRecognizing(): boolean {
	return recognizer !== null;
}
