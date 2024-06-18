import { credsStore } from '$lib/stores.js';
import { redirect } from '@sveltejs/kit';

export async function load({ url }) {
	let creds;
	let unsub = credsStore.subscribe((v) => (creds = v));
	unsub();
	if (creds == null) {
		if (url.pathname != '/login') {
			throw redirect(307, '/login?from=/members');
		}
	}
	return null;
}

export const ssr = false;
