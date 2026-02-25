<script lang="ts">
	import { settings } from '$lib/stores/settings';
	import { defaultPhrases } from '$lib/utils/phrases';

	interface Props {
		disabled?: boolean;
	}

	let { disabled = false }: Props = $props();

	let newPhrase = $state('');

	function addPhrase() {
		const phrase = newPhrase.trim();
		if (!phrase) return;
		if ($settings.phrases.includes(phrase)) {
			newPhrase = '';
			return;
		}
		$settings.phrases = [...$settings.phrases, phrase];
		newPhrase = '';
	}

	function removePhrase(phrase: string) {
		$settings.phrases = $settings.phrases.filter((p) => p !== phrase);
	}

	function loadDefaults() {
		const existing = new Set($settings.phrases);
		const merged = [...$settings.phrases, ...defaultPhrases.filter((p) => !existing.has(p))];
		$settings.phrases = merged;
	}

	function clearAll() {
		$settings.phrases = [];
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Enter') {
			event.preventDefault();
			addPhrase();
		}
	}
</script>

<div class="space-y-2">
	<div class="flex items-center justify-between">
		<h3 class="text-sm font-semibold text-white">
			Phrase List ({$settings.phrases.length})
		</h3>
		<div class="flex gap-1">
			<button
				onclick={loadDefaults}
				{disabled}
				class="text-xs px-2 py-1 rounded hover:brightness-110 disabled:opacity-50"
				style:background-color="var(--el-bg-light)"
				style:color="var(--el-muted)"
			>
				Load Defaults
			</button>
			<button
				onclick={clearAll}
				{disabled}
				class="text-xs px-2 py-1 rounded hover:brightness-110 text-red-400 disabled:opacity-50"
				style:background-color="var(--el-bg-light)"
			>
				Clear
			</button>
		</div>
	</div>

	<div class="flex gap-2">
		<input
			type="text"
			bind:value={newPhrase}
			onkeydown={handleKeydown}
			{disabled}
			placeholder="Add phrase..."
			class="flex-1 rounded px-3 py-1.5 text-sm text-white border border-white/10 placeholder:text-[var(--el-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--el-accent)] disabled:opacity-50"
			style:background-color="var(--el-bg-light)"
		/>
		<button
			onclick={addPhrase}
			{disabled}
			class="rounded px-3 py-1.5 text-sm font-medium text-white hover:brightness-110 disabled:opacity-50"
			style:background-color="var(--el-accent)"
		>
			Add
		</button>
	</div>

	<div
		class="max-h-40 overflow-y-auto rounded p-2 space-y-1"
		style:background-color="var(--el-bg-light)"
	>
		{#if $settings.phrases.length === 0}
			<p class="text-xs text-center py-2" style:color="var(--el-muted)">
				No phrases. Click "Load Defaults" to add IT terminology.
			</p>
		{/if}
		{#each $settings.phrases as phrase}
			<div class="flex items-center justify-between text-xs rounded px-2 py-1 hover:bg-white/5 group">
				<span class="text-white/90">{phrase}</span>
				<button
					onclick={() => removePhrase(phrase)}
					{disabled}
					class="text-red-400 opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50 ml-2"
					title="Remove"
				>
					x
				</button>
			</div>
		{/each}
	</div>
</div>
