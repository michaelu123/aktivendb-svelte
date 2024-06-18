<script>
	import AllTeams from '$lib/AllTeams.svelte';
	import { navigating } from '$app/stores';
	import { ProgressBar } from '@skeletonlabs/skeleton';
</script>

<svelte:head><title>AktivenDB Teams</title></svelte:head>

<main class="debug-screens">
	{#if $navigating}
		<ProgressBar />
	{:else}
		<AllTeams />
	{/if}
</main>

<style>
</style>
