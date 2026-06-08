<script lang="ts">
	import { COUNTRIES } from '$lib/data';
	import type { Country } from '$lib/types';

	let activeGroup = 'all';
	let selectedCode: string | null = null;

	$: filtered = Object.entries(COUNTRIES).filter(([, c]) => activeGroup === 'all' || c.group === activeGroup);
	$: selected = selectedCode ? COUNTRIES[selectedCode] : null;

	function close() { selectedCode = null; }
	function onOverlayClick(e: MouseEvent) { if (e.target === e.currentTarget) close(); }
</script>

<div class="section">
	<div class="section-hero-label">Fichas editoriales</div>
	<div class="section-title">Los 16 países</div>
	<div class="section-subtitle">Grupos A, B, C y J. Hacé clic en un país para ver su ficha completa.</div>

	<div class="country-cards-filter">
		{#each ['all', 'A', 'B', 'C', 'J'] as g}
			<button class="filter-btn" class:active={activeGroup === g} on:click={() => (activeGroup = g)}>
				{g === 'all' ? 'Todos' : `Grupo ${g}`}
			</button>
		{/each}
	</div>

	<div class="country-cards-grid">
		{#each filtered as [code, c]}
			<div
				class="country-card"
				role="button"
				tabindex="0"
				on:click={() => (selectedCode = code)}
				on:keypress={() => (selectedCode = code)}
			>
				<div class="country-card-flag">{c.flag}</div>
				<div class="country-card-name">{c.name}</div>
				<div class="country-card-group">Grupo {c.group}{c.autocracy ? ' · ★ Autocracia' : ''}</div>
				<div class="country-card-govt">{c.govt}</div>
				<div class="country-card-stats">
					<span class="country-stat-pill">Aprob. {c.aprobacion}%</span>
					<span class="country-stat-pill">PIB ${Math.round(c.pib / 1000)}K</span>
				</div>
			</div>
		{/each}
	</div>
</div>

<!-- Modal -->
{#if selected}
	{@const c = selected as Country}
	<!-- svelte-ignore a11y-click-events-have-key-events a11y-no-static-element-interactions -->
	<div class="country-expanded" on:click={onOverlayClick} role="dialog" aria-modal="true" tabindex="-1">
		<div class="country-expanded-inner">
			<button class="country-expanded-close" on:click={close}>✕ Cerrar</button>
			<span class="country-exp-flag">{c.flag}</span>
			<div class="country-exp-name">{c.name}</div>
			<div class="country-exp-group">Grupo {c.group} · {c.govt}</div>
			{#if c.autocracy}
				<div class="autocracy-warning">★ Autocracia o monarquía no electoral — los datos de aprobación deben leerse con cautela.</div>
			{/if}
			<div class="country-exp-stats">
				<div class="country-exp-stat"><div class="country-exp-stat-num">{c.aprobacion}%</div><div class="country-exp-stat-label">Aprobación</div></div>
				<div class="country-exp-stat"><div class="country-exp-stat-num">{c.prensa}°</div><div class="country-exp-stat-label">Prensa RSF</div></div>
				<div class="country-exp-stat"><div class="country-exp-stat-num">${Math.round(c.pib / 1000)}K</div><div class="country-exp-stat-label">PIB p/c</div></div>
				<div class="country-exp-stat"><div class="country-exp-stat-num">{c.pobreza}%</div><div class="country-exp-stat-label">Pobreza</div></div>
				<div class="country-exp-stat"><div class="country-exp-stat-num">{c.gini}</div><div class="country-exp-stat-label">Gini</div></div>
				<div class="country-exp-stat"><div class="country-exp-stat-num">{c.pisa}</div><div class="country-exp-stat-label">PISA</div></div>
			</div>
			<div class="country-exp-section" style="margin-top:20px;"><div class="country-exp-label">Situación económica</div><div class="country-exp-value">{c.economia}</div></div>
			<div class="country-exp-section"><div class="country-exp-label">Relación con Argentina</div><div class="country-exp-value">{c.relacion}</div></div>
			<div class="country-exp-section"><div class="country-exp-label">Dato político clave</div><div class="country-exp-value">{c.politico}</div></div>
			<div class="country-exp-section"><div class="country-exp-label">Lifestyle</div><div class="country-exp-value">{c.feriados} feriados anuales · {c.cerveza}L cerveza p/c</div></div>
		</div>
	</div>
{/if}

<style>
	.country-cards-filter { display: flex; gap: 8px; margin-bottom: 20px; flex-wrap: wrap; }
	.country-cards-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 10px; }
	.country-card { background: var(--bg-card); border: 1px solid var(--border); border-radius: 12px; padding: 16px; cursor: pointer; transition: all 0.2s; }
	.country-card:hover { border-color: rgba(91, 155, 213, 0.4); transform: translateY(-1px); }
	.country-card-flag { font-size: 28px; margin-bottom: 10px; }
	.country-card-name { font-family: 'Inter', sans-serif; font-size: 15px; font-weight: 800; margin-bottom: 4px; }
	.country-card-group { font-family: 'Inter', monospace; font-size: 10px; color: var(--celeste); letter-spacing: 0.1em; text-transform: uppercase; }
	.country-card-govt { font-size: 12px; color: var(--muted); margin-top: 6px; line-height: 1.4; }
	.country-card-stats { display: flex; gap: 8px; margin-top: 10px; flex-wrap: wrap; }
	.country-stat-pill { font-family: 'Inter', monospace; font-size: 10px; background: var(--bg-card2); border: 1px solid var(--border); padding: 3px 8px; border-radius: 20px; color: var(--muted); }

	.country-expanded { position: fixed; inset: 0; background: rgba(0, 0, 0, 0.85); z-index: 500; display: flex; align-items: center; justify-content: center; padding: 20px; }
	.country-expanded-inner { background: var(--bg-card); border: 1px solid var(--border); border-radius: 16px; max-width: 600px; width: 100%; max-height: 85vh; overflow-y: auto; padding: 28px; }
	.country-expanded-close { float: right; font-family: 'Inter', monospace; font-size: 11px; cursor: pointer; border: 1px solid var(--border); padding: 4px 10px; border-radius: 20px; background: none; color: var(--text); }
	.country-expanded-close:hover { border-color: var(--celeste); color: var(--celeste); }
	.country-exp-flag { font-size: 48px; display: block; margin-bottom: 12px; }
	.country-exp-name { font-family: 'Inter', sans-serif; font-size: 28px; font-weight: 800; margin-bottom: 4px; }
	.country-exp-group { font-family: 'Inter', monospace; font-size: 11px; color: var(--celeste); letter-spacing: 0.12em; text-transform: uppercase; margin-bottom: 16px; }
	.country-exp-section { margin-bottom: 16px; }
	.country-exp-label { font-family: 'Inter', monospace; font-size: 10px; color: var(--muted); letter-spacing: 0.12em; text-transform: uppercase; margin-bottom: 4px; }
	.country-exp-value { font-size: 14px; line-height: 1.6; color: var(--text); }
	.country-exp-stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin-top: 16px; }
	.country-exp-stat { background: var(--bg-card2); border-radius: 8px; padding: 12px; text-align: center; }
	.country-exp-stat-num { font-family: 'Inter', sans-serif; font-size: 18px; font-weight: 800; color: var(--celeste); }
	.country-exp-stat-label { font-family: 'Inter', monospace; font-size: 10px; color: var(--muted); margin-top: 2px; }
	.autocracy-warning { background: rgba(255, 68, 68, 0.1); border: 1px solid rgba(255, 68, 68, 0.3); border-radius: 8px; padding: 10px 14px; font-family: 'Inter', monospace; font-size: 11px; color: var(--red); margin-top: 12px; }

	@media (max-width: 640px) {
		.country-cards-grid { grid-template-columns: 1fr 1fr; }
		.country-exp-stats { grid-template-columns: 1fr 1fr; }
	}
</style>
