<script>
	/** @type {import('./$types').PageData} */
	export let data;
	import MemberForm from '$lib/MemberForm.svelte';
	import { navigating } from '$app/stores';
	import { ProgressBar } from '@skeletonlabs/skeleton';
</script>

<svelte:head><title>AktivenDB Mitglied</title></svelte:head>

<main class="debug-screens">
	{#if $navigating}
		<ProgressBar />
	{:else}
		<MemberForm {data} />
	{/if}
</main>

<style>
</style>
