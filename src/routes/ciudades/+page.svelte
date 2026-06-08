<div class="section">
	<div class="section-hero-label">Sedes seleccionadas</div>
	<div class="section-title">Ciudades sede</div>
	<div class="section-subtitle">Dos de las 16 ciudades del Mundial 2026 donde se disputarán los partidos de los grupos en foco.</div>

	<div class="cities-grid">
		<!-- DALLAS -->
		<div class="city-card">
			<div class="city-card-header">
				<div class="city-name">Dallas</div>
				<div class="city-stadium">AT&amp;T Stadium · "Jerry World"</div>
				<div class="city-arge-badge">🇦🇷 3 partidos de Argentina</div>
			</div>
			<div class="city-card-body">
				<div class="city-stat-row"><span class="city-stat-label">Estado</span><span class="city-stat-value">Texas</span></div>
				<div class="city-stat-row"><span class="city-stat-label">Capacidad</span><span class="city-stat-value">105.000 personas</span></div>
				<div class="city-stat-row"><span class="city-stat-label">Temperatura junio</span><span class="city-stat-value">38°C promedio</span></div>
				<div class="city-stat-row"><span class="city-stat-label">Distancia desde BUE</span><span class="city-stat-value">10.300 km · 13 hs de vuelo</span></div>
				<div class="city-stat-row"><span class="city-stat-label">Costo vuelo (aprox.)</span><span class="city-stat-value">~USD 2.500 ida y vuelta</span></div>
				<div class="city-stat-row"><span class="city-stat-label">Voto 2024</span><span class="city-stat-value">Texas → Trump 57% · Dallas → Harris 65%</span></div>
				<div class="city-highlight">
					<strong>Dato político.</strong> Texas votó Trump con el 57%. Pero Dallas es la gran excepción: una ciudad demócrata en un estado rojo. El estadio se llama AT&T Stadium pero la gente le dice <strong>Jerry World</strong> por el dueño de los Dallas Cowboys, que invirtió USD 1.200 millones en construirlo.
				</div>
				<div class="city-highlight" style="margin-top:10px;">
					<strong>Para el hincha argentino.</strong> USD 2.500 de vuelo equivalen a 8 salarios mínimos en Argentina. Para un suizo, son 5 días de trabajo.
				</div>
			</div>
		</div>

		<!-- LOS ANGELES -->
		<div class="city-card">
			<div class="city-card-header">
				<div class="city-name">Los Ángeles</div>
				<div class="city-stadium">SoFi Stadium · El más caro del mundo</div>
			</div>
			<div class="city-card-body">
				<div class="city-stat-row"><span class="city-stat-label">Estado</span><span class="city-stat-value">California</span></div>
				<div class="city-stat-row"><span class="city-stat-label">Capacidad</span><span class="city-stat-value">70.240 personas</span></div>
				<div class="city-stat-row"><span class="city-stat-label">Temperatura junio</span><span class="city-stat-value">25°C promedio</span></div>
				<div class="city-stat-row"><span class="city-stat-label">Distancia desde BUE</span><span class="city-stat-value">11.700 km · 15 hs de vuelo</span></div>
				<div class="city-stat-row"><span class="city-stat-label">Costo estadio</span><span class="city-stat-value">USD 5.500 millones</span></div>
				<div class="city-stat-row"><span class="city-stat-label">Voto 2024</span><span class="city-stat-value">California → Harris 65%</span></div>
				<div class="city-highlight">
					<strong>El estadio más caro del mundo.</strong> SoFi Stadium costó USD 5.500 millones — más que el PIB anual de varios países del torneo. Se terminó en 2020, en plena pandemia.
				</div>
				<div class="city-highlight" style="margin-top:10px;">
					<strong>La ciudad más latina del mundo anglófono.</strong> Los Ángeles tiene 4,9 millones de hispanos. Para muchos países de América del Sur, jugar en LA es casi jugar de local. California es la 5ª economía del planeta si fuera un país independiente.
				</div>
			</div>
		</div>
	</div>

	<p class="nota">Datos: FIFA World Cup 2026 · US Census Bureau · OpenFlights.org (distancias) · Associated Press (precios de vuelos estimados).</p>
</div>

<style>
	.cities-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
	.city-card { background: var(--bg-card); border: 1px solid var(--border); border-radius: 14px; overflow: hidden; }
	.city-card-header { background: var(--bg-card2); padding: 20px; border-bottom: 1px solid var(--border); }
	.city-name { font-family: 'Inter', sans-serif; font-size: 28px; font-weight: 800; letter-spacing: -0.02em; }
	.city-stadium { font-family: 'DM Mono', monospace; font-size: 11px; color: var(--celeste); letter-spacing: 0.1em; text-transform: uppercase; margin-top: 4px; }
	.city-card-body { padding: 20px; }
	.city-stat-row { display: flex; justify-content: space-between; align-items: center; padding: 10px 0; border-bottom: 1px solid var(--border); font-size: 13px; }
	.city-stat-row:last-of-type { border-bottom: none; }
	.city-stat-label { color: var(--muted); }
	.city-stat-value { font-family: 'DM Mono', monospace; font-size: 12px; color: var(--text); }
	.city-highlight { background: rgba(91, 155, 213, 0.06); border: 1px solid rgba(91, 155, 213, 0.2); border-radius: 8px; padding: 14px; margin-top: 14px; font-size: 13px; line-height: 1.6; color: var(--text); }
	.city-highlight strong { color: var(--celeste); }
	.city-arge-badge { display: inline-block; font-family: 'DM Mono', monospace; font-size: 9px; letter-spacing: 0.1em; text-transform: uppercase; background: var(--celeste); color: #fff; padding: 3px 8px; border-radius: 20px; margin-top: 6px; }
	@media (max-width: 900px) { .cities-grid { grid-template-columns: 1fr; } }
</style>
