<script lang="ts">
	import { onMount } from 'svelte';
	import { settings } from '$lib/stores/settings';
	import { defaultPhrases } from '$lib/utils/phrases';
	import { resumeActiveMonitor } from '$lib/services/audio';
	import ConfigPanel from '$lib/components/ConfigPanel.svelte';
	import SubtitleDisplay from '$lib/components/SubtitleDisplay.svelte';

	let isFullscreen = $state(false);
	let fullscreenEl: HTMLDivElement | undefined = $state();

	async function toggleFullscreen() {
		if (!fullscreenEl) return;

		if (!document.fullscreenElement) {
			try {
				await fullscreenEl.requestFullscreen();
				isFullscreen = true;
			} catch {
				// Fullscreen request denied
			}
		} else {
			await document.exitFullscreen();
			isFullscreen = false;
		}
	}

	function handleKeydown(event: KeyboardEvent) {
		// Ignore when typing in inputs
		const target = event.target as HTMLElement;
		if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT') {
			return;
		}
		if (event.key === 'f' || event.key === 'F') {
			event.preventDefault();
			toggleFullscreen();
		}
	}

	function handleFullscreenChange() {
		isFullscreen = !!document.fullscreenElement;
	}

	function handleVisibilityChange() {
		if (document.visibilityState === 'visible') {
			resumeActiveMonitor();
		}
	}

	onMount(() => {
		// Load default phrases on first visit
		if ($settings.phrases.length === 0) {
			$settings.phrases = [...defaultPhrases];
		}

		document.addEventListener('fullscreenchange', handleFullscreenChange);
		document.addEventListener('visibilitychange', handleVisibilityChange);
		return () => {
			document.removeEventListener('fullscreenchange', handleFullscreenChange);
			document.removeEventListener('visibilitychange', handleVisibilityChange);
		};
	});
</script>

<svelte:window onkeydown={handleKeydown} />

<div class="config-view" class:hidden={isFullscreen}>
	<ConfigPanel onFullscreen={toggleFullscreen} />
</div>

<div
	bind:this={fullscreenEl}
	class="fullscreen-view"
	class:active={isFullscreen}
	style:background-color="#00FF00"
>
	<SubtitleDisplay />
</div>

<style>
	.config-view {
		width: 100%;
		height: 100vh;
	}

	.config-view.hidden {
		display: none;
	}

	.fullscreen-view {
		position: fixed;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		z-index: -1;
		opacity: 0;
		pointer-events: none;
	}

	.fullscreen-view.active {
		z-index: 9999;
		opacity: 1;
		pointer-events: auto;
	}

	/* When fullscreen element is actually fullscreened by the browser */
	.fullscreen-view:fullscreen {
		z-index: 9999;
		opacity: 1;
		pointer-events: auto;
	}
</style>
