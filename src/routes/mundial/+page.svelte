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

	interface VoteCount {
		home: number;
		draw: number;
		away: number;
	}

	// ─── ESTADO ───────────────────────────────────────────────────
	let isRehearsalMode = false;
	let currentWeek = 1;
	let pozoStatus = 'closed';
	let pozoTotal = 0;

	let ranking: Player[] = [];
	let showAllRanking = false;

	// Partido del día (terminados hoy)
	let todayFinished: Match[] = [];
	let todayDeltas: RankingDelta[] = [];

	// Próximo partido + pronósticos + votos
	let nextMatch: Match | null = null;
	let nextMatchPreds: (Prediction & { full_name: string })[] = [];
	let voteCount: VoteCount = { home: 0, draw: 0, away: 0 };
	let userVote: string | null = null;
	let votingLoading = false;
	let userIp = '';

	let loading = true;
	let realtimeChannels: ReturnType<typeof supabase.channel>[] = [];

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

		// Partidos terminados HOY (en ART)
		const nowArt = new Date(Date.now() - 3 * 3600 * 1000);
		const todayStart = new Date(nowArt);
		todayStart.setUTCHours(3, 0, 0, 0); // medianoche ART = 03:00 UTC
		const { data: todayF } = await supabase
			.from('matches')
			.select('*')
			.eq('status', 'finished')
			.gte('kickoff_time', todayStart.toISOString())
			.order('kickoff_time', { ascending: false });
		todayFinished = (todayF ?? []) as Match[];

		// Deltas de puntos de los partidos de hoy
		if (todayFinished.length > 0) {
			const matchIds = todayFinished.map(m => m.id);
			const { data: preds } = await supabase
				.from('predictions')
				.select('user_id, points_earned, is_correct, users(full_name)')
				.in('match_id', matchIds)
				.not('points_earned', 'is', null);
			if (preds) {
				const byPlayer: Record<string, RankingDelta> = {};
				for (const p of preds as any[]) {
					const id = p.user_id;
					if (!byPlayer[id]) byPlayer[id] = { player_id: id, full_name: p.users?.full_name ?? '?', points_earned: 0, correct: false };
					byPlayer[id].points_earned += p.points_earned ?? 0;
					if (p.is_correct) byPlayer[id].correct = true;
				}
				todayDeltas = Object.values(byPlayer).sort((a, b) => b.points_earned - a.points_earned);
			}
		}

		// Próximo partido
		const { data: upcoming } = await supabase
			.from('matches')
			.select('*')
			.neq('status', 'finished')
			.order('kickoff_time')
			.limit(1);
		nextMatch = upcoming?.[0] ?? null;

		if (nextMatch) {
			// Pronósticos del próximo partido
			const { data: preds } = await supabase
				.from('predictions')
				.select('user_id, predicted_winner, predicted_home, predicted_away, has_exact_score, is_correct, points_earned, users(full_name)')
				.eq('match_id', nextMatch.id);
			nextMatchPreds = (preds ?? []).map((p: any) => ({ ...p, full_name: p.users?.full_name ?? '?' }));

			// Conteo de votos públicos
			await loadVotes();

			// Verificar si ya votó esta IP
			if (userIp) {
				const since = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
				const { data: myVote } = await supabase
					.from('public_votes')
					.select('vote')
					.eq('match_id', nextMatch.id)
					.eq('ip', userIp)
					.gte('created_at', since)
					.limit(1);
				userVote = myVote?.[0]?.vote ?? null;
			}
		}
	}

	async function loadVotes() {
		if (!nextMatch) return;
		const { data } = await supabase
			.from('public_votes')
			.select('vote')
			.eq('match_id', nextMatch.id);
		voteCount = { home: 0, draw: 0, away: 0 };
		for (const v of data ?? []) {
			if (v.vote === 'home') voteCount.home++;
			else if (v.vote === 'draw') voteCount.draw++;
			else if (v.vote === 'away') voteCount.away++;
		}
		voteCount = { ...voteCount };
	}

	async function submitVote(vote: string) {
		if (!nextMatch || !userIp || userVote || votingLoading) return;
		votingLoading = true;
		const { error } = await supabase.from('public_votes').insert({
			match_id: nextMatch.id,
			ip: userIp,
			vote
		});
		if (!error) {
			userVote = vote;
			await loadVotes();
		}
		votingLoading = false;
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

		const vozCh = supabase
			.channel('home-votes')
			.on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'public_votes' }, () => {
				loadVotes();
			})
			.subscribe();

		realtimeChannels = [rankingCh, vozCh];
	}

	function phaseLabel(phase: string): string {
		const map: Record<string, string> = {
			groups: 'Grupos', r32: '32avos', r16: 'Octavos',
			qf: 'Cuartos', sf: 'Semis', '3rd': '3er puesto', final: 'Final'
		};
		return map[phase] ?? phase;
	}

	function winnerName(match: Match): string {
		if (match.winner === 'home') return match.team_home;
		if (match.winner === 'away') return match.team_away;
		return 'Empate';
	}

	function predLabel(pred: string, match: Match): string {
		if (pred === 'home') return match.team_home;
		if (pred === 'away') return match.team_away;
		return 'Empate';
	}

	$: top3 = ranking.slice(0, 3);
	$: rest = ranking.slice(3);
	$: totalVotes = voteCount.home + voteCount.draw + voteCount.away;
	$: votePctHome = totalVotes ? Math.round(voteCount.home / totalVotes * 100) : 0;
	$: votePctDraw = totalVotes ? Math.round(voteCount.draw / totalVotes * 100) : 0;
	$: votePctAway = totalVotes ? Math.round(voteCount.away / totalVotes * 100) : 0;
</script>

<svelte:head>
	<title>El Prode de Cíclico — Mundial 2026</title>
	<meta name="description" content="Ranking, resultados y pronósticos del Prode Cíclico del Mundial 2026" />
</svelte:head>

{#if isRehearsalMode}
	<div class="rehearsal-banner">⚠️ MODO ENSAYO — Los puntos no cuentan todavía</div>
{/if}

<div class="prode-home">

	<!-- TÍTULO -->
	<div class="ph-title-wrap">
		<div class="ph-eyebrow">PRODE CÍCLICO · MUNDIAL 2026</div>
		<h1 class="ph-title">El Prode de Cíclico</h1>
	</div>

	{#if loading}
		<div class="ph-loading">Cargando...</div>
	{:else}
		<div class="ph-layout">

			<!-- ── COLUMNA IZQUIERDA: SCOREBOARD ── -->
			<aside class="ph-sidebar">
				<div class="ph-sidebar-inner card">
					<div class="ph-sb-label">
						Tabla de posiciones
						{#if isRehearsalMode}<span class="ph-ensayo-tag">ENSAYO</span>{/if}
					</div>

					{#if ranking.length === 0}
						<p class="ph-empty">Sin puntos todavía</p>
					{:else}
						<!-- Podio top 3 -->
						<div class="ph-podio">
							{#each top3 as player, i}
								<div class="ph-podio-item" class:gold={i===0} class:silver={i===1} class:bronze={i===2}>
									<div class="ph-podio-medal">{i===0?'🥇':i===1?'🥈':'🥉'}</div>
									<div class="ph-podio-avatar">
										{#if player.avatar_url}
											<img src={player.avatar_url} alt={player.full_name} />
										{:else}
											<div class="ph-av-ph">{player.full_name.charAt(0)}</div>
										{/if}
									</div>
									<div class="ph-podio-name">{player.full_name.split(' ')[0]}</div>
									<div class="ph-podio-pts">{player.points_total ?? 0}<span class="ph-pts-lbl"> pts</span></div>
								</div>
							{/each}
						</div>

						<!-- Resto del ranking -->
						{#if rest.length > 0}
							<div class="ph-rank-rest">
								{#each (showAllRanking ? rest : rest.slice(0, 5)) as player}
									<div class="ph-rank-row">
										<span class="ph-rank-pos">{player.ranking_position ?? '—'}</span>
										<div class="ph-rank-av-sm">
											{#if player.avatar_url}
												<img src={player.avatar_url} alt={player.full_name} />
											{:else}
												<div class="ph-av-sm-ph">{player.full_name.charAt(0)}</div>
											{/if}
										</div>
										<span class="ph-rank-name">{player.full_name}</span>
										<span class="ph-rank-pts">{player.points_total ?? 0}<span class="ph-pts-lbl"> pts</span></span>
									</div>
								{/each}
								{#if rest.length > 5}
									<button class="ph-toggle-btn" on:click={() => showAllRanking = !showAllRanking}>
										{showAllRanking ? '↑ Ver menos' : `Ver todos (${ranking.length}) ↓`}
									</button>
								{/if}
							</div>
						{/if}
					{/if}
				</div>
			</aside>

			<!-- ── COLUMNA DERECHA ── -->
			<main class="ph-main">

				<!-- CARD: LO QUE PASÓ HOY -->
				{#if todayFinished.length > 0}
					<div class="ph-card card">
						<div class="ph-card-label">⚽ Lo que pasó hoy</div>
						{#each todayFinished as match}
							<div class="ph-today-match">
								<div class="ph-today-teams">
									<span>{flag(match.team_home)} {match.team_home}</span>
									<span class="ph-today-score">{match.result_home} — {match.result_away}</span>
									<span>{match.team_away} {flag(match.team_away)}</span>
								</div>
								<div class="ph-today-winner">
									Ganó: <strong>{winnerName(match)}</strong>
									{match.went_to_penalties ? '· penales' : ''}
								</div>
							</div>
						{/each}

						{#if todayDeltas.length > 0}
							<div class="ph-deltas">
								<div class="ph-deltas-title">Movimiento de puntos</div>
								{#each todayDeltas as d}
									<div class="ph-delta-row">
										<span class="ph-delta-name">{d.full_name}</span>
										<span class="ph-delta-pts" class:positive={d.points_earned > 0} class:negative={d.points_earned < 0}>
											{d.points_earned > 0 ? '+' : ''}{d.points_earned} pts
										</span>
										{#if d.correct}<span class="ph-delta-check">✓ acertó</span>{/if}
									</div>
								{/each}
							</div>
						{/if}
					</div>
				{/if}

				<!-- CARD: PRÓXIMO PARTIDO + VOTOS -->
				{#if nextMatch}
					<div class="ph-card card">
						<div class="ph-card-label">🔜 Próximo partido</div>

						<div class="ph-next-teams">
							<div class="ph-next-team">
								<span class="ph-next-flag">{flag(nextMatch.team_home)}</span>
								<span class="ph-next-name">{nextMatch.team_home}</span>
							</div>
							<span class="ph-next-vs">VS</span>
							<div class="ph-next-team ph-next-team-r">
								<span class="ph-next-name">{nextMatch.team_away}</span>
								<span class="ph-next-flag">{flag(nextMatch.team_away)}</span>
							</div>
						</div>
						<div class="ph-next-time">{formatDateAR(nextMatch.kickoff_time)}</div>

						<!-- Pronósticos de jugadores -->
						{#if nextMatchPreds.length > 0}
							<div class="ph-preds-section">
								<div class="ph-preds-title">Pronósticos de los jugadores</div>
								<div class="ph-preds-list">
									{#each nextMatchPreds as pred}
										<div class="ph-pred-row">
											<span class="ph-pred-name">{pred.full_name}</span>
											<span class="ph-pred-pick">{predLabel(pred.predicted_winner, nextMatch)}</span>
											{#if pred.has_exact_score}
												<span class="ph-pred-score">{pred.predicted_home}-{pred.predicted_away}</span>
											{/if}
										</div>
									{/each}
								</div>
							</div>
						{/if}

						<!-- Votación pública -->
						<div class="ph-vote-section">
							<div class="ph-vote-title">¿Quién ganará? Votá</div>
							{#if userVote}
								<div class="ph-voted-msg">
									✅ Ya votaste por <strong>{predLabel(userVote, nextMatch)}</strong>
								</div>
							{:else}
								<div class="ph-vote-btns">
									<button class="ph-vote-btn ph-vote-home" disabled={votingLoading}
										on:click={() => submitVote('home')}>
										{flag(nextMatch.team_home)} {nextMatch.team_home}
									</button>
									{#if nextMatch.phase === 'groups'}
										<button class="ph-vote-btn ph-vote-draw" disabled={votingLoading}
											on:click={() => submitVote('draw')}>
											Empate
										</button>
									{/if}
									<button class="ph-vote-btn ph-vote-away" disabled={votingLoading}
										on:click={() => submitVote('away')}>
										{flag(nextMatch.team_away)} {nextMatch.team_away}
									</button>
								</div>
							{/if}

							<!-- Barras de votos (siempre visibles si hay votos) -->
							{#if totalVotes > 0}
								<div class="ph-vote-bars">
									<div class="ph-vb-row">
										<span class="ph-vb-label">{nextMatch.team_home}</span>
										<div class="ph-vb-track">
											<div class="ph-vb-fill ph-vb-home" style="width:{votePctHome}%"></div>
										</div>
										<span class="ph-vb-pct">{votePctHome}%</span>
									</div>
									{#if nextMatch.phase === 'groups'}
										<div class="ph-vb-row">
											<span class="ph-vb-label">Empate</span>
											<div class="ph-vb-track">
												<div class="ph-vb-fill ph-vb-draw" style="width:{votePctDraw}%"></div>
											</div>
											<span class="ph-vb-pct">{votePctDraw}%</span>
										</div>
									{/if}
									<div class="ph-vb-row">
										<span class="ph-vb-label">{nextMatch.team_away}</span>
										<div class="ph-vb-track">
											<div class="ph-vb-fill ph-vb-away" style="width:{votePctAway}%"></div>
										</div>
										<span class="ph-vb-pct">{votePctAway}%</span>
									</div>
									<div class="ph-vb-total">{totalVotes} {totalVotes === 1 ? 'voto' : 'votos'}</div>
								</div>
							{/if}
						</div>
					</div>
				{/if}

				<!-- CARD: EL POZO -->
				<div class="ph-card card ph-pozo-card">
					<div class="ph-card-label">💰 El Pozo</div>
					<div class="ph-pozo-total" class:ph-pozo-live={pozoStatus === 'open'}>
						{pozoTotal.toLocaleString('es-AR')}
					</div>
					<div class="ph-pozo-unit">puntos</div>
					{#if pozoStatus === 'open'}
						<div class="ph-pozo-badge">EN JUEGO</div>
					{:else if pozoStatus === 'revealed'}
						<div class="ph-pozo-badge ph-pozo-revealed">🏆 REVELADO</div>
					{/if}
					<p class="ph-pozo-note">Puntos perdidos por los jugadores</p>
				</div>

			</main>
		</div>
	{/if}

	<footer class="ph-footer">
		<p class="nota">Prode Cíclico · Mundial 2026 · Resultados en tiempo real</p>
	</footer>

</div>

<style>
	.rehearsal-banner {
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

	.prode-home { min-height: 100vh; }

	/* TÍTULO */
	.ph-title-wrap {
		text-align: center;
		padding: 48px 24px 32px;
	}
	.ph-eyebrow {
		font-family: 'Inter', monospace;
		font-size: 11px;
		letter-spacing: 0.2em;
		text-transform: uppercase;
		color: var(--celeste);
		margin-bottom: 10px;
	}
	.ph-title {
		font-family: 'Inter', sans-serif;
		font-size: clamp(32px, 6vw, 60px);
		font-weight: 900;
		letter-spacing: -0.04em;
		color: var(--text);
		margin: 0;
	}

	/* LAYOUT */
	.ph-layout {
		display: grid;
		grid-template-columns: 320px 1fr;
		gap: 24px;
		max-width: 1100px;
		margin: 0 auto;
		padding: 0 24px 60px;
		align-items: start;
	}
	@media (max-width: 860px) {
		.ph-layout { grid-template-columns: 1fr; }
	}

	/* SIDEBAR */
	.ph-sidebar { position: sticky; top: 80px; }
	.ph-sidebar-inner { padding: 20px; }
	.ph-sb-label {
		font-family: 'Inter', monospace;
		font-size: 11px;
		letter-spacing: 0.14em;
		text-transform: uppercase;
		color: var(--celeste);
		font-weight: 700;
		margin-bottom: 16px;
		display: flex;
		align-items: center;
		gap: 8px;
	}
	.ph-ensayo-tag {
		font-size: 10px;
		background: rgba(245,194,0,0.15);
		color: #7a5f00;
		border-radius: 20px;
		padding: 2px 8px;
	}

	/* PODIO */
	.ph-podio {
		display: flex;
		gap: 8px;
		justify-content: center;
		margin-bottom: 16px;
	}
	.ph-podio-item {
		flex: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 6px;
		padding: 12px 6px;
		border-radius: 12px;
		background: rgba(255,255,255,0.4);
		border: 1px solid rgba(255,255,255,0.6);
		text-align: center;
	}
	.ph-podio-item.gold { background: rgba(245,194,0,0.1); border-color: rgba(245,194,0,0.35); }
	.ph-podio-item.silver { background: rgba(180,180,200,0.08); }
	.ph-podio-item.bronze { background: rgba(180,120,60,0.06); }
	.ph-podio-medal { font-size: 22px; }
	.ph-podio-avatar img, .ph-av-ph {
		width: 44px; height: 44px; border-radius: 50%;
	}
	.ph-av-ph {
		background: linear-gradient(135deg, var(--celeste), var(--celeste-dim));
		color: #fff;
		display: flex; align-items: center; justify-content: center;
		font-family: 'Inter', sans-serif;
		font-size: 18px; font-weight: 800;
	}
	.ph-podio-avatar img { object-fit: cover; border: 2px solid rgba(255,255,255,0.7); }
	.ph-podio-name {
		font-family: 'Instrument Sans', sans-serif;
		font-size: 12px; font-weight: 700;
		color: var(--text);
		white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
		max-width: 80px;
	}
	.ph-podio-pts {
		font-family: 'DM Mono', monospace;
		font-size: 18px; font-weight: 700;
		color: var(--celeste);
	}

	/* RESTO RANKING */
	.ph-rank-rest { display: flex; flex-direction: column; gap: 4px; }
	.ph-rank-row {
		display: flex; align-items: center; gap: 10px;
		padding: 8px 10px;
		border-radius: 8px;
		background: rgba(255,255,255,0.3);
		border: 1px solid rgba(255,255,255,0.5);
		transition: background 0.15s;
	}
	.ph-rank-row:hover { background: rgba(91,155,213,0.06); }
	.ph-rank-pos {
		font-family: 'DM Mono', monospace;
		font-size: 13px; font-weight: 700;
		color: var(--muted);
		width: 20px; text-align: center; flex-shrink: 0;
	}
	.ph-rank-av-sm img, .ph-av-sm-ph {
		width: 28px; height: 28px; border-radius: 50%; flex-shrink: 0;
	}
	.ph-av-sm-ph {
		background: linear-gradient(135deg, var(--celeste), var(--celeste-dim));
		color: #fff;
		display: flex; align-items: center; justify-content: center;
		font-size: 12px; font-weight: 800;
	}
	.ph-rank-av-sm img { object-fit: cover; }
	.ph-rank-name {
		flex: 1;
		font-family: 'Instrument Sans', sans-serif;
		font-size: 13px; font-weight: 600;
		color: var(--text);
	}
	.ph-rank-pts {
		font-family: 'DM Mono', monospace;
		font-size: 15px; font-weight: 700;
		color: var(--celeste);
	}
	.ph-pts-lbl { font-size: 10px; color: var(--muted); font-weight: 400; }
	.ph-toggle-btn {
		font-family: 'Inter', monospace;
		font-size: 11px; letter-spacing: 0.08em;
		background: none; border: 1px solid var(--border);
		border-radius: 20px; padding: 6px 16px;
		color: var(--muted); cursor: pointer;
		transition: all 0.2s; margin-top: 6px; align-self: center;
	}
	.ph-toggle-btn:hover { border-color: var(--celeste); color: var(--celeste); }

	/* MAIN + CARDS */
	.ph-main { display: flex; flex-direction: column; gap: 20px; }
	.ph-card { padding: 22px 24px; display: flex; flex-direction: column; gap: 12px; }
	.ph-card-label {
		font-family: 'Inter', monospace;
		font-size: 11px; letter-spacing: 0.14em;
		text-transform: uppercase; color: var(--celeste);
		font-weight: 700;
	}

	/* HOY */
	.ph-today-match {
		border-top: 1px solid var(--border);
		padding-top: 10px;
		display: flex; flex-direction: column; gap: 4px;
	}
	.ph-today-match:first-of-type { border-top: none; padding-top: 0; }
	.ph-today-teams {
		display: flex; align-items: center; justify-content: space-between;
		gap: 8px; font-size: 14px; font-weight: 600; color: var(--text);
	}
	.ph-today-score {
		font-family: 'DM Mono', monospace;
		font-size: 20px; font-weight: 700;
		color: var(--text);
	}
	.ph-today-winner { font-size: 12px; color: var(--muted); }
	.ph-today-winner strong { color: var(--celeste); }

	.ph-deltas { display: flex; flex-direction: column; gap: 6px; margin-top: 4px; }
	.ph-deltas-title {
		font-family: 'Inter', monospace;
		font-size: 10px; letter-spacing: 0.1em;
		text-transform: uppercase; color: var(--muted);
		margin-bottom: 2px;
	}
	.ph-delta-row {
		display: flex; align-items: center; gap: 10px;
		padding: 6px 10px; border-radius: 8px;
		background: rgba(255,255,255,0.3);
	}
	.ph-delta-name { flex: 1; font-size: 13px; font-weight: 600; color: var(--text); }
	.ph-delta-pts {
		font-family: 'DM Mono', monospace;
		font-size: 14px; font-weight: 700;
	}
	.ph-delta-pts.positive { color: var(--green); }
	.ph-delta-pts.negative { color: var(--red); }
	.ph-delta-check { font-size: 11px; color: var(--green); }

	/* PRÓXIMO PARTIDO */
	.ph-next-teams {
		display: flex; align-items: center; justify-content: space-between;
		gap: 8px;
	}
	.ph-next-team { display: flex; align-items: center; gap: 8px; flex: 1; }
	.ph-next-team-r { flex-direction: row-reverse; }
	.ph-next-flag { font-size: 30px; flex-shrink: 0; }
	.ph-next-name {
		font-family: 'Inter', sans-serif;
		font-size: 16px; font-weight: 800;
		color: var(--text);
		letter-spacing: -0.02em;
	}
	.ph-next-vs {
		font-family: 'DM Mono', monospace;
		font-size: 11px; color: var(--muted);
		flex-shrink: 0;
	}
	.ph-next-time {
		font-family: 'DM Mono', monospace;
		font-size: 12px; color: var(--muted);
	}

	/* Pronósticos */
	.ph-preds-section { border-top: 1px solid var(--border); padding-top: 12px; }
	.ph-preds-title {
		font-family: 'Inter', monospace;
		font-size: 10px; letter-spacing: 0.1em;
		text-transform: uppercase; color: var(--muted);
		margin-bottom: 8px;
	}
	.ph-preds-list { display: flex; flex-direction: column; gap: 5px; }
	.ph-pred-row {
		display: flex; align-items: center; gap: 10px;
		padding: 6px 10px; border-radius: 8px;
		background: rgba(255,255,255,0.35);
		font-size: 13px;
	}
	.ph-pred-name { flex: 1; font-weight: 600; color: var(--text); }
	.ph-pred-pick {
		font-weight: 700; color: var(--celeste);
		font-family: 'Instrument Sans', sans-serif;
	}
	.ph-pred-score {
		font-family: 'DM Mono', monospace;
		font-size: 11px; color: var(--muted);
		background: rgba(0,0,0,0.05);
		padding: 2px 6px; border-radius: 4px;
	}

	/* VOTACIÓN */
	.ph-vote-section { border-top: 1px solid var(--border); padding-top: 14px; }
	.ph-vote-title {
		font-family: 'Inter', monospace;
		font-size: 11px; letter-spacing: 0.12em;
		text-transform: uppercase; color: var(--muted);
		margin-bottom: 12px;
	}
	.ph-vote-btns { display: flex; gap: 8px; flex-wrap: wrap; }
	.ph-vote-btn {
		flex: 1;
		min-width: 0;
		font-family: 'Instrument Sans', sans-serif;
		font-size: 14px; font-weight: 700;
		padding: 14px 10px;
		border-radius: 12px;
		border: 2px solid transparent;
		cursor: pointer;
		transition: all 0.2s;
		white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
	}
	.ph-vote-btn:disabled { opacity: 0.5; cursor: not-allowed; }
	.ph-vote-home { background: rgba(91,155,213,0.12); color: #2a5a9a; border-color: rgba(91,155,213,0.3); }
	.ph-vote-home:hover:not(:disabled) { background: rgba(91,155,213,0.22); border-color: var(--celeste); }
	.ph-vote-draw { background: rgba(180,180,180,0.1); color: var(--muted); border-color: rgba(180,180,180,0.25); }
	.ph-vote-draw:hover:not(:disabled) { background: rgba(180,180,180,0.2); border-color: #aaa; }
	.ph-vote-away { background: rgba(213,91,91,0.1); color: #8a2a2a; border-color: rgba(213,91,91,0.25); }
	.ph-vote-away:hover:not(:disabled) { background: rgba(213,91,91,0.2); border-color: var(--red); }

	.ph-voted-msg {
		font-size: 14px; color: var(--green);
		background: rgba(61,214,140,0.1);
		border: 1px solid rgba(61,214,140,0.3);
		border-radius: 10px;
		padding: 12px 16px;
		font-weight: 600;
	}

	/* Barras de votos */
	.ph-vote-bars { display: flex; flex-direction: column; gap: 7px; margin-top: 14px; }
	.ph-vb-row { display: flex; align-items: center; gap: 8px; }
	.ph-vb-label {
		font-family: 'DM Mono', monospace;
		font-size: 11px; color: var(--muted);
		width: 80px; flex-shrink: 0;
		white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
	}
	.ph-vb-track {
		flex: 1; height: 8px;
		background: rgba(0,0,0,0.06);
		border-radius: 4px; overflow: hidden;
	}
	.ph-vb-fill { height: 100%; border-radius: 4px; transition: width 0.5s ease; }
	.ph-vb-home { background: var(--celeste); }
	.ph-vb-draw { background: #aaa; }
	.ph-vb-away { background: var(--red); }
	.ph-vb-pct {
		font-family: 'DM Mono', monospace;
		font-size: 12px; font-weight: 700;
		color: var(--text); width: 36px; text-align: right;
	}
	.ph-vb-total {
		font-family: 'DM Mono', monospace;
		font-size: 11px; color: var(--muted);
		text-align: right; margin-top: 2px;
	}

	/* POZO */
	.ph-pozo-card { text-align: center; align-items: center; }
	.ph-pozo-total {
		font-family: 'DM Mono', monospace;
		font-size: 56px; font-weight: 700;
		letter-spacing: -0.04em;
		color: var(--amarillo-dim);
		line-height: 1;
	}
	.ph-pozo-live { animation: pozo-pulse 2s ease-in-out infinite; }
	@keyframes pozo-pulse { 0%,100%{opacity:1} 50%{opacity:0.7} }
	.ph-pozo-unit {
		font-family: 'Inter', monospace;
		font-size: 11px; letter-spacing: 0.14em;
		text-transform: uppercase; color: var(--muted);
	}
	.ph-pozo-badge {
		font-family: 'Inter', monospace;
		font-size: 10px; font-weight: 700;
		letter-spacing: 0.2em;
		color: var(--amarillo-dim);
		background: rgba(245,194,0,0.15);
		border: 1px solid rgba(245,194,0,0.4);
		border-radius: 20px;
		padding: 4px 12px;
		animation: badge-blink 1.5s ease-in-out infinite;
	}
	.ph-pozo-revealed { color: var(--green); background: rgba(61,214,140,0.1); border-color: rgba(61,214,140,0.3); animation: none; }
	@keyframes badge-blink { 0%,100%{opacity:1} 50%{opacity:0.5} }
	.ph-pozo-note {
		font-size: 11px; color: var(--muted);
		font-style: italic; margin: 0;
	}

	/* MISC */
	.ph-loading { text-align: center; padding: 80px; color: var(--muted); font-size: 14px; }
	.ph-empty { text-align: center; color: var(--muted); font-size: 14px; padding: 20px 0; }
	.ph-footer { text-align: center; padding: 32px 24px; }
	.nota { font-size: 11px; color: var(--muted); font-family: 'DM Mono', monospace; }
</style>
