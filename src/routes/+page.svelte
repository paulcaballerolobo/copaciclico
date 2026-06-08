<script lang="ts">
	import { onMount, onDestroy } from 'svelte';

	const heroImages = [
		'/fondo-hero.png',
		'/fondo-hero2.png',
		'/fondo-hero4.png',
		'/fondo-hero5.png',
		'/fondo-hero6.png'
	];

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

	<!-- ═══ HERO ═══ -->
	<section class="hero">
		<div class="img-bg" aria-hidden="true">
			{#each heroImages as img, i}
				<div class="img-slide" style="background-image: url({img}); animation-delay: {i * 5}s"></div>
			{/each}
			<div class="video-overlay"></div>
		</div>

		<div class="hero-grid">
			<!-- Left: main card -->
			<div class="hero-card">
				<div class="hero-eyebrow">CÍCLICO · ARGENTINA · MUNDIAL 2026</div>
				<div class="hero-card-body">
					<img src="/Logos-CICLICO-Mundial-blanco.png" alt="Cíclico" class="hero-logo" />
					<div class="hero-card-text">
						<h1 class="hero-title">El Mundial<br><span class="hero-accent">es Cíclico</span></h1>
						<p class="hero-lead">¿Qué pasaría si los países compitieran por sus datos en vez de por goles?</p>
					</div>
				</div>
			</div>

			<!-- Right: countdown card + section buttons -->
			<div class="hero-right">
				<!-- Countdown card -->
				<div class="hero-cd-card">
					<div class="hcd-label">Inicio del Mundial</div>
					<div class="hcd-match">🇲🇽 <span>México vs Rep. Checa</span> 🇨🇿</div>
					<div class="hcd-timer">
						<div class="hcd-unit"><span class="hcd-num">{pad(opening.days)}</span><span class="hcd-lbl">días</span></div>
						<span class="hcd-sep">:</span>
						<div class="hcd-unit"><span class="hcd-num">{pad(opening.hours)}</span><span class="hcd-lbl">hs</span></div>
						<span class="hcd-sep">:</span>
						<div class="hcd-unit"><span class="hcd-num">{pad(opening.mins)}</span><span class="hcd-lbl">min</span></div>
						<span class="hcd-sep blink">:</span>
						<div class="hcd-unit"><span class="hcd-num hcd-secs">{pad(opening.secs)}</span><span class="hcd-lbl">seg</span></div>
					</div>
					<div class="hcd-venue">11 jun · 21:00 hs · AT&T Stadium, Dallas</div>
				</div>

				<!-- Section buttons -->
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
		</div>
	</section>

	<!-- ═══ ARGENTINA ═══ -->
	<section class="arg-section">

		<!-- Left: squad + injuries -->
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
						<span class="sq-injury">Emiliano "Dibu" Martínez</span>
						<span>Gerónimo Rulli</span>
						<span>Juan Musso</span>
					</div>
				</div>
				<div class="squad-group">
					<div class="squad-pos">Defensores</div>
					<div class="squad-names">
						<span class="sq-injury">Nahuel Molina</span>
						<span class="sq-injury">Cristian "Cuti" Romero</span>
						<span>Nicolás Otamendi</span>
						<span>Nicolás Tagliafico</span>
						<span class="sq-injury">Gonzalo Montiel</span>
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
						<span class="sq-injury">Leandro Paredes</span>
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

			<div class="squad-divider"></div>

			<h3 class="squad-injuries-title">Estado del plantel</h3>
			<div class="mp-injuries">
				<div class="inj-row"><span class="inj-name">Cuti Romero</span><span class="inj-detail">Esguince ligamento colateral — llegaría en óptimas condiciones</span></div>
				<div class="inj-row"><span class="inj-name">Leandro Paredes</span><span class="inj-detail">Molestia muscular — compromete su presencia</span></div>
				<div class="inj-row"><span class="inj-name">Dibu Martínez</span><span class="inj-detail">Fractura dedo anular mano derecha</span></div>
				<div class="inj-row"><span class="inj-name">Lionel Messi</span><span class="inj-detail">Molestia muscular crónica — convive con ella</span></div>
				<div class="inj-row"><span class="inj-name">Molina / Montiel</span><span class="inj-detail">Lesiones musculares — hay alternativas</span></div>
			</div>
			<div class="squad-legend">Marcados en rojo: con molestias físicas</div>
		</div>

		<!-- Right: match info panel -->
		<div class="match-panel">

			<!-- Ticket -->
			<div class="ticket">
				<div class="ticket-left">
					<div class="ticket-teams">
						<div class="ticket-team">ARGENTINA</div>
						<div class="ticket-team">ARGELIA</div>
					</div>
					<div class="ticket-right">
						<div class="ticket-detail">· MARTES 16 DE JUNIO</div>
						<div class="ticket-detail">· 22:00 HS ARGENTINA</div>
						<div class="ticket-detail">· ARROWHEAD STADIUM, KANSAS CITY</div>
					</div>
				</div>
				<div class="ticket-cd-panel">
					<div class="tcd-eyebrow">Cuenta regresiva · Grupo J</div>
					<div class="ticket-cd">
						<div class="tcd-unit"><div class="tcd-num mp-cd-sweep">{pad(arg.days)}</div><div class="tcd-lbl">DÍAS</div></div>
						<div class="tcd-sep">:</div>
						<div class="tcd-unit"><div class="tcd-num mp-cd-sweep">{pad(arg.hours)}</div><div class="tcd-lbl">HS</div></div>
						<div class="tcd-sep">:</div>
						<div class="tcd-unit"><div class="tcd-num mp-cd-sweep">{pad(arg.mins)}</div><div class="tcd-lbl">MIN</div></div>
						<div class="tcd-sep">:</div>
						<div class="tcd-unit"><div class="tcd-num mp-cd-sweep">{pad(arg.secs)}</div><div class="tcd-lbl">SEG</div></div>
					</div>
				</div>
			</div>

			<!-- Algeria -->
			<div class="mp-block">
				<h3 class="mp-section-title">¿Qué se espera del equipo argelino?</h3>
				<p class="mp-text">No es un rival de relleno. Clasificó con 8 triunfos, 1 empate y 1 derrota. En 2014 llegó a octavos y puso en apuros a la Alemania campeona. Juega en 4-3-3 / 4-2-3-1, presión alta y ataque rápido por las bandas. DT: <strong>Vladimir Petković</strong> — conocido de Scaloni de la etapa en Lazio.</p>
				<div class="mp-players">
					<div class="mp-player"><span class="mp-pname">Riyad Mahrez</span><span class="mp-pinfo">35 años · Al-Ahli · ex Manchester City · Champions 2023</span></div>
					<div class="mp-player"><span class="mp-pname">Rayan Aït-Nouri</span><span class="mp-pinfo">Lateral izq. titular en Manchester City</span></div>
					<div class="mp-player"><span class="mp-pname">Ramy Bensebaini</span><span class="mp-pinfo">Defensor · Borussia Dortmund</span></div>
					<div class="mp-player"><span class="mp-pname">Houssem Aouar</span><span class="mp-pinfo">Mediocampista · Al-Ittihad · ex Lyon y Roma</span></div>
					<div class="mp-player"><span class="mp-pname">Luca Zidane</span><span class="mp-pinfo">Arquero · hijo de Zinedine · Granada · titular en CAN</span></div>
				</div>
			</div>

			<!-- History & alert -->
			<div class="mp-row-2">
				<div class="mp-block mp-block-half">
					<h3 class="mp-section-title mp-title-sm">Único antecedente</h3>
					<p class="mp-text">Camp Nou, 2007. Amistoso pre Copa América. Argentina ganó <strong>4-3</strong> con doblete de Messi, más Tevez y Cambiasso. De ese equipo, solo Messi sigue; Ayala y Aimar hoy son parte del cuerpo técnico.</p>
				</div>
				<div class="mp-block mp-block-half mp-alert">
					<h3 class="mp-section-title mp-title-sm">Tener presente</h3>
					<p class="mp-text">Argelia vuelve al Mundial tras quedar fuera en 2022. La presión interna es alta. Tienen calidad real en Europa. El partido es ganable, pero presentarlos como decorativos sería un error de lectura.</p>
				</div>
			</div>

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

	/* ── HERO ── */
	.hero {
		position: relative;
		min-height: calc(100vh - 105px);
		display: flex;
		align-items: center;
		overflow: hidden;
		padding: 60px 48px;
	}

	.img-bg {
		position: absolute;
		inset: 0;
		z-index: 0;
	}
	.img-slide {
		position: absolute;
		inset: 0;
		background-size: cover;
		background-position: center;
		opacity: 0;
		animation: slideShow 25s infinite;
	}
	@keyframes slideShow {
		0%    { opacity: 0; }
		5%    { opacity: 1; }
		20%   { opacity: 1; }
		25%   { opacity: 0; }
		100%  { opacity: 0; }
	}
	.video-overlay {
		position: absolute;
		inset: 0;
		background: linear-gradient(
			to right,
			rgba(0,0,0,0.82) 0%,
			rgba(0,0,0,0.65) 55%,
			rgba(0,0,0,0.55) 100%
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
		background: rgba(0,0,0,0.45);
		backdrop-filter: blur(20px);
		-webkit-backdrop-filter: blur(20px);
		border: 1px solid rgba(255,255,255,0.15);
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

	.hero-card-body {
		display: flex;
		align-items: center;
		gap: 28px;
	}
	.hero-logo {
		height: 110px;
		width: auto;
		flex-shrink: 0;
	}
	.hero-card-text { flex: 1; }

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

	/* Right column */
	.hero-right {
		display: flex;
		flex-direction: column;
		gap: 12px;
	}

	/* Countdown card */
	.hero-cd-card {
		background: rgba(0,0,0,0.45);
		backdrop-filter: blur(20px);
		-webkit-backdrop-filter: blur(20px);
		border: 1px solid rgba(255,255,255,0.15);
		border-radius: 14px;
		padding: 20px 24px;
		position: relative;
		overflow: hidden;
		box-shadow: 0 2px 12px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.2);
		display: flex;
		align-items: center;
		gap: 20px;
		flex-wrap: wrap;
	}
	.hero-cd-card::before {
		content: '';
		position: absolute;
		top: 0; left: 0; right: 0;
		height: 50%;
		background: linear-gradient(180deg, rgba(255,255,255,0.1) 0%, transparent 100%);
		pointer-events: none;
	}
	.hcd-label {
		font-family: 'Inter', monospace;
		font-size: 10px;
		letter-spacing: 0.14em;
		text-transform: uppercase;
		color: var(--amarillo);
		flex-shrink: 0;
	}
	.hcd-match {
		font-family: 'Inter', sans-serif;
		font-size: 13px;
		font-weight: 600;
		color: #fff;
		flex-shrink: 0;
	}
	.hcd-match span { margin: 0 4px; }
	.hcd-timer {
		display: flex;
		align-items: baseline;
		gap: 4px;
		margin-left: auto;
		flex-shrink: 0;
	}
	.hcd-unit { display: flex; flex-direction: column; align-items: center; gap: 2px; }
	.hcd-num {
		font-family: 'DM Mono', monospace;
		font-size: 22px;
		font-weight: 700;
		color: #fff;
		line-height: 1;
		letter-spacing: -0.02em;
	}
	.hcd-secs { color: var(--celeste); animation: secPulse 1s ease-in-out infinite; }
	.hcd-lbl {
		font-family: 'DM Mono', monospace;
		font-size: 8px;
		color: rgba(255,255,255,0.4);
		letter-spacing: 0.1em;
	}
	.hcd-sep {
		font-family: 'DM Mono', monospace;
		font-size: 18px;
		color: rgba(255,255,255,0.3);
		padding-bottom: 10px;
		line-height: 1;
	}
	.hcd-venue {
		font-family: 'DM Mono', monospace;
		font-size: 10px;
		color: rgba(255,255,255,0.4);
		width: 100%;
		margin-top: -8px;
	}

	/* Right nav grid */
	.hero-nav-grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 12px;
	}

	.hero-nav-btn {
		background: rgba(0,0,0,0.4);
		backdrop-filter: blur(16px);
		-webkit-backdrop-filter: blur(16px);
		border: 1px solid rgba(255,255,255,0.15);
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
		grid-template-columns: 2fr 3fr;
		gap: 0;
		border-top: 1px solid var(--border);
		border-bottom: 1px solid var(--border);
		position: relative;
	}
	.arg-section::before {
		content: '';
		position: absolute;
		inset: 0;
		background: url('/fondo-seccion-argentina.jpg') center / cover no-repeat;
		z-index: 0;
	}
	.arg-section > * { position: relative; z-index: 1; }

	/* Squad panel */
	.squad-panel {
		padding: 48px 36px;
		border-right: 1px solid rgba(255,255,255,0.12);
		background: rgba(5,8,20,0.80);
		backdrop-filter: blur(16px);
		-webkit-backdrop-filter: blur(16px);
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
		font-size: 32px;
		font-weight: 900;
		letter-spacing: -0.03em;
		color: #ffffff;
		line-height: 1;
	}

	.squad-groups { display: flex; flex-direction: column; gap: 20px; }

	.squad-group {}
	.squad-pos {
		font-family: 'Inter', monospace;
		font-size: 10px;
		letter-spacing: 0.14em;
		text-transform: uppercase;
		color: var(--amarillo);
		font-weight: 700;
		margin-bottom: 8px;
		padding-bottom: 6px;
		border-bottom: 1px solid rgba(255,255,255,0.1);
	}
	.squad-names {
		display: flex;
		flex-wrap: wrap;
		gap: 6px;
	}
	.squad-names span {
		font-family: 'Instrument Sans', sans-serif;
		font-size: 12px;
		color: #ffffff;
		background: rgba(91,155,213,0.2);
		border: 1px solid rgba(91,155,213,0.35);
		border-radius: 20px;
		padding: 4px 12px;
		backdrop-filter: blur(8px);
	}
	.squad-star {
		background: rgba(245,194,0,0.15) !important;
		border-color: rgba(245,194,0,0.4) !important;
		color: var(--amarillo) !important;
		font-weight: 600;
	}
	.sq-injury {
		border-color: rgba(255,100,100,0.35) !important;
		color: rgba(255,160,160,0.9) !important;
	}
	.squad-divider {
		height: 1px;
		background: rgba(255,255,255,0.1);
		margin: 28px 0 24px;
	}
	.squad-injuries-title {
		font-family: 'Inter', sans-serif;
		font-size: 18px;
		font-weight: 800;
		color: #ffffff;
		letter-spacing: -0.02em;
		margin-bottom: 14px;
	}
	.squad-legend {
		margin-top: 16px;
		font-family: 'DM Mono', monospace;
		font-size: 10px;
		color: rgba(255,160,160,0.5);
		letter-spacing: 0.06em;
	}

	/* ── MATCH PANEL (right) ── */
	.match-panel {
		padding: 40px 44px;
		display: flex;
		flex-direction: column;
		gap: 20px;
		background: rgba(255,255,255,0.55);
		backdrop-filter: blur(16px);
		-webkit-backdrop-filter: blur(16px);
	}

	/* ── TICKET ── */
	.ticket {
		border-radius: 16px;
		overflow: hidden;
		border: 1px solid rgba(255,255,255,0.15);
		box-shadow: 0 8px 32px rgba(0,0,0,0.25);
		background: url('/fondo-card-partido-sin texto.png') center / cover no-repeat;
		position: relative;
		aspect-ratio: 1672 / 580;
		display: grid;
		grid-template-columns: 1fr;
		grid-template-rows: 1fr auto;
	}
	.ticket::after {
		content: '';
		position: absolute;
		inset: 0;
		background: linear-gradient(to top, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.2) 45%, rgba(0,0,0,0) 65%);
		pointer-events: none;
	}

	.ticket-left {
		grid-column: 1; grid-row: 1;
		display: flex;
		flex-direction: row;
		align-items: center;
		justify-content: center;
		gap: 48px;
		padding: 20px 24px;
		position: relative;
		z-index: 2;
	}
	.ticket-teams {
		display: flex;
		flex-direction: column;
	}
	.ticket-team {
		font-family: 'Inter', sans-serif;
		font-size: 42px;
		font-weight: 900;
		color: #ffffff;
		letter-spacing: -0.03em;
		line-height: 0.8;
		text-shadow: 0 2px 12px rgba(0,0,0,0.4);
	}

	.ticket-right {
		display: flex;
		flex-direction: column;
		justify-content: center;
		gap: 4px;
	}
	.ticket-detail {
		font-family: 'Instrument Sans', sans-serif;
		font-size: 11px;
		font-weight: 500;
		color: rgba(255,255,255,0.85);
		line-height: 0.8rem;
	}

	.ticket-cd-panel {
		grid-column: 1 / -1;
		grid-row: 2;
		position: relative;
		z-index: 2;
		padding: 0px 24px 16px;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0px;
		text-align: center;
	}

	.tcd-eyebrow {
		font-family: 'Inter', monospace;
		font-size: 10px;
		letter-spacing: 0.18em;
		text-transform: uppercase;
		color: var(--amarillo);
	}

	.ticket-cd {
		display: flex;
		align-items: flex-end;
		gap: 6px;
	}
	.tcd-unit { display: flex; flex-direction: column; align-items: center; gap: 4px; }
	.tcd-num {
		font-family: 'DM Mono', monospace;
		font-size: 36px;
		font-weight: 700;
		line-height: 1;
		letter-spacing: -0.03em;
	}
	.tcd-lbl {
		font-family: 'DM Mono', monospace;
		font-size: 12px;
		color: rgba(255,255,255,0.5);
		letter-spacing: 0.1em;
		text-transform: uppercase;
	}
	.tcd-sep {
		font-family: 'DM Mono', monospace;
		font-size: 26px;
		color: rgba(255,255,255,0.25);
		padding-bottom: 18px;
		line-height: 1;
	}
	.tcd-meta {
		font-family: 'Instrument Sans', sans-serif;
		font-size: 13px;
		font-weight: 500;
		color: rgba(255,255,255,0.6);
	}

	.mp-cd-sweep {
		background: linear-gradient(90deg,
			rgba(255,255,255,0.5) 0%,
			rgba(255,255,255,1) 45%,
			rgba(255,255,255,0.5) 100%
		);
		background-size: 200% 100%;
		-webkit-background-clip: text;
		background-clip: text;
		-webkit-text-fill-color: transparent;
		animation: sweepLight 3s ease-in-out infinite;
	}
	@keyframes sweepLight {
		0%   { background-position: -100% 0; }
		60%  { background-position: 200% 0; }
		100% { background-position: 200% 0; }
	}

	.mp-block {
		background: rgba(255,255,255,0.65);
		border: 1px solid rgba(255,255,255,0.85);
		border-radius: 12px;
		padding: 22px 24px;
		position: relative;
		overflow: hidden;
		box-shadow: inset 0 1px 0 rgba(255,255,255,0.95);
	}
	.mp-section-title {
		font-family: 'Inter', sans-serif;
		font-size: 22px;
		font-weight: 900;
		letter-spacing: -0.02em;
		color: var(--text);
		margin-bottom: 14px;
		line-height: 1.1;
	}
	.mp-title-sm { font-size: 17px; }
	.mp-text {
		font-size: 14px;
		color: var(--text);
		line-height: 1.7;
	}

	.mp-injuries { display: flex; flex-direction: column; gap: 6px; }
	.inj-row {
		display: flex;
		gap: 10px;
		align-items: baseline;
		font-size: 13px;
	}
	.inj-name {
		font-family: 'Inter', sans-serif;
		font-weight: 700;
		color: #ffffff;
		white-space: nowrap;
		min-width: 130px;
	}
	.inj-detail { color: rgba(255,255,255,0.55); line-height: 1.5; font-size: 12px; }

	.mp-players { display: flex; flex-direction: column; gap: 6px; margin-top: 12px; }
	.mp-player {
		display: flex;
		gap: 10px;
		align-items: baseline;
		font-size: 13px;
		padding: 6px 10px;
		background: rgba(91,155,213,0.06);
		border-radius: 8px;
		border-left: 2px solid var(--celeste);
	}
	.mp-pname { font-weight: 700; color: var(--text); white-space: nowrap; }
	.mp-pinfo { color: var(--muted); font-size: 12px; }

	.mp-row-2 {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 14px;
	}
	.mp-alert { border-color: rgba(245,194,0,0.4) !important; }
	.mp-alert .mp-block-title { color: var(--amarillo-dim); }

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
		.hcd-timer { margin-left: 0; }
		.arg-section { grid-template-columns: 1fr; }
		.squad-panel { border-right: none; border-bottom: 1px solid rgba(255,255,255,0.1); padding: 36px 24px; }
		.match-panel { padding: 32px 24px; }
		.mp-row-2 { grid-template-columns: 1fr; }
		.mp-countdown { flex-direction: column; align-items: flex-start; }
		.mp-cd-timer { margin-top: 8px; }
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
