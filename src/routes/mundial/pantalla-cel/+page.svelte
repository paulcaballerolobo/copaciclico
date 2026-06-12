<script lang="ts">
	import { onMount } from 'svelte';
	import { supabase } from '$lib/supabase';
	import 'flag-icons/css/flag-icons.min.css';
	import Trophy from 'phosphor-svelte/lib/Trophy';
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
	let showMatchPicker = false;

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
		return { winner: base, exact: Math.round(base * 0.7) };
	}

	const CARD_TONES = [
		{ bg: 'rgba(232,244,255,0.92)', border: 'rgba(184,216,248,0.7)' },
		{ bg: 'rgba(240,248,255,0.92)', border: 'rgba(204,232,255,0.7)' },
		{ bg: 'rgba(221,238,255,0.92)', border: 'rgba(170,208,240,0.7)' },
		{ bg: 'rgba(245,250,255,0.92)', border: 'rgba(208,232,250,0.7)' },
		{ bg: 'rgba(224,240,252,0.92)', border: 'rgba(176,212,240,0.7)' },
	];

	$: matchesWithPreds = matches.filter(m => (allMatchPreds[m.id]?.length ?? 0) > 0);
	// Último partido disponible primero (más reciente arriba)
	$: orderedMatches = [...matchesWithPreds].sort(
		(a, b) => new Date(b.kickoff_time).getTime() - new Date(a.kickoff_time).getTime()
	);
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

		// matches viene ordenado por kickoff_time asc → el último con pronósticos es el más reciente
		const withPreds = matches.filter(m => (preds[m.id]?.length ?? 0) > 0);
		const latest = withPreds.at(-1);
		if (latest) selectedMatchId = latest.id;

		loading = false;
	});

	function phaseLabel(p: string): string {
		const map: Record<string, string> = {
			groups: 'Grupo', r32: 'R32', r16: 'Octavos',
			qf: 'Cuartos', sf: 'Semis', '3rd': '3er puesto', final: 'Final'
		};
		return map[p] ?? p;
	}

	function selectMatch(id: string) {
		selectedMatchId = id;
		showMatchPicker = false;
	}
</script>

<svelte:head>
	<title>Pronósticos · Mundial Cíclico</title>
	<meta name="robots" content="noindex" />
</svelte:head>

<div class="cel-wrap">
	<div class="cel-bg"></div>

	{#if loading}
		<div class="cel-loading">
			<div class="cel-spinner"></div>
		</div>

	{:else}
		<!-- ── HEADER ── -->
		<header class="cel-header">
			<div class="cel-header-left">
				<Trophy weight="fill" size={18} color="#f5c200" />
				<span class="cel-header-title">Mundial Cíclico</span>
			</div>
			{#if selectedMatch}
				<button class="cel-match-pill" on:click={() => showMatchPicker = true}>
					<span class="fi fi-{teamFlag(selectedMatch.team_home)} cel-pill-flag"></span>
					<span class="cel-pill-text">{teamName(selectedMatch.team_home)} · {teamName(selectedMatch.team_away)}</span>
					<span class="cel-pill-arrow">›</span>
				</button>
			{/if}
		</header>

		<!-- ── INFO DEL PARTIDO ── -->
		{#if selectedMatch}
			{@const isFinished = selectedMatch.status === 'finished'}
			<div class="cel-match-bar">
				<span class="cel-phase-pill">
					{phaseLabel(selectedMatch.phase)}{selectedMatch.group_name ? ` · Grupo ${selectedMatch.group_name}` : ''}
				</span>
				<div class="cel-match-teams">
					<div class="cel-mt">
						{#if teamFlag(selectedMatch.team_home)}
							<span class="fi fi-{teamFlag(selectedMatch.team_home)} cel-mt-flag"></span>
						{/if}
						<span class="cel-mt-name">{teamName(selectedMatch.team_home)}</span>
					</div>
					<span class="cel-mt-vs">vs</span>
					<div class="cel-mt">
						{#if teamFlag(selectedMatch.team_away)}
							<span class="fi fi-{teamFlag(selectedMatch.team_away)} cel-mt-flag"></span>
						{/if}
						<span class="cel-mt-name">{teamName(selectedMatch.team_away)}</span>
					</div>
				</div>
				{#if isFinished}
					<div class="cel-result">
						<strong>{selectedMatch.result_home} – {selectedMatch.result_away}</strong>
						· <strong>{selectedMatch.winner === 'home' ? teamName(selectedMatch.team_home) : selectedMatch.winner === 'away' ? teamName(selectedMatch.team_away) : 'Empate'}</strong>
					</div>
				{/if}
				<div class="cel-pred-count">{selectedPreds.length} pronóstico{selectedPreds.length !== 1 ? 's' : ''}</div>
			</div>
		{/if}

		<!-- ── CARDS ── -->
		<main class="cel-main">
			{#if selectedMatch}
				{@const p = pip(selectedMatch)}
				{@const isFinished = selectedMatch.status === 'finished'}

				{#key selectedMatchId}
					<div class="cel-cards">
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

							<div
								class="cel-card"
								class:cel-card-correct={isKnown && pred.is_correct}
								class:cel-card-wrong={isKnown && !pred.is_correct}
								style="--card-delay: {i * 0.07}s; --card-bg: {tone.bg}; --card-border: {tone.border}"
							>
								<!-- Avatar -->
								<div class="cel-avatar">
									{#if pred.avatar_url}
										<img src={pred.avatar_url} alt={pred.player_name} class="cel-avatar-img" />
									{:else}
										<div class="cel-avatar-initials">
											<UserCirclePlus size={24} weight="fill" color="#fff" />
										</div>
									{/if}
								</div>

								<!-- Centro -->
								<div class="cel-card-body">
									<div class="cel-card-name">
										<span class="cel-name-first">{nameParts[0]}</span>
										{#if nameParts.length > 1}
											<span class="cel-name-last">{nameParts.slice(1).join(' ')}</span>
										{/if}
									</div>
									<div class="cel-card-pred">
										<span class="cel-pred-winner">{winnerName}</span>
										{#if pred.has_exact_score}
											<span class="cel-pred-score">{pred.predicted_home} – {pred.predicted_away}</span>
										{:else}
											<span class="cel-pred-noscore">Sin marcador</span>
										{/if}
									</div>
								</div>

								<!-- Puntos -->
								<div class="cel-card-pts">
									{#if isKnown}
										<span class="cel-pts-num" class:pos={pred.points_earned! > 0} class:neg={pred.points_earned! < 0}>
											{pred.points_earned! > 0 ? '+' : ''}{pred.points_earned}
										</span>
										{#if pred.is_correct}
											<CheckCircle size={14} weight="fill" color="#157a4a" />
										{:else}
											<XCircle size={14} weight="fill" color="#c0303a" />
										{/if}
									{:else}
										<span class="cel-pts-pending">+{p.winner}</span>
										{#if pred.has_exact_score}
											<span class="cel-pts-bonus">+{p.exact}</span>
										{/if}
									{/if}
								</div>
							</div>
						{/each}
					</div>
				{/key}
			{:else}
				<div class="cel-empty">Tocá un partido para ver los pronósticos</div>
			{/if}
		</main>

		<!-- ── MATCH PICKER (sheet desde abajo) ── -->
		{#if showMatchPicker}
			<button class="cel-sheet-backdrop" on:click={() => showMatchPicker = false}></button>
			<div class="cel-sheet">
				<div class="cel-sheet-handle"></div>
				<div class="cel-sheet-title">Elegí un partido</div>
				<div class="cel-sheet-list">
					{#each orderedMatches as match}
						{@const count = allMatchPreds[match.id]?.length ?? 0}
						<button
							class="cel-sheet-item"
							class:active={selectedMatchId === match.id}
							on:click={() => selectMatch(match.id)}
						>
							<div class="cel-sheet-item-teams">
								{#if teamFlag(match.team_home)}
									<span class="fi fi-{teamFlag(match.team_home)} cel-si-flag"></span>
								{/if}
								<span class="cel-si-name">{teamName(match.team_home)} · {teamName(match.team_away)}</span>
							</div>
							<span class="cel-si-badge">{count}</span>
						</button>
					{/each}
				</div>
			</div>
		{/if}
	{/if}
</div>

<style>
	:global(body):has(.cel-wrap) {
		background: #04091a !important;
		background-image: none !important;
		margin: 0; padding: 0;
	}
	:global(body):has(.cel-wrap) :global(.nav-main),
	:global(body):has(.cel-wrap) :global(.nav-strip) {
		display: none !important;
	}

	.cel-wrap {
		position: relative;
		min-height: 100dvh;
		display: flex;
		flex-direction: column;
		font-family: 'Instrument Sans', sans-serif;
		color: #fff;
		overflow-x: hidden;
	}

	.cel-bg {
		position: fixed; inset: 0; z-index: 0;
		background: linear-gradient(160deg, #03091e 0%, #06143c 45%, #020819 100%);
	}

	/* ── Loading ── */
	.cel-loading {
		position: relative; z-index: 1;
		display: flex; align-items: center; justify-content: center;
		height: 100dvh;
	}
	.cel-spinner {
		width: 40px; height: 40px;
		border: 3px solid rgba(255,255,255,0.08);
		border-top-color: #7ab8f5;
		border-radius: 50%;
		animation: spin 0.8s linear infinite;
	}
	@keyframes spin { to { transform: rotate(360deg); } }

	/* ── Header ── */
	.cel-header {
		position: relative; z-index: 2;
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 10px;
		padding: 14px 16px 10px;
		border-bottom: 1px solid rgba(122,184,245,0.08);
		background: rgba(4,9,26,0.6);
		backdrop-filter: blur(12px);
		flex-shrink: 0;
	}
	.cel-header-left {
		display: flex; align-items: center; gap: 8px;
		flex-shrink: 0;
	}
	.cel-header-title {
		font-family: 'Inter', sans-serif;
		font-size: 15px; font-weight: 900;
		letter-spacing: -0.03em;
	}

	.cel-match-pill {
		display: flex; align-items: center; gap: 7px;
		background: rgba(122,184,245,0.1);
		border: 1px solid rgba(122,184,245,0.25);
		border-radius: 20px;
		padding: 6px 12px 6px 8px;
		color: #fff;
		cursor: pointer;
		min-width: 0;
		flex: 1;
		max-width: 240px;
	}
	.cel-pill-flag { width: 18px; height: 13px; border-radius: 2px; flex-shrink: 0; }
	.cel-pill-text {
		font-size: 12px; font-weight: 600;
		white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
		flex: 1;
	}
	.cel-pill-arrow { font-size: 16px; color: rgba(122,184,245,0.6); flex-shrink: 0; }

	/* ── Match bar ── */
	.cel-match-bar {
		position: relative; z-index: 2;
		display: flex;
		flex-direction: column;
		gap: 6px;
		padding: 14px 16px 12px;
		background: linear-gradient(160deg, rgba(14,40,110,0.5) 0%, rgba(6,18,56,0.65) 100%);
		border-bottom: 1px solid rgba(122,184,245,0.1);
		flex-shrink: 0;
	}
	.cel-phase-pill {
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
	.cel-match-teams {
		display: flex; align-items: center; gap: 10px;
	}
	.cel-mt {
		display: flex; align-items: center; gap: 7px;
		flex: 1; min-width: 0;
	}
	.cel-mt-flag { width: 22px; height: 15px; border-radius: 2px; flex-shrink: 0; }
	.cel-mt-name {
		font-family: 'Inter', sans-serif;
		font-size: 16px; font-weight: 900;
		letter-spacing: -0.02em;
		white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
	}
	.cel-mt-vs {
		font-size: 10px; color: rgba(255,255,255,0.22);
		font-weight: 700; flex-shrink: 0;
	}
	.cel-result { font-size: 12px; color: rgba(255,255,255,0.45); }
	.cel-result strong { color: #3dd68c; }
	.cel-pred-count { font-size: 11px; color: rgba(255,255,255,0.22); }

	/* ── Main scroll ── */
	.cel-main {
		position: relative; z-index: 1;
		flex: 1;
		overflow-y: auto;
		padding: 12px 12px 32px;
	}

	/* ── Cards ── */
	.cel-cards {
		display: flex; flex-direction: column; gap: 8px;
	}

	@keyframes card-enter {
		from { opacity: 0; transform: translateY(16px); }
		to   { opacity: 1; transform: translateY(0); }
	}

	.cel-card {
		opacity: 0;
		animation: card-enter 0.28s ease-out var(--card-delay, 0s) forwards;
		border-radius: 14px;
		border: 1px solid var(--card-border, #b8d8f8);
		background: var(--card-bg, #e8f4ff);
		display: flex;
		align-items: center;
		gap: 10px;
		padding: 10px 12px;
		min-width: 0;
	}
	.cel-card.cel-card-correct { --card-bg: #ddf7ec; --card-border: #8adab8; background: var(--card-bg); border-color: var(--card-border); }
	.cel-card.cel-card-wrong   { --card-bg: #fdeef0; --card-border: #f0b8c0; background: var(--card-bg); border-color: var(--card-border); }

	/* Avatar */
	.cel-avatar { flex-shrink: 0; }
	.cel-avatar-img {
		width: 38px; height: 38px;
		border-radius: 50%; object-fit: cover;
		border: 2px solid rgba(10,40,100,0.12);
		display: block;
	}
	.cel-avatar-initials {
		width: 38px; height: 38px;
		border-radius: 50%;
		background: linear-gradient(135deg, #3a7acc, #1e4e9a);
		display: flex; align-items: center; justify-content: center;
	}

	/* Body */
	.cel-card-body {
		flex: 1;
		min-width: 0;
		display: flex;
		flex-direction: column;
		gap: 3px;
	}
	.cel-card-name {
		display: flex; align-items: baseline; gap: 5px;
	}
	.cel-name-first {
		font-family: 'Inter', sans-serif;
		font-size: 14px; font-weight: 800;
		color: #0a1e50;
		white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
	}
	.cel-name-last {
		font-family: 'Inter', sans-serif;
		font-size: 12px; font-weight: 600;
		color: #3a5a9a;
		white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
	}
	.cel-card-pred {
		display: flex; align-items: center; gap: 7px;
		flex-wrap: wrap;
	}
	.cel-pred-winner {
		font-size: 12px; font-weight: 700;
		color: #1a3a80;
		white-space: nowrap;
	}
	.cel-pred-score {
		font-family: 'DM Mono', monospace;
		font-size: 12px; font-weight: 800;
		color: #0a1e50;
		background: rgba(30,70,180,0.1);
		padding: 1px 7px;
		border-radius: 6px;
		white-space: nowrap;
	}
	.cel-pred-noscore {
		font-family: 'Inter', sans-serif;
		font-size: 10px; font-weight: 700;
		letter-spacing: 0.04em;
		color: #fff;
		background: #b07000;
		padding: 2px 7px;
		border-radius: 5px;
		white-space: nowrap;
	}

	/* Puntos */
	.cel-card-pts {
		flex-shrink: 0;
		display: flex; flex-direction: column; align-items: flex-end; gap: 2px;
	}
	.cel-pts-num {
		font-family: 'DM Mono', monospace;
		font-size: 18px; font-weight: 900;
		line-height: 1;
	}
	.cel-pts-num.pos { color: #157a4a; }
	.cel-pts-num.neg { color: #c0303a; }
	.cel-pts-pending {
		font-family: 'DM Mono', monospace;
		font-size: 16px; font-weight: 900;
		color: #1a5ca0;
		line-height: 1;
	}
	.cel-pts-bonus {
		font-family: 'DM Mono', monospace;
		font-size: 10px; color: rgba(26,92,160,0.5);
	}

	/* Empty */
	.cel-empty {
		text-align: center; color: rgba(255,255,255,0.12);
		font-size: 16px; padding: 60px 0; font-style: italic;
	}

	/* ── Sheet backdrop ── */
	.cel-sheet-backdrop {
		position: fixed; inset: 0; z-index: 10;
		background: rgba(0,0,0,0.55);
		border: none;
		cursor: default;
	}

	/* ── Sheet ── */
	.cel-sheet {
		position: fixed;
		bottom: 0; left: 0; right: 0;
		z-index: 11;
		background: #0a1428;
		border-top: 1px solid rgba(122,184,245,0.15);
		border-radius: 20px 20px 0 0;
		padding: 12px 16px 40px;
		max-height: 70dvh;
		display: flex;
		flex-direction: column;
		gap: 12px;
		animation: sheet-up 0.28s cubic-bezier(0.32,0.72,0,1) forwards;
	}
	@keyframes sheet-up {
		from { transform: translateY(100%); }
		to   { transform: translateY(0); }
	}
	.cel-sheet-handle {
		width: 36px; height: 4px;
		background: rgba(255,255,255,0.15);
		border-radius: 2px;
		align-self: center;
		flex-shrink: 0;
	}
	.cel-sheet-title {
		font-family: 'Inter', sans-serif;
		font-size: 13px; font-weight: 700;
		letter-spacing: 0.12em; text-transform: uppercase;
		color: rgba(255,255,255,0.35);
		flex-shrink: 0;
	}
	.cel-sheet-list {
		overflow-y: auto;
		display: flex; flex-direction: column; gap: 6px;
	}
	.cel-sheet-item {
		display: flex; align-items: center; justify-content: space-between; gap: 10px;
		padding: 12px 14px;
		border-radius: 12px;
		border: 1px solid rgba(255,255,255,0.07);
		background: rgba(255,255,255,0.03);
		cursor: pointer;
		color: rgba(255,255,255,0.5);
		text-align: left;
		transition: all 0.15s;
	}
	.cel-sheet-item:active { background: rgba(255,255,255,0.08); }
	.cel-sheet-item.active {
		border-color: rgba(122,184,245,0.45);
		background: rgba(122,184,245,0.1);
		color: #fff;
	}
	.cel-sheet-item-teams {
		display: flex; align-items: center; gap: 8px;
		flex: 1; min-width: 0;
	}
	.cel-si-flag { width: 18px; height: 13px; border-radius: 2px; flex-shrink: 0; }
	.cel-si-name {
		font-size: 13px; font-weight: 600;
		white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
	}
	.cel-si-badge {
		font-family: 'DM Mono', monospace;
		font-size: 11px; font-weight: 800;
		color: #7ab8f5;
		background: rgba(122,184,245,0.12);
		border-radius: 10px;
		padding: 1px 8px;
		flex-shrink: 0;
	}
	.cel-sheet-item.active .cel-si-badge { background: rgba(122,184,245,0.25); }
</style>
