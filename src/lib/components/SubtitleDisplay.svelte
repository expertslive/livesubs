<script lang="ts">
	import { fade, fly } from 'svelte/transition';
	import { subtitles } from '$lib/stores/subtitles';
	import { style } from '$lib/stores/style';
	import StatusIndicator from './StatusIndicator.svelte';

	interface Props {
		preview?: boolean;
	}

	let { preview = false }: Props = $props();

	let animationParams = $derived.by(() => {
		switch ($style.animation) {
			case 'fade': return { type: 'fade' as const, params: { duration: 200 } };
			case 'slide': return { type: 'fly' as const, params: { y: 20, duration: 250 } };
			default: return null;
		}
	});

	let visibleLines = $derived.by(() => {
		const maxLines = $style.maxLines;
		// Reserve one line slot for partial text when it exists
		const reserveForPartial = $subtitles.partialText ? 1 : 0;
		const finalLineCount = Math.max(maxLines - reserveForPartial, 0);
		return $subtitles.lines.slice(-finalLineCount);
	});

	let scaleFactor = $derived(preview ? 0.3 : 1);

	let textShadow = $derived.by(() => {
		if (!$style.textOutline) return 'none';
		const c = $style.outlineColor;
		const px = Math.max(1, Math.round(2 * scaleFactor));
		return [
			`${px}px ${px}px 0 ${c}`,
			`-${px}px ${px}px 0 ${c}`,
			`${px}px -${px}px 0 ${c}`,
			`-${px}px -${px}px 0 ${c}`,
			`${px}px 0 0 ${c}`,
			`-${px}px 0 0 ${c}`,
			`0 ${px}px 0 ${c}`,
			`0 -${px}px 0 ${c}`
		].join(', ');
	});

	let justifyContent = $derived(
		$style.position === 'top' ? 'flex-start' : $style.position === 'center' ? 'center' : 'flex-end'
	);
</script>

<div
	class="subtitle-container"
	style:font-family={$style.fontFamily}
	style:font-size="{$style.fontSize * scaleFactor}px"
	style:color={$style.textColor}
	style:text-shadow={textShadow}
	style:text-align={$style.textAlign}
	style:justify-content={justifyContent}
	style:padding="{preview ? 8 : 32}px"
>
	<StatusIndicator />
	{#each visibleLines as line (line.id)}
		{#if animationParams?.type === 'fade'}
			<div class="subtitle-line" in:fade={animationParams.params}>{line.text}</div>
		{:else if animationParams?.type === 'fly'}
			<div class="subtitle-line" in:fly={animationParams.params}>{line.text}</div>
		{:else}
			<div class="subtitle-line">{line.text}</div>
		{/if}
	{/each}
	{#if $subtitles.partialText}
		<div class="subtitle-line partial" style:opacity="0.6">
			{$subtitles.partialText}
		</div>
	{/if}
</div>

<style>
	.subtitle-container {
		position: relative;
		display: flex;
		flex-direction: column;
		width: 100%;
		height: 100%;
		box-sizing: border-box;
		overflow: hidden;
		line-height: 1.3;
		font-weight: bold;
	}

	.subtitle-line {
		width: 100%;
		word-wrap: break-word;
		overflow-wrap: break-word;
	}
</style>
