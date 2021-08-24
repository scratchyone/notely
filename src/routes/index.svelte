<script>
	import { browser } from '$app/env';
	import debounce from 'debounce';
	import { data } from '$lib/store';
	import Toolbar from '$lib/toolbar.svelte';
	let textarea;
	$: {
		if ($data == '' && textarea) textarea.placeholder = 'Start typing...';
		else if (textarea) textarea.placeholder = '';
	}
	const debounced = debounce((text) => {
		if (browser) localStorage.setItem('text', text);
	}, 500);
	data.subscribe(debounced);
</script>

<svelte:window
	on:beforeunload={() => {
		debounced.flush();
	}}
/>
{#if browser}
	<!-- svelte-ignore a11y-autofocus -->
	<textarea
		id="textarea"
		contenteditable="true"
		bind:value={$data}
		bind:this={textarea}
		autofocus
	/>
{/if}
<noscript> JavaScript is required to use this app. </noscript>

<style>
	#textarea {
		min-width: 100vw;
		min-height: 100vh;
		margin: 0px;
		padding: 20px;
		outline: none;
		font-size: 17px;
		font-family: 'system-ui';
		resize: none;
		box-sizing: border-box;
		border: none;
	}
	noscript {
		margin: 20px;
		font-size: 17px;
		font-family: 'system-ui';
		display: block;
	}
</style>
