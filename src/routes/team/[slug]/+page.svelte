<script>
	/** @type {import('./$types').PageData} */
	export let data;
	import TeamForm from '$lib/TeamForm.svelte';
	import { navigating } from '$app/stores';
	import { ProgressBar } from '@skeletonlabs/skeleton';
</script>

<svelte:head><title>AktivenDB Team</title></svelte:head>

<main class="debug-screens">
	{#if $navigating}
		<ProgressBar />
	{:else}
		<TeamForm {data} />
	{/if}
</main>

<style>
</style>
