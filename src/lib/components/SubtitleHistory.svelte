<script lang="ts">
	import { subtitles } from '$lib/stores/subtitles';
	import { onMount } from 'svelte';

	interface Props {
		sessionStartTime: number;
	}

	let { sessionStartTime }: Props = $props();

	let scrollContainer: HTMLDivElement | undefined = $state();
	let userScrolled = $state(false);
	let copied = $state(false);

	function formatTime(timestamp: number): string {
		if (!sessionStartTime) return '';
		const elapsed = Math.max(0, timestamp - sessionStartTime);
		const totalSeconds = Math.floor(elapsed / 1000);
		const minutes = Math.floor(totalSeconds / 60);
		const seconds = totalSeconds % 60;
		return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
	}

	function handleScroll() {
		if (!scrollContainer) return;
		const { scrollTop, scrollHeight, clientHeight } = scrollContainer;
		// User has scrolled up if not near the bottom
		userScrolled = scrollHeight - scrollTop - clientHeight > 40;
	}

	// Auto-scroll to bottom on new lines
	$effect(() => {
		// Track lines length to trigger on changes
		const _len = $subtitles.lines.length;
		if (!userScrolled && scrollContainer) {
			scrollContainer.scrollTop = scrollContainer.scrollHeight;
		}
	});

	async function handleCopyAll() {
		const text = $subtitles.lines.map((l) => l.text).join('\n');
		await navigator.clipboard.writeText(text);
		copied = true;
		setTimeout(() => { copied = false; }, 2000);
	}
</script>

<div class="flex flex-col h-full">
	<div class="flex items-center justify-between px-3 py-2 border-b border-white/10">
		<span class="text-xs font-semibold text-white">
			History ({$subtitles.lines.length} lines)
		</span>
		<button
			onclick={handleCopyAll}
			class="text-xs px-2 py-0.5 rounded hover:brightness-110 transition-all"
			style:background-color="var(--el-bg-light)"
			style:color="var(--el-muted)"
			disabled={$subtitles.lines.length === 0}
		>
			{copied ? 'Copied!' : 'Copy All'}
		</button>
	</div>

	<div
		bind:this={scrollContainer}
		onscroll={handleScroll}
		class="flex-1 overflow-y-auto px-3 py-2 space-y-1"
		style:background-color="var(--el-bg)"
	>
		{#if $subtitles.lines.length === 0}
			<p class="text-xs italic" style:color="var(--el-muted)">No lines yet...</p>
		{:else}
			{#each $subtitles.lines as line (line.id)}
				<div class="flex gap-2 text-sm">
					<span class="shrink-0 font-mono text-xs leading-5" style:color="var(--el-muted)">
						{formatTime(line.timestamp)}
					</span>
					<span class="text-white leading-5">{line.text}</span>
				</div>
			{/each}
		{/if}
	</div>
</div>
