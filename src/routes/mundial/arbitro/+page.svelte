<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { supabase } from '$lib/supabase';
	import { getSession, logout, type MundialUser } from '$lib/mundial/auth';
	import { formatDateAR, generateCode, flag } from '$lib/mundial/utils';

	// ─── TIPOS ───────────────────────────────────────────────────
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
		went_to_extra_time: boolean;
		extra_time_home: number | null;
		extra_time_away: number | null;
		penalties_home: number | null;
		penalties_away: number | null;
		predictions_open: boolean;
		predictions_status?: 'waiting' | 'open' | 'closed';
		confirmed_by_admin: boolean;
	}

	interface Player {
		id: string;
		full_name: string;
		username: string;
		access_code: string;
		avatar_url: string | null;
		points_total: number;
		ranking_position: number | null;
		is_admin: boolean;
		is_active: boolean;
	}

	interface TriviaQuestion {
		id: string;
		question_text: string;
		option_a: string;
		option_b: string;
		option_c: string;
		option_d: string;
		correct_answer: string;
		difficulty: number;
		category: string | null;
		is_active: boolean;
		block_reason: string | null;
	}

	interface TriviaSession {
		id: string;
		user_id: string;
		phase: string;
		level_chosen: number;
		status: string;
		score: number;
		points_earned: number;
		enabled_by_admin: boolean;
		enabled_at: string | null;
		started_at: string | null;
		completed_at: string | null;
		question_ids: string[];
		answers: Array<{ question_id: string; selected: string; correct: boolean; time_taken_ms: number }>;
		var_requests?: string[];
	}

	// ─── ESTADO ───────────────────────────────────────────────────
	let user: MundialUser | null = null;
	let isAdmin = false;
	let loginError = '';

	// Config
	let isRehearsalMode = true;
	let currentPhase = 'groups';
	let currentWeek = 1;
	let pozoStatus = 'closed';
	let pozoInitialAmount = 500;
	let triviaPenalty = 2;

	// Datos
	let matches: Match[] = [];
	let players: Player[] = [];
	let triviaQuestions: TriviaQuestion[] = [];
	let triviaSessions: TriviaSession[] = [];

	// UI state
	let activeTab: 'matches' | 'players' | 'trivia' | 'pozo' = 'matches';
	let loading = true;
	let savingConfig = false;
	let modeConfirmDialog = false;
	let modeTargetReal = false;
	let triggeringAnimation = false;
	let broadcastChannel: ReturnType<typeof supabase.channel> | null = null;
	let triviaRealtimeChannel: ReturnType<typeof supabase.channel> | null = null;

	// Confirmación cierre de pronósticos
	let closePredsMatch: Match | null = null;

	// Resultado de partido
	let resultForms: Record<string, { home: string; away: string; winner: string; penalties: boolean; extraTime: boolean; etHome: string; etAway: string; penHome: string; penAway: string; saving: boolean }> = {};

	// Pronósticos por partido
	let expandedPreds: Set<string> = new Set();
	let matchPredictions: Record<string, { user_id: string; predicted_winner: string; predicted_home: number | null; predicted_away: number | null; has_exact_score: boolean; entered_by?: string }[]> = {};
	let predForms: Record<string, Record<string, { winner: string; scoreHome: string; scoreAway: string; saving: boolean }>> = {};
	let predCounts: Record<string, number> = {};
	let editingPreds: Record<string, Set<string>> = {}; // matchId → Set<playerId>

	// Filtro de semana
	let selectedWeek = 1;
	let showFinished = false;

	// Edición de fecha/hora
	let editingKickoff: Set<string> = new Set();
	let kickoffForms: Record<string, { date: string; time: string }> = {};

	$: activePlayers = players.filter(p => !p.is_admin && p.is_active);

	// Nuevo partido
	let showAddMatch = false;
	let newMatch = { phase: 'groups', group_name: '', week_number: '1', team_home: '', team_away: '', kickoff_time: '', venue: '' };

	// Nuevo jugador
	let showAddPlayer = false;
	let newPlayer = { full_name: '', username: '', access_code: '' };

	// Nueva pregunta trivia
	let showAddQuestion = false;
	let newQuestion = { question_text: '', option_a: '', option_b: '', option_c: '', option_d: '', correct_answer: 'a', difficulty: '1', category: '', explanation: '' };

	// Bloqueo pregunta
	let blockingQuestion: TriviaQuestion | null = null;
	let blockReason = '';

	// Trivia: filas expandidas por jugador
	let expandedTrivaPlayers: Set<string> = new Set();
	let triviaSubTab: 'players' | 'questions' = 'players';

	// Pozo
	let pozoSeedAmount = '';
	let pozoTotal = 0;

	// ─── MOUNT ────────────────────────────────────────────────────
	onMount(async () => {
		const session = getSession();
		if (!session || !session.is_admin) {
			loginError = 'Acceso denegado. Solo el admin puede ver esta página.';
			loading = false;
			return;
		}
		user = session;
		isAdmin = true;
		broadcastChannel = supabase.channel('prode-broadcast').subscribe();
		await loadAll();
		loading = false;

		// Realtime: escuchar cambios en trivia_sessions para actualizar botones en vivo
		triviaRealtimeChannel = supabase
			.channel('admin-trivia-sessions')
			.on(
				'postgres_changes',
				{ event: '*', schema: 'public', table: 'trivia_sessions' },
				(payload) => {
					if (payload.eventType === 'INSERT') {
						triviaSessions = [...triviaSessions, payload.new as TriviaSession];
					} else if (payload.eventType === 'UPDATE') {
						triviaSessions = triviaSessions.map((s) =>
							s.id === (payload.new as TriviaSession).id ? (payload.new as TriviaSession) : s
						);
					} else if (payload.eventType === 'DELETE') {
						triviaSessions = triviaSessions.filter((s) => s.id !== (payload.old as TriviaSession).id);
					}
				}
			)
			.subscribe();
	});

	onDestroy(() => {
		if (broadcastChannel) supabase.removeChannel(broadcastChannel);
		if (triviaRealtimeChannel) supabase.removeChannel(triviaRealtimeChannel);
	});

	// ─── CARGA ───────────────────────────────────────────────────
	async function loadAll() {
		await Promise.all([loadConfig(), loadMatches(), loadPlayers(), loadTrivia()]);
		await loadPredCounts();
	}

	async function loadConfig() {
		const { data } = await supabase.from('config').select('key, value');
		if (!data) return;
		const cfg = Object.fromEntries(data.map((r: { key: string; value: string }) => [r.key, r.value]));
		isRehearsalMode = cfg.is_rehearsal_mode === 'true';
		currentPhase = cfg.current_phase ?? 'groups';
		currentWeek = parseInt(cfg.current_week ?? '1');
		pozoStatus = cfg.pozo_status ?? 'closed';
		pozoInitialAmount = parseInt(cfg.pozo_initial_amount ?? '500');
		triviaPenalty = parseInt(cfg.trivia_penalty_points ?? '2');

		const { data: pozoLog } = await supabase.from('pozo_log').select('amount');
		if (pozoLog) pozoTotal = pozoLog.reduce((s: number, r: { amount: number }) => s + r.amount, 0);
	}

	async function loadMatches() {
		const { data } = await supabase.from('matches').select('*').order('kickoff_time');
		matches = (data ?? []) as Match[];
		matches.forEach((m) => {
			if (!resultForms[m.id]) {
				resultForms[m.id] = {
					home: m.result_home !== null ? String(m.result_home) : '',
					away: m.result_away !== null ? String(m.result_away) : '',
					winner: m.winner ?? '',
					penalties: m.went_to_penalties,
					extraTime: m.went_to_extra_time,
					etHome: m.extra_time_home !== null ? String(m.extra_time_home) : '',
					etAway: m.extra_time_away !== null ? String(m.extra_time_away) : '',
					penHome: m.penalties_home !== null ? String(m.penalties_home) : '',
					penAway: m.penalties_away !== null ? String(m.penalties_away) : '',
					saving: false
				};
			}
		});
	}

	async function loadPlayers() {
		const { data } = await supabase.from('users').select('*').order('ranking_position', { ascending: true, nullsFirst: false });
		players = (data ?? []) as Player[];
	}

	async function loadTrivia() {
		const { data: qs } = await supabase.from('trivia_questions').select('*').order('created_at');
		triviaQuestions = (qs ?? []) as TriviaQuestion[];

		const { data: ts } = await supabase.from('trivia_sessions').select('*').order('enabled_at', { ascending: false });
		triviaSessions = (ts ?? []) as TriviaSession[];
	}

	// ─── MODO DEL SISTEMA ─────────────────────────────────────────
	async function setMode(toReal: boolean) {
		modeTargetReal = toReal;
		if (toReal) {
			modeConfirmDialog = true;
			return;
		}
		await updateConfig('is_rehearsal_mode', 'true');
		isRehearsalMode = true;
	}

	async function confirmSetReal() {
		modeConfirmDialog = false;
		savingConfig = true;
		// Borrar todos los datos de ensayo
		await supabase.from('predictions').delete().eq('is_rehearsal', true);
		await supabase.from('trivia_sessions').delete().eq('is_rehearsal', true);
		// Resetear puntos y ranking de todos los jugadores a cero
		await supabase.from('users').update({ points_total: 0, ranking_position: null })
			.eq('is_active', true).eq('is_admin', false);
		await updateConfig('is_rehearsal_mode', 'false');
		isRehearsalMode = false;
		savingConfig = false;
		await loadAll();
	}

	async function updateConfig(key: string, value: string) {
		await supabase.from('config').update({ value, updated_at: new Date().toISOString() }).eq('key', key);
	}

	// ─── PARTIDOS ─────────────────────────────────────────────────
	async function setPredictionsStatus(match: Match, status: 'waiting' | 'open' | 'closed') {
		const isOpen = status === 'open';
		const { error } = await supabase.from('matches')
			.update({ predictions_open: isOpen, predictions_status: status })
			.eq('id', match.id);
		if (error) {
			await supabase.from('matches').update({ predictions_open: isOpen }).eq('id', match.id);
		}
		await loadMatches();
	}

	function getPredStatus(match: Match): 'waiting' | 'open' | 'closed' {
		if (match.predictions_status) return match.predictions_status;
		return match.predictions_open ? 'open' : 'waiting';
	}

	async function toggleLive(match: Match) {
		const newStatus = match.status === 'live' ? 'upcoming' : 'live';
		await supabase.from('matches').update({ status: newStatus }).eq('id', match.id);
		match.status = newStatus;
		matches = [...matches];
	}

	async function confirmResult(match: Match) {
		const form = resultForms[match.id];
		if (!form || form.home === '' || form.away === '' || !form.winner) {
			alert('Completá todos los campos del resultado');
			return;
		}

		resultForms[match.id].saving = true;
		resultForms = { ...resultForms };

		const resultHome = parseInt(form.home);
		const resultAway = parseInt(form.away);

		const { error } = await supabase.from('matches').update({
			result_home: resultHome,
			result_away: resultAway,
			winner: form.winner,
			went_to_penalties: form.penalties,
			went_to_extra_time: form.extraTime,
			extra_time_home: form.extraTime && form.etHome !== '' ? parseInt(form.etHome) : null,
			extra_time_away: form.extraTime && form.etAway !== '' ? parseInt(form.etAway) : null,
			penalties_home: form.penalties && form.penHome !== '' ? parseInt(form.penHome) : null,
			penalties_away: form.penalties && form.penAway !== '' ? parseInt(form.penAway) : null,
			status: 'finished',
			confirmed_by_admin: true
		}).eq('id', match.id);

		if (error) {
			alert('Error: ' + error.message);
			resultForms[match.id].saving = false;
			return;
		}

		// Calcular puntos de predicciones
		await processMatchResult(match.id, resultHome, resultAway, form.winner, form.penalties, match.phase);

		resultForms[match.id].saving = false;
		resultForms = { ...resultForms };
		await loadMatches();
		await loadPlayers();
	}

	async function processMatchResult(
		matchId: string, resultHome: number, resultAway: number,
		winner: string, wentToPenalties: boolean, phase: string
	) {
		const BASE_POINTS: Record<string, number> = {
			groups: 100, r32: 200, r16: 400, qf: 800, sf: 1500, '3rd': 800, final: 2000
		};
		const base = BASE_POINTS[phase] ?? 100;

		const { data: preds } = await supabase
			.from('predictions')
			.select('*, users(points_total)')
			.eq('match_id', matchId);

		if (!preds) return;

		for (const pred of preds) {
			const isCorrect = pred.predicted_winner === winner;
			const exactScoreCorrect = pred.has_exact_score &&
				pred.predicted_home === resultHome && pred.predicted_away === resultAway;
			const exactScoreWrong = pred.has_exact_score && !exactScoreCorrect;

			let points = 0;
			if (isCorrect) points += base;
			if (exactScoreCorrect) points += Math.round(base * 0.7);
			if (exactScoreWrong) points -= Math.round(base * 0.4);

			await supabase.from('predictions').update({
				is_correct: isCorrect,
				exact_score_correct: exactScoreCorrect,
				exact_score_wrong: exactScoreWrong,
				points_earned: points
			}).eq('id', pred.id);

			if (!isRehearsalMode && points !== 0) {
				const current = pred.users?.points_total ?? 0;
				await supabase.from('users').update({ points_total: Math.max(0, current + points) }).eq('id', pred.user_id);
			}
		}

		// Recalcular ranking
		await recalculateRankings();
	}

	async function triggerLiveAnimation() {
		if (triggeringAnimation) return;
		triggeringAnimation = true;
		await recalculateRankings();
		// Broadcast por el canal ya suscrito
		await broadcastChannel?.send({
			type: 'broadcast',
			event: 'animate_ranking',
			payload: {}
		});
		triggeringAnimation = false;
	}

	async function recalculateRankings() {
		const { data: allUsers } = await supabase
			.from('users')
			.select('id, points_total')
			.eq('is_active', true)
			.order('points_total', { ascending: false });

		if (!allUsers) return;

		for (let i = 0; i < allUsers.length; i++) {
			await supabase.from('users').update({ ranking_position: i + 1 }).eq('id', allUsers[i].id);
		}
	}

	async function addMatch() {
		if (!newMatch.team_home || !newMatch.team_away || !newMatch.kickoff_time) return;
		const { error } = await supabase.from('matches').insert({
			phase: newMatch.phase,
			group_name: newMatch.group_name || null,
			week_number: parseInt(newMatch.week_number),
			team_home: newMatch.team_home,
			team_away: newMatch.team_away,
			kickoff_time: newMatch.kickoff_time,
			venue: newMatch.venue || null
		});
		if (error) { alert('Error: ' + error.message); return; }
		showAddMatch = false;
		newMatch = { phase: 'groups', group_name: '', week_number: '1', team_home: '', team_away: '', kickoff_time: '', venue: '' };
		await loadMatches();
	}

	// ─── PRED COUNTS ─────────────────────────────────────────────
	async function loadPredCounts() {
		const { data } = await supabase.from('predictions').select('match_id');
		if (!data) return;
		predCounts = {};
		for (const r of data) predCounts[r.match_id] = (predCounts[r.match_id] ?? 0) + 1;
		predCounts = { ...predCounts };
	}

	// ─── KICKOFF EDIT ─────────────────────────────────────────────
	function startEditKickoff(match: Match) {
		const d = new Date(match.kickoff_time);
		// Convertir a ART (UTC-3)
		const art = new Date(d.getTime() - 3 * 3600 * 1000);
		kickoffForms[match.id] = {
			date: art.toISOString().slice(0, 10),
			time: art.toISOString().slice(11, 16)
		};
		editingKickoff.add(match.id);
		editingKickoff = new Set(editingKickoff);
	}

	async function saveKickoff(match: Match) {
		const f = kickoffForms[match.id];
		if (!f?.date || !f?.time) return;
		const iso = `${f.date}T${f.time}:00-03:00`;
		await supabase.from('matches').update({ kickoff_time: iso }).eq('id', match.id);
		match.kickoff_time = iso;
		matches = [...matches];
		editingKickoff.delete(match.id);
		editingKickoff = new Set(editingKickoff);
	}

	// ─── PRONÓSTICOS ─────────────────────────────────────────────
	async function togglePreds(matchId: string) {
		if (expandedPreds.has(matchId)) {
			expandedPreds.delete(matchId);
			expandedPreds = new Set(expandedPreds);
			return;
		}
		expandedPreds.add(matchId);
		expandedPreds = new Set(expandedPreds);
		await loadPreds(matchId);
	}

	async function loadPreds(matchId: string) {
		const { data } = await supabase
			.from('predictions')
			.select('user_id, predicted_winner, predicted_home, predicted_away, has_exact_score, entered_by')
			.eq('match_id', matchId);
		matchPredictions = { ...matchPredictions, [matchId]: data ?? [] };

		// Inicializar formularios para jugadores sin pronóstico
		const nonAdminPlayers = players.filter(p => !p.is_admin && p.is_active);
		if (!predForms[matchId]) predForms[matchId] = {};
		for (const p of nonAdminPlayers) {
			if (!predForms[matchId][p.id]) {
				predForms[matchId][p.id] = { winner: '', scoreHome: '', scoreAway: '', saving: false };
			}
		}
		predForms = { ...predForms };
	}

	function predForPlayer(matchId: string, userId: string) {
		return matchPredictions[matchId]?.find(p => p.user_id === userId) ?? null;
	}

	function winnerLabel(pred: { predicted_winner: string }, match: Match): string {
		if (pred.predicted_winner === 'home') return match.team_home;
		if (pred.predicted_winner === 'away') return match.team_away;
		return 'Empate';
	}

	function winnerValue(teamCode: string, match: Match): string {
		if (teamCode === match.team_home) return 'home';
		if (teamCode === match.team_away) return 'away';
		return 'draw';
	}

	async function savePred(match: Match, playerId: string) {
		const form = predForms[match.id]?.[playerId];
		if (!form || !form.winner) return;
		form.saving = true;
		predForms = { ...predForms };

		const predictedWinner = winnerValue(form.winner, match);
		const hasExact = form.scoreHome !== '' && form.scoreAway !== '';

		// Validar coherencia marcador-ganador
		if (hasExact) {
			const h = parseInt(String(form.scoreHome));
			const a = parseInt(String(form.scoreAway));
			if (predictedWinner === 'home' && h <= a) {
				alert(`El marcador no coincide con el ganador marcado (${match.team_home}). Revisá los goles.`);
				form.saving = false; predForms = { ...predForms }; return;
			}
			if (predictedWinner === 'away' && a <= h) {
				alert(`El marcador no coincide con el ganador marcado (${match.team_away}). Revisá los goles.`);
				form.saving = false; predForms = { ...predForms }; return;
			}
			if (predictedWinner === 'draw' && h !== a) {
				alert('El marcador no coincide con Empate. Los goles tienen que ser iguales.');
				form.saving = false; predForms = { ...predForms }; return;
			}
		}

		const payload: Record<string, unknown> = {
			user_id: playerId,
			match_id: match.id,
			predicted_winner: predictedWinner,
			has_exact_score: hasExact,
			is_rehearsal: isRehearsalMode,
			entered_by: 'admin'
		};
		if (hasExact) {
			payload.predicted_home = parseInt(form.scoreHome);
			payload.predicted_away = parseInt(form.scoreAway);
		}

		const { error } = await supabase
			.from('predictions')
			.upsert(payload, { onConflict: 'user_id,match_id' });
		if (error) { alert('Error: ' + error.message); form.saving = false; predForms = { ...predForms }; return; }
		form.saving = false;
		// Cerrar modo edición si estaba activo
		if (editingPreds[match.id]?.has(playerId)) {
			editingPreds[match.id].delete(playerId);
			editingPreds = { ...editingPreds };
		}
		await loadPreds(match.id);
		await loadPredCounts();
	}

	function startEditPred(matchId: string, playerId: string, pred: { predicted_winner: string; predicted_home: number | null; predicted_away: number | null; has_exact_score: boolean }, match: Match) {
		if (!confirm('¿Querés editar este pronóstico?')) return;
		// Pre-cargar el form con los valores actuales
		const winnerLabel = pred.predicted_winner === 'home' ? match.team_home
			: pred.predicted_winner === 'away' ? match.team_away : 'draw';
		predForms = {
			...predForms,
			[matchId]: {
				...predForms[matchId],
				[playerId]: {
					winner: winnerLabel,
					scoreHome: pred.predicted_home !== null ? String(pred.predicted_home) : '',
					scoreAway: pred.predicted_away !== null ? String(pred.predicted_away) : '',
					saving: false
				}
			}
		};
		if (!editingPreds[matchId]) editingPreds[matchId] = new Set();
		editingPreds[matchId].add(playerId);
		editingPreds = { ...editingPreds };
	}

	function isPredClosed(match: Match): boolean {
		if (getPredStatus(match) === 'closed') return true;
		const kickoff = new Date(match.kickoff_time).getTime();
		return Date.now() >= kickoff - 3600 * 1000 || match.status === 'finished';
	}

	function setPredWinner(matchId: string, playerId: string, winner: string) {
		if (!predForms[matchId]?.[playerId]) return;
		predForms = {
			...predForms,
			[matchId]: {
				...predForms[matchId],
				[playerId]: { ...predForms[matchId][playerId], winner }
			}
		};
	}

	// ─── JUGADORES ────────────────────────────────────────────────
	async function resetCode(player: Player) {
		const code = generateCode(8);
		await supabase.from('users').update({ access_code: code }).eq('id', player.id);
		player.access_code = code;
		players = [...players];
	}

	async function toggleActive(player: Player) {
		const newVal = !player.is_active;
		await supabase.from('users').update({ is_active: newVal }).eq('id', player.id);
		player.is_active = newVal;
		players = [...players];
	}

	async function addPlayer() {
		if (!newPlayer.full_name || !newPlayer.username || !newPlayer.access_code) return;
		const { error } = await supabase.from('users').insert({
			full_name: newPlayer.full_name,
			username: newPlayer.username.toLowerCase().trim(),
			access_code: newPlayer.access_code.toUpperCase().trim()
		});
		if (error) { alert('Error: ' + error.message); return; }
		showAddPlayer = false;
		newPlayer = { full_name: '', username: '', access_code: '' };
		await loadPlayers();
	}

	// ─── TRIVIA ──────────────────────────────────────────────────
	async function addQuestion() {
		const { error } = await supabase.from('trivia_questions').insert({
			question_text: newQuestion.question_text,
			option_a: newQuestion.option_a,
			option_b: newQuestion.option_b,
			option_c: newQuestion.option_c,
			option_d: newQuestion.option_d,
			correct_answer: newQuestion.correct_answer,
			difficulty: parseInt(newQuestion.difficulty),
			category: newQuestion.category || null,
			explanation: newQuestion.explanation || null
		});
		if (error) { alert('Error: ' + error.message); return; }
		showAddQuestion = false;
		newQuestion = { question_text: '', option_a: '', option_b: '', option_c: '', option_d: '', correct_answer: 'a', difficulty: '1', category: '', explanation: '' };
		await loadTrivia();
	}

	async function enableTrivia(userId: string) {
		// Bloquear el botón inmediatamente con una sesión optimista
		const weekPhase = `week_${currentWeek}`;
		const optimisticSession: TriviaSession = {
			id: `optimistic-${userId}`,
			user_id: userId,
			phase: weekPhase,
			level_chosen: 2,
			status: 'ready',
			score: 0,
			points_earned: 0,
			enabled_by_admin: true,
			enabled_at: new Date().toISOString(),
			started_at: null,
			completed_at: null,
			question_ids: [],
			answers: []
		};
		// Agregar o reemplazar en el array local para que el botón se bloquee YA
		triviaSessions = [
			...triviaSessions.filter(s => !(s.user_id === userId && (s.status === 'ready' || s.status === 'in_progress' || s.id.startsWith('optimistic')))),
			optimisticSession
		];

		try {
			const { data: qs, error: qErr } = await supabase
				.from('trivia_questions')
				.select('id')
				.eq('is_active', true)
				.order('created_at');

			if (qErr) { alert('Error al cargar preguntas: ' + qErr.message); triviaSessions = triviaSessions.filter(s => s.id !== optimisticSession.id); return; }

			const allIds = (qs ?? []).map((q: { id: string }) => q.id);
			if (allIds.length === 0) { alert('No hay preguntas activas en el banco.'); triviaSessions = triviaSessions.filter(s => s.id !== optimisticSession.id); return; }

			// Excluir preguntas que este jugador ya vio en sesiones anteriores (evitar repetición)
			const seenIds = new Set(
				triviaSessions
					.filter(s => s.user_id === userId)
					.flatMap(s => s.question_ids ?? [])
			);
			const freshIds = allIds.filter((id: string) => !seenIds.has(id));
			const pool = freshIds.length >= 5 ? freshIds : allIds;
			const questionIds = pool.sort(() => Math.random() - 0.5).slice(0, 5);

			const { error } = await supabase.from('trivia_sessions').insert({
				user_id: userId,
				phase: weekPhase,
				level_chosen: 2,
				question_ids: questionIds,
				answers: [],
				status: 'ready',
				enabled_by_admin: true,
				enabled_at: new Date().toISOString(),
				is_rehearsal: isRehearsalMode
			});
			if (error) { alert('Error al crear sesión: ' + error.message); triviaSessions = triviaSessions.filter(s => s.id !== optimisticSession.id); }
		} catch (e) {
			// Si algo falla, quitar la sesión optimista para desbloquear el botón
			triviaSessions = triviaSessions.filter(s => s.id !== optimisticSession.id);
		}
	}

	async function blockQuestion(q: TriviaQuestion) {
		if (!blockReason.trim()) { alert('Escribí el motivo del bloqueo'); return; }

		// 1. Marcar pregunta como inactiva
		await supabase.from('trivia_questions').update({
			is_active: false,
			block_reason: blockReason
		}).eq('id', q.id);

		// 2. Recuperar puntos de jugadores que la respondieron mal
		const { data: cfg } = await supabase.from('config').select('value').eq('key', 'trivia_penalty_points').single();
		const penalty = parseInt(cfg?.value ?? '2');

		const { data: allSessions } = await supabase
			.from('trivia_sessions')
			.select('id, user_id, answers, points_earned, status')
			.eq('status', 'completed');

		type SessionRow = { id: string; user_id: string; answers: TriviaSession['answers']; points_earned: number; status: string };
		const affected = ((allSessions ?? []) as SessionRow[]).filter((s) =>
			Array.isArray(s.answers) && s.answers.some((a) => a.question_id === q.id && !a.correct)
		);

		for (const session of affected) {
			// Sumar el punto de penalidad que perdió por esta pregunta
			const newPoints = (session.points_earned ?? 0) + penalty;
			await supabase.from('trivia_sessions').update({ points_earned: newPoints }).eq('id', session.id);

			// Acreditar al usuario si no es modo ensayo
			if (!isRehearsalMode) {
				const { data: usr } = await supabase.from('users').select('points_total').eq('id', session.user_id).single();
				if (usr) {
					await supabase.from('users').update({ points_total: (usr.points_total ?? 0) + penalty }).eq('id', session.user_id);
				}
			}
		}

		if (affected.length > 0) {
			const msg = isRehearsalMode
				? `Pregunta bloqueada. ${affected.length} jugador/es afectado/s (puntos NO acreditados — modo ensayo).`
				: `Pregunta bloqueada. +${penalty} pts recuperados para ${affected.length} jugador/es.`;
			alert(msg);
		}

		blockingQuestion = null;
		blockReason = '';
		await loadTrivia();
	}

	// ─── POZO ────────────────────────────────────────────────────
	async function seedPozo() {
		const amount = parseInt(pozoSeedAmount);
		if (isNaN(amount) || amount <= 0) return;
		await supabase.from('pozo_log').insert({ amount, source_type: 'admin_seed' });
		pozoSeedAmount = '';
		await loadConfig();
	}

	async function openPozo() {
		await updateConfig('pozo_status', 'open');
		pozoStatus = 'open';
	}

	// ─── TICKER para countdowns de trivia ────────────────────────
	let now = Date.now();
	let tickInterval: ReturnType<typeof setInterval> | null = null;

	onMount(() => {
		tickInterval = setInterval(() => { now = Date.now(); }, 1000);
	});
	onDestroy(() => { if (tickInterval) clearInterval(tickInterval); });

	// ── Conteo de trivias por jugador ───────────────────────────
	function triviaCountForUser(userId: string): { done: number; total: number } {
		const userSessions = triviaSessions.filter(s => s.user_id === userId && !s.id.startsWith('optimistic'));
		const done = userSessions.filter(s => s.status === 'completed').length;
		const total = userSessions.length;
		return { done, total };
	}

	// ── Estado del botón "Activar trivia" ────────────────────────
	function triviaBtnState(userId: string, _now: number): {
		disabled: boolean;
		label: string;
		variant: 'default' | 'activated' | 'activated-live' | 'done';
	} {
		const active = triviaSessions.find(
			(s) => s.user_id === userId && (s.status === 'ready' || s.status === 'in_progress')
		);

		if (active?.status === 'ready') {
			return { disabled: true, label: 'Trivia activada', variant: 'activated' };
		}
		if (active?.status === 'in_progress') {
			return { disabled: true, label: 'En progreso…', variant: 'activated-live' };
		}

		// Sin sesión activa: ver si hay alguna completada
		const hasDone = triviaSessions.some(s => s.user_id === userId && s.status === 'completed');
		if (hasDone) {
			return { disabled: false, label: 'Enviar otra trivia', variant: 'done' };
		}
		return { disabled: false, label: 'Activar trivia', variant: 'default' };
	}

	// suprimir el linter — weekPhase se calcula dentro de la función
	$: _weekPhase = `week_${currentWeek}`;

	// ─── HELPERS ──────────────────────────────────────────────────
	function triviaStatusForUser(userId: string): string {
		const sessions = triviaSessions.filter(s => s.user_id === userId && !s.id.startsWith('optimistic'));
		const active = sessions.find(s => s.status === 'ready' || s.status === 'in_progress');
		if (active?.status === 'ready') return 'Esperando';
		if (active?.status === 'in_progress') return 'En progreso';
		const completed = sessions.filter(s => s.status === 'completed');
		if (completed.length === 0) return '—';
		const totalCorrect = completed.reduce((acc, s) => acc + (s.score ?? 0), 0);
		const totalQ = completed.reduce((acc, s) => acc + (s.question_ids?.length ?? 5), 0);
		return `✓ ${totalCorrect}/${totalQ}`;
	}

	function sessionsForUser(userId: string): TriviaSession[] {
		return triviaSessions
			.filter(s => s.user_id === userId && !s.id.startsWith('optimistic'))
			.sort((a, b) => (b.enabled_at ?? '').localeCompare(a.enabled_at ?? ''));
	}

	function triviaPhaseLabel(phase: string): string {
		const m = phase.match(/^week_(\d+)$/);
		if (m) return `Semana ${m[1]}`;
		return phase;
	}

	$: varRequestedIds = new Set(triviaSessions.flatMap(s => s.var_requests ?? []));
	$: sortedQuestions = [...triviaQuestions].sort((a, b) => {
		const aVar = varRequestedIds.has(a.id) ? 0 : 1;
		const bVar = varRequestedIds.has(b.id) ? 0 : 1;
		return aVar - bVar;
	});

	function matchesByWeek(week: number) {
		return matches.filter((m) => m.week_number === week);
	}

	const weeks = [...new Set(matches.map((m) => m.week_number))].sort((a, b) => a - b);
	$: weeks2 = [...new Set(matches.map((m) => m.week_number))].sort((a, b) => a - b);

	function statusLabel(s: string): string {
		const map: Record<string, string> = { upcoming: 'Próximo', live: '🔴 EN VIVO', finished: '✅ Terminado' };
		return map[s] ?? s;
	}

	function phaseLabel(p: string): string {
		const map: Record<string, string> = {
			groups: 'Grupo', r32: 'R32', r16: 'Octavos',
			qf: 'Cuartos', sf: 'Semis', '3rd': 'Tercer puesto', final: 'Final'
		};
		return map[p] ?? p;
	}
</script>

<svelte:head>
	<title>Admin — Prode Cíclico</title>
	<meta name="robots" content="noindex" />
</svelte:head>

{#if loading}
	<div class="admin-loading">
		<div class="prode-spinner"></div>
		<p>Cargando panel...</p>
	</div>

{:else if !isAdmin}
	<div class="admin-denied section">
		<div class="section-hero-label">Error de acceso</div>
		<h1 class="section-title">Acceso denegado</h1>
		<p class="section-subtitle">{loginError}</p>
		<a href="/mundial" class="prode-btn-primary" style="display:inline-block;text-decoration:none;margin-top:16px;">← Volver al inicio</a>
	</div>

{:else}
	<div class="admin-wrap">

		<!-- ── HEADER ── -->
		<div class="admin-header">
			<div>
				<div class="admin-eyebrow">PRODE CÍCLICO · PANEL ADMIN</div>
				<h1 class="admin-title">Control del Prode</h1>
			</div>
			<div class="admin-header-right">
				<div class="admin-mode-badge" class:ensayo={isRehearsalMode} class:real={!isRehearsalMode}>
					{isRehearsalMode ? '⚠️ MODO ENSAYO' : '🟢 MODO REAL'}
				</div>
				<button class="admin-logout-btn" on:click={() => logout()}>
					Cerrar sesión
				</button>
			</div>
		</div>

		<!-- ── MODO DEL SISTEMA ── -->
		<section class="admin-mode-section card">
			<div class="admin-mode-info">
				<h2 class="admin-section-title">Modo del sistema</h2>
				<p class="admin-section-desc">
					{isRehearsalMode
						? 'En modo ensayo, los puntos no cuentan. Los jugadores pueden probar todo.'
						: 'Modo real activo. Todo cuenta, nada se puede deshacer.'}
				</p>
			</div>
			<div class="admin-mode-toggle">
				<button
					class="admin-mode-btn"
					class:active={isRehearsalMode}
					disabled={savingConfig}
					on:click={() => setMode(false)}
				>
					ENSAYO
				</button>
				<button
					class="admin-mode-btn admin-mode-real"
					class:active={!isRehearsalMode}
					disabled={savingConfig}
					on:click={() => setMode(true)}
				>
					REAL
				</button>
				<button
					class="admin-live-btn"
					class:firing={triggeringAnimation}
					disabled={triggeringAnimation}
					on:click={triggerLiveAnimation}
				>
					{triggeringAnimation ? '⏳' : '🎬 Reajustar'}
				</button>
			</div>
		</section>

		<!-- Confirm dialog modo real -->
		{#if modeConfirmDialog}
			<div class="admin-overlay">
				<div class="admin-dialog card">
					<h3>⚠️ ¿Estás seguro?</h3>
					<p>Esto <strong>borrará todos los datos de ensayo</strong> (pronósticos, trivias, puntos) y activará el modo real. Esta acción no se puede deshacer.</p>
					<div class="admin-dialog-actions">
						<button class="prode-btn-secondary" on:click={() => modeConfirmDialog = false}>Cancelar</button>
						<button class="admin-btn-danger" on:click={confirmSetReal}>Sí, pasar a REAL</button>
					</div>
				</div>
			</div>
		{/if}

		<!-- Confirm cierre de pronósticos -->
		{#if closePredsMatch}
			<div class="admin-overlay">
				<div class="admin-dialog card">
					<h3>⚠️ Cerrar pronósticos</h3>
					<p>Esta acción cerrará los pronósticos de <strong>{closePredsMatch.team_home} vs {closePredsMatch.team_away}</strong>. Nadie podrá editarlos ni agregar nuevos. Esta acción no se puede revertir.</p>
					<p>¿Estás seguro?</p>
					<div class="admin-dialog-actions">
						<button class="prode-btn-secondary" on:click={() => closePredsMatch = null}>No</button>
						<button class="admin-btn-danger" on:click={async () => { await setPredictionsStatus(closePredsMatch!, 'closed'); closePredsMatch = null; }}>Sí, cerrar</button>
					</div>
				</div>
			</div>
		{/if}

		<!-- ── TABS ── -->
		<div class="admin-tabs">
			{#each [
				{ id: 'matches', label: '⚽ Partidos' },
				{ id: 'players', label: '👥 Jugadores' },
				{ id: 'trivia', label: '🎯 Trivia' },
				{ id: 'pozo', label: '💰 Pozo' }
			] as tab}
				<button
					class="admin-tab"
					class:active={activeTab === tab.id}
					on:click={() => activeTab = tab.id as typeof activeTab}
				>
					{tab.label}
				</button>
			{/each}
		</div>

		<!-- ══ PARTIDOS ══ -->
		{#if activeTab === 'matches'}
			<section class="admin-section">

				<!-- Selector de semana -->
				<div class="amc-week-nav">
					{#each weeks2 as w}
						<button class="amc-week-tab" class:active={selectedWeek === w && !showFinished}
							on:click={() => { selectedWeek = w; showFinished = false; }}>
							Sem. {w}
						</button>
					{/each}
					<button class="amc-week-tab amc-week-tab-done" class:active={showFinished}
						on:click={() => showFinished = true}>
						✅ Terminados
					</button>
					<button class="prode-btn-secondary" style="margin-left:auto" on:click={() => showAddMatch = !showAddMatch}>
						{showAddMatch ? 'Cancelar' : '+ Partido'}
					</button>
				</div>

				{#if showAddMatch}
					<div class="admin-add-form card">
						<h3 class="admin-form-title">Nuevo partido</h3>
						<div class="admin-form-grid">
							<div class="prode-field"><label>Fase</label>
								<select bind:value={newMatch.phase}>
									{#each ['groups','r32','r16','qf','sf','3rd','final'] as p}<option value={p}>{p}</option>{/each}
								</select>
							</div>
							<div class="prode-field"><label>Grupo</label>
								<input type="text" bind:value={newMatch.group_name} placeholder="A" maxlength="2" />
							</div>
							<div class="prode-field"><label>Semana</label>
								<input type="number" bind:value={newMatch.week_number} min="1" />
							</div>
							<div class="prode-field"><label>Equipo 1</label>
								<input type="text" bind:value={newMatch.team_home} placeholder="Argentina" />
							</div>
							<div class="prode-field"><label>Equipo 2</label>
								<input type="text" bind:value={newMatch.team_away} placeholder="Argelia" />
							</div>
							<div class="prode-field"><label>Fecha y hora</label>
								<input type="datetime-local" bind:value={newMatch.kickoff_time} />
							</div>
							<div class="prode-field"><label>Estadio</label>
								<input type="text" bind:value={newMatch.venue} placeholder="Estadio Dallas" />
							</div>
						</div>
						<button class="prode-btn-primary" on:click={addMatch}>Guardar partido</button>
					</div>
				{/if}

				<!-- ── TERMINADOS ── -->
				{#if showFinished}
					<div class="amc-finished-list">
						{#each matches.filter(m => m.status === 'finished') as match}
							<div class="amc-finished-row">
								<span class="amc-fin-phase">{phaseLabel(match.phase)}{match.group_name ? ` · G${match.group_name}` : ''}</span>
								<span class="amc-fin-teams">
									{flag(match.team_home)} {match.team_home}
									<strong class="amc-fin-score">{match.result_home} - {match.result_away}</strong>
									{match.team_away} {flag(match.team_away)}
								</span>
								<span class="amc-fin-winner">
									Ganó: <strong>{match.winner === 'home' ? match.team_home : match.winner === 'away' ? match.team_away : 'Empate'}</strong>
									{match.went_to_penalties ? '(pen.)' : ''}
								</span>
								<span class="amc-fin-date">{formatDateAR(match.kickoff_time)}</span>
							</div>
						{/each}
						{#if matches.filter(m => m.status === 'finished').length === 0}
							<div class="admin-empty">Todavía no hay partidos terminados.</div>
						{/if}
					</div>

				<!-- ── SEMANA ACTIVA ── -->
				{:else}
					{#each matches.filter(m => m.week_number === selectedWeek) as match}
						{@const form = resultForms[match.id]}
						<div class="amc">

							<!-- Info: fase + estadio -->
							<div class="amc-info">
								<span class="amc-phase-badge">{phaseLabel(match.phase)}{match.group_name ? ` · Grupo ${match.group_name}` : ''}</span>
								{#if match.venue}<span class="amc-venue-text">{match.venue}</span>{/if}
							</div>

							<!-- Fecha/hora editable -->
							<div class="amc-datetime">
								{#if editingKickoff.has(match.id)}
									<input type="date" class="amc-dt-input" bind:value={kickoffForms[match.id].date} />
									<input type="time" class="amc-dt-input" bind:value={kickoffForms[match.id].time} />
									<button class="amc-dt-save" on:click={() => saveKickoff(match)}>✔</button>
									<button class="amc-dt-cancel" on:click={() => { editingKickoff.delete(match.id); editingKickoff = new Set(editingKickoff); }}>✕</button>
								{:else}
									<span class="amc-dt-text">{formatDateAR(match.kickoff_time)} · hora Argentina</span>
									<button class="amc-dt-edit" on:click={() => startEditKickoff(match)}>✏</button>
								{/if}
							</div>

							<!-- Equipos + marcador -->
							<div class="amc-teams">
								<div class="amc-team">
									<span class="amc-flag">{flag(match.team_home)}</span>
									<span class="amc-tname">{match.team_home}</span>
								</div>
								<div class="amc-score-zone">
									{#if match.status === 'finished'}
										<span class="amc-score-final">{match.result_home} — {match.result_away}</span>
									{:else if form}
										<input class="amc-score-inp" type="number" min="0" bind:value={form.home} placeholder="—" />
										<span class="amc-score-sep">—</span>
										<input class="amc-score-inp" type="number" min="0" bind:value={form.away} placeholder="—" />
									{/if}
								</div>
								<div class="amc-team amc-team-r">
									<span class="amc-tname">{match.team_away}</span>
									<span class="amc-flag">{flag(match.team_away)}</span>
								</div>
							</div>

							<!-- Controles -->
							{#if match.status !== 'finished' && form}
								<div class="amc-controls">
									<div class="amc-tri-switch">
										<button class="amc-tri-btn" class:active={getPredStatus(match) === 'waiting'}
											on:click={() => setPredictionsStatus(match, 'waiting')}>
											🟡 En espera
										</button>
										<button class="amc-tri-btn" class:active={getPredStatus(match) === 'open'}
											on:click={() => setPredictionsStatus(match, 'open')}>
											🟢 Abierto
										</button>
										<button class="amc-tri-btn" class:active={getPredStatus(match) === 'closed'}
											on:click={() => { if (getPredStatus(match) !== 'closed') closePredsMatch = match; }}>
											🔴 Cerrado
										</button>
									</div>
				{#if match.phase !== 'groups'}
										<select class="amc-winner-sel" bind:value={form.winner}>
											<option value="">Ganador...</option>
											<option value="home">{match.team_home}</option>
											<option value="away">{match.team_away}</option>
										</select>
									{/if}
									<label class="amc-switch">
										<input type="checkbox" bind:checked={form.extraTime} on:change={() => { if (!form.extraTime) form.penalties = false; resultForms = {...resultForms}; }} />
										<span class="amc-switch-lbl">Prórroga</span>
									</label>
									{#if form.extraTime}
										<div class="amc-et-row">
											<span class="amc-et-lbl">Prórr.</span>
											<input class="amc-et-input" type="number" min="0" max="20" placeholder="—" bind:value={form.etHome} />
											<span>-</span>
											<input class="amc-et-input" type="number" min="0" max="20" placeholder="—" bind:value={form.etAway} />
										</div>
										<label class="amc-switch">
											<input type="checkbox" bind:checked={form.penalties} on:change={() => { resultForms = {...resultForms}; }} />
											<span class="amc-switch-lbl">Penales</span>
										</label>
										{#if form.penalties}
											<div class="amc-et-row">
												<span class="amc-et-lbl">Pen.</span>
												<input class="amc-et-input" type="number" min="0" max="30" placeholder="—" bind:value={form.penHome} />
												<span>-</span>
												<input class="amc-et-input" type="number" min="0" max="30" placeholder="—" bind:value={form.penAway} />
											</div>
										{/if}
									{/if}
									<button class="amc-confirm-btn" class:confirmed={match.confirmed_by_admin} disabled={form.saving || match.confirmed_by_admin} on:click={() => {
										if (match.phase === 'groups') {
											const h = parseInt(form.home), a = parseInt(form.away);
											if (!isNaN(h) && !isNaN(a)) form.winner = h > a ? 'home' : a > h ? 'away' : 'draw';
										}
										confirmResult(match);
									}}>
										{form.saving ? '...' : match.confirmed_by_admin ? '✔ Confirmado' : '✔ Confirmar resultado'}
									</button>
								</div>
							{:else if match.status === 'finished'}
								<div class="amc-result-done">
									Ganó <strong>{match.winner === 'home' ? match.team_home : match.winner === 'away' ? match.team_away : 'Empate'}</strong>
									{#if match.went_to_extra_time}· prórroga {match.extra_time_home}-{match.extra_time_away}{/if}
									{#if match.went_to_penalties}· penales {match.penalties_home}-{match.penalties_away}{/if}
								</div>
							{/if}

							<!-- Barra de pronósticos -->
							<button class="amc-pred-bar" on:click={() => togglePreds(match.id)}>
								<span>Realizados: <strong>{predCounts[match.id] ?? 0}</strong></span>
								<span>Faltan: <strong>{activePlayers.length - (predCounts[match.id] ?? 0)}</strong></span>
								<span class="amc-expand">{expandedPreds.has(match.id) ? '▲' : '▼'}</span>
							</button>

							<!-- Jugadores expandidos -->
							{#if expandedPreds.has(match.id)}
								<div class="amc-preds-panel">
									<div class="amc-preds-grid">
										{#each activePlayers as player}
											{@const pred = matchPredictions[match.id]?.find(p => p.user_id === player.id) ?? null}
											{@const pform = predForms[match.id]?.[player.id]}
											{@const closed = isPredClosed(match)}
											{@const isEditing = editingPreds[match.id]?.has(player.id) ?? false}
											{@const isMissed = closed && !pred && getPredStatus(match) === 'closed'}
											<div class="amc-prow" class:has-pred={!!pred && !isEditing} class:is-missed={isMissed}>
												<span class="amc-prow-name">{player.full_name}</span>
												{#if isMissed}
													<span class="amc-missed-lbl">sin pronóstico</span>
												{:else if pred && !isEditing}
													<div class="amc-prow-result">
														<span class="amc-pred-summary">
															<span class="amc-pred-winner">{winnerLabel(pred, match)}</span>
															{#if pred.has_exact_score}
																<span class="amc-pred-score">{pred.predicted_home} — {pred.predicted_away}</span>
															{:else}
																<span class="amc-pred-noscore">sin marcador</span>
															{/if}
														</span>
														{#if pred.entered_by === 'admin'}
															<button class="amc-admin-tag" title="Editar pronóstico"
																on:click={() => startEditPred(match.id, player.id, pred, match)}>
																ADMIN
															</button>
														{:else}
															<span class="amc-jugador-tag">jugador</span>
														{/if}
													</div>
												{:else if pform && getPredStatus(match) !== 'waiting'}
													<div class="amc-prow-entry">
														<div class="amc-seg">
															<button class="amc-seg-btn" class:sel={pform.winner === match.team_home}
																on:click={() => setPredWinner(match.id, player.id, match.team_home)}>
																{match.team_home}
															</button>
															{#if match.phase === 'groups'}
																<button class="amc-seg-btn amc-seg-mid" class:sel={pform.winner === 'draw'}
																	on:click={() => setPredWinner(match.id, player.id, 'draw')}>
																	Empate
																</button>
															{/if}
															<button class="amc-seg-btn" class:sel={pform.winner === match.team_away}
																on:click={() => setPredWinner(match.id, player.id, match.team_away)}>
																{match.team_away}
															</button>
														</div>
														{#if pform.winner}
															<input class="amc-mini-score" type="number" min="0" bind:value={pform.scoreHome} placeholder="—" />
															<span class="amc-mini-sep">-</span>
															<input class="amc-mini-score" type="number" min="0" bind:value={pform.scoreAway} placeholder="—" />
														{/if}
														<button class="amc-save-pred" disabled={!pform.winner || pform.saving}
															on:click={() => savePred(match, player.id)}>
															{pform.saving ? '…' : '✔'}
														</button>
														{#if isEditing}
															<button class="amc-cancel-edit"
																on:click={() => { editingPreds[match.id].delete(player.id); editingPreds = {...editingPreds}; }}>
																✕
															</button>
														{/if}
													</div>
												{:else}
													<span class="amc-no-pred" class:is-closed={closed}>{closed ? '🔴 cerrado' : getPredStatus(match) === 'waiting' ? '🟡 en espera' : '—'}</span>
												{/if}
											</div>
										{/each}
									</div>
								</div>
							{/if}

						</div>
					{/each}

					{#if matchesByWeek(selectedWeek).length === 0}
						<div class="admin-empty">No hay partidos en esta semana.</div>
					{/if}
				{/if}

			</section>
		{/if}

		<!-- ══ JUGADORES ══ -->
		{#if activeTab === 'players'}
			<section class="admin-section">
				<div class="admin-section-head">
					<h2 class="admin-section-title">Jugadores ({players.length})</h2>
					<button class="prode-btn-secondary" on:click={() => showAddPlayer = !showAddPlayer}>
						{showAddPlayer ? 'Cancelar' : '+ Agregar jugador'}
					</button>
				</div>

				{#if showAddPlayer}
					<div class="admin-add-form card">
						<h3 class="admin-form-title">Nuevo jugador</h3>
						<div class="admin-form-grid">
							<div class="prode-field">
								<label>Nombre completo</label>
								<input type="text" bind:value={newPlayer.full_name} placeholder="Juan Pérez" />
							</div>
							<div class="prode-field">
								<label>Username</label>
								<input type="text" bind:value={newPlayer.username} placeholder="jperez" />
							</div>
							<div class="prode-field">
								<label>Código de acceso</label>
								<input type="text" bind:value={newPlayer.access_code} placeholder="ABCD1234" />
								<button class="admin-btn-mini" on:click={() => newPlayer.access_code = generateCode()}>Generar</button>
							</div>
						</div>
						<button class="prode-btn-primary" on:click={addPlayer}>Guardar jugador</button>
					</div>
				{/if}

				<div class="admin-players-table">
					<div class="admin-players-header">
						<span>#</span>
						<span>Jugador</span>
						<span>Username</span>
						<span>Código</span>
						<span>Puntos</span>
						<span>Estado</span>
						<span>Acciones</span>
					</div>
					{#each players as player}
						<div class="admin-player-row" class:inactive={!player.is_active}>
							<span class="admin-player-rank">{player.ranking_position ?? '—'}</span>
							<span class="admin-player-name">{player.full_name}</span>
							<span class="admin-player-user mono">{player.username}</span>
							<span class="admin-player-code mono">{player.access_code}</span>
							<span class="admin-player-pts">{player.points_total ?? 0}</span>
							<span class="admin-player-status" class:active={player.is_active}>
								{player.is_active ? '✅ Activo' : '⛔ Inactivo'}
							</span>
							<div class="admin-player-actions">
								<button class="admin-btn-mini" on:click={() => resetCode(player)}>Reset código</button>
								<button class="admin-btn-mini" on:click={() => toggleActive(player)}>
									{player.is_active ? 'Desactivar' : 'Activar'}
								</button>
							</div>
						</div>
					{/each}
				</div>
			</section>
		{/if}

		<!-- ══ TRIVIA ══ -->
		{#if activeTab === 'trivia'}
			<section class="admin-section">
				<div class="admin-section-head">
					<h2 class="admin-section-title">Trivia</h2>
				</div>

				<!-- Sub-tabs -->
				<div class="admin-trivia-subtabs">
					<button class="admin-trivia-subtab" class:active={triviaSubTab === 'players'} on:click={() => triviaSubTab = 'players'}>Jugadores</button>
					<button class="admin-trivia-subtab" class:active={triviaSubTab === 'questions'} on:click={() => triviaSubTab = 'questions'}>
						Preguntas ({triviaQuestions.length})
						{#if varRequestedIds.size > 0}<span class="admin-trivia-var-dot">{varRequestedIds.size}</span>{/if}
					</button>
				</div>

				<!-- Estado por jugador -->
				{#if triviaSubTab === 'players'}
				<div class="admin-subsection">
					<h3 class="admin-subsection-title">Estado por jugador</h3>
					<div class="admin-players-table">
						<div class="admin-players-header admin-trivia-header">
							<span>Jugador</span>
							<span>Trivias</span>
							<span>Estado</span>
							<span>Acción</span>
						</div>
						{#each players.filter(p => !p.is_admin) as player}
							{@const btn = triviaBtnState(player.id, now)}
							{@const count = triviaCountForUser(player.id)}
							{@const sessions = sessionsForUser(player.id)}
							{@const expanded = expandedTrivaPlayers.has(player.id)}
							<div class="admin-trivia-row"
								class:admin-trivia-row-expandable={sessions.length > 0}
								on:click={() => {
									if (sessions.length === 0) return;
									const next = new Set(expandedTrivaPlayers);
									next.has(player.id) ? next.delete(player.id) : next.add(player.id);
									expandedTrivaPlayers = next;
								}}
							>
								<span class="admin-trivia-name">
									{player.full_name}
									{#if sessions.length > 0}
										<span class="admin-trivia-expand-arrow" class:open={expanded}>›</span>
									{/if}
								</span>
								<span class="admin-trivia-count">
									<span class="admin-trivia-count-done">{count.done}</span>
									<span class="admin-trivia-count-label">hechas</span>
								</span>
								<span class="mono admin-trivia-status">{triviaStatusForUser(player.id)}</span>
								<button
									class="admin-trivia-btn admin-trivia-btn-{btn.variant}"
									disabled={btn.disabled}
									on:click|stopPropagation={() => enableTrivia(player.id)}
								>
									{btn.label}
								</button>
							</div>
							{#if expanded && sessions.length > 0}
								<div class="admin-trivia-sessions">
									{#each sessions as s}
										{@const varRequested = (s.var_requests ?? []).length}
										{@const varAccepted = (s.var_requests ?? []).filter(id => triviaQuestions.find(q => q.id === id && !q.is_active)).length}
										{@const wrongCount = s.status === 'completed' ? (s.question_ids?.length ?? 5) - (s.score ?? 0) : null}
										{@const ptsLost = wrongCount !== null ? wrongCount * triviaPenalty : null}
										<div class="admin-trivia-session-row">
											<span class="admin-trivia-session-phase">{triviaPhaseLabel(s.phase)}</span>
											<span class="admin-trivia-session-status admin-trivia-session-status-{s.status}">
												{#if s.status === 'completed'}
													✓ {s.score}/{s.question_ids?.length ?? 5} · +{s.points_earned} pts
												{:else if s.status === 'in_progress'}En progreso
												{:else if s.status === 'ready'}Esperando
												{:else}{s.status}{/if}
											</span>
											{#if ptsLost !== null && ptsLost > 0}
												<span class="admin-trivia-session-lost">−{ptsLost} pts</span>
											{/if}
											{#if varRequested > 0}
												<span class="admin-trivia-var-badge">VAR {varAccepted}/{varRequested}</span>
											{/if}
											{#if s.enabled_at}
												<span class="admin-trivia-session-date mono">{new Date(s.enabled_at).toLocaleDateString('es-AR', { day:'2-digit', month:'2-digit' })}</span>
											{/if}
										</div>
									{/each}
								</div>
							{/if}
						{/each}
					</div>
				</div>
				{/if}

				<!-- Banco de preguntas -->
				{#if triviaSubTab === 'questions'}
				<div class="admin-subsection">
					<div class="admin-section-head">
						<h3 class="admin-subsection-title">Banco de preguntas ({triviaQuestions.length})</h3>
						<button class="prode-btn-secondary" on:click={() => showAddQuestion = !showAddQuestion}>
							{showAddQuestion ? 'Cancelar' : '+ Nueva pregunta'}
						</button>
					</div>

					{#if showAddQuestion}
						<div class="admin-add-form card">
							<h3 class="admin-form-title">Nueva pregunta</h3>
							<div class="prode-field">
								<label>Pregunta</label>
								<textarea bind:value={newQuestion.question_text} rows="3" placeholder="¿Cuántos mundiales ganó Argentina?"></textarea>
							</div>
							<div class="admin-form-grid">
								{#each ['a','b','c','d'] as opt}
									<div class="prode-field">
										<label>Opción {opt.toUpperCase()}</label>
										<input type="text" bind:value={newQuestion[`option_${opt}` as keyof typeof newQuestion]} />
									</div>
								{/each}
							</div>
							<div class="admin-form-grid">
								<div class="prode-field">
									<label>Respuesta correcta</label>
									<select bind:value={newQuestion.correct_answer}>
										{#each ['a','b','c','d'] as opt}<option value={opt}>{opt.toUpperCase()}</option>{/each}
									</select>
								</div>
								<div class="prode-field">
									<label>Dificultad</label>
									<select bind:value={newQuestion.difficulty}>
										<option value="1">1 — Fácil (5 pts)</option>
										<option value="2">2 — Intermedio (10 pts)</option>
										<option value="3">3 — Difícil (20 pts)</option>
									</select>
								</div>
								<div class="prode-field">
									<label>Categoría (opcional)</label>
									<input type="text" bind:value={newQuestion.category} placeholder="Historia" />
								</div>
							</div>
							<div class="prode-field">
								<label>Explicación (opcional)</label>
								<textarea bind:value={newQuestion.explanation} rows="2" placeholder="La primera Copa del Mundo se jugó en Uruguay en 1930…"></textarea>
							</div>
							<button class="prode-btn-primary" on:click={addQuestion}>Guardar pregunta</button>
						</div>
					{/if}

					<div class="admin-questions-list">
						{#each sortedQuestions as q, qi}
							{@const isVar = varRequestedIds.has(q.id)}
							<div class="admin-q-row" class:admin-q-row-alt={qi % 2 === 1} class:admin-q-row-blocked={!q.is_active} class:admin-q-row-var={isVar}>
								<span class="admin-q-diff-tag">DIF:{q.difficulty}</span>
								<span class="admin-q-inline-text">{q.question_text}</span>
								<span class="admin-q-inline-opts">
									{#each ['a','b','c','d'] as opt}
										<span class="admin-q-inline-opt" class:admin-q-inline-correct={opt === q.correct_answer}>
											{opt.toUpperCase()}) {q[`option_${opt}` as keyof TriviaQuestion]}
										</span>
									{/each}
								</span>
								<span class="admin-q-inline-actions">
									{#if isVar}<span class="admin-q-var-badge">⚑ VAR</span>{/if}
									{#if !q.is_active}
										<span class="admin-q-blocked">BLOQ.</span>
									{:else}
										<button class="admin-btn-mini admin-btn-danger-mini"
											on:click={() => { blockingQuestion = q; blockReason = ''; }}>
											Bloquear
										</button>
									{/if}
								</span>
							</div>
						{/each}
					</div>

					{#if blockingQuestion}
						<div class="admin-overlay">
							<div class="admin-dialog card">
								<h3>Bloquear pregunta</h3>
								<p>"{blockingQuestion.question_text}"</p>
								<div class="prode-field">
									<label>Motivo del bloqueo</label>
									<input type="text" bind:value={blockReason} placeholder="Ej: respuesta desactualizada" />
								</div>
								<div class="admin-dialog-actions">
									<button class="prode-btn-secondary" on:click={() => blockingQuestion = null}>Cancelar</button>
									<button class="admin-btn-danger" on:click={() => blockQuestion(blockingQuestion!)}>Bloquear</button>
								</div>
							</div>
						</div>
					{/if}
				</div>
				{/if}
			</section>
		{/if}

		<!-- ══ POZO ══ -->
		{#if activeTab === 'pozo'}
			<section class="admin-section">
				<h2 class="admin-section-title">El Pozo</h2>

				<div class="admin-pozo-status card">
					<div class="admin-pozo-total">{pozoTotal.toLocaleString('es-AR')}</div>
					<div class="admin-pozo-label">puntos acumulados</div>
					<div class="admin-pozo-status-badge">Estado: <strong>{pozoStatus}</strong></div>

					<div class="admin-pozo-actions">
						<div class="prode-field" style="flex:1">
							<label>Cargar monto inicial</label>
							<div style="display:flex;gap:8px">
								<input type="number" bind:value={pozoSeedAmount} placeholder="500" min="1" />
								<button class="prode-btn-secondary" on:click={seedPozo}>Cargar</button>
							</div>
						</div>

						{#if pozoStatus === 'closed'}
							<button class="prode-btn-primary" on:click={openPozo} style="align-self:flex-end">
								Abrir El Pozo
							</button>
						{/if}
					</div>
				</div>
			</section>
		{/if}

	</div>
{/if}

<style>
	/* ─── TEMA OSCURO ADMIN ─── */
	:global(body):has(.admin-wrap),
	:global(body):has(.admin-loading),
	:global(body):has(.admin-denied) {
		background: #0d1b2e;
		background-image: none;
		--text: #e8edf5;
		--muted: #8899bb;
		--border: rgba(255,255,255,0.1);
		--bg-card: #060e1a;
		--bg-card2: #0a1525;
		--green: #3dd68c;
		--red: #ff6b6b;
	}
	/* cards oscuras en admin */
	:global(body):has(.admin-wrap) .card {
		background: #060e1a;
		border-color: rgba(255,255,255,0.1);
		box-shadow: none;
	}

	/* inputs y selects heredan fondo oscuro */
	:global(body):has(.admin-wrap) .prode-field input,
	:global(body):has(.admin-wrap) .prode-field select,
	:global(body):has(.admin-wrap) .prode-field textarea,
	:global(body):has(.admin-wrap) .admin-score-input,
	:global(body):has(.admin-wrap) .admin-winner-select {
		background: rgba(255,255,255,0.08);
		color: #e8edf5;
		border-color: rgba(255,255,255,0.15);
	}
	/* nav heredada también */
	:global(body):has(.admin-wrap) .site-nav {
		background: rgba(13,27,46,0.95);
		border-color: rgba(255,255,255,0.08);
	}

	/* ─── LOADING / DENIED ─── */
	.admin-loading {
		display: flex; flex-direction: column; align-items: center;
		justify-content: center; min-height: 60vh; gap: 16px;
		color: var(--muted); font-family: 'DM Mono', monospace; font-size: 13px;
	}
	.prode-spinner {
		width: 36px; height: 36px; border: 3px solid var(--border);
		border-top-color: var(--celeste); border-radius: 50%;
		animation: spin 0.8s linear infinite;
	}
	@keyframes spin { to { transform: rotate(360deg); } }
	.admin-denied { max-width: 640px; margin: 0 auto; padding: 48px 24px; }

	/* ─── WRAP ─── */
	.admin-wrap {
		max-width: 1000px;
		margin: 0 auto;
		padding: 32px 24px 60px;
		display: flex;
		flex-direction: column;
		gap: 24px;
	}

	/* ─── HEADER ─── */
	.admin-header {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: 16px;
		flex-wrap: wrap;
	}
	.admin-eyebrow {
		font-family: 'Inter', monospace;
		font-size: 12px;
		letter-spacing: 0.2em;
		text-transform: uppercase;
		color: var(--celeste);
		margin-bottom: 4px;
	}
	.admin-title {
		font-family: 'Inter', sans-serif;
		font-size: 32px;
		font-weight: 900;
		letter-spacing: -0.03em;
	}
	.admin-mode-badge {
		font-family: 'Inter', monospace;
		font-size: 13px;
		font-weight: 700;
		letter-spacing: 0.1em;
		padding: 6px 16px;
		border-radius: 20px;
		border: 1px solid;
	}
	.admin-mode-badge.ensayo { color: #7a5f00; border-color: rgba(245,194,0,0.5); background: rgba(245,194,0,0.12); }
	.admin-mode-badge.real { color: var(--green); border-color: rgba(26,158,106,0.4); background: rgba(26,158,106,0.08); }
	.admin-header-right { display: flex; flex-direction: column; align-items: flex-end; gap: 6px; }
	.admin-logout-btn {
		font-family: 'Inter', sans-serif;
		font-size: 11px;
		color: var(--muted);
		background: none;
		border: none;
		cursor: pointer;
		padding: 0;
		text-decoration: underline;
		text-underline-offset: 2px;
	}
	.admin-logout-btn:hover { color: var(--red); }

	/* ─── MODO ─── */
	.admin-mode-section,
	.admin-live-section {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 16px;
		flex-wrap: wrap;
	}
	.admin-live-btn {
		font-family: 'Inter', monospace;
		font-size: 12px;
		font-weight: 700;
		letter-spacing: 0.06em;
		padding: 10px 18px;
		border-radius: 10px;
		border: 2px solid var(--red);
		background: var(--red);
		color: #fff;
		cursor: pointer;
		transition: all 0.2s;
		white-space: nowrap;
	}
	.admin-live-btn:hover:not(:disabled) { opacity: 0.85; }
	.admin-live-btn:disabled { opacity: 0.5; cursor: not-allowed; }
	.admin-live-btn.firing { animation: pulse-btn 0.8s ease-in-out infinite; }
	@keyframes pulse-btn { 0%,100%{opacity:1} 50%{opacity:0.5} }
	.admin-mode-info { flex: 1; }
	.admin-section-title {
		font-family: 'Inter', sans-serif;
		font-size: 18px;
		font-weight: 800;
		letter-spacing: -0.02em;
		margin-bottom: 4px;
	}
	.admin-section-desc { font-size: 13px; color: var(--muted); }
	.admin-mode-toggle { display: flex; gap: 8px; }
	.admin-mode-btn {
		font-family: 'Inter', monospace;
		font-size: 12px;
		font-weight: 700;
		letter-spacing: 0.1em;
		padding: 8px 20px;
		border-radius: 20px;
		border: 1px solid var(--border);
		background: none;
		color: var(--muted);
		cursor: pointer;
		transition: all 0.2s;
	}
	.admin-mode-btn.active { border-color: var(--amarillo); color: #7a5f00; background: rgba(245,194,0,0.12); }
	.admin-mode-real.active { border-color: var(--green); color: var(--green); background: rgba(26,158,106,0.08); }

	/* ─── TABS ─── */
	.admin-tabs {
		display: flex;
		gap: 4px;
		border-bottom: 1px solid var(--border);
		padding-bottom: 0;
		overflow-x: auto;
		scrollbar-width: none;
	}
	.admin-tabs::-webkit-scrollbar { display: none; }
	.admin-tab {
		font-family: 'Inter', monospace;
		font-size: 12px;
		font-weight: 600;
		letter-spacing: 0.06em;
		padding: 10px 20px;
		border: none;
		border-bottom: 2px solid transparent;
		background: none;
		color: var(--muted);
		cursor: pointer;
		transition: all 0.2s;
		white-space: nowrap;
	}
	.admin-tab:hover { color: var(--text); }
	.admin-tab.active { color: var(--celeste); border-bottom-color: var(--celeste); }

	/* ─── SECTION ─── */
	.admin-section { display: flex; flex-direction: column; gap: 16px; }
	.admin-section-head {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 12px;
		flex-wrap: wrap;
	}
	.admin-subsection { display: flex; flex-direction: column; gap: 12px; }
	.admin-subsection-title {
		font-family: 'Inter', sans-serif;
		font-size: 15px;
		font-weight: 700;
	}
	.admin-empty { text-align: center; color: var(--muted); padding: 40px; font-size: 14px; }

	/* ─── WEEK GROUP ─── */
	.admin-week-group { display: flex; flex-direction: column; gap: 10px; }
	.admin-week-label {
		font-family: 'Inter', monospace;
		font-size: 13px;
		letter-spacing: 0.12em;
		text-transform: uppercase;
		color: var(--celeste);
		font-weight: 700;
		padding: 8px 0 4px;
		border-bottom: 1px solid var(--border);
	}

	/* ─── MATCH ROW ─── */
	.admin-match-row { padding: 16px 20px; display: flex; flex-direction: column; gap: 12px; }
	.admin-match-row.match-finished { opacity: 0.7; }
	.admin-match-top {
		display: flex;
		align-items: center;
		justify-content: space-between;
		flex-wrap: wrap;
		gap: 8px;
	}
	.admin-match-teams {
		display: flex;
		align-items: center;
		gap: 8px;
		font-weight: 700;
		font-size: 15px;
	}
	.admin-vs { color: var(--muted); font-size: 12px; }
	.admin-match-meta { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
	.admin-status-badge {
		font-family: 'Inter', monospace;
		font-size: 12px;
		font-weight: 700;
		letter-spacing: 0.1em;
		padding: 3px 8px;
		border-radius: 20px;
		border: 1px solid var(--border);
		color: var(--muted);
	}
	.admin-status-badge.live { color: var(--red); border-color: var(--red); background: rgba(217,48,37,0.08); animation: blink-live 1s infinite; }
	.admin-status-badge.finished { color: var(--green); border-color: var(--green); background: rgba(26,158,106,0.08); }
	@keyframes blink-live { 0%,100%{opacity:1} 50%{opacity:0.6} }
	.admin-match-date { font-family: 'DM Mono', monospace; font-size: 13px; color: var(--muted); }
	.admin-match-controls { display: flex; gap: 16px; flex-wrap: wrap; }
	.admin-toggle-label {
		display: flex;
		align-items: center;
		gap: 8px;
		font-size: 13px;
		color: var(--text);
		cursor: pointer;
	}
	.admin-toggle-label input[type="checkbox"] { accent-color: var(--celeste); width: 16px; height: 16px; cursor: pointer; }

	.admin-result-form {
		display: flex;
		align-items: center;
		gap: 8px;
		flex-wrap: wrap;
	}
	.admin-result-label { font-size: 13px; color: var(--muted); font-weight: 600; }
	.admin-score-input {
		width: 56px;
		padding: 6px;
		text-align: center;
		font-family: 'DM Mono', monospace;
		font-size: 18px;
		font-weight: 700;
		border: 1px solid var(--border);
		border-radius: 8px;
		background: rgba(255,255,255,0.8);
		color: var(--text);
		outline: none;
		-moz-appearance: textfield;
	}
	.admin-score-input::-webkit-outer-spin-button,
	.admin-score-input::-webkit-inner-spin-button { -webkit-appearance: none; }
	.admin-score-input:focus { border-color: var(--celeste); }
	.admin-score-sep { font-family: 'DM Mono', monospace; font-size: 18px; color: var(--muted); }
	.admin-winner-select {
		padding: 6px 10px;
		border: 1px solid var(--border);
		border-radius: 8px;
		font-size: 13px;
		background: rgba(255,255,255,0.8);
		outline: none;
	}
	.admin-penalties-label { display: flex; align-items: center; gap: 6px; font-size: 13px; cursor: pointer; }
	.admin-btn-confirm {
		font-family: 'Inter', sans-serif;
		font-size: 13px;
		font-weight: 700;
		background: var(--green);
		color: #fff;
		border: none;
		border-radius: 8px;
		padding: 8px 16px;
		cursor: pointer;
		transition: opacity 0.2s;
	}
	.admin-btn-confirm:disabled { opacity: 0.6; cursor: not-allowed; }
	.admin-match-result-done {
		font-family: 'DM Mono', monospace;
		font-size: 14px;
		color: var(--green);
	}

	/* ─── FORMS ─── */
	.admin-add-form { padding: 20px; display: flex; flex-direction: column; gap: 16px; }
	.admin-form-title { font-size: 15px; font-weight: 700; }
	.admin-form-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
		gap: 12px;
	}
	.prode-field { display: flex; flex-direction: column; gap: 6px; }
	.prode-field label {
		font-family: 'Inter', monospace;
		font-size: 12px;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: var(--muted);
		font-weight: 600;
	}
	.prode-field input, .prode-field select, .prode-field textarea {
		font-family: 'Instrument Sans', sans-serif;
		font-size: 14px;
		padding: 10px 12px;
		border: 1px solid var(--border);
		border-radius: 8px;
		background: rgba(255,255,255,0.8);
		color: var(--text);
		outline: none;
		transition: border-color 0.2s;
	}
	.prode-field input:focus, .prode-field select:focus, .prode-field textarea:focus { border-color: var(--celeste); }
	.prode-field textarea { resize: vertical; }

	/* ─── PLAYERS TABLE ─── */
	.admin-players-table { display: flex; flex-direction: column; border: 1px solid var(--border); border-radius: 12px; overflow: hidden; }
	.admin-players-header {
		display: grid;
		grid-template-columns: 40px 1fr 1fr 1fr 60px 80px auto;
		gap: 8px;
		padding: 10px 16px;
		background: rgba(91,155,213,0.06);
		font-family: 'Inter', monospace;
		font-size: 12px;
		letter-spacing: 0.1em;
		text-transform: uppercase;
		color: var(--muted);
		font-weight: 700;
	}
	.admin-player-row {
		display: grid;
		grid-template-columns: 40px 1fr 1fr 1fr 60px 80px auto;
		gap: 8px;
		padding: 12px 16px;
		align-items: center;
		font-size: 13px;
		border-top: 1px solid var(--border);
		transition: background 0.15s;
	}
	.admin-player-row:hover { background: rgba(91,155,213,0.03); }
	.admin-player-row.inactive { opacity: 0.5; }
	.admin-player-rank { font-family: 'DM Mono', monospace; font-weight: 700; color: var(--celeste); }
	.admin-player-pts { font-family: 'DM Mono', monospace; font-weight: 700; }
	.admin-player-status.active { color: var(--green); font-size: 12px; }
	.admin-player-actions { display: flex; gap: 4px; flex-wrap: wrap; }
	.mono { font-family: 'DM Mono', monospace; font-size: 12px; }

	/* ─── BUTTONS ─── */
	.prode-btn-primary {
		font-family: 'Inter', sans-serif;
		font-size: 14px;
		font-weight: 700;
		background: var(--celeste);
		color: #fff;
		border: none;
		border-radius: 10px;
		padding: 12px 20px;
		cursor: pointer;
		transition: background 0.2s, opacity 0.2s;
	}
	.prode-btn-primary:hover:not(:disabled) { background: var(--celeste-dim); }
	.prode-btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }

	.prode-btn-secondary {
		font-family: 'Inter', sans-serif;
		font-size: 13px;
		font-weight: 600;
		background: none;
		color: var(--celeste);
		border: 1px solid var(--celeste);
		border-radius: 8px;
		padding: 8px 16px;
		cursor: pointer;
		transition: all 0.2s;
	}
	.prode-btn-secondary:hover { background: rgba(91,155,213,0.08); }

	.admin-btn-mini {
		font-family: 'Inter', monospace;
		font-size: 12px;
		font-weight: 700;
		letter-spacing: 0.06em;
		text-transform: uppercase;
		background: none;
		border: 1px solid var(--border);
		border-radius: 6px;
		padding: 4px 10px;
		color: var(--muted);
		cursor: pointer;
		transition: all 0.2s;
		white-space: nowrap;
	}
	.admin-btn-mini:hover { border-color: var(--celeste); color: var(--celeste); }
	.admin-btn-danger-mini:hover { border-color: var(--red); color: var(--red); }

	/* ── Sub-tabs trivia ── */
	.admin-trivia-subtabs {
		display: flex;
		gap: 0;
		border-bottom: 1px solid var(--border);
	}
	.admin-trivia-subtab {
		font-family: 'Inter', monospace;
		font-size: 12px;
		font-weight: 600;
		letter-spacing: 0.06em;
		padding: 9px 20px;
		border: none;
		border-bottom: 2px solid transparent;
		background: none;
		color: var(--muted);
		cursor: pointer;
		transition: all 0.2s;
		display: flex;
		align-items: center;
		gap: 6px;
	}
	.admin-trivia-subtab:hover { color: var(--text); }
	.admin-trivia-subtab.active { color: var(--celeste); border-bottom-color: var(--celeste); }
	.admin-trivia-var-dot {
		background: var(--red);
		color: #fff;
		font-size: 10px;
		font-weight: 800;
		padding: 1px 5px;
		border-radius: 10px;
		line-height: 1.4;
	}

	/* ── Filas de preguntas (fila única) ── */
	.admin-questions-list { display: flex; flex-direction: column; border: 1px solid var(--border); border-radius: 10px; overflow: hidden; }
	.admin-q-row {
		display: flex;
		align-items: center;
		gap: 10px;
		padding: 9px 14px;
		font-size: 12px;
		border-top: 1px solid var(--border);
		transition: background 0.15s;
	}
	.admin-q-row:first-child { border-top: none; }
	.admin-q-row-alt { background: rgba(91,155,213,0.03); }
	.admin-q-row-blocked { opacity: 0.45; }
	.admin-q-row-var { border-left: 3px solid var(--red) !important; }
	.admin-q-diff-tag {
		font-family: 'DM Mono', monospace;
		font-size: 10px;
		font-weight: 700;
		color: var(--celeste);
		background: rgba(91,155,213,0.1);
		padding: 2px 6px;
		border-radius: 4px;
		white-space: nowrap;
		flex-shrink: 0;
	}
	.admin-q-inline-text {
		flex: 1 1 180px;
		min-width: 0;
		font-weight: 600;
		color: var(--text);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}
	.admin-q-inline-opts {
		display: flex;
		gap: 8px;
		flex: 2 1 300px;
		flex-wrap: wrap;
		min-width: 0;
	}
	.admin-q-inline-opt {
		color: var(--muted);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		max-width: 120px;
	}
	.admin-q-inline-correct {
		color: var(--celeste);
		font-weight: 700;
	}
	.admin-q-inline-actions {
		display: flex;
		align-items: center;
		gap: 6px;
		flex-shrink: 0;
		margin-left: auto;
	}

	/* ── Fila trivia: grid propio (no reutiliza el de jugadores que tiene 7 cols) ── */
	.admin-trivia-header { grid-template-columns: 1fr 90px 1fr auto !important; }
	.admin-trivia-row {
		display: grid;
		grid-template-columns: 1fr 90px 1fr auto;
		gap: 12px;
		align-items: center;
		padding: 11px 16px;
		border-top: 1px solid var(--border);
		font-size: 13px;
		transition: background 0.15s;
	}
	.admin-trivia-row:hover { background: rgba(91,155,213,0.02); }
	.admin-trivia-name { font-weight: 500; }
	.admin-trivia-status { font-family: 'DM Mono', monospace; font-size: 12px; color: var(--muted); }
	.admin-trivia-count {
		display: flex;
		align-items: baseline;
		gap: 2px;
		font-family: 'DM Mono', monospace;
		font-size: 12px;
	}
	.admin-trivia-count-done { font-size: 15px; font-weight: 700; color: var(--celeste); }
	.admin-trivia-count-sep { color: var(--muted); }
	.admin-trivia-count-total { color: var(--muted); }
	.admin-trivia-count-label { font-size: 10px; color: var(--muted); margin-left: 3px; }

	.admin-trivia-row-expandable { cursor: pointer; }
	.admin-trivia-row-expandable:hover { background: rgba(91,155,213,0.05) !important; }
	.admin-trivia-expand-arrow {
		display: inline-block;
		font-size: 14px;
		color: var(--muted);
		margin-left: 4px;
		transition: transform 0.2s;
	}
	.admin-trivia-expand-arrow.open { transform: rotate(90deg); }

	/* ── Detalle de sesiones expandido ── */
	.admin-trivia-sessions {
		border-top: 1px solid var(--border);
		display: flex;
		flex-direction: column;
		gap: 0;
		background: rgba(0,0,0,0.15);
	}
	.admin-trivia-session-row {
		display: flex;
		align-items: center;
		gap: 12px;
		padding: 8px 16px 8px 32px;
		font-size: 12px;
		border-top: 1px solid rgba(255,255,255,0.04);
	}
	.admin-trivia-session-phase {
		font-family: 'DM Mono', monospace;
		color: var(--muted);
		min-width: 60px;
	}
	.admin-trivia-session-date { color: var(--muted); font-size: 11px; margin-left: auto; }
	.admin-trivia-session-status { font-weight: 600; }
	.admin-trivia-session-status-completed { color: var(--celeste); }
	.admin-trivia-session-status-in_progress { color: var(--amarillo, #f5c200); }
	.admin-trivia-session-status-ready { color: var(--muted); }
	.admin-trivia-session-lost {
		font-family: 'DM Mono', monospace;
		font-size: 11px;
		color: var(--red);
		font-weight: 600;
	}
	.admin-trivia-var-badge {
		font-family: 'Inter', monospace;
		font-size: 11px;
		font-weight: 700;
		letter-spacing: 0.08em;
		color: var(--red);
		background: rgba(217,48,37,0.12);
		border: 1px solid rgba(217,48,37,0.4);
		border-radius: 4px;
		padding: 1px 6px;
		margin-left: auto;
	}

	/* ── VAR en banco de preguntas ── */
	.admin-q-var { border-left: 3px solid var(--red) !important; }
	.admin-q-var-badge {
		font-family: 'Inter', monospace;
		font-size: 11px;
		font-weight: 800;
		letter-spacing: 0.1em;
		color: #fff;
		background: var(--red);
		border-radius: 4px;
		padding: 2px 7px;
		animation: varPulse 1.5s ease-in-out infinite;
	}
	@keyframes varPulse { 0%,100%{opacity:1} 50%{opacity:0.7} }

	/* ── Botón Activar Trivia — variantes de estado ── */
	.admin-trivia-btn {
		font-family: 'DM Mono', monospace;
		font-size: 11px;
		font-weight: 500;
		letter-spacing: 0.04em;
		border-radius: 6px;
		padding: 5px 11px;
		cursor: pointer;
		transition: all 0.2s;
		white-space: nowrap;
		border: 1px solid;
	}
	/* default: disponible para activar */
	.admin-trivia-btn-default {
		background: rgba(91,155,213,0.08);
		border-color: rgba(91,155,213,0.4);
		color: var(--celeste);
	}
	.admin-trivia-btn-default:hover {
		background: rgba(91,155,213,0.18);
		border-color: var(--celeste);
	}
	/* activated: trivia habilitada (ready o in_progress), fondo blanco + fuente negra */
	.admin-trivia-btn-activated {
		background: #ffffff;
		border-color: #e0e0e0;
		color: #111111;
		cursor: not-allowed;
	}
	/* activated-live: jugador respondiendo ahora mismo — igual pero con pulso */
	.admin-trivia-btn-activated-live {
		background: #ffffff;
		border-color: #e0e0e0;
		color: #111111;
		cursor: not-allowed;
		animation: triviaLivePulse 1.8s ease-in-out infinite;
	}
	@keyframes triviaLivePulse {
		0%,100% { opacity: 1; }
		50%      { opacity: 0.65; }
	}
	/* done: completada, se puede reactivar */
	.admin-trivia-btn-done {
		background: #ffffff;
		border-color: rgba(91,155,213,0.5);
		color: #0a1525;
	}
	.admin-trivia-btn-done:hover {
		background: #f0f4ff;
		border-color: var(--celeste);
	}
	.admin-trivia-btn-loading {
		background: rgba(255,255,255,0.05);
		border-color: rgba(255,255,255,0.15);
		color: var(--muted);
		cursor: not-allowed;
	}
	.admin-trivia-btn:disabled { pointer-events: none; }

	.admin-btn-danger {
		font-family: 'Inter', sans-serif;
		font-size: 14px;
		font-weight: 700;
		background: var(--red);
		color: #fff;
		border: none;
		border-radius: 8px;
		padding: 10px 20px;
		cursor: pointer;
	}

	/* ─── OVERLAY / DIALOG ─── */
	.admin-overlay {
		position: fixed;
		inset: 0;
		background: rgba(0,0,0,0.5);
		z-index: 500;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 24px;
	}
	.admin-dialog {
		max-width: 420px;
		width: 100%;
		display: flex;
		flex-direction: column;
		gap: 16px;
		padding: 28px;
	}
	.admin-dialog h3 { font-size: 18px; font-weight: 800; }
	.admin-dialog p { font-size: 14px; color: var(--muted); line-height: 1.5; }
	.admin-dialog-actions { display: flex; gap: 8px; justify-content: flex-end; flex-wrap: wrap; }

	/* ─── TRIVIA QUESTIONS ─── */
	.admin-questions-list { display: flex; flex-direction: column; gap: 10px; }
	.admin-question-row { padding: 16px; display: flex; flex-direction: column; gap: 8px; }
	.admin-question-row.blocked { opacity: 0.5; }
	.admin-q-head { display: flex; align-items: center; gap: 8px; }
	.admin-q-diff {
		font-family: 'DM Mono', monospace;
		font-size: 12px;
		font-weight: 700;
		color: var(--celeste);
		background: rgba(91,155,213,0.1);
		padding: 2px 8px;
		border-radius: 20px;
	}
	.admin-q-blocked {
		font-family: 'Inter', monospace;
		font-size: 12px;
		font-weight: 700;
		letter-spacing: 0.1em;
		color: var(--red);
	}
	.admin-q-text { font-size: 14px; font-weight: 600; line-height: 1.4; }
	.admin-q-opts { display: flex; flex-wrap: wrap; gap: 8px; }
	.admin-q-opt { font-size: 12px; color: var(--muted); }
	.admin-q-opt.correct { color: var(--green); font-weight: 700; }
	.admin-q-blockreason { font-size: 12px; color: var(--red); font-style: italic; }

	/* ─── POZO ─── */
	.admin-pozo-status {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 8px;
		padding: 32px;
		text-align: center;
	}
	.admin-pozo-total {
		font-family: 'DM Mono', monospace;
		font-size: 56px;
		font-weight: 700;
		color: var(--amarillo-dim);
		line-height: 1;
	}
	.admin-pozo-label {
		font-family: 'Inter', monospace;
		font-size: 13px;
		letter-spacing: 0.12em;
		text-transform: uppercase;
		color: var(--muted);
	}
	.admin-pozo-status-badge { font-size: 14px; color: var(--muted); }
	.admin-pozo-actions {
		display: flex;
		gap: 12px;
		align-items: flex-end;
		width: 100%;
		max-width: 400px;
		margin-top: 8px;
		flex-wrap: wrap;
	}

	/* ─── PRONÓSTICOS ─── */
	.admin-preds-toggle { border-top: 1px solid var(--border); padding-top: 10px; }
	.admin-preds-btn {
		background: none;
		border: none;
		font-family: 'Inter', monospace;
		font-size: 12px;
		font-weight: 600;
		letter-spacing: 0.06em;
		color: var(--celeste);
		cursor: pointer;
		padding: 0;
		display: flex;
		align-items: center;
		gap: 8px;
	}
	.admin-preds-btn:hover { opacity: 0.8; }
	.admin-preds-count {
		background: rgba(91,155,213,0.15);
		border: 1px solid rgba(91,155,213,0.3);
		border-radius: 20px;
		padding: 1px 8px;
		font-size: 11px;
	}
	.admin-preds-list {
		display: flex;
		flex-direction: column;
		gap: 4px;
		margin-top: 8px;
		padding: 12px;
		background: #020810;
		border-radius: 8px;
		border: 1px solid rgba(255,255,255,0.08);
	}
	.admin-pred-row {
		display: flex;
		align-items: center;
		gap: 10px;
		padding: 6px 8px;
		border-radius: 6px;
		min-height: 36px;
		background: #060e1a;
		border: 1px solid rgba(255,255,255,0.05);
	}
	.admin-pred-row.has-pred { background: #041a0e; border-color: rgba(61,214,140,0.15); }
	.admin-pred-name {
		font-size: 13px;
		font-weight: 600;
		width: 160px;
		flex-shrink: 0;
		color: var(--text);
	}
	.admin-pred-value {
		display: flex;
		align-items: center;
		gap: 8px;
		font-size: 13px;
		color: var(--green);
	}
	.admin-pred-score {
		font-family: 'DM Mono', monospace;
		font-size: 12px;
		color: var(--muted);
		background: rgba(255,255,255,0.06);
		padding: 2px 8px;
		border-radius: 4px;
	}
	.admin-pred-form {
		display: flex;
		align-items: center;
		gap: 6px;
		flex-wrap: wrap;
	}
	.admin-pred-select {
		font-family: 'Instrument Sans', sans-serif;
		font-size: 13px;
		padding: 5px 8px;
		border: 1px solid var(--border);
		border-radius: 6px;
		background: rgba(255,255,255,0.08);
		color: var(--text);
		outline: none;
		cursor: pointer;
	}
	.admin-pred-score-input {
		width: 46px;
		padding: 5px;
		text-align: center;
		font-family: 'DM Mono', monospace;
		font-size: 15px;
		font-weight: 700;
		border: 1px solid var(--border);
		border-radius: 6px;
		background: rgba(255,255,255,0.08);
		color: var(--text);
		outline: none;
		-moz-appearance: textfield;
	}
	.admin-pred-score-input::-webkit-outer-spin-button,
	.admin-pred-score-input::-webkit-inner-spin-button { -webkit-appearance: none; }
	.admin-pred-dash { font-family: 'DM Mono', monospace; color: var(--muted); }
	.admin-pred-empty { font-size: 12px; color: var(--muted); }

	/* ═══════════════════════════════════════════════════════
	   AMC — MATCH CARDS (nuevo diseño blanco)
	   ═══════════════════════════════════════════════════════ */

	/* Week nav */
	.amc-week-nav {
		display: flex;
		align-items: center;
		gap: 6px;
		flex-wrap: wrap;
		padding-bottom: 12px;
		border-bottom: 1px solid var(--border);
	}
	.amc-week-tab {
		font-family: 'Inter', monospace;
		font-size: 12px;
		font-weight: 700;
		letter-spacing: 0.06em;
		padding: 6px 14px;
		border-radius: 20px;
		border: 1px solid var(--border);
		background: none;
		color: var(--muted);
		cursor: pointer;
		transition: all 0.2s;
		white-space: nowrap;
	}
	.amc-week-tab:hover { color: var(--text); border-color: rgba(255,255,255,0.3); }
	.amc-week-tab.active { background: var(--celeste); color: #fff; border-color: var(--celeste); }
	.amc-week-tab-done.active { background: var(--green); border-color: var(--green); }

	/* Card base — BLANCA */
	.amc {
		background: #ffffff;
		border-radius: 14px;
		border: 1px solid #e0e6ef;
		box-shadow: 0 2px 12px rgba(0,0,0,0.07);
		display: flex;
		flex-direction: column;
		gap: 0;
		overflow: hidden;
	}
	/* Override the global dark card rule for .amc specifically */
	:global(body):has(.admin-wrap) .amc {
		background: #ffffff !important;
		border-color: #e0e6ef !important;
		box-shadow: 0 2px 12px rgba(0,0,0,0.07) !important;
	}

	/* Info row: fase + estadio */
	.amc-info {
		display: flex;
		align-items: center;
		gap: 10px;
		padding: 10px 18px 0;
		flex-wrap: wrap;
	}
	.amc-phase-badge {
		font-family: 'Inter', monospace;
		font-size: 11px;
		font-weight: 700;
		letter-spacing: 0.12em;
		text-transform: uppercase;
		color: #5b9bd5;
		background: rgba(91,155,213,0.1);
		padding: 3px 10px;
		border-radius: 20px;
	}
	.amc-venue-text {
		font-size: 12px;
		color: #888;
	}

	/* Datetime row */
	.amc-datetime {
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 6px 18px;
		flex-wrap: wrap;
	}
	.amc-dt-text {
		font-family: 'DM Mono', monospace;
		font-size: 12px;
		color: #666;
	}
	.amc-dt-edit {
		background: none;
		border: none;
		font-size: 13px;
		cursor: pointer;
		color: #5b9bd5;
		padding: 2px 6px;
		border-radius: 4px;
		line-height: 1;
	}
	.amc-dt-edit:hover { background: rgba(91,155,213,0.1); }
	.amc-dt-input {
		font-family: 'DM Mono', monospace;
		font-size: 13px;
		padding: 5px 8px;
		border: 1px solid #c0cfe0;
		border-radius: 6px;
		background: #f5f8ff;
		color: #222;
		outline: none;
	}
	.amc-dt-input:focus { border-color: #5b9bd5; }
	.amc-dt-save, .amc-dt-cancel {
		font-size: 13px;
		padding: 4px 10px;
		border-radius: 6px;
		border: 1px solid;
		cursor: pointer;
		font-weight: 700;
		line-height: 1;
	}
	.amc-dt-save { background: #3dd68c; border-color: #3dd68c; color: #fff; }
	.amc-dt-cancel { background: none; border-color: #ccc; color: #888; }

	/* Teams + score zone */
	.amc-teams {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 12px;
		padding: 16px 18px 12px;
	}
	.amc-team {
		display: flex;
		align-items: center;
		gap: 10px;
		flex: 1;
		min-width: 0;
	}
	.amc-team-r {
		flex-direction: row-reverse;
		text-align: right;
	}
	.amc-flag { font-size: 28px; flex-shrink: 0; line-height: 1; }
	.amc-tname {
		font-family: 'Inter', sans-serif;
		font-size: 18px;
		font-weight: 800;
		color: #5b9bd5;
		letter-spacing: -0.02em;
		line-height: 1.2;
		overflow: hidden;
		text-overflow: ellipsis;
	}
	.amc-score-zone {
		display: flex;
		align-items: center;
		gap: 8px;
		flex-shrink: 0;
	}
	.amc-score-inp {
		width: 52px;
		padding: 8px 0;
		text-align: center;
		font-family: 'DM Mono', monospace;
		font-size: 28px;
		font-weight: 700;
		border: 2px solid #c0cfe0;
		border-radius: 10px;
		background: #f5f8ff;
		color: #1a2840;
		outline: none;
		-moz-appearance: textfield;
	}
	.amc-score-inp::-webkit-outer-spin-button,
	.amc-score-inp::-webkit-inner-spin-button { -webkit-appearance: none; }
	.amc-score-inp:focus { border-color: #5b9bd5; background: #eef4ff; }
	.amc-score-sep {
		font-family: 'DM Mono', monospace;
		font-size: 24px;
		color: #aaa;
		font-weight: 700;
	}
	.amc-score-final {
		font-family: 'DM Mono', monospace;
		font-size: 28px;
		font-weight: 700;
		color: #1a2840;
		letter-spacing: 0.04em;
	}

	/* Controls row */
	.amc-controls {
		display: flex;
		align-items: center;
		gap: 10px;
		flex-wrap: wrap;
		padding: 10px 18px 12px;
		border-top: 1px solid #edf0f5;
		background: #f9fafc;
	}
	.amc-switch {
		display: flex;
		align-items: center;
		gap: 6px;
		cursor: pointer;
	}
	.amc-switch input[type="checkbox"] {
		accent-color: #5b9bd5;
		width: 15px;
		height: 15px;
		cursor: pointer;
	}
	.amc-switch-lbl {
		font-size: 12px;
		font-weight: 600;
		color: #555;
		white-space: nowrap;
	}
	.amc-switch-lbl.open { color: #1a8a4e; }
	.amc-tri-switch {
		display: flex;
		border: 1px solid #c0cfe0;
		border-radius: 8px;
		overflow: hidden;
		flex-shrink: 0;
	}
	.amc-tri-btn {
		font-family: 'Inter', sans-serif;
		font-size: 11px;
		font-weight: 600;
		padding: 5px 10px;
		border: none;
		border-right: 1px solid #c0cfe0;
		background: #f5f8ff;
		color: #888;
		cursor: pointer;
		transition: all 0.15s;
		white-space: nowrap;
	}
	.amc-tri-btn:last-child { border-right: none; }
	.amc-tri-btn:hover { background: #eef4ff; color: #444; }
	.amc-tri-btn.active[data-status="waiting"] { background: #fff8e1; color: #b07d00; }
	.amc-tri-btn.active { background: #e8f4ff; color: #1a5a9e; }
	.amc-tri-btn:nth-child(1).active { background: #fff8e1; color: #b07d00; }
	.amc-tri-btn:nth-child(2).active { background: #e6f7ee; color: #1a8a4e; }
	.amc-tri-btn:nth-child(3).active { background: #fdecea; color: #c0392b; }
	.amc-winner-sel {
		font-size: 13px;
		padding: 5px 8px;
		border: 1px solid #c0cfe0;
		border-radius: 7px;
		background: #fff;
		color: #333;
		outline: none;
		cursor: pointer;
	}
	.amc-confirm-btn {
		font-family: 'Inter', sans-serif;
		font-size: 13px;
		font-weight: 700;
		background: #3dd68c;
		color: #fff;
		border: none;
		border-radius: 8px;
		padding: 7px 16px;
		cursor: pointer;
		margin-left: auto;
		transition: opacity 0.2s;
	}
	.amc-confirm-btn:disabled { opacity: 0.5; cursor: not-allowed; }
	.amc-confirm-btn.confirmed { background: #1a8a4e; opacity: 1; cursor: default; }
	.amc-et-row {
		display: flex; align-items: center; gap: 6px;
		padding: 6px 10px;
		background: rgba(0,0,0,0.04);
		border-radius: 8px;
		font-size: 13px;
	}
	.amc-et-lbl { font-weight: 700; color: #555; min-width: 40px; }
	.amc-et-input {
		width: 48px; text-align: center;
		border: 1px solid #ddd; border-radius: 6px;
		padding: 4px 6px; font-size: 16px; font-family: 'DM Mono', monospace;
	}
	.amc-result-done {
		padding: 10px 18px 12px;
		font-size: 13px;
		color: #1a8a4e;
		font-weight: 600;
		border-top: 1px solid #edf0f5;
		background: #f4fdf8;
	}

	/* Pred bar / toggle */
	.amc-pred-bar {
		display: flex;
		align-items: center;
		gap: 16px;
		padding: 10px 18px;
		background: none;
		border: none;
		border-top: 1px solid #edf0f5;
		cursor: pointer;
		width: 100%;
		text-align: left;
		font-size: 13px;
		color: #444;
		transition: background 0.15s;
	}
	.amc-pred-bar:hover { background: #f5f8ff; }
	.amc-pred-bar strong { color: #5b9bd5; }
	.amc-expand { margin-left: auto; font-size: 11px; color: #888; }

	/* Preds panel */
	.amc-preds-panel {
		background: #f4f7fb;
		border-top: 1px solid #e0e8f4;
		padding: 14px 18px;
	}
	.amc-preds-grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 8px;
	}
	@media (max-width: 600px) { .amc-preds-grid { grid-template-columns: 1fr; } }

	.amc-prow {
		background: #fff;
		border: 1px solid #e0e8f4;
		border-radius: 10px;
		padding: 10px 12px;
		display: flex;
		flex-direction: column;
		gap: 8px;
		transition: border-color 0.15s;
	}
	.amc-prow.has-pred {
		border-color: #2a4a7f;
		background: #0f2544;
		flex-direction: row;
		align-items: center;
		gap: 8px;
		padding: 8px 12px;
		position: relative;
	}
	.amc-prow.has-pred .amc-prow-name { color: #c8d8f0; font-size: 12px; flex-shrink: 0; }
	.amc-prow.has-pred .amc-by-pill { background: rgba(91,155,213,0.15); color: #7aa8d4; flex-shrink: 0; }
	.amc-prow.is-missed {
		border-color: #1e3660;
		background: #0a1e3a;
		flex-direction: row;
		align-items: center;
		gap: 8px;
		padding: 5px 12px;
	}
	.amc-prow.is-missed .amc-prow-name { color: #4a6a99; font-size: 12px; flex-shrink: 0; }
	.amc-missed-lbl {
		font-size: 11px;
		color: #3a5a8a;
		font-style: italic;
		margin-left: auto;
	}
	.amc-prow-name {
		font-size: 13px;
		font-weight: 700;
		color: #222;
	}

	/* Existing pred display */
	.amc-prow-result {
		display: flex;
		align-items: center;
		gap: 6px;
		flex-wrap: wrap;
	}
	.amc-winner-pill {
		font-size: 12px;
		font-weight: 700;
		color: #1a8a4e;
		background: rgba(61,214,140,0.15);
		border: 1px solid rgba(61,214,140,0.4);
		border-radius: 20px;
		padding: 2px 10px;
	}
	.amc-score-pill {
		font-family: 'DM Mono', monospace;
		font-size: 12px;
		color: #555;
		background: #eef2f9;
		border-radius: 20px;
		padding: 2px 8px;
	}
	.amc-by-pill {
		font-size: 11px;
		font-weight: 700;
		letter-spacing: 0.06em;
		text-transform: uppercase;
		padding: 2px 8px;
		border-radius: 20px;
		background: #e8edf5;
		color: #777;
	}
	.amc-by-pill.by-admin { background: rgba(91,155,213,0.15); color: #3a6fa8; }

	/* Entry form (no pred yet) */
	.amc-prow-entry {
		display: flex;
		align-items: center;
		gap: 6px;
		flex-wrap: wrap;
	}
	.amc-seg {
		display: flex;
		border: 1px solid #c0cfe0;
		border-radius: 8px;
		overflow: hidden;
		flex-shrink: 0;
	}
	.amc-seg-btn {
		font-size: 11px;
		font-weight: 600;
		padding: 5px 8px;
		border: none;
		background: #f5f8ff;
		color: #555;
		cursor: pointer;
		transition: all 0.15s;
		border-right: 1px solid #c0cfe0;
		white-space: nowrap;
	}
	.amc-seg-btn:last-child { border-right: none; }
	.amc-seg-btn:hover { background: #eef4ff; color: #333; }
	.amc-seg-btn.sel { background: #5b9bd5; color: #fff; }
	.amc-seg-mid { border-left: 1px solid #c0cfe0; border-right: 1px solid #c0cfe0; }
	.amc-mini-score {
		width: 38px;
		padding: 5px 2px;
		text-align: center;
		font-family: 'DM Mono', monospace;
		font-size: 15px;
		font-weight: 700;
		border: 1px solid #c0cfe0;
		border-radius: 6px;
		background: #f5f8ff;
		color: #1a2840;
		outline: none;
		-moz-appearance: textfield;
	}
	.amc-mini-score::-webkit-outer-spin-button,
	.amc-mini-score::-webkit-inner-spin-button { -webkit-appearance: none; }
	.amc-mini-score:focus { border-color: #5b9bd5; }
	.amc-mini-sep { font-family: 'DM Mono', monospace; font-size: 14px; color: #aaa; }
	.amc-save-pred {
		font-size: 14px;
		font-weight: 700;
		background: #3dd68c;
		color: #fff;
		border: none;
		border-radius: 6px;
		width: 30px;
		height: 30px;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
		transition: opacity 0.2s;
	}
	.amc-save-pred:disabled { opacity: 0.4; cursor: not-allowed; }
	.amc-no-pred { font-size: 12px; color: #aaa; }
	.amc-no-pred.is-closed { color: #e06060; }
	.amc-pred-summary {
		display: flex;
		align-items: center;
		gap: 6px;
		flex: 1;
		min-width: 0;
	}
	.amc-pred-winner {
		font-size: 12px;
		font-weight: 700;
		color: #8bbde8;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}
	.amc-pred-score {
		font-family: 'DM Mono', monospace;
		font-size: 12px;
		font-weight: 700;
		color: #e8f0fb;
		white-space: nowrap;
		flex-shrink: 0;
	}
	.amc-pred-noscore {
		font-size: 11px;
		color: #f5c200;
		font-style: italic;
		flex-shrink: 0;
	}
	.amc-admin-tag {
		font-family: 'Inter', monospace;
		font-size: 9px;
		font-weight: 800;
		letter-spacing: 0.12em;
		background: rgba(91,155,213,0.2);
		border: 1px solid rgba(91,155,213,0.4);
		border-radius: 5px;
		padding: 3px 8px;
		color: #7aa8d4;
		cursor: pointer;
		position: absolute;
		top: 50%;
		right: 10px;
		transform: translateY(-50%);
		transition: all 0.15s;
	}
	.amc-admin-tag:hover { background: rgba(91,155,213,0.35); color: #add0f0; border-color: rgba(91,155,213,0.7); }
	.amc-jugador-tag {
		font-family: 'Inter', monospace;
		font-size: 10px;
		font-weight: 700;
		letter-spacing: 0.08em;
		background: rgba(255,255,255,0.06);
		border: 1px solid rgba(255,255,255,0.1);
		border-radius: 5px;
		padding: 2px 7px;
		color: #5a7a9a;
		flex-shrink: 0;
	}
	.amc-cancel-edit {
		font-size: 13px;
		background: none;
		border: 1px solid #e0a0a0;
		border-radius: 5px;
		padding: 3px 7px;
		color: #c06060;
		cursor: pointer;
		flex-shrink: 0;
		transition: all 0.15s;
	}
	.amc-cancel-edit:hover { background: #fff0f0; }

	/* Finished list */
	.amc-finished-list {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}
	.amc-finished-row {
		background: #ffffff;
		border: 1px solid #e0e8f4;
		border-radius: 10px;
		padding: 12px 16px;
		display: flex;
		align-items: center;
		gap: 14px;
		flex-wrap: wrap;
	}
	:global(body):has(.admin-wrap) .amc-finished-row {
		background: #ffffff !important;
		border-color: #e0e8f4 !important;
	}
	.amc-fin-phase {
		font-family: 'Inter', monospace;
		font-size: 11px;
		font-weight: 700;
		letter-spacing: 0.1em;
		text-transform: uppercase;
		color: #5b9bd5;
		flex-shrink: 0;
	}
	.amc-fin-teams {
		font-size: 14px;
		color: #222;
		font-weight: 600;
		flex: 1;
		min-width: 0;
	}
	.amc-fin-score {
		font-family: 'DM Mono', monospace;
		font-size: 16px;
		font-weight: 700;
		color: #1a2840;
		margin: 0 6px;
	}
	.amc-fin-winner {
		font-size: 12px;
		color: #1a8a4e;
		font-weight: 600;
	}
	.amc-fin-date {
		font-family: 'DM Mono', monospace;
		font-size: 11px;
		color: #888;
		flex-shrink: 0;
	}

	/* ─── RESPONSIVE ─── */
	@media (max-width: 768px) {
		.admin-players-header, .admin-player-row {
			grid-template-columns: 30px 1fr 1fr;
		}
		.admin-match-top { flex-direction: column; align-items: flex-start; }
	}
	@media (max-width: 640px) {
		.admin-wrap { padding: 16px 16px 40px; }
	}
</style>
