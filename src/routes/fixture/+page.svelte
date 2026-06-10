<script lang="ts">
	import { onMount } from 'svelte';
	import { fixtureResults } from '$lib/stores';
	import { COUNTRIES } from '$lib/data';
	import { supabase } from '$lib/supabase';

	interface MatchRow {
		id: string;
		match_number: number;
		kickoff_time: string;
		team_home: string;
		team_away: string;
		group_name: string;
		venue: string | null;
	}

	const PRODE_GROUPS = ['A', 'B', 'C', 'J'];

	let matchesByGroup: Record<string, MatchRow[]> = {};
	let loading = true;

	function formatDate(iso: string): string {
		return new Date(iso).toLocaleString('es-AR', {
			timeZone: 'America/Argentina/Buenos_Aires',
			day: 'numeric', month: 'short'
		});
	}

	function formatTime(iso: string): string {
		return new Date(iso).toLocaleString('es-AR', {
			timeZone: 'America/Argentina/Buenos_Aires',
			hour: '2-digit', minute: '2-digit', hour12: false
		});
	}

	function matchKey(m: MatchRow) { return String(m.match_number); }

	onMount(async () => {
		const { data } = await supabase
			.from('matches')
			.select('id, match_number, kickoff_time, team_home, team_away, group_name, venue')
			.eq('phase', 'groups')
			.in('group_name', PRODE_GROUPS)
			.order('kickoff_time');

		const matches = (data ?? []) as MatchRow[];
		const grouped: Record<string, MatchRow[]> = {};
		for (const m of matches) {
			if (!grouped[m.group_name]) grouped[m.group_name] = [];
			grouped[m.group_name].push(m);
		}
		matchesByGroup = grouped;
		loading = false;
	});

	function team(code: string) {
		return COUNTRIES[code as keyof typeof COUNTRIES] ?? { flag: '🏳', name: code };
	}

	function shareFixture() {
		const picks = Object.values($fixtureResults)
			.map((code) => `${team(code)?.flag} ${team(code)?.name}`)
			.join(', ');
		const text = picks ? `Mi fixture del Mundial 2026: ${picks}` : 'Armé mi fixture del Mundial 2026 con Cíclico';
		const url = window.location.href;
		if (navigator.share) {
			navigator.share({ title: 'Cíclico · El Mundial de los Datos', text, url }).catch(() => {});
		} else {
			window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text + ' ' + url)}`, '_blank');
		}
	}
</script>

<div class="section">
	<div class="section-hero-label">Bracket interactivo</div>
	<div class="section-title">Simulador de Fixture</div>
	<div class="section-subtitle">Hacé clic en el equipo que creés que gana cada partido. Se muestran los grupos A, B, C y J.</div>

	{#if loading}
		<div class="loading">Cargando partidos…</div>
	{:else}
	<div class="fixture-groups">
		{#each PRODE_GROUPS as gk}
			{@const groupMatches = matchesByGroup[gk] ?? []}
			<div class="fixture-group">
				<div class="fixture-group-header">
					<span class="group-label">GRUPO {gk}</span>
				</div>
				{#each groupMatches as m}
					{@const hc = team(m.team_home)}
					{@const ac = team(m.team_away)}
					{@const res = $fixtureResults[matchKey(m)]}
					<div class="fixture-match">
						<div class="fixture-date">{formatDate(m.kickoff_time)} · {formatTime(m.kickoff_time)} hs</div>
						<div class="fixture-match-teams">
							<button
								class="fixture-team-btn"
								class:winner={res === m.team_home}
								class:loser={res && res !== m.team_home}
								on:click={() => fixtureResults.update((r) => ({ ...r, [matchKey(m)]: m.team_home }))}
							>{hc.flag} {hc.name}</button>
							<span class="fixture-vs">vs</span>
							<button
								class="fixture-team-btn"
								class:winner={res === m.team_away}
								class:loser={res && res !== m.team_away}
								on:click={() => fixtureResults.update((r) => ({ ...r, [matchKey(m)]: m.team_away }))}
							>{ac.flag} {ac.name}</button>
						</div>
					</div>
				{/each}
			</div>
		{/each}
	</div>
	{/if}

	<div style="margin-top:24px;text-align:center;">
		<button class="share-btn" on:click={shareFixture}>
			<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92s2.92-1.31 2.92-2.92-1.31-2.92-2.92-2.92z"/></svg>
			Compartir mi fixture
		</button>
		<button class="share-btn" on:click={() => fixtureResults.set({})} style="margin-left:8px;">Reiniciar</button>
	</div>
	<p class="nota">Se muestran los grupos A, B, C y J. Los grupos D–L serán incorporados próximamente.</p>
</div>

<style>
	.fixture-groups { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; }
	.fixture-group { background: var(--bg-card); border: 1px solid var(--border); border-radius: 12px; overflow: hidden; }
	.fixture-group-header { background: var(--bg-card2); padding: 10px 16px; border-bottom: 1px solid var(--border); }
	.group-label { font-family: 'Inter', monospace; font-size: 10px; letter-spacing: 0.12em; text-transform: uppercase; color: var(--celeste); }
	.fixture-match { padding: 12px 16px; border-bottom: 1px solid var(--border); }
	.fixture-match:last-child { border-bottom: none; }
	.fixture-match-teams { display: flex; gap: 8px; align-items: center; }
	.fixture-team-btn {
		flex: 1; padding: 8px 10px; border-radius: 8px; border: 1px solid var(--border);
		background: var(--bg-card2); color: var(--text);
		font-family: 'Instrument Sans', sans-serif; font-size: 13px; font-weight: 600;
		cursor: pointer; transition: all 0.2s; text-align: center;
	}
	.fixture-team-btn:hover { border-color: var(--celeste); }
	.fixture-team-btn.winner { background: rgba(91, 155, 213, 0.15); border-color: var(--celeste); color: var(--celeste); }
	.fixture-team-btn.loser { opacity: 0.35; }
	.fixture-vs { font-family: 'Inter', monospace; font-size: 10px; color: var(--muted); flex-shrink: 0; }
	.fixture-date { font-family: 'Inter', monospace; font-size: 10px; color: var(--muted); margin-bottom: 6px; }
	.loading { text-align: center; padding: 40px; color: var(--muted); font-family: 'DM Mono', monospace; font-size: 13px; }
	@media (max-width: 900px) { .fixture-groups { grid-template-columns: 1fr; } }
</style>
