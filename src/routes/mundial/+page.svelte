<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { flip } from 'svelte/animate';
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
		went_to_penalties: boolean;
		predictions_open: boolean;
	}

	interface Prediction {
		user_id: string;
		predicted_winner: string;
		predicted_home: number | null;
		predicted_away: number | null;
		has_exact_score: boolean;
		is_correct: boolean | null;
		points_earned: number | null;
	}

	interface RankingDelta {
		player_id: string;
		full_name: string;
		points_earned: number;
		correct: boolean;
	}

	interface RecentMatch {
		id: string;
		team_home: string;
		team_away: string;
		result_home: number | null;
		result_away: number | null;
		kickoff_time: string;
		correctPredictors: string[]; // full_names
	}

	// vote = user_id del jugador cuyo pronóstico apoyan
	type VoteCount = Record<string, number>;

	// ─── ESTADO ───────────────────────────────────────────────────
	let isRehearsalMode = false;
	let currentWeek = 1;
	let pozoStatus = 'closed';
	let pozoTotal = 0;

	let ranking: Player[] = [];
	let positionDeltas: Record<string, number> = {}; // positive = subió, negative = bajó, 0 = igual
	let showAllRanking = false;

	let recentMatches: RecentMatch[] = [];

	// Partidos abiertos para votar
	let openMatches: Match[] = [];
	let matchPreds: Record<string, (Prediction & { full_name: string })[]> = {};
	let matchVotes: Record<string, VoteCount> = {};
	let userVotes: Record<string, string | null> = {};
	let votingLoading = false;
	let expandedMatch: string | null = null;
	let userIp = '';

	let loading = true;
	let realtimeChannels: ReturnType<typeof supabase.channel>[] = [];

	const POSITION_SNAPSHOT_KEY = 'prode_ranking_snapshot';

	// ─── MOUNT ────────────────────────────────────────────────────
	onMount(async () => {
		await fetchIp();
		await loadAll();
		setupRealtime();
		loading = false;
	});

	onDestroy(() => realtimeChannels.forEach((ch) => supabase.removeChannel(ch)));

	async function fetchIp() {
		try {
			const r = await fetch('https://api.ipify.org?format=json');
			const j = await r.json();
			userIp = j.ip ?? '';
		} catch { userIp = ''; }
	}

	async function applyRehearsalPoints(players: Player[]): Promise<Player[]> {
		const byUser: Record<string, number> = {};

		// Pronósticos
		const { data: predPoints } = await supabase
			.from('predictions').select('user_id, points_earned')
			.eq('is_rehearsal', true).not('points_earned', 'is', null);
		for (const p of (predPoints ?? []) as { user_id: string; points_earned: number }[])
			byUser[p.user_id] = (byUser[p.user_id] ?? 0) + (p.points_earned ?? 0);

		// Trivias
		const { data: triviaPoints } = await supabase
			.from('trivia_sessions').select('user_id, points_earned')
			.eq('is_rehearsal', true).eq('status', 'completed').not('points_earned', 'is', null);
		for (const t of (triviaPoints ?? []) as { user_id: string; points_earned: number }[])
			byUser[t.user_id] = (byUser[t.user_id] ?? 0) + (t.points_earned ?? 0);

		// Pozo (no tiene flag de ensayo, solo suma si ganó)
		const { data: pozoPoints } = await supabase
			.from('pozo_attempts').select('user_id, points_received')
			.eq('status', 'won').not('points_received', 'is', null);
		for (const z of (pozoPoints ?? []) as { user_id: string; points_received: number }[])
			byUser[z.user_id] = (byUser[z.user_id] ?? 0) + (z.points_received ?? 0);

		return players
			.map(pl => ({ ...pl, points_total: byUser[pl.id] ?? 0 }))
			.sort((a, b) => b.points_total - a.points_total)
			.map((pl, i) => ({ ...pl, ranking_position: i + 1 }));
	}

	function computeDeltas(newRanking: Player[]) {
		const snapshotRaw = localStorage.getItem(POSITION_SNAPSHOT_KEY);
		const snapshot: Record<string, number> = snapshotRaw ? JSON.parse(snapshotRaw) : {};
		const deltas: Record<string, number> = {};
		for (const p of newRanking) {
			const prev = snapshot[p.id];
			if (prev == null) { deltas[p.id] = 0; continue; }
			const curr = p.ranking_position ?? 999;
			deltas[p.id] = prev - curr; // positive = moved up (lower pos number)
		}
		positionDeltas = deltas;
	}

	function saveSnapshot(r: Player[]) {
		const snap: Record<string, number> = {};
		for (const p of r) snap[p.id] = p.ranking_position ?? 999;
		localStorage.setItem(POSITION_SNAPSHOT_KEY, JSON.stringify(snap));
	}

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
		let rawRanking = (users ?? []) as Player[];

		// En modo ensayo los puntos no se escriben en users.points_total,
		// así que los calculamos en tiempo real desde todas las fuentes.
		if (isRehearsalMode && rawRanking.length > 0) {
			rawRanking = await applyRehearsalPoints(rawRanking);
		}

		computeDeltas(rawRanking);
		saveSnapshot(rawRanking);
		ranking = rawRanking;

		// Últimos 5 partidos terminados
		const { data: finishedM } = await supabase
			.from('matches')
			.select('id, team_home, team_away, result_home, result_away, kickoff_time')
			.eq('status', 'finished')
			.order('kickoff_time', { ascending: false })
			.limit(5);
		if (finishedM && finishedM.length > 0) {
			const finishedIds = finishedM.map((m: any) => m.id);
			const { data: correctPreds } = await supabase
				.from('predictions')
				.select('match_id, user_id, users(full_name)')
				.in('match_id', finishedIds)
				.eq('is_correct', true);
			const byMatch: Record<string, string[]> = {};
			for (const p of (correctPreds ?? []) as any[]) {
				if (!byMatch[p.match_id]) byMatch[p.match_id] = [];
				byMatch[p.match_id].push(p.users?.full_name ?? '?');
			}
			recentMatches = finishedM.map((m: any) => ({
				...m,
				correctPredictors: byMatch[m.id] ?? []
			}));
		}

		// Partidos próximos con pronósticos (abiertos o cerrados)
		const { data: openM } = await supabase
			.from('matches')
			.select('*')
			.neq('status', 'finished')
			.order('kickoff_time');
		const allUpcoming = (openM ?? []) as Match[];

		// Obtener qué partidos tienen al menos un pronóstico
		const { data: matchesWithPreds } = await supabase
			.from('predictions')
			.select('match_id')
			.in('match_id', allUpcoming.map(m => m.id));
		const withPreds = new Set((matchesWithPreds ?? []).map((p: any) => p.match_id));

		openMatches = allUpcoming.filter(m => m.predictions_open || withPreds.has(m.id));

		if (openMatches.length > 0) {
			const ids = openMatches.map(m => m.id);

			// Pronósticos de todos los partidos
			const { data: preds } = await supabase
				.from('predictions')
				.select('match_id, user_id, predicted_winner, predicted_home, predicted_away, has_exact_score, is_correct, points_earned, users(full_name)')
				.in('match_id', ids);
			if (preds) {
				const byMatch: typeof matchPreds = {};
				for (const p of preds as any[]) {
					if (!byMatch[p.match_id]) byMatch[p.match_id] = [];
					byMatch[p.match_id].push({ ...p, full_name: p.users?.full_name ?? '?' });
				}
				matchPreds = byMatch;
			}

			// Votos públicos
			const { data: votes } = await supabase
				.from('public_votes')
				.select('match_id, vote')
				.in('match_id', ids);
			if (votes) {
				const byMatch: typeof matchVotes = {};
				for (const v of votes as any[]) {
					if (!byMatch[v.match_id]) byMatch[v.match_id] = {};
					byMatch[v.match_id][v.vote] = (byMatch[v.match_id][v.vote] ?? 0) + 1;
				}
				matchVotes = byMatch;
			}

			// Voto de esta IP
			if (userIp) {
				const since = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
				const { data: myVotes } = await supabase
					.from('public_votes')
					.select('match_id, vote')
					.in('match_id', ids)
					.eq('ip', userIp)
					.gte('created_at', since);
				const uv: typeof userVotes = {};
				for (const v of myVotes ?? []) uv[(v as any).match_id] = (v as any).vote;
				userVotes = uv;
			}

			// Abrir el primero por defecto
			expandedMatch = openMatches[0].id;
		}
	}

	async function submitVote(matchId: string, vote: string) {
		if (!userIp || userVotes[matchId] || votingLoading) return;
		votingLoading = true;
		const { error } = await supabase.from('public_votes').insert({ match_id: matchId, ip: userIp, vote });
		if (!error) {
			userVotes = { ...userVotes, [matchId]: vote };
			const { data } = await supabase.from('public_votes').select('vote').eq('match_id', matchId);
			const counts: VoteCount = {};
			for (const v of data ?? []) counts[(v as any).vote] = (counts[(v as any).vote] ?? 0) + 1;
			matchVotes = { ...matchVotes, [matchId]: counts };
		}
		votingLoading = false;
	}

	async function animateRanking() {
		const { data } = await supabase
			.from('users')
			.select('id, full_name, username, avatar_url, points_total, ranking_position')
			.eq('is_active', true)
			.eq('is_admin', false)
			.order('ranking_position', { ascending: true, nullsFirst: false });
		let newRanking = (data ?? []) as Player[];

		if (isRehearsalMode && newRanking.length > 0) {
			newRanking = await applyRehearsalPoints(newRanking);
		}

		computeDeltas(newRanking);
		saveSnapshot(newRanking);
		ranking = newRanking;
	}

	function setupRealtime() {
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

		// Escucha el broadcast del admin para animar
		const broadcastCh = supabase
			.channel('prode-broadcast')
			.on('broadcast', { event: 'animate_ranking' }, () => {
				animateRanking();
			})
			.subscribe();

		const vozCh = supabase
			.channel('home-votes')
			.on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'public_votes' }, async (payload) => {
				const matchId = (payload.new as any)?.match_id;
				if (!matchId) return;
				const { data } = await supabase.from('public_votes').select('vote').eq('match_id', matchId);
				const counts: VoteCount = {};
				for (const v of data ?? []) counts[(v as any).vote] = (counts[(v as any).vote] ?? 0) + 1;
				matchVotes = { ...matchVotes, [matchId]: counts };
			})
			.subscribe();

		realtimeChannels = [rankingCh, broadcastCh, vozCh];
	}

	function phaseLabel(phase: string): string {
		const map: Record<string, string> = {
			groups: 'Grupos', r32: '32avos', r16: 'Octavos',
			qf: 'Cuartos', sf: 'Semis', '3rd': '3er puesto', final: 'Final'
		};
		return map[phase] ?? phase;
	}

	function predLabel(pred: string, match: Match): string {
		if (pred === 'home') return match.team_home;
		if (pred === 'away') return match.team_away;
		return 'Empate';
	}

	function deltaArrow(delta: number): string {
		if (delta > 0) return '↑';
		if (delta < 0) return '↓';
		return '=';
	}

	function deltaClass(delta: number): string {
		if (delta > 0) return 'delta-up';
		if (delta < 0) return 'delta-down';
		return 'delta-same';
	}

	// Filtrar jugadores: si alguien tiene puntos, ocultar los que tienen 0
	$: anyHasPoints = ranking.some(p => (p.points_total ?? 0) > 0);
	$: visibleRanking = anyHasPoints
		? ranking.filter(p => (p.points_total ?? 0) > 0)
		: ranking;
	$: displayRanking = showAllRanking ? visibleRanking : visibleRanking.slice(0, 12);

	function totalVotesFor(matchId: string) {
		return Object.values(matchVotes[matchId] ?? {}).reduce((s, n) => s + n, 0);
	}
</script>

<svelte:head>
	<title>El Prode de Cíclico — Mundial 2026</title>
	<meta name="description" content="Ranking, resultados y pronósticos del Prode Cíclico del Mundial 2026" />
	<link rel="icon" type="image/png" href="/Logos-CICLICO-Mundial.png" />
</svelte:head>

{#if isRehearsalMode}
	<div class="rehearsal-banner">⚠️ MODO ENSAYO — Los puntos no cuentan todavía</div>
{/if}

<div class="prode-page">
	{#if loading}
		<div class="prode-loading">Cargando...</div>
	{:else}
		<div class="prode-grid">

			<!-- ── 1/3 IZQUIERDA: RANKING blanco ── -->
			<aside class="prode-ranking">
				<div class="prode-ranking-header">
					<div>
						<div class="prode-ranking-title">Tabla de<br>posiciones</div>
						<div class="prode-ranking-legend">
							Ranking de pronósticos del equipo Cíclico.
							<span class="legend-live">Se actualiza en vivo!!</span>
						</div>
					</div>
					{#if isRehearsalMode}<span class="prode-ensayo-tag">ENSAYO</span>{/if}
				</div>

				{#if displayRanking.length === 0}
					<p class="prode-empty">Sin puntos todavía</p>
				{:else}
					<div class="prode-ranking-grid">
						{#each displayRanking as player, i (player.id)}
							{@const delta = positionDeltas[player.id] ?? 0}
							<div class="pr-item"
								class:pr-podio={i < 3}
								class:pr-row={i >= 3}
								class:gold={i===0} class:silver={i===1} class:bronze={i===2}
								style={i===0 ? 'order:2' : i===1 ? 'order:1' : i===2 ? 'order:3' : ''}
								animate:flip={{ duration: 1400 }}>
								{#if i < 3}
									<div class="pr-star pr-star-{i+1}">★{i===0?'1':i===1?'2':'3'}</div>
									<div class="pr-avatar">
										{#if player.avatar_url}
											<img src={player.avatar_url} alt={player.full_name} />
										{:else}
											<div class="pr-av-ph">{player.full_name.charAt(0)}</div>
										{/if}
									</div>
									<div class="pr-name">{player.full_name.split(' ')[0]}</div>
									<div class="pr-pts">{player.points_total ?? 0}<span class="pr-pts-lbl">&nbsp;pts</span></div>
									<span class="pr-delta {deltaClass(delta)}">{deltaArrow(delta)}</span>
								{:else}
									<span class="pr-pos">{i + 1}</span>
									<div class="pr-av-sm">
										{#if player.avatar_url}
											<img src={player.avatar_url} alt={player.full_name} />
										{:else}
											<div class="pr-av-sm-ph">{player.full_name.charAt(0)}</div>
										{/if}
									</div>
									<span class="pr-fullname">{player.full_name}</span>
									<span class="pr-pts">{player.points_total ?? 0}<span class="pr-pts-lbl">&nbsp;pts</span></span>
									<span class="pr-delta {deltaClass(delta)}">{deltaArrow(delta)}</span>
								{/if}
							</div>
						{/each}
					</div>
					{#if visibleRanking.length > 12}
						<button class="prode-toggle-btn" on:click={() => showAllRanking = !showAllRanking}>
							{showAllRanking ? '↑ Ver menos' : `Ver todos (${visibleRanking.length}) ↓`}
						</button>
					{/if}
				{/if}

				<!-- Card últimos 5 partidos -->
				{#if recentMatches.length > 0}
					<div class="prode-recent">
						<div class="prode-recent-eyebrow">¿Quiénes la pegaron?</div>
						<div class="prode-recent-subtitle">Listado de jugadores que acertaron · últimos 5 partidos</div>
						{#each recentMatches as rm}
							<div class="prode-recent-row">
								<span class="prode-recent-teams">
									{flag(rm.team_home)} {rm.team_home} {rm.result_home}-{rm.result_away} {rm.team_away} {flag(rm.team_away)}
								</span>
								{#if rm.correctPredictors.length > 0}
									<span class="prode-recent-hits">{rm.correctPredictors.join(' · ')}</span>
								{:else}
									<span class="prode-recent-miss">Nadie la pegó, ¡Increíble!</span>
								{/if}
							</div>
						{/each}
					</div>
				{/if}

				<div class="prode-ranking-footer">
					¿Sos jugador? <a href="/mundial/jugador/login">Ingresá acá</a>
				</div>
			</aside>

			<!-- ── 2/3 DERECHA ── -->
			<div class="prode-right">

				<!-- HERO: top 1/3 del lado derecho -->
				<div class="prode-hero">
					<div class="prode-hero-eyebrow">PRODE CÍCLICO · MUNDIAL 2026</div>
					<h1 class="prode-hero-title">El Prode de Cíclico</h1>
				</div>

				<!-- BOTTOM: 2/3 inferior derecha -->
				<div class="prode-bottom">

					<!-- PARTIDOS -->
					<div class="prode-matches">
						<div class="prode-matches-header">
							<h2 class="prode-matches-title">Próximos partidos</h2>
							<p class="prode-matches-desc">
								Descubrí cómo están los pronósticos de los próximos partidos y votá apoyando resultados.<br>
								¿A quién bancás? Por cada voto, el jugador suma 5 puntos por la confianza del público.
							</p>
						</div>
						{#if openMatches.length === 0}
							<p class="prode-no-matches">Sin partidos abiertos para votar ahora</p>
						{:else}
							{#each openMatches as match}
								{@const isOpen = expandedMatch === match.id}
								{@const preds = matchPreds[match.id] ?? []}
								{@const votes = matchVotes[match.id] ?? {}}
								{@const myVote = userVotes[match.id] ?? null}
								{@const total = totalVotesFor(match.id)}

								<div class="pm-card" class:pm-open={isOpen}>
									<button class="pm-header" on:click={() => expandedMatch = isOpen ? null : match.id}>
										<div class="pm-teams">
											<span class="pm-flag">{flag(match.team_home)}</span>
											<span class="pm-team">{match.team_home}</span>
											<span class="pm-vs">vs</span>
											<span class="pm-team">{match.team_away}</span>
											<span class="pm-flag">{flag(match.team_away)}</span>
										</div>
										<div class="pm-meta">
											<span class="pm-time">{formatDateAR(match.kickoff_time)}</span>
											<span class="pm-chevron">{isOpen ? '▲' : '▼'}</span>
										</div>
									</button>

									{#if isOpen}
										<div class="pm-preds">
											{#if preds.length === 0}
												<p class="pm-empty-preds">Sin pronósticos cargados</p>
											{:else}
												<div class="pm-preds-label">Votos del público</div>
												<div class="pm-preds-list">
													{#each preds as pred}
														{@const v = votes[pred.user_id] ?? 0}
														{@const pct = total ? Math.round(v / total * 100) : 0}
														{@const isMyVote = myVote === pred.user_id}
														<button
															class="pm-vote-btn"
															class:pm-voted={isMyVote}
															class:pm-dimmed={!!myVote && !isMyVote}
															disabled={!!myVote || votingLoading}
															on:click={() => submitVote(match.id, pred.user_id)}
														>
															<div class="pm-vb-top">
																<span class="pm-vb-name">{pred.full_name}</span>
																<span class="pm-vb-pick">→ {predLabel(pred.predicted_winner, match)}{pred.has_exact_score ? ` ${pred.predicted_home}-${pred.predicted_away}` : ''}</span>
															</div>
															{#if total > 0}
																<div class="pm-bar-wrap"><div class="pm-bar" style="width:{pct}%"></div></div>
																<div class="pm-pct">{pct}% · {v} {v === 1 ? 'voto' : 'votos'}</div>
															{/if}
														</button>
													{/each}
												</div>
												<p class="pm-vote-note">
													{#if myVote}{total} {total === 1 ? 'voto' : 'votos'} en total
													{:else}Tocá un pronóstico · 1 voto por 24 hs{/if}
												</p>
											{/if}
										</div>
									{/if}
								</div>
							{/each}
						{/if}
					</div>

					<!-- POZO -->
					<div class="prode-pozo" class:prode-pozo-live={pozoStatus === 'open'}>
						<div class="prode-pozo-inner">
							<div class="prode-pozo-label">El Pozo</div>
							<div class="prode-pozo-total">{pozoTotal.toLocaleString('es-AR')}</div>
							<div class="prode-pozo-unit">pts</div>
							{#if pozoStatus === 'open'}
								<div class="prode-pozo-badge">EN JUEGO</div>
							{:else if pozoStatus === 'revealed'}
								<div class="prode-pozo-badge prode-pozo-revealed">🏆</div>
							{/if}
						</div>
					</div>

				</div>
			</div>
		</div>
	{/if}
</div>

<style>
	/* ── BANNER ENSAYO ── */
	.rehearsal-banner {
		background: rgba(245,194,0,0.12);
		border-bottom: 1px solid rgba(245,194,0,0.35);
		padding: 8px 24px;
		text-align: center;
		font-family: 'Inter', monospace;
		font-size: 11px; letter-spacing: 0.06em;
		color: #7a5f00; font-weight: 600;
	}

	/* ── PAGE SHELL ── */
	.prode-page { height: calc(100dvh - 60px); display: flex; flex-direction: column; overflow: hidden; }
	.prode-loading { flex: 1; display: flex; align-items: center; justify-content: center; color: rgba(255,255,255,0.5); font-size: 14px; }

	/* ── GRID 1/3 + 2/3 ── */
	.prode-grid {
		flex: 1;
		display: grid;
		grid-template-columns: 1fr 2fr;
		overflow: hidden;
	}

	/* ── COLUMNA IZQUIERDA: RANKING azul oscuro ── */
	.prode-ranking {
		background: #0d1f3c;
		display: flex; flex-direction: column;
		padding: 24px 20px 20px;
		overflow-y: auto;
		gap: 0;
	}
	.prode-ranking-header {
		display: flex; align-items: flex-start; justify-content: space-between; gap: 8px;
		margin-bottom: 18px;
	}
	.prode-ranking-title {
		font-family: 'Inter', sans-serif;
		font-size: 22px; font-weight: 900;
		letter-spacing: -0.03em; line-height: 1.1;
		color: #fff;
		margin-bottom: 6px;
	}
	.prode-ranking-legend {
		font-family: 'Instrument Sans', sans-serif;
		font-size: 11px; color: rgba(255,255,255,0.45); line-height: 1.4;
	}
	.legend-live {
		font-weight: 700; color: rgba(255,255,255,0.75);
	}
	.prode-ensayo-tag {
		font-size: 9px; font-weight: 700;
		background: rgba(245,194,0,0.2); color: #f5c200;
		border-radius: 20px; padding: 2px 8px;
		font-family: 'Inter', monospace; letter-spacing: 0.06em;
		white-space: nowrap; flex-shrink: 0;
	}
	.prode-empty { text-align: center; color: rgba(255,255,255,0.4); font-size: 13px; padding: 20px 0; }

	/* RANKING GRID: podio 3 cols + filas full */
	.prode-ranking-grid {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 6px;
		margin-bottom: 8px;
		align-items: end;
	}
	.pr-item { }
	.pr-podio {
		display: flex; flex-direction: column; align-items: center;
		gap: 4px; padding: 8px 4px;
		border-radius: 10px; text-align: center;
		background: rgba(255,255,255,0.07);
		border: 1px solid rgba(255,255,255,0.1);
		position: relative;
	}
	/* orden: plata izq (order:1), oro centro (order:2), bronce der (order:3) */
	.pr-podio.gold   { background: rgba(245,194,0,0.12); border-color: rgba(245,194,0,0.35); margin-bottom: 18px; }
	.pr-podio.silver { background: rgba(180,190,210,0.08); }
	.pr-podio.bronze { background: rgba(180,120,60,0.08); }
	.pr-row {
		grid-column: 1 / -1;
		order: 10;
		display: flex; align-items: center; gap: 8px;
		padding: 6px 10px; border-radius: 8px;
		background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.08);
		transition: background 0.15s;
	}
	.pr-row:hover { background: rgba(255,255,255,0.09); }

	.pr-medal { font-size: 16px; }
	.pr-star {
		font-family: 'DM Mono', monospace; font-weight: 900;
		font-size: 13px; line-height: 1;
	}
	.pr-star-1 { color: #f5c200; font-size: 15px; }
	.pr-star-2 { color: #b0bec5; }
	.pr-star-3 { color: #c8936a; }
	.pr-avatar img, .pr-av-ph {
		width: 34px; height: 34px; border-radius: 50%;
	}
	.pr-av-ph {
		background: linear-gradient(135deg, #3b7dd8, #1a4fa0);
		color: #fff; display: flex; align-items: center; justify-content: center;
		font-family: 'Inter', sans-serif; font-size: 15px; font-weight: 800;
	}
	.pr-avatar img { object-fit: cover; border: 2px solid rgba(255,255,255,0.2); }
	.pr-name {
		font-family: 'Instrument Sans', sans-serif;
		font-size: 10px; font-weight: 700; color: rgba(255,255,255,0.9);
		white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 68px;
	}
	.pr-pts {
		font-family: 'DM Mono', monospace;
		font-size: 15px; font-weight: 700; color: #f5c200;
	}
	.pr-pts-lbl { font-size: 9px; color: rgba(255,255,255,0.35); font-weight: 400; }

	/* Flechas de delta */
	.pr-delta {
		font-size: 11px; font-weight: 700; font-family: 'DM Mono', monospace;
		line-height: 1;
	}
	.delta-up   { color: #22c55e; }
	.delta-down { color: #ef4444; }
	.delta-same { color: #aaa; font-size: 10px; }

	.pr-av-sm img, .pr-av-sm-ph {
		width: 24px; height: 24px; border-radius: 50%; flex-shrink: 0;
	}
	.pr-av-sm-ph {
		background: linear-gradient(135deg, #3b7dd8, #1a4fa0);
		color: #fff; display: flex; align-items: center; justify-content: center;
		font-size: 10px; font-weight: 800;
	}
	.pr-av-sm img { object-fit: cover; }
	.pr-pos {
		font-family: 'DM Mono', monospace; font-size: 11px; font-weight: 700;
		color: rgba(255,255,255,0.3); width: 16px; text-align: center; flex-shrink: 0;
	}
	.pr-fullname {
		flex: 1; font-family: 'Instrument Sans', sans-serif;
		font-size: 12px; font-weight: 600; color: rgba(255,255,255,0.85);
		white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
	}

	.prode-toggle-btn {
		font-family: 'Inter', monospace; font-size: 10px; letter-spacing: 0.08em;
		background: none; border: 1px solid rgba(255,255,255,0.15);
		border-radius: 20px; padding: 5px 14px;
		color: rgba(255,255,255,0.4); cursor: pointer; transition: all 0.2s;
		margin-top: 6px; align-self: center; display: block;
	}
	.prode-toggle-btn:hover { border-color: rgba(255,255,255,0.4); color: rgba(255,255,255,0.8); }

	/* Últimos resultados */
	.prode-recent {
		margin-top: 16px;
		background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1);
		border-radius: 10px; padding: 14px 14px 10px;
		display: flex; flex-direction: column; gap: 0;
	}
	.prode-recent-eyebrow {
		font-family: 'Inter', sans-serif; font-size: 13px; font-weight: 800;
		color: #fff; margin-bottom: 2px;
	}
	.prode-recent-subtitle {
		font-family: 'Instrument Sans', sans-serif; font-size: 10px;
		color: rgba(255,255,255,0.4); margin-bottom: 10px;
	}
	.prode-recent-row {
		display: flex; flex-direction: column; gap: 2px;
		padding: 6px 0; border-bottom: 1px solid rgba(255,255,255,0.06);
	}
	.prode-recent-row:last-child { border-bottom: none; }
	.prode-recent-teams {
		font-family: 'DM Mono', monospace; font-size: 10px;
		color: rgba(255,255,255,0.6); font-weight: 700;
	}
	.prode-recent-hits {
		font-family: 'Instrument Sans', sans-serif; font-size: 11px;
		color: #f5c200; font-weight: 700;
	}
	.prode-recent-miss {
		font-family: 'Instrument Sans', sans-serif; font-size: 10px;
		color: rgba(255,255,255,0.3); font-style: italic;
	}

	.prode-ranking-footer {
		margin-top: auto; padding-top: 16px;
		font-size: 11px; color: rgba(255,255,255,0.3); text-align: center;
	}
	.prode-ranking-footer a { color: rgba(255,255,255,0.65); text-decoration: none; font-weight: 600; }
	.prode-ranking-footer a:hover { color: #fff; text-decoration: underline; }

	/* ── COLUMNA DERECHA 2/3 ── */
	.prode-right {
		display: grid;
		grid-template-rows: 1fr 2fr;
		overflow: hidden;
	}

	/* HERO: top 1/3 */
	.prode-hero {
		display: flex; flex-direction: column; align-items: flex-start; justify-content: center;
		padding: 0 40px;
	}
	.prode-hero-eyebrow {
		font-family: 'Inter', monospace; font-size: 11px;
		letter-spacing: 0.2em; text-transform: uppercase;
		color: rgba(255,255,255,0.5); margin-bottom: 10px;
	}
	.prode-hero-title {
		font-family: 'Inter', sans-serif;
		font-size: clamp(28px, 3.5vw, 52px);
		font-weight: 900; letter-spacing: -0.04em;
		color: #fff; margin: 0; line-height: 1.05;
	}

	/* BOTTOM: 2/3 inferior = matches + pozo */
	.prode-bottom {
		display: flex; gap: 0;
		overflow: hidden;
	}

	/* MATCHES */
	.prode-matches {
		flex: 9;
		background: #0d1f3c;
		overflow-y: auto;
		padding: 16px 20px;
		display: flex; flex-direction: column; gap: 6px;
	}
	.prode-matches-header { margin-bottom: 6px; }
	.prode-matches-title {
		font-family: 'Inter', sans-serif; font-size: 30px; font-weight: 900;
		letter-spacing: -0.03em; color: #fff; margin: 0 0 6px;
	}
	.prode-matches-desc {
		font-family: 'Instrument Sans', sans-serif; font-size: 12px;
		color: rgba(255,255,255,0.6); margin: 0; line-height: 1.5;
	}
	.prode-no-matches {
		color: rgba(255,255,255,0.4); font-size: 13px;
		text-align: center; padding: 20px 0;
	}

	/* MATCH CARD — sin overflow:hidden para que el desplegable no se corte */
	.pm-card {
		border-radius: 8px;
		background: rgba(255,255,255,0.06);
		border: 1px solid rgba(255,255,255,0.1);
		transition: border-color 0.2s;
	}
	.pm-card.pm-open { border-color: rgba(91,155,213,0.5); }

	.pm-header {
		width: 100%; background: none; border: none; cursor: pointer;
		display: flex; align-items: center; justify-content: space-between;
		padding: 10px 14px; gap: 8px; text-align: left;
	}
	.pm-header:hover { background: rgba(255,255,255,0.04); border-radius: 8px; }
	.pm-teams { display: flex; align-items: center; gap: 6px; flex: 1; min-width: 0; }
	.pm-flag { font-size: 16px; flex-shrink: 0; }
	.pm-team {
		font-family: 'Inter', sans-serif; font-size: 13px; font-weight: 700;
		color: #fff; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
	}
	.pm-vs { font-family: 'DM Mono', monospace; font-size: 10px; color: rgba(255,255,255,0.35); flex-shrink: 0; }
	.pm-meta { display: flex; align-items: center; gap: 8px; flex-shrink: 0; }
	.pm-time { font-family: 'DM Mono', monospace; font-size: 10px; color: rgba(255,255,255,0.4); white-space: nowrap; }
	.pm-chevron { font-size: 9px; color: rgba(255,255,255,0.35); }

	/* PREDS AREA */
	.pm-preds {
		padding: 10px 14px 14px;
		border-top: 1px solid rgba(255,255,255,0.08);
		display: flex; flex-direction: column; gap: 6px;
	}
	.pm-preds-label {
		font-family: 'Inter', monospace; font-size: 10px; letter-spacing: 0.1em;
		text-transform: uppercase; color: rgba(255,255,255,0.4); margin-bottom: 4px;
	}
	/* 3 columnas */
	.pm-preds-list {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 6px;
	}
	.pm-empty-preds { color: rgba(255,255,255,0.3); font-size: 12px; }

	/* VOTE BUTTON */
	.pm-vote-btn {
		width: 100%; text-align: left;
		background: #fff; border: 2px solid #fff;
		border-radius: 7px; padding: 6px 10px;
		cursor: pointer; transition: all 0.2s;
		color: #1a2a40;
	}
	.pm-vote-btn:hover:not(:disabled) { background: #f0f4ff; border-color: #d0dbf5; }
	.pm-vote-btn.pm-voted {
		background: var(--celeste, #5b9bd5);
		border-color: var(--celeste, #5b9bd5);
		color: #fff;
	}
	.pm-vote-btn.pm-dimmed { opacity: 0.45; }
	.pm-vote-btn:disabled { cursor: default; }

	.pm-vb-top {
		display: flex; align-items: baseline; justify-content: space-between;
		gap: 6px; margin-bottom: 3px;
	}
	.pm-vb-name { font-family: 'Instrument Sans', sans-serif; font-size: 12px; font-weight: 700; flex: 1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
	.pm-vb-pick { font-family: 'DM Mono', monospace; font-size: 10px; font-weight: 700; opacity: 0.6; white-space: nowrap; flex-shrink: 0; }
	.pm-voted .pm-vb-pick { opacity: 0.9; }
	.pm-bar-wrap { height: 3px; background: rgba(0,0,0,0.1); border-radius: 2px; overflow: hidden; margin-bottom: 3px; }
	.pm-voted .pm-bar-wrap { background: rgba(255,255,255,0.2); }
	.pm-bar { height: 100%; background: #1a4fa0; border-radius: 2px; transition: width 0.5s ease; }
	.pm-voted .pm-bar { background: rgba(255,255,255,0.7); }
	.pm-pct { font-family: 'DM Mono', monospace; font-size: 9px; color: rgba(0,0,0,0.4); }
	.pm-voted .pm-pct { color: rgba(255,255,255,0.7); }
	.pm-vote-note { font-size: 11px; color: rgba(255,255,255,0.35); text-align: center; margin: 4px 0 0; }

	/* POZO: compacto arriba */
	.prode-pozo {
		flex: 1;
		background: #0a1628;
		display: flex; align-items: flex-start; justify-content: center;
		border-left: 1px solid rgba(255,255,255,0.08);
		padding-top: 24px;
	}
	.prode-pozo-inner {
		display: flex; flex-direction: column; align-items: center;
		gap: 4px; padding: 16px 8px; text-align: center;
	}
	.prode-pozo-label {
		font-family: 'Inter', monospace; font-size: 9px; font-weight: 700;
		letter-spacing: 0.14em; text-transform: uppercase; color: rgba(255,255,255,0.4);
	}
	.prode-pozo-total {
		font-family: 'DM Mono', monospace;
		font-size: clamp(18px, 2vw, 28px); font-weight: 700;
		letter-spacing: -0.03em; color: #f5c200; line-height: 1;
	}
	.prode-pozo-unit { font-family: 'DM Mono', monospace; font-size: 10px; color: rgba(255,255,255,0.3); }
	.prode-pozo-live .prode-pozo-total { animation: pozo-pulse 2s ease-in-out infinite; }
	@keyframes pozo-pulse { 0%,100%{opacity:1} 50%{opacity:0.6} }
	.prode-pozo-badge {
		font-family: 'Inter', monospace; font-size: 8px; font-weight: 700;
		letter-spacing: 0.12em; color: #f5c200;
		background: rgba(245,194,0,0.15); border: 1px solid rgba(245,194,0,0.35);
		border-radius: 20px; padding: 2px 8px; margin-top: 2px;
		animation: badge-blink 1.5s ease-in-out infinite;
	}
	.prode-pozo-revealed { color: #3dd68c; background: rgba(61,214,140,0.1); border-color: rgba(61,214,140,0.3); animation: none; }
	@keyframes badge-blink { 0%,100%{opacity:1} 50%{opacity:0.45} }

	/* ── MOBILE ── */
	@media (max-width: 860px) {
		.prode-page { height: auto; overflow: auto; }
		.prode-grid { grid-template-columns: 1fr; height: auto; }
		.prode-right { grid-template-rows: auto auto; }
		.prode-hero { padding: 32px 24px 20px; }
		.prode-bottom { flex-direction: column; }
		.prode-matches { flex: none; }
		.pm-preds-list { grid-template-columns: repeat(2, 1fr); }
		.prode-pozo { flex: none; flex-direction: row; border-left: none; border-top: 1px solid rgba(255,255,255,0.08); padding: 16px 24px; align-items: center; }
		.prode-pozo-inner { flex-direction: row; gap: 10px; }
	}
</style>
