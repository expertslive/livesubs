<script lang="ts">
	import { presets } from '$lib/stores/presets';

	interface Props {
		disabled?: boolean;
	}

	let { disabled = false }: Props = $props();

	let expanded = $state(false);
	let newPresetName = $state('');

	function handleSave() {
		const name = newPresetName.trim();
		if (!name) return;
		presets.savePreset(name);
		newPresetName = '';
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Enter') {
			handleSave();
		}
	}
</script>

{#if $presets.length > 0 || expanded}
	<div class="space-y-2">
		<button
			onclick={() => { expanded = !expanded; }}
			class="flex items-center gap-1 text-sm font-semibold text-white w-full"
		>
			<span class="text-xs" style:color="var(--el-muted)">{expanded ? '▼' : '▶'}</span>
			Presets
			{#if $presets.length > 0}
				<span class="text-xs font-normal" style:color="var(--el-muted)">({$presets.length})</span>
			{/if}
		</button>

		{#if expanded}
			<!-- Save current -->
			<div class="flex gap-1">
				<input
					type="text"
					bind:value={newPresetName}
					onkeydown={handleKeydown}
					{disabled}
					placeholder="Preset name"
					class="flex-1 rounded px-2 py-1 text-xs text-white border border-white/10 placeholder:text-[var(--el-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--el-accent)] disabled:opacity-50"
					style:background-color="var(--el-bg-light)"
				/>
				<button
					onclick={handleSave}
					disabled={disabled || !newPresetName.trim()}
					class="rounded px-2 py-1 text-xs font-medium text-white hover:brightness-110 transition-all disabled:opacity-50"
					style:background-color="var(--el-accent)"
				>
					Save
				</button>
			</div>

			<!-- Preset list -->
			{#each $presets as preset}
				<div
					class="flex items-center gap-1 rounded px-2 py-1.5 border border-white/10"
					style:background-color="var(--el-bg-light)"
				>
					<span class="flex-1 text-xs text-white truncate">{preset.name}</span>
					<button
						onclick={() => presets.loadPreset(preset)}
						{disabled}
						class="text-xs px-1.5 py-0.5 rounded hover:brightness-110 transition-all disabled:opacity-50"
						style:background-color="var(--el-accent)"
						style:color="white"
					>
						Load
					</button>
					<button
						onclick={() => presets.deletePreset(preset.name)}
						{disabled}
						class="text-xs px-1.5 py-0.5 rounded hover:brightness-110 transition-all disabled:opacity-50"
						style:background-color="#DC2626"
						style:color="white"
					>
						Del
					</button>
				</div>
			{/each}
		{/if}
	</div>
{/if}
