import { writable } from 'svelte/store';
import { browser } from '$app/environment';

export const currentVar = writable<string>('aprobacion');

const stored = browser ? localStorage.getItem('fixtureResults') : null;
export const fixtureResults = writable<Record<string, string>>(stored ? JSON.parse(stored) : {});

if (browser) {
	fixtureResults.subscribe((v) => localStorage.setItem('fixtureResults', JSON.stringify(v)));
}
