<script>
	import { goto } from '$app/navigation';
	import { credsStore, membersState, teamsState } from './stores.js';
	import { writable } from 'svelte/store';
	import { onDestroy, tick } from 'svelte';
	import { dataTableHandler, tableInteraction, tableA11y } from '$lib/DataTable/DataTable';
	import { eyeIcon, deleteIcon, editIcon } from '$lib/icons.js';
	import { deleteMember, deleteRelation, storeMember, storeRelation } from './load.js';

	export let data;
	let is_admin = $credsStore.is_admin;
	let member = data.member;
	let i = -1;
	let members = $membersState.members;
	if (members) {
		i = members.findIndex((m) => m.id == member.id);
		if (i >= 0) {
			members[i] = member;
		}
		$membersState.member = member;
	}

	let withDetails = member.with_details;
	let memberChanges = 0;
	$: if (member) {
		memberChanges++;
	}
	let textFields = {
		last_name: 'Nachname*',
		first_name: 'Vorname*',
		address: 'PLZ',
		adfc_id: 'Mitgliedsnr.',
		birthday: 'Geburtsjahr',
		email_adfc: 'Email (ADFC)',
		email_private: 'Email (Privat)',
		phone_primary: 'Telefon',
		phone_secondary: 'Telefon (alternativ)',
		status: 'Status'
	};
	let areaFields = {
		interests: 'Interessen',
		admin_comments: 'Kommentar'
	};
	let dateFields = {
		latest_contact: 'Letzter Kontakt',
		latest_first_aid_training: 'Letzter EHK',
		next_first_aid_training: 'Nächster EHK',
		responded_to_questionaire_at: 'Datum Fragebogen'
	};
	let boolFields = {
		active: 'Aktiv',
		registered_for_first_aid_training: 'Registriert für EHK',
		responded_to_questionaire: 'Fragebogen ausgefüllt',
		user: 'DB User'
	};
	let readOnlyFields = {
		user: true
	};
	if (!is_admin) {
		readOnlyFields['responded_to_questionaire_at'] = true;
		readOnlyFields['responded_to_questionaire'] = true;
	}
	function isChecked(k, m) {
		let v = m[k];
		let b = !(v == null || v === false || v == '' || v == '0');
		return b;
	}
	async function saveMember() {
		if (
			!member.first_name ||
			member.first_name.length < 2 ||
			!member.last_name ||
			member.last_name.length < 2
		) {
			window.alert('Bitte Vor- und Nachname eintragen!');
			return;
		}
		if (member.id == null) {
			member.id = await storeMember('POST', member);
			members.push(member);
			$membersState.members = members;
			goto('/member/' + member.id + '?from=/member/' + member.id);
		} else {
			await storeMember('PUT', member);
			goto('/members?from=/member/' + member.id);
		}
	}
	async function removeMember() {
		await deleteMember(member.id);
		$membersState.member = null;
		$membersState.members = $membersState.members.filter((m) => m.id != member.id);
		goto('/members');
	}

	// now for the project_teams
	let relations = [];
	let relation = null;
	let relationChanges = 0;
	$: if (relation) {
		relationChanges++;
	}
	const projectTeams = member.project_teams || [];
	for (let team of projectTeams) {
		let name = team.name;
		let withDetails = team.with_details;
		let tpm = team.project_team_member;
		let id = tpm.id;
		let memberId = member.id;
		let teamId = team.id;
		let link = '/team/' + teamId;
		let role = tpm.member_role_title;
		let desc = tpm.admin_comments;
		relations.push({
			name: name,
			link: link,
			id: id,
			memberId: memberId,
			teamId: teamId,
			withDetails: withDetails,
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

	function possibleTeams(allTeams) {
		let oldRelations = [];
		for (let relation of relations) {
			oldRelations.push(relation.name);
		}
		let possibleTeams2 = []; // teams of which member is not a member
		for (let team of allTeams) {
			if (!oldRelations.includes(team.name)) {
				possibleTeams2.push(team);
			}
		}
		return possibleTeams2.sort((a, b) => (a.name < b.name ? -1 : 1));
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
			// options for new team contain only name, we need team id
			let x = $teamsState.teams.findIndex((t) => t.name == relation.name);
			relation.teamId = $teamsState.teams[x].id;
			relation.memberId = member.id;
			relation.link = '/team/' + relation.teamId;
			relation.id = await storeRelation('POST', relation);
			relations.push(relation);
			relations = relations.sort((a, b) => (a.name < b.name ? -1 : 1));
			$dataTableModel.source = relations;
		}
		relation = null;
		action = null;
		relationChanges = 0;
		if (!withDetails) {
			goto('/member/' + member.id + '?from=/member/' + member.id, { invalidateAll: true });
		}
	}
	async function historyMember() {
		await goto('/history/member=' + member.id);
	}
</script>

{#if withDetails}
	{#if !member.id}
		<h2 class="p-2 text-center">Daten für neues Mitglied</h2>
	{:else}
		<h2 class="p-2 text-center">Mitglied Info</h2>
	{/if}
	<div class="p-1 card">
		<form on:submit|preventDefault class="mt-8">
			{#each Object.keys(textFields) as key (key)}
				<label class="grid items-center grid-cols-6 m-2">
					<span class="col-span-2">{textFields[key]}</span>
					<input
						class="col-span-4 form-input"
						type="text"
						bind:value={member[key]}
						minlength="2"
						required
					/>
				</label>
			{/each}
			<label class="grid items-center grid-cols-6 m-2">
				<span class="col-span-2">Geschlecht</span>
				<select class="col-span-4 form-select" bind:value={member.gender}>
					<option value="M">M</option>
					<option value="W">W</option>
					<option value="">-</option>
				</select>
			</label>
			{#each Object.keys(areaFields) as key (key)}
				<label class="grid items-center grid-cols-6 m-2">
					<span class="col-span-2">{areaFields[key]}</span>
					<textarea class="col-span-4 form-input" rows="2" bind:value={member[key]} />
				</label>
			{/each}
			{#each Object.keys(dateFields) as key (key)}
				<label class="grid items-center grid-cols-6 m-2">
					<span class="col-span-2">{dateFields[key]}</span>
					<input
						type="date"
						class="col-span-4 form-input"
						disabled={readOnlyFields[key]}
						value={member[key]}
						on:change={(e) => (member[key] = e.target.value)}
					/>
				</label>
			{/each}
			{#each Object.keys(boolFields) as key (key)}
				<label class="grid items-center grid-cols-6 m-2">
					<span class="col-span-2">{boolFields[key]}</span>
					<input
						type="checkbox"
						class="form-input"
						checked={isChecked(key, member)}
						disabled={readOnlyFields[key]}
						on:click={(e) => {
							member[key] = e.target.checked ? '1' : '0';
							member = member;
						}}
					/>
				</label>
			{/each}
		</form>
		<div class="flex my-10">
			<button
				class="mr-8 btn bg-primary-300"
				on:click={() => {
					$membersState.member = null;
					goto('/members?from=/member/' + member.id);
				}}>{memberChanges <= 1 ? 'Zurück' : 'Nicht Speichern'}</button
			>
			<button
				disabled={memberChanges <= 1}
				class="mr-8 btn bg-primary-300"
				on:click={() => saveMember(member)}>Speichern</button
			>
			{#if is_admin && member.id}
				<button
					class="mr-8 btn bg-primary-300"
					on:click={() => {
						removeMember();
					}}>Mitglied löschen</button
				>
			{/if}
			{#if member.id}
				<button class="mr-8 btn bg-primary-300" on:click={addRelation}
					>Mitgliedschaft hinzufügen</button
				>
			{/if}
			{#if is_admin && member.id}
				<button
					class="mr-8 btn bg-primary-300"
					on:click={() => {
						historyMember();
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
				$membersState.member = null;
				goto('/members?from=/member/' + member.id);
			}}>Zurück</button
		>
		<button class="btn bg-primary-300" on:click={addRelation}>Mitgliedschaft hinzufügen</button>
	</div>
{/if}

{#if member.id}
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
								<span class="col-span-2">AG/OG</span>
								{#if action == 'showing' || action == 'changing'}
									<input disabled class="col-span-4 form-input" type="text" value={relation.name} />
								{:else}
									<select class="col-span-4 form-select" bind:value={relation.name}>
										<option value="-">-</option>
										{#each possibleTeams($teamsState.teams) as team}
											{#if team.with_details}
												<option value={team.name}>{team.name}</option>
											{/if}
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
							<th>AG/OG</th>
							<th>Funktion</th>
							<th>Aktion</th>
						</tr>
					</thead>
					<tbody>
						{#each $dataTableModel.filtered as row, rowIndex}
							<tr class:table-row-checked={row.dataTableChecked} aria-rowindex={rowIndex + 1}>
								{#if row.withDetails}
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
								{:else}
									<td role="gridcell" aria-colindex={0} tabindex="0">
										{row.name}
									</td>
									<td role="gridcell" aria-colindex={1} tabindex="0">
										{row.role}
									</td>
									<td role="gridcell">
									</td>
								{/if}
							</tr>
						{/each}
					</tbody>
				</table>
				</div>
			</div>
		</section>
	</div>
{/if}
