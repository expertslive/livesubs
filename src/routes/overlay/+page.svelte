<script lang="ts">
	import { onMount } from 'svelte';
	import { startReceiving, stopReceiving, isReceiving } from '$lib/services/broadcast-receiver';
	import { applyUrlParams } from '$lib/utils/url-params';
	import { startSession } from '$lib/services/session';
	import { settings } from '$lib/stores/settings';
	import SubtitleDisplay from '$lib/components/SubtitleDisplay.svelte';

	type OverlayMode = 'waiting' | 'receiver' | 'standalone';

	let mode: OverlayMode = $state('waiting');
	let bgColor = $state('transparent');

	function parseBgParam(): string {
		const params = new URLSearchParams(window.location.search);
		const bg = params.get('bg');
		if (!bg) return 'transparent';
		if (bg === 'green') return '#00FF00';
		if (bg === 'black') return '#000000';
		if (bg === 'transparent') return 'transparent';
		return bg;
	}

	let modeLabel = $derived.by(() => {
		switch (mode) {
			case 'receiver': return 'Live';
			case 'standalone': return 'Standalone';
			default: return 'Waiting...';
		}
	});

	let modeDotColor = $derived.by(() => {
		switch (mode) {
			case 'receiver': return '#22C55E';
			case 'standalone': return '#F59E0B';
			default: return 'var(--el-muted)';
		}
	});

	// Periodically check if still receiving (for receiver mode status)
	let checkInterval: ReturnType<typeof setInterval> | null = null;

	onMount(() => {
		bgColor = parseBgParam();

		async function init() {
			const received = await startReceiving();
			if (received) {
				mode = 'receiver';
			} else {
				// No broadcast source — try standalone mode
				applyUrlParams();
				const hasKey = !!$settings.azureKey;
				const hasRegion = !!$settings.azureRegion;
				if (hasKey && hasRegion) {
					mode = 'standalone';
					await startSession();
				}
				// else: stays in 'waiting' mode
			}
		}
		init();

		// Monitor receiver connection
		checkInterval = setInterval(() => {
			if (mode === 'receiver' && !isReceiving()) {
				mode = 'waiting';
			} else if (mode === 'waiting' && isReceiving()) {
				mode = 'receiver';
			}
		}, 2000);

		return () => {
			stopReceiving();
			if (checkInterval) clearInterval(checkInterval);
		};
	});
</script>

<svelte:head>
	<title>LiveSubs Overlay</title>
</svelte:head>

<div class="overlay" style:background-color={bgColor}>
	<SubtitleDisplay />
	<div class="mode-badge">
		<span class="mode-dot" style:background-color={modeDotColor}></span>
		{modeLabel}
	</div>
</div>

<style>
	:global(body) {
		background: transparent !important;
		overflow: hidden;
	}

	.overlay {
		position: fixed;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
	}

	.mode-badge {
		position: fixed;
		top: 8px;
		left: 8px;
		display: flex;
		align-items: center;
		gap: 6px;
		padding: 4px 10px;
		border-radius: 12px;
		background: rgba(0, 0, 0, 0.4);
		color: rgba(255, 255, 255, 0.7);
		font-size: 11px;
		font-family: system-ui, sans-serif;
		z-index: 100;
		pointer-events: none;
	}

	.mode-dot {
		width: 8px;
		height: 8px;
		border-radius: 50%;
		flex-shrink: 0;
	}
</style>
