<script>
	import { goto } from '$app/navigation';
	import { credsStore, membersState, teamsState } from './stores.js';
	import { writable } from 'svelte/store';
	import { onDestroy, tick } from 'svelte';
	import { dataTableHandler, tableInteraction, tableA11y } from '$lib/DataTable/DataTable';
	import { eyeIcon, deleteIcon, editIcon } from '$lib/icons.js';
	import { deleteTeam, deleteRelation, storeTeam, storeRelation } from './load.js';

	export let data;
	let is_admin = $credsStore.is_admin;
	let team = data.team;
	let i = -1;
	let teams = $teamsState.teams;
	if (teams) {
		i = teams.findIndex((m) => m.id == team.id);
		if (i >= 0) {
			teams[i] = team;
		}
		$teamsState.team = team;
	}

	let withDetails = team.with_details;
	let teamChanges = 0;
	$: if (team) {
		teamChanges++;
	}
	let textFields = {
		name: 'Name',
		email: 'Email'
	};
	let areaFields = {
		admin_comments: 'Kommentar'
	};
	let dateFields = {};
	let boolFields = {
		needs_first_aid_training: 'EHK'
	};
	let readOnlyFields = {};
	function isChecked(k, m) {
		let v = m[k];
		let b = !(v == null || v === false || v == '' || v == '0');
		return b;
	}
	async function saveTeam() {
		if (!team.name || team.name.length < 2) {
			window.alert('Bitte Name eintragen!');
			return;
		}
		if (team.id == null) {
			team.id = await storeTeam('POST', team);
			teams.push(team);
			$teamsState.teams = teams;
			goto('/team/' + team.id + '?from=/team/' + team.id);
		} else {
			await storeTeam('PUT', team);
			goto('/teams?from=/team/' + team.id);
		}
	}
	async function removeTeam() {
		await deleteTeam(team.id);
		$teamsState.team = null;
		$teamsState.teams = $teamsState.teams.filter((m) => m.id != team.id);
		goto('/teams');
	}

	// now for the members
	let relations = [];
	let relation = null;
	let relationChanges = 0;
	$: if (relation) {
		relationChanges++;
	}
	const members = team.members || [];
	for (let member of members) {
		let name = member.last_name + ', ' + member.first_name;
		let mpt = member.project_team_member;
		let id = mpt.id;
		let memberId = member.id;
		let teamId = team.id;
		let link = '/member/' + memberId;
		let role = mpt.member_role_title;
		let desc = mpt.admin_comments;
		relations.push({
			name: name,
			link: link,
			id: id,
			memberId: memberId,
			teamId: teamId,
			role: role,
			desc: desc,
			dataTableChecked: false
		});
	}
	relations = relations.sort((a, b) => (a.name < b.name ? -1 : 1));

	const dataTableModel = writable({
		source: relations,
		filtered: relations,
		selection: [],
		search: '',
		sort: 'name',
		filter: () => {
			return relations;
		},
		pagination: null
	});
	const unsubscribe = dataTableModel.subscribe((v) => dataTableHandler(v));
	onDestroy(unsubscribe);

	function possibleMembers(allMembers) {
		let oldRelations = [];
		for (let relation of relations) {
			oldRelations.push(relation.name);
		}
		let possibleMembers2 = []; // members of which team is not a team
		for (let member of allMembers) {
			if (!member.active) continue;
			member.name = member.last_name + ', ' + member.first_name;
			if (!oldRelations.includes(member.name)) {
				possibleMembers2.push(member);
			}
		}
		return possibleMembers2.sort((a, b) => (a.name < b.name ? -1 : 1));
	}

	let action;
	async function addRelation() {
		relation = { name: '-' };
		action = 'adding';
		await tick();
		relationChanges = 0;
	}
	async function showRelation(r) {
		relation = { ...r };
		action = 'showing';
		await tick();
		relationChanges = 0;
	}
	async function changeRelation(r) {
		relation = { ...r };
		action = 'changing';
		await tick();
		relationChanges = 0;
	}
	async function removeRelation(r) {
		deleteRelation(r.id);
		relations = relations.filter((t) => t.name != r.name);
		$dataTableModel.source = relations;
		await tick();
		relationChanges = 0;
	}
	async function saveRelation() {
		if (relation.name.length < 2 || relation.role.length < 2) {
			window.alert('Formular unvollständig!');
			return;
		}
		if (action == 'changing') {
			await storeRelation('PUT', relation);
			let i = relations.findIndex((m) => m.name == relation.name);
			relations[i] = relation;
			$dataTableModel.source = relations;
		} else if (action == 'adding') {
			// options for new member contain only name, we need member id
			let x = $membersState.members.findIndex((t) => t.name == relation.name);
			relation.memberId = $membersState.members[x].id;
			relation.teamId = team.id;
			relation.link = '/member/' + relation.memberId;
			relation.id = await storeRelation('POST', relation);
			relations.push(relation);
			relations = relations.sort((a, b) => (a.name < b.name ? -1 : 1));
			$dataTableModel.source = relations;
		}
		relation = null;
		action = null;
		relationChanges = 0;
		if (!withDetails) {
			goto('/team/' + team.id + '?from=/team/' + team.id, { invalidateAll: true });
		}
	}

	async function historyTeam() {
		await goto('/history/team=' + team.id);
	}
</script>

{#if withDetails}
	{#if !team.id}
		<h2 class="p-2 text-center">Daten für neues Team</h2>
	{:else}
		<h2 class="p-2 text-center">Team Info</h2>
	{/if}
	<div class="p-1 card">
		<form on:submit|preventDefault class="mt-8">
			{#each Object.keys(textFields) as key (key)}
				<label class="grid items-center grid-cols-6 m-2">
					<span class="col-span-2">{textFields[key]}</span>
					<input
						class="col-span-4 form-input"
						type="text"
						bind:value={team[key]}
						minlength="2"
						required
					/>
				</label>
			{/each}
			{#each Object.keys(areaFields) as key (key)}
				<label class="grid items-center grid-cols-6 m-2">
					<span class="col-span-2">{areaFields[key]}</span>
					<textarea class="col-span-4 form-input" rows="2" bind:value={team[key]} />
				</label>
			{/each}
			{#each Object.keys(dateFields) as key (key)}
				<label class="grid items-center grid-cols-6 m-2">
					<span class="col-span-2">{dateFields[key]}</span>
					<input
						type="date"
						class="col-span-4 form-input"
						disabled={readOnlyFields[key]}
						value={team[key]}
						on:change={(e) => (team[key] = e.target.value)}
					/>
				</label>
			{/each}
			{#each Object.keys(boolFields) as key (key)}
				<label class="grid items-center grid-cols-6 m-2">
					<span class="col-span-2">{boolFields[key]}</span>
					<input
						type="checkbox"
						class="form-input"
						checked={isChecked(key, team)}
						disabled={readOnlyFields[key]}
						on:click={(e) => {
							team[key] = e.target.checked ? '1' : '0';
							team = team;
						}}
					/>
				</label>
			{/each}
		</form>
		<div class="flex my-10">
			<button
				class="mr-8 btn bg-primary-300"
				on:click={() => {
					$teamsState.team = null;
					goto('/teams?from=/team/' + team.id);
				}}>{teamChanges <= 1 ? 'Zurück' : 'Nicht Speichern'}</button
			>
			<button
				disabled={teamChanges <= 1}
				class="mr-8 btn bg-primary-300"
				on:click={() => saveTeam(team)}>Speichern</button
			>
			{#if is_admin && team.id}
				<button
					class="mr-8 btn bg-primary-300"
					on:click={() => {
						removeTeam();
					}}>Team löschen</button
				>
			{/if}
			{#if team.id}
				<button class="mr-8 btn bg-primary-300" on:click={addRelation}
					>Mitgliedschaft hinzufügen</button
				>
			{/if}
			{#if is_admin && team.id}
				<button
					class="mr-8 btn bg-primary-300"
					on:click={() => {
						historyTeam();
					}}>Geschichte</button
				>
			{/if}
		</div>
	</div>
{:else}
	<div class="flex my-10">
		<button
			class="mr-8 btn bg-primary-300"
			on:click={() => {
				$teamsState.team = null;
				goto('/teams?from=/team/' + team.id);
			}}>Zurück</button
		>
		<button class="btn bg-primary-300" on:click={addRelation}>Mitgliedschaft hinzufügen</button>
	</div>
{/if}

{#if team.id}
	<div>
		<section class="card !bg-accent-500/5">
			<h2 class="px-5 py-5">Mitgliedschaften</h2>
			<div class="px-5">
				{#if action == 'changing'}
					<h4>Mitgliedschaft ändern</h4>
				{:else if action == 'adding'}
					<h4>Mitgliedschaft hinzufügen</h4>
				{:else if action == 'showing'}
					<h4>Mitgliedschaft Info</h4>
				{/if}

				{#if action}
					<div class="card">
						<form on:submit|preventDefault class="p-8 mx-8">
							<label class="grid items-center grid-cols-6 m-2">
								<span class="col-span-2">Mitglied</span>
								{#if action == 'showing' || action == 'changing'}
									<input disabled class="col-span-4 form-input" type="text" value={relation.name} />
								{:else}
									<select class="col-span-4 form-select" bind:value={relation.name}>
										<option value="-">-</option>
										{#each possibleMembers($membersState.members) as member}
											<option value={member.name}>{member.name}</option>
										{/each}
									</select>
								{/if}
							</label>
							<label class="grid items-center grid-cols-6 m-2">
								<span class="col-span-2">Funktion</span>
								{#if action == 'showing'}
									<input disabled class="col-span-4 form-input" type="text" value={relation.role} />
								{:else}
									<select class="col-span-4 form-select" bind:value={relation.role}>
										{#if action == 'adding'}
											<option value="-">-</option>
										{/if}
										<option value="Mitglied">Mitglied</option>
										<option value="Formales Mitglied">Formales Mitglied</option>
										<option value="Vorsitz">Vorsitz</option>
									</select>
								{/if}
							</label>
							<label class="grid items-center grid-cols-6 m-2">
								<span class="col-span-2">Kommentar</span>
								{#if action == 'showing'}
									<textarea
										disabled
										class="col-span-4 form-input"
										rows="2"
										bind:value={relation.desc}
									/>
								{:else}
									<textarea class="col-span-4 form-input" rows="2" bind:value={relation.desc} />
								{/if}
							</label>
						</form>
					</div>
				{/if}
			</div>
			{#if relationChanges > 1}
				<button on:click={saveRelation} class="mx-8 btn bg-primary-300"
					>{action == 'adding' ? 'Jetzt hinzufügen' : 'Jetzt ändern'}</button
				>
			{/if}
		</section>
		<section class="card !bg-accent-500/5">
			<!-- Table -->
			<div class="card-body">
				<div class="table-container">
					<!-- prettier-ignore -->
					<table class="table table-hover" role="grid" use:tableInteraction use:tableA11y>
					<thead>
						<tr>
							<!--
							<th><input type="checkbox" on:click={(e) => { dataTableSelectAll(e, dataTableModel) }} /></th>
							<th data-sort="id">ID</th>
							-->
							<th>Mitglied</th>
							<th>Funktion</th>
							<th>Aktion</th>
						</tr>
					</thead>
					<tbody>
						{#each $dataTableModel.filtered as row, rowIndex}
							<tr class:table-row-checked={row.dataTableChecked} aria-rowindex={rowIndex + 1}>
								<td role="gridcell" aria-colindex={0} tabindex="0">
									<a href={row.link}>{row.name}</a>
								</td>
								<td role="gridcell" aria-colindex={1} tabindex="0">
									{row.role}
								</td>
								<td role="gridcell">
									<button class="btn bg-primary-300" on:click={()=> {showRelation(row)}}>{@html eyeIcon}</button>
									<button class="btn bg-primary-300" on:click={()=> {removeRelation(row)}}>{@html deleteIcon}</button>
									<button class="btn bg-primary-300" on:click={()=> {changeRelation(row)}}>{@html editIcon}</button>
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
				</div>
			</div>
		</section>
	</div>
{/if}
