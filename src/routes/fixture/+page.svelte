<script lang="ts">
	import { fixtureResults } from '$lib/stores';
	import { COUNTRIES, GROUPS, MATCHES } from '$lib/data';

	function shareFixture() {
		const picks = Object.values($fixtureResults)
			.map((code) => `${COUNTRIES[code]?.flag} ${COUNTRIES[code]?.name}`)
			.join(', ');
		const text = picks ? `Mi fixture del Mundial 2026: ${picks}` : 'Armé mi fixture del Mundial 2026 con Cíclico';
		const url = window.location.href;
		if (navigator.share) {
			navigator.share({ title: 'Cíclico · El Mundial de los Datos', text, url }).catch(() => {});
		} else {
			window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text + ' ' + url)}`, '_blank');
		}
	}
</script>

<div class="section">
	<div class="section-hero-label">Bracket interactivo</div>
	<div class="section-title">Simulador de Fixture</div>
	<div class="section-subtitle">Hacé clic en el equipo que creés que gana cada partido. Se muestran los grupos A, B, C y J.</div>

	<div class="fixture-groups">
		{#each Object.entries(GROUPS) as [gk]}
			{@const groupMatches = MATCHES.filter((m) => m.group === gk)}
			<div class="fixture-group">
				<div class="fixture-group-header">
					<span class="group-label">GRUPO {gk}</span>
				</div>
				{#each groupMatches as m}
					{@const hc = COUNTRIES[m.home]}
					{@const ac = COUNTRIES[m.away]}
					{@const res = $fixtureResults[m.id]}
					<div class="fixture-match">
						<div class="fixture-date">{m.date} · {m.time} hs</div>
						<div class="fixture-match-teams">
							<button
								class="fixture-team-btn"
								class:winner={res === m.home}
								class:loser={res && res !== m.home}
								on:click={() => fixtureResults.update((r) => ({ ...r, [m.id]: m.home }))}
							>{hc.flag} {hc.name}</button>
							<span class="fixture-vs">vs</span>
							<button
								class="fixture-team-btn"
								class:winner={res === m.away}
								class:loser={res && res !== m.away}
								on:click={() => fixtureResults.update((r) => ({ ...r, [m.id]: m.away }))}
							>{ac.flag} {ac.name}</button>
						</div>
					</div>
				{/each}
			</div>
		{/each}
	</div>

	<div style="margin-top:24px;text-align:center;">
		<button class="share-btn" on:click={shareFixture}>
			<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92s2.92-1.31 2.92-2.92-1.31-2.92-2.92-2.92z"/></svg>
			Compartir mi fixture
		</button>
		<button class="share-btn" on:click={() => fixtureResults.set({})} style="margin-left:8px;">Reiniciar</button>
	</div>
	<p class="nota">Se muestran los grupos A, B, C y J. Los grupos D–L serán incorporados próximamente.</p>
</div>

<style>
	.fixture-groups { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; }
	.fixture-group { background: var(--bg-card); border: 1px solid var(--border); border-radius: 12px; overflow: hidden; }
	.fixture-group-header { background: var(--bg-card2); padding: 10px 16px; border-bottom: 1px solid var(--border); }
	.group-label { font-family: 'Inter', monospace; font-size: 10px; letter-spacing: 0.12em; text-transform: uppercase; color: var(--celeste); }
	.fixture-match { padding: 12px 16px; border-bottom: 1px solid var(--border); }
	.fixture-match:last-child { border-bottom: none; }
	.fixture-match-teams { display: flex; gap: 8px; align-items: center; }
	.fixture-team-btn {
		flex: 1; padding: 8px 10px; border-radius: 8px; border: 1px solid var(--border);
		background: var(--bg-card2); color: var(--text);
		font-family: 'Instrument Sans', sans-serif; font-size: 13px; font-weight: 600;
		cursor: pointer; transition: all 0.2s; text-align: center;
	}
	.fixture-team-btn:hover { border-color: var(--celeste); }
	.fixture-team-btn.winner { background: rgba(91, 155, 213, 0.15); border-color: var(--celeste); color: var(--celeste); }
	.fixture-team-btn.loser { opacity: 0.35; }
	.fixture-vs { font-family: 'Inter', monospace; font-size: 10px; color: var(--muted); flex-shrink: 0; }
	.fixture-date { font-family: 'Inter', monospace; font-size: 10px; color: var(--muted); margin-bottom: 6px; }
	@media (max-width: 900px) { .fixture-groups { grid-template-columns: 1fr; } }
</style>
