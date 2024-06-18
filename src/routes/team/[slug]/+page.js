// @ts-nocheck

/** @type {import('./$types').PageLoad} */
import { loadTeam } from '$lib/load.js';

export async function load({ fetch, params }) {
	const id = +params.slug;
	const team = await loadTeam(fetch, id);
	return { team: team, fetch: fetch, params: params };
}
