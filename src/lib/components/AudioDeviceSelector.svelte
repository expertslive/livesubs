<script lang="ts">
	import { settings } from '$lib/stores/settings';
	import { getAudioInputDevices, type AudioDevice } from '$lib/services/audio';

	interface Props {
		disabled?: boolean;
	}

	let { disabled = false }: Props = $props();

	let devices = $state<AudioDevice[]>([]);
	let loading = $state(false);
	let error = $state('');

	async function refreshDevices() {
		loading = true;
		error = '';
		try {
			devices = await getAudioInputDevices();
			// If no device selected yet, pick the first one
			if (!$settings.audioDeviceId && devices.length > 0) {
				$settings.audioDeviceId = devices[0].deviceId;
			}
		} catch (err) {
			error = 'Could not access microphone. Please grant permission.';
		} finally {
			loading = false;
		}
	}

	$effect(() => {
		refreshDevices();
	});
</script>

<div class="space-y-2">
	<span class="block text-sm font-semibold text-white">Audio Input</span>
	<div class="flex gap-2">
		<select
			bind:value={$settings.audioDeviceId}
			{disabled}
			class="flex-1 rounded px-3 py-2 text-sm text-white border border-white/10 focus:outline-none focus:ring-2 focus:ring-[var(--el-accent)] disabled:opacity-50"
			style:background-color="var(--el-bg-light)"
		>
			{#if devices.length === 0}
				<option value="">No devices found</option>
			{/if}
			{#each devices as device}
				<option value={device.deviceId}>{device.label}</option>
			{/each}
		</select>
		<button
			onclick={refreshDevices}
			{disabled}
			class="rounded px-3 py-2 text-sm font-medium text-white hover:brightness-110 disabled:opacity-50"
			style:background-color="var(--el-bg-light)"
			title="Refresh devices"
		>
			{loading ? '...' : '↻'}
		</button>
	</div>
	{#if error}
		<p class="text-sm text-red-400">{error}</p>
	{/if}
</div>
