/* Login do painel administrativo — após entrar, a edição acontece direto no site (/) */
(function () {
  'use strict';
  const $ = (sel) => document.querySelector(sel);
  const loginView = $('#loginView');
  const loginForm = $('#loginForm');
  const loginError = $('#loginError');

  fetch('/api/admin/me.php', { credentials: 'same-origin' })
    .then((r) => {
      if (r.ok) {
        location.href = '/';
      } else {
        loginView.hidden = false;
      }
    })
    .catch(() => { loginView.hidden = false; });

  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    loginError.textContent = '';
    const btn = loginForm.querySelector('button');
    btn.disabled = true;
    try {
      const data = Object.fromEntries(new FormData(loginForm));
      const r = await fetch('/api/admin/login.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify(data),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || 'Não foi possível entrar.');
      location.href = '/';
    } catch (err) {
      loginError.textContent = err.message;
      btn.disabled = false;
    }
  });
})();
