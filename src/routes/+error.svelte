<script lang="ts">
	import { page } from '$app/state';
</script>

<div class="error-page">
	<div class="error-card">
		<h1>{page.status}</h1>
		<p>{page.error?.message || 'Something went wrong'}</p>
		<div class="actions">
			<button onclick={() => window.location.reload()}>Reload Page</button>
			<a href="/">Back to Home</a>
		</div>
	</div>
</div>

<style>
	.error-page {
		min-height: 100vh;
		display: flex;
		align-items: center;
		justify-content: center;
		background: linear-gradient(135deg, var(--el-navy), var(--el-bg));
		padding: 2rem;
	}

	.error-card {
		text-align: center;
		max-width: 400px;
	}

	h1 {
		font-size: 4rem;
		font-weight: bold;
		color: var(--el-accent);
		margin: 0 0 0.5rem;
	}

	p {
		font-size: 1.125rem;
		color: var(--el-muted);
		margin: 0 0 2rem;
	}

	.actions {
		display: flex;
		gap: 1rem;
		justify-content: center;
	}

	button {
		padding: 0.625rem 1.5rem;
		border-radius: 0.375rem;
		border: none;
		font-size: 0.875rem;
		font-weight: 600;
		color: white;
		background-color: var(--el-accent);
		cursor: pointer;
		transition: filter 0.15s;
	}

	button:hover {
		filter: brightness(1.1);
	}

	a {
		padding: 0.625rem 1.5rem;
		border-radius: 0.375rem;
		font-size: 0.875rem;
		font-weight: 600;
		color: var(--el-muted);
		background-color: var(--el-bg-light);
		text-decoration: none;
		transition: filter 0.15s;
	}

	a:hover {
		filter: brightness(1.1);
	}
</style>
