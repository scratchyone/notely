<script>
	import { browser } from '$app/env';
	import { tick } from 'svelte';
	import { getCaretPosition, getCaretData, setCaretPosition } from '$lib/carets';
	let html = '<span class="placeholder">Start typing...</span>';
	let textarea;
	let text = '';
	async function keypress(e) {
		await tick();
		text = textarea.innerText;
		let pos = getCaretPosition(textarea);
		console.log(text);
		html = text;
		await tick();
		console.log(pos);
		let data = getCaretData(textarea, pos + 1);
		setCaretPosition(data);
	}
</script>

<pre
	id="textarea"
	contenteditable="true"
	on:keypress={keypress}
	bind:this={textarea}
	bind:innerHTML={html}
/>

<style>
	#textarea {
		min-width: 100vw;
		min-height: 100vh;
		margin: 0px;
		padding: 20px;
		outline: none;
		font-size: 17px;
		font-family: 'system-ui';
	}
</style>
