<script>
	import { navigating } from '$app/stores';
	import { ProgressBar } from '@skeletonlabs/skeleton';
	import { goto } from '$app/navigation';
	let ende = new Date().toISOString().substring(0, 10);
	let year = +ende.substring(0, 4) - 1;
	let beginn = year + ende.substring(4);
	let memberId = '';
	function displayHistory() {
		if (memberId) {
			goto('/history/' + memberId);
		} else {
			goto('/history/' + beginn + ':' + ende);
		}
	}
</script>

<svelte:head><title>Änderungsverlauf</title></svelte:head>

<main class="debug-screens">
	{#if $navigating}
		<ProgressBar />
	{:else}
		<p class="m-2 mt-10">Änderungen im Zeitraum:</p>
		<section class="m-2">
			<div class="flex flex-row">
				<label class="grid grid-cols-3 items-center">
					<span class="col-span-1">Beginn:</span>
					<input
						class="col-span-2"
						type="date"
						value={beginn}
						on:change={(e) => (beginn = e.target.value)}
					/>
				</label>
				<span class="grid grid-cols-6">&nbsp;&nbsp;&nbsp;</span>
				<label class="grid grid-cols-3 items-center">
					<span class="col-span-1">Ende:</span>
					<input
						class="col-span-2"
						type="date"
						value={ende}
						on:change={(e) => (ende = e.target.value)}
					/></label
				>
				<span class="grid grid-cols-6">&nbsp;&nbsp;&nbsp;</span>
				<button class="btn my-10 bg-primary-300" on:click={displayHistory}>Anzeigen</button>
			</div>
		</section>
		<p class="m-2">Oder (falls Mitglied gelöscht):</p>
		<section class="m-2">
			<div class="flex flex-row">
				<label class="grid grid-cols-3 items-center">
					<span class="col-span-1">MemberId:</span>
					<input
						class="col-span-2"
						type="number"
						value=""
						on:change={(e) => (memberId = +e.target.value)}
					/>
				</label>
				<span class="grid grid-cols-6">&nbsp;&nbsp;&nbsp;</span>
				<button class="btn my-10 bg-primary-300" on:click={displayHistory}>Anzeigen</button>
			</div>
		</section>
	{/if}
</main>
