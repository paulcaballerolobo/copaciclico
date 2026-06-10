<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { supabase } from '$lib/supabase';

	interface MatchRow {
		id: string;
		match_number: number;
		match_label: string;
		phase: string;
		group_name: string | null;
		kickoff_time: string;
		team_home: string;
		team_away: string;
		venue: string | null;
		status: string;
	}

	interface TeamRow {
		code: string;
		name: string;
		flag: string;
	}

	let matches: MatchRow[] = [];
	let teams: Record<string, TeamRow> = {};
	let loading = true;
	let activeGroup = 'all';
	let interval: ReturnType<typeof setInterval> | null = null;
	let nextArg: MatchRow | null = null;
	let countdown = { d: 0, h: 0, m: 0, s: 0 };
	let argFinished = false;

	const GROUPS = ['A','B','C','D','E','F','G','H','I','J','K','L'];

	function toART(iso: string): Date {
		return new Date(new Date(iso).toLocaleString('en-US', { timeZone: 'America/Argentina/Buenos_Aires' }));
	}

	function formatDate(iso: string): string {
		const d = new Date(iso);
		return d.toLocaleString('es-AR', {
			timeZone: 'America/Argentina/Buenos_Aires',
			day: 'numeric', month: 'short'
		});
	}

	function formatTime(iso: string): string {
		const d = new Date(iso);
		return d.toLocaleString('es-AR', {
			timeZone: 'America/Argentina/Buenos_Aires',
			hour: '2-digit', minute: '2-digit'
		});
	}

	function startCountdown() {
		if (interval) clearInterval(interval);
		const argMatches = matches
			.filter(m => m.team_home === 'ARG' || m.team_away === 'ARG')
			.filter(m => new Date(m.kickoff_time) > new Date())
			.sort((a, b) => new Date(a.kickoff_time).getTime() - new Date(b.kickoff_time).getTime());

		nextArg = argMatches[0] ?? null;

		if (!nextArg) {
			argFinished = true;
			return;
		}

		const tick = () => {
			if (!nextArg) return;
			const diff = new Date(nextArg.kickoff_time).getTime() - Date.now();
			if (diff <= 0) {
				argFinished = true;
				if (interval) clearInterval(interval);
				return;
			}
			countdown = {
				d: Math.floor(diff / 86_400_000),
				h: Math.floor((diff % 86_400_000) / 3_600_000),
				m: Math.floor((diff % 3_600_000) / 60_000),
				s: Math.floor((diff % 60_000) / 1_000)
			};
		};
		tick();
		interval = setInterval(tick, 1000);
	}

	onMount(async () => {
		const [{ data: matchData }, { data: teamData }] = await Promise.all([
			supabase.from('matches').select('id, match_number, match_label, phase, group_name, kickoff_time, team_home, team_away, venue, status').eq('phase', 'groups').order('kickoff_time'),
			supabase.from('teams').select('code, name, flag')
		]);

		matches = (matchData ?? []) as MatchRow[];
		teams = Object.fromEntries(((teamData ?? []) as TeamRow[]).map(t => [t.code, t]));
		loading = false;
		startCountdown();
	});

	onDestroy(() => { if (interval) clearInterval(interval); });

	$: filtered = activeGroup === 'all' ? matches : matches.filter(m => m.group_name === activeGroup);

	function teamName(code: string) { return teams[code]?.name ?? code; }
	function teamFlag(code: string) { return teams[code]?.flag ?? '🏳'; }
	function isArg(m: MatchRow) { return m.team_home === 'ARG' || m.team_away === 'ARG'; }
</script>

<div class="section">
	<div class="section-hero-label">Fase de grupos</div>
	<div class="section-title">Calendario</div>
	<div class="section-subtitle">72 partidos · Grupos A–L · Horarios en hora argentina (UTC-3)</div>

	<!-- Countdown Argentina -->
	<div class="countdown-box">
		<div class="countdown-label">Próximo partido de Argentina</div>
		{#if argFinished}
			<div class="countdown-done">¡Argentina terminó la fase de grupos!</div>
		{:else if nextArg}
			<div class="countdown-nums">
				{#each [{ n: countdown.d, l: 'días' }, { n: countdown.h, l: 'horas' }, { n: countdown.m, l: 'minutos' }, { n: countdown.s, l: 'segundos' }] as u}
					<div class="countdown-unit">
						<div class="countdown-num">{String(u.n).padStart(2, '0')}</div>
						<div class="countdown-unit-label">{u.l}</div>
					</div>
				{/each}
			</div>
			<div class="countdown-match">
				{teamFlag(nextArg.team_home)} {teamName(nextArg.team_home)} vs
				{teamFlag(nextArg.team_away)} {teamName(nextArg.team_away)}
				· {nextArg.venue}
			</div>
		{:else if loading}
			<div class="countdown-done">Cargando…</div>
		{/if}
	</div>

	<!-- Filtros -->
	<div class="calendar-filter">
		<button class="filter-btn" class:active={activeGroup === 'all'} on:click={() => activeGroup = 'all'}>Todos</button>
		{#each GROUPS as g}
			<button class="filter-btn" class:active={activeGroup === g} class:filter-arg={g === 'J'} on:click={() => activeGroup = g}>
				Grupo {g}{g === 'J' ? ' 🇦🇷' : ''}
			</button>
		{/each}
	</div>

	{#if loading}
		<div class="loading">Cargando partidos…</div>
	{:else}
		<div class="match-list">
			{#each filtered as m}
				<div class="match-item" class:argentina={isArg(m)}>
					<div class="match-date mono">{formatDate(m.kickoff_time)}<br />{formatTime(m.kickoff_time)} hs</div>
					<div class="match-group mono">Grupo {m.group_name}</div>
					<div class="match-teams">
						{teamFlag(m.team_home)} {teamName(m.team_home)}
						<span class="vs">vs</span>
						{teamFlag(m.team_away)} {teamName(m.team_away)}
					</div>
					{#if isArg(m)}<span class="match-badge">🇦🇷 Argentina</span>{/if}
					<div class="match-venue">{m.venue ?? ''}</div>
				</div>
			{/each}
		</div>
	{/if}

	<p class="nota">Horarios en UTC-3 (Argentina). Datos de FIFA.</p>
</div>

<style>
	.countdown-box { background: var(--bg-card); border: 1px solid var(--border); border-radius: 12px; padding: 24px; margin-bottom: 24px; text-align: center; }
	.countdown-label { font-family: 'Inter', monospace; font-size: 11px; color: var(--muted); letter-spacing: 0.12em; text-transform: uppercase; margin-bottom: 12px; }
	.countdown-nums { display: flex; gap: 16px; justify-content: center; flex-wrap: wrap; }
	.countdown-unit { text-align: center; }
	.countdown-num { font-family: 'Inter', sans-serif; font-size: 42px; font-weight: 800; color: var(--celeste); line-height: 1; }
	.countdown-unit-label { font-family: 'Inter', monospace; font-size: 10px; color: var(--muted); margin-top: 2px; }
	.countdown-match { font-family: 'Inter', sans-serif; font-size: 16px; font-weight: 800; margin-top: 12px; }
	.countdown-done { font-family: 'Inter', sans-serif; font-size: 20px; font-weight: 800; color: var(--celeste); }

	.calendar-filter { display: flex; gap: 8px; margin-bottom: 20px; flex-wrap: wrap; }
	.filter-arg { color: var(--celeste) !important; }
	.filter-arg.active { background: rgba(91,155,213,0.15) !important; }

	.loading { text-align: center; padding: 40px; color: var(--muted); font-family: 'DM Mono', monospace; font-size: 13px; }

	.match-list { display: flex; flex-direction: column; gap: 8px; }
	.match-item { background: var(--bg-card); border: 1px solid var(--border); border-radius: 10px; padding: 14px 20px; display: flex; align-items: center; gap: 14px; transition: border-color 0.2s; flex-wrap: wrap; }
	.match-item.argentina { border-left: 3px solid var(--celeste); }
	.match-item:hover { border-color: rgba(91, 155, 213, 0.3); }
	.match-date { font-family: 'DM Mono', monospace; font-size: 11px; color: var(--muted); flex-shrink: 0; min-width: 80px; }
	.match-group { font-size: 10px; color: var(--muted); flex-shrink: 0; min-width: 52px; }
	.match-teams { flex: 1; font-family: 'Inter', sans-serif; font-size: 14px; font-weight: 800; min-width: 200px; }
	.vs { color: var(--muted); font-weight: 400; }
	.match-venue { font-family: 'DM Mono', monospace; font-size: 10px; color: var(--muted); flex-shrink: 0; text-align: right; }
	.match-badge { font-family: 'DM Mono', monospace; font-size: 9px; letter-spacing: 0.12em; text-transform: uppercase; background: var(--celeste); color: white; padding: 3px 8px; border-radius: 20px; flex-shrink: 0; }
	.nota { font-size: 11px; color: var(--muted); margin-top: 24px; }

	@media (max-width: 640px) { .match-venue { display: none; } .match-group { display: none; } }
</style>
