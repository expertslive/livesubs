<script lang="ts">
	interface Props {
		onClose: () => void;
	}

	let { onClose }: Props = $props();

	const shortcuts = [
		{ key: 'Space', description: 'Start / Stop session' },
		{ key: 'F', description: 'Toggle fullscreen' },
		{ key: 'C', description: 'Clear subtitles' },
		{ key: 'T', description: 'Focus manual text input' },
		{ key: '?', description: 'Show keyboard shortcuts' }
	];

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape' || event.key === '?') {
			event.preventDefault();
			onClose();
		}
	}

	function stopPropagation(event: Event) {
		event.stopPropagation();
	}
</script>

<svelte:window onkeydown={handleKeydown} />

<!-- svelte-ignore a11y_no_static_element_interactions a11y_click_events_have_key_events -->
<div
	class="fixed inset-0 z-[100] flex items-center justify-center bg-black/60"
	onclick={onClose}
>
	<!-- svelte-ignore a11y_no_static_element_interactions a11y_click_events_have_key_events -->
	<div
		class="rounded-lg border border-white/10 p-6 shadow-xl w-80 max-w-[90vw]"
		style:background-color="var(--el-navy)"
		onclick={stopPropagation}
	>
		<div class="flex items-center justify-between mb-4">
			<h2 class="text-lg font-bold text-white">Keyboard Shortcuts</h2>
			<button
				onclick={onClose}
				class="text-white/50 hover:text-white transition-colors p-1"
				aria-label="Close"
			>
				&times;
			</button>
		</div>
		<div class="space-y-2">
			{#each shortcuts as shortcut}
				<div class="flex items-center justify-between">
					<span class="text-sm" style:color="var(--el-muted)">{shortcut.description}</span>
					<kbd
						class="px-2 py-0.5 rounded text-xs font-mono font-semibold border border-white/20"
						style:background-color="var(--el-bg-light)"
						style:color="var(--el-accent)"
					>
						{shortcut.key}
					</kbd>
				</div>
			{/each}
		</div>
		<p class="mt-4 text-xs text-center" style:color="var(--el-muted)">
			Press <kbd class="px-1 rounded border border-white/20 font-mono" style:background-color="var(--el-bg-light)">Esc</kbd> or <kbd class="px-1 rounded border border-white/20 font-mono" style:background-color="var(--el-bg-light)">?</kbd> to close
		</p>
	</div>
</div>
