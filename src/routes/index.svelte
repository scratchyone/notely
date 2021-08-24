<script type="text/typescript">
	import { browser } from '$app/env';
	import debounce from 'debounce';
	import { data } from '$lib/store';
	import Toolbar from '$lib/toolbar.svelte';
	import {
		getCaretData,
		getCaretPosition,
		setCaretPosition,
		getCaretEndPosition,
		setCaretPositionSE
	} from '$lib/caret';
	import { onMount, tick } from 'svelte';
	let textarea;
	const debounced = debounce(async (text) => {
		if (browser) localStorage.setItem('text', text);
	}, 500);
	data.subscribe(debounced);
	function toCE(c: string): string {
		let mid = c;
		if (mid[mid.length - 1] === '\n') mid = mid + '\n';
		if (mid.length == 0) return '';
		mid = mid.replaceAll(/^###### (.*)$/gm, '<h6>###### $1</h6>');
		mid = mid.replaceAll(/^##### (.*)$/gm, '<h5>##### $1</h5>');
		mid = mid.replaceAll(/^#### (.*)$/gm, '<h4>#### $1</h4>');
		mid = mid.replaceAll(/^### (.*)$/gm, '<h3>### $1</h3>');
		mid = mid.replaceAll(/^## (.*)$/gm, '<h2>## $1</h2>');
		mid = mid.replaceAll(/^# (.*)$/gm, '<h1># $1</h1>');
		mid = mid.replaceAll(/\*\*(.*)\*\*/gm, '<b>**$1**</b>');
		mid = mid.replaceAll(/\*(.*)\*/gm, '<i>*$1*</i>');
		mid = mid.replaceAll(/__(.*)__/gm, '<b>__$1__</b>');
		mid = mid.replaceAll(/_(.*)_/gm, '<i>_$1_</i>');
		mid = mid.replaceAll(/^\* (.*)$/gm, '• $1');
		mid = mid.replaceAll(/^- (.*)$/gm, '• $1');

		return '<span>' + mid + '</span>';
	}
	async function triggerCharInsertOrOverwrite(c: string) {
		const start = getCaretPosition(textarea);
		const end = getCaretEndPosition(textarea);
		$data = $data.slice(0, start) + c + $data.slice(end);
		textarea.innerHTML = toCE($data);
		setCaretPosition(getCaretData(textarea, start + c.length));
	}
	onMount(() => {
		if (browser && textarea && localStorage.getItem('text')) {
			textarea.innerHTML = toCE(localStorage.getItem('text'));
		}
	});
	const prev_text = [];
	const prev_cursor_positions = [];
	let next_text = [];
	let next_cursor_positions = [];
	const down_keys = [];
	function triggerChange() {
		console.log('Undo stack: ' + prev_text);
		prev_text.push($data);
		next_text = [];
		next_cursor_positions = [];
		prev_cursor_positions.push({
			start: getCaretPosition(textarea),
			end: getCaretEndPosition(textarea)
		});
	}
	const debouncedTriggerChange = debounce(triggerChange, 300, true);
	const debouncedTriggerChangeBS = debounce(triggerChange, 200, true);
	async function keydown(e: KeyboardEvent) {
		down_keys.push(e.key);
		if (e.key === 'Enter') {
			e.preventDefault();
			triggerChange();
			await triggerCharInsertOrOverwrite('\n');
		} else if (e.key === 'Backspace') {
			e.preventDefault();
			if (!(getCaretPosition(textarea) == 0 && getCaretEndPosition(textarea) == 0)) {
				debouncedTriggerChangeBS();
				const start = getCaretPosition(textarea);
				const end = getCaretEndPosition(textarea);
				console.log(start, '-', end);
				if (start === end) $data = $data.slice(0, start - 1) + $data.slice(end);
				else $data = $data.slice(0, start) + $data.slice(end);
				textarea.innerHTML = toCE($data);
				console.log('Going to: ', start - 1);
				if (start === end) setCaretPosition(getCaretData(textarea, start - 1));
				else setCaretPosition(getCaretData(textarea, start));
			}
		} else if (e.key == 'Meta' || e.key == 'Control' || e.key == 'Alt' || e.key == 'Shift') {
		} else if (
			e.key == 'ArrowLeft' ||
			e.key == 'ArrowRight' ||
			e.key == 'ArrowUp' ||
			e.key == 'ArrowDown'
		) {
		} else if (e.key == 'a' && (down_keys.includes('Control') || down_keys.includes('Meta'))) {
		} else if (e.key == 'c' && (down_keys.includes('Control') || down_keys.includes('Meta'))) {
		} else if (e.key == 'x' && (down_keys.includes('Control') || down_keys.includes('Meta'))) {
			e.preventDefault();
			triggerChange();
			const start = getCaretPosition(textarea);
			const end = getCaretEndPosition(textarea);
			const text = $data.slice(start, end);
			navigator.clipboard.writeText(text);
			$data = $data.slice(0, start) + $data.slice(end);
			textarea.innerHTML = toCE($data);
			setCaretPosition(getCaretData(textarea, start));
		} else if (
			(e.key == 'z' &&
				(down_keys.includes('Control') || down_keys.includes('Meta')) &&
				down_keys.includes('Shift')) ||
			(e.key == 'y' && (down_keys.includes('Control') || down_keys.includes('Meta')))
		) {
			e.preventDefault();
			debouncedTriggerChange.clear();
			debouncedTriggerChangeBS.clear();
			if (next_text.length > 0) {
				let p = next_text.pop();
				let pos = next_cursor_positions.pop();
				prev_text.push(p);
				prev_cursor_positions.push(pos);

				while (p == $data) {
					p = next_text.pop();
					pos = next_cursor_positions.pop();
					prev_text.push(p);
					prev_cursor_positions.push(pos);
				}
				if (p != undefined) {
					console.log('Redo: ' + p);
					$data = p;
					textarea.innerHTML = toCE(p);
					setCaretPositionSE(getCaretData(textarea, pos.start), getCaretData(textarea, pos.end));
				}
			} else {
				console.warn('Nothing to redo');
			}
		} else if (e.key == 'z' && (down_keys.includes('Control') || down_keys.includes('Meta'))) {
			e.preventDefault();
			debouncedTriggerChange.flush();
			debouncedTriggerChangeBS.flush();
			if (prev_text.length > 0) {
				let p = prev_text.pop();
				let pos = prev_cursor_positions.pop();

				while (p == $data) {
					p = prev_text.pop();
					pos = prev_cursor_positions.pop();
				}
				if (p != undefined) {
					next_text.push($data);
					next_cursor_positions.push({
						start: getCaretPosition(textarea),
						end: getCaretEndPosition(textarea)
					});
					console.log('Undo: ' + p);
					$data = p;
					textarea.innerHTML = toCE(p);
					setCaretPositionSE(getCaretData(textarea, pos.start), getCaretData(textarea, pos.end));
				}
			} else {
				console.warn('Nothing to undo');
			}
			console.log('Redo stack: ' + next_text);
		} else if (e.key == 'v' && (down_keys.includes('Control') || down_keys.includes('Meta'))) {
			e.preventDefault();
			triggerChange();
			const text = await navigator.clipboard.readText();
			await triggerCharInsertOrOverwrite(text);
		} else {
			e.preventDefault();
			debouncedTriggerChange();
			await triggerCharInsertOrOverwrite(e.key);
		}
		//console.log(e.key);
	}
	function keyup(e: KeyboardEvent) {
		down_keys.splice(down_keys.indexOf(e.key), 1);
	}
	async function cut(e: ClipboardEvent) {
		e.preventDefault();
		triggerChange();
		const start = getCaretPosition(textarea);
		const end = getCaretEndPosition(textarea);
		const text = $data.slice(start, end);
		navigator.clipboard.writeText(text);
		$data = $data.slice(0, start) + $data.slice(end);
		textarea.innerHTML = toCE($data);
		setCaretPosition(getCaretData(textarea, start));
	}
	async function paste(e: ClipboardEvent) {
		e.preventDefault();
		triggerChange();
		const text = await navigator.clipboard.readText();
		await triggerCharInsertOrOverwrite(text);
	}
</script>

<svelte:window
	on:beforeunload={() => {
		debounced.flush();
	}}
/>
{#if browser}
	<!-- svelte-ignore a11y-autofocus -->
	<div
		id="textarea"
		contenteditable="true"
		bind:this={textarea}
		on:keydown={keydown}
		on:keyup={keyup}
		on:cut={cut}
		on:paste={paste}
		autofocus
		placeholder="Start typing markdown..."
	/>
{/if}
<a class="statement" href="https://svelte.dev" target="_blank">Notely is powered by Svelte</a>
<noscript> JavaScript is required to use this app. </noscript>
<title>Notely</title>

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
		white-space: pre;
	}
	[contenteditable='true']:empty:before {
		content: attr(placeholder);
		pointer-events: none;
		display: block;
		color: grey;
	}

	noscript {
		margin: 20px;
		font-size: 17px;
		font-family: 'system-ui';
		display: block;
	}
	.statement {
		font-size: 15px;
		color: #999;
		position: absolute;
		bottom: 10px;
		text-align: center;
		font-family: 'system-ui';
		left: 0px;
		right: 0px;
		text-decoration: underline;
	}
	@media (prefers-color-scheme: dark) {
		#textarea {
			background-color: #2a2a2a;
			color: #fff;
		}
	}
	#textarea:global h1,
	#textarea:global h2,
	#textarea:global h3,
	#textarea:global h4,
	#textarea:global h5,
	#textarea:global h6 {
		margin: 0px;
		margin-bottom: 10px;
		display: inline-block;
	}
</style>
