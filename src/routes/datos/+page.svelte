<script lang="ts">
	import { currentVar } from '$lib/stores';
	import { COUNTRIES, GROUPS, VARIABLES, EDITORIAL, getMetric } from '$lib/data';
	import type { Variable } from '$lib/types';
	import { fly, fade } from 'svelte/transition';
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';

	onMount(() => {
		if (window.innerWidth < 768) goto('/datos-v2', { replaceState: true });
	});

	const allGroupKeys = Object.keys(GROUPS) as string[];
	let activeGroups: string[] = allGroupKeys.slice(0, 3); // default: A, B, C

	function toggleGroup(key: string) {
		if (activeGroups.includes(key)) {
			if (activeGroups.length === 1) return; // mínimo 1 activo
			activeGroups = activeGroups.filter((k) => k !== key);
		} else {
			if (activeGroups.length >= 3) return; // máximo 3
			activeGroups = [...activeGroups, key];
		}
	}

	function groupCountryNames(key: string): string {
		return GROUPS[key].countries.map((c) => COUNTRIES[c].name).join(' · ');
	}

	function getVarConfig(varId: string): Variable | null {
		for (const cat of VARIABLES.cats) {
			for (const v of cat.vars) {
				if (v.id === varId) return v;
			}
		}
		return null;
	}

	function getMaxVal(varId: string): number {
		return Math.max(0, ...Object.values(COUNTRIES).map((c) => getMetric(c, varId)));
	}

	function getMinVal(varId: string): number {
		const vals = Object.values(COUNTRIES).map((c) => getMetric(c, varId));
		return Math.min(...vals);
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

	function compartir() {
		// Primer grupo activo y su país líder en el índice actual
		const primerGrupo = visibleGroups[0];
		const ranked = rankGroup(primerGrupo, $currentVar);
		const pais1 = COUNTRIES[ranked[0]]?.name ?? '';
		const val1 = getMetric(COUNTRIES[ranked[0]], $currentVar);
		const unit = varCfg?.unit ?? '';
		const indiceLabel = varCfg?.label ?? $currentVar;
		const valStr = val1 ? ` (${val1.toLocaleString('es-AR')}${unit})` : '';

		// URL con estado: grupos e índice codificados
		const base = window.location.origin + window.location.pathname;
		const params = new URLSearchParams({
			grupos: activeGroups.join(','),
			indice: $currentVar
		});
		const url = `${base}?${params.toString()}`;

		const text = `En el #Mundial2026 de los datos, ${pais1}${valStr} gana el Grupo ${primerGrupo} en ${indiceLabel}. El torneo reimaginado por @esciclico →`;

		window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text + ' ' + url)}`, '_blank');
	}

	$: varCfg = getVarConfig($currentVar);
	$: editorialMap = EDITORIAL[$currentVar] ?? {};
	$: visibleGroups = allGroupKeys.filter((k) => activeGroups.includes(k));
	$: hasAutocracy = visibleGroups.some((gk) =>
		GROUPS[gk].countries.some((code) => COUNTRIES[code].autocracy)
	);
</script>

<div class="datos-layout">

	<!-- SIDEBAR -->
	<aside class="sidebar">

		<!-- Card Grupos -->
		<div class="sidebar-card grupos-card">
			<div class="sidebar-card-title">Grupos</div>
			<p class="sidebar-card-instruction">Elegí hasta 3 para comparar.</p>
			<div class="group-chips">
				{#each allGroupKeys as key}
					<button
						class="group-chip"
						class:active={activeGroups.includes(key)}
						class:disabled={!activeGroups.includes(key) && activeGroups.length >= 3}
						data-countries={groupCountryNames(key)}
						on:click={() => toggleGroup(key)}
					>
						Grupo {key}
					</button>
				{/each}
			</div>
		</div>

		<!-- Card Índices -->
		<div class="sidebar-card indices-card">
			<div class="sidebar-card-title">Índices</div>
			<p class="sidebar-card-instruction">Elegí uno para ordenar el torneo.</p>
			<div class="var-cats">
				{#each VARIABLES.cats as cat}
					<div class="var-cat-label">{cat.label}</div>
					{#each cat.vars as v}
						<button
							class="var-btn"
							class:active={$currentVar === v.id}
							class:locked={v.locked}
							disabled={!!v.locked}
							on:click={() => { if (!v.locked) currentVar.set(v.id); }}
						>{v.label}{v.locked ? ' 🔒' : ''}</button>
					{/each}
				{/each}
			</div>
			</div>

	</aside>

	<!-- MAIN AREA -->
	<div class="main-area">

		<!-- Groups + editorial side by side -->
		<div class="content-row">

			<!-- Left: header (grows) + 3 group cards + source -->
			<div class="groups-col">

				<!-- Header lives here and grows to push cards down -->
				<div class="main-header">
					<div class="main-header-text">
						<h1 class="main-title">El Mundial<br>de los datos<br>en Cíclico</h1>
						<p class="main-subtitle">¿Qué pasaría si en vez de goles ganara el país con mejores datos?</p>
					</div>
				</div>
				<div class="groups-grid">
					{#each visibleGroups as gk (gk)}
						{@const ranked = rankGroup(gk, $currentVar)}
						<div class="group-card" in:fly={{ y: 16, duration: 280 }} out:fade={{ duration: 150 }}>
							<div class="group-card-header">
								<span class="group-label">GRUPO {gk}</span>
								<span class="group-unit">{varCfg?.unit ?? ''}</span>
							</div>
							{#key $currentVar}
								<div class="group-rows">
									{#each ranked as code, idx}
										{@const c = COUNTRIES[code]}
										{@const val = getMetric(c, $currentVar)}
										<div class="country-row" style="--row-delay: {100 + (3 - idx) * 300}ms">
											<span class="pos-num" class:gold={idx === 0} class:silver={idx === 1}>{idx + 1}</span>
											<span class="country-flag">{c.flag}</span>
											<div class="country-name-row">
												<div class="country-name-text">
													{c.name}
													{#if c.autocracy}
														<svg class="autocracy-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
															<path d="M2 19h20M4 19V9l4 3 4-5 4 5 4-3v10"/>
															<circle cx="12" cy="4" r="1.5"/>
														</svg>
													{/if}
												</div>
												<div class="country-bar">
													<div class="country-bar-fill" style="width:{calcBar(val, $currentVar)}%"></div>
												</div>
											</div>
											<span class="country-value">{val.toLocaleString('es-AR')}{varCfg?.unit ?? ''}</span>
										</div>
									{/each}
								</div>
							{/key}
						</div>
					{/each}
				</div>

				{#if varCfg?.source}
					<div class="source-card">
						<span class="source-label">Fuente</span>
						<p class="source-text">{varCfg.source}</p>
						{#if varCfg.desc}
							<span class="source-desc">{varCfg.desc}</span>
						{/if}
					</div>
				{/if}
			</div>

			<!-- Right: editorial card — full height -->
			<div class="editorial-card">
				<div class="editorial-entries">
					<h2 class="editorial-title">Análisis editorial</h2>
					{#if varCfg}
						<p class="editorial-index-name">{varCfg.label}</p>
					{/if}
					{#if Object.keys(editorialMap).length}
						{#each visibleGroups as gk}
							{#if editorialMap[gk]}
								<div class="editorial-entry">
									<span class="editorial-group-tag">Grupo {gk}</span>
									<p>{editorialMap[gk]}</p>
								</div>
							{/if}
						{/each}
						{#if visibleGroups.every(gk => !editorialMap[gk])}
							<p class="editorial-empty">Sin análisis para los grupos seleccionados.</p>
						{/if}
					{:else}
						<p class="editorial-empty">Seleccioná un índice para ver el análisis.</p>
					{/if}
					{#if hasAutocracy}
						<p class="autocracy-note">
							<svg viewBox="0 0 24 24" fill="currentColor" style="width:16px;height:16px;flex-shrink:0">
								<path d="M5 16h14l2-7-4 2-3-5-3 5-4-2 2 7zm-2 2h18v2H3v-2z"/>
							</svg>
							Autocracia o monarquía no electoral.
						</p>
					{/if}
				</div>
			</div>

		</div>

	</div>
</div>

<style>
	/* ── LAYOUT ────────────────────────────────────────── */
	.datos-layout {
		display: grid;
		grid-template-columns: 272px 1fr;
		gap: 14px;
		height: calc(100vh - 64px);
		padding: 14px 20px;
		box-sizing: border-box;
		overflow: hidden;
	}

	/* ── SIDEBAR ───────────────────────────────────────── */
	.sidebar {
		display: flex;
		flex-direction: column;
		gap: 10px;
		min-height: 0;
		overflow: hidden;
	}

	.sidebar-card {
		background: rgba(8, 20, 40, 0.92);
		backdrop-filter: blur(24px);
		-webkit-backdrop-filter: blur(24px);
		border: 1px solid rgba(212, 175, 55, 0.18);
		border-radius: 16px;
		padding: 20px 18px;
		display: flex;
		flex-direction: column;
		gap: 0;
	}
	.grupos-card { flex-shrink: 0; }
	.indices-card { flex: 1; min-height: 0; overflow: hidden; display: flex; flex-direction: column; }

	.sidebar-card-title {
		font-family: 'Inter', sans-serif; font-size: 23px; font-weight: 800;
		color: #fff; line-height: 1; margin-bottom: 6px;
	}
	.sidebar-card-instruction {
		font-size: 11px; color: rgba(212,175,55,0.75); margin: 0 0 14px;
		line-height: 1.4;
	}
	.indices-footer { margin-top: auto; padding-top: 12px; flex-shrink: 0; }

	/* ── GROUP CHIPS ───────────────────────────────────── */
	.group-chips { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; }
	.group-chip {
		position: relative;
		font-family: 'Inter', monospace; font-size: 11px; font-weight: 700;
		letter-spacing: 0.08em; text-transform: uppercase;
		padding: 7px 10px; border-radius: 8px;
		border: 1px solid rgba(255,255,255,0.12);
		background: rgba(255,255,255,0.05);
		color: rgba(255,255,255,0.55);
		cursor: pointer; transition: all 0.18s; text-align: center;
	}
	.group-chip:hover {
		border-color: rgba(91,155,213,0.6);
		background: rgba(91,155,213,0.12);
		color: #fff;
	}
	.group-chip.active {
		border-color: var(--celeste);
		background: rgba(91,155,213,0.22);
		color: #fff;
	}
	.group-chip.disabled { opacity: 0.3; cursor: default; }
	.group-chip.disabled:hover { border-color: rgba(255,255,255,0.12); background: rgba(255,255,255,0.05); color: rgba(255,255,255,0.55); }

	/* Tooltip con países */
	.group-chip::after {
		content: attr(data-countries);
		position: absolute; bottom: calc(100% + 7px); left: 50%;
		transform: translateX(-50%);
		background: rgba(8,20,40,0.97); border: 1px solid rgba(212,175,55,0.25);
		color: rgba(255,255,255,0.85); font-size: 10px; font-weight: 400;
		letter-spacing: 0.02em; padding: 5px 9px; border-radius: 7px;
		white-space: nowrap; pointer-events: none;
		opacity: 0; transition: opacity 0.15s; z-index: 100;
	}
	.group-chip:hover::after { opacity: 1; }

	/* ── VARIABLE BUTTONS ──────────────────────────────── */
	.var-cats {
		display: flex; gap: 6px; flex-wrap: wrap;
		overflow-y: auto; flex: 1; align-content: flex-start;
		scrollbar-width: thin; scrollbar-color: rgba(255,255,255,0.1) transparent;
		padding-right: 2px;
	}
	.var-cat-label {
		font-family: 'Inter', monospace; font-size: 9px; letter-spacing: 0.12em;
		text-transform: uppercase; color: rgba(255,255,255,0.28);
		padding: 4px 0; width: 100%; margin-top: 10px;
	}
	.var-cat-label:first-child { margin-top: 0; }
	.var-btn {
		font-family: 'Inter', monospace; font-size: 10px; letter-spacing: 0.04em;
		padding: 6px 11px; border-radius: 16px;
		border: 1px solid rgba(255,255,255,0.1);
		color: #fff; background: rgba(255,255,255,0.06);
		cursor: pointer; transition: all 0.18s; white-space: nowrap;
	}
	.var-btn:hover {
		border-color: rgba(91,155,213,0.5);
		background: rgba(91,155,213,0.18);
		color: #fff;
	}
	.var-btn.active {
		border-color: var(--celeste);
		background: rgba(91,155,213,0.28);
		color: #fff;
	}
	.var-btn.locked { opacity: 0.28; cursor: default; }
	.var-btn.locked:hover { border-color: rgba(255,255,255,0.1); background: rgba(255,255,255,0.06); }

	/* Share button */
	.share-btn {
		display: flex; align-items: center; gap: 6px;
		font-family: 'Inter', monospace; font-size: 10px; letter-spacing: 0.08em;
		text-transform: uppercase;
		padding: 7px 14px; border-radius: 8px;
		border: 1px solid rgba(212,175,55,0.3); color: rgba(212,175,55,0.7);
		background: rgba(212,175,55,0.06); cursor: pointer; transition: all 0.18s;
	}
	.share-btn:hover { border-color: rgba(212,175,55,0.8); color: rgba(212,175,55,1); }

	/* ── MAIN AREA ─────────────────────────────────────── */
	.main-area {
		display: flex; flex-direction: column; gap: 10px;
		flex: 1; min-height: 0; min-width: 0;
	}

	/* ── CONTENT ROW: groups-col + editorial ───────────── */
	.content-row {
		display: grid;
		grid-template-columns: 1fr 220px;
		gap: 12px;
		flex: 1; min-height: 0; min-width: 0;
	}

	/* Left col: header grows, cards stay at bottom */
	.groups-col {
		display: flex; flex-direction: column; gap: 10px;
		min-width: 0;
	}
	.main-header {
		flex: 1;
		display: flex; flex-direction: column; justify-content: flex-end;
		padding-bottom: 4px;
	}
	.main-header-text { display: flex; flex-direction: column; gap: 4px; }
	.main-title {
		font-family: 'Inter', sans-serif; font-size: 54px; font-weight: 800;
		color: #fff; line-height: 1.05; margin: 0;
	}
	.main-subtitle {
		font-size: 14px; color: #fff; font-weight: 500; opacity: 0.75; margin: 0; line-height: 1.4;
	}
	.main-header-actions {
		margin-top: 12px;
	}

	/* ── GROUP CARDS GRID ──────────────────────────────── */
	.groups-grid {
		display: grid; grid-template-columns: repeat(3, minmax(0, 1fr));
		gap: 12px; align-items: start; min-width: 0;
	}
	.group-card {
		background: rgba(255,255,255,0.92); border: 1px solid rgba(255,255,255,0.9);
		border-radius: 12px; box-shadow: 0 2px 12px rgba(0,0,0,0.06);
		display: flex; flex-direction: column; min-width: 0; overflow: hidden;
	}
	.group-card-header {
		background: rgba(91,155,213,0.1); padding: 12px 16px;
		border-bottom: 1px solid rgba(0,0,0,0.06);
		display: flex; align-items: center; justify-content: space-between; gap: 8px;
		flex-shrink: 0;
	}
	.group-label { font-family: 'Inter', monospace; font-size: 10px; letter-spacing: 0.15em; text-transform: uppercase; color: var(--celeste); }
	.group-unit { font-family: 'Inter', monospace; font-size: 11px; color: var(--muted); }
	.group-rows { flex: 1; overflow: hidden; }

	@keyframes rowIn {
		from { opacity: 0; transform: translateY(14px); }
		to   { opacity: 1; transform: translateY(0); }
	}
	.country-row {
		display: flex; align-items: center; gap: 10px; padding: 12px 16px;
		border-bottom: 1px solid var(--border);
		animation: rowIn 550ms ease both;
		animation-delay: var(--row-delay, 0ms);
	}
	.country-row:last-child { border-bottom: none; }
	.pos-num { font-family: 'Inter', monospace; font-size: 11px; color: var(--muted); width: 16px; flex-shrink: 0; }
	.pos-num.gold { color: var(--celeste); }
	.pos-num.silver { color: #aaa; }
	.country-flag { font-size: 18px; flex-shrink: 0; }
	.country-name-row { flex: 1; min-width: 0; }
	.country-name-text { font-family: 'Inter', sans-serif; font-size: 13px; font-weight: 800; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
	.country-value { font-family: 'Inter', monospace; font-size: 12px; color: var(--celeste); flex-shrink: 0; text-align: right; }
	.country-bar { height: 5px; background: rgba(0,0,0,0.08); border-radius: 3px; margin-top: 5px; }
	.country-bar-fill { height: 100%; background: var(--celeste); border-radius: 3px; transition: width 0.9s cubic-bezier(0.4, 0, 0.2, 1); }
	.autocracy-icon { width: 14px; height: 14px; color: #111; vertical-align: middle; flex-shrink: 0; display: inline-block; margin-left: 4px; position: relative; top: -1px; }

	/* ── EDITORIAL CARD ────────────────────────────────── */
	.editorial-card {
		background: #fff; border: 1px solid rgba(0,0,0,0.08);
		border-radius: 12px; box-shadow: 0 2px 16px rgba(0,0,0,0.1);
		display: flex; flex-direction: column;
		align-self: end;
		max-height: 100%;
		overflow: hidden;
	}
	.editorial-title {
		font-family: 'Inter', sans-serif; font-size: 30px; font-weight: 800;
		color: var(--text); line-height: 1.1; margin: 0 0 4px;
	}
	.editorial-index-name {
		font-family: 'Inter', monospace; font-size: 11px; font-weight: 600;
		letter-spacing: 0.06em; text-transform: uppercase;
		color: var(--celeste); margin: 0 0 14px;
	}
	.autocracy-note {
		font-size: 11px; color: var(--muted); margin: 0; line-height: 1.4;
		display: flex; align-items: center; gap: 6px;
	}
	.editorial-entries { padding: 18px 18px; display: flex; flex-direction: column; gap: 14px; flex: 1; overflow-y: auto; scrollbar-width: none; }
	.editorial-entries::-webkit-scrollbar { display: none; }
	.editorial-entry { display: flex; flex-direction: column; gap: 4px; }
	.editorial-group-tag {
		font-family: 'Inter', monospace; font-size: 10px; letter-spacing: 0.1em;
		text-transform: uppercase; color: var(--celeste);
	}
	.editorial-entry p { font-size: 12px; color: var(--text); line-height: 1.55; margin: 0; }
	.editorial-empty { font-size: 12px; color: var(--muted); font-style: italic; margin: 0; }
	.autocracy-note { font-size: 10px; color: var(--muted); margin: 0; line-height: 1.4; display: flex; align-items: center; gap: 3px; }

	/* ── SOURCE STRIP ──────────────────────────────────── */
	.source-card {
		padding: 9px 16px; flex-shrink: 0;
		background: rgba(255,255,255,0.5); border: 1px solid var(--border);
		border-radius: 10px; display: flex; align-items: baseline; gap: 10px; flex-wrap: nowrap;
		overflow: hidden;
	}
	.source-label {
		font-family: 'Inter', monospace; font-size: 9px; letter-spacing: 0.12em;
		text-transform: uppercase; color: var(--muted); white-space: nowrap; flex-shrink: 0;
	}
	.source-text {
		font-size: 11px; color: var(--text); margin: 0; flex: 1;
		white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
	}
	.source-desc {
		font-family: 'Inter', monospace; font-size: 10px; color: var(--muted);
		white-space: nowrap; flex-shrink: 0;
	}

	/* ── MOBILE FALLBACK ───────────────────────────────── */
	@media (max-width: 1100px) {
		.datos-layout {
			grid-template-columns: 1fr;
			height: auto; overflow: visible;
			padding: 16px;
		}
		.sidebar { overflow: visible; }
		.indices-card { max-height: 400px; }
		.main-area { overflow: visible; }
		.groups-grid { grid-template-columns: 1fr; }
		.group-chip::after { display: none; }
		.source-card { flex-wrap: wrap; }
		.source-text { white-space: normal; }
	}
</style>
