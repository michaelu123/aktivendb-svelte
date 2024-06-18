<script>
	import { credsStore, membersState, teamsState } from '$lib/stores.js';
	import { getUserFromApi } from '$lib/load.js';
	import { onMount } from 'svelte';

	export let data;
	let memberChanges = 0;
	let memberNames = $membersState.memberNames;
	let teamNames = $teamsState.teamNames;
	let table = data.table;
	let id = data.id;
	let historyArr = data.history;
	let beginn = data.beginn;
	let ende = data.ende;
	let fetch = data.fetch;
	let lineNo = 0;
	let historyTxt = []; // historyTxt.push does not trigger reactivity
	let historyTxt2 = []; // historyTxt2 = historyTxt does!
	let historyArray = [];

	onMount(() => history());

	function back() {
		window.history.back();
	}

	async function history() {
		lineNo = 0;
		for (const event of historyArr) {
			let email = (await getUserFromApi(fetch, event.user_id)).email;
			explainHistory(event, email);
			lineNo++;
		}
		historyTxt2 = historyTxt;
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
</script>

{#if $credsStore && $credsStore.is_admin}
	{#if beginn}
		<h2 class="text-center p-2">Änderungsgeschichte {beginn} bis {ende}</h2>
	{:else if table == 'members'}
		<h2 class="text-center p-2">Änderungsgeschichte {memberName(id)}</h2>
	{:else}
		<h2 class="text-center p-2">Änderungsgeschichte {teamName(id)}</h2>
	{/if}
	<div class="card p-1">
		{#each historyTxt2 as line}
			{#if line.indent == 0}
				<p class="mb-0">{line.msg}</p>
			{:else}
				<p class="mb-0 ml-10">{line.msg}</p>
			{/if}
		{/each}
	</div>
	<div class="card p-1">
		<div class="flex my-10">
			<button class="btn bg-primary-300 mr-8" on:click={back}>Zurück</button>
		</div>
	</div>
{:else}
	<h1>History only available as admin</h1>
{/if}
