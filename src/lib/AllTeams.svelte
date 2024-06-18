<script>
	import { writable } from 'svelte/store';
	import { credsStore, teamsState } from './stores.js';
	import { onDestroy } from 'svelte';
	// Components
	import { goto } from '$app/navigation';
	import { Paginator, SlideToggle } from '@skeletonlabs/skeleton';
	import {
		dataTableHandler,
		dataTableSelect,
		dataTableSort,
		tableInteraction,
		tableA11y
	} from '$lib/DataTable/DataTable';

	let is_admin = $credsStore.is_admin;
	let teams = $teamsState.teams;
	let search = $teamsState.search || '';
	let withDetails = $teamsState.withDetails;
	if (withDetails == null) withDetails = true;
	let page = $teamsState.page || 0;
	let limit = $teamsState.limit || 10;

	const dataTableModel = writable({
		source: teams,
		filtered: teams,
		selection: [],
		search: search,
		withDetails: withDetails,
		sort: 'name',
		filter: dataFilter,
		pagination: { page, limit, size: 0, amounts: [10, 20, 50, 100, 500] }
	});
	const unsubscribe = dataTableModel.subscribe((v) => dataTableHandler(v));
	onDestroy(unsubscribe);

	// Manual Selection
	dataTableSelect(dataTableModel, 'id', [1]);

	async function selectRow(row) {
		let team = { ...row };
		if (!team.with_details) return;
		$teamsState.search = $dataTableModel.search;
		$teamsState.withDetails = $dataTableModel.withDetails;
		$teamsState.team = team;
		$teamsState.page = $dataTableModel.pagination.page;
		$teamsState.limit = $dataTableModel.pagination.limit;
		await goto('/team/' + team.id + '?from=/teams');
	}

	async function newTeam() {
		$teamsState.search = $dataTableModel.search;
		$teamsState.withDetails = $dataTableModel.withDetails;
		$teamsState.team = null;
		$teamsState.page = $dataTableModel.pagination.page;
		$teamsState.limit = $dataTableModel.pagination.limit;
		await goto('/newteam?from=/teams');
	}

	function dataFilter(store) {
		const formattedSearchTerm = store.search?.toLowerCase() || '';
		return store.source.filter((rowObj) => {
			if (store.withDetails && !rowObj.with_details) {
				return false;
			}
			if (rowObj.name.toLowerCase().includes(formattedSearchTerm)) return true;
			return false;
		});
	}
</script>

<div class="px-6 py-8">
	<section class="card !bg-accent-500/5">
		<!-- Search Input -->
		<div class="flex m-5 card-header">
			{#if !is_admin}
				<SlideToggle bind:checked={$dataTableModel.withDetails}>Nur meine Teams</SlideToggle>
			{/if}
			<input
				bind:value={$dataTableModel.search}
				type="search"
				placeholder="Suchen..."
				class="p-2 bg-primary-300"
			/>
		</div>
		<!-- Table -->
		<div class="card-body">
			<div class="table-container">
				<!-- prettier-ignore -->
				<table class="table table-hover" role="grid" use:tableInteraction use:tableA11y>
						<thead>
							<tr>
								<th  on:click={(e) => { dataTableSort(e, dataTableModel) }} on:keypress data-sort="name">Name</th>
								<th  on:click={(e) => { dataTableSort(e, dataTableModel) }} on:keypress data-sort="email">Email</th>
								<th  on:click={(e) => { dataTableSort(e, dataTableModel) }} on:keypress data-sort="needs_first_aid_training">EHK</th>
								<!-- <th>Logging</th> -->
							</tr>
						</thead>
						<tbody>
							{#each $dataTableModel.filtered as row, rowIndex}
								<tr class:table-row-checked={row.dataTableChecked} aria-rowindex={rowIndex + 1} on:click={() => {selectRow(row)}}>
									<td role="gridcell" aria-colindex={1} tabindex="0">
										{row.name}
									</td>
									<td role="gridcell" aria-colindex={2} tabindex="0">
										{row.email}
									</td>
									<td role="gridcell" aria-colindex={3} tabindex="0">
										<!--input type="checkbox" disabled checked={+row.active} /-->
										{+row.needs_first_aid_training? "Ja": "Nein"}
									</td>
								</tr>
							{/each}
						</tbody>
					</table>
			</div>
		</div>
		<div class="card-footer">
			<Paginator bind:settings={$dataTableModel.pagination} />
		</div>
	</section>
</div>
<div>
	<button class="m-4 btn bg-primary-300" on:click={newTeam}>Neues Team</button>
</div>
