(function () {
  'use strict';

  const API = 'https://mundial.somosciclico.com/api/next-matches?limit=3';
  const MICROSITE = 'https://mundial.somosciclico.com';

  const CSS = `
    .ccw-wrap {
      font-family: 'Inter', system-ui, sans-serif;
      background: #061428;
      border: 1px solid rgba(91,155,213,0.25);
      border-radius: 16px;
      padding: 24px;
      max-width: 480px;
      color: #fff;
      box-sizing: border-box;
    }
    .ccw-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 18px;
    }
    .ccw-label {
      font-size: 10px;
      letter-spacing: 0.18em;
      text-transform: uppercase;
      color: #5b9bd5;
      font-weight: 700;
    }
    .ccw-logo {
      font-size: 10px;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      color: rgba(255,255,255,0.25);
    }
    .ccw-match {
      background: rgba(91,155,213,0.12);
      border: 1px solid rgba(91,155,213,0.2);
      border-radius: 10px;
      padding: 14px 16px;
      margin-bottom: 8px;
      transition: background 0.2s;
      cursor: default;
    }
    .ccw-match:hover { background: rgba(91,155,213,0.2); }
    .ccw-match-arg {
      background: rgba(91,155,213,0.22);
      border-color: rgba(91,155,213,0.45);
    }
    .ccw-teams {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 6px;
    }
    .ccw-team {
      flex: 1;
      display: flex;
      align-items: center;
      gap: 7px;
    }
    .ccw-team-home { justify-content: flex-end; }
    .ccw-flag { font-size: 20px; line-height: 1; }
    .ccw-code {
      font-size: 15px;
      font-weight: 900;
      letter-spacing: -0.01em;
      color: #fff;
    }
    .ccw-vs {
      font-size: 10px;
      color: rgba(255,255,255,0.25);
      width: 28px;
      text-align: center;
      font-family: 'DM Mono', monospace;
      flex-shrink: 0;
    }
    .ccw-meta {
      font-size: 11px;
      color: rgba(255,255,255,0.4);
      text-align: center;
      font-family: monospace;
    }
    .ccw-cta {
      display: block;
      margin-top: 18px;
      background: #5b9bd5;
      color: #fff;
      text-align: center;
      padding: 12px;
      border-radius: 10px;
      font-size: 13px;
      font-weight: 700;
      text-decoration: none;
      letter-spacing: 0.03em;
      transition: background 0.2s;
    }
    .ccw-cta:hover { background: #4a86bd; color: #fff; text-decoration: none; }
    .ccw-empty {
      text-align: center;
      padding: 20px 0;
      color: rgba(255,255,255,0.35);
      font-size: 13px;
    }
  `;

  function formatDate(iso) {
    return new Date(iso).toLocaleString('es-AR', {
      timeZone: 'America/Argentina/Buenos_Aires',
      day: 'numeric', month: 'short'
    });
  }

  function formatTime(iso) {
    return new Date(iso).toLocaleString('es-AR', {
      timeZone: 'America/Argentina/Buenos_Aires',
      hour: '2-digit', minute: '2-digit', hour12: false
    });
  }

  function isArg(m) {
    return m.home.code === 'ARG' || m.away.code === 'ARG';
  }

  function renderMatch(m) {
    const div = document.createElement('div');
    div.className = 'ccw-match' + (isArg(m) ? ' ccw-match-arg' : '');
    div.innerHTML = `
      <div class="ccw-teams">
        <div class="ccw-team ccw-team-home">
          <span class="ccw-code">${m.home.code}</span>
          <span class="ccw-flag">${m.home.flag}</span>
        </div>
        <div class="ccw-vs">vs</div>
        <div class="ccw-team">
          <span class="ccw-flag">${m.away.flag}</span>
          <span class="ccw-code">${m.away.code}</span>
        </div>
      </div>
      <div class="ccw-meta">${formatDate(m.kickoff)} · ${formatTime(m.kickoff)} hs${m.group ? ' · Grupo ' + m.group : ''}</div>
    `;
    return div;
  }

  function mount(container) {
    const style = document.createElement('style');
    style.textContent = CSS;
    document.head.appendChild(style);

    const wrap = document.createElement('div');
    wrap.className = 'ccw-wrap';
    wrap.innerHTML = `
      <div class="ccw-header">
        <span class="ccw-label">Próximos partidos</span>
        <span class="ccw-logo">Cíclico · Mundial 2026</span>
      </div>
      <div class="ccw-body"></div>
      <a class="ccw-cta" href="${MICROSITE}" target="_blank" rel="noopener">Ver fixture completo →</a>
    `;
    container.appendChild(wrap);

    const body = wrap.querySelector('.ccw-body');

    fetch(API)
      .then(r => r.json())
      .then(({ matches }) => {
        if (!matches || matches.length === 0) {
          body.innerHTML = '<div class="ccw-empty">Sin próximos partidos</div>';
          return;
        }
        matches.forEach(m => body.appendChild(renderMatch(m)));
      })
      .catch(() => {
        body.innerHTML = '<div class="ccw-empty">No se pudo cargar el fixture</div>';
      });
  }

  function init() {
    document.querySelectorAll('[data-ciclico-widget]').forEach(el => mount(el));
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
