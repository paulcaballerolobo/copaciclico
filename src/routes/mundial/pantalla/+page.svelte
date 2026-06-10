<script lang="ts">
	import { onMount } from 'svelte';
	import { supabase } from '$lib/supabase';
	import 'flag-icons/css/flag-icons.min.css';
	import Trophy from 'phosphor-svelte/lib/Trophy';
	import Coins from 'phosphor-svelte/lib/Coins';
	import SoccerBall from 'phosphor-svelte/lib/SoccerBall';
	import CheckCircle from 'phosphor-svelte/lib/CheckCircle';
	import XCircle from 'phosphor-svelte/lib/XCircle';
	import UserCirclePlus from 'phosphor-svelte/lib/UserCirclePlus';

	interface Team {
		code: string;
		name: string;
	}

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
	let teams: Record<string, Team> = {};
	let allMatchPreds: Record<string, Pred[]> = {};
	let selectedMatchId: string | null = null;
	let loading = true;

	// FIFA code → ISO 3166-1 alpha-2 (para flag-icons CSS)
	const FIFA_TO_ISO: Record<string, string> = {
		ARG: 'ar', BRA: 'br', FRA: 'fr', GER: 'de', ESP: 'es', ENG: 'gb-eng',
		POR: 'pt', ITA: 'it', NED: 'nl', BEL: 'be', URU: 'uy', MEX: 'mx',
		USA: 'us', CAN: 'ca', JPN: 'jp', MAR: 'ma', SEN: 'sn', ECU: 'ec',
		COL: 'co', CHI: 'cl', SUI: 'ch', DEN: 'dk', CRO: 'hr', SRB: 'rs',
		POL: 'pl', AUS: 'au', KSA: 'sa', IRN: 'ir', KOR: 'kr', GHA: 'gh',
		CMR: 'cm', ALG: 'dz', CZE: 'cz', CRC: 'cr', PAR: 'py', VEN: 've',
		PER: 'pe', BOL: 'bo', PAN: 'pa', HON: 'hn', JAM: 'jm', TUR: 'tr',
		UKR: 'ua', AUT: 'at', HUN: 'hu', ROU: 'ro', SCO: 'gb-sct', WAL: 'gb-wls',
		GRE: 'gr', SVK: 'sk', SVN: 'si', RSA: 'za', NGA: 'ng', EGY: 'eg',
		TUN: 'tn', MLI: 'ml', COD: 'cd', ZIM: 'zw', SUD: 'sd', CIV: 'ci',
		ZAM: 'zm', TAN: 'tz', NZL: 'nz', IDN: 'id', QAT: 'qa', IRQ: 'iq',
		JOR: 'jo', OMA: 'om', BHR: 'bh', KUW: 'kw', UAE: 'ae', CHN: 'cn',
		UZB: 'uz', IND: 'in', THA: 'th', VIE: 'vn', PHI: 'ph', NOR: 'no',
		SWE: 'se', HAI: 'ht', BIH: 'ba', CUW: 'cw', CPV: 'cv',
	};

	function teamName(code: string): string {
		return teams[code]?.name ?? code;
	}

	function teamFlag(code: string): string {
		return FIFA_TO_ISO[code] ?? '';
	}

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

	// Tonos de celeste con 10% de transparencia (rgba alpha ~0.88)
	const CARD_TONES = [
		{ bg: 'rgba(232,244,255,0.88)', border: 'rgba(184,216,248,0.7)' },
		{ bg: 'rgba(240,248,255,0.88)', border: 'rgba(204,232,255,0.7)' },
		{ bg: 'rgba(221,238,255,0.88)', border: 'rgba(170,208,240,0.7)' },
		{ bg: 'rgba(245,250,255,0.88)', border: 'rgba(208,232,250,0.7)' },
		{ bg: 'rgba(224,240,252,0.88)', border: 'rgba(176,212,240,0.7)' },
	];

	$: matchesWithPreds = matches.filter(m => (allMatchPreds[m.id]?.length ?? 0) > 0);
	$: weeks = [...new Set(matchesWithPreds.map(m => m.week_number))].sort((a, b) => a - b);
	$: selectedMatch = matches.find(m => m.id === selectedMatchId) ?? null;
	$: selectedPreds = selectedMatchId ? (allMatchPreds[selectedMatchId] ?? []) : [];

	onMount(async () => {
		const [{ data: mData }, { data: pData }, { data: tData }] = await Promise.all([
			supabase.from('matches').select('*').order('kickoff_time'),
			supabase.from('predictions')
				.select('match_id, user_id, predicted_winner, predicted_home, predicted_away, has_exact_score, points_earned, is_correct, users(full_name, avatar_url)'),
			supabase.from('teams').select('code, name')
		]);

		matches = (mData ?? []) as Match[];

		const teamsMap: Record<string, Team> = {};
		for (const t of (tData ?? []) as Team[]) teamsMap[t.code] = t;
		teams = teamsMap;

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
	<!-- Fondo con imagen + capa degradada -->
	<div class="tv-bg-img"></div>
	<div class="tv-bg-overlay"></div>

	{#if loading}
		<div class="tv-loading">
			<div class="tv-spinner"></div>
		</div>

	{:else}
		<!-- ── LAYOUT DOS COLUMNAS ── -->
		<div class="tv-layout">

			<!-- ── COLUMNA IZQUIERDA (fija) ── -->
			<aside class="tv-sidebar">

				<!-- Título -->
				<div class="tv-title-block">
					<div class="tv-title-icon"><Trophy weight="fill" size={32} color="#f5c200" /></div>
					<h1 class="tv-title">Mundial Cíclico</h1>
					<p class="tv-subtitle">Pronósticos por partido</p>
				</div>

				<!-- Tags de partidos (sin bandera) -->
				<nav class="tv-tags-list">
					{#if matchesWithPreds.length === 0}
						<span class="tv-tags-empty">Sin pronósticos cargados</span>
					{:else}
						{#each weeks as w}
							{#each matchesWithPreds.filter(m => m.week_number === w) as match}
								{@const count = allMatchPreds[match.id]?.length ?? 0}
								<button
									class="tv-tag"
									class:active={selectedMatchId === match.id}
									on:click={() => selectedMatchId = match.id}
								>
									<span class="tv-tag-name">{teamName(match.team_home)} · {teamName(match.team_away)}</span>
									<span class="tv-tag-badge">{count}</span>
								</button>
							{/each}
						{/each}
					{/if}
				</nav>

				<!-- Card grande del partido seleccionado -->
				{#if selectedMatch}
					{@const p = pip(selectedMatch)}
					{@const total = totalInPlay(selectedPreds, selectedMatch)}
					{@const isFinished = selectedMatch.status === 'finished'}
					<div class="tv-match-card">
						<div class="tv-match-phase-pill">
							{phaseLabel(selectedMatch.phase)}{selectedMatch.group_name ? ` · Grupo ${selectedMatch.group_name}` : ''}
						</div>

						<!-- Equipo local -->
						<div class="tv-match-team-row">
							<span class="tv-match-team">{teamName(selectedMatch.team_home)}</span>
							{#if teamFlag(selectedMatch.team_home)}
								<span class="fi fi-{teamFlag(selectedMatch.team_home)} tv-match-fi"></span>
							{/if}
						</div>
						<div class="tv-match-vs-row">vs</div>
						<!-- Equipo visitante -->
						<div class="tv-match-team-row">
							<span class="tv-match-team">{teamName(selectedMatch.team_away)}</span>
							{#if teamFlag(selectedMatch.team_away)}
								<span class="fi fi-{teamFlag(selectedMatch.team_away)} tv-match-fi"></span>
							{/if}
						</div>

						{#if isFinished}
							{@const homeName = teamName(selectedMatch.team_home)}
							{@const awayName = teamName(selectedMatch.team_away)}
							<div class="tv-match-result-line">
								<strong>{selectedMatch.result_home} – {selectedMatch.result_away}</strong>
								· <strong>{selectedMatch.winner === 'home' ? homeName : selectedMatch.winner === 'away' ? awayName : 'Empate'}</strong>
							</div>
						{/if}

						<div class="tv-match-pred-count">{selectedPreds.length} pronóstico{selectedPreds.length !== 1 ? 's' : ''}</div>

						<!-- Pozo -->
						<div class="tv-pot-block">
							<div class="tv-pot-label"><Coins size={11} weight="fill" /> AL POZO SI TODOS PIERDEN</div>
							<div class="tv-pot-number">{total.toLocaleString('es-AR')}</div>
							<div class="tv-pip-row">
								<span class="tv-pip-val">+{p.winner}</span>
								<span class="tv-pip-sep">·</span>
								<span class="tv-pip-val">+{p.exact}</span>
								<span class="tv-pip-lbl">pts en juego</span>
							</div>
						</div>
					</div>
				{/if}
			</aside>

			<!-- ── COLUMNA DERECHA (scroll) ── -->
			<main class="tv-main">
				{#if selectedMatch}
					{@const p = pip(selectedMatch)}
					{@const isFinished = selectedMatch.status === 'finished'}

					{#key selectedMatchId}
						<div class="tv-cards-col">
							{#each selectedPreds as pred, i}
								{@const isKnown = pred.points_earned !== null}
								{@const winnerCode = pred.predicted_winner === 'home'
									? selectedMatch.team_home
									: pred.predicted_winner === 'away'
										? selectedMatch.team_away
										: null}
								{@const winnerName = winnerCode ? teamName(winnerCode) : 'Empate'}
								{@const tone = CARD_TONES[i % CARD_TONES.length]}
								{@const nameParts = pred.player_name.trim().split(' ')}

								<!-- La card entra con bounce; sus elementos hacen fade L→R después -->
								<div
									class="tv-card"
									class:tv-card-correct={isKnown && pred.is_correct}
									class:tv-card-wrong={isKnown && !pred.is_correct}
									style="--card-delay: {i * 2}s; --card-bg: {tone.bg}; --card-border: {tone.border}"
								>
									<!-- Avatar -->
									<div class="tv-card-avatar tv-el tv-el-0" style="--el-delay: {i * 2 + 2}s">
										{#if pred.avatar_url}
											<img src={pred.avatar_url} alt={pred.player_name} class="tv-avatar-img" />
										{:else}
											<div class="tv-avatar-initials">
												<UserCirclePlus size={28} weight="fill" color="#fff" />
											</div>
										{/if}
									</div>

									<!-- Zona central: toma el espacio disponible, overflow hidden -->
									<div class="tv-card-mid">
										<!-- Nombre arriba / Apellido abajo -->
										<div class="tv-card-name tv-el tv-el-1" style="--el-delay: {i * 2 + 2.1}s">
											<span class="tv-name-first">{nameParts[0]}</span>
											{#if nameParts.length > 1}
												<span class="tv-name-last">{nameParts.slice(1).join(' ')}</span>
											{/if}
										</div>
										<span class="tv-card-sep tv-el tv-el-2" style="--el-delay: {i * 2 + 2.2}s">·</span>
										<span class="tv-pred-winner tv-el tv-el-3" style="--el-delay: {i * 2 + 2.3}s">{winnerName}</span>
										{#if pred.has_exact_score}
											<span class="tv-pred-score tv-el tv-el-4" style="--el-delay: {i * 2 + 2.4}s">{pred.predicted_home} – {pred.predicted_away}</span>
										{:else}
											<span class="tv-pred-noscore tv-el tv-el-4" style="--el-delay: {i * 2 + 2.4}s">SIN MARCADOR</span>
										{/if}
									</div>

									<!-- Puntos: ancho fijo a la derecha -->
									<div class="tv-card-pts tv-el tv-el-5" style="--el-delay: {i * 2 + 2.5}s">
										{#if isKnown}
											<span class="tv-pts-num" class:pos={pred.points_earned! > 0} class:neg={pred.points_earned! < 0}>
												{pred.points_earned! > 0 ? '+' : ''}{pred.points_earned}
											</span>
											{#if pred.is_correct}
												<CheckCircle size={16} weight="fill" color="#157a4a" />
											{:else}
												<XCircle size={16} weight="fill" color="#c0303a" />
											{/if}
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
			</main>
		</div>
	{/if}
</div>

<style>
	:global(body):has(.tv-wrap) {
		background: #04091a !important;
		background-image: none !important;
		margin: 0; padding: 0; overflow: hidden;
	}
	:global(body):has(.tv-wrap) :global(.nav-main),
	:global(body):has(.tv-wrap) :global(.nav-strip) {
		display: none !important;
	}

	/* ── Contenedor raíz ── */
	.tv-wrap {
		position: relative;
		width: 100vw; height: 100vh;
		overflow: hidden;
		font-family: 'Instrument Sans', sans-serif;
		color: #fff;
	}

	/* ── Fondo con imagen al 10% de opacidad ── */
	.tv-bg-img {
		position: fixed; inset: 0; z-index: 0;
		background-image: url('/background.png');
		background-size: cover;
		background-position: center;
		opacity: 0.08;
	}
	/* Capa degradada azul-negra encima */
	.tv-bg-overlay {
		position: fixed; inset: 0; z-index: 1;
		background: linear-gradient(
			160deg,
			rgba(3,10,30,0.92) 0%,
			rgba(6,20,60,0.82) 45%,
			rgba(2,8,25,0.94) 100%
		);
	}

	/* ── Loading ── */
	.tv-loading {
		position: relative; z-index: 2;
		display: flex; align-items: center; justify-content: center;
		height: 100vh;
	}
	.tv-spinner {
		width: 52px; height: 52px;
		border: 3px solid rgba(255,255,255,0.08);
		border-top-color: #7ab8f5;
		border-radius: 50%;
		animation: spin 0.8s linear infinite;
	}
	@keyframes spin { to { transform: rotate(360deg); } }

	/* ── Layout dos columnas ── */
	.tv-layout {
		position: relative; z-index: 2;
		display: flex;
		height: 100vh;
		overflow: hidden;
	}

	/* ── Sidebar izquierda (fija) ── */
	.tv-sidebar {
		width: 300px;
		flex-shrink: 0;
		display: flex;
		flex-direction: column;
		gap: 18px;
		padding: 28px 20px 28px 28px;
		border-right: 1px solid rgba(122,184,245,0.1);
		background: rgba(4,9,26,0.45);
		backdrop-filter: blur(12px);
		overflow-y: auto;
	}

	/* ── Título ── */
	.tv-title-block {
		display: flex; flex-direction: column; align-items: flex-start;
		gap: 3px;
	}
	.tv-title-icon { line-height: 1; margin-bottom: 2px; }
	.tv-title {
		font-family: 'Inter', sans-serif;
		font-size: 26px; font-weight: 900;
		color: #fff; letter-spacing: -0.04em;
		line-height: 1; margin: 0;
	}
	.tv-subtitle {
		font-family: 'Inter', sans-serif;
		font-size: 10px; font-weight: 700;
		letter-spacing: 0.16em; text-transform: uppercase;
		color: rgba(255,255,255,0.3); margin: 0;
	}

	/* ── Tags lista vertical ── */
	.tv-tags-list {
		display: flex; flex-direction: column; gap: 6px;
	}
	.tv-tags-empty { font-size: 13px; color: rgba(255,255,255,0.2); font-style: italic; }

	.tv-tag {
		display: flex; align-items: center; justify-content: space-between; gap: 8px;
		padding: 8px 14px;
		border-radius: 10px;
		border: 1px solid rgba(255,255,255,0.07);
		background: rgba(255,255,255,0.03);
		cursor: pointer;
		transition: all 0.18s;
		color: rgba(255,255,255,0.4);
		text-align: left;
		width: 100%;
	}
	.tv-tag:hover { border-color: rgba(122,184,245,0.3); color: rgba(255,255,255,0.75); }
	.tv-tag.active {
		border-color: rgba(122,184,245,0.5);
		background: rgba(122,184,245,0.1);
		color: #fff;
		box-shadow: 0 0 14px rgba(122,184,245,0.1);
	}
	.tv-tag-name { font-size: 12px; font-weight: 600; flex: 1; }
	.tv-tag-badge {
		font-family: 'DM Mono', monospace;
		font-size: 11px; font-weight: 800;
		color: #7ab8f5;
		background: rgba(122,184,245,0.12);
		border-radius: 10px;
		padding: 1px 8px;
		flex-shrink: 0;
	}
	.tv-tag.active .tv-tag-badge { background: rgba(122,184,245,0.25); }

	/* ── Card del partido seleccionado ── */
	.tv-match-card {
		position: relative;
		display: flex; flex-direction: column; gap: 8px;
		padding: 18px 20px;
		border-radius: 16px;
		background: linear-gradient(160deg, rgba(14,40,110,0.7) 0%, rgba(6,18,56,0.85) 100%);
		border: 1px solid rgba(122,184,245,0.18);
		overflow: hidden;
	}
	.tv-match-card::before {
		content: '';
		position: absolute; top: 0; left: 0; right: 0; height: 2px;
		background: linear-gradient(90deg, transparent, rgba(122,184,245,0.5), transparent);
	}
	.tv-match-phase-pill {
		font-family: 'Inter', sans-serif;
		font-size: 9px; font-weight: 800;
		letter-spacing: 0.18em; text-transform: uppercase;
		color: #7ab8f5;
		background: rgba(122,184,245,0.1);
		border: 1px solid rgba(122,184,245,0.18);
		border-radius: 16px;
		padding: 2px 10px;
		align-self: flex-start;
	}
	.tv-match-team-row {
		display: flex; align-items: center; justify-content: space-between; gap: 10px;
	}
	.tv-match-fi { width: 26px; height: 18px; border-radius: 3px; flex-shrink: 0; }
	.tv-match-team {
		font-family: 'Inter', sans-serif;
		font-size: 20px; font-weight: 900;
		color: #fff; letter-spacing: -0.03em;
	}
	.tv-match-vs-row {
		font-size: 11px; color: rgba(255,255,255,0.22);
		font-weight: 700; letter-spacing: 0.08em;
		padding-left: 2px;
	}
	.tv-match-result-line { font-size: 12px; color: rgba(255,255,255,0.45); }
	.tv-match-result-line strong { color: #3dd68c; }
	.tv-match-pred-count { font-size: 11px; color: rgba(255,255,255,0.25); }

	/* Pozo */
	.tv-pot-block {
		display: flex; flex-direction: column; gap: 2px;
		padding-top: 10px;
		border-top: 1px solid rgba(122,184,245,0.1);
	}
	.tv-pot-label {
		display: flex; align-items: center; gap: 5px;
		font-family: 'Inter', sans-serif;
		font-size: 8px; font-weight: 800;
		letter-spacing: 0.18em; text-transform: uppercase;
		color: rgba(245,194,0,0.5);
	}
	.tv-pot-number {
		font-family: 'DM Mono', monospace;
		font-size: 42px; font-weight: 900;
		color: #f5c200; line-height: 1;
		text-shadow: 0 0 28px rgba(245,194,0,0.45);
		animation: pip-glow 3s ease-in-out infinite;
	}
	@keyframes pip-glow {
		0%,100% { text-shadow: 0 0 28px rgba(245,194,0,0.45); }
		50%      { text-shadow: 0 0 44px rgba(245,194,0,0.7), 0 0 80px rgba(245,194,0,0.25); }
	}
	.tv-pip-row { display: flex; align-items: center; gap: 6px; }
	.tv-pip-val {
		font-family: 'DM Mono', monospace;
		font-size: 13px; font-weight: 800;
		color: rgba(245,194,0,0.65);
	}
	.tv-pip-sep { color: rgba(255,255,255,0.15); font-size: 12px; }
	.tv-pip-lbl { font-size: 10px; color: rgba(255,255,255,0.2); }

	/* ── Columna derecha ── */
	.tv-main {
		flex: 1;
		min-width: 0;
		overflow-y: auto;
		overflow-x: hidden;
		padding: 28px 28px 48px;
	}

	/* ── Cards ── */
	.tv-cards-col {
		display: flex; flex-direction: column; gap: 10px;
		width: 80%;
		min-width: 380px;
	}

	/* Card bounce al entrar */
	@keyframes card-enter {
		0%   { opacity: 0; transform: translateY(40px) scale(0.94); }
		65%  { transform: translateY(-4px) scale(1.012); }
		100% { opacity: 1; transform: translateY(0) scale(1); }
	}
	/* Fade de cada elemento interno (izq → der) */
	@keyframes el-fade {
		from { opacity: 0; transform: translateX(-10px); }
		to   { opacity: 1; transform: translateX(0); }
	}

	.tv-card {
		opacity: 0;
		animation: card-enter 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) var(--card-delay, 0s) forwards;
		border-radius: 14px;
		border: 1px solid var(--card-border, #b8d8f8);
		background: var(--card-bg, #e8f4ff);
		display: flex;
		align-items: center;
		gap: 12px;
		padding: 1px 16px;
		transition: box-shadow 0.18s;
		min-width: 0;
		overflow: hidden;
	}
	.tv-card:hover { box-shadow: 0 4px 20px rgba(0,0,0,0.3); }
	.tv-card.tv-card-correct { --card-bg: #ddf7ec; --card-border: #8adab8; background: var(--card-bg); border-color: var(--card-border); }
	.tv-card.tv-card-wrong   { --card-bg: #fdeef0; --card-border: #f0b8c0; background: var(--card-bg); border-color: var(--card-border); }

	/* Elementos que hacen fade L→R después del bounce */
	.tv-el {
		opacity: 0;
		animation: el-fade 0.3s ease-out var(--el-delay, 0s) forwards;
	}

	/* Avatar */
	.tv-card-avatar { flex-shrink: 0; }
	.tv-avatar-img {
		width: 44px; height: 44px;
		border-radius: 50%; object-fit: cover;
		border: 2px solid rgba(10,40,100,0.15);
		box-shadow: 0 2px 8px rgba(0,0,0,0.12);
		display: block;
	}
	.tv-avatar-initials {
		width: 44px; height: 44px;
		border-radius: 50%;
		background: linear-gradient(135deg, #3a7acc, #1e4e9a);
		display: flex; align-items: center; justify-content: center;
		box-shadow: 0 2px 8px rgba(30,78,154,0.3);
	}

	/* Zona central flex: toma el espacio restante, contiene nombre + pred en línea */
	.tv-card-mid {
		flex: 1;
		min-width: 0;
		display: flex;
		align-items: center;
		gap: 10px;
		overflow: hidden;
	}

	/* Puntos: bloque fijo a la derecha */
	.tv-card-pts {
		flex-shrink: 0;
		width: 72px;
		display: flex; align-items: center; justify-content: flex-end; gap: 5px;
	}

	/* Elementos en línea */
	.tv-card-name {
		display: flex; flex-direction: column; gap: 0;
		flex: 0 1 14ch;
		min-width: 60px;
		overflow: hidden;
	}
	.tv-name-first {
		font-family: 'Inter', sans-serif;
		font-size: clamp(12px, 1.1vw, 15px); font-weight: 800;
		color: #0a1e50;
		white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
		line-height: 1.2;
	}
	.tv-name-last {
		font-family: 'Inter', sans-serif;
		font-size: clamp(10px, 0.9vw, 12px); font-weight: 600;
		color: #3a5a9a;
		white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
		line-height: 1.2;
	}
	.tv-card-sep { color: rgba(10,30,80,0.25); font-size: 13px; flex-shrink: 0; }
	.tv-pred-winner {
		font-size: clamp(12px, 1vw, 14px); font-weight: 700;
		color: #1a3a80;
		white-space: nowrap;
		flex-shrink: 0;
	}
	.tv-pred-score {
		font-family: 'DM Mono', monospace;
		font-size: clamp(12px, 1vw, 14px); font-weight: 800;
		color: #0a1e50;
		background: rgba(30,70,180,0.1);
		padding: 2px 9px;
		border-radius: 7px;
		white-space: nowrap;
		flex-shrink: 0;
	}
	.tv-pred-noscore {
		font-family: 'Inter', sans-serif;
		font-size: clamp(9px, 0.8vw, 11px); font-weight: 800;
		letter-spacing: 0.08em;
		color: #fff;
		background: #b07000;
		padding: 3px 9px;
		border-radius: 6px;
		white-space: nowrap;
		flex-shrink: 0;
	}

	/* (pts ya definido arriba) */
	.tv-pts-num { font-family: 'DM Mono', monospace; font-size: clamp(16px, 1.4vw, 20px); font-weight: 900; }
	.tv-pts-num.pos { color: #157a4a; }
	.tv-pts-num.neg { color: #c0303a; }
	.tv-pts-pending {
		font-family: 'DM Mono', monospace;
		font-size: clamp(15px, 1.3vw, 18px); font-weight: 900;
		color: #1a5ca0;
	}
	.tv-pts-bonus {
		font-family: 'DM Mono', monospace;
		font-size: 11px; color: rgba(26,92,160,0.55);
	}

	/* Empty */
	.tv-empty {
		text-align: center; color: rgba(255,255,255,0.12);
		font-size: 18px; padding: 80px 0; font-style: italic;
	}
</style>
