<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { page } from '$app/stores';
	import { supabase } from '$lib/supabase';
	import { login, getSession, refreshSession, type MundialUser } from '$lib/mundial/auth';
	import { formatDateAR, flag, pad, sleep } from '$lib/mundial/utils';

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
		predictions_open: boolean;
	}

	interface Prediction {
		id: string;
		match_id: string;
		predicted_winner: string;
		predicted_home: number | null;
		predicted_away: number | null;
		has_exact_score: boolean;
		is_correct: boolean | null;
		exact_score_correct: boolean | null;
		exact_score_wrong: boolean | null;
		points_earned: number | null;
		matches?: Match;
	}

	interface TriviaSession {
		id: string;
		phase: string;
		level_chosen: number;
		question_ids: string[];
		answers: AnswerRecord[];
		score: number;
		points_earned: number;
		status: string;
		enabled_by_admin: boolean;
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
	}

	interface AnswerRecord {
		question_id: string;
		selected: string;
		correct: boolean;
		time_taken_ms: number;
	}

	interface PozoAttempt {
		id: string;
		points_bet: number;
		status: string;
		score: number | null;
		points_received: number | null;
	}

	// ─── ESTADO ───────────────────────────────────────────────────
	let username = $page.params.username;

	// Auth
	let user: MundialUser | null = null;
	let loginUsername = username || '';
	let loginCode = '';
	let loginError = '';
	let loginLoading = false;

	// Config / modo
	let isRehearsalMode = true;
	let currentWeek = 1;
	let pozoStatus = 'closed';

	// Datos
	let openMatches: Match[] = [];
	let myPredictions: Prediction[] = [];
	let triviaSession: TriviaSession | null = null;
	let pozoAttempt: PozoAttempt | null = null;
	let pozoTotal = 0;

	// UI
	let loading = true;
	let section: 'login' | 'main' = 'login';

	// Trivia state
	let triviaPhase: 'idle' | 'countdown' | 'question' | 'reveal' | 'done' = 'idle';
	let triviaQuestions: TriviaQuestion[] = [];
	let triviaCurrentIdx = 0;
	let triviaSelected: string | null = null;
	let triviaTimer = 20;
	let triviaTimerInterval: ReturnType<typeof setInterval> | null = null;
	let triviaCorrectCount = 0;
	let triviaStartTime = 0;

	// Avatar upload
	let avatarUploading = false;
	let avatarInput: HTMLInputElement;

	// Prediction form state
	let predictionForms: Record<string, { winner: string; home: string; away: string; submitting: boolean; submitted: boolean }> = {};

	// Realtime subscriptions
	let realtimeChannels: ReturnType<typeof supabase.channel>[] = [];

	// ─── MOUNT ────────────────────────────────────────────────────
	onMount(async () => {
		const session = getSession();
		if (session) {
			user = await refreshSession();
			if (user) {
				if (user.is_admin) { window.location.href = '/mundial/arbitro'; return; }
				section = 'main';
				await loadData();
			}
		}
		loading = false;
	});

	onDestroy(() => {
		realtimeChannels.forEach((ch) => supabase.removeChannel(ch));
		if (triviaTimerInterval) clearInterval(triviaTimerInterval);
	});

	// ─── AUTH ─────────────────────────────────────────────────────
	async function handleLogin() {
		loginLoading = true;
		loginError = '';
		const result = await login(loginUsername, loginCode);
		if (result.success && result.user) {
			user = result.user;
			if (user.is_admin) { window.location.href = '/mundial/arbitro'; return; }
			section = 'main';
			await loadData();
		} else {
			loginError = result.error || 'Error de autenticación';
		}
		loginLoading = false;
	}

	// ─── CARGA DE DATOS ───────────────────────────────────────────
	async function loadData() {
		if (!user) return;

		// Config
		const { data: configRows } = await supabase.from('config').select('key, value');
		if (configRows) {
			const cfg = Object.fromEntries(configRows.map((r: { key: string; value: string }) => [r.key, r.value]));
			isRehearsalMode = cfg.is_rehearsal_mode === 'true';
			currentWeek = parseInt(cfg.current_week ?? '1');
			pozoStatus = cfg.pozo_status ?? 'closed';
		}

		// Pozo total
		const { data: pozoLog } = await supabase.from('pozo_log').select('amount');
		if (pozoLog) {
			pozoTotal = pozoLog.reduce((sum: number, r: { amount: number }) => sum + r.amount, 0);
		}

		// Partidos de la semana actual con pronósticos abiertos
		const { data: matches } = await supabase
			.from('matches')
			.select('*')
			.eq('week_number', currentWeek)
			.eq('predictions_open', true)
			.neq('status', 'finished')
			.order('kickoff_time');
		openMatches = (matches ?? []) as Match[];

		// Inicializar formularios de pronóstico
		openMatches.forEach((m) => {
			if (!predictionForms[m.id]) {
				predictionForms[m.id] = { winner: '', home: '', away: '', submitting: false, submitted: false };
			}
		});

		// Mis pronósticos ya enviados
		const { data: preds } = await supabase
			.from('predictions')
			.select('*, matches(*)')
			.eq('user_id', user!.id)
			.order('created_at', { ascending: false });
		myPredictions = (preds ?? []) as Prediction[];

		// Marcar formularios que ya tienen pronóstico enviado
		myPredictions.forEach((p) => {
			if (predictionForms[p.match_id]) {
				predictionForms[p.match_id].submitted = true;
			}
		});

		// Sesión de trivia activa
		const { data: ts } = await supabase
			.from('trivia_sessions')
			.select('*')
			.eq('user_id', user!.id)
			.in('status', ['ready', 'in_progress'])
			.maybeSingle();
		triviaSession = ts as TriviaSession | null;

		// Intento de pozo
		const { data: pa } = await supabase
			.from('pozo_attempts')
			.select('*')
			.eq('user_id', user!.id)
			.maybeSingle();
		pozoAttempt = pa as PozoAttempt | null;

		// Suscripciones Realtime
		setupRealtime();
	}

	function setupRealtime() {
		if (!user) return;

		// Escuchar cambios en la sesión de trivia del jugador
		const triviaChannel = supabase
			.channel(`trivia-${user.id}`)
			.on(
				'postgres_changes',
				{ event: '*', schema: 'public', table: 'trivia_sessions', filter: `user_id=eq.${user!.id}` },
				(payload) => {
					triviaSession = payload.new as TriviaSession;
				}
			)
			.subscribe();

		// Escuchar cambios en el usuario (puntos, ranking)
		const userChannel = supabase
			.channel(`user-${user.id}`)
			.on(
				'postgres_changes',
				{ event: 'UPDATE', schema: 'public', table: 'users', filter: `id=eq.${user!.id}` },
				(payload) => {
					if (user) {
						user = { ...user, ...payload.new as Partial<MundialUser> };
						localStorage.setItem('mundial_user', JSON.stringify(user));
					}
				}
			)
			.subscribe();

		realtimeChannels = [triviaChannel, userChannel];
	}

	// ─── PRONÓSTICOS ─────────────────────────────────────────────
	function getForm(matchId: string) {
		return predictionForms[matchId] ?? { winner: '', home: '', away: '', submitting: false, submitted: false };
	}

	function selectWinner(matchId: string, winner: string) {
		if (!predictionForms[matchId]) return;
		predictionForms[matchId] = { ...predictionForms[matchId], winner };
		predictionForms = { ...predictionForms };
	}

	async function submitPrediction(match: Match) {
		const form = predictionForms[match.id];
		if (!form || !form.winner || !user) return;

		// Validar coherencia del marcador
		if (form.home !== '' && form.away !== '') {
			const h = parseInt(form.home);
			const a = parseInt(form.away);
			if (!isNaN(h) && !isNaN(a)) {
				if (form.winner === 'home' && h <= a) {
					alert('El marcador no es coherente con el ganador elegido');
					return;
				}
				if (form.winner === 'away' && a <= h) {
					alert('El marcador no es coherente con el ganador elegido');
					return;
				}
				if (form.winner === 'draw' && h !== a) {
					alert('Para empate, ambos marcadores deben ser iguales');
					return;
				}
			}
		}

		predictionForms[match.id].submitting = true;
		predictionForms = { ...predictionForms };

		const hasScore = form.home !== '' && form.away !== '';
		const payload = {
			user_id: user.id,
			match_id: match.id,
			predicted_winner: form.winner,
			predicted_home: hasScore ? parseInt(form.home) : null,
			predicted_away: hasScore ? parseInt(form.away) : null,
			has_exact_score: hasScore,
			is_rehearsal: isRehearsalMode
		};

		const { error } = await supabase.from('predictions').upsert(payload, { onConflict: 'user_id,match_id' });

		if (error) {
			alert('Error al guardar el pronóstico: ' + error.message);
			predictionForms[match.id].submitting = false;
		} else {
			predictionForms[match.id].submitted = true;
			predictionForms[match.id].submitting = false;
			// Recargar pronósticos enviados
			const { data: preds } = await supabase
				.from('predictions')
				.select('*, matches(*)')
				.eq('user_id', user!.id)
				.order('created_at', { ascending: false });
			myPredictions = (preds ?? []) as Prediction[];
		}
		predictionForms = { ...predictionForms };
	}

	// ─── TRIVIA ──────────────────────────────────────────────────
	async function startTrivia() {
		if (!triviaSession || !user) return;

		// Actualizar sesión a in_progress
		await supabase
			.from('trivia_sessions')
			.update({ status: 'in_progress', started_at: new Date().toISOString() })
			.eq('id', triviaSession.id);

		// Cargar preguntas
		const { data: qData } = await supabase
			.from('trivia_questions')
			.select('*')
			.in('id', triviaSession.question_ids);

		if (!qData || qData.length === 0) return;

		// Ordenar según question_ids del session
		triviaQuestions = triviaSession.question_ids
			.map((qid) => qData.find((q) => q.id === qid))
			.filter(Boolean) as TriviaQuestion[];

		triviaCurrentIdx = triviaSession.answers?.length ?? 0;
		triviaCorrectCount = triviaSession.answers?.filter((a) => a.correct).length ?? 0;
		triviaPhase = 'question';
		startTriviaTimer();
	}

	function startTriviaTimer() {
		triviaTimer = 20;
		triviaSelected = null;
		triviaStartTime = Date.now();
		if (triviaTimerInterval) clearInterval(triviaTimerInterval);
		triviaTimerInterval = setInterval(() => {
			triviaTimer--;
			if (triviaTimer <= 0) {
				clearInterval(triviaTimerInterval!);
				// Tiempo agotado — se cuenta como incorrecta
				handleTriviaAnswer(null);
			}
		}, 1000);
	}

	async function handleTriviaAnswer(selected: string | null) {
		if (!triviaSession || !triviaQuestions[triviaCurrentIdx]) return;
		if (triviaTimerInterval) clearInterval(triviaTimerInterval);

		const q = triviaQuestions[triviaCurrentIdx];
		const timeTaken = Date.now() - triviaStartTime;
		const isCorrect = selected !== null && selected === q.correct_answer;

		triviaSelected = selected;
		triviaPhase = 'reveal';

		if (isCorrect) triviaCorrectCount++;

		const answerRecord: AnswerRecord = {
			question_id: q.id,
			selected: selected ?? 'timeout',
			correct: isCorrect,
			time_taken_ms: timeTaken
		};

		// Guardar respuesta en Supabase (append al jsonb)
		const currentAnswers: AnswerRecord[] = triviaSession.answers ?? [];
		const newAnswers = [...currentAnswers, answerRecord];

		await supabase
			.from('trivia_sessions')
			.update({ answers: newAnswers })
			.eq('id', triviaSession.id);

		triviaSession = { ...triviaSession, answers: newAnswers };

		await sleep(2000);

		// Siguiente pregunta o fin
		if (triviaCurrentIdx + 1 >= triviaQuestions.length) {
			// Última pregunta: cerrar sesión
			await closeTriviaSession();
		} else {
			triviaCurrentIdx++;
			triviaPhase = 'question';
			startTriviaTimer();
		}
	}

	async function closeTriviaSession() {
		if (!triviaSession || !user) return;

		const POINTS: Record<number, number> = { 1: 5, 2: 10, 3: 20 };
		const penaltyConfig = await supabase
			.from('config')
			.select('value')
			.eq('key', 'trivia_penalty_points')
			.single();
		const penalty = parseInt(penaltyConfig.data?.value ?? '2');

		let points = 0;
		for (const answer of triviaSession.answers) {
			if (answer.correct) points += POINTS[triviaSession.level_chosen];
			else points -= penalty;
		}
		points = Math.max(0, points);

		await supabase
			.from('trivia_sessions')
			.update({ status: 'completed', completed_at: new Date().toISOString(), points_earned: points, score: triviaCorrectCount })
			.eq('id', triviaSession.id);

		// Si no es ensayo, acreditar puntos
		if (!isRehearsalMode && user) {
			const newTotal = (user.points_total ?? 0) + points;
			await supabase.from('users').update({ points_total: newTotal }).eq('id', user.id);
			user = { ...user, points_total: newTotal };
			localStorage.setItem('mundial_user', JSON.stringify(user));
		}

		triviaSession = { ...triviaSession, status: 'completed', points_earned: points, score: triviaCorrectCount };
		triviaPhase = 'done';
	}

	// ─── AVATAR ───────────────────────────────────────────────────
	async function handleAvatarUpload(e: Event) {
		const input = e.target as HTMLInputElement;
		const file = input.files?.[0];
		if (!file || !user) return;

		if (file.size > 2 * 1024 * 1024) {
			alert('El archivo es muy grande (máximo 2MB)');
			return;
		}
		if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
			alert('Solo se admiten JPG, PNG o WEBP');
			return;
		}

		avatarUploading = true;
		const ext = file.name.split('.').pop();
		const path = `${user.id}.${ext}`;

		const { error: uploadError } = await supabase.storage.from('avatars').upload(path, file, { upsert: true });

		if (uploadError) {
			alert('Error al subir la foto: ' + uploadError.message);
			avatarUploading = false;
			return;
		}

		const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(path);
		const avatar_url = urlData.publicUrl + '?t=' + Date.now();

		await supabase.from('users').update({ avatar_url }).eq('id', user.id);
		user = { ...user, avatar_url };
		localStorage.setItem('mundial_user', JSON.stringify(user));
		avatarUploading = false;
	}

	// ─── POZO ────────────────────────────────────────────────────
	async function signalPozoInterest() {
		if (!user) return;
		// Crear un registro en pozo_attempts con status 'pending_interest' (señal al admin)
		// Como no existe este status en la spec, insertamos el registro solo si no existe
		const { error } = await supabase.from('pozo_attempts').upsert(
			{ user_id: user.id, points_bet: user.points_total, status: 'enabled' },
			{ onConflict: 'user_id' }
		);
		if (!error) {
			alert('✅ Le avisamos al admin que querés intentar el Pozo. Esperá que te habilite.');
		}
	}

	// ─── HELPERS UI ───────────────────────────────────────────────
	function matchHasPrediction(matchId: string): boolean {
		return myPredictions.some((p) => p.match_id === matchId);
	}

	function getPredictionForMatch(matchId: string): Prediction | undefined {
		return myPredictions.find((p) => p.match_id === matchId);
	}

	function winnerLabel(w: string, match: Match): string {
		if (w === 'home') return match.team_home;
		if (w === 'away') return match.team_away;
		return 'Empate';
	}

	function phaseLabel(phase: string): string {
		const map: Record<string, string> = {
			groups: 'Grupos', r32: '32avos', r16: 'Octavos',
			qf: 'Cuartos', sf: 'Semis', '3rd': '3er Puesto', final: 'Final'
		};
		return map[phase] ?? phase;
	}

	function pointsColor(pts: number | null): string {
		if (pts === null) return '';
		if (pts > 0) return 'color: var(--green);';
		if (pts < 0) return 'color: var(--red);';
		return 'color: var(--muted);';
	}

	$: openMatchesWithoutPrediction = openMatches.filter((m) => !matchHasPrediction(m.id));
	$: sentPredictionsForCurrentWeek = myPredictions.filter((p) => p.matches?.week_number === currentWeek || !p.matches?.week_number);
</script>

<svelte:head>
	<title>Prode Cíclico — {username}</title>
	<meta name="description" content="Panel de jugador para el Prode Cíclico del Mundial 2026" />
</svelte:head>

<!-- ═══ LOGIN ═══ -->
{#if loading}
	<div class="prode-loading">
		<div class="prode-spinner"></div>
		<p>Cargando...</p>
	</div>

{:else if section === 'login'}
	<div class="prode-login-wrap">
		<div class="prode-login-card">
			<div class="prode-login-logo">
				<img src="/Logos-CICLICO-Mundial.png" alt="Cíclico" />
			</div>
			<div class="prode-eyebrow">PRODE CÍCLICO · MUNDIAL 2026</div>
			<h1 class="prode-login-title">Ingresá al prode</h1>
			<p class="prode-login-sub">Usá el código que te dio la producción</p>

			<form class="prode-login-form" on:submit|preventDefault={handleLogin}>
				<div class="prode-field">
					<label for="login-user">Usuario</label>
					<input
						id="login-user"
						type="text"
						bind:value={loginUsername}
						placeholder="ej: mfeudale"
						autocomplete="username"
						autocapitalize="none"
						required
					/>
				</div>
				<div class="prode-field">
					<label for="login-code">Código de acceso</label>
					<input
						id="login-code"
						type="text"
						bind:value={loginCode}
						placeholder="ej: DZHEDZTV"
						autocomplete="off"
						autocapitalize="characters"
						required
					/>
				</div>
				{#if loginError}
					<div class="prode-error">{loginError}</div>
				{/if}
				<button type="submit" class="prode-btn-primary" disabled={loginLoading}>
					{loginLoading ? 'Verificando...' : 'Entrar →'}
				</button>
			</form>
		</div>
	</div>

<!-- ═══ MAIN PANEL ═══ -->
{:else if section === 'main' && user}

	<!-- Badge modo ensayo -->
	{#if isRehearsalMode}
		<div class="prode-rehearsal-banner">
			⚠️ MODO ENSAYO — Los puntos no cuentan. Estás probando el sistema.
		</div>
	{/if}

	<div class="prode-wrap">

		<!-- ── HEADER PERSONAL ── -->
		<header class="prode-header card">
			<div class="prode-avatar-wrap">
				{#if user.avatar_url}
					<img src={user.avatar_url} alt={user.full_name} class="prode-avatar" />
				{:else}
					<div class="prode-avatar-placeholder">
						{user.full_name.charAt(0).toUpperCase()}
					</div>
				{/if}
				<button
					class="prode-avatar-change"
					on:click={() => avatarInput.click()}
					title="Cambiar foto"
					disabled={avatarUploading}
					aria-label="Cambiar foto de perfil"
				>
					{avatarUploading ? '⏳' : '📷'}
				</button>
				<input
					bind:this={avatarInput}
					type="file"
					accept="image/jpeg,image/png,image/webp"
					style="display:none"
					on:change={handleAvatarUpload}
				/>
			</div>

			<div class="prode-header-info">
				<div class="prode-welcome">¡Hola,</div>
				<div class="prode-playername">{user.full_name}!</div>
				{#if isRehearsalMode}
					<span class="prode-badge-ensayo">ENSAYO</span>
				{/if}
			</div>

			<div class="prode-header-stats">
				<div class="prode-stat">
					<div class="prode-stat-value">{user.points_total ?? 0}</div>
					<div class="prode-stat-label">puntos</div>
				</div>
				{#if user.ranking_position}
					<div class="prode-stat-divider"></div>
					<div class="prode-stat">
						<div class="prode-stat-value">#{user.ranking_position}</div>
						<div class="prode-stat-label">ranking</div>
					</div>
				{/if}
			</div>
		</header>

		<!-- ── TRIVIA ACTIVA ── -->
		{#if triviaSession && (triviaSession.status === 'ready' || triviaSession.status === 'in_progress')}
			<section class="prode-section prode-trivia-section">
				<div class="section-hero-label">Trivia habilitada</div>

				{#if triviaPhase === 'idle'}
					<!-- Botón de arranque -->
					<div class="prode-trivia-ready card">
						<div class="prode-trivia-icon">🎯</div>
						<h2 class="prode-trivia-ready-title">¡Tu trivia está lista!</h2>
						<p class="prode-trivia-ready-desc">
							{triviaQuestions.length > 0 ? triviaQuestions.length : 5} preguntas · Nivel
							{triviaSession.level_chosen === 1 ? 'Fácil' : triviaSession.level_chosen === 2 ? 'Intermedio' : 'Difícil'}
							· 20 segundos por pregunta
						</p>
						<button class="prode-btn-vamos" on:click={startTrivia}>
							¡VAMOS!
						</button>
					</div>

				{:else if triviaPhase === 'question' || triviaPhase === 'reveal'}
					<!-- Pregunta en curso -->
					{@const q = triviaQuestions[triviaCurrentIdx]}
					<div class="prode-trivia-game">
						<div class="prode-trivia-meta">
							<span class="prode-trivia-progress">{triviaCurrentIdx + 1} / {triviaQuestions.length}</span>
							<div class="prode-trivia-timer-ring" style="--progress: {(triviaTimer / 20) * 283}px">
								<svg viewBox="0 0 100 100" class="prode-timer-svg">
									<circle cx="50" cy="50" r="45" class="timer-bg" />
									<circle
										cx="50" cy="50" r="45"
										class="timer-fill"
										class:timer-urgent={triviaTimer <= 5}
										style="stroke-dashoffset: {283 - (triviaTimer / 20) * 283}px"
									/>
								</svg>
								<span class="prode-timer-num" class:timer-urgent={triviaTimer <= 5}>{triviaTimer}</span>
							</div>
							<span class="prode-trivia-score">✅ {triviaCorrectCount}</span>
						</div>

						<div class="prode-trivia-question card">
							<p class="prode-q-text">{q.question_text}</p>
						</div>

						<div class="prode-trivia-options">
							{#each ['a', 'b', 'c', 'd'] as opt}
								{@const label = q[`option_${opt}` as keyof TriviaQuestion] as string}
								{@const isSelected = triviaSelected === opt}
								{@const isCorrect = opt === q.correct_answer}
								{@const isWrong = triviaPhase === 'reveal' && isSelected && !isCorrect}
								{@const showCorrect = triviaPhase === 'reveal' && isCorrect}
								<button
									class="prode-option"
									class:prode-option-selected={isSelected && triviaPhase === 'question'}
									class:prode-option-correct={showCorrect}
									class:prode-option-wrong={isWrong}
									disabled={triviaPhase === 'reveal'}
									on:click={() => triviaPhase === 'question' && handleTriviaAnswer(opt)}
								>
									<span class="prode-opt-letter">{opt.toUpperCase()}</span>
									<span class="prode-opt-text">{label}</span>
									{#if showCorrect}<span class="prode-opt-icon">✅</span>{/if}
									{#if isWrong}<span class="prode-opt-icon">❌</span>{/if}
								</button>
							{/each}
						</div>
					</div>

				{:else if triviaPhase === 'done'}
					<!-- Resultado final -->
					{@const pts = triviaSession.points_earned ?? 0}
					<div class="prode-trivia-done card">
						<div class="prode-trivia-done-icon">{triviaCorrectCount >= 4 ? '🏆' : triviaCorrectCount >= 2 ? '👍' : '💪'}</div>
						<h2 class="prode-trivia-done-title">¡Trivia completada!</h2>
						<div class="prode-trivia-done-score">
							{triviaCorrectCount} / {triviaQuestions.length} correctas
						</div>
						{#if isRehearsalMode}
							<div class="prode-trivia-done-pts">
								En modo real habrías ganado <strong>{pts} puntos</strong>
							</div>
						{:else}
							<div class="prode-trivia-done-pts">
								+{pts} puntos acreditados 🎉
							</div>
						{/if}
					</div>
				{/if}
			</section>
		{/if}

		<!-- ── PRONÓSTICOS ABIERTOS ── -->
		{#if openMatchesWithoutPrediction.length > 0}
			<section class="prode-section">
				<div class="section-hero-label">Cargá tus pronósticos</div>
				<h2 class="section-title">Partidos abiertos</h2>
				<p class="section-subtitle">Una vez confirmado no podés cambiarlo</p>

				<div class="prode-matches-list">
					{#each openMatchesWithoutPrediction as match}
						{@const form = getForm(match.id)}
						<div class="prode-match-card card">
							<div class="prode-match-head">
								<span class="prode-phase-badge">{phaseLabel(match.phase)}{match.group_name ? ` · Grupo ${match.group_name}` : ''}</span>
								<span class="prode-match-time">{formatDateAR(match.kickoff_time)}</span>
							</div>

							<div class="prode-match-teams">
								<div class="prode-team">
									<span class="prode-team-flag">{flag(match.team_home)}</span>
									<span class="prode-team-name">{match.team_home}</span>
								</div>
								<div class="prode-match-vs">VS</div>
								<div class="prode-team prode-team-right">
									<span class="prode-team-name">{match.team_away}</span>
									<span class="prode-team-flag">{flag(match.team_away)}</span>
								</div>
							</div>

							{#if form.submitted}
								<!-- Ya enviado -->
								{@const pred = getPredictionForMatch(match.id)}
								<div class="prode-submitted-badge">
									✅ Pronóstico enviado: <strong>{pred ? winnerLabel(pred.predicted_winner, match) : ''}</strong>
									{#if pred?.has_exact_score}
										· {pred.predicted_home} - {pred.predicted_away}
									{/if}
								</div>
							{:else}
								<!-- Formulario de pronóstico -->
								<div class="prode-winner-selector">
									<button
										class="prode-winner-btn"
										class:selected={form.winner === 'home'}
										on:click={() => selectWinner(match.id, 'home')}
									>
										{flag(match.team_home)} {match.team_home}
									</button>
									{#if match.phase === 'groups'}
										<button
											class="prode-winner-btn prode-draw-btn"
											class:selected={form.winner === 'draw'}
											on:click={() => selectWinner(match.id, 'draw')}
										>
											Empate
										</button>
									{/if}
									<button
										class="prode-winner-btn"
										class:selected={form.winner === 'away'}
										on:click={() => selectWinner(match.id, 'away')}
									>
										{flag(match.team_away)} {match.team_away}
									</button>
								</div>

								<!-- Marcador exacto (opcional) -->
								{#if form.winner}
									<div class="prode-score-optional">
										<span class="prode-score-label">Marcador exacto (opcional — da bonus)</span>
										<div class="prode-score-inputs">
											<div class="prode-score-team-wrap">
												<span class="prode-score-team-name">{match.team_home}</span>
												<input
													type="number"
													min="0"
													max="20"
													class="prode-score-input"
													placeholder="—"
													bind:value={predictionForms[match.id].home}
												/>
											</div>
											<span class="prode-score-sep">-</span>
											<div class="prode-score-team-wrap">
												<input
													type="number"
													min="0"
													max="20"
													class="prode-score-input"
													placeholder="—"
													bind:value={predictionForms[match.id].away}
												/>
												<span class="prode-score-team-name">{match.team_away}</span>
											</div>
										</div>
									</div>

									<button
										class="prode-btn-primary"
										disabled={form.submitting}
										on:click={() => submitPrediction(match)}
									>
										{form.submitting ? 'Guardando...' : '✔ Confirmar pronóstico'}
									</button>
								{/if}
							{/if}
						</div>
					{/each}
				</div>
			</section>
		{/if}

		<!-- ── PRONÓSTICOS ENVIADOS ── -->
		{#if sentPredictionsForCurrentWeek.length > 0}
			<section class="prode-section">
				<div class="section-hero-label">Historial</div>
				<h2 class="section-title">Mis pronósticos</h2>

				<div class="prode-sent-list">
					{#each sentPredictionsForCurrentWeek as pred}
						{@const match = pred.matches}
						<div class="prode-sent-card card">
							<div class="prode-sent-teams">
								{#if match}
									<span>{flag(match.team_home)} {match.team_home}</span>
									<span class="prode-sent-vs">vs</span>
									<span>{match.team_away} {flag(match.team_away)}</span>
								{/if}
							</div>

							<div class="prode-sent-pick">
								Mi pick: <strong>{match ? winnerLabel(pred.predicted_winner, match) : pred.predicted_winner}</strong>
								{#if pred.has_exact_score}
									<span class="prode-sent-score">· {pred.predicted_home}-{pred.predicted_away}</span>
								{/if}
							</div>

							{#if match?.status === 'finished' && match.result_home !== null}
								<div class="prode-sent-result">
									<span class="prode-sent-result-score">{match.result_home} - {match.result_away}</span>
									<span class="prode-sent-result-icon">
										{pred.is_correct ? '✅' : '❌'}
										{pred.exact_score_correct ? '✅ exacto' : pred.exact_score_wrong ? '❌ exacto' : ''}
									</span>
									{#if pred.points_earned !== null}
										<span class="prode-sent-pts" style={pointsColor(pred.points_earned)}>
											{pred.points_earned > 0 ? '+' : ''}{pred.points_earned} pts
										</span>
									{/if}
								</div>
							{:else if match?.status === 'live'}
								<div class="prode-sent-live">🔴 En vivo</div>
							{:else}
								<div class="prode-sent-pending">⏳ Pendiente</div>
							{/if}
						</div>
					{/each}
				</div>
			</section>
		{/if}

		<!-- ── POZO ── -->
		{#if pozoStatus !== 'closed'}
			<section class="prode-section">
				<div class="section-hero-label">El Pozo</div>
				<div class="prode-pozo-card card">
					<div class="prode-pozo-icon">💰</div>
					<div class="prode-pozo-total">{pozoTotal.toLocaleString('es-AR')}</div>
					<div class="prode-pozo-label">puntos en juego</div>

					{#if pozoStatus === 'revealed'}
						<div class="prode-pozo-revealed">🏆 El Pozo ya fue revelado</div>
					{:else if pozoAttempt?.status === 'won'}
						<div class="prode-pozo-won">🏆 ¡Ganaste el Pozo! +{pozoAttempt.points_received} puntos</div>
					{:else if pozoAttempt?.status === 'lost'}
						<div class="prode-pozo-lost">💸 Intentaste el Pozo pero no llegaste a 6/10</div>
					{:else if pozoAttempt?.status === 'in_progress'}
						<div class="prode-pozo-inprogress">⏳ Tu intento está en curso...</div>
					{:else if pozoAttempt?.status === 'enabled'}
						<div class="prode-pozo-enabled">
							<p>¡El admin te habilitó para jugar el Pozo!</p>
							<button class="prode-btn-pozo">JUGAR EL POZO 🎰</button>
						</div>
					{:else if (user?.ranking_position ?? 99) > 3}
						<div class="prode-pozo-interest">
							<p>Estás en el top y podés intentar el Pozo</p>
							<button class="prode-btn-secondary" on:click={signalPozoInterest}>
								Quiero intentar el Pozo
							</button>
						</div>
					{:else}
						<p class="prode-pozo-note">Solo pueden intentarlo los jugadores fuera del top 3</p>
					{/if}
				</div>
			</section>
		{/if}

		<!-- ── FOOTER ── -->
		<footer class="prode-footer">
			<button class="prode-logout" on:click={() => { localStorage.removeItem('mundial_user'); location.reload(); }}>
				Cerrar sesión
			</button>
			<span class="prode-footer-note">Prode Cíclico · Mundial 2026</span>
		</footer>
	</div>
{/if}

<style>
	/* ─── LOADING ─── */
	.prode-loading {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		min-height: 60vh;
		gap: 16px;
		color: var(--muted);
		font-family: 'DM Mono', monospace;
		font-size: 13px;
	}
	.prode-spinner {
		width: 36px;
		height: 36px;
		border: 3px solid var(--border);
		border-top-color: var(--celeste);
		border-radius: 50%;
		animation: spin 0.8s linear infinite;
	}
	@keyframes spin { to { transform: rotate(360deg); } }

	/* ─── LOGIN ─── */
	.prode-login-wrap {
		min-height: calc(100vh - 65px);
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 24px 16px;
	}
	.prode-login-card {
		background: rgba(255,255,255,0.7);
		backdrop-filter: blur(20px);
		-webkit-backdrop-filter: blur(20px);
		border: 1px solid rgba(255,255,255,0.85);
		border-radius: 24px;
		padding: 48px 40px;
		width: 100%;
		max-width: 420px;
		box-shadow: 0 8px 40px rgba(0,0,0,0.1), inset 0 1px 0 rgba(255,255,255,0.9);
		text-align: center;
	}
	.prode-login-logo img {
		height: 48px;
		margin: 0 auto 24px;
		display: block;
	}
	.prode-eyebrow {
		font-family: 'Inter', monospace;
		font-size: 10px;
		letter-spacing: 0.2em;
		text-transform: uppercase;
		color: var(--celeste);
		margin-bottom: 8px;
	}
	.prode-login-title {
		font-family: 'Inter', sans-serif;
		font-size: 28px;
		font-weight: 900;
		letter-spacing: -0.03em;
		color: var(--text);
		margin-bottom: 6px;
	}
	.prode-login-sub {
		font-size: 14px;
		color: var(--muted);
		margin-bottom: 32px;
	}
	.prode-login-form {
		display: flex;
		flex-direction: column;
		gap: 16px;
		text-align: left;
	}
	.prode-field {
		display: flex;
		flex-direction: column;
		gap: 6px;
	}
	.prode-field label {
		font-family: 'Inter', monospace;
		font-size: 11px;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: var(--muted);
		font-weight: 600;
	}
	.prode-field input {
		font-family: 'Instrument Sans', sans-serif;
		font-size: 16px;
		padding: 12px 16px;
		border: 1px solid var(--border);
		border-radius: 10px;
		background: rgba(255,255,255,0.8);
		color: var(--text);
		outline: none;
		transition: border-color 0.2s, box-shadow 0.2s;
		width: 100%;
	}
	.prode-field input:focus {
		border-color: var(--celeste);
		box-shadow: 0 0 0 3px rgba(91,155,213,0.15);
	}
	.prode-error {
		background: rgba(217,48,37,0.08);
		border: 1px solid rgba(217,48,37,0.3);
		border-radius: 8px;
		padding: 10px 14px;
		font-size: 13px;
		color: var(--red);
		text-align: center;
	}

	/* ─── BUTTONS ─── */
	.prode-btn-primary {
		font-family: 'Inter', sans-serif;
		font-size: 15px;
		font-weight: 700;
		background: var(--celeste);
		color: #fff;
		border: none;
		border-radius: 12px;
		padding: 14px 24px;
		cursor: pointer;
		transition: background 0.2s, transform 0.15s, opacity 0.2s;
		width: 100%;
		letter-spacing: -0.01em;
	}
	.prode-btn-primary:hover:not(:disabled) { background: var(--celeste-dim); transform: translateY(-1px); }
	.prode-btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }

	.prode-btn-secondary {
		font-family: 'Inter', sans-serif;
		font-size: 14px;
		font-weight: 600;
		background: none;
		color: var(--celeste);
		border: 1px solid var(--celeste);
		border-radius: 10px;
		padding: 10px 20px;
		cursor: pointer;
		transition: all 0.2s;
	}
	.prode-btn-secondary:hover { background: rgba(91,155,213,0.08); }

	.prode-btn-pozo {
		font-family: 'Inter', sans-serif;
		font-size: 18px;
		font-weight: 900;
		background: linear-gradient(135deg, var(--amarillo), var(--amarillo-dim));
		color: #1a1200;
		border: none;
		border-radius: 14px;
		padding: 18px 32px;
		cursor: pointer;
		transition: transform 0.2s, box-shadow 0.2s;
		box-shadow: 0 4px 20px rgba(245,194,0,0.4);
		margin-top: 8px;
	}
	.prode-btn-pozo:hover { transform: scale(1.04); box-shadow: 0 8px 32px rgba(245,194,0,0.5); }

	.prode-btn-vamos {
		font-family: 'Inter', sans-serif;
		font-size: 24px;
		font-weight: 900;
		letter-spacing: -0.02em;
		background: linear-gradient(135deg, var(--celeste), var(--celeste-dim));
		color: #fff;
		border: none;
		border-radius: 16px;
		padding: 22px 48px;
		cursor: pointer;
		transition: transform 0.2s, box-shadow 0.2s;
		box-shadow: 0 6px 24px rgba(91,155,213,0.45);
		margin-top: 16px;
		animation: pulse-vamos 2s ease-in-out infinite;
	}
	@keyframes pulse-vamos {
		0%, 100% { box-shadow: 0 6px 24px rgba(91,155,213,0.45); }
		50% { box-shadow: 0 10px 40px rgba(91,155,213,0.7); }
	}
	.prode-btn-vamos:hover { transform: scale(1.06); }

	/* ─── REHEARSAL BANNER ─── */
	.prode-rehearsal-banner {
		background: rgba(245,194,0,0.15);
		border-bottom: 1px solid rgba(245,194,0,0.4);
		padding: 10px 16px;
		text-align: center;
		font-family: 'Inter', monospace;
		font-size: 12px;
		letter-spacing: 0.06em;
		color: #7a5f00;
		font-weight: 600;
	}

	/* ─── MAIN WRAP ─── */
	.prode-wrap {
		max-width: 640px;
		margin: 0 auto;
		padding: 16px 16px 40px;
		display: flex;
		flex-direction: column;
		gap: 24px;
	}

	/* ─── HEADER PERSONAL ─── */
	.prode-header {
		display: flex;
		align-items: center;
		gap: 16px;
		padding: 20px;
	}
	.prode-avatar-wrap {
		position: relative;
		flex-shrink: 0;
	}
	.prode-avatar {
		width: 64px;
		height: 64px;
		border-radius: 50%;
		object-fit: cover;
		border: 2px solid rgba(255,255,255,0.8);
		box-shadow: 0 2px 12px rgba(0,0,0,0.12);
	}
	.prode-avatar-placeholder {
		width: 64px;
		height: 64px;
		border-radius: 50%;
		background: linear-gradient(135deg, var(--celeste), var(--celeste-dim));
		color: #fff;
		font-family: 'Inter', sans-serif;
		font-size: 26px;
		font-weight: 900;
		display: flex;
		align-items: center;
		justify-content: center;
		border: 2px solid rgba(255,255,255,0.8);
	}
	.prode-avatar-change {
		position: absolute;
		bottom: -2px;
		right: -2px;
		width: 24px;
		height: 24px;
		border-radius: 50%;
		background: var(--celeste);
		border: 2px solid #fff;
		font-size: 11px;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: background 0.2s;
	}
	.prode-avatar-change:hover { background: var(--celeste-dim); }
	.prode-header-info { flex: 1; }
	.prode-welcome { font-size: 13px; color: var(--muted); }
	.prode-playername {
		font-family: 'Inter', sans-serif;
		font-size: 20px;
		font-weight: 800;
		letter-spacing: -0.02em;
		color: var(--text);
		line-height: 1.2;
	}
	.prode-badge-ensayo {
		display: inline-block;
		font-family: 'Inter', monospace;
		font-size: 9px;
		letter-spacing: 0.12em;
		color: #7a5f00;
		background: rgba(245,194,0,0.2);
		border: 1px solid rgba(245,194,0,0.4);
		border-radius: 20px;
		padding: 2px 8px;
		margin-top: 4px;
	}
	.prode-header-stats {
		display: flex;
		align-items: center;
		gap: 12px;
		flex-shrink: 0;
	}
	.prode-stat { text-align: center; }
	.prode-stat-value {
		font-family: 'DM Mono', monospace;
		font-size: 22px;
		font-weight: 700;
		color: var(--celeste);
		line-height: 1;
	}
	.prode-stat-label {
		font-family: 'DM Mono', monospace;
		font-size: 9px;
		letter-spacing: 0.1em;
		text-transform: uppercase;
		color: var(--muted);
	}
	.prode-stat-divider {
		width: 1px;
		height: 32px;
		background: var(--border);
	}

	/* ─── SECCIONES ─── */
	.prode-section { display: flex; flex-direction: column; gap: 12px; }

	/* ─── TRIVIA ─── */
	.prode-trivia-section {}
	.prode-trivia-ready {
		display: flex;
		flex-direction: column;
		align-items: center;
		text-align: center;
		padding: 40px 24px;
		gap: 8px;
	}
	.prode-trivia-icon { font-size: 48px; }
	.prode-trivia-ready-title {
		font-family: 'Inter', sans-serif;
		font-size: 24px;
		font-weight: 800;
		letter-spacing: -0.02em;
	}
	.prode-trivia-ready-desc { font-size: 14px; color: var(--muted); }

	.prode-trivia-game { display: flex; flex-direction: column; gap: 12px; }
	.prode-trivia-meta {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0 4px;
	}
	.prode-trivia-progress {
		font-family: 'DM Mono', monospace;
		font-size: 13px;
		color: var(--muted);
	}
	.prode-trivia-score {
		font-family: 'DM Mono', monospace;
		font-size: 14px;
		font-weight: 700;
		color: var(--green);
	}

	/* Timer ring */
	.prode-trivia-timer-ring {
		position: relative;
		width: 56px;
		height: 56px;
		display: flex;
		align-items: center;
		justify-content: center;
	}
	.prode-timer-svg {
		position: absolute;
		inset: 0;
		transform: rotate(-90deg);
		width: 100%;
		height: 100%;
	}
	.timer-bg {
		fill: none;
		stroke: rgba(91,155,213,0.15);
		stroke-width: 8;
	}
	.timer-fill {
		fill: none;
		stroke: var(--celeste);
		stroke-width: 8;
		stroke-dasharray: 283px;
		stroke-linecap: round;
		transition: stroke-dashoffset 1s linear, stroke 0.3s;
	}
	.timer-fill.timer-urgent { stroke: var(--red); }
	.prode-timer-num {
		font-family: 'DM Mono', monospace;
		font-size: 18px;
		font-weight: 700;
		color: var(--text);
		position: relative;
		z-index: 1;
	}
	.prode-timer-num.timer-urgent { color: var(--red); animation: blink-timer 0.5s ease-in-out infinite; }
	@keyframes blink-timer { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }

	.prode-trivia-question {
		padding: 24px;
	}
	.prode-q-text {
		font-family: 'Inter', sans-serif;
		font-size: 18px;
		font-weight: 600;
		line-height: 1.5;
		color: var(--text);
	}

	.prode-trivia-options {
		display: flex;
		flex-direction: column;
		gap: 10px;
	}
	.prode-option {
		display: flex;
		align-items: center;
		gap: 12px;
		padding: 16px 18px;
		border-radius: 12px;
		border: 1px solid var(--border);
		background: rgba(255,255,255,0.7);
		cursor: pointer;
		text-align: left;
		transition: all 0.15s;
		font-size: 15px;
		line-height: 1.4;
	}
	.prode-option:hover:not(:disabled) { border-color: var(--celeste); background: rgba(91,155,213,0.06); }
	.prode-option:disabled { cursor: not-allowed; }
	.prode-option-selected { border-color: var(--celeste) !important; background: rgba(91,155,213,0.12) !important; }
	.prode-option-correct { border-color: var(--green) !important; background: rgba(26,158,106,0.12) !important; }
	.prode-option-wrong { border-color: var(--red) !important; background: rgba(217,48,37,0.08) !important; }
	.prode-opt-letter {
		font-family: 'DM Mono', monospace;
		font-size: 12px;
		font-weight: 700;
		color: var(--celeste);
		background: rgba(91,155,213,0.1);
		border-radius: 6px;
		padding: 2px 8px;
		flex-shrink: 0;
	}
	.prode-opt-text { flex: 1; color: var(--text); }
	.prode-opt-icon { margin-left: auto; font-size: 18px; flex-shrink: 0; }

	.prode-trivia-done {
		display: flex;
		flex-direction: column;
		align-items: center;
		text-align: center;
		padding: 40px 24px;
		gap: 8px;
	}
	.prode-trivia-done-icon { font-size: 56px; }
	.prode-trivia-done-title {
		font-family: 'Inter', sans-serif;
		font-size: 22px;
		font-weight: 800;
	}
	.prode-trivia-done-score {
		font-family: 'DM Mono', monospace;
		font-size: 28px;
		font-weight: 700;
		color: var(--celeste);
	}
	.prode-trivia-done-pts { font-size: 16px; color: var(--green); font-weight: 600; }

	/* ─── PARTIDOS ABIERTOS ─── */
	.prode-matches-list { display: flex; flex-direction: column; gap: 16px; }

	.prode-match-card { padding: 20px; display: flex; flex-direction: column; gap: 16px; }
	.prode-match-head {
		display: flex;
		align-items: center;
		justify-content: space-between;
		flex-wrap: wrap;
		gap: 8px;
	}
	.prode-phase-badge {
		font-family: 'Inter', monospace;
		font-size: 10px;
		letter-spacing: 0.1em;
		text-transform: uppercase;
		color: var(--celeste);
		background: rgba(91,155,213,0.1);
		border: 1px solid rgba(91,155,213,0.2);
		border-radius: 20px;
		padding: 3px 10px;
	}
	.prode-match-time {
		font-family: 'DM Mono', monospace;
		font-size: 11px;
		color: var(--muted);
	}

	.prode-match-teams {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 8px;
	}
	.prode-team {
		display: flex;
		align-items: center;
		gap: 8px;
		flex: 1;
	}
	.prode-team-right { flex-direction: row-reverse; text-align: right; }
	.prode-team-flag { font-size: 24px; flex-shrink: 0; }
	.prode-team-name {
		font-family: 'Inter', sans-serif;
		font-size: 14px;
		font-weight: 700;
		color: var(--text);
		line-height: 1.2;
	}
	.prode-match-vs {
		font-family: 'DM Mono', monospace;
		font-size: 11px;
		color: var(--muted);
		flex-shrink: 0;
		padding: 0 4px;
	}

	/* Selector de ganador */
	.prode-winner-selector {
		display: flex;
		gap: 8px;
	}
	.prode-winner-btn {
		flex: 1;
		padding: 12px 8px;
		border-radius: 10px;
		border: 1px solid var(--border);
		background: rgba(255,255,255,0.6);
		font-family: 'Inter', sans-serif;
		font-size: 13px;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.15s;
		text-align: center;
		line-height: 1.3;
		color: var(--text);
	}
	.prode-winner-btn:hover { border-color: var(--celeste); color: var(--celeste); }
	.prode-winner-btn.selected {
		background: var(--celeste);
		border-color: var(--celeste);
		color: #fff;
		box-shadow: 0 4px 12px rgba(91,155,213,0.35);
	}
	.prode-draw-btn { font-size: 12px; }

	/* Marcador exacto */
	.prode-score-optional {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}
	.prode-score-label {
		font-family: 'Inter', monospace;
		font-size: 10px;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: var(--muted);
	}
	.prode-score-inputs {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 12px;
	}
	.prode-score-team-wrap {
		display: flex;
		align-items: center;
		gap: 8px;
	}
	.prode-score-team-name {
		font-size: 12px;
		font-weight: 600;
		color: var(--muted);
		max-width: 80px;
		text-overflow: ellipsis;
		overflow: hidden;
		white-space: nowrap;
	}
	.prode-score-input {
		width: 56px;
		padding: 8px;
		text-align: center;
		font-family: 'DM Mono', monospace;
		font-size: 22px;
		font-weight: 700;
		border: 1px solid var(--border);
		border-radius: 8px;
		background: rgba(255,255,255,0.8);
		color: var(--text);
		outline: none;
		-moz-appearance: textfield;
	}
	.prode-score-input::-webkit-outer-spin-button,
	.prode-score-input::-webkit-inner-spin-button { -webkit-appearance: none; }
	.prode-score-input:focus { border-color: var(--celeste); }
	.prode-score-sep {
		font-family: 'DM Mono', monospace;
		font-size: 24px;
		color: var(--muted);
	}

	.prode-submitted-badge {
		background: rgba(26,158,106,0.08);
		border: 1px solid rgba(26,158,106,0.25);
		border-radius: 8px;
		padding: 10px 14px;
		font-size: 14px;
		color: var(--green);
	}

	/* ─── PRONÓSTICOS ENVIADOS ─── */
	.prode-sent-list { display: flex; flex-direction: column; gap: 10px; }
	.prode-sent-card {
		padding: 16px 20px;
		display: flex;
		flex-direction: column;
		gap: 6px;
	}
	.prode-sent-teams {
		display: flex;
		align-items: center;
		gap: 8px;
		font-size: 14px;
		font-weight: 600;
		color: var(--text);
		flex-wrap: wrap;
	}
	.prode-sent-vs { color: var(--muted); font-size: 12px; }
	.prode-sent-pick {
		font-size: 13px;
		color: var(--muted);
	}
	.prode-sent-score { color: var(--celeste); font-weight: 700; }
	.prode-sent-result {
		display: flex;
		align-items: center;
		gap: 8px;
		flex-wrap: wrap;
		font-size: 13px;
	}
	.prode-sent-result-score {
		font-family: 'DM Mono', monospace;
		font-weight: 700;
		font-size: 15px;
	}
	.prode-sent-pts {
		font-family: 'DM Mono', monospace;
		font-weight: 700;
		font-size: 14px;
		margin-left: auto;
	}
	.prode-sent-live {
		font-size: 12px;
		font-weight: 600;
		color: var(--red);
		animation: blink-live 1s ease-in-out infinite;
	}
	@keyframes blink-live { 0%,100%{opacity:1} 50%{opacity:0.4} }
	.prode-sent-pending { font-size: 12px; color: var(--muted); }

	/* ─── POZO ─── */
	.prode-pozo-card {
		display: flex;
		flex-direction: column;
		align-items: center;
		text-align: center;
		padding: 32px 24px;
		gap: 8px;
	}
	.prode-pozo-icon { font-size: 40px; }
	.prode-pozo-total {
		font-family: 'DM Mono', monospace;
		font-size: 48px;
		font-weight: 700;
		color: var(--amarillo-dim);
		letter-spacing: -0.03em;
		line-height: 1;
	}
	.prode-pozo-label {
		font-family: 'Inter', monospace;
		font-size: 11px;
		letter-spacing: 0.12em;
		text-transform: uppercase;
		color: var(--muted);
	}
	.prode-pozo-won { color: var(--green); font-weight: 700; font-size: 16px; }
	.prode-pozo-lost { color: var(--red); font-size: 14px; }
	.prode-pozo-revealed { color: var(--amarillo-dim); font-weight: 700; font-size: 15px; }
	.prode-pozo-inprogress { color: var(--muted); font-size: 14px; }
	.prode-pozo-note { font-size: 13px; color: var(--muted); }
	.prode-pozo-interest, .prode-pozo-enabled {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 12px;
		font-size: 14px;
		color: var(--muted);
	}

	/* ─── FOOTER ─── */
	.prode-footer {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 16px 0;
		border-top: 1px solid var(--border);
		margin-top: 8px;
	}
	.prode-logout {
		font-family: 'DM Mono', monospace;
		font-size: 11px;
		background: none;
		border: none;
		color: var(--muted);
		cursor: pointer;
		padding: 4px 0;
		text-decoration: underline;
		text-underline-offset: 3px;
		transition: color 0.2s;
	}
	.prode-logout:hover { color: var(--red); }
	.prode-footer-note {
		font-family: 'DM Mono', monospace;
		font-size: 10px;
		color: var(--muted);
		letter-spacing: 0.06em;
	}

	/* ─── RESPONSIVE ─── */
	@media (max-width: 480px) {
		.prode-login-card { padding: 32px 24px; }
		.prode-match-teams { flex-direction: column; gap: 12px; }
		.prode-team-right { flex-direction: row; text-align: left; }
		.prode-winner-selector { flex-direction: column; }
		.prode-header { flex-wrap: wrap; }
	}
</style>
