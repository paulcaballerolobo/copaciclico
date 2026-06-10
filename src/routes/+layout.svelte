<script lang="ts">
	import { page } from '$app/stores';
	import '../app.css';

	const tabs = [
		{ href: '/', label: 'Inicio' },
		{ href: '/datos', label: 'Mundial de los Datos' },
		{ href: '/paises', label: 'Países' },
		{ href: '/stats', label: 'Estadísticas' },
		{ href: '/mundial', label: '🏆 Prode Cíclico', prode: true },
		{ href: '/mundial/trivia', label: '🎯 Trivia', trivia: true }
	];
</script>

<nav>
	<a href="/" class="logo-link">
		<img src="/Logos-CICLICO-Mundial-blanco.png" alt="Cíclico" class="logo-img" />
	</a>
	<div class="nav-tabs">
		{#each tabs as tab}
				<a
					href={tab.href}
					class="nav-tab"
					class:active={tab.trivia ? $page.url.pathname.startsWith('/mundial/trivia') : tab.prode ? ($page.url.pathname.startsWith('/mundial') && !$page.url.pathname.startsWith('/mundial/trivia')) : $page.url.pathname === tab.href}
					class:nav-tab-prode={tab.prode}
					class:nav-tab-trivia={tab.trivia}
				>{tab.label}</a>
		{/each}
	</div>
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
		background: rgba(6, 20, 40, 0.97);
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
		font-size: 10px;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		padding: 7px 12px;
		border-radius: 20px;
		border: none;
		cursor: pointer;
		color: rgba(255,255,255,0.55);
		background: none;
		white-space: nowrap;
		transition: color 0.2s;
		text-decoration: none;
	}
	.nav-tab:hover { color: rgba(255,255,255,0.9); }
	.nav-tab.active { color: #fff; background: rgba(255,255,255,0.1); }
	.nav-tab-prode { color: var(--amarillo-dim) !important; }
	.nav-tab-prode.active { background: rgba(245,194,0,0.12); color: var(--amarillo-dim) !important; }
	.nav-tab-trivia { color: rgba(255,100,80,0.85) !important; }
	.nav-tab-trivia.active { background: rgba(255,85,0,0.12); color: rgba(255,85,0,1) !important; }
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
