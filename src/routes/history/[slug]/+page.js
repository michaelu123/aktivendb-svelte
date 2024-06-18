// @ts-nocheck

/** @type {import('./$types').PageLoad} */
import { loadHistory, loadHistoryRange } from '$lib/load.js';

export async function load({ fetch, params }) {
	let slug = params.slug;
	let table, id, history, beginn, ende;
	if (slug.indexOf(':') > 0) {
		beginn = slug.substring(0, 10);
		ende = slug.substring(11, 21);
		history = await loadHistoryRange(fetch, beginn, ende);
	} else {
		if (slug.startsWith('team=')) {
			id = +slug.substring(5);
			table = 'project_teams';
		} else if (slug.startsWith('member=')) {
			id = +slug.substring(7);
			table = 'members';
		} else {
			table = 'members';
			id = +slug;
		}
		history = await loadHistory(fetch, table, id);
	}
	// return { history: history, fetch: fetch, params: params };
	return { history, table, id, beginn, ende, fetch };
}
