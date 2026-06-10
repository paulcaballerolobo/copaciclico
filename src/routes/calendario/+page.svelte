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
		is_placeholder: boolean;
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

	function startCountdown() {
		if (interval) clearInterval(interval);
		const argMatches = matches
			.filter(m => m.team_home === 'ARG' || m.team_away === 'ARG')
			.filter(m => new Date(m.kickoff_time) > new Date())
			.sort((a, b) => new Date(a.kickoff_time).getTime() - new Date(b.kickoff_time).getTime());

		nextArg = argMatches[0] ?? null;
		if (!nextArg) { argFinished = true; return; }

		const tick = () => {
			if (!nextArg) return;
			const diff = new Date(nextArg.kickoff_time).getTime() - Date.now();
			if (diff <= 0) { argFinished = true; if (interval) clearInterval(interval); return; }
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
			supabase.from('teams').select('code, name, flag, is_placeholder')
		]);
		matches = (matchData ?? []) as MatchRow[];
		teams = Object.fromEntries(((teamData ?? []) as TeamRow[]).map(t => [t.code, t]));
		loading = false;
		startCountdown();
	});

	onDestroy(() => { if (interval) clearInterval(interval); });

	$: filtered = activeGroup === 'all' ? matches : matches.filter(m => m.group_name === activeGroup);

	function pad(n: number) { return String(n).padStart(2, '0'); }
	function name(code: string) { return teams[code]?.name ?? code; }
	function flag(code: string) { return teams[code]?.flag ?? '🏳'; }
	function isPlaceholder(code: string) { return teams[code]?.is_placeholder ?? false; }
	function teamCode(code: string) { return isPlaceholder(code) ? '???' : code; }
	function isArg(m: MatchRow) { return m.team_home === 'ARG' || m.team_away === 'ARG'; }
</script>

<div class="section">

	<!-- Card Argentina -->
	<div class="arg-card">
		<div class="arg-header">Próximo partido de Argentina</div>

		{#if argFinished}
			<div class="arg-done">¡Argentina terminó la fase de grupos!</div>
		{:else if nextArg}
			<div class="arg-cd">
				{#if countdown.d > 0}
					<div class="cd-unit"><span class="cd-num">{pad(countdown.d)}</span><span class="cd-lbl">días</span></div>
					<span class="cd-sep">:</span>
				{/if}
				<div class="cd-unit"><span class="cd-num">{pad(countdown.h)}</span><span class="cd-lbl">hs</span></div>
				<span class="cd-sep">:</span>
				<div class="cd-unit"><span class="cd-num">{pad(countdown.m)}</span><span class="cd-lbl">min</span></div>
				<span class="cd-sep blink">:</span>
				<div class="cd-unit"><span class="cd-num cd-secs">{pad(countdown.s)}</span><span class="cd-lbl">seg</span></div>
			</div>

			<div class="arg-teams">
				<div class="arg-team">
					<div class="arg-initials">{nextArg.team_home}</div>
					<div class="arg-team-bottom">
						<span class="arg-flag">{flag(nextArg.team_home)}</span>
						<span class="arg-tname">{name(nextArg.team_home)}</span>
					</div>
				</div>
				<div class="arg-vs">vs</div>
				<div class="arg-team arg-team-right">
					<div class="arg-initials">{nextArg.team_away}</div>
					<div class="arg-team-bottom arg-team-bottom-right">
						<span class="arg-tname">{name(nextArg.team_away)}</span>
						<span class="arg-flag">{flag(nextArg.team_away)}</span>
					</div>
				</div>
			</div>

			<div class="arg-venue">{nextArg.venue ?? ''}</div>
			<div class="arg-when">{formatDate(nextArg.kickoff_time)} · {formatTime(nextArg.kickoff_time)} hs · Grupo {nextArg.group_name}</div>
		{:else if loading}
			<div class="arg-done">Cargando…</div>
		{/if}
	</div>

	<!-- Filtros -->
	<div class="calendar-filter">
		<button class="filter-pill" class:active={activeGroup === 'all'} on:click={() => activeGroup = 'all'}>Todos</button>
		{#each GROUPS as g}
			<button class="filter-pill" class:active={activeGroup === g} class:pill-arg={g === 'J'} on:click={() => activeGroup = g}>
				{g === 'J' ? '🇦🇷 ' : ''}Grupo {g}
			</button>
		{/each}
	</div>

	{#if loading}
		<div class="loading">Cargando partidos…</div>
	{:else}
		<div class="match-list">
			{#each filtered as m}
				<div class="match-card" class:match-arg={isArg(m)}>
					<div class="mc-teams">
						<div class="mc-team mc-home">
							<span class="mc-flag">{flag(m.team_home)}</span>
							<div class="mc-team-info">
								<span class="mc-code" class:mc-tbd={isPlaceholder(m.team_home)}>{teamCode(m.team_home)}</span>
								<span class="mc-name">{name(m.team_home)}</span>
							</div>
						</div>
						<div class="mc-vs">vs</div>
						<div class="mc-team mc-away">
							<div class="mc-team-info mc-team-info-right">
								<span class="mc-code" class:mc-tbd={isPlaceholder(m.team_away)}>{teamCode(m.team_away)}</span>
								<span class="mc-name">{name(m.team_away)}</span>
							</div>
							<span class="mc-flag">{flag(m.team_away)}</span>
						</div>
					</div>
					<div class="mc-meta">
						<span class="mc-datetime">{formatDate(m.kickoff_time)} · {formatTime(m.kickoff_time)} hs</span>
						<span class="mc-dot">·</span>
						<span class="mc-group">Grupo {m.group_name}</span>
						{#if m.venue}<span class="mc-dot">·</span><span class="mc-venue">{m.venue}</span>{/if}
					</div>
				</div>
			{/each}
		</div>
	{/if}

</div>

<style>
	/* ── ARGENTINA CARD ── */
	.arg-card {
		background: #061428;
		border: 1px solid rgba(91,155,213,0.2);
		border-radius: 16px;
		padding: 28px 32px;
		margin-bottom: 28px;
		text-align: center;
	}
	.arg-header {
		font-family: 'Inter', monospace;
		font-size: 10px;
		letter-spacing: 0.18em;
		text-transform: uppercase;
		color: var(--celeste);
		margin-bottom: 16px;
	}
	.arg-cd {
		display: flex;
		align-items: flex-end;
		justify-content: center;
		gap: 4px;
		margin-bottom: 24px;
	}
	.cd-unit { display: flex; flex-direction: column; align-items: center; }
	.cd-num {
		font-family: 'DM Mono', monospace;
		font-size: 48px;
		font-weight: 700;
		color: #fff;
		line-height: 1;
		letter-spacing: -0.02em;
	}
	.cd-secs { color: var(--celeste); }
	.cd-lbl {
		font-family: 'DM Mono', monospace;
		font-size: 9px;
		color: rgba(255,255,255,0.35);
		margin-top: 3px;
	}
	.cd-sep {
		font-family: 'DM Mono', monospace;
		font-size: 36px;
		color: rgba(255,255,255,0.2);
		line-height: 1;
		padding-bottom: 14px;
	}
	.blink { animation: blinkAnim 2s step-end infinite; }
	@keyframes blinkAnim { 0%,49%{opacity:1} 50%,100%{opacity:0.15} }

	.arg-teams {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 32px;
		margin-bottom: 14px;
	}
	.arg-team { display: flex; flex-direction: column; align-items: flex-start; }
	.arg-team-right { align-items: flex-end; }
	.arg-initials {
		font-family: 'Inter', sans-serif;
		font-size: 52px;
		font-weight: 900;
		color: #fff;
		letter-spacing: -0.03em;
		line-height: 1;
	}
	.arg-team-bottom {
		display: flex;
		align-items: center;
		gap: 6px;
		margin-top: 6px;
	}
	.arg-team-bottom-right { flex-direction: row; }
	.arg-flag { font-size: 22px; }
	.arg-tname {
		font-family: 'Inter', sans-serif;
		font-size: 13px;
		font-weight: 600;
		color: rgba(255,255,255,0.8);
	}
	.arg-vs {
		font-family: 'Inter', sans-serif;
		font-size: 18px;
		font-weight: 400;
		color: rgba(255,255,255,0.25);
		flex-shrink: 0;
		padding-bottom: 28px;
	}
	.arg-venue {
		font-family: 'Inter', sans-serif;
		font-size: 14px;
		font-weight: 700;
		color: rgba(255,255,255,0.9);
		margin-bottom: 4px;
	}
	.arg-when {
		font-family: 'DM Mono', monospace;
		font-size: 11px;
		color: rgba(255,255,255,0.4);
	}
	.arg-done {
		font-family: 'Inter', sans-serif;
		font-size: 18px;
		font-weight: 800;
		color: var(--celeste);
		padding: 16px 0;
	}

	/* ── FILTROS ── */
	.calendar-filter { display: flex; gap: 8px; margin-bottom: 20px; flex-wrap: wrap; }
	.filter-pill {
		font-family: 'Inter', monospace;
		font-size: 10px;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		padding: 6px 14px;
		border-radius: 20px;
		border: 1px solid rgba(255,255,255,0.15);
		cursor: pointer;
		color: #061428;
		background: #fff;
		white-space: nowrap;
		transition: all 0.15s;
	}
	.filter-pill:hover { background: #e8f0fa; }
	.filter-pill.active { background: var(--celeste); color: #fff; border-color: var(--celeste); font-weight: 700; }
	.pill-arg { color: #1a5fa8 !important; border-color: rgba(91,155,213,0.3) !important; }
	.pill-arg.active { background: var(--celeste) !important; color: #fff !important; border-color: var(--celeste) !important; }

	/* ── LOADING ── */
	.loading { text-align: center; padding: 40px; color: var(--muted); font-family: 'DM Mono', monospace; font-size: 13px; }

	/* ── MATCH CARDS ── */
	.match-list { display: flex; flex-direction: column; gap: 6px; }
	.match-card {
		background: rgba(91, 155, 213, 0.52);
		border: 1px solid rgba(91, 155, 213, 0.45);
		border-radius: 10px;
		padding: 14px 20px;
		backdrop-filter: blur(6px);
		transition: border-color 0.2s, background 0.2s;
	}
	.match-card.match-arg {
		background: rgba(91, 155, 213, 0.65);
		border-color: rgba(91, 155, 213, 0.75);
	}
	.match-card:hover { background: rgba(91, 155, 213, 0.62); }

	.mc-teams {
		display: flex;
		align-items: center;
		margin-bottom: 7px;
	}
	.mc-team {
		flex: 1;
		display: flex;
		align-items: center;
		gap: 10px;
	}
	.mc-home { justify-content: flex-end; }
	.mc-away { justify-content: flex-start; flex-direction: row; }
	.mc-flag { font-size: 22px; flex-shrink: 0; }
	.mc-team-info { display: flex; flex-direction: column; align-items: center; }
	.mc-team-info-right { align-items: center; }
	.mc-code {
		font-family: 'Inter', sans-serif;
		font-size: 15px;
		font-weight: 900;
		color: #fff;
		letter-spacing: -0.01em;
		line-height: 1.1;
	}
	.mc-name {
		font-family: 'Inter', sans-serif;
		font-size: 10px;
		color: rgba(255,255,255,0.55);
		font-weight: 400;
	}
	.mc-tbd { color: rgba(255,255,255,0.35) !important; font-style: italic; letter-spacing: 0; }
	.mc-vs {
		font-family: 'DM Mono', monospace;
		font-size: 10px;
		color: rgba(255,255,255,0.3);
		flex-shrink: 0;
		width: 32px;
		text-align: center;
	}

	.mc-meta {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 5px;
		flex-wrap: wrap;
	}
	.mc-datetime {
		font-family: 'DM Mono', monospace;
		font-size: 11px;
		color: rgba(0,0,0,0.65);
		font-weight: 600;
	}
	.mc-group {
		font-family: 'DM Mono', monospace;
		font-size: 10px;
		color: rgba(0,0,0,0.5);
	}
	.mc-venue {
		font-family: 'DM Mono', monospace;
		font-size: 10px;
		color: rgba(0,0,0,0.4);
	}
	.mc-dot { color: rgba(0,0,0,0.25); font-size: 10px; }

	.nota { font-size: 11px; color: var(--muted); margin-top: 24px; }

	@media (max-width: 640px) {
		.arg-initials { font-size: 36px; }
		.cd-num { font-size: 36px; }
		.mc-venue { display: none; }
		.arg-card { padding: 20px 16px; }
	}
</style>
