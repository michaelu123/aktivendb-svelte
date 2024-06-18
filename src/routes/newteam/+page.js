// @ts-nocheck

/** @type {import('./$types').PageLoad} */

export async function load({ fetch, params }) {
	let team = { id: null, with_details: true };
	return { team: team, fetch: fetch, params: params };
}
