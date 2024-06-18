<script>
	import AllMembers from '$lib/AllMembers.svelte';
	import { navigating } from '$app/stores';
	import { ProgressBar } from '@skeletonlabs/skeleton';
</script>

<svelte:head><title>AktivenDB Mitglieder</title></svelte:head>

<main class="debug-screens">
	{#if $navigating}
		<ProgressBar />
	{:else}
		<AllMembers />
	{/if}
</main>

<style>
</style>
