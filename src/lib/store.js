import { browser } from '$app/env';
import { writable } from 'svelte/store';
export const data = writable((browser ? localStorage.getItem('text') : null) || '');
