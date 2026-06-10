<script lang="ts">
	import { onMount } from 'svelte';
	import { supabase } from '$lib/supabase';
	import { flag } from '$lib/mundial/utils';

	interface Match {
		id: string;
		phase: string;
		group_name: string | null;
		week_number: number;
		team_home: string;
		team_away: string;
		kickoff_time: string;
		result_home: number | null;
		result_away: number | null;
		winner: string | null;
		status: string;
	}

	interface Pred {
		user_id: string;
		player_name: string;
		avatar_url: string | null;
		predicted_winner: string;
		predicted_home: number | null;
		predicted_away: number | null;
		has_exact_score: boolean;
		points_earned: number | null;
		is_correct: boolean | null;
	}

	let matches: Match[] = [];
	let allMatchPreds: Record<string, Pred[]> = {};
	let selectedMatchId: string | null = null;
	let loading = true;

	const BASE_POINTS: Record<string, number> = {
		groups: 100, r32: 200, r16: 400, qf: 800, sf: 1500, '3rd': 800, final: 2000
	};

	function pip(match: Match) {
		const base = BASE_POINTS[match.phase] ?? 100;
		return { winner: base, exact: Math.round(base * 0.7), total: Math.round(base * 1.7) };
	}

	// Total de puntos en juego entre todos los pronósticos
	function totalInPlay(preds: Pred[], match: Match): number {
		const p = pip(match);
		return preds.reduce((sum, pred) => sum + p.winner + (pred.has_exact_score ? p.exact : 0), 0);
	}

	// Tonos de celeste para las cards (varía por índice)
	const CARD_TONES = [
		{ bg: '#e8f4ff', border: '#b8d8f8' },
		{ bg: '#f0f8ff', border: '#cce8ff' },
		{ bg: '#ddeeff', border: '#aad0f0' },
		{ bg: '#f5faff', border: '#d0e8fa' },
		{ bg: '#e0f0fc', border: '#b0d4f0' },
	];

	$: matchesWithPreds = matches.filter(m => (allMatchPreds[m.id]?.length ?? 0) > 0);
	$: weeks = [...new Set(matchesWithPreds.map(m => m.week_number))].sort((a, b) => a - b);
	$: selectedMatch = matches.find(m => m.id === selectedMatchId) ?? null;
	$: selectedPreds = selectedMatchId ? (allMatchPreds[selectedMatchId] ?? []) : [];

	onMount(async () => {
		const [{ data: mData }, { data: pData }] = await Promise.all([
			supabase.from('matches').select('*').order('kickoff_time'),
			supabase.from('predictions')
				.select('match_id, user_id, predicted_winner, predicted_home, predicted_away, has_exact_score, points_earned, is_correct, users(full_name, avatar_url)')
		]);

		matches = (mData ?? []) as Match[];

		const preds: Record<string, Pred[]> = {};
		for (const row of (pData ?? []) as any[]) {
			if (!preds[row.match_id]) preds[row.match_id] = [];
			preds[row.match_id].push({
				user_id: row.user_id,
				player_name: row.users?.full_name ?? '?',
				avatar_url: row.users?.avatar_url ?? null,
				predicted_winner: row.predicted_winner,
				predicted_home: row.predicted_home,
				predicted_away: row.predicted_away,
				has_exact_score: row.has_exact_score,
				points_earned: row.points_earned,
				is_correct: row.is_correct,
			});
		}
		allMatchPreds = preds;

		const first = matches.find(m => (preds[m.id]?.length ?? 0) > 0);
		if (first) selectedMatchId = first.id;

		loading = false;
	});

	function phaseLabel(p: string): string {
		const map: Record<string, string> = {
			groups: 'Grupo', r32: 'R32', r16: 'Octavos',
			qf: 'Cuartos', sf: 'Semis', '3rd': '3er puesto', final: 'Final'
		};
		return map[p] ?? p;
	}
</script>

<svelte:head>
	<title>Pronósticos · Mundial Cíclico</title>
	<meta name="robots" content="noindex" />
</svelte:head>

<div class="tv-wrap">
	<div class="tv-bg-orb tv-bg-orb1"></div>
	<div class="tv-bg-orb tv-bg-orb2"></div>

	{#if loading}
		<div class="tv-loading">
			<div class="tv-spinner"></div>
		</div>

	{:else}

		<!-- ── TÍTULO ── -->
		<div class="tv-title-block">
			<div class="tv-title-eyebrow">🏆</div>
			<h1 class="tv-title">Mundial Cíclico</h1>
			<p class="tv-subtitle">Pronósticos por partido</p>
		</div>

		<!-- ── TAGS ── -->
		<div class="tv-tags-row">
			{#each weeks as w}
				{#each matchesWithPreds.filter(m => m.week_number === w) as match}
					{@const count = allMatchPreds[match.id]?.length ?? 0}
					<button
						class="tv-tag"
						class:active={selectedMatchId === match.id}
						on:click={() => selectedMatchId = match.id}
					>
						<span class="tv-tag-flags">{flag(match.team_home)} {flag(match.team_away)}</span>
						<span class="tv-tag-name">{match.team_home} · {match.team_away}</span>
						<span class="tv-tag-badge">{count}</span>
					</button>
				{/each}
			{/each}
			{#if matchesWithPreds.length === 0}
				<span class="tv-tags-empty">Sin pronósticos cargados</span>
			{/if}
		</div>

		<!-- ── PARTIDO ── -->
		{#if selectedMatch}
			{@const p = pip(selectedMatch)}
			{@const total = totalInPlay(selectedPreds, selectedMatch)}
			{@const isFinished = selectedMatch.status === 'finished'}

			<!-- Card principal del partido -->
			<div class="tv-match-card">
				<div class="tv-match-card-left">
					<div class="tv-match-phase-pill">
						{phaseLabel(selectedMatch.phase)}{selectedMatch.group_name ? ` · Grupo ${selectedMatch.group_name}` : ''}
					</div>
					<div class="tv-match-teams">
						<span class="tv-match-team">{flag(selectedMatch.team_home)} {selectedMatch.team_home}</span>
						<span class="tv-match-vs">vs</span>
						<span class="tv-match-team">{selectedMatch.team_away} {flag(selectedMatch.team_away)}</span>
					</div>
					{#if isFinished}
						<div class="tv-match-result-line">
							Resultado: <strong>{selectedMatch.result_home} – {selectedMatch.result_away}</strong>
							· Ganó <strong>{selectedMatch.winner === 'home' ? selectedMatch.team_home : selectedMatch.winner === 'away' ? selectedMatch.team_away : 'Empate'}</strong>
						</div>
					{/if}
					<div class="tv-match-pred-count">{selectedPreds.length} pronóstico{selectedPreds.length !== 1 ? 's' : ''}</div>
				</div>

				<div class="tv-match-card-right">
					<div class="tv-pot-block">
						<div class="tv-pot-label">AL POZO SI TODOS PIERDEN</div>
						<div class="tv-pot-number">{total.toLocaleString('es-AR')}</div>
						<div class="tv-pot-unit">puntos</div>
					</div>
					<div class="tv-pip-row">
						<div class="tv-pip-item">
							<span class="tv-pip-val">+{p.winner}</span>
							<span class="tv-pip-lbl">ganador</span>
						</div>
						<div class="tv-pip-sep">·</div>
						<div class="tv-pip-item">
							<span class="tv-pip-val">+{p.exact}</span>
							<span class="tv-pip-lbl">marcador</span>
						</div>
					</div>
				</div>
			</div>

			<!-- ── CARDS con animación escalonada ── -->
			{#key selectedMatchId}
				<div class="tv-cards-col">
					{#each selectedPreds as pred, i}
						{@const isKnown = pred.points_earned !== null}
						{@const winnerName = pred.predicted_winner === 'home'
							? selectedMatch.team_home
							: pred.predicted_winner === 'away'
								? selectedMatch.team_away
								: 'Empate'}
						{@const tone = CARD_TONES[i % CARD_TONES.length]}
						<div
							class="tv-card"
							class:tv-card-correct={isKnown && pred.is_correct}
							class:tv-card-wrong={isKnown && !pred.is_correct}
							style="animation-delay: {i}s; --card-bg: {tone.bg}; --card-border: {tone.border}"
						>
							<div class="tv-card-avatar">
								{#if pred.avatar_url}
									<img src={pred.avatar_url} alt={pred.player_name} class="tv-avatar-img" />
								{:else}
									<div class="tv-avatar-initials">{pred.player_name.charAt(0).toUpperCase()}</div>
								{/if}
							</div>

							<div class="tv-card-body">
								<div class="tv-card-name">{pred.player_name}</div>
								<div class="tv-card-pred">
									<span class="tv-pred-winner">{winnerName}</span>
									{#if pred.has_exact_score}
										<span class="tv-pred-score">{pred.predicted_home} – {pred.predicted_away}</span>
									{:else}
										<span class="tv-pred-noscore">sin marcador</span>
									{/if}
								</div>
							</div>

							<div class="tv-card-pts">
								{#if isKnown}
									<span class="tv-pts-num" class:pos={pred.points_earned! > 0} class:neg={pred.points_earned! < 0}>
										{pred.points_earned! > 0 ? '+' : ''}{pred.points_earned}
									</span>
									<span class="tv-pts-check">{pred.is_correct ? '✓' : '✗'}</span>
								{:else}
									<span class="tv-pts-pending">+{p.winner}</span>
									{#if pred.has_exact_score}
										<span class="tv-pts-bonus">+{p.exact}</span>
									{/if}
								{/if}
							</div>
						</div>
					{/each}
				</div>
			{/key}

		{:else}
			<div class="tv-empty">Tocá un partido para ver los pronósticos</div>
		{/if}

	{/if}
</div>

<style>
	:global(body):has(.tv-wrap) {
		background: #04091a !important;
		background-image: none !important;
		margin: 0; padding: 0; overflow-x: hidden;
	}
	:global(body):has(.tv-wrap) :global(.nav-main),
	:global(body):has(.tv-wrap) :global(.nav-strip) {
		display: none !important;
	}

	.tv-wrap {
		position: relative;
		min-height: 100vh;
		background: #04091a;
		padding: 36px 40px 72px;
		display: flex;
		flex-direction: column;
		gap: 24px;
		font-family: 'Instrument Sans', sans-serif;
		overflow: hidden;
	}

	/* Orbes de fondo */
	.tv-bg-orb {
		position: fixed; border-radius: 50%;
		filter: blur(130px); pointer-events: none; z-index: 0;
	}
	.tv-bg-orb1 {
		width: 700px; height: 700px; top: -250px; left: -200px;
		background: radial-gradient(circle, rgba(25,70,160,0.3) 0%, transparent 70%);
	}
	.tv-bg-orb2 {
		width: 500px; height: 500px; bottom: -180px; right: -120px;
		background: radial-gradient(circle, rgba(100,30,160,0.22) 0%, transparent 70%);
	}

	/* ── Loading ── */
	.tv-loading {
		display: flex; align-items: center; justify-content: center;
		min-height: 80vh; z-index: 1;
	}
	.tv-spinner {
		width: 52px; height: 52px;
		border: 3px solid rgba(255,255,255,0.08);
		border-top-color: #7ab8f5;
		border-radius: 50%;
		animation: spin 0.8s linear infinite;
	}
	@keyframes spin { to { transform: rotate(360deg); } }

	/* ── Título ── */
	.tv-title-block {
		position: relative; z-index: 1;
		display: flex; flex-direction: column; align-items: center;
		gap: 4px; padding-bottom: 4px;
	}
	.tv-title-eyebrow { font-size: 28px; line-height: 1; }
	.tv-title {
		font-family: 'Inter', sans-serif;
		font-size: clamp(32px, 5vw, 56px);
		font-weight: 900;
		color: #fff;
		letter-spacing: -0.04em;
		line-height: 1;
		margin: 0;
		text-align: center;
	}
	.tv-subtitle {
		font-family: 'Inter', monospace;
		font-size: clamp(12px, 1.5vw, 16px);
		font-weight: 600;
		letter-spacing: 0.14em;
		text-transform: uppercase;
		color: rgba(255,255,255,0.35);
		margin: 0;
		text-align: center;
	}

	/* ── Tags ── */
	.tv-tags-row {
		position: relative; z-index: 1;
		display: flex; gap: 10px; flex-wrap: wrap;
		justify-content: center;
	}
	.tv-tags-empty { font-size: 14px; color: rgba(255,255,255,0.2); font-style: italic; }

	.tv-tag {
		display: flex; align-items: center; gap: 8px;
		padding: 9px 16px;
		border-radius: 40px;
		border: 1px solid rgba(255,255,255,0.08);
		background: rgba(255,255,255,0.04);
		cursor: pointer;
		transition: all 0.2s;
		color: rgba(255,255,255,0.45);
	}
	.tv-tag:hover { border-color: rgba(122,184,245,0.45); color: rgba(255,255,255,0.85); }
	.tv-tag.active {
		border-color: rgba(122,184,245,0.6);
		background: rgba(122,184,245,0.12);
		color: #fff;
		box-shadow: 0 0 18px rgba(122,184,245,0.12);
	}
	.tv-tag-flags { font-size: 16px; }
	.tv-tag-name { font-size: 13px; font-weight: 600; }
	.tv-tag-badge {
		font-family: 'DM Mono', monospace;
		font-size: 11px; font-weight: 800;
		color: #7ab8f5;
		background: rgba(122,184,245,0.15);
		border-radius: 12px;
		padding: 2px 9px;
	}
	.tv-tag.active .tv-tag-badge { background: rgba(122,184,245,0.28); }

	/* ── Card principal del partido ── */
	.tv-match-card {
		position: relative; z-index: 1;
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 24px;
		flex-wrap: wrap;
		padding: 24px 32px;
		border-radius: 22px;
		background: linear-gradient(135deg, rgba(14,40,100,0.75) 0%, rgba(8,22,64,0.85) 100%);
		border: 1px solid rgba(122,184,245,0.2);
		overflow: hidden;
	}
	.tv-match-card::before {
		content: '';
		position: absolute; top: 0; left: 0; right: 0; height: 2px;
		background: linear-gradient(90deg, transparent, rgba(122,184,245,0.6), transparent);
	}

	.tv-match-card-left { display: flex; flex-direction: column; gap: 8px; }
	.tv-match-phase-pill {
		font-family: 'Inter', monospace;
		font-size: 10px; font-weight: 800;
		letter-spacing: 0.18em; text-transform: uppercase;
		color: #7ab8f5;
		background: rgba(122,184,245,0.1);
		border: 1px solid rgba(122,184,245,0.2);
		border-radius: 20px;
		padding: 3px 12px;
		align-self: flex-start;
	}
	.tv-match-teams { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
	.tv-match-team {
		font-family: 'Inter', sans-serif;
		font-size: clamp(18px, 2.5vw, 26px);
		font-weight: 900;
		color: #fff;
		letter-spacing: -0.03em;
	}
	.tv-match-vs { font-size: 14px; color: rgba(255,255,255,0.25); font-weight: 700; }
	.tv-match-result-line { font-size: 14px; color: rgba(255,255,255,0.5); }
	.tv-match-result-line strong { color: #3dd68c; }
	.tv-match-pred-count { font-size: 12px; color: rgba(255,255,255,0.3); letter-spacing: 0.04em; }

	.tv-match-card-right { display: flex; flex-direction: column; align-items: flex-end; gap: 10px; }

	/* Pozo en juego */
	.tv-pot-block { display: flex; flex-direction: column; align-items: flex-end; gap: 0; }
	.tv-pot-label {
		font-family: 'Inter', monospace;
		font-size: 9px; font-weight: 800;
		letter-spacing: 0.2em;
		color: rgba(245,194,0,0.55);
		text-transform: uppercase;
	}
	.tv-pot-number {
		font-family: 'DM Mono', monospace;
		font-size: clamp(38px, 5vw, 56px);
		font-weight: 900;
		color: #f5c200;
		line-height: 1;
		text-shadow: 0 0 32px rgba(245,194,0,0.5), 0 0 64px rgba(245,194,0,0.2);
		animation: pip-glow 3s ease-in-out infinite;
	}
	@keyframes pip-glow {
		0%,100% { text-shadow: 0 0 32px rgba(245,194,0,0.5), 0 0 64px rgba(245,194,0,0.2); }
		50%      { text-shadow: 0 0 48px rgba(245,194,0,0.75), 0 0 90px rgba(245,194,0,0.35); }
	}
	.tv-pot-unit { font-size: 11px; color: rgba(245,194,0,0.4); letter-spacing: 0.06em; text-align: right; }

	.tv-pip-row { display: flex; align-items: center; gap: 8px; }
	.tv-pip-item { display: flex; flex-direction: column; align-items: center; gap: 1px; }
	.tv-pip-val {
		font-family: 'DM Mono', monospace;
		font-size: 16px; font-weight: 800;
		color: rgba(245,194,0,0.7);
	}
	.tv-pip-lbl { font-size: 10px; color: rgba(255,255,255,0.25); letter-spacing: 0.06em; }
	.tv-pip-sep { color: rgba(255,255,255,0.15); font-size: 14px; }

	/* ── Cards en columna ── */
	.tv-cards-col {
		position: relative; z-index: 1;
		display: flex; flex-direction: column; gap: 12px;
		max-width: 680px;
		margin: 0 auto;
		width: 100%;
	}

	@keyframes card-enter {
		0%   { opacity: 0; transform: translateY(48px) scale(0.92); }
		60%  { transform: translateY(-5px) scale(1.015); }
		100% { opacity: 1; transform: translateY(0) scale(1); }
	}

	.tv-card {
		opacity: 0;
		animation: card-enter 0.55s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
		border-radius: 16px;
		border: 1px solid var(--card-border, #b8d8f8);
		background: var(--card-bg, #e8f4ff);
		display: flex;
		align-items: center;
		gap: 16px;
		padding: 16px 20px;
		transition: box-shadow 0.2s;
	}
	.tv-card:hover { box-shadow: 0 4px 24px rgba(0,0,0,0.35); }
	.tv-card.tv-card-correct {
		--card-bg: #ddf7ec;
		--card-border: #8adab8;
		background: var(--card-bg);
		border-color: var(--card-border);
	}
	.tv-card.tv-card-wrong {
		--card-bg: #fdeef0;
		--card-border: #f0b8c0;
		background: var(--card-bg);
		border-color: var(--card-border);
	}

	/* Avatar */
	.tv-card-avatar { flex-shrink: 0; }
	.tv-avatar-img {
		width: 52px; height: 52px;
		border-radius: 50%; object-fit: cover;
		border: 2px solid rgba(10,40,100,0.15);
		box-shadow: 0 2px 10px rgba(0,0,0,0.12);
	}
	.tv-avatar-initials {
		width: 52px; height: 52px;
		border-radius: 50%;
		background: linear-gradient(135deg, #3a7acc, #1e4e9a);
		display: flex; align-items: center; justify-content: center;
		font-family: 'Inter', sans-serif;
		font-size: 22px; font-weight: 900;
		color: #fff;
		box-shadow: 0 2px 10px rgba(30,78,154,0.35);
	}

	/* Card body */
	.tv-card-body { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 5px; }
	.tv-card-name {
		font-family: 'Inter', sans-serif;
		font-size: 17px; font-weight: 800;
		color: #0a1e50;
		white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
	}
	.tv-card-pred { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
	.tv-pred-winner {
		font-size: 16px; font-weight: 700;
		color: #1a3a80;
	}
	.tv-pred-score {
		font-family: 'DM Mono', monospace;
		font-size: 15px; font-weight: 800;
		color: #0a1e50;
		background: rgba(30,70,180,0.1);
		padding: 2px 10px;
		border-radius: 8px;
	}
	.tv-pred-noscore {
		font-size: 12px;
		color: #c08000;
		font-style: italic;
	}

	/* Puntos */
	.tv-card-pts { flex-shrink: 0; display: flex; flex-direction: column; align-items: flex-end; gap: 2px; }
	.tv-pts-num { font-family: 'DM Mono', monospace; font-size: 22px; font-weight: 900; }
	.tv-pts-num.pos { color: #157a4a; }
	.tv-pts-num.neg { color: #c0303a; }
	.tv-pts-check { font-size: 14px; color: rgba(10,30,80,0.35); }
	.tv-pts-pending {
		font-family: 'DM Mono', monospace;
		font-size: 20px; font-weight: 900;
		color: #1a5ca0;
	}
	.tv-pts-bonus {
		font-family: 'DM Mono', monospace;
		font-size: 11px;
		color: rgba(26,92,160,0.6);
	}

	/* Empty */
	.tv-empty {
		position: relative; z-index: 1;
		text-align: center; color: rgba(255,255,255,0.15);
		font-size: 20px; padding: 100px 0; font-style: italic;
	}

	/* Responsive */
	@media (min-width: 1200px) {
		.tv-wrap { padding: 44px 60px 80px; }
		.tv-cards-col { max-width: 760px; gap: 14px; }
		.tv-card { padding: 18px 24px; }
		.tv-card-name { font-size: 19px; }
		.tv-pred-winner { font-size: 17px; }
		.tv-pts-pending, .tv-pts-num { font-size: 24px; }
		.tv-avatar-img, .tv-avatar-initials { width: 58px; height: 58px; font-size: 24px; }
	}
</style>
