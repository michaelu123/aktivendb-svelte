// @ts-nocheck

/** @type {import('./$types').PageLoad} */

export async function load({ fetch, params }) {
	let member = { id: null, gender: '', active: true, with_details: true };
	return { member: member, fetch: fetch, params: params };
}
