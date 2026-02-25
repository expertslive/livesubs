<script lang="ts">
	import { style, defaultStyle } from '$lib/stores/style';

	interface Props {
		disabled?: boolean;
	}

	let { disabled = false }: Props = $props();

	const fonts = [
		'Arial, sans-serif',
		'Helvetica, sans-serif',
		'Verdana, sans-serif',
		'Georgia, serif',
		'Courier New, monospace',
		'Trebuchet MS, sans-serif',
		'Impact, sans-serif'
	];

	function resetDefaults() {
		$style = { ...defaultStyle };
	}
</script>

<div class="space-y-3">
	<div class="flex items-center justify-between">
		<h3 class="text-sm font-semibold text-white">Subtitle Style</h3>
		<button
			onclick={resetDefaults}
			{disabled}
			class="text-xs px-2 py-1 rounded hover:brightness-110 disabled:opacity-50"
			style:background-color="var(--el-bg-light)"
			style:color="var(--el-muted)"
		>
			Reset
		</button>
	</div>

	<!-- Font Family -->
	<div>
		<label class="block text-xs mb-1" style:color="var(--el-muted)">Font
		<select
			bind:value={$style.fontFamily}
			{disabled}
			class="w-full rounded px-3 py-1.5 text-sm text-white border border-white/10 focus:outline-none focus:ring-2 focus:ring-[var(--el-accent)] disabled:opacity-50"
			style:background-color="var(--el-bg-light)"
		>
			{#each fonts as font}
				<option value={font}>{font.split(',')[0]}</option>
			{/each}
		</select>
		</label>
	</div>

	<!-- Font Size -->
	<div>
		<label class="block text-xs mb-1" style:color="var(--el-muted)">Size: {$style.fontSize}px
		<input
			type="range"
			min="16"
			max="120"
			bind:value={$style.fontSize}
			{disabled}
			class="w-full accent-[var(--el-accent)] disabled:opacity-50"
		/>
		</label>
	</div>

	<!-- Colors -->
	<div class="grid grid-cols-2 gap-3">
		<div>
			<label class="block text-xs mb-1" style:color="var(--el-muted)">Text Color
			<input
				type="color"
				bind:value={$style.textColor}
				{disabled}
				class="w-full h-8 rounded border border-white/10 cursor-pointer disabled:opacity-50"
			/>
			</label>
		</div>
		<div>
			<label class="block text-xs mb-1" style:color="var(--el-muted)">Background
			<div class="flex gap-2 items-center">
				<input
					type="color"
					bind:value={$style.backgroundColor}
					{disabled}
					class="flex-1 h-8 rounded border border-white/10 cursor-pointer disabled:opacity-50"
				/>
				<button
					onclick={() => ($style.backgroundColor = 'transparent')}
					{disabled}
					class="text-xs px-1.5 py-1 rounded disabled:opacity-50"
					style:background-color="var(--el-bg-light)"
					style:color="var(--el-muted)"
					title="Transparent"
				>
					None
				</button>
			</div>
			</label>
		</div>
	</div>

	<!-- Outline -->
	<div class="flex items-center gap-3">
		<label class="flex items-center gap-2 text-xs cursor-pointer" style:color="var(--el-muted)">
			<input
				type="checkbox"
				bind:checked={$style.textOutline}
				{disabled}
				class="accent-[var(--el-accent)] disabled:opacity-50"
			/>
			Text Outline
		</label>
		{#if $style.textOutline}
			<input
				type="color"
				bind:value={$style.outlineColor}
				{disabled}
				class="w-8 h-6 rounded border border-white/10 cursor-pointer disabled:opacity-50"
			/>
		{/if}
	</div>

	<!-- Position -->
	<div>
		<span class="block text-xs mb-1" style:color="var(--el-muted)">Position</span>
		<div class="flex gap-1">
			{#each ['top', 'center', 'bottom'] as pos}
				<button
					onclick={() => ($style.position = pos as 'top' | 'center' | 'bottom')}
					{disabled}
					class="flex-1 px-2 py-1 text-xs rounded font-medium transition-colors disabled:opacity-50"
					style:background-color={$style.position === pos ? 'var(--el-accent)' : 'var(--el-bg-light)'}
					style:color={$style.position === pos ? 'white' : 'var(--el-muted)'}
				>
					{pos.charAt(0).toUpperCase() + pos.slice(1)}
				</button>
			{/each}
		</div>
	</div>

	<!-- Alignment -->
	<div>
		<span class="block text-xs mb-1" style:color="var(--el-muted)">Alignment</span>
		<div class="flex gap-1">
			{#each ['left', 'center', 'right'] as align}
				<button
					onclick={() => ($style.textAlign = align as 'left' | 'center' | 'right')}
					{disabled}
					class="flex-1 px-2 py-1 text-xs rounded font-medium transition-colors disabled:opacity-50"
					style:background-color={$style.textAlign === align ? 'var(--el-accent)' : 'var(--el-bg-light)'}
					style:color={$style.textAlign === align ? 'white' : 'var(--el-muted)'}
				>
					{align.charAt(0).toUpperCase() + align.slice(1)}
				</button>
			{/each}
		</div>
	</div>

	<!-- Max Lines -->
	<div>
		<label class="block text-xs mb-1" style:color="var(--el-muted)">Max Lines: {$style.maxLines}
		<input
			type="range"
			min="1"
			max="4"
			bind:value={$style.maxLines}
			{disabled}
			class="w-full accent-[var(--el-accent)] disabled:opacity-50"
		/>
		</label>
	</div>

	<!-- Animation -->
	<div>
		<span class="block text-xs mb-1" style:color="var(--el-muted)">Animation</span>
		<div class="flex gap-1">
			{#each [['none', 'None'], ['fade', 'Fade'], ['slide', 'Slide']] as [value, label]}
				<button
					onclick={() => ($style.animation = value as 'none' | 'fade' | 'slide')}
					{disabled}
					class="flex-1 px-2 py-1 text-xs rounded font-medium transition-colors disabled:opacity-50"
					style:background-color={$style.animation === value ? 'var(--el-accent)' : 'var(--el-bg-light)'}
					style:color={$style.animation === value ? 'white' : 'var(--el-muted)'}
				>
					{label}
				</button>
			{/each}
		</div>
	</div>
</div>
