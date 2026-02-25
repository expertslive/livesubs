<script lang="ts">
	import { subtitles } from '$lib/stores/subtitles';
	import { onMount } from 'svelte';

	const SILENCE_THRESHOLD = 5000;

	let now = $state(Date.now());
	let interval: ReturnType<typeof setInterval> | null = null;

	onMount(() => {
		interval = setInterval(() => {
			now = Date.now();
		}, 1000);
		return () => {
			if (interval) clearInterval(interval);
		};
	});

	let status = $derived.by(() => {
		const conn = $subtitles.connectionStatus;
		if (conn === 'disconnected') return 'hidden';
		if (conn === 'error' || conn === 'reconnecting') return 'error';
		if (conn === 'connecting') return 'connecting';
		// connected
		const elapsed = now - $subtitles.lastActivityTimestamp;
		if ($subtitles.lastActivityTimestamp === 0 || elapsed > SILENCE_THRESHOLD) return 'silent';
		return 'active';
	});
</script>

{#if status !== 'hidden'}
	<div
		class="status-dot"
		class:active={status === 'active'}
		class:silent={status === 'silent'}
		class:error={status === 'error'}
		class:connecting={status === 'connecting'}
	></div>
{/if}

<style>
	.status-dot {
		position: absolute;
		top: 8px;
		right: 8px;
		width: 12px;
		height: 12px;
		border-radius: 50%;
		z-index: 10;
	}

	.status-dot.active {
		background-color: #22C55E;
		animation: pulse 2s ease-in-out infinite;
	}

	.status-dot.silent {
		background-color: #F59E0B;
	}

	.status-dot.error {
		background-color: #DC2626;
		animation: blink 1s step-end infinite;
	}

	.status-dot.connecting {
		background-color: #F59E0B;
		animation: pulse 1.5s ease-in-out infinite;
	}

	@keyframes pulse {
		0%, 100% { opacity: 1; }
		50% { opacity: 0.4; }
	}

	@keyframes blink {
		0%, 100% { opacity: 1; }
		50% { opacity: 0; }
	}
</style>
