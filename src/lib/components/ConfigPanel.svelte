<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { settings } from '$lib/stores/settings';
	import { subtitles, type ConnectionStatus } from '$lib/stores/subtitles';
	import { startSession, stopSession, getSessionTranscriptCount } from '$lib/services/session';
	import { getEntryCount, exportAsText, exportAsSrt, downloadFile } from '$lib/services/transcript';
	import { startDemo, stopDemo, isDemoRunning } from '$lib/services/demo';
	import { buildShareUrl } from '$lib/utils/url-params';
	import AudioDeviceSelector from './AudioDeviceSelector.svelte';
	import StyleControls from './StyleControls.svelte';
	import PhraseListEditor from './PhraseListEditor.svelte';
	import PresetManager from './PresetManager.svelte';
	import SubtitleDisplay from './SubtitleDisplay.svelte';

	interface Props {
		onFullscreen: () => void;
	}

	let { onFullscreen }: Props = $props();

	let running = $derived(
		['connecting', 'connected', 'reconnecting'].includes($subtitles.connectionStatus)
	);

	const sourceLanguages = [
		{ value: 'auto', label: 'Auto-detect' },
		{ value: 'en-US', label: 'English (US)' },
		{ value: 'en-GB', label: 'English (UK)' },
		{ value: 'nl-NL', label: 'Dutch (Netherlands)' },
		{ value: 'de-DE', label: 'German' },
		{ value: 'fr-FR', label: 'French' },
		{ value: 'es-ES', label: 'Spanish' }
	];

	const autoDetectCandidates = [
		{ value: 'en-US', label: 'English (US)' },
		{ value: 'en-GB', label: 'English (UK)' },
		{ value: 'nl-NL', label: 'Dutch' },
		{ value: 'de-DE', label: 'German' },
		{ value: 'fr-FR', label: 'French' },
		{ value: 'es-ES', label: 'Spanish' }
	];

	function toggleAutoDetectLang(lang: string) {
		settings.update((s) => {
			const current = s.autoDetectLanguages;
			const idx = current.indexOf(lang);
			if (idx >= 0) {
				if (current.length <= 2) return s; // minimum 2
				return { ...s, autoDetectLanguages: current.filter((l) => l !== lang) };
			}
			return { ...s, autoDetectLanguages: [...current, lang] };
		});
	}

	const targetLanguages = [
		{ value: '', label: 'None (same language)' },
		{ value: 'en', label: 'English' },
		{ value: 'nl', label: 'Dutch' },
		{ value: 'de', label: 'German' },
		{ value: 'fr', label: 'French' },
		{ value: 'es', label: 'Spanish' }
	];

	let showExportMenu = $state(false);
	let transcriptCount = $state(0);
	let demoRunning = $state(false);

	function updateTranscriptCount() {
		transcriptCount = getEntryCount();
	}

	function handleExportTxt() {
		const content = exportAsText();
		const date = new Date().toISOString().slice(0, 10);
		downloadFile(content, `livesubs-${date}.txt`);
		showExportMenu = false;
	}

	function handleExportSrt() {
		const content = exportAsSrt();
		const date = new Date().toISOString().slice(0, 10);
		downloadFile(content, `livesubs-${date}.srt`);
		showExportMenu = false;
	}

	let urlCopied = $state(false);

	async function handleCopyUrl(event: MouseEvent) {
		const includeKey = event.shiftKey;
		const url = buildShareUrl(includeKey);
		await navigator.clipboard.writeText(url);
		urlCopied = true;
		setTimeout(() => { urlCopied = false; }, 2000);
	}

	function handleDemo() {
		if (demoRunning) {
			stopDemo();
			demoRunning = false;
		} else {
			startDemo();
			demoRunning = true;
		}
	}

	async function handleStart() {
		await startSession($settings.audioDeviceId);
	}

	async function handleStop() {
		if (demoRunning) {
			stopDemo();
			demoRunning = false;
			return;
		}
		await stopSession();
		updateTranscriptCount();
	}

	function handleClear() {
		subtitles.clear();
	}

	// Session timer
	let now = $state(Date.now());
	let timerInterval: ReturnType<typeof setInterval> | null = null;

	onMount(() => {
		timerInterval = setInterval(() => { now = Date.now(); }, 1000);
	});

	onDestroy(() => {
		if (timerInterval) clearInterval(timerInterval);
	});

	let sessionElapsed = $derived.by(() => {
		const start = $subtitles.sessionStartTime;
		if (!start || !running) return '';
		const elapsed = Math.max(0, now - start);
		const totalSeconds = Math.floor(elapsed / 1000);
		const hours = Math.floor(totalSeconds / 3600);
		const minutes = Math.floor((totalSeconds % 3600) / 60);
		const seconds = totalSeconds % 60;
		return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
	});

	let statusColor = $derived.by(() => {
		const status: ConnectionStatus = $subtitles.connectionStatus;
		switch (status) {
			case 'connected': return 'var(--el-accent)';
			case 'connecting': return '#F59E0B';
			case 'reconnecting': return '#F59E0B';
			case 'error': return '#DC2626';
			default: return 'var(--el-muted)';
		}
	});

	let statusLabel = $derived.by(() => {
		const status: ConnectionStatus = $subtitles.connectionStatus;
		switch (status) {
			case 'connected': return 'Connected';
			case 'connecting': return 'Connecting...';
			case 'reconnecting': return $subtitles.errorMessage || 'Reconnecting...';
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
				<button
					onclick={handleCopyUrl}
					class="ml-auto text-xs px-2 py-1 rounded hover:brightness-110 transition-all"
					style:background-color="var(--el-bg-light)"
					style:color="var(--el-muted)"
					title="Copy settings URL (Shift+click to include key)"
				>
					{urlCopied ? 'Copied!' : 'Copy URL'}
				</button>
			</div>
		</div>

		<!-- Config sections -->
		<div class="flex-1 p-4 space-y-5 overflow-y-auto">
			<!-- Presets -->
			<PresetManager disabled={running} />

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
				{#if $settings.sourceLanguage === 'auto'}
					<div class="rounded p-2 border border-white/10" style:background-color="var(--el-bg-light)">
						<span class="block text-xs mb-1.5" style:color="var(--el-muted)">Candidate Languages (min 2)</span>
						<div class="grid grid-cols-2 gap-1">
							{#each autoDetectCandidates as lang}
								<label class="flex items-center gap-1.5 text-xs cursor-pointer" style:color="var(--el-muted)">
									<input
										type="checkbox"
										checked={$settings.autoDetectLanguages.includes(lang.value)}
										onchange={() => toggleAutoDetectLang(lang.value)}
										disabled={running}
										class="accent-[var(--el-accent)] disabled:opacity-50"
									/>
									{lang.label}
								</label>
							{/each}
						</div>
					</div>
				{/if}
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
				<div>
					<label class="block text-xs mb-1" style:color="var(--el-muted)">Profanity Filter
					<select
						bind:value={$settings.profanityFilter}
						disabled={running}
						class="w-full rounded px-3 py-1.5 text-sm text-white border border-white/10 focus:outline-none focus:ring-2 focus:ring-[var(--el-accent)] disabled:opacity-50"
						style:background-color="var(--el-bg-light)"
					>
						<option value="masked">Masked (***)</option>
						<option value="removed">Removed</option>
						<option value="raw">Raw (no filter)</option>
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
				{#if !running && !demoRunning}
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
					onclick={handleDemo}
					disabled={running}
					class="rounded px-3 py-2.5 text-sm font-medium hover:brightness-110 transition-all disabled:opacity-50"
					style:background-color="var(--el-bg-light)"
					style:color="var(--el-muted)"
					title="Demo mode with sample text"
				>
					{demoRunning ? 'Stop Demo' : 'Demo'}
				</button>
			</div>
			<div class="flex gap-2">
				<button
					onclick={handleClear}
					class="rounded px-3 py-2.5 text-sm font-medium hover:brightness-110 transition-all"
					style:background-color="var(--el-bg-light)"
					style:color="var(--el-muted)"
					title="Clear subtitles"
				>
					Clear
				</button>
				<div class="relative">
					<button
						onclick={() => { updateTranscriptCount(); showExportMenu = !showExportMenu; }}
						class="rounded px-3 py-2.5 text-sm font-medium hover:brightness-110 transition-all"
						style:background-color="var(--el-bg-light)"
						style:color="var(--el-muted)"
						title="Export transcript"
					>
						Export{transcriptCount > 0 ? ` (${transcriptCount})` : ''}
					</button>
					{#if showExportMenu}
						<div
							class="absolute bottom-full left-0 mb-1 rounded border border-white/10 py-1 min-w-[120px]"
							style:background-color="var(--el-navy)"
						>
							<button
								onclick={handleExportTxt}
								class="block w-full text-left px-3 py-1.5 text-sm text-white hover:bg-white/10"
							>
								Export as TXT
							</button>
							<button
								onclick={handleExportSrt}
								class="block w-full text-left px-3 py-1.5 text-sm text-white hover:bg-white/10"
							>
								Export as SRT
							</button>
						</div>
					{/if}
				</div>
				<button
					onclick={onFullscreen}
					class="ml-auto rounded px-3 py-2.5 text-sm font-bold text-white hover:brightness-110 transition-all"
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

			{#if sessionElapsed}
				<span class="text-sm font-mono" style:color="var(--el-muted)">{sessionElapsed}</span>
			{/if}

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
