<script type="text/typescript">
	import { LogBit, setLogLevel, LOG_LEVELS } from 'logbit';
	import { browser } from '$app/env';
	import debounce from 'debounce';
	import { data } from '$lib/store';
	import Toolbar from '$lib/toolbar.svelte';
	import { TravelableStore } from '$lib/TravelableStore';
	import { parseMarkdown } from '$lib/parseMarkdown';
	import {
		getCaretData,
		getCaretPosition,
		setCaretPosition,
		getCaretEndPosition,
		setCaretPositionSE
	} from '$lib/caret';
	const log = new LogBit('MainUIHandler');
	if (typeof window !== 'undefined') {
		window['setLogLevel'] = setLogLevel;
		window['LOG_LEVELS'] = LOG_LEVELS;
	}
	if (browser && location.hostname != 'localhost') {
		setLogLevel(LOG_LEVELS.INFO);
	} else {
		setLogLevel(LOG_LEVELS.TRACE);
	}
	log.info('MainUIHandler initialized');
	import { onMount, tick } from 'svelte';
	let textarea;
	const debounced = debounce(async (text) => {
		if (browser) localStorage.setItem('text', text);
	}, 500);
	data.subscribe(debounced);
	function sanitizeHTML(unsafe) {
		return unsafe
			.replace(/&/g, '&amp;')
			.replace(/</g, '&lt;')
			.replace(/>/g, '&gt;')
			.replace(/"/g, '&quot;')
			.replace(/'/g, '&#039;');
	}
	function toCE(c: string): string {
		let m = sanitizeHTML(c);
		const parsed = parseMarkdown(m);
		log.debug(`Markdown AST: `, parsed);
		let mid = '';
		for (const item of parsed) {
			if (item.type === 'text') {
				mid += item.text;
			} else if (item.type === 'boldAndItalic') {
				mid += `<i><b><span class="dim">***</span>${item.text}<span class="dim">***</span></b></i>`;
			} else if (item.type === 'bold') {
				mid += `<b><span class="dim">**</span>${item.text}<span class="dim">**</span></b>`;
			} else if (item.type === 'italic') {
				mid += `<i><span class="dim">*</span>${item.text}<span class="dim">*</span></i>`;
			} else if (item.type === 'header') {
				mid += `<h${item.level}><span class="dim">${'#'.repeat(item.level)}</span>${item.text}</h${
					item.level
				}>`;
			} else if (item.type === 'listBullet') {
				mid += `•`;
			} else if (item.type === 'link') {
				mid += `<span class="link"><span class="dim">[</span>${item.text}<span class="dim">](</span>${item.url}<span class="dim">)</span></span>`;
			}
		}

		if (mid[mid.length - 1] === '\n') mid = mid + '\n';

		if (mid.length == 0) return '';
		log.trace(`Generated HTML: ${mid}`);
		return '<span>' + mid + '</span>';
	}
	async function triggerCharInsertOrOverwrite(c: string) {
		const start = getCaretPosition(textarea);
		const end = getCaretEndPosition(textarea);
		log.trace('Current caret position:', start, '-', end);
		$data = $data.slice(0, start) + c + $data.slice(end);
		textarea.innerHTML = toCE($data);
		setCaretPosition(getCaretData(textarea, start + c.length));
	}
	onMount(() => {
		if (browser && textarea && localStorage.getItem('text')) {
			textarea.innerHTML = toCE(localStorage.getItem('text'));
		}
	});
	const store = new TravelableStore<{ text: string; start: number; end: number }>(
		() => {
			return {
				text: $data,
				start: getCaretPosition(textarea),
				end: getCaretEndPosition(textarea)
			};
		},
		undefined,
		50
	);

	store.snapshot({
		text: $data,
		start: getCaretPosition(textarea),
		end: getCaretEndPosition(textarea)
	});
	function triggerChange() {
		store.snapshot({
			text: $data,
			start: getCaretPosition(textarea),
			end: getCaretEndPosition(textarea)
		});
	}
	const debouncedTriggerChange = debounce(triggerChange, 300, true);
	const debouncedTriggerChangeBS = debounce(triggerChange, 200, true);
	async function keydown(e: KeyboardEvent) {
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
				log.trace('Current caret position: ', start, '-', end);
				if (start === end) $data = $data.slice(0, start - 1) + $data.slice(end);
				else $data = $data.slice(0, start) + $data.slice(end);
				textarea.innerHTML = toCE($data);

				if (start === end) {
					log.trace('Moving caret to: ', start - 1);
					setCaretPosition(getCaretData(textarea, start - 1));
				} else {
					log.trace('Moving caret to: ', start);
					setCaretPosition(getCaretData(textarea, start));
				}
			}
		} else if (e.key == 'Meta' || e.key == 'Control' || e.key == 'Alt' || e.key == 'Shift') {
		} else if (
			e.key == 'ArrowLeft' ||
			e.key == 'ArrowRight' ||
			e.key == 'ArrowUp' ||
			e.key == 'ArrowDown'
		) {
		} else if (e.key == 'a' && (e.ctrlKey || e.metaKey)) {
		} else if (e.key == 'c' && (e.ctrlKey || e.metaKey)) {
		} else if (e.key == 'x' && (e.ctrlKey || e.metaKey)) {
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
			(e.key == 'z' && (e.ctrlKey || e.metaKey) && e.shiftKey) ||
			(e.key == 'y' && (e.ctrlKey || e.metaKey))
		) {
			e.preventDefault();
			debouncedTriggerChange.clear();
			debouncedTriggerChangeBS.clear();
			const p = store.redo();
			if (p) {
				$data = p.text;
				textarea.innerHTML = toCE(p.text);
				setCaretPositionSE(getCaretData(textarea, p.start), getCaretData(textarea, p.end));
			}
		} else if (e.key == 'z' && (e.ctrlKey || e.metaKey)) {
			e.preventDefault();
			debouncedTriggerChange.flush();
			debouncedTriggerChangeBS.flush();
			const p = store.undo();
			if (p) {
				$data = p.text;
				textarea.innerHTML = toCE(p.text);
				setCaretPositionSE(getCaretData(textarea, p.start), getCaretData(textarea, p.end));
			}
		} else if (e.key == 'v' && (e.ctrlKey || e.metaKey)) {
			e.preventDefault();
			triggerChange();
			const text = await navigator.clipboard.readText();
			await triggerCharInsertOrOverwrite(text);
		} else {
			e.preventDefault();
			debouncedTriggerChange();
			await triggerCharInsertOrOverwrite(e.key);
		}
	}
	function keyup(e: KeyboardEvent) {}
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
		white-space: pre-wrap;
		overflow-wrap: break-word;
		word-break: break-word;
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
		position: fixed;
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
	#textarea:global .dim {
		opacity: 30%;
	}
	#textarea:global .link {
		text-decoration: underline;
		text-decoration-color: rgba(0, 0, 0, 0.4);
	}
	@media (prefers-color-scheme: dark) {
		#textarea:global .link {
			text-decoration-color: rgba(255, 255, 255, 0.4);
		}
	}
</style>
