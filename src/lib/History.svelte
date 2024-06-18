<script>
	import { onDestroy } from 'svelte';
	import { credsStore, membersState, teamsState } from '$lib/stores.js';
	import { getUserFromApi } from '$lib/load.js';
	import { onMount } from 'svelte';
	import { Paginator, SlideToggle } from '@skeletonlabs/skeleton';
	import { writable } from 'svelte/store';
	import { dataTableHandler, tableInteraction, tableA11y } from '$lib/DataTable/DataTable';

	export let data;
	let memberNames = $membersState.memberNames;
	let teamNames = $teamsState.teamNames;
	let table = data.table;
	let id = data.id;
	let historyArr = data.history;
	let beginn = data.beginn;
	let ende = data.ende;
	let fetch = data.fetch;
	let lineNo = 0;
	let historyTxt = [];
	let historyArray = [];
	let page = 0;
	let limit = 10;
	const dataTableModel = writable({
		source: historyArray,
		filtered: historyArray,
		filter: dataFilter,
		pagination: { page, limit, size: 0, amounts: [10, 20, 50, 100, 500] }
	});
	const unsubscribe = dataTableModel.subscribe((v) => dataTableHandler(v));
	onDestroy(unsubscribe);

	onMount(() => history());

	function back() {
		window.history.back();
	}

	function dataFilter(store) {
		return store.source;
	}

	async function history() {
		lineNo = 0;
		for (const event of historyArr) {
			let email = (await getUserFromApi(fetch, event.user_id)).email;
			explainHistory(event, email);
			lineNo++;
		}
		historyTxt = historyTxt;
		$dataTableModel.source = historyArray;
		$dataTableModel.filtered = historyArray;
	}

	function explainHistory(event, email) {
		if (event.reference_table == 'members') {
			explainMember(event, email);
		} else if (event.reference_table == 'project_team_member') {
			explainTeamMember(event, email);
		} else if (event.reference_table == 'project_teams') {
			explainTeam(event, email);
		} else {
			console.log('reference_table???', event.reference_table);
		}
	}

	function explainMember(member, email) {
		let upd = [];
		let historyObj = {};
		let msg = email;
		historyObj['who'] = email.replace('@adfc-muenchen.de', '');
		historyObj['key'] = lineNo;
		historyObj['bgcolor'] = 'bg-primary-300';
		let name = member.record_new['name'];
		if (name == null) name = '';
		name = name.trim();
		if (name == '') {
			name = member.record_new.last_name + ', ' + member.record_new.first_name;
			name = name.trim();
		}
		historyObj['whom'] = name;
		if (Array.isArray(member.record_old)) {
			msg = member.record_new.created_at + ' ' + msg;
			msg += ' adds ' + name;
			historyObj['what'] = 'fügt hinzu';
			historyObj['when'] = member.record_new.created_at;
		} else if (member.record_old.deleted_at != null && member.record_new.deleted_at != null) {
			msg = member.record_new.deleted_at + ' ' + msg;
			msg += ' deletes ' + name;
			let changesArray = [];
			historyObj['changes'] = changesArray;
			historyObj['what'] = 'löscht';
			historyObj['when'] = member.record_new.deleted_at;
			for (const propName in member.record_old) {
				if (propName.endsWith('_at')) continue;
				if (propName == 'id') continue;
				let propOld = member.record_old[propName];
				upd.push(propName + ':' + propOld);
				changesArray.push({ propName, propNew: '', propOld });
			}
		} else {
			let changesArray = [];
			for (const propName in member.record_new) {
				if (propName.endsWith('_at')) continue; //normally only different TZ
				let propNew = member.record_new[propName];
				let propOld = member.record_old[propName];
				if (propNew != propOld) {
					upd.push(propName + ':' + propOld + '=>' + propNew);
					changesArray.push({ propName, propOld, propNew });
				}
			}
			if (upd.length == 0) return;
			historyObj['what'] = 'ändert';
			historyObj['changes'] = changesArray;
			msg = member.record_new.updated_at + ' ' + msg + ' updates ' + name + ': ';
			historyObj['when'] = member.record_new.updated_at;
		}
		historyTxt.push({ indent: 0, msg, lineNo });
		for (let u of upd) {
			lineNo++;
			historyTxt.push({ indent: 1, msg: u, lineNo: lineNo });
		}
		historyArray.push(historyObj);
	}

	function explainTeamMember(tm, email) {
		const projTeamId = tm.record_new.project_team_id;
		if (!projTeamId || +projTeamId <= 0) return;
		const teamName2 = teamName(projTeamId);
		if (teamName2.toLowerCase().startsWith('test')) return;
		const memberName2 = memberName(tm.record_new.member_id);
		let upd = [];
		let historyObj = {};
		let msg = email;
		historyObj['who'] = email;
		historyObj['whom'] = memberName2;
		historyObj['where'] = teamName2;
		historyObj['key'] = lineNo;
		historyObj['bgcolor'] = 'bg-primary-300';
		if (Array.isArray(tm.record_old)) {
			msg = tm.record_new.created_at + ' ' + msg;
			msg +=
				' adds ' + memberName2 + ' to ' + teamName2 + ' with role ' + tm.record_new.member_role_id;
			historyObj['what'] = 'fügt hinzu';
			historyObj['with'] = 'role ' + tm.record_new.member_role_id;
			historyObj['when'] = tm.record_new.created_at;
		} else if (tm.record_old.deleted_at != null && tm.record_new.deleted_at != null) {
			msg = tm.record_new.deleted_at + ' ' + msg;
			msg += ' deletes ' + memberName2 + ' from ' + teamName2;
			historyObj['what'] = 'löscht';
			historyObj['when'] = tm.record_new.deleted_at;
		} else {
			let changesArray = [];
			for (const propName in tm.record_new) {
				if (propName.endsWith('_at')) continue;
				let propNew = tm.record_new[propName];
				let propOld = tm.record_old[propName];
				if (propNew != propOld) {
					upd.push(propName + ':' + propOld + '=>' + propNew);
					changesArray.push({ propName, propOld, propNew });
				}
			}
			if (upd.length == 0) return;
			historyObj['what'] = 'ändert';
			historyObj['changes'] = changesArray;
			msg =
				tm.record_new.updated_at +
				' ' +
				msg +
				' updates ' +
				memberName2 +
				' for ' +
				teamName2 +
				': ';
			historyObj['when'] = tm.record_new.updated_at;
		}
		historyTxt.push({ indent: 0, msg, lineNo });
		for (let u of upd) {
			lineNo++;
			historyTxt.push({ indent: 1, msg: u, lineNo: lineNo });
		}
		historyArray.push(historyObj);
	}

	function explainTeam(team, email) {
		let upd = [];
		let historyObj = {};
		let msg = email;
		let teamName = team.record_new.name;
		historyObj['who'] = email;
		historyObj['whom'] = teamName;
		historyObj['key'] = lineNo;
		historyObj['bgcolor'] = 'bg-primary-300';
		if (Array.isArray(team.record_old)) {
			msg = team.record_new.created_at + ' ' + msg;
			msg += ' adds ' + teamName;
			historyObj['what'] = 'fügt hinzu';
			historyObj['when'] = team.record_new.created_at;
		} else if (team.record_old.deleted_at != null && team.record_new.deleted_at != null) {
			msg = team.record_new.deleted_at + ' ' + msg;
			msg += ' deletes ' + teamName;
			historyObj['what'] = 'löscht';
			historyObj['when'] = team.record_new.deleted_at;
		} else {
			let changesArray = [];
			for (const propName in team.record_new) {
				if (propName.endsWith('_at')) continue;
				let propNew = team.record_new[propName];
				let propOld = team.record_old[propName];
				if (propNew != propOld) {
					upd.push(propName + ':' + propOld + '=>' + propNew);
					changesArray.push({ propName, propOld, propNew });
				}
			}
			if (upd.length == 0) return;
			historyObj['what'] = 'ändert';
			historyObj['changes'] = changesArray;
			msg = team.record_new.updated_at + ' ' + msg;
			msg += ' updates ' + teamName + ': ';
			historyObj['when'] = team.record_new.updated_at;
		}
		historyTxt.push({ indent: 0, msg, lineNo });
		for (let u of upd) {
			lineNo++;
			historyTxt.push({ indent: 1, msg: u, lineNo: lineNo });
		}
		historyArray.push(historyObj);
	}

	function teamName(id) {
		let tn = teamNames[id];
		if (!tn) tn = 'TeamId ' + id;
		return tn;
	}

	function memberName(id) {
		let mn = memberNames[id];
		if (!mn) mn = 'MemberId ' + id;
		return mn;
	}

	let alsWas = 'Als Text';
	function chgFormat() {
		alsWas = alsWas == 'Als Text' ? 'Als Tabelle' : 'Als Text';
	}

	function expandRow(e, row) {
		console.log('row', row, 'e', e);
		row.expand = !row.expand;
		row.bgcolor = row.expand ? 'bg-red-300' : 'bg-primary-300';
		$dataTableModel.source = historyArray; // redraw
	}
</script>

{#if $credsStore && $credsStore.is_admin}
	<div class="flex justify-between mt-2">
		{#if beginn}
			<h2 class="p-2 text-center">Änderungsgeschichte {beginn} bis {ende}</h2>
		{:else if table == 'members'}
			<h2 class="p-2 text-center">Änderungsgeschichte {memberName(id)}</h2>
		{:else}
			<h2 class="p-2 text-center bg-t">Änderungsgeschichte {teamName(id)}</h2>
		{/if}
		<button class="btn bg-primary-300" on:click={chgFormat}
			>{alsWas == 'Als Text' ? 'Als Tabelle' : 'Als Text'}</button
		>
	</div>
	<div class="px-6 py-8">
		<section class="card !bg-accent-500/5">
			<div class="card-body">
				{#if alsWas == 'Als Text'}
					{#each historyTxt as line}
						{#if line.indent == 0}
							<p class="mb-0">{line.msg}</p>
						{:else}
							<p class="mb-0 ml-10">{line.msg}</p>
						{/if}
					{/each}
				{:else}
					<!-- Table -->
					<div class="table-container">
						<!-- prettier-ignore -->
						<table class="table table-hover" role="grid" use:tableInteraction use:tableA11y>
					<thead>
						<tr>
							<th>Wann</th>
							<th>Wer/Wert</th>
							<th>Was/Alt</th>
							<th>Mitglied/Neu</th>
							<th>Gliederung</th>
							<th>Änderungen</th>
						</tr>
					</thead>
					<tbody>
						{#each $dataTableModel.filtered as row, rowIndex}
							<tr
								aria-rowindex={rowIndex + 1}
							>
								<td role="gridcell" aria-colindex={3} tabindex="0">
									{row.when}
								</td>
								<td role="gridcell" aria-colindex={4} tabindex="0">
									{row.who}
								</td>
								<td role="gridcell" aria-colindex={5} tabindex="0">
									{row.what}
								</td>
								<td role="gridcell" aria-colindex={6} tabindex="0">
									{row.whom || ""}
								</td>
								<td role="gridcell" aria-colindex={7} tabindex="0">
									{row.where || ""}
								</td>
								<td role="gridcell" aria-colindex={8} tabindex="0">
									{#if row.changes}
										<button class="btn {row.bgcolor}"  on:click={(e)=>expandRow(e,row)}>{row.changes.length}</button>
									{/if}
								</td>
							</tr>
							{#if row.expand}
								{#each row.changes as chg}
									<tr
										aria-rowindex={rowIndex + 1}
									>
										<td role="gridcell" aria-colindex={3} tabindex="0">
										</td>
										<td role="gridcell" aria-colindex={3} tabindex="0">
											{chg.propName}
										</td>
										<td role="gridcell" aria-colindex={4} tabindex="0">
											{chg.propOld || ""}
										</td>
										<td role="gridcell" aria-colindex={5} tabindex="0">
											{chg.propNew || ""}
										</td>
									</tr>
								{/each}
							{/if}
						{/each}
					</tbody>
				</table>
					</div>
					<div class="card-footer">
						<Paginator bind:settings={$dataTableModel.pagination} />
					</div>
				{/if}
			</div>
		</section>
	</div>
	<div class="p-1 card">
		<div class="flex my-10">
			<button class="mr-8 btn bg-primary-300" on:click={back}>Zurück</button>
		</div>
	</div>
{:else}
	<h1>History only available as admin</h1>
{/if}
