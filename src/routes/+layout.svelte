<script lang="ts">
	import { page } from '$app/stores';
	import { onMount, onDestroy } from 'svelte';
	import { MATCHES, COUNTRIES } from '$lib/data';
	import '../app.css';

	const tabs = [
		{ href: '/', label: 'Inicio' },
		{ href: '/datos', label: 'Mundial de los Datos' },
		{ href: '/paises', label: 'Países' },
		{ href: '/stats', label: 'Estadísticas' },
		{ href: '/mundial', label: '🏆 Prode Cíclico', prode: true },
		{ href: '/mundial/trivia', label: '🎯 Trivia', trivia: true }
	];

	// Horarios en data.ts están en ART (UTC-3), sumamos 3h para obtener UTC
	const MONTH: Record<string, number> = { ene:0, feb:1, mar:2, abr:3, may:4, jun:5, jul:6, ago:7 };

	function matchStart(m: typeof MATCHES[number]): Date {
		const [day, mon] = m.date.split(' ');
		const [h, min] = m.time.split(':').map(Number);
		return new Date(Date.UTC(2026, MONTH[mon], Number(day), h + 3, min));
	}

	const MATCH_DURATION_MS = 2 * 60 * 60 * 1000; // 2 horas

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

	function pad(n: number) { return String(n).padStart(2, '0'); }

	function getCountry(code: string) {
		return COUNTRIES[code as keyof typeof COUNTRIES];
	}

	function getStripState() {
		const now = Date.now();
		// Find live match first
		const live = MATCHES.find(m => {
			const start = matchStart(m).getTime();
			return now >= start && now < start + MATCH_DURATION_MS;
		});
		if (live) return { mode: 'live' as const, match: live };
		// Find next upcoming match
		const upcoming = MATCHES
			.map(m => ({ match: m, start: matchStart(m).getTime() }))
			.filter(({ start }) => start > now)
			.sort((a, b) => a.start - b.start)[0];
		if (upcoming) return { mode: 'next' as const, match: upcoming.match };
		return null;
	}

	let strip = getStripState();
	let cd: CD = strip?.mode === 'next' ? calcCD(matchStart(strip.match)) : { days: 0, hours: 0, mins: 0, secs: 0 };
	let elapsed = 0; // minutes elapsed for live match

	let interval: ReturnType<typeof setInterval>;
	onMount(() => {
		interval = setInterval(() => {
			strip = getStripState();
			if (strip?.mode === 'next') {
				cd = calcCD(matchStart(strip.match));
			} else if (strip?.mode === 'live') {
				elapsed = Math.floor((Date.now() - matchStart(strip.match).getTime()) / 60000);
			}
		}, 1000);
	});
	onDestroy(() => clearInterval(interval));
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
						class:active={tab.trivia ? $page.url.pathname.startsWith('/mundial/trivia') : tab.prode ? ($page.url.pathname.startsWith('/mundial') && !$page.url.pathname.startsWith('/mundial/trivia')) : $page.url.pathname === tab.href}
						class:nav-tab-prode={tab.prode}
						class:nav-tab-trivia={tab.trivia}
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
				{getCountry(strip.match.home)?.flag} {getCountry(strip.match.home)?.name}
				<span class="strip-vs">vs</span>
				{getCountry(strip.match.away)?.name} {getCountry(strip.match.away)?.flag}
			</span>
			<span class="strip-dot">·</span>
			<span class="strip-venue">{strip.match.venue}</span>
			<span class="strip-elapsed">min {elapsed}'</span>
		{:else}
			<span class="strip-label">PRÓXIMO PARTIDO</span>
			<span class="strip-match">
				{getCountry(strip.match.home)?.flag} {getCountry(strip.match.home)?.name}
				<span class="strip-vs">vs</span>
				{getCountry(strip.match.away)?.name} {getCountry(strip.match.away)?.flag}
			</span>
			<span class="strip-dot">·</span>
			<span class="strip-venue">{strip.match.date} · {strip.match.time} hs · {strip.match.venue}</span>
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
