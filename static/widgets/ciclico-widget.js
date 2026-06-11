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

    /* ── CARRUSEL ── */
    .ccw-carousel {
      position: relative;
      overflow: hidden;
    }
    .ccw-track {
      display: flex;
      transition: transform 0.35s cubic-bezier(0.4,0,0.2,1);
    }
    .ccw-match {
      min-width: 100%;
      background: rgba(91,155,213,0.12);
      border: 1px solid rgba(91,155,213,0.2);
      border-radius: 10px;
      padding: 14px 16px;
      box-sizing: border-box;
    }
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
      color: #fff;
      text-align: center;
      font-family: monospace;
    }

    /* ── DOTS ── */
    .ccw-dots {
      display: flex;
      justify-content: center;
      gap: 6px;
      margin-top: 12px;
    }
    .ccw-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: rgba(255,255,255,0.2);
      cursor: pointer;
      transition: background 0.2s;
      border: none;
      padding: 0;
    }
    .ccw-dot.active { background: #5b9bd5; }

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
      <div class="ccw-meta">${formatDate(m.kickoff)} · ${formatTime(m.kickoff)} hs</div>
    `;
    return div;
  }

  function mountCarousel(body, matches) {
    const carousel = document.createElement('div');
    carousel.className = 'ccw-carousel';

    const track = document.createElement('div');
    track.className = 'ccw-track';
    matches.forEach(m => track.appendChild(renderMatch(m)));
    carousel.appendChild(track);
    body.appendChild(carousel);

    // dots
    const dots = document.createElement('div');
    dots.className = 'ccw-dots';
    let current = 0;

    const dotEls = matches.map((_, i) => {
      const btn = document.createElement('button');
      btn.className = 'ccw-dot' + (i === 0 ? ' active' : '');
      btn.addEventListener('click', () => goTo(i));
      dots.appendChild(btn);
      return btn;
    });
    body.appendChild(dots);

    function goTo(i) {
      current = i;
      track.style.transform = `translateX(-${i * 100}%)`;
      dotEls.forEach((d, idx) => d.classList.toggle('active', idx === i));
    }

    // autoplay cada 4s
    let timer = setInterval(() => goTo((current + 1) % matches.length), 4000);

    // pausa al hover
    carousel.addEventListener('mouseenter', () => clearInterval(timer));
    carousel.addEventListener('mouseleave', () => {
      timer = setInterval(() => goTo((current + 1) % matches.length), 4000);
    });

    // swipe táctil
    let startX = 0;
    carousel.addEventListener('touchstart', e => { startX = e.touches[0].clientX; }, { passive: true });
    carousel.addEventListener('touchend', e => {
      const diff = startX - e.changedTouches[0].clientX;
      if (Math.abs(diff) > 40) goTo(diff > 0 ? Math.min(current + 1, matches.length - 1) : Math.max(current - 1, 0));
    });
  }

  function mount(container) {
    if (!document.querySelector('#ccw-style')) {
      const style = document.createElement('style');
      style.id = 'ccw-style';
      style.textContent = CSS;
      document.head.appendChild(style);
    }

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
        mountCarousel(body, matches);
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
