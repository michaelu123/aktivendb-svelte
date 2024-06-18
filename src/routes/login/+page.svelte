<script>
	/** @type {import('./$types').PageData} */
	export let data;
	let fetch = data.fetch;
	import { navigating } from '$app/stores';
	import { ProgressBar } from '@skeletonlabs/skeleton';
	import { credsStore, membersState, teamsState } from '$lib/stores.js';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { loadAll } from '$lib/load.js';

	const url = 'https://aktivendb.adfc-muenchen.de';
	const urlLogin = url + '/auth/login';
	const hdrs = {
		'Content-Type': 'application/json',
		Accept: 'application/json, text/plain, */*',
		Authorization: 'Bearer undefined'
	};
	let email;
	let password;
	let error;
	let loading;

	async function login() {
		let from = $page.url.search || ''; // from where we redirected to login

		let body = JSON.stringify({ email: email, password: password });

		const resp1 = await fetch(urlLogin, {
			method: 'POST',
			headers: hdrs,
			body: body
		});
		const res1 = await resp1.json();
		if (!resp1.ok) {
			error = res1.error;
			return;
		}
		error = null;

		credsStore.set({
			token: res1.token,
			is_admin: res1.user.is_admin,
			email: email,
			url: url,
			hdrs: hdrs
		});
		let nextPage = '/members';
		if (from.startsWith('?from=')) {
			nextPage = from.substring(6);
		}
		loading = true;
		const res2 = await loadAll(fetch);
		loading = false;
		$membersState.members = res2.members;
		$membersState.memberNames = res2.memberNames;
		$teamsState.teams = res2.teams;
		$teamsState.teamNames = res2.teamNames;
		await goto(nextPage, { replaceState: true });
	}
</script>

<svelte:head><title>AktivenDB Login</title></svelte:head>

<main class="debug-screens">
	{#if $navigating || loading}
		<ProgressBar />
	{:else}
		<div class="card card-body">
			<h1>Login</h1>
			<form on:submit|preventDefault>
				<label for="email" class="my-5">
					<span>Email</span>
					<input type="email" id="email" bind:value={email} />
				</label>
				<label for="password">
					<span>Passwort</span>
					<input type="password" id="password" bind:value={password} />
				</label>
				{#if error}
					<p class="mt-8 bg-red-200">{error}</p>
				{/if}
				<button type="submit" class="mt-8 btn bg-primary-300" on:click={login}>Einloggen</button>
			</form>
		</div>
	{/if}
</main>
