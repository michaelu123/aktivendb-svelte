import { redirect } from '@sveltejs/kit';
import { credsStore } from '$lib/stores.js';

function getCreds() {
	let creds;
	let unsub = credsStore.subscribe((v) => (creds = v));
	unsub();
	if (creds == null) {
		throw redirect(307, '/login?from=/members');
	}
	return creds;
}

function relogin(resp) {
	// we get no clear indication from the backend that the token has expired...
	if (resp.status >= 400) {
		credsStore.set(null);
		throw redirect(307, '/login');
	}
}

export let memberNames = {};
export let teamNames = {
	// deleted records not fetched from API call
	22: 'AG Radfahrschule',
	29: 'AG Leitungen',
	30: 'Test AG',
	31: 'Test',
	32: 'Test',
	33: 'Test ML',
	34: 'AG Tagestouren',
	36: 'test',
	37: 'Test',
	38: 'Test',
	44: 'Test',
	63: 'TEST2',
	64: 'OG Ismaning Test'
};

export async function loadAll(fetch) {
	let creds = getCreds();
	const baseUrl = creds.url;

	const urlM = baseUrl + '/api/members?token=';
	const respM = await fetch(urlM + creds.token, {
		method: 'GET',
		headers: creds.hdrs
	});
	relogin(respM);
	const members = await respM.json();
	for (let member of members) {
		for (let key of Object.keys(member)) {
			if (member[key] == null) {
				member[key] = '';
			}
		}
		memberNames[member.id.toString()] = member.last_name + ', ' + member.first_name;
	}

	const urlT = baseUrl + '/api/project-teams?token=';
	const respT = await fetch(urlT + creds.token, {
		method: 'GET',
		headers: creds.hdrs
	});
	relogin(respT);
	const teams = await respT.json();
	for (let team of teams) {
		for (let key of Object.keys(team)) {
			if (team[key] == null) {
				team[key] = '';
			}
		}
		teamNames[team.id.toString()] = team.name;
	}
	return {
		members,
		teams,
		memberNames,
		teamNames
	};
}

export async function loadMember(fetch, id) {
	let creds = getCreds();
	const baseUrl = creds.url;
	const url = baseUrl + '/api/member/' + id + '?token=' + creds.token;

	const resp = await fetch(url, {
		method: 'GET',
		headers: creds.hdrs
	});
	relogin(resp);
	const member = await resp.json();
	for (let key of Object.keys(member)) {
		if (member[key] == null || member[key] == 'undef@undef.de') {
			member[key] = '';
		}
	}
	return member;
}

export async function loadTeam(fetch, id) {
	let creds = getCreds();
	const baseUrl = creds.url;
	const url = baseUrl + '/api/project-team/' + id + '?token=' + creds.token;

	const resp = await fetch(url, {
		method: 'GET',
		headers: creds.hdrs
	});
	relogin(resp);
	const team = await resp.json();
	for (let key of Object.keys(team)) {
		if (team[key] == null || team[key] == 'undef@undef.de') {
			team[key] = '';
		}
	}
	return team;
}

const omitMemberFields = ['id', 'updated_at', 'user', 'with_details', 'with_detals'];
export async function storeMember(method, member) {
	let creds = getCreds();
	const baseUrl = creds.url;
	let m = { ...member };

	let url = baseUrl + '/api/member';
	if (method == 'PUT') {
		url += '/' + m.id;
	}
	url += '?token=' + creds.token;
	for (let key of Object.keys(member)) {
		if (m[key] == '') {
			m[key] = null;
		}
	}
	m['name'] = m.last_name + ', ' + m.first_name;
	for (let key of omitMemberFields) {
		delete m[key];
	}
	const resp = await fetch(url, {
		method: method,
		headers: creds.hdrs,
		body: JSON.stringify(m)
	});
	relogin(resp);
	const res = await resp.json();
	return res.id;
}

export async function deleteMember(id) {
	let creds = getCreds();
	const baseUrl = creds.url;

	let url = baseUrl + '/api/member/' + id + '?token=' + creds.token;
	const resp = await fetch(url, {
		method: 'DELETE',
		headers: creds.hdrs
	});
	relogin(resp);
}

const omitTeamFields = ['id', 'updated_at', 'with_details', 'with_detals'];
export async function storeTeam(method, team) {
	let creds = getCreds();
	const baseUrl = creds.url;
	let t = { ...team };

	let url = baseUrl + '/api/project-team';
	if (method == 'PUT') {
		url += '/' + t.id;
	}
	url += '?token=' + creds.token;
	for (let key of Object.keys(team)) {
		if (t[key] == '') {
			t[key] = null;
		}
	}
	for (let key of omitTeamFields) {
		delete t[key];
	}
	const resp = await fetch(url, {
		method: method,
		headers: creds.hdrs,
		body: JSON.stringify(t)
	});
	relogin(resp);
	const res = await resp.json();
	return res.id;
}

export async function deleteTeam(id) {
	let creds = getCreds();
	const baseUrl = creds.url;

	let url = baseUrl + '/api/project-team/' + id + '?token=' + creds.token;
	const resp = await fetch(url, {
		method: 'DELETE',
		headers: creds.hdrs
	});
	relogin(resp);
}

export async function storeRelation(method, relation) {
	let creds = getCreds();
	const baseUrl = creds.url;

	let url = baseUrl + '/api/project-team-member';
	if (method == 'PUT') {
		url += '/' + relation.id;
	}
	url += '?token=' + creds.token;
	let roleId = 0;
	if (relation.role == 'Mitglied') roleId = 2;
	else if (relation.role == 'Vorsitz') roleId = 1;
	else if (relation.role == 'Formales Mitglied') roleId = 3;
	const r = {
		admin_comments: relation.desc,
		member_id: relation.memberId,
		member_role_id: roleId,
		member_role_title: relation.role,
		project_team_id: relation.teamId
	};
	const resp = await fetch(url, {
		method: method,
		headers: creds.hdrs,
		body: JSON.stringify(r)
	});
	relogin(resp);
	const res = await resp.json();
	return res.id;
}

export async function deleteRelation(id) {
	let creds = getCreds();
	const baseUrl = creds.url;

	let url = baseUrl + '/api/project-team-member/' + id + '?token=' + creds.token;
	const resp = await fetch(url, {
		method: 'DELETE',
		headers: creds.hdrs
	});
	relogin(resp);
}

function parse(data) {
	if (typeof data.record_new !== 'string') return data;
	try {
		data.record_new = JSON.parse(data.record_new);
		data.record_old = JSON.parse(data.record_old);
		for (const prop in data) {
			if (prop.endsWith('_id')) {
				data[prop] = data[prop].toString();
			}
		}
		for (const prop in data.record_new) {
			if (prop.endsWith('_id')) {
				data.record_new[prop] = data.record_new[prop].toString();
			}
		}
		for (const prop in data.record_old) {
			if (prop.endsWith('_id')) {
				data.record_old[prop] = data.record_old[prop].toString();
			}
		}
		// eslint-disable-next-line no-empty, no-unused-vars
	} catch (e) {}
	return data;
}

import hist from '$lib/history.json';
export async function loadHistoryRange(fetch, beginn, ende) {
	let histArr = hist[2].data;
	let res = [];
	for (let histRow of histArr) {
		const updated = histRow.updated_at;
		if (updated >= beginn && updated <= ende) {
			let event = parse(histRow);
			res.push(event);
		}
	}
	return res;
}

export async function loadHistory(fetch, table, id) {
	let creds = getCreds();
	const baseUrl = creds.url;
	const url = baseUrl + '/api/history/' + table + '/' + id + '?token=' + creds.token;

	const resp = await fetch(url, {
		method: 'GET',
		headers: creds.hdrs
	});
	relogin(resp);
	let histArr = await resp.json();
	for (let i in histArr) {
		histArr[i] = parse(histArr[i]);
	}
	return histArr;
}

let users = {};
export async function getUserFromApi(fetch, id) {
	let creds = getCreds();
	const baseUrl = creds.url;
	const url = baseUrl + '/api/user/' + id + '?token=' + creds.token;

	id = id.toString();
	let user = users[id];
	if (user != null) return user;
	const resp = await fetch(url, {
		method: 'GET',
		headers: creds.hdrs
	});
	relogin(resp);
	user = await resp.json();
	users[id] = user;
	return user;
}
