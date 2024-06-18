<script>
	import '../app.postcss';
	import { AppShell, AppBar, LightSwitch } from '@skeletonlabs/skeleton';
	/** @type {import('./$types').PageLoad} */
	import { credsStore } from '$lib/stores.js';
	import { goto } from '$app/navigation';

	function logout() {
		credsStore.set(null);
		goto('/', { invalidateAll: true });
	}
	function login() {
		credsStore.set(null);
		goto('/login', { invalidateAll: true });
	}
	let theme = 'wintry';
	$: document.body.setAttribute('data-theme', theme);
</script>

<AppShell slotSidebarLeft="bg-surface-500/5 w-56 p-4">
	<!-- Header -->
	<svelte:fragment slot="header">
		<!-- Insert the App Bar: -->
		<AppBar>
			<svelte:fragment slot="lead">
				<h1>AktivenDB</h1>
			</svelte:fragment>
			<svelte:fragment slot="trail">
				<ul class="flex flex-wrap items-center">
					{#if $credsStore && $credsStore.token}
						<li><a class="mx-2 text-lg bg-primary-300 btn" href="/members">Mitglieder</a></li>
						<li><a class="mx-2 text-lg btn bg-primary-300" href="/teams">Teams</a></li>
						{#if $credsStore.is_admin}
							<li>
								<a class="mx-2 text-lg btn bg-primary-300" href="/history">Geschichte</a>
							</li>
						{/if}
					{/if}
					<li>
						{#if !$credsStore || !$credsStore.token}
							<button class="mx-2 text-lg btn bg-primary-300" on:click={login}>Login</button>
						{:else}
							<button class="mx-2 text-lg btn bg-primary-300" on:click={logout}>Logout</button>
						{/if}
					</li>
					<li>
						<label class="m-2">
							<span class="mr-1 text-lg">Theme:</span>
							<select class="form-select bg-primary-300" bind:value={theme}>
								<option value="skeleton">Skeleton</option>
								<option value="modern">Modern</option>
								<option value="seafoam">Seafoam</option>
								<option value="sahara">Sahara</option>
								<option value="gold-nouveau">Gold-Nouveau</option>
								<option value="wintry">Wintry</option>
								<option value="rocket">Rocket</option>
								<option value="vintage">Vintage</option>
								<option value="hamlindigo">Hamlindigo</option>
								<option value="crimson">Crimson</option>
							</select>
						</label>
					</li>
					<li><LightSwitch /></li>
				</ul>
			</svelte:fragment>
		</AppBar>
	</svelte:fragment>
	<!-- Page Content Slot -->
	<slot />
</AppShell>
