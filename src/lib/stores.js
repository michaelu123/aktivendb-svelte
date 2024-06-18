// import { writable } from 'svelte/store';
import { persisted } from 'svelte-persisted-store';

export let credsStore = persisted('creds', { is_admin: false });
export let membersState = persisted('members', {
	mustBeActive: true,
	withDetails: true,
	search: '',
	members: null,
	member: null,
	memberNames: null,
	page: 0,
	limit: 10
});
export let teamsState = persisted('teams', {
	withDetails: true,
	search: '',
	teams: null,
	teamNames: null,
	team: null,
	page: 0,
	limit: 10
});
