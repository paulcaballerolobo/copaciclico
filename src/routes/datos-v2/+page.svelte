<script lang="ts">
	import { currentVar } from '$lib/stores';
	import { COUNTRIES, GROUPS, VARIABLES, EDITORIAL, getMetric } from '$lib/data';
	import type { Variable } from '$lib/types';

	// ── PANTALLAS ─────────────────────────────────────────────────
	// 0: hero  1: índices  2: grupos  3: resultados
	let screen = 0;

	function go(n: number) { screen = n; }

	// ── ÍNDICES ───────────────────────────────────────────────────
	function getVarConfig(varId: string): Variable | null {
		for (const cat of VARIABLES.cats) {
			for (const v of cat.vars) {
				if (v.id === varId) return v;
			}
		}
		return null;
	}
	function pickIndex(id: string) {
		currentVar.set(id);
		go(2); // ir a grupos
	}

	// ── GRUPOS ────────────────────────────────────────────────────
	const allGroupKeys = Object.keys(GROUPS) as string[];
	let selectedGroups: string[] = [];

	function toggleGroup(key: string) {
		if (selectedGroups.includes(key)) {
			selectedGroups = selectedGroups.filter(k => k !== key);
		} else {
			if (selectedGroups.length >= 2) selectedGroups = [selectedGroups[1], key];
			else selectedGroups = [...selectedGroups, key];
		}
	}

	// ── DATOS ─────────────────────────────────────────────────────
	function getMaxVal(varId: string) {
		return Math.max(0, ...Object.values(COUNTRIES).map(c => getMetric(c, varId)));
	}
	function getMinVal(varId: string) {
		return Math.min(...Object.values(COUNTRIES).map(c => getMetric(c, varId)));
	}
	function rankGroup(groupKey: string, varId: string): string[] {
		const cfg = getVarConfig(varId);
		return [...GROUPS[groupKey].countries].sort((a, b) => {
			const va = getMetric(COUNTRIES[a], varId);
			const vb = getMetric(COUNTRIES[b], varId);
			return cfg?.dir === 'asc' ? va - vb : vb - va;
		});
	}
	function calcBar(val: number, varId: string): number {
		const cfg = getVarConfig(varId);
		const max = getMaxVal(varId);
		const min = cfg?.dir === 'asc' ? getMinVal(varId) : 0;
		if (max <= min) return 0;
		return cfg?.dir === 'asc'
			? Math.round(((max - val) / (max - min)) * 100)
			: Math.round((val / max) * 100);
	}

	$: varCfg = getVarConfig($currentVar);
	$: editorialMap = EDITORIAL[$currentVar] ?? {};
	$: canSeeResults = selectedGroups.length >= 1;
</script>

<svelte:head><title>El Mundial de los Datos — Cíclico</title></svelte:head>

<div class="mv-shell">

	<!-- ══ SLIDES ══ -->
	<div class="mv-slides" style="transform: translateX({screen * -100}%)">

		<!-- ── 0: HERO ── -->
		<div class="mv-slide mv-hero">
			<div class="mv-hero-content">
				<div class="mv-hero-eyebrow">Cíclico · 2026</div>
				<h1 class="mv-hero-title">Mundial<br>de los datos</h1>
				<p class="mv-hero-sub">Elegí los datos que te interesen y descubrí si tu equipo ganaría con ellos.</p>
				<button class="mv-hero-btn" on:click={() => go(1)}>
					Elegir índice
					<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
				</button>
			</div>
			<div class="mv-hero-bg-text" aria-hidden="true">2026</div>
		</div>

		<!-- ── 1: ÍNDICES ── -->
		<div class="mv-slide mv-screen">
			<div class="mv-screen-top">
				<button class="mv-back" on:click={() => go(0)}>←</button>
				<div>
					<div class="mv-eyebrow">Paso 1</div>
					<h2 class="mv-screen-title">¿Qué índice?</h2>
				</div>
			</div>

			<div class="mv-indices-list">
				{#each VARIABLES.cats as cat}
					<div class="mv-cat-label">{cat.label}</div>
					{#each cat.vars as v}
						<button
							class="mv-var-btn"
							class:active={$currentVar === v.id}
							class:locked={v.locked}
							disabled={!!v.locked}
							on:click={() => { if (!v.locked) pickIndex(v.id); }}
						>
							<span class="mv-var-name">{v.label}{v.locked ? ' 🔒' : ''}</span>
							{#if v.desc}<span class="mv-var-desc">{v.desc}</span>{/if}
						</button>
					{/each}
				{/each}
			</div>
		</div>

		<!-- ── 2: GRUPOS ── -->
		<div class="mv-slide mv-screen">
			<div class="mv-screen-top">
				<button class="mv-back" on:click={() => go(1)}>←</button>
				<div>
					<div class="mv-eyebrow">Paso 2</div>
					<h2 class="mv-screen-title">¿Qué grupos?</h2>
				</div>
			</div>
			<p class="mv-screen-sub">Tocá hasta dos grupos para comparar.</p>

			<div class="mv-groups-list">
				{#each allGroupKeys as key}
					{@const ranked = rankGroup(key, $currentVar)}
					<button
						class="mv-group-block"
						class:sel={selectedGroups.includes(key)}
						on:click={() => toggleGroup(key)}
					>
						<div class="mv-group-block-header">
							<span class="mv-group-block-label">Grupo {key}</span>
							{#if selectedGroups.includes(key)}
								<span class="mv-group-sel-dot"></span>
							{/if}
						</div>
						<div class="mv-group-block-countries">
							{#each ranked as code, idx}
								{@const c = COUNTRIES[code]}
								<div class="mv-group-block-row">
									<span class="mv-gbr-pos" class:g={idx===0}>{idx+1}</span>
									<span class="mv-gbr-flag">{c.flag}</span>
									<span class="mv-gbr-name">{c.name}</span>
								</div>
							{/each}
						</div>
					</button>
				{/each}
			</div>

			{#if canSeeResults}
				<div class="mv-screen-cta">
					<button class="mv-cta-btn" on:click={() => go(3)}>
						Ver resultados →
					</button>
				</div>
			{/if}
		</div>

		<!-- ── 3: RESULTADOS ── -->
		<div class="mv-slide mv-screen">
			<div class="mv-screen-top">
				<button class="mv-back" on:click={() => go(2)}>←</button>
				<div>
					<div class="mv-eyebrow">Resultados</div>
					<h2 class="mv-screen-title">{varCfg?.label ?? ''}</h2>
				</div>
			</div>

			<div class="mv-results-list">
				{#each (selectedGroups.length ? selectedGroups : allGroupKeys.slice(0,2)) as gk}
					{@const ranked = rankGroup(gk, $currentVar)}
					{@const editorial = editorialMap[gk]}
					<div class="mv-result-card">
						<!-- Header del card -->
						<div class="mv-rc-header">
							<span class="mv-rc-group">Grupo {gk}</span>
							<span class="mv-rc-index">{varCfg?.label ?? $currentVar}</span>
						</div>

						<!-- Tabla de países -->
						<div class="mv-rc-rows">
							{#each ranked as code, idx}
								{@const c = COUNTRIES[code]}
								{@const val = getMetric(c, $currentVar)}
								<div class="mv-rc-row">
									<span class="mv-rc-pos" class:gold={idx===0} class:silver={idx===1}>{idx+1}</span>
									<span class="mv-rc-flag">{c.flag}</span>
									<div class="mv-rc-name-wrap">
										<span class="mv-rc-name">{c.name}</span>
										<div class="mv-rc-bar"><div class="mv-rc-bar-fill" style="width:{calcBar(val,$currentVar)}%"></div></div>
									</div>
									<span class="mv-rc-val">{val.toLocaleString('es-AR')}{varCfg?.unit ?? ''}</span>
								</div>
							{/each}
						</div>

						<!-- Análisis editorial destacado -->
						{#if editorial}
							<div class="mv-rc-analysis">
								<div class="mv-rc-analysis-label">Análisis</div>
								<p class="mv-rc-analysis-text">{editorial}</p>
							</div>
						{/if}
					</div>
				{/each}

				{#if varCfg?.source}
					<div class="mv-source">
						<span class="mv-source-label">Fuente</span>
						<span class="mv-source-text">{varCfg.source}</span>
					</div>
				{/if}
			</div>
		</div>

	</div><!-- /slides -->

	<!-- ══ DOTS DE PROGRESO ══ -->
	<div class="mv-progress">
		{#each [0,1,2,3] as i}
			<button class="mv-pdot" class:active={screen === i} on:click={() => go(i)}></button>
		{/each}
	</div>

</div>

<style>
	/* ── SHELL ── */
	.mv-shell {
		display: flex;
		flex-direction: column;
		height: calc(100dvh - 52px);
		overflow: hidden;
		background: #060e1a;
		--celeste: #5b9bd5;
		--amarillo: #f5c200;
		color: #e8edf5;
		position: relative;
	}

	/* ── SLIDES ── */
	.mv-slides {
		display: flex;
		flex: 1;
		min-height: 0;
		transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1);
	}
	.mv-slide {
		min-width: 100%;
		overflow-y: auto;
		scrollbar-width: none;
	}
	.mv-slide::-webkit-scrollbar { display: none; }

	/* ── HERO ── */
	.mv-hero {
		display: flex;
		align-items: flex-end;
		padding: 0 28px 48px;
		position: relative;
		overflow: hidden;
		background: linear-gradient(160deg, #051020 0%, #0a1e3a 60%, #061428 100%);
	}
	.mv-hero-bg-text {
		position: absolute;
		right: -20px; bottom: -40px;
		font-family: 'Inter', sans-serif;
		font-size: 200px; font-weight: 900;
		color: rgba(91,155,213,0.07);
		line-height: 1;
		pointer-events: none;
		user-select: none;
		letter-spacing: -0.06em;
	}
	.mv-hero-content {
		display: flex; flex-direction: column; gap: 16px;
		position: relative; z-index: 1;
	}
	.mv-hero-eyebrow {
		font-family: 'Inter', monospace;
		font-size: 11px; font-weight: 700;
		letter-spacing: 0.18em; text-transform: uppercase;
		color: var(--celeste);
	}
	.mv-hero-title {
		font-family: 'Inter', sans-serif;
		font-size: 52px; font-weight: 900;
		line-height: 0.95; letter-spacing: -0.04em;
		color: #fff; margin: 0;
	}
	.mv-hero-sub {
		font-size: 15px; color: rgba(232,237,245,0.65);
		line-height: 1.5; margin: 0; max-width: 300px;
	}
	.mv-hero-btn {
		display: inline-flex; align-items: center; gap: 10px;
		align-self: flex-start;
		background: var(--celeste);
		color: #fff;
		border: none; border-radius: 14px;
		padding: 14px 22px;
		font-family: 'Inter', sans-serif;
		font-size: 15px; font-weight: 700;
		cursor: pointer;
		margin-top: 8px;
		transition: opacity 0.2s;
	}
	.mv-hero-btn:active { opacity: 0.85; }
	.mv-hero-btn svg { width: 18px; height: 18px; }

	/* ── SCREENS GENERALES ── */
	.mv-screen {
		display: flex; flex-direction: column;
		padding: 20px 20px 16px;
		gap: 14px;
	}
	.mv-screen-top {
		display: flex; align-items: flex-start; gap: 12px;
		flex-shrink: 0;
	}
	.mv-back {
		background: rgba(255,255,255,0.08);
		border: none; border-radius: 10px;
		padding: 8px 12px;
		color: rgba(232,237,245,0.6);
		font-size: 16px; cursor: pointer;
		flex-shrink: 0; margin-top: 2px;
		transition: background 0.15s;
	}
	.mv-back:active { background: rgba(255,255,255,0.15); }
	.mv-eyebrow {
		font-family: 'Inter', monospace;
		font-size: 10px; font-weight: 700;
		letter-spacing: 0.18em; text-transform: uppercase;
		color: var(--celeste);
	}
	.mv-screen-title {
		font-family: 'Inter', sans-serif;
		font-size: 28px; font-weight: 900;
		letter-spacing: -0.03em; margin: 2px 0 0; color: #fff;
	}
	.mv-screen-sub { font-size: 13px; color: rgba(232,237,245,0.45); margin: -4px 0 0; flex-shrink: 0; }

	/* ── ÍNDICES ── */
	.mv-indices-list {
		display: flex; flex-direction: column; gap: 4px;
		flex: 1; overflow-y: auto;
		padding-bottom: 12px;
	}
	.mv-cat-label {
		font-family: 'Inter', monospace; font-size: 9px;
		letter-spacing: 0.14em; text-transform: uppercase;
		color: rgba(232,237,245,0.28);
		padding: 12px 0 6px;
	}
	.mv-var-btn {
		background: rgba(255,255,255,0.05);
		border: 1px solid rgba(255,255,255,0.08);
		border-radius: 12px;
		padding: 13px 16px;
		text-align: left;
		cursor: pointer;
		display: flex; flex-direction: column; gap: 3px;
		transition: all 0.15s;
	}
	.mv-var-btn.active { border-color: var(--celeste); background: rgba(91,155,213,0.14); }
	.mv-var-btn.locked { opacity: 0.28; cursor: default; }
	.mv-var-btn:not(.locked):active { background: rgba(255,255,255,0.1); }
	.mv-var-name { font-family: 'Inter', monospace; font-size: 14px; font-weight: 600; color: #fff; }
	.mv-var-desc { font-size: 11px; color: rgba(232,237,245,0.4); }

	/* ── GRUPOS ── */
	.mv-groups-list {
		display: flex; flex-direction: column; gap: 10px;
		flex: 1; overflow-y: auto;
		padding-bottom: 8px;
	}
	.mv-group-block {
		background: rgba(255,255,255,0.05);
		border: 2px solid rgba(255,255,255,0.07);
		border-radius: 14px;
		padding: 0;
		text-align: left;
		cursor: pointer;
		overflow: hidden;
		transition: border-color 0.2s, background 0.2s;
		flex-shrink: 0;
	}
	.mv-group-block.sel {
		border-color: var(--celeste);
		background: rgba(91,155,213,0.08);
	}
	.mv-group-block-header {
		display: flex; align-items: center; justify-content: space-between;
		padding: 12px 16px 10px;
		border-bottom: 1px solid rgba(255,255,255,0.06);
	}
	.mv-group-block-label {
		font-family: 'Inter', monospace;
		font-size: 11px; font-weight: 700;
		letter-spacing: 0.14em; text-transform: uppercase;
		color: rgba(232,237,245,0.7);
	}
	.mv-group-block.sel .mv-group-block-label { color: var(--celeste); }
	.mv-group-sel-dot {
		width: 8px; height: 8px; border-radius: 50%;
		background: var(--celeste); flex-shrink: 0;
	}
	.mv-group-block-countries { padding: 8px 0; }
	.mv-group-block-row {
		display: flex; align-items: center; gap: 10px;
		padding: 6px 16px;
	}
	.mv-gbr-pos {
		font-family: 'DM Mono', monospace; font-size: 11px;
		color: rgba(232,237,245,0.3); width: 14px; flex-shrink: 0;
	}
	.mv-gbr-pos.g { color: var(--celeste); font-weight: 700; }
	.mv-gbr-flag { font-size: 18px; flex-shrink: 0; }
	.mv-gbr-name { font-size: 14px; font-weight: 600; color: rgba(232,237,245,0.85); }

	.mv-screen-cta { flex-shrink: 0; padding-top: 4px; }
	.mv-cta-btn {
		width: 100%;
		background: var(--celeste); color: #fff;
		border: none; border-radius: 14px;
		padding: 15px;
		font-family: 'Inter', sans-serif; font-size: 15px; font-weight: 700;
		cursor: pointer;
	}
	.mv-cta-btn:active { opacity: 0.88; }

	/* ── RESULTADOS ── */
	.mv-results-list {
		display: flex; flex-direction: column; gap: 16px;
		flex: 1; overflow-y: auto;
		padding-bottom: 16px;
	}
	.mv-result-card {
		background: #fff;
		border-radius: 16px;
		overflow: hidden;
		flex-shrink: 0;
		box-shadow: 0 4px 20px rgba(0,0,0,0.2);
	}
	.mv-rc-header {
		background: linear-gradient(135deg, #0d2a4a, #0a1f3a);
		padding: 14px 18px;
		display: flex; flex-direction: column; gap: 3px;
	}
	.mv-rc-group {
		font-family: 'Inter', monospace; font-size: 10px; font-weight: 700;
		letter-spacing: 0.16em; text-transform: uppercase;
		color: rgba(91,155,213,0.8);
	}
	.mv-rc-index {
		font-family: 'Inter', sans-serif; font-size: 18px; font-weight: 900;
		color: #fff; letter-spacing: -0.02em;
	}
	.mv-rc-rows { padding: 4px 0; }
	.mv-rc-row {
		display: flex; align-items: center; gap: 10px;
		padding: 10px 18px;
		border-bottom: 1px solid rgba(0,0,0,0.05);
		color: #111;
	}
	.mv-rc-row:last-child { border-bottom: none; }
	.mv-rc-pos {
		font-family: 'DM Mono', monospace; font-size: 11px;
		color: #bbb; width: 14px; flex-shrink: 0;
	}
	.mv-rc-pos.gold { color: var(--celeste); font-weight: 700; }
	.mv-rc-pos.silver { color: #aaa; }
	.mv-rc-flag { font-size: 20px; flex-shrink: 0; }
	.mv-rc-name-wrap { flex: 1; min-width: 0; }
	.mv-rc-name {
		font-family: 'Inter', sans-serif; font-size: 14px; font-weight: 800;
		display: block; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
	}
	.mv-rc-bar { height: 4px; background: rgba(0,0,0,0.07); border-radius: 2px; margin-top: 5px; }
	.mv-rc-bar-fill { height: 100%; background: var(--celeste); border-radius: 2px; transition: width 0.8s cubic-bezier(0.4,0,0.2,1); }
	.mv-rc-val { font-family: 'DM Mono', monospace; font-size: 11px; color: var(--celeste); flex-shrink: 0; }

	/* Análisis destacado */
	.mv-rc-analysis {
		background: linear-gradient(135deg, #f0f7ff, #e8f2fc);
		border-top: 2px solid rgba(91,155,213,0.2);
		padding: 16px 18px;
		display: flex; flex-direction: column; gap: 6px;
	}
	.mv-rc-analysis-label {
		font-family: 'Inter', monospace; font-size: 9px; font-weight: 700;
		letter-spacing: 0.18em; text-transform: uppercase;
		color: var(--celeste);
	}
	.mv-rc-analysis-text {
		font-size: 13px; color: #1a2d44; line-height: 1.6; margin: 0;
		font-style: italic;
	}

	.mv-source {
		display: flex; gap: 8px; flex-wrap: wrap; align-items: baseline;
		padding: 4px 0 8px;
	}
	.mv-source-label {
		font-family: 'Inter', monospace; font-size: 9px; letter-spacing: 0.12em;
		text-transform: uppercase; color: rgba(232,237,245,0.28); flex-shrink: 0;
	}
	.mv-source-text { font-size: 11px; color: rgba(232,237,245,0.4); }

	/* ── DOTS PROGRESO ── */
	.mv-progress {
		display: flex; justify-content: center; gap: 7px;
		padding: 8px 0 10px;
		flex-shrink: 0;
	}
	.mv-pdot {
		width: 6px; height: 6px; border-radius: 50%;
		background: rgba(255,255,255,0.18);
		border: none; cursor: pointer; padding: 0;
		transition: background 0.2s, transform 0.2s, width 0.2s;
	}
	.mv-pdot.active {
		background: var(--celeste);
		width: 20px; border-radius: 3px;
	}
</style>
