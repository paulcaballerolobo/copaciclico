<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { supabase } from '$lib/supabase';
	import { formatDateAR, flag } from '$lib/mundial/utils';

	interface Player {
		id: string;
		full_name: string;
		username: string;
		avatar_url: string | null;
		points_total: number;
		ranking_position: number | null;
	}

	interface Match {
		id: string;
		phase: string;
		group_name: string | null;
		week_number: number;
		team_home: string;
		team_away: string;
		kickoff_time: string;
		venue: string | null;
		status: string;
		result_home: number | null;
		result_away: number | null;
		winner: string | null;
		predictions_open: boolean;
	}

	interface PredStat {
		total: number;
		pct_home: number;
		pct_draw: number;
		pct_away: number;
	}

	// ─── ESTADO ───────────────────────────────────────────────────
	let isRehearsalMode = false;
	let currentWeek = 1;
	let pozoStatus = 'closed';
	let pozoTotal = 0;

	let ranking: Player[] = [];
	let showAllRanking = false;

	let upcomingMatches: Match[] = [];
	let finishedMatches: Match[] = [];
	let predStats: Record<string, PredStat> = {};

	let loading = true;
	let realtimeChannels: ReturnType<typeof supabase.channel>[] = [];

	// ─── MOUNT ────────────────────────────────────────────────────
	onMount(async () => {
		await loadAll();
		setupRealtime();
		loading = false;
	});

	onDestroy(() => realtimeChannels.forEach((ch) => supabase.removeChannel(ch)));

	async function loadAll() {
		// Config
		const { data: cfg } = await supabase.from('config').select('key, value');
		if (cfg) {
			const map = Object.fromEntries(cfg.map((r: { key: string; value: string }) => [r.key, r.value]));
			isRehearsalMode = map.is_rehearsal_mode === 'true';
			currentWeek = parseInt(map.current_week ?? '1');
			pozoStatus = map.pozo_status ?? 'closed';
		}

		// Pozo
		const { data: pozoLog } = await supabase.from('pozo_log').select('amount');
		if (pozoLog) pozoTotal = pozoLog.reduce((s: number, r: { amount: number }) => s + r.amount, 0);

		// Ranking
		const { data: users } = await supabase
			.from('users')
			.select('id, full_name, username, avatar_url, points_total, ranking_position')
			.eq('is_active', true)
			.eq('is_admin', false)
			.order('ranking_position', { ascending: true, nullsFirst: false });
		ranking = (users ?? []) as Player[];

		// Próximos partidos
		const { data: upcoming } = await supabase
			.from('matches')
			.select('*')
			.eq('week_number', currentWeek)
			.neq('status', 'finished')
			.order('kickoff_time');
		upcomingMatches = (upcoming ?? []) as Match[];

		// Cargar estadísticas de pronósticos para partidos abiertos
		for (const m of upcomingMatches.filter((m) => m.predictions_open)) {
			const { data: stats } = await supabase.rpc('get_match_prediction_stats', { p_match_id: m.id });
			if (stats) predStats[m.id] = stats as PredStat;
		}
		predStats = { ...predStats };

		// Últimos 3 resultados
		const { data: finished } = await supabase
			.from('matches')
			.select('*')
			.eq('status', 'finished')
			.order('kickoff_time', { ascending: false })
			.limit(3);
		finishedMatches = (finished ?? []) as Match[];
	}

	function setupRealtime() {
		// Ranking en tiempo real
		const rankingCh = supabase
			.channel('home-ranking')
			.on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'users' }, async () => {
				const { data } = await supabase
					.from('users')
					.select('id, full_name, username, avatar_url, points_total, ranking_position')
					.eq('is_active', true)
					.eq('is_admin', false)
					.order('ranking_position', { ascending: true, nullsFirst: false });
				ranking = (data ?? []) as Player[];
			})
			.subscribe();

		// Pozo en tiempo real
		const pozoCh = supabase
			.channel('home-pozo')
			.on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'pozo_log' }, (payload) => {
				pozoTotal += (payload.new as { amount: number }).amount;
			})
			.subscribe();

		realtimeChannels = [rankingCh, pozoCh];
	}

	function phaseLabel(phase: string): string {
		const map: Record<string, string> = {
			groups: 'Grupos', r32: '32avos', r16: 'Octavos',
			qf: 'Cuartos', sf: 'Semis', '3rd': '3er puesto', final: 'Final'
		};
		return map[phase] ?? phase;
	}

	$: top5 = ranking.slice(0, 5);
</script>

<svelte:head>
	<title>Prode Cíclico — Mundial 2026</title>
	<meta name="description" content="Seguí el ranking y los pronósticos del Prode Cíclico del Mundial 2026" />
</svelte:head>

<!-- ─── REHEARSAL BANNER ─── -->
{#if isRehearsalMode}
	<div class="home-rehearsal-banner">
		⚠️ MODO ENSAYO — Los puntos no cuentan todavía
	</div>
{/if}

<div class="prode-home">

	<!-- ─── HERO ─── -->
	<section class="ph-hero">
		<div class="ph-hero-inner">
			<div class="ph-eyebrow">PRODE CÍCLICO · MUNDIAL 2026</div>
			<h1 class="ph-hero-title">El Prode<br><span class="ph-accent">del programa</span></h1>
			<p class="ph-hero-lead">Pronósticos, trivia y El Pozo para los participantes de Cíclico</p>
			<a href="/mundial/jugador/igrandon" class="ph-cta">
				Ir a mi panel →
			</a>
		</div>
	</section>

	<!-- ─── EL POZO ─── -->
	{#if pozoStatus !== 'closed'}
		<section class="section ph-pozo-section">
			<div class="section-hero-label">El Pozo</div>
			{#if pozoStatus === 'revealed'}
				<div class="ph-pozo-card card">
					<div class="ph-pozo-icon">🏆</div>
					<div class="ph-pozo-total">{pozoTotal.toLocaleString('es-AR')}</div>
					<div class="ph-pozo-label">puntos · El Pozo fue revelado</div>
				</div>
			{:else}
				<div class="ph-pozo-card card">
					<div class="ph-pozo-icon">💰</div>
					<div class="ph-pozo-total ph-pozo-live">{pozoTotal.toLocaleString('es-AR')}</div>
					<div class="ph-pozo-label">puntos EN JUEGO</div>
					<div class="ph-pozo-badge">EN JUEGO</div>
				</div>
			{/if}
		</section>
	{/if}

	<!-- ─── RANKING ─── -->
	<section class="section">
		<div class="section-hero-label">Ranking</div>
		<div class="ph-ranking-head">
			<h2 class="section-title">Tabla de posiciones</h2>
			{#if isRehearsalMode}
				<span class="ph-ensayo-tag">(ENSAYO)</span>
			{/if}
		</div>

		{#if loading}
			<div class="ph-loading">Cargando ranking...</div>
		{:else if ranking.length === 0}
			<div class="ph-empty">Todavía no hay puntos registrados</div>
		{:else}
			<div class="ph-ranking-list">
				{#each (showAllRanking ? ranking : top5) as player, i}
					<div class="ph-rank-row" class:top1={i === 0} class:top3={i < 3} data-user-id={player.id}>
						<div class="ph-rank-pos">
							{#if i === 0}🥇
							{:else if i === 1}🥈
							{:else if i === 2}🥉
							{:else}
								<span class="ph-rank-num">{player.ranking_position ?? i + 1}</span>
							{/if}
						</div>
						<div class="ph-rank-avatar">
							{#if player.avatar_url}
								<img src={player.avatar_url} alt={player.full_name} />
							{:else}
								<div class="ph-rank-avatar-ph">{player.full_name.charAt(0)}</div>
							{/if}
						</div>
						<div class="ph-rank-name">{player.full_name}</div>
						<div class="ph-rank-pts">
							<span class="ph-pts-value">{player.points_total ?? 0}</span>
							<span class="ph-pts-label">pts</span>
						</div>
					</div>
				{/each}
			</div>

			{#if ranking.length > 5}
				<button class="ph-toggle-ranking" on:click={() => showAllRanking = !showAllRanking}>
					{showAllRanking ? '↑ Ver menos' : `Ver todos (${ranking.length}) →`}
				</button>
			{/if}
		{/if}
	</section>

	<!-- ─── PRÓXIMOS PARTIDOS ─── -->
	{#if upcomingMatches.length > 0}
		<section class="section">
			<div class="section-hero-label">Jornada {currentWeek}</div>
			<h2 class="section-title">Próximos partidos</h2>
			<p class="section-subtitle">Los pronósticos se cierran 1 hora antes del inicio</p>

			<div class="ph-matches-grid">
				{#each upcomingMatches as match}
					<div class="ph-match-card card">
						<div class="ph-match-badge-row">
							<span class="ph-match-phase">{phaseLabel(match.phase)}{match.group_name ? ` · Grupo ${match.group_name}` : ''}</span>
							{#if match.status === 'live'}
								<span class="ph-match-live">🔴 EN VIVO</span>
							{/if}
						</div>
						<div class="ph-match-teams">
							<div class="ph-mt">
								<span class="ph-mt-flag">{flag(match.team_home)}</span>
								<span class="ph-mt-name">{match.team_home}</span>
							</div>
							<span class="ph-match-vs">VS</span>
							<div class="ph-mt ph-mt-right">
								<span class="ph-mt-name">{match.team_away}</span>
								<span class="ph-mt-flag">{flag(match.team_away)}</span>
							</div>
						</div>
						<div class="ph-match-time">{formatDateAR(match.kickoff_time)}</div>
						{#if match.venue}<div class="ph-match-venue">{match.venue}</div>{/if}

						<!-- Barras de pronósticos si está abierto -->
						{#if match.predictions_open && predStats[match.id]}
							{@const stats = predStats[match.id]}
							{#if stats.total > 0}
								<div class="ph-pred-bar">
									<div class="ph-pred-bar-row">
										<span class="ph-pred-team">{match.team_home}</span>
										<div class="ph-pred-track">
											<div class="ph-pred-fill ph-pred-home" style="width:{stats.pct_home}%"></div>
										</div>
										<span class="ph-pred-pct">{stats.pct_home}%</span>
									</div>
									{#if match.phase === 'groups'}
										<div class="ph-pred-bar-row">
											<span class="ph-pred-team ph-pred-draw">Empate</span>
											<div class="ph-pred-track">
												<div class="ph-pred-fill ph-pred-draw-fill" style="width:{stats.pct_draw}%"></div>
											</div>
											<span class="ph-pred-pct">{stats.pct_draw}%</span>
										</div>
									{/if}
									<div class="ph-pred-bar-row">
										<span class="ph-pred-team ph-pred-away">{match.team_away}</span>
										<div class="ph-pred-track">
											<div class="ph-pred-fill ph-pred-away-fill" style="width:{stats.pct_away}%"></div>
										</div>
										<span class="ph-pred-pct">{stats.pct_away}%</span>
									</div>
									<div class="ph-pred-total">{stats.total} pronósticos</div>
								</div>
							{/if}
						{/if}
					</div>
				{/each}
			</div>
		</section>
	{/if}

	<!-- ─── ÚLTIMOS RESULTADOS ─── -->
	{#if finishedMatches.length > 0}
		<section class="section">
			<div class="section-hero-label">Resultados</div>
			<h2 class="section-title">Últimos resultados</h2>

			<div class="ph-results-list">
				{#each finishedMatches as match}
					<div class="ph-result-row card">
						<div class="ph-result-teams">
							<span class="ph-result-team">{flag(match.team_home)} {match.team_home}</span>
							<div class="ph-result-score">
								<span class="ph-score-num">{match.result_home}</span>
								<span class="ph-score-sep">-</span>
								<span class="ph-score-num">{match.result_away}</span>
							</div>
							<span class="ph-result-team ph-result-away">{match.team_away} {flag(match.team_away)}</span>
						</div>
						<div class="ph-result-meta">
							<span class="ph-result-phase">{phaseLabel(match.phase)}</span>
							<span class="ph-result-winner">
								Ganó: <strong>
									{match.winner === 'home' ? match.team_home : match.winner === 'away' ? match.team_away : 'Empate'}
								</strong>
							</span>
						</div>
					</div>
				{/each}
			</div>
		</section>
	{/if}

	<!-- ─── FOOTER ─── -->
	<footer class="ph-footer section">
		<p class="nota">Prode Cíclico · Mundial 2026 · Los resultados se actualizan en tiempo real</p>
	</footer>

</div>

<style>
	/* ─── REHEARSAL ─── */
	.home-rehearsal-banner {
		background: rgba(245,194,0,0.12);
		border-bottom: 1px solid rgba(245,194,0,0.35);
		padding: 10px 24px;
		text-align: center;
		font-family: 'Inter', monospace;
		font-size: 12px;
		letter-spacing: 0.06em;
		color: #7a5f00;
		font-weight: 600;
	}

	/* ─── HOME WRAP ─── */
	.prode-home { min-height: 100vh; }

	/* ─── HERO ─── */
	.ph-hero {
		position: relative;
		padding: 80px 32px;
		background: linear-gradient(135deg, rgba(91,155,213,0.08) 0%, rgba(245,194,0,0.05) 100%);
		border-bottom: 1px solid var(--border);
		overflow: hidden;
	}
	.ph-hero::before {
		content: '';
		position: absolute;
		inset: 0;
		background: url('/background.png') center / cover no-repeat;
		opacity: 0.04;
	}
	.ph-hero-inner {
		position: relative;
		max-width: 700px;
		margin: 0 auto;
		text-align: center;
	}
	.ph-eyebrow {
		font-family: 'Inter', monospace;
		font-size: 11px;
		letter-spacing: 0.2em;
		text-transform: uppercase;
		color: var(--celeste);
		margin-bottom: 12px;
	}
	.ph-hero-title {
		font-family: 'Inter', sans-serif;
		font-size: clamp(40px, 7vw, 72px);
		font-weight: 900;
		letter-spacing: -0.04em;
		line-height: 0.95;
		color: var(--text);
		margin-bottom: 16px;
	}
	.ph-accent { color: var(--celeste); }
	.ph-hero-lead {
		font-size: 16px;
		color: var(--muted);
		margin-bottom: 32px;
		line-height: 1.6;
	}
	.ph-cta {
		display: inline-block;
		font-family: 'Inter', sans-serif;
		font-size: 15px;
		font-weight: 700;
		background: var(--celeste);
		color: #fff;
		text-decoration: none;
		padding: 14px 28px;
		border-radius: 12px;
		transition: background 0.2s, transform 0.15s;
		box-shadow: 0 4px 16px rgba(91,155,213,0.35);
	}
	.ph-cta:hover { background: var(--celeste-dim); transform: translateY(-2px); }

	/* ─── POZO ─── */
	.ph-pozo-section {}
	.ph-pozo-card {
		display: flex;
		flex-direction: column;
		align-items: center;
		text-align: center;
		padding: 40px 32px;
		gap: 8px;
	}
	.ph-pozo-icon { font-size: 40px; }
	.ph-pozo-total {
		font-family: 'DM Mono', monospace;
		font-size: 64px;
		font-weight: 700;
		letter-spacing: -0.04em;
		color: var(--amarillo-dim);
		line-height: 1;
	}
	.ph-pozo-live { animation: pozo-pulse 2s ease-in-out infinite; }
	@keyframes pozo-pulse {
		0%, 100% { opacity: 1; }
		50% { opacity: 0.75; }
	}
	.ph-pozo-label {
		font-family: 'Inter', monospace;
		font-size: 11px;
		letter-spacing: 0.14em;
		text-transform: uppercase;
		color: var(--muted);
	}
	.ph-pozo-badge {
		font-family: 'Inter', monospace;
		font-size: 10px;
		font-weight: 700;
		letter-spacing: 0.2em;
		color: var(--amarillo-dim);
		background: rgba(245,194,0,0.15);
		border: 1px solid rgba(245,194,0,0.4);
		border-radius: 20px;
		padding: 4px 12px;
		margin-top: 4px;
		animation: badge-blink 1.5s ease-in-out infinite;
	}
	@keyframes badge-blink { 0%,100%{opacity:1} 50%{opacity:0.5} }

	/* ─── RANKING ─── */
	.ph-ranking-head {
		display: flex;
		align-items: baseline;
		gap: 12px;
		margin-bottom: 8px;
	}
	.ph-ensayo-tag {
		font-family: 'DM Mono', monospace;
		font-size: 12px;
		color: var(--muted);
	}

	.ph-ranking-list { display: flex; flex-direction: column; gap: 6px; }
	.ph-rank-row {
		display: flex;
		align-items: center;
		gap: 14px;
		padding: 12px 16px;
		border-radius: 10px;
		background: rgba(255,255,255,0.55);
		backdrop-filter: blur(12px);
		border: 1px solid rgba(255,255,255,0.7);
		transition: transform 0.15s, box-shadow 0.15s;
	}
	.ph-rank-row:hover { transform: translateX(4px); box-shadow: 0 4px 16px rgba(91,155,213,0.1); }
	.ph-rank-row.top1 {
		background: rgba(245,194,0,0.08);
		border-color: rgba(245,194,0,0.3);
	}
	.ph-rank-row.top3 { border-left: 3px solid var(--celeste); }
	.ph-rank-pos { font-size: 22px; width: 32px; text-align: center; flex-shrink: 0; }
	.ph-rank-num {
		font-family: 'DM Mono', monospace;
		font-size: 16px;
		font-weight: 700;
		color: var(--muted);
	}
	.ph-rank-avatar { flex-shrink: 0; }
	.ph-rank-avatar img {
		width: 40px; height: 40px;
		border-radius: 50%;
		object-fit: cover;
		border: 2px solid rgba(255,255,255,0.8);
	}
	.ph-rank-avatar-ph {
		width: 40px; height: 40px;
		border-radius: 50%;
		background: linear-gradient(135deg, var(--celeste), var(--celeste-dim));
		color: #fff;
		display: flex;
		align-items: center;
		justify-content: center;
		font-family: 'Inter', sans-serif;
		font-size: 18px;
		font-weight: 800;
	}
	.ph-rank-name {
		flex: 1;
		font-family: 'Instrument Sans', sans-serif;
		font-size: 15px;
		font-weight: 600;
		color: var(--text);
	}
	.ph-rank-pts {
		display: flex;
		align-items: baseline;
		gap: 3px;
		flex-shrink: 0;
	}
	.ph-pts-value {
		font-family: 'DM Mono', monospace;
		font-size: 22px;
		font-weight: 700;
		color: var(--celeste);
	}
	.ph-pts-label {
		font-family: 'DM Mono', monospace;
		font-size: 10px;
		color: var(--muted);
	}

	.ph-toggle-ranking {
		font-family: 'Inter', monospace;
		font-size: 12px;
		letter-spacing: 0.08em;
		background: none;
		border: 1px solid var(--border);
		border-radius: 20px;
		padding: 8px 20px;
		color: var(--muted);
		cursor: pointer;
		transition: all 0.2s;
		margin-top: 8px;
		align-self: center;
	}
	.ph-toggle-ranking:hover { border-color: var(--celeste); color: var(--celeste); }

	/* ─── PARTIDOS ─── */
	.ph-matches-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
		gap: 16px;
	}
	.ph-match-card { padding: 20px; }
	.ph-match-badge-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 12px;
	}
	.ph-match-phase {
		font-family: 'Inter', monospace;
		font-size: 10px;
		letter-spacing: 0.1em;
		text-transform: uppercase;
		color: var(--celeste);
	}
	.ph-match-live {
		font-family: 'Inter', monospace;
		font-size: 10px;
		font-weight: 700;
		color: var(--red);
		animation: blink-live 1s infinite;
	}
	@keyframes blink-live { 0%,100%{opacity:1} 50%{opacity:0.4} }

	.ph-match-teams {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 8px;
		margin-bottom: 8px;
	}
	.ph-mt {
		display: flex;
		align-items: center;
		gap: 6px;
		flex: 1;
	}
	.ph-mt-right { flex-direction: row-reverse; }
	.ph-mt-flag { font-size: 22px; }
	.ph-mt-name {
		font-family: 'Inter', sans-serif;
		font-size: 13px;
		font-weight: 700;
		line-height: 1.2;
	}
	.ph-match-vs {
		font-family: 'DM Mono', monospace;
		font-size: 10px;
		color: var(--muted);
		flex-shrink: 0;
	}
	.ph-match-time {
		font-family: 'DM Mono', monospace;
		font-size: 11px;
		color: var(--muted);
		margin-bottom: 4px;
	}
	.ph-match-venue {
		font-family: 'DM Mono', monospace;
		font-size: 10px;
		color: var(--muted);
		opacity: 0.7;
	}

	/* Barras de pronósticos */
	.ph-pred-bar {
		display: flex;
		flex-direction: column;
		gap: 6px;
		margin-top: 12px;
		padding-top: 12px;
		border-top: 1px solid var(--border);
	}
	.ph-pred-bar-row {
		display: flex;
		align-items: center;
		gap: 8px;
	}
	.ph-pred-team {
		font-family: 'DM Mono', monospace;
		font-size: 10px;
		color: var(--muted);
		width: 60px;
		flex-shrink: 0;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}
	.ph-pred-draw { color: var(--muted); }
	.ph-pred-away { text-align: right; }
	.ph-pred-track {
		flex: 1;
		height: 6px;
		background: rgba(0,0,0,0.06);
		border-radius: 3px;
		overflow: hidden;
	}
	.ph-pred-fill {
		height: 100%;
		border-radius: 3px;
		transition: width 0.5s ease;
	}
	.ph-pred-home { background: var(--celeste); }
	.ph-pred-draw-fill { background: var(--muted); }
	.ph-pred-away-fill { background: var(--amarillo-dim); }
	.ph-pred-pct {
		font-family: 'DM Mono', monospace;
		font-size: 10px;
		color: var(--muted);
		width: 32px;
		text-align: right;
		flex-shrink: 0;
	}
	.ph-pred-total {
		font-family: 'DM Mono', monospace;
		font-size: 9px;
		color: var(--muted);
		text-align: right;
		margin-top: 2px;
	}

	/* ─── RESULTADOS ─── */
	.ph-results-list { display: flex; flex-direction: column; gap: 10px; }
	.ph-result-row { padding: 16px 20px; }
	.ph-result-teams {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 12px;
		flex-wrap: wrap;
		margin-bottom: 8px;
	}
	.ph-result-team {
		font-size: 14px;
		font-weight: 600;
		flex: 1;
	}
	.ph-result-away { text-align: right; }
	.ph-result-score {
		display: flex;
		align-items: center;
		gap: 4px;
		flex-shrink: 0;
	}
	.ph-score-num {
		font-family: 'DM Mono', monospace;
		font-size: 28px;
		font-weight: 700;
		color: var(--text);
		line-height: 1;
	}
	.ph-score-sep {
		font-family: 'DM Mono', monospace;
		font-size: 20px;
		color: var(--muted);
	}
	.ph-result-meta {
		display: flex;
		align-items: center;
		justify-content: space-between;
		flex-wrap: wrap;
		gap: 8px;
	}
	.ph-result-phase {
		font-family: 'Inter', monospace;
		font-size: 10px;
		letter-spacing: 0.1em;
		text-transform: uppercase;
		color: var(--celeste);
	}
	.ph-result-winner { font-size: 13px; color: var(--muted); }

	/* ─── MISC ─── */
	.ph-loading, .ph-empty {
		text-align: center;
		color: var(--muted);
		font-family: 'DM Mono', monospace;
		font-size: 13px;
		padding: 40px;
	}
	.ph-footer { padding-top: 0; }

	/* ─── RESPONSIVE ─── */
	@media (max-width: 640px) {
		.ph-hero { padding: 56px 20px; }
		.ph-matches-grid { grid-template-columns: 1fr; }
		.ph-result-teams { flex-direction: column; text-align: center; }
		.ph-result-away { text-align: center; }
	}
</style>
