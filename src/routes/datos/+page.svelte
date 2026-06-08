<script lang="ts">
	import { currentVar } from '$lib/stores';
	import { COUNTRIES, GROUPS, VARIABLES, EDITORIAL, getMetric } from '$lib/data';
	import type { Variable } from '$lib/types';
	import { fly, fade } from 'svelte/transition';

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
		const url = window.location.href;
		const text = '¿Qué pasaría si ganara el país con mejores datos? El Mundial 2026 reimaginado por Cíclico.';
		if (navigator.share) {
			navigator.share({ title: 'Cíclico · El Mundial de los Datos', text, url }).catch(() => {});
		} else {
			window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text + ' ' + url)}`, '_blank');
		}
	}

	$: varCfg = getVarConfig($currentVar);
	$: editorialMap = EDITORIAL[$currentVar] ?? {};
	$: visibleGroups = allGroupKeys.filter((k) => activeGroups.includes(k));
	$: hasAutocracy = visibleGroups.some((gk) =>
		GROUPS[gk].countries.some((code) => COUNTRIES[code].autocracy)
	);
</script>

<div class="section">
	<div class="section-hero-label">Alta Data #001</div>
	<div class="section-title">El Mundial de los Datos</div>
	<div class="section-subtitle">¿Qué pasaría si en vez de goles, ganara el país con mejores datos? Elegí una variable y mirá cómo se reorganiza el torneo.</div>

	<!-- Group selector -->
	<div class="group-selector">
		<span class="group-selector-label">Grupos</span>
		<div class="group-chips">
			{#each allGroupKeys as key}
				<button
					class="group-chip"
					class:active={activeGroups.includes(key)}
					class:disabled={!activeGroups.includes(key) && activeGroups.length >= 3}
					on:click={() => toggleGroup(key)}
				>
					<span class="group-chip-key">GRUPO {key}</span>
					<span class="group-chip-countries">{groupCountryNames(key)}</span>
				</button>
			{/each}
		</div>
	</div>

	<!-- Variable selector -->
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

	<!-- Group rankings + editorial card -->
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

		<!-- Editorial card: always in 4th slot -->
		<div class="editorial-card">
			<div class="group-card-header">
				<span class="group-label editorial-label">Análisis editorial</span>
			</div>
			<div class="editorial-entries">
				{#if hasAutocracy}
					<p class="autocracy-note">
						<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" style="width:11px;height:11px;vertical-align:middle;margin-right:3px">
							<path d="M2 19h20M4 19V9l4 3 4-5 4 5 4-3v10"/><circle cx="12" cy="4" r="1.5"/>
						</svg>
						Autocracia o monarquía no electoral.
					</p>
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
					<p class="editorial-empty">Seleccioná una variable para ver el análisis.</p>
				{/if}
			</div>
		</div>
	</div>

	<!-- Sources card -->
	{#if varCfg?.source}
		<div class="source-card">
			<span class="source-label">Fuente</span>
			<p class="source-text">{varCfg.source}</p>
			{#if varCfg.desc}
				<span class="source-desc">{varCfg.desc}</span>
			{/if}
		</div>
	{/if}

	<button class="share-btn" on:click={compartir}>
		<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92s2.92-1.31 2.92-2.92-1.31-2.92-2.92-2.92z"/></svg>
		Compartir resultado
	</button>

</div>

<style>
	.var-cats { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 16px; }
	.var-cat-label {
		font-family: 'Inter', monospace; font-size: 10px; letter-spacing: 0.12em;
		text-transform: uppercase; color: var(--muted); padding: 4px 0; width: 100%; margin-top: 8px;
	}
	.var-cat-label:first-child { margin-top: 0; }
	.var-btn {
		font-family: 'Inter', monospace; font-size: 11px; letter-spacing: 0.06em;
		padding: 7px 14px; border-radius: 20px; border: 1px solid var(--border);
		color: var(--muted); background: var(--bg-card2); cursor: pointer; transition: all 0.2s; white-space: nowrap;
	}
	.var-btn:hover { border-color: var(--celeste); color: var(--text); }
	.var-btn.active { border-color: var(--celeste); color: var(--celeste); background: rgba(91, 155, 213, 0.1); }
	.var-btn.locked { opacity: 0.4; cursor: default; }
	.var-btn.locked:hover { border-color: var(--border); color: var(--muted); }

	.group-selector { display: flex; align-items: flex-start; gap: 12px; margin-bottom: 20px; flex-wrap: wrap; }
	.group-selector-label {
		font-family: 'Inter', monospace; font-size: 10px; letter-spacing: 0.12em;
		text-transform: uppercase; color: var(--muted); padding-top: 10px; white-space: nowrap;
	}
	.group-chips { display: flex; gap: 8px; flex-wrap: wrap; }
	.group-chip {
		display: flex; flex-direction: column; gap: 2px;
		padding: 8px 14px; border-radius: 10px; border: 1px solid var(--border);
		background: var(--bg-card2); cursor: pointer; transition: all 0.2s; text-align: left;
	}
	.group-chip:hover { border-color: var(--celeste); }
	.group-chip.active { border-color: var(--celeste); background: rgba(91, 155, 213, 0.1); }
	.group-chip.disabled { cursor: default; opacity: 0.6; }
	.group-chip-key {
		font-family: 'Inter', monospace; font-size: 10px; letter-spacing: 0.12em;
		text-transform: uppercase; color: var(--celeste);
	}
	.group-chip.active .group-chip-key { color: var(--celeste); }
	.group-chip:not(.active) .group-chip-key { color: var(--muted); }
	.group-chip-countries { font-family: 'Inter', sans-serif; font-size: 11px; color: var(--muted); white-space: nowrap; }
	.group-chip.active .group-chip-countries { color: var(--text); }

	.groups-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-top: 24px; }
	.group-card { background: rgba(255,255,255,0.92); border: 1px solid rgba(255,255,255,0.9); border-radius: 12px; box-shadow: 0 2px 12px rgba(0,0,0,0.06); }
	.group-card-header {
		background: rgba(91,155,213,0.1); padding: 12px 16px;
		border-bottom: 1px solid rgba(0,0,0,0.06);
		display: flex; align-items: center; justify-content: space-between; gap: 8px;
	}
	.group-label { font-family: 'Inter', monospace; font-size: 10px; letter-spacing: 0.15em; text-transform: uppercase; color: var(--celeste); }
	.group-unit { font-family: 'Inter', monospace; font-size: 11px; color: var(--muted); }

	@keyframes rowIn {
		from { opacity: 0; transform: translateY(14px); }
		to   { opacity: 1; transform: translateY(0); }
	}
	.country-row {
		display: flex; align-items: center; gap: 10px; padding: 12px 16px; border-bottom: 1px solid var(--border);
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

	.editorial-card {
		background: #fff; border: 1px solid rgba(0,0,0,0.08);
		border-radius: 12px; box-shadow: 0 2px 16px rgba(0,0,0,0.1);
		display: flex; flex-direction: column;
	}
	.editorial-label { color: var(--orange) !important; }
	.editorial-entries { padding: 14px 16px; display: flex; flex-direction: column; gap: 14px; flex: 1; }
	.editorial-entry { display: flex; flex-direction: column; gap: 4px; }
	.editorial-group-tag {
		font-family: 'Inter', monospace; font-size: 10px; letter-spacing: 0.1em;
		text-transform: uppercase; color: var(--celeste);
	}
	.editorial-entry p { font-size: 12px; color: var(--text); line-height: 1.55; margin: 0; }
	.editorial-empty { font-size: 12px; color: var(--muted); font-style: italic; margin: 0; }
	.autocracy-note { font-size: 10px; color: var(--muted); margin: 0; line-height: 1.4; display: flex; align-items: center; gap: 3px; }
	.autocracy-icon { width: 11px; height: 11px; color: var(--muted); vertical-align: middle; flex-shrink: 0; display: inline-block; margin-left: 4px; position: relative; top: -1px; }

	.source-card {
		margin-top: 12px; padding: 14px 20px;
		background: var(--bg-card); border: 1px solid var(--border);
		border-radius: 10px; display: flex; align-items: baseline; gap: 12px; flex-wrap: wrap;
	}
	.source-label {
		font-family: 'Inter', monospace; font-size: 10px; letter-spacing: 0.12em;
		text-transform: uppercase; color: var(--muted); white-space: nowrap; flex-shrink: 0;
	}
	.source-text { font-size: 12px; color: var(--text); line-height: 1.55; margin: 0; flex: 1; }
	.source-desc {
		font-family: 'Inter', monospace; font-size: 11px; color: var(--muted);
		white-space: nowrap; flex-shrink: 0;
	}

	@media (max-width: 900px) {
		.groups-grid { grid-template-columns: 1fr; }
		.group-chip-countries { display: none; }
		.group-chip { padding: 8px 12px; }
		.source-card { flex-direction: column; gap: 6px; }
	}
</style>
