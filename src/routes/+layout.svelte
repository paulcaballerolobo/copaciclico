<script lang="ts">
	import { page } from '$app/stores';
	import { onMount, onDestroy } from 'svelte';
	import { supabase } from '$lib/supabase';
	import '../app.css';

	const tabs = [
		{ href: '/', label: 'Inicio' },
		{ href: '/datos', label: 'Mundial de los Datos' },
		{ href: '/stats', label: 'Estadísticas' },
		{ href: '/mundial', label: '🏆 Prode Cíclico', prode: true },
	];

	interface MatchRow {
		id: string;
		match_number: number;
		kickoff_time: string;
		team_home: string;
		team_away: string;
		venue: string | null;
		group_name: string | null;
	}
	interface TeamInfo { name: string; flag: string; }
	type StripMode = 'live' | 'next';
	interface StripState { mode: StripMode; match: MatchRow; }

	const MATCH_DURATION_MS = 2 * 60 * 60 * 1000;

	type CD = { days: number; hours: number; mins: number; secs: number };

	function calcCD(target: Date): CD {
		const diff = target.getTime() - Date.now();
		if (diff <= 0) return { days: 0, hours: 0, mins: 0, secs: 0 };
		return {
			days: Math.floor(diff / 86400000),
			hours: Math.floor((diff % 86400000) / 3600000),
			mins: Math.floor((diff % 3600000) / 60000),
			secs: Math.floor((diff % 60000) / 1000)
		};
	}

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

	function pad(n: number) { return String(n).padStart(2, '0'); }

	let upcomingMatches: MatchRow[] = [];
	let teamsMap: Record<string, TeamInfo> = {};
	let strip: StripState | null = null;
	let cd: CD = { days: 0, hours: 0, mins: 0, secs: 0 };
	let elapsed = 0;
	let interval: ReturnType<typeof setInterval>;

	function teamInfo(code: string): TeamInfo {
		return teamsMap[code] ?? { name: code, flag: '🏳' };
	}

	function computeStrip() {
		const now = Date.now();
		const live = upcomingMatches.find(m => {
			const start = new Date(m.kickoff_time).getTime();
			return now >= start && now < start + MATCH_DURATION_MS;
		});
		if (live) {
			strip = { mode: 'live', match: live };
			elapsed = Math.floor((now - new Date(live.kickoff_time).getTime()) / 60000);
			return;
		}
		const next = upcomingMatches
			.map(m => ({ match: m, start: new Date(m.kickoff_time).getTime() }))
			.filter(({ start }) => start > now)
			.sort((a, b) => a.start - b.start)[0];
		if (next) {
			strip = { mode: 'next', match: next.match };
			cd = calcCD(new Date(next.match.kickoff_time));
		} else {
			strip = null;
		}
	}

	onMount(async () => {
		const windowStart = new Date(Date.now() - MATCH_DURATION_MS).toISOString();
		const [{ data: matchData }, { data: teamData }] = await Promise.all([
			supabase
				.from('matches')
				.select('id, match_number, kickoff_time, team_home, team_away, venue, group_name')
				.eq('phase', 'groups')
				.gte('kickoff_time', windowStart)
				.order('kickoff_time')
				.limit(10),
			supabase.from('teams').select('code, name, flag')
		]);
		upcomingMatches = (matchData ?? []) as MatchRow[];
		teamsMap = Object.fromEntries(((teamData ?? []) as { code: string; name: string; flag: string }[]).map(t => [t.code, { name: t.name, flag: t.flag }]));
		computeStrip();
		interval = setInterval(computeStrip, 1000);
	});
	onDestroy(() => { if (interval) clearInterval(interval); });
</script>

{#if !$page.url.pathname.startsWith('/mundial/trivia')}
<nav>
	<div class="nav-main">
		<a href="/" class="logo-link">
			<img src="/Logos-CICLICO-Mundial-blanco.png" alt="Cíclico" class="logo-img" />
		</a>
		<div class="nav-tabs">
			{#each tabs as tab}
					<a
						href={tab.href}
						class="nav-tab"
						class:active={tab.prode ? $page.url.pathname.startsWith('/mundial') : $page.url.pathname === tab.href}
						class:nav-tab-prode={tab.prode}
					>{tab.label}</a>
			{/each}
		</div>
	</div>
	{#if strip}
	<div class="nav-strip" class:strip-live={strip.mode === 'live'}>
		{#if strip.mode === 'live'}
			<span class="strip-live-dot"></span>
			<span class="strip-label strip-label-live">EN VIVO</span>
			<span class="strip-match">
				{teamInfo(strip.match.team_home).flag} {teamInfo(strip.match.team_home).name}
				<span class="strip-vs">vs</span>
				{teamInfo(strip.match.team_away).name} {teamInfo(strip.match.team_away).flag}
			</span>
			<span class="strip-dot">·</span>
			<span class="strip-venue">{strip.match.venue ?? ''}</span>
			<span class="strip-elapsed">min {elapsed}'</span>
		{:else}
			<span class="strip-label">PRÓXIMO PARTIDO</span>
			<span class="strip-match">
				{teamInfo(strip.match.team_home).flag} {teamInfo(strip.match.team_home).name}
				<span class="strip-vs">vs</span>
				{teamInfo(strip.match.team_away).name} {teamInfo(strip.match.team_away).flag}
			</span>
			<span class="strip-dot">·</span>
			<span class="strip-venue">{formatDate(strip.match.kickoff_time)} · {formatTime(strip.match.kickoff_time)} hs · {strip.match.venue ?? ''}</span>
			<span class="strip-dot">·</span>
			<div class="strip-cd">
				{#if cd.days > 0}<span class="strip-num">{pad(cd.days)}</span><span class="strip-sep">d</span><span class="strip-colon">:</span>{/if}
				<span class="strip-num">{pad(cd.hours)}</span><span class="strip-sep">h</span>
				<span class="strip-colon">:</span>
				<span class="strip-num">{pad(cd.mins)}</span><span class="strip-sep">m</span>
				<span class="strip-colon blink">:</span>
				<span class="strip-num strip-secs">{pad(cd.secs)}</span><span class="strip-sep">s</span>
			</div>
		{/if}
	</div>
	{/if}
</nav>
{/if}

<slot />

<style>
	nav {
		border-bottom: 1px solid var(--border);
		display: flex;
		flex-direction: column;
		position: sticky;
		top: 0;
		background: rgba(6, 20, 40, 0.97);
		backdrop-filter: blur(12px);
		z-index: 200;
	}
	.nav-main {
		padding: 12px 32px;
		display: flex;
		align-items: center;
		gap: 16px;
	}
	.logo-img {
		height: 32px;
		width: auto;
		display: block;
		flex-shrink: 0;
	}
	.nav-tabs {
		display: flex;
		gap: 4px;
		margin-left: 24px;
		overflow-x: auto;
		scrollbar-width: none;
	}
	.nav-tabs::-webkit-scrollbar { display: none; }
	.nav-tab {
		font-family: 'Inter', monospace;
		font-size: 10px;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		padding: 7px 12px;
		border-radius: 20px;
		border: none;
		cursor: pointer;
		color: rgba(255,255,255,0.55);
		background: none;
		white-space: nowrap;
		transition: color 0.2s;
		text-decoration: none;
	}
	.nav-tab:hover { color: rgba(255,255,255,0.9); }
	.nav-tab.active { color: #fff; background: rgba(255,255,255,0.1); }
	.nav-tab-prode { color: var(--amarillo-dim) !important; }
	.nav-tab-prode.active { background: rgba(245,194,0,0.12); color: var(--amarillo-dim) !important; }
	.nav-tab-trivia { color: rgba(255,100,80,0.85) !important; }
	.nav-tab-trivia.active { background: rgba(255,85,0,0.12); color: rgba(255,85,0,1) !important; }
	.logo-link {
		display: flex;
		align-items: center;
		gap: 8px;
		text-decoration: none;
		flex-shrink: 0;
	}

	/* ── NAV STRIP ── */
	.nav-strip {
		border-top: 1px solid rgba(255,255,255,0.07);
		background: #000;
		padding: 6px 32px;
		display: flex;
		align-items: center;
		gap: 12px;
		overflow: hidden;
	}
	.strip-label {
		font-family: 'Inter', monospace;
		font-size: 9px;
		letter-spacing: 0.18em;
		text-transform: uppercase;
		color: var(--amarillo);
		white-space: nowrap;
		flex-shrink: 0;
	}
	.strip-match {
		font-family: 'Inter', sans-serif;
		font-size: 11px;
		font-weight: 600;
		color: #fff;
		white-space: nowrap;
		flex-shrink: 0;
	}
	.strip-venue {
		font-family: 'DM Mono', monospace;
		font-size: 10px;
		color: rgba(255,255,255,0.35);
		white-space: nowrap;
		flex-shrink: 0;
	}
	.strip-dot {
		color: rgba(255,255,255,0.2);
		font-size: 10px;
		flex-shrink: 0;
	}
	.strip-cd {
		display: flex;
		align-items: baseline;
		gap: 2px;
		margin-left: auto;
		flex-shrink: 0;
	}
	.strip-num {
		font-family: 'DM Mono', monospace;
		font-size: 13px;
		font-weight: 700;
		color: #fff;
		letter-spacing: -0.02em;
	}
	.strip-secs { color: var(--celeste); }
	.strip-sep {
		font-family: 'DM Mono', monospace;
		font-size: 9px;
		color: rgba(255,255,255,0.3);
		margin-right: 4px;
	}
	.strip-colon {
		font-family: 'DM Mono', monospace;
		font-size: 11px;
		color: rgba(255,255,255,0.25);
		margin: 0 2px;
	}
	.strip-vs {
		color: rgba(255,255,255,0.35);
		font-weight: 400;
		font-size: 10px;
		margin: 0 3px;
	}
	.strip-live { background: #0a0a0a; }
	.strip-label-live { color: #ff4444 !important; }
	.strip-live-dot {
		width: 7px; height: 7px;
		border-radius: 50%;
		background: #ff4444;
		flex-shrink: 0;
		animation: livePulse 1.2s ease-in-out infinite;
	}
	@keyframes livePulse {
		0%, 100% { opacity: 1; box-shadow: 0 0 0 0 rgba(255,68,68,0.6); }
		50% { opacity: 0.8; box-shadow: 0 0 0 4px rgba(255,68,68,0); }
	}
	.strip-elapsed {
		font-family: 'DM Mono', monospace;
		font-size: 12px;
		font-weight: 700;
		color: #ff4444;
		margin-left: auto;
		flex-shrink: 0;
	}
	.blink { animation: blinkAnim 2s step-end infinite; }
	@keyframes blinkAnim { 0%,49%{opacity:1} 50%,100%{opacity:0.15} }

	@media (max-width: 900px) { .nav-main { padding: 10px 16px; } .nav-strip { padding: 5px 16px; } .strip-venue { display: none; } }
	@media (max-width: 640px) { .nav-tab { font-size: 10px; padding: 6px 10px; } }
</style>
