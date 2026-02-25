<script lang="ts">
	import QrCreator from 'qr-creator';

	interface Props {
		url: string;
		size?: number;
	}

	let { url, size = 160 }: Props = $props();

	let canvas: HTMLCanvasElement | undefined = $state();

	$effect(() => {
		if (!canvas || !url) return;
		QrCreator.render({
			text: url,
			radius: 0.1,
			ecLevel: 'M',
			fill: '#1B2A6B',
			background: '#FFFFFF',
			size: size * 2 // 2x for sharpness
		}, canvas);
		canvas.style.width = `${size}px`;
		canvas.style.height = `${size}px`;
	});
</script>

<canvas bind:this={canvas} class="rounded"></canvas>
