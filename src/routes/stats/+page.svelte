<script lang="ts">
	import { STATS_DATA } from '$lib/data';
</script>

<div class="section">
	<div class="section-hero-label">Datos que nadie te contó</div>
	<div class="section-title">Estadísticas</div>
	<div class="section-subtitle">Ocho cruces de datos sobre el Mundial 2026 que no vas a ver en el programa oficial.</div>

	<div class="stats-grid">
		{#each STATS_DATA as s}
			<div class="stat-card">
				<div class="stat-card-emoji">{s.emoji}</div>
				<div class="stat-card-title">{s.title}</div>
				<div class="stat-card-text">{s.text}</div>
				{#if s.highlight}
					<span class="stat-card-highlight">{s.highlight}</span>
				{/if}
			</div>
		{/each}
	</div>

	<p class="nota">Fuentes mezcladas: FIFA · Banco Mundial · RSF · Gallup · FMI · OCDE · OpenFlights · WHO. Algunos datos son estimaciones editoriales.</p>
</div>

<style>
	.stats-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 12px; }
	.stat-card { background: var(--bg-card); border: 1px solid var(--border); border-radius: 12px; padding: 20px; }
	.stat-card-emoji { font-size: 24px; margin-bottom: 12px; }
	.stat-card-title { font-family: 'Inter', sans-serif; font-size: 15px; font-weight: 800; margin-bottom: 8px; color: var(--celeste); }
	.stat-card-text { font-size: 13px; color: var(--text); line-height: 1.6; }
	.stat-card-highlight { font-family: 'DM Mono', monospace; font-size: 18px; font-weight: 500; color: var(--celeste); display: block; margin-top: 8px; }
</style>
