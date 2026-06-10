<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { page } from '$app/stores';
	import { supabase } from '$lib/supabase';
	import { getSession } from '$lib/mundial/auth';
	import { sleep } from '$lib/mundial/utils';

	// ─── TIPOS ───────────────────────────────────────────────────
	interface TriviaUser {
		id: string;
		full_name: string;
		username: string;
		avatar_url: string | null;
		points_total: number;
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
		explanation?: string | null;  // campo opcional, puede no existir en DB
	}

	interface AnswerRecord {
		question_id: string;
		selected: string;
		correct: boolean;
		time_taken_ms: number;
	}

	interface TriviaSession {
		id: string;
		user_id: string;
		phase: string;
		level_chosen: number;
		question_ids: string[];
		answers: AnswerRecord[];
		score: number;
		points_earned: number;
		status: string;
	}

	// ─── ESTADO ───────────────────────────────────────────────────
	let usernameParam = '';
	let isOwner = false;
	let isRehearsalMode = true;

	let loadingState: 'loading' | 'no-user' | 'no-session' | 'ready' = 'loading';

	let triviaUser: TriviaUser | null = null;
	let triviaSession: TriviaSession | null = null;
	let triviaQuestions: TriviaQuestion[] = [];

	// Game state
	let gamePhase: 'idle' | 'question' | 'reveal' | 'done' = 'idle';
	let currentIdx = 0;
	let selectedAnswer: string | null = null;
	let timer = 20;
	let timerInterval: ReturnType<typeof setInterval> | null = null;
	let timerStart = 0;
	let correctCount = 0;
	let isTransitioning = false;

	// Summary state
	let expandedRows: Set<number> = new Set();
	let reportedQuestions: Set<string> = new Set();
	let reportingQuestion: string | null = null;

	let realtimeChannel: ReturnType<typeof supabase.channel> | null = null;

	// ─── BOOT ───────────────────────────────────────────────────
	onMount(async () => {
		usernameParam = $page.url.searchParams.get('J') ?? '';

		const { data: cfg } = await supabase.from('config').select('key, value').in('key', ['is_rehearsal_mode']);
		cfg?.forEach((c) => { if (c.key === 'is_rehearsal_mode') isRehearsalMode = c.value === 'true'; });

		const sessionUser = getSession();
		isOwner = !!(sessionUser && sessionUser.username === usernameParam);

		if (!usernameParam) { loadingState = 'no-user'; return; }

		const { data: userData } = await supabase
			.from('users')
			.select('id, full_name, username, avatar_url, points_total')
			.eq('username', usernameParam)
			.single();

		if (!userData) { loadingState = 'no-user'; return; }
		triviaUser = userData as TriviaUser;

		await loadSession();
		subscribeRealtime();
	});

	onDestroy(() => {
		if (timerInterval) clearInterval(timerInterval);
		realtimeChannel?.unsubscribe();
	});

	async function loadSession() {
		if (!triviaUser) return;

		const { data: ts } = await supabase
			.from('trivia_sessions')
			.select('*')
			.eq('user_id', triviaUser.id)
			.in('status', ['ready', 'in_progress', 'completed'])
			.order('enabled_at', { ascending: false })
			.limit(1)
			.single();

		if (!ts) { loadingState = 'no-session'; return; }
		triviaSession = ts as TriviaSession;

		if (triviaSession.question_ids?.length) {
			await loadQuestions(triviaSession.question_ids);
		}

		if (triviaSession.status === 'in_progress') {
			const answered = triviaSession.answers?.length ?? 0;
			currentIdx = answered < triviaSession.question_ids.length ? answered : triviaSession.question_ids.length - 1;
			correctCount = triviaSession.answers?.filter((a) => a.correct).length ?? 0;
			gamePhase = answered >= triviaSession.question_ids.length ? 'done' : 'question';
			if (gamePhase === 'question') startTimer();
		} else if (triviaSession.status === 'completed') {
			correctCount = triviaSession.score ?? 0;
			gamePhase = 'done';
		}

		loadingState = 'ready';
	}

	async function loadQuestions(ids: string[]) {
		const { data: qData } = await supabase
			.from('trivia_questions')
			.select('id, question_text, option_a, option_b, option_c, option_d, correct_answer, difficulty, category, explanation')
			.in('id', ids);
		if (!qData) return;
		triviaQuestions = ids
			.map((id) => qData.find((q) => q.id === id))
			.filter(Boolean) as TriviaQuestion[];
	}

	function subscribeRealtime() {
		if (!triviaUser) return;
		realtimeChannel = supabase
			.channel(`trivia-screen-${triviaUser.id}`)
			.on(
				'postgres_changes',
				{ event: '*', schema: 'public', table: 'trivia_sessions', filter: `user_id=eq.${triviaUser.id}` },
				async (payload) => {
					const updated = payload.new as TriviaSession;
					if (!updated) return;
					triviaSession = updated;
					if (updated.status === 'ready' && loadingState === 'no-session') {
						if (updated.question_ids?.length) await loadQuestions(updated.question_ids);
						loadingState = 'ready';
						gamePhase = 'idle';
					}
				}
			)
			.subscribe();
	}

	// ─── JUEGO ───────────────────────────────────────────────────
	async function startGame() {
		if (!triviaSession || !triviaUser) return;
		await supabase
			.from('trivia_sessions')
			.update({ status: 'in_progress', started_at: new Date().toISOString() })
			.eq('id', triviaSession.id);
		triviaSession = { ...triviaSession, status: 'in_progress' };
		currentIdx = 0;
		correctCount = 0;
		gamePhase = 'question';
		startTimer();
	}

	function startTimer() {
		timer = 20;
		selectedAnswer = null;
		timerStart = Date.now();
		if (timerInterval) clearInterval(timerInterval);
		timerInterval = setInterval(() => {
			timer--;
			if (timer <= 0) {
				clearInterval(timerInterval!);
				handleAnswer(null);
			}
		}, 1000);
	}

	async function handleAnswer(selected: string | null) {
		if (!triviaSession || !triviaQuestions[currentIdx] || isTransitioning) return;
		isTransitioning = true;
		if (timerInterval) clearInterval(timerInterval);

		const q = triviaQuestions[currentIdx];
		const timeTaken = Date.now() - timerStart;
		const isCorrect = selected !== null && selected === q.correct_answer;

		selectedAnswer = selected;
		gamePhase = 'reveal';
		if (isCorrect) correctCount++;

		const currentAnswers: AnswerRecord[] = triviaSession.answers ?? [];
		const newAnswers: AnswerRecord[] = [...currentAnswers, {
			question_id: q.id,
			selected: selected ?? 'timeout',
			correct: isCorrect,
			time_taken_ms: timeTaken
		}];

		await supabase
			.from('trivia_sessions')
			.update({ answers: newAnswers })
			.eq('id', triviaSession.id);

		// Actualizar sesión local — esto dispara la reactividad de $: steps
		triviaSession = { ...triviaSession, answers: newAnswers };

		await sleep(2200);

		if (currentIdx + 1 >= triviaQuestions.length) {
			await finishGame();
		} else {
			currentIdx++;
			gamePhase = 'question';
			startTimer();
		}
		isTransitioning = false;
	}

	async function finishGame() {
		if (!triviaSession) return;
		const POINTS: Record<number, number> = { 1: 5, 2: 10, 3: 20 };
		const { data: cfg } = await supabase.from('config').select('value').eq('key', 'trivia_penalty_points').single();
		const penalty = parseInt(cfg?.value ?? '2');

		let pts = 0;
		for (const ans of triviaSession.answers) {
			if (ans.correct) pts += POINTS[triviaSession.level_chosen] ?? 10;
			else pts -= penalty;
		}
		pts = Math.max(0, pts);

		await supabase
			.from('trivia_sessions')
			.update({ status: 'completed', completed_at: new Date().toISOString(), points_earned: pts, score: correctCount })
			.eq('id', triviaSession.id);

		if (!isRehearsalMode && triviaUser) {
			const sessionUser = getSession();
			if (sessionUser?.id === triviaUser.id) {
				const newTotal = (triviaUser.points_total ?? 0) + pts;
				await supabase.from('users').update({ points_total: newTotal }).eq('id', triviaUser.id);
				triviaUser = { ...triviaUser, points_total: newTotal };
			}
		}

		triviaSession = { ...triviaSession, status: 'completed', points_earned: pts, score: correctCount };
		gamePhase = 'done';
	}

	// ─── IMPUGNAR ────────────────────────────────────────────────
	async function impugnarQuestion(questionId: string, questionText: string) {
		reportingQuestion = questionId;
		const username = triviaUser?.username ?? 'jugador';
		const note = `[IMPUGNADA por @${username}] ${questionText.slice(0, 60)}`;

		// Escribir en block_reason para que el árbitro lo vea destacado
		await supabase
			.from('trivia_questions')
			.update({ block_reason: note })
			.eq('id', questionId)
			.is('is_active', true);  // solo si aún está activa

		reportedQuestions = new Set([...reportedQuestions, questionId]);
		reportingQuestion = null;
	}

	// ─── SUMMARY UI ──────────────────────────────────────────────
	function toggleRow(i: number) {
		const next = new Set(expandedRows);
		if (next.has(i)) next.delete(i); else next.add(i);
		expandedRows = next;
	}

	function getOptionText(q: TriviaQuestion, letter: string): string {
		const key = `option_${letter}` as keyof TriviaQuestion;
		return (q[key] as string) ?? '';
	}

	// ─── REACTIVO: PASOS ─────────────────────────────────────────
	// $: asegura que Svelte recalcule cada vez que cambia triviaSession, gamePhase o currentIdx
	$: steps = triviaQuestions.map((_, i) => {
		const ans = triviaSession?.answers?.[i];
		if (ans) return ans.correct ? 'done-correct' : 'done-wrong';
		if (gamePhase !== 'idle' && gamePhase !== 'done' && i === currentIdx) return 'current';
		return 'pending';
	});

	$: circumference = 2 * Math.PI * 44;
	$: dashoffset = circumference * (1 - timer / 20);
	$: currentQ = triviaQuestions[currentIdx] ?? null;
	$: pointsEarned = triviaSession?.points_earned ?? 0;

	function levelLabel(l: number) {
		return l === 1 ? 'FÁCIL' : l === 2 ? 'INTERMEDIO' : 'DIFÍCIL';
	}
</script>

<svelte:head>
	<title>Trivia — Prode Cíclico</title>
	<meta name="robots" content="noindex" />
</svelte:head>

<div class="trivia-root">

	{#if loadingState === 'loading'}
		<div class="trivia-center">
			<div class="tv-spinner"></div>
			<p class="tv-muted">Cargando trivia…</p>
		</div>

	{:else if loadingState === 'no-user'}
		<div class="trivia-center">
			<div class="tv-error-icon">⚠️</div>
			<h2 class="tv-heading">Jugador no encontrado</h2>
			<p class="tv-muted">Usá <code>?J=username</code> para cargar la trivia de un jugador.</p>
			<a href="/mundial" class="tv-back-link">← Volver al inicio</a>
		</div>

	{:else if loadingState === 'no-session' || triviaSession === null}
		<div class="trivia-center">
			{#if triviaUser}
				<div class="tv-waiting-avatar">
					{#if triviaUser.avatar_url}
						<img src={triviaUser.avatar_url} alt={triviaUser.full_name} class="tv-avatar-img" />
					{:else}
						<div class="tv-avatar-placeholder">{triviaUser.full_name[0]}</div>
					{/if}
				</div>
				<h2 class="tv-player-name">{triviaUser.full_name}</h2>
			{/if}
			<div class="tv-waiting-pulse">⏳</div>
			<p class="tv-muted">Esperando que el árbitro habilite la trivia…</p>
		</div>

	{:else}
		<!-- BARRA SUPERIOR TV -->
		<header class="tv-header">
			<div class="tv-logo">
				<span class="tv-logo-mark">CI</span>
				<span class="tv-logo-text">CÍCLICO</span>
				<span class="tv-logo-sep">·</span>
				<span class="tv-logo-sub">PRODE MUNDIAL</span>
			</div>
			{#if isRehearsalMode}
				<div class="tv-ensayo-badge">⚠️ ENSAYO</div>
			{/if}
			<div class="tv-level-badge">{levelLabel(triviaSession.level_chosen)}</div>
		</header>

		<main class="tv-main">

			<!-- INFO DEL JUGADOR -->
			<div class="tv-player-bar">
				{#if triviaUser?.avatar_url}
					<img src={triviaUser.avatar_url} alt={triviaUser.full_name} class="tv-player-avatar" />
				{:else}
					<div class="tv-player-avatar-placeholder">{triviaUser?.full_name[0] ?? '?'}</div>
				{/if}
				<div class="tv-player-info">
					<div class="tv-player-fullname">{triviaUser?.full_name ?? ''}</div>
					<div class="tv-player-username">@{triviaUser?.username ?? ''}</div>
				</div>
				{#if gamePhase !== 'idle'}
					<div class="tv-score-chip">
						<span class="tv-score-num">{correctCount}</span>
						<span class="tv-score-denom">/{triviaQuestions.length}</span>
					</div>
				{/if}
			</div>

			<!-- ── PROGRESS STEPS (reactivo via $: steps) ── -->
			{#if gamePhase !== 'idle'}
				<div class="tv-steps">
					{#each steps as state, i}
						<div
							class="tv-step"
							class:tv-step-current={state === 'current'}
							class:tv-step-done-correct={state === 'done-correct'}
							class:tv-step-done-wrong={state === 'done-wrong'}
						>
							{#if state === 'done-correct'}✓
							{:else if state === 'done-wrong'}✗
							{:else}{i + 1}
							{/if}
						</div>
						{#if i < steps.length - 1}
							<div class="tv-step-connector"
								class:tv-step-connector-done={state === 'done-correct' || state === 'done-wrong'}
							></div>
						{/if}
					{/each}
				</div>
			{/if}

			<!-- ══ IDLE: BOTÓN VAMOS ══ -->
			{#if gamePhase === 'idle'}
				<div class="tv-idle">
					<div class="tv-idle-label">TRIVIA HABILITADA</div>
					<div class="tv-idle-questions">
						{triviaSession.question_ids.length} preguntas · {levelLabel(triviaSession.level_chosen)} · 20 seg c/u
					</div>
					{#if isOwner}
						<button class="tv-vamos-btn" on:click={startGame}>
							<span class="tv-vamos-icon">▶</span> VAMOS
						</button>
					{:else}
						<div class="tv-waiting-text">
							<div class="tv-waiting-dots"><span></span><span></span><span></span></div>
							Esperando que {triviaUser?.full_name} inicie…
						</div>
					{/if}
				</div>

			<!-- ══ PREGUNTA / REVEAL ══ -->
			{:else if gamePhase === 'question' || gamePhase === 'reveal'}
				{#if currentQ}
					<div class="tv-game">
						<!-- Cronómetro -->
						<div class="tv-timer-wrap">
							<svg class="tv-timer-svg" viewBox="0 0 100 100">
								<circle cx="50" cy="50" r="44" class="tv-timer-track" />
								<circle
									cx="50" cy="50" r="44"
									class="tv-timer-arc"
									class:tv-timer-urgent={timer <= 5}
									style="stroke-dasharray: {circumference}px; stroke-dashoffset: {dashoffset}px;"
								/>
							</svg>
							<span class="tv-timer-num" class:tv-timer-urgent={timer <= 5}>
								{#if gamePhase === 'reveal'}✓{:else}{timer}{/if}
							</span>
						</div>

						<!-- Pregunta -->
						<div class="tv-question-box">
							<div class="tv-question-num">PREGUNTA {currentIdx + 1} DE {triviaQuestions.length}</div>
							<p class="tv-question-text">{currentQ.question_text}</p>
						</div>

						<!-- Opciones -->
						<div class="tv-options">
							{#each ['a', 'b', 'c', 'd'] as opt}
								{@const label = getOptionText(currentQ, opt)}
								{@const isSelected = selectedAnswer === opt}
								{@const isCorrect = opt === currentQ.correct_answer}
								{@const isWrong = gamePhase === 'reveal' && isSelected && !isCorrect}
								{@const showCorrect = gamePhase === 'reveal' && isCorrect}
								<button
									class="tv-option"
									class:tv-option-selected={isSelected && gamePhase === 'question'}
									class:tv-option-correct={showCorrect}
									class:tv-option-wrong={isWrong}
									class:tv-option-dim={gamePhase === 'reveal' && !isCorrect && !isSelected}
									disabled={gamePhase === 'reveal' || !isOwner}
									on:click={() => gamePhase === 'question' && isOwner && handleAnswer(opt)}
								>
									<span class="tv-opt-letter">{opt.toUpperCase()}</span>
									<span class="tv-opt-text">{label}</span>
									{#if showCorrect}<span class="tv-opt-badge">✓</span>{/if}
									{#if isWrong}<span class="tv-opt-badge">✗</span>{/if}
								</button>
							{/each}
						</div>
					</div>
				{/if}

			<!-- ══ DONE: RESUMEN ══ -->
			{:else if gamePhase === 'done'}
				<div class="tv-done">
					<div class="tv-done-icon">
						{#if correctCount >= 4}🏆{:else if correctCount >= 3}🥈{:else if correctCount >= 2}👍{:else}💪{/if}
					</div>
					<div class="tv-done-score">{correctCount}<span>/{triviaQuestions.length}</span></div>
					<div class="tv-done-label">respuestas correctas</div>

					{#if isRehearsalMode}
						<div class="tv-done-pts tv-done-pts-ensayo">
							En modo real habrías ganado <strong>{pointsEarned} puntos</strong>
						</div>
					{:else}
						<div class="tv-done-pts">
							+{pointsEarned} puntos acreditados 🎉
						</div>
					{/if}

					<!-- ── RESUMEN EXPANDIBLE ── -->
					<div class="tv-breakdown">
						<div class="tv-breakdown-title">Detalle pregunta a pregunta</div>
						{#each triviaQuestions as q, i}
							{@const ans = triviaSession.answers?.[i]}
							{@const isExpanded = expandedRows.has(i)}
							{@const wasWrong = ans && !ans.correct}
							{@const isReported = reportedQuestions.has(q.id)}
							<div class="tv-breakdown-item" class:tv-breakdown-ok={ans?.correct} class:tv-breakdown-fail={wasWrong}>
								<!-- HEADER: siempre visible -->
								<button class="tv-breakdown-header" on:click={() => toggleRow(i)}>
									<span class="tv-bdh-num">{i + 1}</span>
									<span class="tv-bdh-q">{q.question_text}</span>
									<span class="tv-bdh-result">{ans?.correct ? '✅' : ans ? '❌' : '—'}</span>
									<span class="tv-bdh-arrow" class:tv-bdh-arrow-open={isExpanded}>›</span>
								</button>

								<!-- BODY: desplegable -->
								{#if isExpanded}
									<div class="tv-breakdown-body">
										<!-- Respuesta elegida -->
										<div class="tv-bd-row">
											<span class="tv-bd-label">Tu respuesta:</span>
											<span class="tv-bd-val" class:tv-bd-val-ok={ans?.correct} class:tv-bd-val-fail={wasWrong}>
												{#if ans && ans.selected !== 'timeout'}
													<strong>{ans.selected.toUpperCase()}</strong> — {getOptionText(q, ans.selected)}
												{:else if ans?.selected === 'timeout'}
													<em>Tiempo agotado</em>
												{:else}
													—
												{/if}
											</span>
										</div>

										<!-- Respuesta correcta (si se equivocó) -->
										{#if wasWrong}
											<div class="tv-bd-row">
												<span class="tv-bd-label">Respuesta correcta:</span>
												<span class="tv-bd-val tv-bd-val-ok">
													<strong>{q.correct_answer.toUpperCase()}</strong> — {getOptionText(q, q.correct_answer)}
												</span>
											</div>
										{/if}

										<!-- Explicación -->
										{#if q.explanation}
											<div class="tv-bd-explanation">
												<span class="tv-bd-explanation-icon">💡</span>
												<p>{q.explanation}</p>
											</div>
										{/if}

										<!-- Botón impugnar (solo si respondió mal y es dueño) -->
										{#if wasWrong && isOwner}
											{#if isReported}
												<div class="tv-impugnar-done">✓ Impugnación enviada al árbitro</div>
											{:else}
												<button
													class="tv-impugnar-btn"
													disabled={reportingQuestion === q.id}
													on:click={() => impugnarQuestion(q.id, q.question_text)}
												>
													{reportingQuestion === q.id ? '⏳ Enviando…' : '🚩 Impugnar esta pregunta'}
												</button>
											{/if}
										{/if}
									</div>
								{/if}
							</div>
						{/each}
					</div>

					<a href="/mundial/jugador/{triviaUser?.username}" class="tv-back-link">← Volver a mi panel</a>
				</div>
			{/if}

		</main>
	{/if}
</div>

<style>
	:global(body) { background: #0a0a0f !important; }

	.trivia-root {
		min-height: 100vh;
		background: #0a0a0f;
		color: #f0ede8;
		font-family: 'Instrument Sans', sans-serif;
		display: flex;
		flex-direction: column;
	}

	/* ── HEADER ── */
	.tv-header {
		display: flex; align-items: center; gap: 12px;
		padding: 14px 28px;
		border-bottom: 1px solid rgba(255,255,255,0.08);
		background: rgba(255,255,255,0.03);
		position: sticky; top: 0; z-index: 10;
	}
	.tv-logo { display: flex; align-items: center; gap: 8px; }
	.tv-logo-mark {
		width: 28px; height: 28px; border-radius: 50%;
		border: 2px solid #ff5500;
		display: flex; align-items: center; justify-content: center;
		font-family: 'Inter', sans-serif; font-size: 9px; font-weight: 800; color: #ff5500;
	}
	.tv-logo-text {
		font-family: 'Inter', sans-serif; font-weight: 800;
		font-size: 13px; letter-spacing: 0.06em; text-transform: uppercase;
	}
	.tv-logo-sep { color: rgba(255,255,255,0.2); }
	.tv-logo-sub {
		font-family: 'DM Mono', monospace; font-size: 10px;
		color: rgba(255,255,255,0.3); letter-spacing: 0.1em; text-transform: uppercase;
	}
	.tv-ensayo-badge {
		margin-left: auto;
		font-family: 'DM Mono', monospace; font-size: 11px;
		background: rgba(245,194,0,0.1); color: #f5c200;
		border: 1px solid rgba(245,194,0,0.3);
		padding: 4px 10px; border-radius: 20px;
	}
	.tv-level-badge {
		font-family: 'DM Mono', monospace; font-size: 11px; letter-spacing: 0.12em;
		background: rgba(255,85,0,0.12); color: #ff5500;
		border: 1px solid rgba(255,85,0,0.3);
		padding: 4px 10px; border-radius: 20px;
	}
	.tv-ensayo-badge + .tv-level-badge { margin-left: 0; }
	.tv-level-badge:only-child, .tv-level-badge:first-of-type { margin-left: auto; }

	/* ── MAIN ── */
	.tv-main {
		flex: 1; max-width: 860px; margin: 0 auto; width: 100%;
		padding: 28px 24px 48px;
		display: flex; flex-direction: column; gap: 24px;
	}

	/* ── PLAYER BAR ── */
	.tv-player-bar {
		display: flex; align-items: center; gap: 14px;
		background: rgba(255,255,255,0.03);
		border: 1px solid rgba(255,255,255,0.08);
		border-radius: 14px; padding: 14px 18px;
	}
	.tv-player-avatar {
		width: 48px; height: 48px; border-radius: 50%; object-fit: cover;
		border: 2px solid rgba(255,85,0,0.4); flex-shrink: 0;
	}
	.tv-player-avatar-placeholder {
		width: 48px; height: 48px; border-radius: 50%; flex-shrink: 0;
		background: rgba(255,85,0,0.12); border: 2px solid rgba(255,85,0,0.4);
		display: flex; align-items: center; justify-content: center;
		font-size: 20px; font-weight: 700; color: #ff5500;
	}
	.tv-player-info { flex: 1; min-width: 0; }
	.tv-player-fullname {
		font-family: 'Inter', sans-serif; font-weight: 700;
		font-size: 17px; color: #f0ede8;
		white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
	}
	.tv-player-username {
		font-family: 'DM Mono', monospace; font-size: 11px;
		color: rgba(255,255,255,0.3); letter-spacing: 0.05em;
	}
	.tv-score-chip {
		background: rgba(62,207,142,0.1); border: 1px solid rgba(62,207,142,0.3);
		border-radius: 10px; padding: 6px 14px; text-align: center; flex-shrink: 0;
	}
	.tv-score-num {
		font-family: 'Inter', sans-serif; font-weight: 800; font-size: 22px;
		color: #3ecf8e; line-height: 1;
	}
	.tv-score-denom { font-size: 12px; color: rgba(255,255,255,0.3); }

	/* ── PROGRESS STEPS ── */
	.tv-steps {
		display: flex; align-items: center; justify-content: center;
	}
	.tv-step {
		width: 40px; height: 40px; border-radius: 50%; flex-shrink: 0;
		display: flex; align-items: center; justify-content: center;
		font-family: 'DM Mono', monospace; font-size: 13px; font-weight: 500;
		border: 2px solid rgba(255,255,255,0.1); color: rgba(255,255,255,0.25);
		transition: all 0.35s ease;
	}
	.tv-step-current {
		border-color: #ff5500; color: #ff5500;
		box-shadow: 0 0 18px rgba(255,85,0,0.4);
		animation: stepPulse 1.4s ease-in-out infinite;
	}
	.tv-step-done-correct {
		background: rgba(62,207,142,0.15); border-color: #3ecf8e; color: #3ecf8e;
	}
	.tv-step-done-wrong {
		background: rgba(255,68,68,0.12); border-color: #ff4444; color: #ff4444;
	}
	.tv-step-connector {
		flex: 1; height: 2px; max-width: 44px;
		background: rgba(255,255,255,0.07);
		transition: background 0.35s ease;
	}
	.tv-step-connector-done { background: rgba(62,207,142,0.25); }
	@keyframes stepPulse {
		0%,100% { box-shadow: 0 0 10px rgba(255,85,0,0.3); }
		50%      { box-shadow: 0 0 24px rgba(255,85,0,0.65); }
	}

	/* ── IDLE ── */
	.tv-idle {
		flex: 1; display: flex; flex-direction: column;
		align-items: center; justify-content: center;
		gap: 18px; text-align: center; padding: 40px 0;
	}
	.tv-idle-label {
		font-family: 'DM Mono', monospace; font-size: 11px;
		letter-spacing: 0.15em; text-transform: uppercase; color: #ff5500;
		display: flex; align-items: center; gap: 8px;
	}
	.tv-idle-label::before { content: ''; width: 20px; height: 1px; background: #ff5500; }
	.tv-idle-questions {
		font-family: 'DM Mono', monospace; font-size: 13px;
		color: rgba(255,255,255,0.3); letter-spacing: 0.05em;
	}
	.tv-vamos-btn {
		margin-top: 12px;
		background: #ff5500; color: white; border: none; border-radius: 14px;
		font-family: 'Inter', sans-serif; font-size: 22px; font-weight: 800;
		padding: 20px 52px; cursor: pointer; letter-spacing: 0.04em;
		display: flex; align-items: center; gap: 12px;
		box-shadow: 0 0 32px rgba(255,85,0,0.3);
		transition: all 0.2s;
	}
	.tv-vamos-btn:hover { background: #cc4400; transform: translateY(-2px); }
	.tv-vamos-icon { font-size: 16px; }
	.tv-waiting-text {
		display: flex; align-items: center; gap: 10px;
		font-size: 14px; color: rgba(255,255,255,0.35); font-style: italic;
	}
	.tv-waiting-dots { display: flex; gap: 4px; }
	.tv-waiting-dots span {
		width: 6px; height: 6px; border-radius: 50%; background: rgba(255,255,255,0.2);
		animation: dotBlink 1.4s ease-in-out infinite;
	}
	.tv-waiting-dots span:nth-child(2) { animation-delay: 0.2s; }
	.tv-waiting-dots span:nth-child(3) { animation-delay: 0.4s; }
	@keyframes dotBlink { 0%,80%,100%{opacity:0.2} 40%{opacity:1} }

	/* ── GAME ── */
	.tv-game { display: flex; flex-direction: column; gap: 20px; animation: fadeSlide 0.25s ease; }
	@keyframes fadeSlide { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:none} }

	/* Timer */
	.tv-timer-wrap { position: relative; width: 96px; height: 96px; margin: 0 auto; }
	.tv-timer-svg { width: 100%; height: 100%; transform: rotate(-90deg); }
	.tv-timer-track { fill: none; stroke: rgba(255,255,255,0.06); stroke-width: 6; }
	.tv-timer-arc {
		fill: none; stroke: #ff5500; stroke-width: 6; stroke-linecap: round;
		transition: stroke-dashoffset 0.9s linear, stroke 0.3s;
	}
	.tv-timer-arc.tv-timer-urgent { stroke: #ff4444; }
	.tv-timer-num {
		position: absolute; inset: 0;
		display: flex; align-items: center; justify-content: center;
		font-family: 'Inter', sans-serif; font-weight: 800; font-size: 26px; color: #ff5500;
		transition: color 0.3s;
	}
	.tv-timer-num.tv-timer-urgent { color: #ff4444; }

	/* Pregunta */
	.tv-question-box {
		background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.09);
		border-radius: 14px; padding: 24px 28px;
	}
	.tv-question-num {
		font-family: 'DM Mono', monospace; font-size: 10px;
		color: #ff5500; letter-spacing: 0.14em; text-transform: uppercase; margin-bottom: 12px;
	}
	.tv-question-text {
		font-family: 'Inter', sans-serif; font-size: 20px; font-weight: 700;
		color: #f0ede8; line-height: 1.45; letter-spacing: -0.01em;
	}

	/* Opciones */
	.tv-options { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
	.tv-option {
		background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.09);
		border-radius: 12px; padding: 16px 18px;
		display: flex; align-items: center; gap: 12px;
		cursor: pointer; transition: all 0.18s; text-align: left; color: #f0ede8;
	}
	.tv-option:hover:not(:disabled) {
		border-color: rgba(255,85,0,0.45); background: rgba(255,85,0,0.06);
	}
	.tv-option:disabled { cursor: default; }
	.tv-opt-letter {
		width: 28px; height: 28px; border-radius: 7px; flex-shrink: 0;
		display: flex; align-items: center; justify-content: center;
		background: rgba(255,255,255,0.07);
		font-family: 'DM Mono', monospace; font-size: 12px; font-weight: 500;
		color: rgba(255,255,255,0.4); transition: all 0.18s;
	}
	.tv-opt-text { font-size: 14px; font-weight: 500; line-height: 1.4; flex: 1; }
	.tv-opt-badge { margin-left: auto; font-size: 15px; flex-shrink: 0; }
	.tv-option-selected { border-color: #ff5500; background: rgba(255,85,0,0.1); }
	.tv-option-selected .tv-opt-letter { background: #ff5500; color: white; }
	.tv-option-correct {
		border-color: #3ecf8e !important; background: rgba(62,207,142,0.1) !important;
		animation: correctPop 0.35s ease;
	}
	.tv-option-correct .tv-opt-letter { background: #3ecf8e; color: #0a0a0f; }
	@keyframes correctPop { 0%,100%{transform:scale(1)} 40%{transform:scale(1.02)} }
	.tv-option-wrong { border-color: #ff4444 !important; background: rgba(255,68,68,0.08) !important; }
	.tv-option-wrong .tv-opt-letter { background: #ff4444; color: white; }
	.tv-option-dim { opacity: 0.28; }

	/* ── DONE ── */
	.tv-done {
		display: flex; flex-direction: column; align-items: center;
		gap: 14px; text-align: center; padding: 8px 0;
		animation: fadeSlide 0.3s ease;
	}
	.tv-done-icon { font-size: 52px; line-height: 1; }
	.tv-done-score {
		font-family: 'Inter', sans-serif; font-weight: 800;
		font-size: 68px; color: #f0ede8; line-height: 1; letter-spacing: -0.04em;
	}
	.tv-done-score span { font-size: 26px; color: rgba(255,255,255,0.3); }
	.tv-done-label {
		font-family: 'DM Mono', monospace; font-size: 11px;
		letter-spacing: 0.12em; text-transform: uppercase; color: rgba(255,255,255,0.3);
	}
	.tv-done-pts {
		background: rgba(62,207,142,0.1); border: 1px solid rgba(62,207,142,0.25);
		border-radius: 10px; padding: 11px 22px;
		font-size: 14px; color: #3ecf8e; font-weight: 600;
	}
	.tv-done-pts-ensayo { background: rgba(245,194,0,0.08); border-color: rgba(245,194,0,0.2); color: #f5c200; }

	/* ── BREAKDOWN EXPANDIBLE ── */
	.tv-breakdown {
		width: 100%; max-width: 640px;
		border: 1px solid rgba(255,255,255,0.08); border-radius: 14px; overflow: hidden;
		text-align: left;
	}
	.tv-breakdown-title {
		font-family: 'DM Mono', monospace; font-size: 10px; letter-spacing: 0.12em;
		text-transform: uppercase; color: rgba(255,255,255,0.3);
		padding: 12px 16px; border-bottom: 1px solid rgba(255,255,255,0.06);
		background: rgba(255,255,255,0.02);
	}
	.tv-breakdown-item { border-bottom: 1px solid rgba(255,255,255,0.05); }
	.tv-breakdown-item:last-child { border-bottom: none; }
	.tv-breakdown-ok { background: rgba(62,207,142,0.03); }
	.tv-breakdown-fail { background: rgba(255,68,68,0.03); }

	/* Header del item: siempre visible */
	.tv-breakdown-header {
		width: 100%; display: grid;
		grid-template-columns: 26px 1fr 24px 20px;
		align-items: center; gap: 10px;
		padding: 12px 14px;
		background: none; border: none; cursor: pointer;
		color: #f0ede8; text-align: left; transition: background 0.15s;
	}
	.tv-breakdown-header:hover { background: rgba(255,255,255,0.03); }
	.tv-bdh-num {
		width: 22px; height: 22px; border-radius: 50%;
		display: flex; align-items: center; justify-content: center;
		font-family: 'DM Mono', monospace; font-size: 11px;
		background: rgba(255,255,255,0.07); color: rgba(255,255,255,0.4);
	}
	.tv-bdh-q { font-size: 13px; line-height: 1.4; color: rgba(255,255,255,0.75); }
	.tv-bdh-result { font-size: 15px; text-align: center; }
	.tv-bdh-arrow {
		font-size: 18px; color: rgba(255,255,255,0.25);
		transition: transform 0.2s;
		display: flex; align-items: center; justify-content: center;
	}
	.tv-bdh-arrow-open { transform: rotate(90deg); }

	/* Body expandido */
	.tv-breakdown-body {
		padding: 0 14px 14px 14px;
		display: flex; flex-direction: column; gap: 10px;
		animation: fadeSlide 0.2s ease;
	}
	.tv-bd-row {
		display: flex; flex-direction: column; gap: 3px;
	}
	.tv-bd-label {
		font-family: 'DM Mono', monospace; font-size: 10px;
		letter-spacing: 0.1em; text-transform: uppercase; color: rgba(255,255,255,0.3);
	}
	.tv-bd-val { font-size: 13px; color: rgba(255,255,255,0.65); line-height: 1.5; }
	.tv-bd-val-ok { color: #3ecf8e; }
	.tv-bd-val-fail { color: #ff6b6b; }
	.tv-bd-explanation {
		display: flex; gap: 10px; align-items: flex-start;
		background: rgba(255,85,0,0.06); border-left: 2px solid rgba(255,85,0,0.4);
		border-radius: 0 8px 8px 0; padding: 10px 12px;
	}
	.tv-bd-explanation-icon { font-size: 14px; flex-shrink: 0; margin-top: 1px; }
	.tv-bd-explanation p { font-size: 13px; color: rgba(255,255,255,0.6); line-height: 1.55; margin: 0; }

	/* Botón impugnar */
	.tv-impugnar-btn {
		background: none; border: 1px solid rgba(255,68,68,0.35); color: #ff6b6b;
		border-radius: 8px; padding: 9px 14px; cursor: pointer;
		font-family: 'Instrument Sans', sans-serif; font-size: 12px; font-weight: 600;
		transition: all 0.2s; align-self: flex-start;
	}
	.tv-impugnar-btn:hover:not(:disabled) {
		background: rgba(255,68,68,0.1); border-color: #ff4444;
	}
	.tv-impugnar-btn:disabled { opacity: 0.5; cursor: default; }
	.tv-impugnar-done {
		font-family: 'DM Mono', monospace; font-size: 11px;
		color: #f5c200; letter-spacing: 0.06em;
	}

	/* ── ESTADOS VACÍOS ── */
	.trivia-center {
		flex: 1; display: flex; flex-direction: column;
		align-items: center; justify-content: center;
		gap: 14px; text-align: center; padding: 48px 24px;
	}
	.tv-error-icon { font-size: 36px; }
	.tv-heading {
		font-family: 'Inter', sans-serif; font-weight: 800; font-size: 20px; color: #f0ede8;
	}
	.tv-muted { font-size: 13px; color: rgba(255,255,255,0.3); line-height: 1.6; }
	.tv-muted code {
		background: rgba(255,255,255,0.07); padding: 2px 6px; border-radius: 4px;
		font-family: 'DM Mono', monospace; font-size: 12px; color: #ff5500;
	}
	.tv-waiting-avatar { margin-bottom: 6px; }
	.tv-avatar-img { width: 80px; height: 80px; border-radius: 50%; object-fit: cover; border: 3px solid rgba(255,85,0,0.4); }
	.tv-avatar-placeholder {
		width: 80px; height: 80px; border-radius: 50%;
		background: rgba(255,85,0,0.12); border: 3px solid rgba(255,85,0,0.4);
		display: flex; align-items: center; justify-content: center;
		font-size: 32px; font-weight: 700; color: #ff5500;
	}
	.tv-player-name {
		font-family: 'Inter', sans-serif; font-weight: 800; font-size: 24px; color: #f0ede8;
	}
	.tv-waiting-pulse { font-size: 36px; animation: waitPulse 2s ease-in-out infinite; }
	@keyframes waitPulse { 0%,100%{opacity:0.4} 50%{opacity:1} }
	.tv-spinner {
		width: 36px; height: 36px; border-radius: 50%;
		border: 3px solid rgba(255,255,255,0.08); border-top-color: #ff5500;
		animation: spin 0.8s linear infinite;
	}
	@keyframes spin { to { transform: rotate(360deg); } }
	.tv-back-link { color: rgba(255,255,255,0.3); font-size: 13px; text-decoration: none; margin-top: 6px; }
	.tv-back-link:hover { color: #ff5500; }

	/* ── RESPONSIVE ── */
	@media (max-width: 600px) {
		.tv-main { padding: 18px 14px 36px; gap: 18px; }
		.tv-question-text { font-size: 16px; }
		.tv-options { grid-template-columns: 1fr; }
		.tv-done-score { font-size: 52px; }
		.tv-step { width: 34px; height: 34px; font-size: 11px; }
		.tv-step-connector { max-width: 28px; }
		.tv-vamos-btn { font-size: 18px; padding: 16px 40px; }
	}
</style>
