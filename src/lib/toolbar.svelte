<script>
	import Fa from 'svelte-fa';
	import { faDownload } from '@fortawesome/free-solid-svg-icons';
	import { data } from '$lib/store';
</script>

<div class="wrapper"><div class="button"><Fa icon={faDownload} /></div></div>

<style>
	.wrapper {
		display: flex;
		gap: 10px;
		position: absolute;
		right: 10px;
		top: 10px;
		color: #505050;
	}
	.button {
		cursor: pointer;
	}
</style>
