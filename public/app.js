// Jahr
const yearEl = document.getElementById('y');
if (yearEl) yearEl.textContent = new Date().getFullYear();

// Modal open/close (robust)
document.addEventListener('click', (e) => {
  const opener = e.target.closest('[data-open]');
  if (opener) {
    e.preventDefault();
    const sel = opener.getAttribute('data-open');
    const modal = document.querySelector(sel);
    if (modal) modal.classList.add('open');
  }
  if (e.target.matches('[data-close]')) {
    e.preventDefault();
    const modal = e.target.closest('.modal');
    if (modal) modal.classList.remove('open');
  }
  if (e.target.classList.contains('modal')) {
    e.preventDefault();
    e.target.classList.remove('open');
  }
});

async function apiPost(url, data) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  return res.json();
}

// Projekt
const fProjekt = document.getElementById('form-projekt');
if (fProjekt) {
  const msg = document.getElementById('msg-projekt');
  const btn = document.getElementById('btn-projekt');
  fProjekt.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (btn) btn.disabled = true;
    if (msg) msg.textContent = 'Sende…';
    const data = Object.fromEntries(new FormData(fProjekt).entries());
    const res = await apiPost('/api/project', data).catch(() => ({ ok: false }));
    if (msg) msg.textContent = res.ok ? 'Danke! Wir melden uns zeitnah.' : 'Fehler beim Senden. Bitte später erneut versuchen.';
    if (res.ok) fProjekt.reset();
    if (btn) btn.disabled = false;
  });
}

// Bewerbung
const fBew = document.getElementById('form-bewerbung');
if (fBew) {
  const msg = document.getElementById('msg-bewerbung');
  const btn = document.getElementById('btn-bewerbung');
  fBew.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (btn) btn.disabled = true;
    if (msg) msg.textContent = 'Sende…';
    const data = Object.fromEntries(new FormData(fBew).entries());
    const res = await apiPost('/api/application', data).catch(() => ({ ok: false }));
    if (msg) msg.textContent = res.ok ? 'Danke! Wir melden uns zeitnah.' : 'Fehler beim Senden. Bitte später erneut versuchen.';
    if (res.ok) fBew.reset();
    if (btn) btn.disabled = false;
  });
}

// --- extra safety: explicit bindings ---
(function() {
  console.log('[WSN] app.js loaded');
  const openers = document.querySelectorAll('[data-open]');
  openers.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const sel = btn.getAttribute('data-open');
      const modal = document.querySelector(sel);
      if (modal) modal.classList.add('open');
    });
  });
})();
