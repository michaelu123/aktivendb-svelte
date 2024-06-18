// @ts-nocheck

/** @type {import('./$types').PageLoad} */
import { loadMember } from '$lib/load.js';

export async function load({ fetch, params }) {
	const id = +params.slug;
	const member = await loadMember(fetch, id);
	return { member: member, fetch: fetch, params: params };
}
