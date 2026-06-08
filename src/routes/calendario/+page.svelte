<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { COUNTRIES, MATCHES } from '$lib/data';
	import type { Match } from '$lib/types';

	let activeGroup = 'all';
	let interval: ReturnType<typeof setInterval> | null = null;
	let nextMatch: (Match & { dateObj: Date }) | null = null;
	let countdown = { d: 0, h: 0, m: 0, s: 0 };
	let finished = false;
	let label = 'Próximo partido de Argentina';

	function parseDate(m: Match): Date {
		const months: Record<string, string> = {
			ene: '01', feb: '02', mar: '03', abr: '04', may: '05', jun: '06',
			jul: '07', ago: '08', sep: '09', oct: '10', nov: '11', dic: '12'
		};
		const [day, mon] = m.date.split(' ');
		return new Date(`2026-${months[mon] ?? '06'}-${day.padStart(2, '0')}T${m.time}:00-03:00`);
	}

	function start() {
		if (interval) clearInterval(interval);
		const upcoming = MATCHES
			.filter((m) => m.arge)
			.map((m) => ({ ...m, dateObj: parseDate(m) }))
			.sort((a, b) => a.dateObj.getTime() - b.dateObj.getTime())
			.filter((m) => m.dateObj > new Date());

		nextMatch = upcoming[0] ?? null;

		if (!nextMatch) {
			label = 'Fase de grupos finalizada';
			finished = true;
			return;
		}

		const tick = () => {
			if (!nextMatch) return;
			const diff = nextMatch.dateObj.getTime() - Date.now();
			if (diff <= 0) {
				finished = true;
				if (interval) clearInterval(interval);
				setTimeout(start, 120_000);
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

	onMount(start);
	onDestroy(() => { if (interval) clearInterval(interval); });

	$: filtered = MATCHES.filter((m) => activeGroup === 'all' || m.group === activeGroup);

	const filters = [
		{ id: 'all', label: 'Todos los partidos' },
		{ id: 'A', label: 'Grupo A' },
		{ id: 'B', label: 'Grupo B' },
		{ id: 'C', label: 'Grupo C' },
		{ id: 'J', label: 'Grupo J 🇦🇷' }
	];
</script>

<div class="section">
	<div class="section-hero-label">Fase de grupos</div>
	<div class="section-title">Calendario</div>
	<div class="section-subtitle">Partidos de los grupos A, B, C y J. Todos los horarios son de Argentina (UTC-3).</div>

	<!-- Countdown -->
	<div class="countdown-box">
		<div class="countdown-label">{label}</div>
		{#if finished}
			<div class="countdown-done">¡Argentina terminó la fase de grupos!</div>
		{:else if nextMatch}
			<div class="countdown-nums">
				{#each [{ n: countdown.d, l: 'días' }, { n: countdown.h, l: 'horas' }, { n: countdown.m, l: 'minutos' }, { n: countdown.s, l: 'segundos' }] as u}
					<div class="countdown-unit">
						<div class="countdown-num">{String(u.n).padStart(2, '0')}</div>
						<div class="countdown-unit-label">{u.l}</div>
					</div>
				{/each}
			</div>
			<div class="countdown-match">
				{COUNTRIES[nextMatch.home].flag} {COUNTRIES[nextMatch.home].name} vs
				{COUNTRIES[nextMatch.away].flag} {COUNTRIES[nextMatch.away].name} · {nextMatch.venue}
			</div>
		{/if}
	</div>

	<!-- Filter -->
	<div class="calendar-filter">
		{#each filters as f}
			<button class="filter-btn" class:active={activeGroup === f.id} on:click={() => (activeGroup = f.id)}>{f.label}</button>
		{/each}
	</div>

	<!-- Match list -->
	<div class="match-list">
		{#each filtered as m}
			{@const hc = COUNTRIES[m.home]}
			{@const ac = COUNTRIES[m.away]}
			<div class="match-item" class:argentina={m.arge}>
				<div class="match-date mono">{m.date}<br />{m.time} hs</div>
				<div class="match-teams">{hc.flag} {hc.name} <span class="vs">vs</span> {ac.flag} {ac.name}</div>
				{#if m.arge}<span class="match-badge">🇦🇷 Argentina</span>{/if}
				<div class="match-venue">{m.venue}</div>
			</div>
		{/each}
	</div>

	<p class="nota">Fechas aproximadas pendientes de confirmación oficial FIFA. Horarios en UTC-3 (Argentina).</p>
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
	.match-list { display: flex; flex-direction: column; gap: 8px; }
	.match-item { background: var(--bg-card); border: 1px solid var(--border); border-radius: 10px; padding: 16px 20px; display: flex; align-items: center; gap: 16px; transition: border-color 0.2s; }
	.match-item.argentina { border-left: 3px solid var(--celeste); }
	.match-item:hover { border-color: rgba(91, 155, 213, 0.3); }
	.match-date { font-family: 'DM Mono', monospace; font-size: 11px; color: var(--muted); flex-shrink: 0; min-width: 90px; }
	.match-teams { flex: 1; font-family: 'Inter', sans-serif; font-size: 14px; font-weight: 800; }
	.vs { color: var(--muted); font-weight: 400; }
	.match-venue { font-family: 'DM Mono', monospace; font-size: 10px; color: var(--muted); flex-shrink: 0; text-align: right; }
	.match-badge { font-family: 'DM Mono', monospace; font-size: 9px; letter-spacing: 0.12em; text-transform: uppercase; background: var(--celeste); color: white; padding: 3px 8px; border-radius: 20px; flex-shrink: 0; }
</style>
