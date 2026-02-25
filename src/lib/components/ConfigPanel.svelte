<script lang="ts">
	import { settings } from '$lib/stores/settings';
	import { subtitles, type ConnectionStatus } from '$lib/stores/subtitles';
	import { startRecognition, stopRecognition, isRecognizing } from '$lib/services/speech';
	import { createAudioLevelMonitor, type AudioLevelMonitor } from '$lib/services/audio';
	import AudioDeviceSelector from './AudioDeviceSelector.svelte';
	import StyleControls from './StyleControls.svelte';
	import PhraseListEditor from './PhraseListEditor.svelte';
	import SubtitleDisplay from './SubtitleDisplay.svelte';

	interface Props {
		onFullscreen: () => void;
	}

	let { onFullscreen }: Props = $props();

	let running = $state(false);
	let audioMonitor = $state<AudioLevelMonitor | null>(null);
	let audioLevelInterval: ReturnType<typeof setInterval> | null = null;

	const sourceLanguages = [
		{ value: 'en-US', label: 'English (US)' },
		{ value: 'en-GB', label: 'English (UK)' },
		{ value: 'nl-NL', label: 'Dutch (Netherlands)' },
		{ value: 'de-DE', label: 'German' },
		{ value: 'fr-FR', label: 'French' },
		{ value: 'es-ES', label: 'Spanish' }
	];

	const targetLanguages = [
		{ value: '', label: 'None (same language)' },
		{ value: 'en', label: 'English' },
		{ value: 'nl', label: 'Dutch' },
		{ value: 'de', label: 'German' },
		{ value: 'fr', label: 'French' },
		{ value: 'es', label: 'Spanish' }
	];

	async function handleStart() {
		running = true;
		try {
			// Start audio level monitor
			audioMonitor = await createAudioLevelMonitor($settings.audioDeviceId || undefined);
			audioLevelInterval = setInterval(() => {
				if (audioMonitor) {
					subtitles.setAudioLevel(audioMonitor.getLevel());
				}
			}, 100);
		} catch {
			// Audio monitor is optional
		}
		await startRecognition();
	}

	async function handleStop() {
		await stopRecognition();
		if (audioLevelInterval) {
			clearInterval(audioLevelInterval);
			audioLevelInterval = null;
		}
		if (audioMonitor) {
			audioMonitor.stop();
			audioMonitor = null;
		}
		subtitles.setAudioLevel(0);
		running = false;
	}

	function handleClear() {
		subtitles.clear();
	}

	let statusColor = $derived.by(() => {
		const status: ConnectionStatus = $subtitles.connectionStatus;
		switch (status) {
			case 'connected': return 'var(--el-accent)';
			case 'connecting': return '#F59E0B';
			case 'error': return '#DC2626';
			default: return 'var(--el-muted)';
		}
	});

	let statusLabel = $derived.by(() => {
		const status: ConnectionStatus = $subtitles.connectionStatus;
		switch (status) {
			case 'connected': return 'Connected';
			case 'connecting': return 'Connecting...';
			case 'error': return 'Error';
			default: return 'Disconnected';
		}
	});
</script>

<div class="h-screen flex" style:background="linear-gradient(135deg, var(--el-navy), var(--el-bg))">
	<!-- Sidebar -->
	<div
		class="w-80 flex flex-col overflow-y-auto shrink-0"
		style:background-color="var(--el-navy)"
	>
		<!-- Header -->
		<div class="p-4 border-b border-white/10">
			<div class="flex items-center gap-3">
				<img src="/logo.png" alt="Experts Live" class="h-10" />
				<div>
					<h1 class="text-lg font-bold text-white">LiveSubs</h1>
					<p class="text-xs" style:color="var(--el-muted)">Real-time Subtitling</p>
				</div>
			</div>
		</div>

		<!-- Config sections -->
		<div class="flex-1 p-4 space-y-5 overflow-y-auto">
			<!-- Azure Settings -->
			<div class="space-y-2">
				<h3 class="text-sm font-semibold text-white">Azure Speech</h3>
				<div>
					<label class="block text-xs mb-1" style:color="var(--el-muted)">Speech Key
					<input
						type="password"
						bind:value={$settings.azureKey}
						disabled={running}
						placeholder="Enter Azure Speech key"
						class="w-full rounded px-3 py-1.5 text-sm text-white border border-white/10 placeholder:text-[var(--el-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--el-accent)] disabled:opacity-50"
						style:background-color="var(--el-bg-light)"
					/>
					</label>
				</div>
				<div>
					<label class="block text-xs mb-1" style:color="var(--el-muted)">Region
					<input
						type="text"
						bind:value={$settings.azureRegion}
						disabled={running}
						placeholder="e.g. westeurope"
						class="w-full rounded px-3 py-1.5 text-sm text-white border border-white/10 placeholder:text-[var(--el-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--el-accent)] disabled:opacity-50"
						style:background-color="var(--el-bg-light)"
					/>
					</label>
				</div>
			</div>

			<!-- Language -->
			<div class="space-y-2">
				<h3 class="text-sm font-semibold text-white">Language</h3>
				<div>
					<label class="block text-xs mb-1" style:color="var(--el-muted)">Source Language
					<select
						bind:value={$settings.sourceLanguage}
						disabled={running}
						class="w-full rounded px-3 py-1.5 text-sm text-white border border-white/10 focus:outline-none focus:ring-2 focus:ring-[var(--el-accent)] disabled:opacity-50"
						style:background-color="var(--el-bg-light)"
					>
						{#each sourceLanguages as lang}
							<option value={lang.value}>{lang.label}</option>
						{/each}
					</select>
					</label>
				</div>
				<div>
					<label class="block text-xs mb-1" style:color="var(--el-muted)">Translate To
					<select
						bind:value={$settings.targetLanguage}
						disabled={running}
						class="w-full rounded px-3 py-1.5 text-sm text-white border border-white/10 focus:outline-none focus:ring-2 focus:ring-[var(--el-accent)] disabled:opacity-50"
						style:background-color="var(--el-bg-light)"
					>
						{#each targetLanguages as lang}
							<option value={lang.value}>{lang.label}</option>
						{/each}
					</select>
					</label>
				</div>
			</div>

			<!-- Audio Device -->
			<AudioDeviceSelector disabled={running} />

			<!-- Style Controls -->
			<StyleControls disabled={running} />

			<!-- Phrase List -->
			<PhraseListEditor disabled={running} />
		</div>

		<!-- Controls -->
		<div class="p-4 border-t border-white/10 space-y-3">
			<div class="flex gap-2">
				{#if !running}
					<button
						onclick={handleStart}
						class="flex-1 rounded py-2.5 text-sm font-bold text-white hover:brightness-110 transition-all"
						style:background-color="var(--el-accent)"
					>
						Start
					</button>
				{:else}
					<button
						onclick={handleStop}
						class="flex-1 rounded py-2.5 text-sm font-bold text-white hover:brightness-110 transition-all"
						style:background-color="#DC2626"
					>
						Stop
					</button>
				{/if}
				<button
					onclick={handleClear}
					class="rounded px-3 py-2.5 text-sm font-medium hover:brightness-110 transition-all"
					style:background-color="var(--el-bg-light)"
					style:color="var(--el-muted)"
					title="Clear subtitles"
				>
					Clear
				</button>
				<button
					onclick={onFullscreen}
					class="rounded px-3 py-2.5 text-sm font-bold text-white hover:brightness-110 transition-all"
					style:background-color="var(--el-blue)"
					title="Fullscreen (F)"
				>
					Fullscreen
				</button>
			</div>
		</div>
	</div>

	<!-- Main area -->
	<div class="flex-1 flex flex-col">
		<!-- Status bar -->
		<div
			class="flex items-center gap-3 px-4 py-2 border-b border-white/10"
			style:background-color="var(--el-bg)"
		>
			<div class="flex items-center gap-2">
				<span
					class="w-2.5 h-2.5 rounded-full"
					style:background-color={statusColor}
				></span>
				<span class="text-sm font-medium" style:color={statusColor}>{statusLabel}</span>
			</div>

			{#if $subtitles.errorMessage}
				<span class="text-sm text-red-400 truncate">{$subtitles.errorMessage}</span>
			{/if}

			<!-- VU Meter -->
			{#if running}
				<div class="ml-auto flex items-center gap-2">
					<span class="text-xs" style:color="var(--el-muted)">Audio</span>
					<div class="w-24 h-2 rounded-full overflow-hidden" style:background-color="var(--el-bg-light)">
						<div
							class="h-full rounded-full transition-all duration-100"
							style:width="{Math.min($subtitles.audioLevel * 100, 100)}%"
							style:background-color={$subtitles.audioLevel > 0.7 ? '#DC2626' : $subtitles.audioLevel > 0.3 ? '#F59E0B' : 'var(--el-accent)'}
						></div>
					</div>
				</div>
			{/if}
		</div>

		<!-- Preview -->
		<div class="flex-1 relative" style:background-color="#00FF00">
			<SubtitleDisplay preview={true} />
		</div>
	</div>
</div>
