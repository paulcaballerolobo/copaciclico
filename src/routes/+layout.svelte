<script lang="ts">
	import { page } from '$app/stores';
	import '../app.css';

	const tabs = [
		{ href: '/', label: 'Inicio' },
		{ href: '/datos', label: 'Mundial de los Datos' },
		{ href: '/fixture', label: 'Simulador' },
		{ href: '/paises', label: 'Países' },
		{ href: '/calendario', label: 'Calendario' },
		{ href: '/ciudades', label: 'Ciudades' },
		{ href: '/stats', label: 'Estadísticas' }
	];
</script>

<nav>
	<a href="/" class="logo-link">
		<img src="/Logos-CICLICO-Mundial.png" alt="Cíclico" class="logo-img" />
	</a>
	<div class="nav-tabs">
		{#each tabs as tab}
			<a
				href={tab.href}
				class="nav-tab"
				class:active={$page.url.pathname === tab.href}
			>{tab.label}</a>
		{/each}
	</div>
	<div class="nav-badge">Mundial 2026</div>
</nav>

<slot />

<style>
	nav {
		padding: 16px 32px;
		border-bottom: 1px solid var(--border);
		display: flex;
		align-items: center;
		gap: 16px;
		position: sticky;
		top: 0;
		background: rgba(255, 255, 255, 0.97);
		backdrop-filter: blur(12px);
		z-index: 200;
	}
	.logo-img {
		height: 32px;
		width: auto;
		display: block;
		flex-shrink: 0;
	}
	.nav-tabs {
		display: flex;
		gap: 4px;
		margin-left: 24px;
		overflow-x: auto;
		scrollbar-width: none;
	}
	.nav-tabs::-webkit-scrollbar { display: none; }
	.nav-tab {
		font-family: 'Inter', monospace;
		font-size: 11px;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		padding: 7px 14px;
		border-radius: 20px;
		border: 1px solid transparent;
		cursor: pointer;
		color: var(--muted);
		background: none;
		white-space: nowrap;
		transition: all 0.2s;
		text-decoration: none;
	}
	.nav-tab:hover { color: var(--text); border-color: var(--border); }
	.nav-tab.active { color: var(--celeste); border-color: var(--celeste); background: rgba(91, 155, 213, 0.08); }
	.nav-badge {
		margin-left: auto;
		font-family: 'Inter', monospace;
		font-size: 11px;
		color: var(--muted);
		border: 1px solid var(--border);
		padding: 4px 10px;
		border-radius: 20px;
		flex-shrink: 0;
	}
	.logo-link {
		display: flex;
		align-items: center;
		gap: 8px;
		text-decoration: none;
		flex-shrink: 0;
	}
	@media (max-width: 900px) { nav { padding: 12px 16px; } }
	@media (max-width: 640px) { .nav-tab { font-size: 10px; padding: 6px 10px; } }
</style>
