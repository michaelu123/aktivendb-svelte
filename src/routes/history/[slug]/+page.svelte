<script>
	/** @type {import('./$types').PageData} */
	export let data;
	import History from '$lib/History.svelte';
	import { navigating } from '$app/stores';
	import { ProgressBar } from '@skeletonlabs/skeleton';
</script>

<svelte:head><title>Änderungsverlauf</title></svelte:head>

<main class="debug-screens">
	{#if $navigating}
		<ProgressBar />
	{:else}
		<History {data} />
	{/if}
</main>
