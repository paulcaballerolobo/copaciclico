<script lang="ts">
	import { onMount, onDestroy } from 'svelte';

	const heroVideos = [
		'/hero-futbol1.mp4',
		'/hero-futbol2.mp4',
		'/hero-futbol3.mp4',
		'/hero-futbol4.mp4'
	];
	let currentVideo = 0;
	let videoEl: HTMLVideoElement;

	function nextVideo() {
		currentVideo = (currentVideo + 1) % heroVideos.length;
		if (videoEl) {
			videoEl.src = heroVideos[currentVideo];
			videoEl.play();
		}
	}

	// Primer partido del Mundial: México vs Rep. Checa, 11 jun 21:00 CDT = 12 jun 01:00 UTC
	const openingMatch = new Date('2026-06-12T01:00:00Z');
	// Argentina first match: June 12 21:00 CDT = June 13 01:00 UTC
	const argentinaMatch = new Date('2026-06-13T01:00:00Z');
	type CD = { days: number; hours: number; mins: number; secs: number };

	function calc(target: Date): CD {
		const diff = target.getTime() - Date.now();
		if (diff <= 0) return { days: 0, hours: 0, mins: 0, secs: 0 };
		return {
			days: Math.floor(diff / 86400000),
			hours: Math.floor((diff % 86400000) / 3600000),
			mins: Math.floor((diff % 3600000) / 60000),
			secs: Math.floor((diff % 60000) / 1000)
		};
	}

	let opening: CD = calc(openingMatch);
	let arg: CD = calc(argentinaMatch);

	let interval: ReturnType<typeof setInterval>;
	onMount(() => {
		interval = setInterval(() => {
			opening = calc(openingMatch);
			arg = calc(argentinaMatch);
		}, 1000);
	});
	onDestroy(() => clearInterval(interval));

	function pad(n: number) {
		return String(n).padStart(2, '0');
	}

	const sections = [
		{
			href: '/datos',
			num: '01',
			label: 'Mundial de los Datos',
			desc: 'Clasificá los 48 países por pobreza, educación, desigualdad y más. El fixture que nadie se animó a hacer.'
		},
		{
			href: '/fixture',
			num: '02',
			label: 'Simulador de Fixture',
			desc: '¿Quién gana si compiten por libertad de prensa? ¿Por PIB? Armá tu torneo y descubrí el campeón inesperado.'
		},
		{
			href: '/paises',
			num: '03',
			label: 'Países',
			desc: 'Ficha completa de cada selección: economía, líder político y cómo se vincula hoy con Argentina.'
		},
		{
			href: '/calendario',
			num: '04',
			label: 'Calendario',
			desc: 'Todos los partidos con cuenta regresiva y horarios en hora argentina. Nunca te perdas un juego.'
		},
		{
			href: '/ciudades',
			num: '05',
			label: 'Ciudades sede',
			desc: 'Las 16 sedes en EEUU, Canadá y México. Dónde juega Argentina y cuáles son los estadios más grandes.'
		},
		{
			href: '/stats',
			num: '06',
			label: 'Estadísticas',
			desc: 'Los datos más picantes del torneo. Las comparaciones que no vas a ver en ESPN ni en TyC Sports.'
		}
	];
</script>

<div class="home">

	<!-- ═══ COUNTDOWN STRIP ═══ -->
	<div class="opening-strip">
		<span class="strip-label">Inicio del Mundial</span>
		<span class="strip-match">🇲🇽 México vs Rep. Checa 🇨🇿</span>
		<span class="strip-cd">
			<span class="strip-num">{pad(opening.days)}</span><span class="strip-unit">d</span>
			<span class="strip-sep">:</span>
			<span class="strip-num">{pad(opening.hours)}</span><span class="strip-unit">h</span>
			<span class="strip-sep">:</span>
			<span class="strip-num">{pad(opening.mins)}</span><span class="strip-unit">m</span>
			<span class="strip-sep blink">:</span>
			<span class="strip-num cd-secs">{pad(opening.secs)}</span><span class="strip-unit">s</span>
		</span>
		<span class="strip-venue">11 jun · 21:00 hs · AT&T Stadium, Dallas</span>
	</div>

	<!-- ═══ HERO ═══ -->
	<section class="hero">
		<div class="video-bg" aria-hidden="true">
			<video
				bind:this={videoEl}
				src={heroVideos[currentVideo]}
				autoplay
				muted
				playsinline
				on:ended={nextVideo}
			></video>
			<div class="video-overlay"></div>
		</div>

		<div class="hero-grid">
			<!-- Left: main card -->
			<div class="hero-card">
				<div class="hero-eyebrow">CÍCLICO · ARGENTINA · MUNDIAL 2026</div>
				<h1 class="hero-title">El Mundial<br><span class="hero-accent">es Cíclico</span></h1>
				<p class="hero-lead">¿Qué pasaría si los países compitieran por sus datos en vez de por goles?</p>
			</div>

			<!-- Right: section buttons -->
			<nav class="hero-nav-grid" aria-label="Secciones">
				{#each sections as s}
					<a href={s.href} class="hero-nav-btn">
						<span class="hnb-num">{s.num}</span>
						<span class="hnb-label">{s.label}</span>
						<span class="hnb-arrow">→</span>
					</a>
				{/each}
			</nav>
		</div>
	</section>

	<!-- ═══ ARGENTINA ═══ -->
	<section class="arg-section">

		<!-- Left: squad -->
		<div class="squad-panel">
			<div class="squad-header">
				<span class="squad-flag">🇦🇷</span>
				<div>
					<div class="squad-eyebrow">Selección Argentina · Mundial 2026</div>
					<h2 class="squad-title">Los 26 convocados</h2>
				</div>
			</div>

			<div class="squad-groups">
				<div class="squad-group">
					<div class="squad-pos">Arqueros</div>
					<div class="squad-names">
						<span>Emiliano "Dibu" Martínez</span>
						<span>Gerónimo Rulli</span>
						<span>Juan Musso</span>
					</div>
				</div>
				<div class="squad-group">
					<div class="squad-pos">Defensores</div>
					<div class="squad-names">
						<span>Nahuel Molina</span>
						<span>Cristian "Cuti" Romero</span>
						<span>Nicolás Otamendi</span>
						<span>Nicolás Tagliafico</span>
						<span>Gonzalo Montiel</span>
						<span>Leonardo Balerdi</span>
						<span>Lisandro Martínez</span>
						<span>Facundo Medina</span>
					</div>
				</div>
				<div class="squad-group">
					<div class="squad-pos">Mediocampistas</div>
					<div class="squad-names">
						<span>Rodrigo De Paul</span>
						<span>Alexis Mac Allister</span>
						<span>Enzo Fernández</span>
						<span>Exequiel Palacios</span>
						<span>Leandro Paredes</span>
						<span>Valentín Barco</span>
						<span>Giovani Lo Celso</span>
						<span>Giuliano Simeone</span>
						<span>Nicolás González</span>
					</div>
				</div>
				<div class="squad-group">
					<div class="squad-pos">Delanteros</div>
					<div class="squad-names">
						<span class="squad-star">Lionel Messi ★</span>
						<span>Julián Álvarez</span>
						<span>Lautaro Martínez</span>
						<span>Thiago Almada</span>
						<span>José Manuel López</span>
						<span>Nicolás Paz</span>
					</div>
				</div>
			</div>
		</div>

		<!-- Right: countdown to Argentina's match -->
		<div class="countdown-arg">
			<div class="arg-match-badge">
				<span class="flag">🇦🇷</span>
				<span class="arg-vs">Argentina vs Argelia</span>
				<span class="flag">🇩🇿</span>
			</div>
			<div class="arg-eyebrow">Próximo partido de la Selección</div>
			<div class="countdown-display">
				<div class="cd-unit">
					<div class="cd-num">{pad(arg.days)}</div>
					<div class="cd-label">DÍAS</div>
				</div>
				<div class="cd-sep">:</div>
				<div class="cd-unit">
					<div class="cd-num">{pad(arg.hours)}</div>
					<div class="cd-label">HORAS</div>
				</div>
				<div class="cd-sep">:</div>
				<div class="cd-unit">
					<div class="cd-num">{pad(arg.mins)}</div>
					<div class="cd-label">MIN</div>
				</div>
				<div class="cd-sep blink">:</div>
				<div class="cd-unit">
					<div class="cd-num cd-secs">{pad(arg.secs)}</div>
					<div class="cd-label">SEG</div>
				</div>
			</div>
			<div class="arg-meta">
				<span class="meta-tag">Grupo J</span>
				12 Jun · 21:00 hs · AT&T Stadium, Dallas
			</div>
		</div>

	</section>

	<!-- ═══ EXPLORE ═══ -->
	<section class="explore">
		<div class="explore-header">
			<div class="section-hero-label">El micrositio</div>
			<h2 class="section-title">Explorá todo lo que ofrece Cíclico</h2>
			<p class="section-subtitle">Seis secciones con datos, análisis y simulaciones del Mundial 2026.</p>
		</div>
		<div class="explore-grid">
			{#each sections as s}
				<a href={s.href} class="explore-card">
					<div class="card-num">{s.num}</div>
					<div class="card-body">
						<div class="card-label">{s.label}</div>
						<div class="card-desc">{s.desc}</div>
					</div>
					<div class="card-arrow">→</div>
				</a>
			{/each}
		</div>
	</section>

	<!-- ═══ FOOTER ═══ -->
	<footer class="home-footer">
		<div class="footer-brand">
			<img src="/Logos-CICLICO-Mundial.png" alt="Cíclico" class="footer-logo-img" />
		</div>
		<p class="footer-text">Un proyecto de datos sobre el Mundial de Fútbol 2026. Datos actualizados a mayo 2026.</p>
	</footer>

</div>

<style>
	.home { min-height: 100vh; }

	/* ── OPENING STRIP ── */
	.opening-strip {
		display: flex;
		align-items: center;
		gap: 20px;
		padding: 10px 32px;
		background: #111111;
		border-bottom: 1px solid rgba(255,255,255,0.08);
		font-family: 'DM Mono', monospace;
		font-size: 12px;
		flex-wrap: wrap;
	}
	.strip-label {
		color: var(--amarillo);
		text-transform: uppercase;
		letter-spacing: 0.12em;
		font-size: 10px;
		flex-shrink: 0;
	}
	.strip-match {
		color: #ffffff;
		font-weight: 500;
		flex-shrink: 0;
	}
	.strip-cd {
		display: flex;
		align-items: baseline;
		gap: 3px;
		color: #ffffff;
	}
	.strip-num { font-size: 15px; font-weight: 600; letter-spacing: -0.02em; }
	.strip-unit { font-size: 9px; color: rgba(255,255,255,0.45); margin-right: 2px; }
	.strip-sep { color: rgba(255,255,255,0.3); font-size: 13px; }
	.cd-secs { color: var(--celeste); }
	.strip-venue {
		color: rgba(255,255,255,0.4);
		font-size: 11px;
		margin-left: auto;
		flex-shrink: 0;
	}

	/* ── HERO ── */
	.hero {
		position: relative;
		min-height: calc(100vh - 105px);
		display: flex;
		align-items: center;
		overflow: hidden;
		padding: 60px 48px;
	}

	.video-bg {
		position: absolute;
		inset: 0;
		z-index: 0;
	}
	.video-bg video {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}
	.video-overlay {
		position: absolute;
		inset: 0;
		background: linear-gradient(
			to right,
			rgba(0,0,0,0.72) 0%,
			rgba(0,0,0,0.5) 55%,
			rgba(0,0,0,0.35) 100%
		);
	}

	/* ── HERO GRID ── */
	.hero-grid {
		position: relative;
		z-index: 2;
		width: 100%;
		max-width: 1200px;
		margin: 0 auto;
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 40px;
		align-items: center;
		animation: fadeUp 0.9s ease forwards;
	}

	@keyframes fadeUp {
		from { opacity: 0; transform: translateY(24px); }
		to   { opacity: 1; transform: translateY(0); }
	}

	/* Left card */
	.hero-card {
		background: rgba(255,255,255,0.1);
		backdrop-filter: blur(20px);
		-webkit-backdrop-filter: blur(20px);
		border: 1px solid rgba(255,255,255,0.2);
		border-radius: 20px;
		padding: 48px 44px;
		position: relative;
		overflow: hidden;
		box-shadow: 0 8px 40px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.25);
	}
	.hero-card::before {
		content: '';
		position: absolute;
		top: 0; left: 0; right: 0;
		height: 45%;
		background: linear-gradient(180deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0) 100%);
		border-radius: 20px 20px 0 0;
		pointer-events: none;
	}

	.hero-eyebrow {
		font-family: 'Inter', monospace;
		font-size: 10px;
		letter-spacing: 0.22em;
		text-transform: uppercase;
		color: var(--amarillo);
		margin-bottom: 24px;
	}

	.hero-title {
		font-family: 'Inter', sans-serif;
		font-size: clamp(44px, 6vw, 80px);
		font-weight: 900;
		line-height: 0.93;
		letter-spacing: -0.04em;
		margin-bottom: 28px;
		color: #ffffff;
	}
	.hero-accent { color: var(--celeste); }

	.hero-lead {
		font-size: clamp(15px, 1.6vw, 18px);
		color: rgba(255,255,255,0.72);
		line-height: 1.7;
	}

	/* Right nav grid */
	.hero-nav-grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 12px;
	}

	.hero-nav-btn {
		background: rgba(255,255,255,0.1);
		backdrop-filter: blur(16px);
		-webkit-backdrop-filter: blur(16px);
		border: 1px solid rgba(255,255,255,0.2);
		border-radius: 14px;
		padding: 18px 16px;
		text-decoration: none;
		color: #fff;
		display: flex;
		align-items: center;
		gap: 10px;
		position: relative;
		overflow: hidden;
		box-shadow: 0 2px 12px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.2);
		transition: background 0.2s, border-color 0.2s, transform 0.18s;
	}
	.hero-nav-btn::before {
		content: '';
		position: absolute;
		top: 0; left: 0; right: 0;
		height: 50%;
		background: linear-gradient(180deg, rgba(255,255,255,0.1) 0%, transparent 100%);
		pointer-events: none;
	}
	.hero-nav-btn:hover {
		background: rgba(91,155,213,0.25);
		border-color: rgba(91,155,213,0.5);
		transform: translateY(-2px);
	}

	.hnb-num {
		font-family: 'DM Mono', monospace;
		font-size: 10px;
		color: var(--amarillo);
		flex-shrink: 0;
	}
	.hnb-label {
		font-family: 'Inter', sans-serif;
		font-size: 13px;
		font-weight: 600;
		flex: 1;
		line-height: 1.3;
	}
	.hnb-arrow {
		font-size: 14px;
		color: rgba(255,255,255,0.4);
		flex-shrink: 0;
		transition: transform 0.18s, color 0.18s;
	}
	.hero-nav-btn:hover .hnb-arrow { transform: translateX(4px); color: var(--celeste); }

	/* ── ARGENTINA SECTION ── */
	.arg-section {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 0;
		border-top: 1px solid var(--border);
		border-bottom: 1px solid var(--border);
	}

	/* Squad panel */
	.squad-panel {
		padding: 56px 48px;
		border-right: 1px solid var(--border);
		background: rgba(255,255,255,0.45);
		backdrop-filter: blur(12px);
		-webkit-backdrop-filter: blur(12px);
	}

	.squad-header {
		display: flex;
		align-items: center;
		gap: 16px;
		margin-bottom: 36px;
	}
	.squad-flag { font-size: 48px; line-height: 1; flex-shrink: 0; }
	.squad-eyebrow {
		font-family: 'Inter', monospace;
		font-size: 10px;
		letter-spacing: 0.18em;
		text-transform: uppercase;
		color: var(--celeste);
		margin-bottom: 4px;
	}
	.squad-title {
		font-family: 'Inter', sans-serif;
		font-size: 22px;
		font-weight: 800;
		letter-spacing: -0.02em;
		color: var(--text);
	}

	.squad-groups { display: flex; flex-direction: column; gap: 20px; }

	.squad-group {}
	.squad-pos {
		font-family: 'Inter', monospace;
		font-size: 10px;
		letter-spacing: 0.14em;
		text-transform: uppercase;
		color: var(--amarillo-dim);
		font-weight: 700;
		margin-bottom: 8px;
		padding-bottom: 6px;
		border-bottom: 1px solid var(--border);
	}
	.squad-names {
		display: flex;
		flex-wrap: wrap;
		gap: 6px;
	}
	.squad-names span {
		font-family: 'Instrument Sans', sans-serif;
		font-size: 13px;
		color: var(--text);
		background: rgba(255,255,255,0.6);
		border: 1px solid var(--border);
		border-radius: 20px;
		padding: 4px 12px;
		backdrop-filter: blur(8px);
	}
	.squad-star {
		background: rgba(245,194,0,0.12) !important;
		border-color: rgba(245,194,0,0.4) !important;
		color: #7a5c00 !important;
		font-weight: 600;
	}

	/* Countdown panel */
	.countdown-arg {
		padding: 56px 48px;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 18px;
		text-align: center;
		background: rgba(255,255,255,0.3);
		backdrop-filter: blur(12px);
		-webkit-backdrop-filter: blur(12px);
	}

	.arg-match-badge {
		display: flex;
		align-items: center;
		gap: 14px;
	}
	.flag { font-size: 36px; line-height: 1; }
	.arg-vs {
		font-family: 'Inter', sans-serif;
		font-size: 16px;
		font-weight: 700;
		color: var(--text);
		padding: 5px 18px;
		border: 1px solid var(--border);
		border-radius: 24px;
		background: var(--bg-card2);
	}

	.arg-eyebrow {
		font-family: 'Inter', monospace;
		font-size: 11px;
		letter-spacing: 0.18em;
		text-transform: uppercase;
		color: var(--celeste);
	}

	.countdown-display {
		display: flex;
		align-items: flex-end;
		gap: 6px;
	}

	.cd-unit { display: flex; flex-direction: column; align-items: center; gap: 10px; }

	.cd-num {
		font-family: 'DM Mono', monospace;
		font-size: clamp(56px, 12vw, 96px);
		font-weight: 700;
		line-height: 1;
		color: var(--text);
		background: var(--bg-card2);
		border: 1px solid var(--border);
		border-radius: 10px;
		padding: 14px 18px;
		min-width: 2.2ch;
		text-align: center;
		letter-spacing: -0.02em;
	}
	.cd-secs {
		color: var(--celeste);
		animation: secPulse 1s ease-in-out infinite;
	}
	@keyframes secPulse {
		0%, 100% { opacity: 1; }
		50%       { opacity: 0.6; }
	}

	.cd-label {
		font-family: 'DM Mono', monospace;
		font-size: 9px;
		letter-spacing: 0.2em;
		color: var(--muted);
	}

	.cd-sep {
		font-family: 'DM Mono', monospace;
		font-size: clamp(40px, 8vw, 72px);
		color: var(--border);
		padding-bottom: 22px;
		line-height: 1;
		user-select: none;
	}

	.arg-meta {
		font-family: 'DM Mono', monospace;
		font-size: 12px;
		color: var(--muted);
		display: flex;
		align-items: center;
		gap: 10px;
		flex-wrap: wrap;
		justify-content: center;
	}
	.meta-tag {
		font-size: 10px;
		letter-spacing: 0.12em;
		text-transform: uppercase;
		color: var(--celeste);
		border: 1px solid rgba(91, 155, 213, 0.3);
		border-radius: 4px;
		padding: 2px 8px;
	}

	/* Shared blink */
	.blink { animation: blinkAnim 2s step-end infinite; }
	@keyframes blinkAnim {
		0%, 49% { opacity: 1; }
		50%, 100% { opacity: 0.15; }
	}

	/* ── EXPLORE ── */
	.explore {
		max-width: 1100px;
		margin: 0 auto;
		padding: 72px 32px 56px;
	}

	.explore-header { margin-bottom: 40px; }

	.explore-grid {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 14px;
	}

	.explore-card {
		background: rgba(255,255,255,0.55);
		backdrop-filter: blur(16px);
		-webkit-backdrop-filter: blur(16px);
		border: 1px solid rgba(255,255,255,0.75);
		border-radius: 14px;
		padding: 28px 22px 22px;
		text-decoration: none;
		color: var(--text);
		display: flex;
		flex-direction: column;
		gap: 14px;
		position: relative;
		overflow: hidden;
		box-shadow: 0 2px 12px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.9);
		transition: border-color 0.2s, transform 0.18s, box-shadow 0.2s;
	}
	.explore-card::before {
		content: '';
		position: absolute;
		top: 0; left: 0; right: 0;
		height: 40%;
		background: linear-gradient(180deg, rgba(255,255,255,0.45) 0%, rgba(255,255,255,0) 100%);
		pointer-events: none;
		border-radius: 14px 14px 0 0;
	}
	.explore-card:hover {
		border-color: rgba(91,155,213,0.5);
		transform: translateY(-3px);
		box-shadow: 0 8px 32px rgba(91,155,213,0.12), inset 0 1px 0 rgba(255,255,255,0.9);
	}

	.card-num {
		font-family: 'DM Mono', monospace;
		font-size: 10px;
		letter-spacing: 0.15em;
		color: var(--celeste);
	}

	.card-body { flex: 1; }

	.card-label {
		font-family: 'Inter', sans-serif;
		font-size: 15px;
		font-weight: 700;
		margin-bottom: 8px;
		letter-spacing: -0.01em;
	}

	.card-desc {
		font-size: 13px;
		color: var(--muted);
		line-height: 1.65;
	}

	.card-arrow {
		font-size: 17px;
		color: var(--border);
		align-self: flex-end;
		transition: color 0.2s, transform 0.18s;
	}
	.explore-card:hover .card-arrow { color: var(--celeste); transform: translateX(5px); }

	/* ── FOOTER ── */
	.home-footer {
		border-top: 1px solid var(--border);
		padding: 28px 32px;
		max-width: 1100px;
		margin: 0 auto;
		display: flex;
		align-items: center;
		gap: 20px;
	}

	.footer-brand {
		display: flex;
		align-items: center;
		flex-shrink: 0;
	}
	.footer-logo-img {
		height: 28px;
		width: auto;
		display: block;
	}

	.footer-text {
		font-family: 'DM Mono', monospace;
		font-size: 11px;
		color: var(--muted);
		line-height: 1.65;
	}

	/* ── SHARED BLINK ── */
	.blink { animation: blinkAnim 2s step-end infinite; }
	@keyframes blinkAnim { 0%,49%{opacity:1} 50%,100%{opacity:0.15} }

	/* ── RESPONSIVE ── */
	@media (max-width: 1000px) {
		.hero-grid { grid-template-columns: 1fr; }
		.hero { padding: 48px 24px; min-height: auto; }
		.hero-nav-grid { grid-template-columns: repeat(3, 1fr); }
		.arg-section { grid-template-columns: 1fr; }
		.squad-panel { border-right: none; border-bottom: 1px solid var(--border); padding: 40px 24px; }
		.countdown-arg { padding: 40px 24px; }
	}
	@media (max-width: 900px) {
		.explore-grid { grid-template-columns: repeat(2, 1fr); }
		.opening-strip { padding: 10px 16px; gap: 12px; }
		.strip-venue { display: none; }
	}
	@media (max-width: 640px) {
		.explore-grid { grid-template-columns: 1fr; }
		.countdown-display { gap: 3px; }
		.cd-num { padding: 10px 12px; }
		.arg-match-badge { gap: 8px; }
		.arg-vs { font-size: 14px; padding: 4px 12px; }
		.home-footer { flex-direction: column; text-align: center; }
		.arg-meta { font-size: 11px; }
		.hero-nav-grid { grid-template-columns: 1fr 1fr; }
		.hero-card { padding: 32px 24px; }
	}
</style>
