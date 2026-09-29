/* Clínica Mãe de Deus — landing page (SPA com rotas por hash) + edição inline para administradores */
(function () {
  'use strict';

  const ICONS = {
    home: '<path d="M4 11l8-7 8 7v8a1 1 0 0 1-1 1h-4v-6H9v6H5a1 1 0 0 1-1-1z"/>',
    blog: '<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M9 8h6M9 12h6M9 16h4"/>',
    card: '<rect x="3" y="6" width="18" height="13" rx="2.5"/><path d="M3 11h18M7 15h4"/>',
    steth: '<path d="M6 3v6a4 4 0 0 0 8 0V3"/><path d="M10 13v2a5 5 0 0 0 10 0v-1"/><circle cx="20" cy="12" r="2"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>',
    arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
    phone: '<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2"/>',
    mail: '<rect x="3" y="5" width="18" height="14" rx="2.5"/><path d="M3 7l9 6 9-6"/>',
    insta: '<rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><path d="M17.5 6.5h.01"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/>',
    heart: '<path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/>',
    whats:
      '<path d="M3.5 20.5l1.3-4.2A8.5 8.5 0 1 1 8 19.5z"/><path d="M9 8.5c0 3.5 2.8 6.5 6.5 6.5l1-1.6-2-1-1 .9a5 5 0 0 1-2.6-2.6l.9-1-1-2z"/>',
  };
  const icon = (name) => `<svg viewBox="0 0 24 24" aria-hidden="true">${ICONS[name] || ''}</svg>`;

  const TABS = [
    { path: '/', label: 'Início', icon: 'home' },
    { path: '/blog', label: 'Blog', icon: 'blog' },
    { path: '/convenios', label: 'Convênios', icon: 'card' },
    { path: '/especialistas', label: 'Especialistas', icon: 'steth' },
    { path: '/sobre', label: 'Sobre', icon: 'info' },
  ];
  const MENU = [...TABS, { path: '/contato', label: 'Fale conosco', icon: 'mail' }];

  const $ = (sel, el = document) => el.querySelector(sel);
  const app = $('#app');
  let C = null; // conteúdo carregado da API
  let isAdmin = false;
  let editingMode = false;
  const state = { blogFilter: 'Todos', docFilter: 'Todos', insQuery: '' };

  // ---------- Utilidades ----------
  function esc(v) {
    return String(v == null ? '' : v).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }
  const paragraphs = (text) =>
    String(text || '')
      .split(/\n{2,}|\r\n\r\n/)
      .map((p) => `<p>${esc(p).replace(/\n/g, '<br>')}</p>`)
      .join('');
  const isVideo = (url) => /\.(mp4|webm|mov)(\?|$)/i.test(url || '');
  function media(url, alt, attrs = '', eager = false) {
    if (!url) return '';
    if (isVideo(url)) return `<video src="${esc(url)}" autoplay muted loop playsinline ${attrs}></video>`;
    return `<img src="${esc(url)}" alt="${esc(alt)}" loading="${eager ? 'eager' : 'lazy'}" ${eager ? 'fetchpriority="high"' : ''} ${attrs} />`;
  }
  const digits = (v) => String(v || '').replace(/\D/g, '');
  function waLink(text) {
    let n = digits(C.settings.whatsapp);
    if (n.length <= 11) n = '55' + n;
    const msg = text || C.settings.whatsappMessage || '';
    return `https://wa.me/${n}${msg ? '?text=' + encodeURIComponent(msg) : ''}`;
  }
  function fmtDate(iso) {
    if (!iso) return '';
    const [y, m, d] = String(iso).slice(0, 10).split('-');
    return d && m && y ? `${d}/${m}/${y}` : esc(iso);
  }
  const ed = (path) => (path ? ` data-edit="${esc(path)}"` : '');
  const edMulti = (path) => (path ? ` data-edit="${esc(path)}" data-edit-multiline` : '');
  const title = (t, hl, path) =>
    `<h1 class="display"><span${ed(path && `${path}.title`)}>${esc(t)}</span>${
      hl ? ` <em${ed(path && `${path}.titleHighlight`)}>${esc(hl)}</em>` : ''
    }</h1>`;
  const intro = (s, path) =>
    `<span class="eyebrow"${ed(path && `${path}.eyebrow`)}>${esc(s.eyebrow)}</span>${title(s.title, s.titleHighlight, path)}<p class="lead"${edMulti(
      path && `${path}.text`
    )}>${esc(s.text)}</p>`;
  const initials = (name, i) => {
    const clean = String(name || '').replace(/[[\]]/g, '').trim();
    const m = clean.match(/(\d+)$/);
    if (m) return 'C' + m[1];
    return clean.split(/\s+/).slice(0, 2).map((w) => w[0] || '').join('').toUpperCase() || 'C' + (i + 1);
  };
  function chips(items, active, key) {
    return `<div class="chips" role="toolbar">${['Todos', ...items]
      .map((c) => `<button class="chip" data-filter="${key}" data-value="${esc(c)}" aria-pressed="${c === active}">${esc(c)}</button>`)
      .join('')}</div>`;
  }
  const footer = () =>
    `<footer class="footer">© ${new Date().getFullYear()} Clínica ${esc(C.settings.clinicName)} · <span data-edit="settings.footerText">${esc(
      C.settings.footerText || 'Todos os direitos reservados'
    )}</span><br /><a class="link-arrow" style="font-size:12px;margin-top:8px;display:inline-flex" href="#/privacidade">Política de Privacidade e Cookies</a></footer>`;

  // ---------- Edição (admin) — utilidades de caminho ----------
  function step(cur, seg) {
    if (cur == null) return undefined;
    if (seg.startsWith('#')) return (cur || []).find((x) => x && x.id === seg.slice(1));
    if (/^\d+$/.test(seg)) return cur[Number(seg)];
    return cur[seg];
  }
  function getPath(root, path) {
    return path.split('.').reduce(step, root);
  }
  function resolveContainer(root, segs) {
    let cur = root;
    for (let i = 0; i < segs.length - 1; i++) cur = step(cur, segs[i]);
    return { parent: cur, key: segs[segs.length - 1] };
  }
  function setPath(root, path, value) {
    const segs = path.split('.');
    const { parent, key } = resolveContainer(root, segs);
    if (!parent) return;
    if (key.startsWith('#')) {
      const idx = parent.findIndex((x) => x && x.id === key.slice(1));
      if (idx >= 0) parent[idx] = value;
    } else if (/^\d+$/.test(key)) {
      parent[Number(key)] = value;
    } else {
      parent[key] = value;
    }
  }
  const sectionOf = (path) => path.split('.')[0];
  const newId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

  let toastTimer = null;
  function toast(msg, isErr) {
    const el = $('#toast');
    if (!el) return;
    el.textContent = msg;
    el.className = 'toast' + (isErr ? ' err' : '');
    el.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { el.hidden = true; }, 2600);
  }

  async function saveSection(section) {
    const r = await fetch(`/api/admin/save-section.php?section=${section}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify(C[section]),
    });
    if (!r.ok) throw new Error('Falha ao salvar.');
  }

  function removeArrayItem(path, ref, redirect) {
    if (!confirm('Remover este item?')) return;
    const arr = getPath(C, path);
    if (!Array.isArray(arr)) return;
    const idx = typeof ref === 'string' && isNaN(Number(ref)) ? arr.findIndex((x) => x && x.id === ref) : Number(ref);
    if (idx < 0 || idx >= arr.length) return;
    arr.splice(idx, 1);
    saveSection(sectionOf(path))
      .then(() => {
        toast('Removido.');
        if (redirect) location.hash = redirect;
        else render();
      })
      .catch(() => toast('Erro ao remover.', true));
  }

  const ADD_FACTORIES = {
    specialists: () => ({ id: newId(), name: 'Novo(a) especialista', specialty: (C.specialties || [])[0] || '', crm: '', photo: '', bio: '' }),
    specialties: () => 'Nova especialidade',
    'insurance.items': () => ({ id: newId(), name: 'Novo convênio', logo: '' }),
    'blog.posts': () => ({
      id: newId(),
      title: 'Novo artigo',
      summary: '',
      content: '',
      category: (C.specialties || [])[0] || '',
      image: '',
      video: '',
      date: new Date().toISOString().slice(0, 10),
      readTime: 3,
      featured: false,
    }),
    'home.heroGallery': () => '',
    'home.hours': () => 'Novo horário',
    'about.gallery': () => ({ src: '', caption: '' }),
  };
  function handleAdd(path) {
    const factory = ADD_FACTORIES[path];
    if (!factory) return;
    const arr = getPath(C, path) || [];
    const item = factory();
    arr.push(item);
    setPath(C, path, arr);
    saveSection(sectionOf(path))
      .then(() => {
        toast('Adicionado.');
        if (path === 'blog.posts') location.hash = `#/blog/${item.id}`;
        else render();
      })
      .catch(() => toast('Erro ao adicionar.', true));
  }

  function editText(el, path, opts = {}) {
    if (el.dataset.editing) return;
    el.dataset.editing = '1';
    const original = getPath(C, path);
    const value = original == null ? '' : String(original);
    const insideApp = app.contains(el);
    const input = document.createElement(opts.multiline ? 'textarea' : 'input');
    input.className = 'edit-input';
    input.value = value;
    if (opts.multiline) input.rows = Math.max(3, Math.min(14, Math.ceil(value.length / 42) + 1));
    el.replaceWith(input);
    input.focus();
    input.select();
    let done = false;
    const commit = (cancel) => {
      if (done) return;
      done = true;
      el.dataset.editing = '';
      const next = cancel ? value : input.value;
      if (cancel || next === value) {
        input.replaceWith(el);
        return;
      }
      setPath(C, path, next);
      if (insideApp) {
        input.replaceWith(el);
        saveSection(sectionOf(path))
          .then(() => toast('Salvo.'))
          .catch(() => toast('Erro ao salvar.', true));
        render();
      } else {
        el[opts.multiline ? 'innerHTML' : 'textContent'] = opts.multiline ? paragraphs(next) : next;
        input.replaceWith(el);
        saveSection(sectionOf(path))
          .then(() => toast('Salvo.'))
          .catch(() => toast('Erro ao salvar.', true));
      }
    };
    input.addEventListener('blur', () => commit(false));
    input.addEventListener('keydown', (e) => {
      if (!opts.multiline && e.key === 'Enter') { e.preventDefault(); input.blur(); }
      if (e.key === 'Escape') { e.preventDefault(); commit(true); }
    });
  }

  function patchMediaEverywhere(path, url) {
    document.querySelectorAll('[data-edit-media]').forEach((wrap) => {
      if (wrap.dataset.editMedia !== path) return;
      const btn = wrap.querySelector('.edit-media-btn');
      const cur = wrap.querySelector('img,video');
      const wantsVideo = isVideo(url);
      if (cur && (cur.tagName === 'VIDEO') === wantsVideo) {
        cur.src = url;
      } else {
        wrap.innerHTML = media(url, '');
        if (btn) wrap.appendChild(btn);
      }
    });
  }

  let mediaLibrary = [];
  async function loadMediaLibrary() {
    try {
      const r = await fetch('/api/admin/content.php', { credentials: 'same-origin' });
      if (r.ok) {
        const d = await r.json();
        mediaLibrary = d.media || [];
      }
    } catch {}
  }

  function applyMedia(path, url) {
    setPath(C, path, url);
    saveSection(sectionOf(path))
      .then(() => {
        toast('Foto atualizada.');
        patchMediaEverywhere(path, url);
        render();
      })
      .catch(() => toast('Erro ao salvar.', true));
  }

  function uploadNewMedia(path) {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*,video/*';
    input.addEventListener('change', async () => {
      const file = input.files[0];
      if (!file) return;
      const maxMB = C.maxUploadMB || 50;
      if (file.size > maxMB * 1024 * 1024) {
        toast(`Arquivo maior que ${maxMB}MB. Escolha um arquivo menor.`, true);
        return;
      }
      toast('Enviando arquivo...');
      try {
        const fd = new FormData();
        fd.append('file', file);
        const r = await fetch('/api/admin/upload.php', { method: 'POST', body: fd, credentials: 'same-origin' });
        const item = await r.json();
        if (!r.ok) throw new Error(item.error || 'Erro no upload.');
        mediaLibrary.unshift(item);
        applyMedia(path, item.url);
        closeOverlays();
      } catch (err) {
        toast(err.message, true);
      }
    });
    input.click();
  }

  function openMediaPicker(path) {
    const grid = mediaLibrary.length
      ? `<div class="media-picker__grid">${mediaLibrary
          .map(
            (m) =>
              `<button type="button" class="media-picker__item" data-pick="${esc(m.url)}" title="${esc(m.name || '')}">${
                m.type === 'video' ? `<video src="${esc(m.url)}" muted></video>` : `<img src="${esc(m.url)}" alt="" loading="lazy" />`
              }</button>`
          )
          .join('')}</div>`
      : '<p class="empty">Nenhum arquivo enviado ainda.</p>';
    openSheet(`<h3>Foto ou vídeo</h3>
      <button type="button" class="btn btn--primary media-picker__upload" data-upload-for="${esc(path)}">📤 Enviar novo arquivo</button>
      <p class="hint">JPG, PNG, WEBP, GIF, MP4, WEBM ou MOV · máximo ${esc(C.maxUploadMB || 50)}MB por arquivo</p>
      <p class="hint">Ou escolha um arquivo já enviado antes:</p>
      ${grid}`);
    $('#sheetBody').dataset.pickPath = path;
  }

  function initEditMode() {
    if (!isAdmin) return;
    document.querySelectorAll('[data-edit-media]').forEach((el) => {
      if (el.dataset.mediaReady) return;
      let target = el;
      if (el.tagName === 'IMG' || el.tagName === 'VIDEO') {
        const wrap = document.createElement('span');
        wrap.className = 'edit-media-wrap';
        wrap.dataset.editMedia = el.dataset.editMedia;
        el.replaceWith(wrap);
        wrap.appendChild(el);
        target = wrap;
      }
      target.dataset.mediaReady = '1';
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'edit-media-btn';
      btn.textContent = '📷';
      btn.setAttribute('aria-label', 'Trocar foto/vídeo');
      target.appendChild(btn);
    });
  }

  // Intercepta cliques de edição antes de qualquer navegação/ação padrão
  document.addEventListener(
    'click',
    (e) => {
      if (!isAdmin || !editingMode) return;
      const mediaBtn = e.target.closest('.edit-media-btn');
      if (mediaBtn) {
        e.preventDefault();
        e.stopPropagation();
        openMediaPicker(mediaBtn.parentElement.dataset.editMedia);
        return;
      }
      const pickBtn = e.target.closest('[data-pick]');
      if (pickBtn) {
        e.preventDefault();
        e.stopPropagation();
        applyMedia($('#sheetBody').dataset.pickPath, pickBtn.dataset.pick);
        closeOverlays();
        return;
      }
      const uploadBtn = e.target.closest('[data-upload-for]');
      if (uploadBtn) {
        e.preventDefault();
        e.stopPropagation();
        uploadNewMedia(uploadBtn.dataset.uploadFor);
        return;
      }
      const delBtn = e.target.closest('[data-del]');
      if (delBtn) {
        e.preventDefault();
        e.stopPropagation();
        removeArrayItem(delBtn.dataset.del, delBtn.dataset.delId || delBtn.dataset.delIndex, delBtn.dataset.delRedirect);
        return;
      }
      const addBtn = e.target.closest('[data-add]');
      if (addBtn) {
        e.preventDefault();
        e.stopPropagation();
        handleAdd(addBtn.dataset.add);
        return;
      }
      const editEl = e.target.closest('[data-edit]');
      if (editEl) {
        e.preventDefault();
        e.stopPropagation();
        editText(editEl, editEl.dataset.edit, { multiline: editEl.hasAttribute('data-edit-multiline') });
      }
    },
    true
  );

  document.addEventListener('change', (e) => {
    if (!isAdmin) return;
    const f = e.target.closest('[data-field][data-post]');
    if (!f) return;
    const post = C.blog.posts.find((x) => x.id === f.dataset.post);
    if (!post) return;
    let val = f.value;
    if (f.type === 'checkbox') val = f.checked;
    else if (f.type === 'number') val = Number(val);
    post[f.dataset.field] = val;
    saveSection('blog').then(() => toast('Salvo.')).catch(() => toast('Erro ao salvar.', true));
  });

  // ---------- Páginas ----------
  const pages = {
    '/': () => {
      const h = C.home;
      const specs = C.specialties || [];
      const heroImages = (h.heroGallery || []).filter(Boolean);
      return `
      <section class="hero home-grid">
        <div>
          <div class="hero__rings" aria-hidden="true"><span></span><span></span><span></span></div>
          <span class="eyebrow" data-edit="home.eyebrow">${esc(h.eyebrow)}</span>
          ${title(h.title, h.titleHighlight, 'home')}
          <p class="lead" data-edit="home.text" data-edit-multiline>${esc(h.text)}</p>
        </div>
        <div>
          ${
            heroImages.length > 1
              ? `<div class="hero-carousel" id="heroCarousel">
                  <div class="hero-carousel__track">${heroImages
                    .map((src, i) => `<div class="hero-carousel__slide">${media(src, h.heroBadge, '', i === 0)}</div>`)
                    .join('')}</div>
                  ${h.heroBadge ? `<span class="badge-float" data-edit="home.heroBadge">${esc(h.heroBadge)}</span>` : ''}
                  <div class="hero-carousel__dots">${heroImages
                    .map((_, i) => `<button class="dot" data-slide="${i}" aria-label="Foto ${i + 1}" aria-current="${i === 0}"></button>`)
                    .join('')}</div>
                </div>`
              : `<div class="media-card" data-edit-media="home.heroMedia">
            ${media(h.heroMedia, h.heroBadge, '', true)}
            ${h.heroBadge ? `<span class="badge-float" data-edit="home.heroBadge">${esc(h.heroBadge)}</span>` : ''}
          </div>`
          }
          ${
            isAdmin
              ? `<div class="edit-gallery">
                  <strong>Carrossel de fotos (2 ou mais para girar)</strong>
                  <div class="edit-gallery__grid">
                    ${(h.heroGallery || [])
                      .map(
                        (src, i) =>
                          `<div class="edit-gallery__item" data-edit-media="home.heroGallery.${i}">${
                            src ? media(src, '') : '<span class="edit-gallery__empty">Vazia</span>'
                          }<button type="button" class="edit-gallery__del" data-del="home.heroGallery" data-del-index="${i}" aria-label="Remover foto">✕</button></div>`
                      )
                      .join('')}
                    <button type="button" class="edit-gallery__add" data-add="home.heroGallery">+ Foto</button>
                  </div>
                </div>`
              : ''
          }
        </div>
      </section>
      <div class="btn-stack">
        <a class="btn btn--primary" href="${waLink()}" target="_blank" rel="noopener">${icon('whats')} <span data-edit="home.ctaPrimary">${esc(h.ctaPrimary)}</span></a>
        <a class="btn btn--outline" href="#/sobre"><span data-edit="home.ctaSecondary">${esc(h.ctaSecondary)}</span> ${icon('arrow')}</a>
      </div>

      <section class="section card-mint">
        <h2 class="h2" data-edit="home.phasesTitle">${esc(h.phasesTitle)}</h2>
        <div class="phases">${(h.phases || [])
          .map(
            (p, i) =>
              `<button type="button" class="phase" data-phase="${i}" aria-pressed="false"><i></i><span data-edit="home.phases.${i}">${esc(p)}</span></button>`
          )
          .join('')}</div>
        <p id="phaseCaption" data-edit="home.phasesText" data-edit-multiline>${esc(h.phasesText)}</p>
        ${
          isAdmin
            ? `<div class="edit-phase-captions">${(h.phases || [])
                .map(
                  (p, i) =>
                    `<div class="edit-phase-cap"><strong>${esc(p)}:</strong> <span data-edit="home.phasesDescriptions.${i}" data-edit-multiline>${esc(
                      (h.phasesDescriptions || [])[i] || ''
                    )}</span></div>`
                )
                .join('')}</div>`
            : ''
        }
      </section>

      ${
        specs.length
          ? `<section class="section">
        <div class="section-head"><h2 class="h2">Especialidades</h2><a class="link-arrow" href="#/especialistas">Ver equipe ${icon('arrow')}</a></div>
        <div class="spec-grid">${specs.map((s) => `<a class="spec-tile" href="#/especialistas?f=${encodeURIComponent(s)}"><span class="ico">${icon('heart')}</span>${esc(s)}</a>`).join('')}</div>
      </section>`
          : ''
      }

      <section class="section">
        <h2 class="h2" data-edit="home.hoursTitle">${esc(h.hoursTitle || 'Horário de funcionamento')}</h2>
        <div class="hours-list">${(h.hours || [])
          .map(
            (line, i) =>
              `<div class="hours-row">${icon('info')}<span data-edit="home.hours.${i}">${esc(line)}</span>${
                isAdmin ? `<button type="button" class="icon-btn hours-row__del" data-del="home.hours" data-del-index="${i}" aria-label="Remover linha">🗑</button>` : ''
              }</div>`
          )
          .join('')}</div>
        ${isAdmin ? `<button type="button" class="btn btn--outline add-item" data-add="home.hours">+ Linha de horário</button>` : ''}
      </section>

      <section class="section cta-dark">
        <div class="cta-dark__head">
          <span class="cta-dark__icon">${icon('whats')}</span>
          <div><h3>Agende pelo WhatsApp</h3><small data-edit="settings.whatsapp">${esc(C.settings.whatsapp)}</small></div>
        </div>
        <a class="btn btn--white" href="${waLink()}" target="_blank" rel="noopener">${icon('whats')} Falar no WhatsApp</a>
      </section>
      ${footer()}`;
    },

    '/blog': () => {
      const b = C.blog;
      const cats = [...new Set([...(C.specialties || []), ...b.posts.map((p) => p.category).filter(Boolean)])];
      const posts = [...b.posts].sort((a, z) => String(z.date).localeCompare(String(a.date)));
      const filtered = state.blogFilter === 'Todos' ? posts : posts.filter((p) => p.category === state.blogFilter);
      const feat = filtered.find((p) => p.featured) || filtered[0];
      const rest = filtered.filter((p) => p !== feat);
      return `
      ${intro(b, 'blog')}
      ${chips(cats, state.blogFilter, 'blog')}
      ${
        feat
          ? `<article class="featured">
          <a href="#/blog/${esc(feat.id)}" class="media-card" data-edit-media="blog.posts.#${esc(feat.id)}.image">${media(feat.video || feat.image, feat.title)}</a>
          <div>
            <div class="tags">${feat.featured ? '<span class="tag-solid">Destaque</span>' : ''}<span class="tag-text">${esc(feat.category)}</span></div>
            <h2 data-edit="blog.posts.#${esc(feat.id)}.title">${esc(feat.title)}</h2>
            <p data-edit="blog.posts.#${esc(feat.id)}.summary" data-edit-multiline>${esc(feat.summary)}</p>
            <a class="link-arrow" href="#/blog/${esc(feat.id)}">Ler artigo ${icon('arrow')}</a>
          </div>
        </article>`
          : '<p class="empty">Nenhum artigo nesta categoria ainda.</p>'
      }
      ${
        rest.length || isAdmin
          ? `<section class="section"><h2 class="h2">Artigos recentes</h2><div class="post-list">${rest
              .map(
                (p) => `<a class="post-row" href="#/blog/${esc(p.id)}">
              <img src="${esc(p.image)}" alt="" loading="lazy" data-edit-media="blog.posts.#${esc(p.id)}.image" />
              <div><span class="tag-text">${esc(p.category)}</span><h3 data-edit="blog.posts.#${esc(p.id)}.title">${esc(p.title)}</h3>
              <span class="meta">${fmtDate(p.date)} · ${esc(p.readTime)} min de leitura</span></div>
              ${isAdmin ? `<button type="button" class="icon-btn post-row__del" data-del="blog.posts" data-del-id="${esc(p.id)}" aria-label="Remover artigo">🗑</button>` : ''}
              </a>`
              )
              .join('')}</div>
              ${isAdmin ? `<button type="button" class="btn btn--outline add-item" data-add="blog.posts">+ Novo artigo</button>` : ''}
              </section>`
          : ''
      }
      ${footer()}`;
    },

    '/blog/:id': (id) => {
      const p = C.blog.posts.find((x) => x.id === id);
      if (!p) return `<p class="empty">Artigo não encontrado.</p><a class="link-arrow" href="#/blog">Voltar ao blog ${icon('arrow')}</a>`;
      return `
      <article class="article">
        <div class="tags"><span class="tag-text" data-edit="blog.posts.#${esc(p.id)}.category">${esc(p.category)}</span></div>
        <h1 class="display" data-edit="blog.posts.#${esc(p.id)}.title">${esc(p.title)}</h1>
        <span class="meta">${fmtDate(p.date)} · ${esc(p.readTime)} min de leitura</span>
        ${
          p.summary || isAdmin
            ? `<p class="lead" data-edit="blog.posts.#${esc(p.id)}.summary" data-edit-multiline>${esc(p.summary || (isAdmin ? 'Adicionar resumo…' : ''))}</p>`
            : ''
        }
        <div class="media-card" data-edit-media="blog.posts.#${esc(p.id)}.image">${p.video ? `<video src="${esc(p.video)}" controls playsinline poster="${esc(p.image)}"></video>` : media(p.image, p.title)}</div>
        <div class="article__body" data-edit="blog.posts.#${esc(p.id)}.content" data-edit-multiline>${paragraphs(p.content)}</div>
        ${
          isAdmin
            ? `<div class="edit-postmeta">
              <label>Data<input class="input" type="date" data-field="date" data-post="${esc(p.id)}" value="${esc(p.date)}" /></label>
              <label>Min. leitura<input class="input" type="number" min="1" data-field="readTime" data-post="${esc(p.id)}" value="${esc(p.readTime)}" /></label>
              <label class="edit-postmeta__check"><input type="checkbox" data-field="featured" data-post="${esc(p.id)}" ${p.featured ? 'checked' : ''} /> Artigo em destaque</label>
              <button type="button" class="btn btn--danger" data-del="blog.posts" data-del-id="${esc(p.id)}" data-del-redirect="#/blog">Excluir artigo</button>
            </div>`
            : ''
        }
        <div class="btn-stack"><a class="btn btn--primary" href="${waLink()}" target="_blank" rel="noopener">${icon('whats')} Agendar consulta</a>
        <a class="btn btn--outline" href="#/blog">Ver outros artigos</a></div>
      </article>
      ${footer()}`;
    },

    '/convenios': () => {
      const ins = C.insurance;
      return `
      ${intro(ins, 'insurance')}
      <label class="field-label" for="insSearch">Buscar convênio</label>
      <div class="search">${icon('search')}<input id="insSearch" type="search" placeholder="Digite o nome do seu plano" value="${esc(state.insQuery)}" autocomplete="off" /></div>
      <section class="section">
        <div class="section-head"><h2 class="h2">Planos aceitos</h2><span class="meta" id="insCount"></span></div>
        <div class="ins-grid" id="insGrid"></div>
        ${isAdmin ? `<button type="button" class="btn btn--outline add-item" data-add="insurance.items">+ Adicionar convênio</button>` : ''}
      </section>
      <div class="notice">${icon('info')}<span data-edit="insurance.notice" data-edit-multiline>${esc(ins.notice)}</span></div>
      <div class="btn-stack"><a class="btn btn--primary" href="${waLink('Olá! Gostaria de confirmar a cobertura do meu convênio.')}" target="_blank" rel="noopener">${icon('whats')} Confirmar cobertura pelo WhatsApp</a></div>
      ${footer()}`;
    },

    '/especialistas': () => {
      const list = state.docFilter === 'Todos' ? C.specialists : C.specialists.filter((d) => d.specialty === state.docFilter);
      return `
      <span class="eyebrow">Nossa equipe</span>
      ${title('Nossos', 'especialistas')}
      <p class="lead">Equipe multidisciplinar para cuidar de você em todas as fases da vida.</p>
      ${chips(C.specialties || [], state.docFilter, 'doc')}
      ${
        isAdmin
          ? `<div class="edit-specialties">
              ${(C.specialties || [])
                .map(
                  (s, i) =>
                    `<span class="edit-tag"><span data-edit="specialties.${i}">${esc(s)}</span><button type="button" class="edit-tag__del" data-del="specialties" data-del-index="${i}" aria-label="Remover especialidade">✕</button></span>`
                )
                .join('')}
              <button type="button" class="edit-tag edit-tag--add" data-add="specialties">+ Especialidade</button>
            </div>`
          : ''
      }
      <div class="doc-list">${
        list.length
          ? list
              .map(
                (d) => `<article class="doc-card">
          <div class="doc-card__head">
            <img class="avatar" src="${esc(d.photo)}" alt="${esc(d.name)}" loading="lazy" data-edit-media="specialists.#${esc(d.id)}.photo" />
            <div><span class="tag-text" data-edit="specialists.#${esc(d.id)}.specialty">${esc(d.specialty)}</span><h3 data-edit="specialists.#${esc(d.id)}.name">${esc(d.name)}</h3><span class="meta" data-edit="specialists.#${esc(d.id)}.crm">${esc(d.crm)}</span></div>
            ${isAdmin ? `<button type="button" class="icon-btn doc-card__del" data-del="specialists" data-del-id="${esc(d.id)}" aria-label="Remover especialista">🗑</button>` : ''}
          </div>
          <div class="doc-card__actions">
            <a class="btn btn--primary" href="${waLink(`Olá! Gostaria de agendar uma consulta com ${d.name} (${d.specialty}).`)}" target="_blank" rel="noopener">Agendar</a>
            <button class="btn btn--outline" data-profile="${esc(d.id)}">Ver perfil</button>
          </div>
        </article>`
              )
              .join('')
          : '<p class="empty">Nenhum profissional nesta especialidade ainda.</p>'
      }${isAdmin ? `<button type="button" class="btn btn--outline add-card" data-add="specialists">+ Adicionar especialista</button>` : ''}</div>
      ${footer()}`;
    },

    '/sobre': () => {
      const a = C.about;
      const gallery = (a.gallery || []).slice(0, 6);
      return `
      ${intro(a, 'about')}
      <div class="gallery">${gallery
        .map(
          (g, i) => `<div class="gallery-item" data-gallery="${i}" role="button" tabindex="0" aria-label="${esc(g.caption || 'Ver foto')}" data-edit-media="about.gallery.${i}.src">
            ${media(g.src, g.caption)}
            ${i === 3 && a.galleryBadge ? `<span class="tag-float">${esc(a.galleryBadge)}</span>` : ''}
          </div>`
        )
        .join('')}</div>
      <div class="about-grid">
        <section class="section">
          <h2 class="h2" data-edit="about.historyTitle">${esc(a.historyTitle)}</h2>
          <div class="prose" data-edit="about.historyText" data-edit-multiline>${paragraphs(a.historyText)}</div>
        </section>
        <section class="section card-mint mission">
          <span class="eyebrow" data-edit="about.missionEyebrow">${esc(a.missionEyebrow)}</span>
          <h3 data-edit="about.missionTitle">${esc(a.missionTitle)}</h3>
          <p class="prose" data-edit="about.missionText" data-edit-multiline>${esc(a.missionText)}</p>
        </section>
      </div>
      ${footer()}`;
    },

    '/contato': () => {
      const c = C.contact;
      const s = C.settings;
      const insta = String(s.instagram || '').replace(/^@/, '');
      return `
      ${intro(c, 'contact')}
      <div class="contact-grid">
        <div>
          <section class="cta-dark">
            <div class="cta-dark__head">
              <span class="cta-dark__icon">${icon('whats')}</span>
              <div><h3>Agende pelo WhatsApp</h3><small data-edit="settings.whatsapp">${esc(s.whatsapp)}</small></div>
            </div>
            <a class="btn btn--white" href="${waLink()}" target="_blank" rel="noopener">${icon('whats')} Falar no WhatsApp</a>
          </section>
          <section class="section">
            <h2 class="h2">Outros canais</h2>
            <div class="channel-list">
              <a class="channel" href="tel:+55${digits(s.phone)}"><span class="ico">${icon('phone')}</span><span><small>Telefone</small><strong data-edit="settings.phone">${esc(s.phone)}</strong></span><span class="action">Ligar</span></a>
              <a class="channel" href="mailto:${esc(s.email)}"><span class="ico">${icon('mail')}</span><span><small>E-mail</small><strong data-edit="settings.email">${esc(s.email)}</strong></span><span class="action">Enviar</span></a>
              <a class="channel" href="https://instagram.com/${esc(insta)}" target="_blank" rel="noopener"><span class="ico">${icon('insta')}</span><span><small>Instagram</small><strong data-edit="settings.instagram">${esc(insta)}</strong></span><span class="action">Seguir</span></a>
            </div>
          </section>
        </div>
        <section class="section card-mint form-card">
          <h2 class="h2" data-edit="contact.formTitle">${esc(c.formTitle)}</h2>
          <p data-edit="contact.formText" data-edit-multiline>${esc(c.formText)}</p>
          <form id="contactForm" novalidate>
            <div class="form-field"><label class="field-label" for="fName">Nome completo</label><input class="input" id="fName" name="name" placeholder="Seu nome" required maxlength="120" autocomplete="name" /></div>
            <div class="form-field"><label class="field-label" for="fWhats">WhatsApp</label><input class="input" id="fWhats" name="whatsapp" placeholder="(00) 00000-0000" required maxlength="30" inputmode="tel" autocomplete="tel" /></div>
            <div class="form-field"><label class="field-label" for="fMsg">Mensagem</label><textarea class="input" id="fMsg" name="message" placeholder="Como podemos ajudar?" maxlength="2000"></textarea></div>
            <button class="btn btn--primary" type="submit">Enviar mensagem</button>
            <p class="form-status" id="formStatus" role="status"></p>
          </form>
        </section>
      </div>
      ${footer()}`;
    },

    '/privacidade': () => {
      const p = C.privacy || {};
      return `
      <span class="eyebrow">LGPD</span>
      <h1 class="display" data-edit="privacy.title">${esc(p.title || 'Política de Privacidade e Cookies')}</h1>
      <span class="meta">Atualizado em <span data-edit="privacy.updatedAt">${esc(p.updatedAt || '')}</span></span>
      <div class="prose" style="margin-top:18px" data-edit="privacy.content" data-edit-multiline>${paragraphs(p.content)}</div>
      <div class="btn-stack"><a class="btn btn--outline" href="#/contato">Falar com a clínica sobre meus dados</a></div>
      ${footer()}`;
    },
  };

  // ---------- Pós-renderização (eventos) ----------
  function renderInsurance() {
    const grid = $('#insGrid');
    if (!grid) return;
    const q = state.insQuery.trim().toLowerCase();
    const items = C.insurance.items.filter((i) => i.name.toLowerCase().includes(q));
    $('#insCount').textContent = `${items.length} ${items.length === 1 ? 'convênio' : 'convênios'}`;
    grid.innerHTML = items.length
      ? items
          .map(
            (it, i) => `<div class="ins-card"><span class="ins-card__logo" data-edit-media="insurance.items.#${esc(it.id)}.logo">${
              it.logo ? `<img src="${esc(it.logo)}" alt="" />` : esc(initials(it.name, i))
            }</span><span class="ins-card__name" data-edit="insurance.items.#${esc(it.id)}.name">${esc(it.name)}</span>${
              isAdmin ? `<button type="button" class="icon-btn ins-card__del" data-del="insurance.items" data-del-id="${esc(it.id)}" aria-label="Remover convênio">🗑</button>` : ''
            }</div>`
          )
          .join('')
      : '<p class="empty">Nenhum convênio encontrado. Fale com nossa equipe para confirmar.</p>';
    initEditMode();
  }

  function openSheet(html) {
    $('#sheetBody').innerHTML = html;
    $('#sheet').hidden = false;
    document.body.style.overflow = 'hidden';
    initEditMode();
  }
  function openDrawer() {
    const drawer = $('#drawer');
    drawer.classList.remove('is-closing');
    drawer.hidden = false;
    $('#menuBtn').setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
  }
  function closeDrawer() {
    const drawer = $('#drawer');
    if (drawer.hidden || drawer.classList.contains('is-closing')) return;
    drawer.classList.add('is-closing');
    $('#menuBtn').setAttribute('aria-expanded', 'false');
    setTimeout(() => {
      drawer.hidden = true;
      drawer.classList.remove('is-closing');
    }, 260);
  }
  function closeOverlays() {
    $('#sheet').hidden = true;
    closeDrawer();
    document.body.style.overflow = '';
    $('#sheetBody').querySelectorAll('video').forEach((v) => v.pause());
  }

  function initScrollReveal() {
    const items = Array.from(app.children);
    items.forEach((el) => el.classList.add('reveal'));
    if (!('IntersectionObserver' in window)) {
      items.forEach((el) => el.classList.add('is-visible'));
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -8% 0px' }
    );
    items.forEach((el) => io.observe(el));
  }

  let heroAutoplay = null;
  function initHeroCarousel() {
    if (heroAutoplay) clearInterval(heroAutoplay);
    const carousel = $('#heroCarousel');
    if (!carousel) return;
    const track = carousel.querySelector('.hero-carousel__track');
    const dots = Array.from(carousel.querySelectorAll('.dot'));
    let pauseTimer = null;

    const setActive = (i) => dots.forEach((d, j) => d.setAttribute('aria-current', String(j === i)));
    const goTo = (i) => track.scrollTo({ left: track.clientWidth * i, behavior: 'smooth' });

    track.addEventListener('scroll', () => {
      const i = Math.round(track.scrollLeft / track.clientWidth);
      setActive(i);
    });
    dots.forEach((dot) => dot.addEventListener('click', () => goTo(Number(dot.dataset.slide))));

    const pause = () => {
      clearInterval(heroAutoplay);
      clearTimeout(pauseTimer);
      pauseTimer = setTimeout(start, 6000);
    };
    ['pointerdown', 'touchstart'].forEach((ev) => track.addEventListener(ev, pause, { passive: true }));

    function start() {
      clearInterval(heroAutoplay);
      heroAutoplay = setInterval(() => {
        const next = (Math.round(track.scrollLeft / track.clientWidth) + 1) % dots.length;
        goTo(next);
      }, 4500);
    }
    start();
  }

  function setActivePhase(i) {
    const buttons = app.querySelectorAll('.phase');
    const caption = $('#phaseCaption');
    buttons.forEach((btn, idx) => btn.setAttribute('aria-pressed', String(idx === i)));
    const nextText = i == null ? C.home.phasesText : (C.home.phasesDescriptions || [])[i] || C.home.phasesText;
    if (caption) {
      caption.classList.add('is-swapping');
      setTimeout(() => {
        caption.textContent = nextText;
        caption.classList.remove('is-swapping');
      }, 140);
    }
  }

  let phaseAutoplay = null;
  let phasePauseTimer = null;
  function initPhaseAutoplay() {
    if (phaseAutoplay) clearInterval(phaseAutoplay);
    const phases = app.querySelectorAll('.phase');
    if (!phases.length) return;
    let idx = 0;
    setActivePhase(idx);
    phaseAutoplay = setInterval(() => {
      idx = (idx + 1) % phases.length;
      setActivePhase(idx);
    }, 3200);
  }
  function pausePhaseAutoplay() {
    clearInterval(phaseAutoplay);
    clearTimeout(phasePauseTimer);
    phasePauseTimer = setTimeout(initPhaseAutoplay, 6000);
  }

  function bindPage() {
    initScrollReveal();
    initHeroCarousel();
    initPhaseAutoplay();
    renderInsurance();
    const search = $('#insSearch');
    if (search) search.addEventListener('input', (e) => { state.insQuery = e.target.value; renderInsurance(); });

    const form = $('#contactForm');
    if (form) {
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const status = $('#formStatus');
        const data = Object.fromEntries(new FormData(form));
        if (!data.name.trim() || !data.whatsapp.trim()) {
          status.className = 'form-status err';
          status.textContent = 'Preencha seu nome e WhatsApp.';
          return;
        }
        const btn = form.querySelector('button');
        btn.disabled = true;
        try {
          const r = await fetch('/api/contact.php', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
          const j = await r.json();
          if (!r.ok) throw new Error(j.error || 'Erro ao enviar');
          form.reset();
          status.className = 'form-status ok';
          status.textContent = 'Mensagem enviada! Em breve entraremos em contato.';
        } catch (err) {
          status.className = 'form-status err';
          status.textContent = err.message;
        } finally {
          btn.disabled = false;
        }
      });
    }
    initEditMode();
  }

  app.addEventListener('click', (e) => {
    if (editingMode && e.target.closest('[data-edit],[data-edit-media],[data-add],[data-del],.edit-media-btn')) return;
    const phaseBtn = e.target.closest('[data-phase]');
    if (phaseBtn) {
      const i = Number(phaseBtn.dataset.phase);
      const alreadyActive = phaseBtn.getAttribute('aria-pressed') === 'true';
      setActivePhase(alreadyActive ? null : i);
      pausePhaseAutoplay();
      return;
    }
    const chip = e.target.closest('[data-filter]');
    if (chip) {
      state[chip.dataset.filter === 'blog' ? 'blogFilter' : 'docFilter'] = chip.dataset.value;
      const x = chip.parentElement.scrollLeft;
      render();
      const bar = $('.chips');
      if (bar) bar.scrollLeft = x;
      return;
    }
    const prof = e.target.closest('[data-profile]');
    if (prof) {
      const d = C.specialists.find((s) => s.id === prof.dataset.profile);
      if (d)
        openSheet(`<img class="avatar" src="${esc(d.photo)}" alt="" data-edit-media="specialists.#${esc(d.id)}.photo" /><span class="tag-text" data-edit="specialists.#${esc(d.id)}.specialty">${esc(d.specialty)}</span>
          <h3 data-edit="specialists.#${esc(d.id)}.name">${esc(d.name)}</h3><span class="meta" data-edit="specialists.#${esc(d.id)}.crm">${esc(d.crm)}</span><div class="prose" style="margin:14px 0 18px" data-edit="specialists.#${esc(d.id)}.bio" data-edit-multiline>${paragraphs(d.bio)}</div>
          <a class="btn btn--primary" href="${waLink(`Olá! Gostaria de agendar uma consulta com ${d.name} (${d.specialty}).`)}" target="_blank" rel="noopener">${icon('whats')} Agendar consulta</a>`);
      return;
    }
    const g = e.target.closest('[data-gallery]');
    if (g) {
      const item = C.about.gallery[Number(g.dataset.gallery)];
      if (item)
        openSheet(`<figure>${isVideo(item.src) ? `<video src="${esc(item.src)}" controls autoplay playsinline></video>` : `<img src="${esc(item.src)}" alt="${esc(item.caption)}" />`}
          ${item.caption ? `<figcaption>${esc(item.caption)}</figcaption>` : ''}</figure>`);
    }
  });

  // ---------- Roteamento ----------
  function parseRoute() {
    const raw = location.hash.replace(/^#/, '') || '/';
    const [path, query] = raw.split('?');
    const params = new URLSearchParams(query || '');
    const m = path.match(/^\/blog\/(.+)$/);
    if (m) return { key: '/blog/:id', arg: decodeURIComponent(m[1]), base: '/blog', params };
    return { key: pages[path] ? path : '/', base: pages[path] ? path : '/', params };
  }

  function render() {
    const r = parseRoute();
    if (r.key === '/especialistas' && r.params.get('f')) {
      state.docFilter = r.params.get('f');
      history.replaceState(null, '', '#/especialistas');
    }
    app.innerHTML = pages[r.key](r.arg);
    document.body.classList.toggle('is-home', r.key === '/');
    $('#backBtn').hidden = r.key === '/';
    document.querySelectorAll('[data-route]').forEach((a) => {
      if (a.dataset.route === r.base) a.setAttribute('aria-current', 'page');
      else a.removeAttribute('aria-current');
    });
    bindPage();
  }

  function onNavigate() {
    closeOverlays();
    render();
    window.scrollTo(0, 0);
    app.focus({ preventScroll: true });
  }

  function buildChrome() {
    $('#tabbar').innerHTML = TABS.map((t) => `<a class="tab" href="#${t.path}" data-route="${t.path}">${icon(t.icon)}<span>${t.label}</span></a>`).join('');
    $('#desktopNav').innerHTML = MENU.map((t) => `<a href="#${t.path}" data-route="${t.path}">${t.label}</a>`).join('');
    $('#drawerLinks').innerHTML = MENU.map(
      (t) => `<a href="#${t.path}" data-route="${t.path}"><span class="ico">${icon(t.icon)}</span><span class="drawer__label">${t.label}</span>${icon('arrow')}</a>`
    ).join('');
    $('#drawerWhats').href = waLink();
    $('#drawerWhats').innerHTML = `${icon('whats')} Agendar pelo WhatsApp`;
    document.querySelectorAll('[data-bind]').forEach((el) => {
      const [sec, key] = el.dataset.bind.split('.');
      if (C[sec] && C[sec][key]) el.textContent = C[sec][key];
    });
    if (C.settings.logo) $('#brandLogo').src = C.settings.logo;

    $('#menuBtn').addEventListener('click', openDrawer);
    $('#backBtn').addEventListener('click', () => (history.length > 1 ? history.back() : (location.hash = '#/')));
    document.addEventListener('click', (e) => { if (e.target.closest('[data-close]')) closeOverlays(); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeOverlays(); });

    initCookieBar();
  }

  function initCookieBar() {
    const bar = $('#cookieBar');
    if (!bar) return;
    let accepted = false;
    try { accepted = localStorage.getItem('cookieConsent') === '1'; } catch {}
    if (accepted) return;
    const p = C.privacy || {};
    $('#cookieBarText').textContent = p.bannerText || 'Usamos cookies estritamente necessários para o funcionamento do site, em conformidade com a LGPD.';
    $('#cookieBarBtn').textContent = p.bannerButton || 'Entendi';
    bar.hidden = false;
    $('#cookieBarBtn').addEventListener('click', () => {
      try { localStorage.setItem('cookieConsent', '1'); } catch {}
      bar.hidden = true;
    });
    $('#cookieBarLink').addEventListener('click', () => { bar.hidden = true; });
  }

  // ---------- Modo administrador ----------
  async function checkAdmin() {
    try {
      const r = await fetch('/api/admin/me.php', { credentials: 'same-origin' });
      isAdmin = r.ok;
    } catch {
      isAdmin = false;
    }
  }

  async function refreshMsgCount() {
    try {
      const r = await fetch('/api/admin/messages.php', { credentials: 'same-origin' });
      const msgs = await r.json();
      const unread = msgs.filter((m) => !m.read).length;
      const badge = $('#editMsgsCount');
      if (unread) { badge.hidden = false; badge.textContent = unread; } else badge.hidden = true;
    } catch {}
  }

  async function openMessages() {
    try {
      const r = await fetch('/api/admin/messages.php', { credentials: 'same-origin' });
      const msgs = await r.json();
      const html = msgs.length
        ? `<div class="msg-list">${msgs
            .map(
              (m) => `<div class="msg-item ${m.read ? '' : 'unread'}">
            <div class="msg-item__head"><strong>${esc(m.name)}</strong><span class="meta">${new Date(m.createdAt).toLocaleString('pt-BR')}</span></div>
            <p>${esc(m.message)}</p>
            <div class="row">
              <a class="btn btn--sm btn--outline" href="https://wa.me/55${digits(m.whatsapp)}" target="_blank" rel="noopener">Responder no WhatsApp</a>
              <button type="button" class="btn btn--sm btn--outline" data-msg-read="${esc(m.id)}">${m.read ? 'Marcar não lida' : 'Marcar lida'}</button>
              <button type="button" class="btn btn--sm btn--danger" data-msg-del="${esc(m.id)}">Excluir</button>
            </div>
          </div>`
            )
            .join('')}</div>`
        : '<p class="empty">Nenhuma mensagem recebida ainda.</p>';
      openSheet(`<h3>Mensagens recebidas</h3>${html}`);
    } catch {
      toast('Erro ao carregar mensagens.', true);
    }
  }

  document.addEventListener('click', async (e) => {
    const readBtn = e.target.closest('[data-msg-read]');
    if (readBtn) {
      const item = readBtn.closest('.msg-item');
      const willRead = item.classList.contains('unread');
      await fetch(`/api/admin/message-read.php?id=${readBtn.dataset.msgRead}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ read: willRead }),
      });
      openMessages();
      refreshMsgCount();
      return;
    }
    const delBtn = e.target.closest('[data-msg-del]');
    if (delBtn) {
      if (!confirm('Excluir esta mensagem?')) return;
      await fetch(`/api/admin/message-delete.php?id=${delBtn.dataset.msgDel}`, { method: 'POST', credentials: 'same-origin' });
      openMessages();
      refreshMsgCount();
    }
  });

  function setupEditBar() {
    const bar = $('#editBar');
    if (!isAdmin) return;
    bar.hidden = false;
    document.body.classList.add('is-admin');
    const toggleBtn = $('#editToggleBtn');
    toggleBtn.addEventListener('click', () => {
      editingMode = !editingMode;
      document.body.classList.toggle('is-editing', editingMode);
      toggleBtn.innerHTML = editingMode ? '✅ <span>Concluir edição</span>' : '✏️ <span>Editar página</span>';
      if (editingMode) initEditMode();
    });
    $('#editLogoutBtn').addEventListener('click', async () => {
      if (!confirm('Sair do modo administrador?')) return;
      await fetch('/api/admin/logout.php', { method: 'POST', credentials: 'same-origin' });
      location.reload();
    });
    $('#editMsgsBtn').addEventListener('click', openMessages);
    $('#editPassBtn').addEventListener('click', openPasswordSheet);
    refreshMsgCount();
  }

  function openPasswordSheet() {
    openSheet(`<h3>Alterar senha</h3>
      <form id="pwForm">
        <div class="form-field"><label class="field-label">Senha atual</label><input class="input" type="password" name="current" autocomplete="current-password" required /></div>
        <div class="form-field"><label class="field-label">Nova senha (mín. 8 caracteres)</label><input class="input" type="password" name="next" minlength="8" autocomplete="new-password" required /></div>
        <button class="btn btn--primary" type="submit">Salvar nova senha</button>
        <p class="form-status" id="pwStatus" role="status"></p>
      </form>`);
  }
  document.addEventListener('submit', async (e) => {
    if (e.target.id !== 'pwForm') return;
    e.preventDefault();
    const status = $('#pwStatus');
    const data = Object.fromEntries(new FormData(e.target));
    try {
      const r = await fetch('/api/admin/password.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify(data),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || 'Erro ao trocar senha.');
      status.className = 'form-status ok';
      status.textContent = 'Senha alterada com sucesso.';
      e.target.reset();
    } catch (err) {
      status.className = 'form-status err';
      status.textContent = err.message;
    }
  });

  Promise.all([fetch('/api/content.php').then((r) => r.json()), checkAdmin()])
    .then(async ([data]) => {
      C = data;
      if (isAdmin) await loadMediaLibrary();
      buildChrome();
      setupEditBar();
      render();
      window.addEventListener('hashchange', onNavigate);
    })
    .catch(() => {
      app.innerHTML = '<p class="empty">Não foi possível carregar o conteúdo. Tente novamente em instantes.</p>';
    });
})();
