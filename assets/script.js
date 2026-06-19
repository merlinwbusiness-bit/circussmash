/* ============================================
   CIRCUS SMASH v4 — JavaScript
   Features: parallax, scroll reveal, animated counters,
   live open/closed status, menu filter, confetti,
   location switcher, accordion, back to top
   ============================================ */

// ============ PARALLAX HERO CHECKER ============
const checkerBg = document.getElementById('checker-bg');
window.addEventListener('scroll', () => {
  const scrollY = window.scrollY;
  if (checkerBg) {
    checkerBg.style.transform = `translateY(${scrollY * 0.3}px)`;
  }
}, { passive: true });

// ============ NAV SCROLL EFFECT ============
const nav = document.getElementById('nav');
window.addEventListener('scroll', () => {
  nav.classList.toggle('scrolled', window.scrollY > 60);
}, { passive: true });

// ============ SCROLL REVEAL ============
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
    }
  });
}, { threshold: 0.12 });

document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));

// ============ ANIMATED COUNTERS ============
function animateCount(el) {
  const target = parseFloat(el.dataset.count);
  const suffix = el.dataset.suffix || '';
  const decimal = parseInt(el.dataset.decimal || 0);
  const duration = 1400;
  const start = performance.now();

  function step(now) {
    const elapsed = now - start;
    const progress = Math.min(elapsed / duration, 1);
    const ease = 1 - Math.pow(1 - progress, 3);
    const value = target * ease;
    el.textContent = value.toFixed(decimal) + suffix;
    if (progress < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

const counterObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting && !entry.target.dataset.counted) {
      entry.target.dataset.counted = true;
      animateCount(entry.target);
    }
  });
}, { threshold: 0.5 });

document.querySelectorAll('[data-count]').forEach(el => counterObserver.observe(el));

// ============ LIVE OPEN/CLOSED STATUS ============
const SCHEDULES = {
  vilanova: {
    0: [{ open: '12:30', close: '15:30' }, { open: '19:30', close: '22:30' }], // Sun
    1: null,                                                                      // Mon closed
    2: [{ open: '19:30', close: '22:30' }],                                       // Tue
    3: [{ open: '19:30', close: '22:30' }],                                       // Wed
    4: [{ open: '19:30', close: '22:30' }],                                       // Thu
    5: [{ open: '12:30', close: '15:30' }, { open: '19:30', close: '23:00' }],    // Fri
    6: [{ open: '12:30', close: '15:30' }, { open: '19:30', close: '23:00' }],    // Sat
  },
  ribes: {
    0: [{ open: '12:00', close: '16:00' }, { open: '18:00', close: '23:00' }],   // Sun
    1: [{ open: '18:00', close: '23:00' }],                                       // Mon
    2: [{ open: '18:00', close: '23:00' }],                                       // Tue
    3: [{ open: '18:00', close: '23:00' }],                                       // Wed
    4: [{ open: '18:00', close: '23:00' }],                                       // Thu
    5: [{ open: '12:00', close: '16:00' }, { open: '18:00', close: '00:00' }],   // Fri
    6: [{ open: '12:00', close: '16:00' }, { open: '18:00', close: '00:00' }],   // Sat
  }
};

function toMinutes(timeStr) {
  if (!timeStr) return null;
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
}

function getStatus() {
  const now = new Date();
  const day = now.getDay();
  const currentMins = now.getHours() * 60 + now.getMinutes();

  let anyOpen = false;
  let nextOpen = null;
  let nextClose = null;

  for (const loc of ['vilanova', 'ribes']) {
    const slots = SCHEDULES[loc][day];
    if (!slots) continue;
    for (const slot of slots) {
      const o = toMinutes(slot.open);
      const c = slot.close === '00:00' ? 24 * 60 : toMinutes(slot.close);
      if (currentMins >= o && currentMins < c) {
        anyOpen = true;
        if (!nextClose || c < nextClose) nextClose = c;
      } else if (currentMins < o) {
        if (!nextOpen || o < nextOpen) nextOpen = o;
      }
    }
  }

  return { anyOpen, nextOpen, nextClose };
}

function formatMins(mins) {
  const h = Math.floor(mins / 60) % 24;
  const m = mins % 60;
  return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`;
}

function getStatusSeconds() {
  const now = new Date();
  const day = now.getDay();
  const currentSecs = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();

  let anyOpen = false;
  let nextOpenSecs = null;
  let nextCloseSecs = null;

  for (const loc of ['vilanova', 'ribes']) {
    const slots = SCHEDULES[loc][day];
    if (!slots) continue;
    for (const slot of slots) {
      const o = toMinutes(slot.open) * 60;
      const c = slot.close === '00:00' ? 24 * 3600 : toMinutes(slot.close) * 60;
      if (currentSecs >= o && currentSecs < c) {
        anyOpen = true;
        if (!nextCloseSecs || c < nextCloseSecs) nextCloseSecs = c;
      } else if (currentSecs < o) {
        if (!nextOpenSecs || o < nextOpenSecs) nextOpenSecs = o;
      }
    }
  }
  return { anyOpen, nextOpenSecs, nextCloseSecs, currentSecs };
}

function pad(n) { return String(n).padStart(2, '0'); }

function updateCountdown() {
  const dot = document.getElementById('live-dot');
  const text = document.getElementById('live-text');
  const block = document.getElementById('countdown-block');
  const label = document.getElementById('countdown-label');
  const cdH = document.getElementById('cd-h');
  const cdM = document.getElementById('cd-m');
  const cdS = document.getElementById('cd-s');
  if (!dot || !text) return;

  const { anyOpen, nextOpenSecs, nextCloseSecs, currentSecs } = getStatusSeconds();

  if (anyOpen) {
    dot.className = 'live-dot open';
    text.innerHTML = `<strong style="color:#22c55e">Abierto ahora</strong>`;
    const remaining = nextCloseSecs - currentSecs;
    const h = Math.floor(remaining / 3600);
    const m = Math.floor((remaining % 3600) / 60);
    const s = remaining % 60;
    label.textContent = 'Cierra en';
    block.style.display = 'block';
    // Animate digit on change
    [{ el: cdH, val: pad(h) }, { el: cdM, val: pad(m) }, { el: cdS, val: pad(s) }].forEach(({ el, val }) => {
      if (el && el.textContent !== val) {
        el.textContent = val;
        el.classList.remove('tick');
        void el.offsetWidth;
        el.classList.add('tick');
        setTimeout(() => el.classList.remove('tick'), 200);
      }
    });
  } else {
    dot.className = 'live-dot closed';
    if (nextOpenSecs !== null) {
      const remaining = nextOpenSecs - currentSecs;
      const h = Math.floor(remaining / 3600);
      const m = Math.floor((remaining % 3600) / 60);
      const s = remaining % 60;
      text.innerHTML = `<strong style="color:var(--red)">Cerrado ahora</strong>`;
      label.textContent = 'Abre en';
      block.style.display = 'block';
      [{ el: cdH, val: pad(h) }, { el: cdM, val: pad(m) }, { el: cdS, val: pad(s) }].forEach(({ el, val }) => {
        if (el && el.textContent !== val) {
          el.textContent = val;
          el.classList.remove('tick');
          void el.offsetWidth;
          el.classList.add('tick');
          setTimeout(() => el.classList.remove('tick'), 200);
        }
      });
    } else {
      text.innerHTML = `<strong style="color:var(--red)">Cerrado hoy</strong>`;
      block.style.display = 'none';
    }
  }
}

updateCountdown();
setInterval(updateCountdown, 1000);

// ============ CONFETTI ============
function launchConfetti(btn) {
  const layer = document.getElementById('confetti-layer');
  if (!layer) return;
  const colors = ['#E11D2A', '#161616', '#F7F5F2', '#FFFFFF', '#FF6B6B', '#FFD93D'];
  const shapes = ['■', '●', '▲', '★', '◆'];

  for (let i = 0; i < 60; i++) {
    const piece = document.createElement('span');
    piece.className = 'confetti-piece';
    piece.textContent = shapes[Math.floor(Math.random() * shapes.length)];
    piece.style.cssText = `
      left: ${Math.random() * 100}%;
      top: ${Math.random() * 30}%;
      color: ${colors[Math.floor(Math.random() * colors.length)]};
      font-size: ${8 + Math.random() * 14}px;
      animation-duration: ${1.2 + Math.random() * 1.5}s;
      animation-delay: ${Math.random() * 0.4}s;
    `;
    layer.appendChild(piece);
    piece.addEventListener('animationend', () => piece.remove());
  }
}

document.querySelectorAll('.btn-confetti').forEach(btn => {
  btn.addEventListener('click', () => launchConfetti(btn));
});

// ============ MENU ACCORDION ============
document.querySelectorAll('.menu-group-toggle').forEach(btn => {
  btn.addEventListener('click', () => {
    btn.classList.toggle('active');
  });
});

// ============ MENU FILTER ============
document.querySelectorAll('.filter-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const filter = btn.dataset.filter;

    // Open the burger section when filtering
    const burgersToggle = document.querySelector('[data-target="grp-burgers"]');
    if (!burgersToggle.classList.contains('active')) {
      burgersToggle.classList.add('active');
    }

    // Filter rows
    document.querySelectorAll('.menu-row[data-tags]').forEach(row => {
      if (filter === 'all' || row.dataset.tags.includes(filter)) {
        row.classList.remove('hidden-filter');
        row.style.animation = 'slideDown 0.3s ease';
      } else {
        row.classList.add('hidden-filter');
      }
    });

    // Filter cards
    document.querySelectorAll('.menu-card[data-tags]').forEach(card => {
      if (filter === 'all' || card.dataset.tags.includes(filter)) {
        card.classList.remove('hidden-filter');
        card.style.animation = 'slideDown 0.3s ease';
      } else {
        card.classList.add('hidden-filter');
      }
    });
  });
});

// ============ LOCATION SWITCHER ============
document.querySelectorAll('.loc-switch-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.loc-switch-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const loc = btn.dataset.loc;
    document.querySelectorAll('.loc-panel').forEach(p => p.classList.remove('active'));
    document.getElementById('loc-' + loc).classList.add('active');
  });
});

// ============ BACK TO TOP ============
const backBtn = document.getElementById('back-to-top');
window.addEventListener('scroll', () => {
  backBtn.classList.toggle('visible', window.scrollY > 400);
}, { passive: true });
backBtn.addEventListener('click', () => {
  window.scrollTo({ top: 0, behavior: 'smooth' });
});

// ============ RIPPLE ON BUTTONS ============
document.querySelectorAll('.btn').forEach(btn => {
  btn.addEventListener('click', (e) => {
    const ripple = document.createElement('span');
    ripple.className = 'ripple';
    const size = Math.max(btn.offsetWidth, btn.offsetHeight);
    const rect = btn.getBoundingClientRect();
    ripple.style.cssText = `
      width: ${size}px; height: ${size}px;
      left: ${e.clientX - rect.left - size/2}px;
      top: ${e.clientY - rect.top - size/2}px;
    `;
    btn.appendChild(ripple);
    ripple.addEventListener('animationend', () => ripple.remove());
  });
});

// ============ MAGNETIC STAT CARDS ============
document.querySelectorAll('.stat-card, .historia-stat').forEach(card => {
  card.addEventListener('mousemove', (e) => {
    const rect = card.getBoundingClientRect();
    const x = (e.clientX - rect.left - rect.width / 2) / rect.width;
    const y = (e.clientY - rect.top - rect.height / 2) / rect.height;
    card.style.transform = `translate(${x * 8}px, ${y * 8}px) rotate(${x * 3}deg)`;
  });
  card.addEventListener('mouseleave', () => {
    card.style.transform = '';
  });
});

// ============ HERO PARALLAX BADGE ON MOUSE MOVE ============
const heroBadge = document.querySelector('.hero-badge');
document.querySelector('.hero')?.addEventListener('mousemove', (e) => {
  if (!heroBadge || window.innerWidth < 860) return;
  const rect = document.querySelector('.hero').getBoundingClientRect();
  const x = (e.clientX - rect.left - rect.width / 2) / rect.width;
  const y = (e.clientY - rect.top - rect.height / 2) / rect.height;
  heroBadge.style.marginTop = `${y * 20}px`;
  heroBadge.style.marginRight = `${-x * 20}px`;
});
document.querySelector('.hero')?.addEventListener('mouseleave', () => {
  if (heroBadge) { heroBadge.style.marginTop = ''; heroBadge.style.marginRight = ''; }
});
