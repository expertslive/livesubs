<script lang="ts">
	import { quickMessages } from '$lib/stores/quickMessages';
	import { subtitles } from '$lib/stores/subtitles';
	import { addTranscriptEntry } from '$lib/services/transcript';

	let editing = $state(false);
	let editingId = $state<string | null>(null);
	let editText = $state('');
	let newText = $state('');

	function handleSend(text: string) {
		if (editing) return;
		subtitles.addFinalLine(text);
		addTranscriptEntry(text);
	}

	function startEdit(id: string, text: string) {
		editingId = id;
		editText = text;
	}

	function saveEdit(id: string) {
		if (editText.trim()) {
			quickMessages.updateMessage(id, editText);
		}
		editingId = null;
		editText = '';
	}

	function handleAdd(e: SubmitEvent) {
		e.preventDefault();
		if (newText.trim()) {
			quickMessages.add(newText);
			newText = '';
		}
	}
</script>

<div class="flex flex-wrap gap-1.5 items-center">
	{#each $quickMessages as msg (msg.id)}
		{#if editing && editingId === msg.id}
			<input
				type="text"
				bind:value={editText}
				onkeydown={(e) => { if (e.key === 'Enter') saveEdit(msg.id); if (e.key === 'Escape') { editingId = null; } }}
				onblur={() => saveEdit(msg.id)}
				class="rounded px-2 py-1 text-xs text-white border border-[var(--el-accent)] focus:outline-none"
				style:background-color="var(--el-bg-light)"
				autofocus
			/>
		{:else if editing}
			<span class="inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium" style:background-color="var(--el-bg-light)">
				<button
					onclick={() => startEdit(msg.id, msg.text)}
					class="text-white hover:brightness-110 transition-all"
				>{msg.text}</button>
				<button
					onclick={() => quickMessages.remove(msg.id)}
					class="text-red-400 hover:text-red-300"
				>&times;</button>
			</span>
		{:else}
			<button
				onclick={() => handleSend(msg.text)}
				class="rounded-full px-3 py-1 text-xs font-medium transition-all hover:brightness-110"
				style:background-color="var(--el-bg-light)"
				style:color="white"
			>
				{msg.text}
			</button>
		{/if}
	{/each}

	{#if editing}
		<form onsubmit={handleAdd} class="flex gap-1">
			<input
				type="text"
				bind:value={newText}
				placeholder="New..."
				class="rounded px-2 py-1 text-xs text-white border border-white/10 placeholder:text-[var(--el-muted)] focus:outline-none focus:ring-1 focus:ring-[var(--el-accent)] w-20"
				style:background-color="var(--el-bg-light)"
			/>
			<button
				type="submit"
				class="rounded px-2 py-1 text-xs font-medium hover:brightness-110 transition-all"
				style:background-color="var(--el-accent)"
				style:color="white"
			>+</button>
		</form>
	{/if}

	<button
		onclick={() => { editing = !editing; editingId = null; }}
		class="rounded px-2 py-1 text-xs transition-all hover:brightness-110"
		style:background-color={editing ? 'var(--el-accent)' : 'transparent'}
		style:color={editing ? 'white' : 'var(--el-muted)'}
		title={editing ? 'Done editing' : 'Edit quick messages'}
	>
		{editing ? 'Done' : 'Edit'}
	</button>
</div>
