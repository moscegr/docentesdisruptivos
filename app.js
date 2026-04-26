
const STORAGE_KEY = 'ddRobustoState.v1';
const PHOTO_KEY = 'ddRobustoProfilePhoto.v1';
const DEFAULT_PHOTO = 'assets/perfil.jpeg';

const DEFAULT_STATE = {
  profile: {
    name: 'Docente',
    email: '',
    plantel: 'CBTIS / CETIS / DGETI',
    area: 'Ciencias Sociales',
    goals: 'Fortalecer mediación pedagógica y evidencias del pilotaje.'
  },
  modules: {
    1: 'Completado',
    2: 'Completado',
    3: 'Completado',
    4: 'Completado',
    5: 'En curso',
    6: 'Pendiente'
  },
  diagnostics: [],
  webinarRegistrations: [],
  evidence: [],
  lessonPlans: [],
  feedback: [],
  bookmarks: [],
  notifications: [
    'Tienes un webinar disponible: Uso ético de la IA en el bachillerato.',
    'Recuerda subir una evidencia breve del módulo 5.',
  ],
  dismissedNotifications: []
};

function loadState() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return structuredClone(DEFAULT_STATE);
    return { ...structuredClone(DEFAULT_STATE), ...JSON.parse(saved) };
  } catch (e) {
    return structuredClone(DEFAULT_STATE);
  }
}
function saveState(state) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (e) {}
}
let state = loadState();

const MODULES = [
  { id: 1, title: 'Diagnóstico y sensibilización docente' },
  { id: 2, title: 'Alineación con NEM y MCCEMS' },
  { id: 3, title: 'Selección de tecnologías disruptivas' },
  { id: 4, title: 'Diseño didáctico innovador' },
  { id: 5, title: 'Implementación y mediación pedagógica' },
  { id: 6, title: 'Evaluación, evidencias y mejora continua' },
];

function calculateProgress() {
  const weights = { 'Pendiente': 0, 'En curso': 0.5, 'Completado': 1 };
  const sum = MODULES.reduce((acc, module) => acc + (weights[state.modules[module.id]] ?? 0), 0);
  return Math.round((sum / MODULES.length) * 100);
}
function completedCount() {
  return MODULES.filter(m => state.modules[m.id] === 'Completado').length;
}
function statusClass(status) {
  return 'status-' + status.toLowerCase().replace(/ /g, '-').replace('ó','o').replace('í','i');
}
function qs(selector, root = document) { return root.querySelector(selector); }
function qsa(selector, root = document) { return [...root.querySelectorAll(selector)]; }
function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, ch => (
    { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[ch]
  ));
}

function showNotice(el, kind, text) {
  if (!el) return;
  el.className = 'notice show ' + kind;
  el.textContent = text;
  setTimeout(() => el.classList.remove('show'), 3600);
}

/* ===== Foto de perfil ===== */
function getProfilePhoto() {
  try { return localStorage.getItem(PHOTO_KEY) || DEFAULT_PHOTO; }
  catch (e) { return DEFAULT_PHOTO; }
}
function setProfilePhoto(dataUrl) {
  try {
    if (dataUrl) localStorage.setItem(PHOTO_KEY, dataUrl);
    else localStorage.removeItem(PHOTO_KEY);
  } catch (e) {}
  qsa('[data-profile-photo]').forEach(img => img.src = dataUrl || DEFAULT_PHOTO);
}

function renderSharedBits() {
  qsa('[data-mobile-toggle]').forEach(btn => {
    if (btn.dataset.bound) return;
    btn.dataset.bound = '1';
    btn.setAttribute('aria-expanded', 'false');
    btn.addEventListener('click', () => {
      const links = qs('[data-nav-links]');
      if (!links) return;
      const isOpen = links.classList.toggle('show');
      btn.setAttribute('aria-expanded', String(isOpen));
      btn.setAttribute('aria-label', isOpen ? 'Cerrar menú' : 'Abrir menú');
    });
  });
  qsa('[data-profile-name]').forEach(el => el.textContent = state.profile.name || 'Docente');
  qsa('[data-profile-plantel]').forEach(el => el.textContent = state.profile.plantel || '');
  qsa('[data-progress-text]').forEach(el => el.textContent = calculateProgress() + '%');
  qsa('[data-progress-bar]').forEach(el => el.style.width = calculateProgress() + '%');
  qsa('[data-completed-count]').forEach(el => el.textContent = `${completedCount()} de 6 módulos completados`);
  qsa('[data-evidence-count]').forEach(el => el.textContent = String(state.evidence.length));
  qsa('[data-profile-photo]').forEach(img => { img.src = getProfilePhoto(); });
}

function renderRoute(targetSelector = '#dashboard-route') {
  const target = qs(targetSelector);
  if (!target) return;
  target.innerHTML = '';
  MODULES.forEach(module => {
    const item = document.createElement('article');
    const status = state.modules[module.id];
    item.className = 'timeline-item' + (status === 'En curso' ? ' is-active' : '');
    item.innerHTML = `
      <div class="bubble">${module.id}</div>
      <div>
        <strong>${module.title}</strong>
        <small>${status === 'Completado' ? 'Producto integrado en tu portafolio.' : status === 'En curso' ? 'Módulo activo para pilotaje.' : 'Disponible cuando concluyas el módulo previo.'}</small>
      </div>
      <span class="status-pill ${statusClass(status)}">${status}</span>
    `;
    target.appendChild(item);
  });
}

function bindDiagnosticsForm() {
  const form = qs('#diagnostic-form');
  if (!form) return;
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const fd = new FormData(form);
    const entry = Object.fromEntries(fd.entries());
    entry.timestamp = new Date().toISOString();
    state.diagnostics.unshift(entry);
    state.profile.name = entry.nombre || state.profile.name;
    state.profile.plantel = entry.plantel || state.profile.plantel;
    state.profile.area = entry.area || state.profile.area;
    if (state.modules[1] !== 'Completado') state.modules[1] = 'Completado';
    saveState(state);
    renderSharedBits();
    renderRoute();
    renderDiagnosticSummary();
    showNotice(qs('#diagnostic-notice'), 'success', 'Diagnóstico guardado. La ruta se actualizó para continuar con la alineación curricular.');
    form.reset();
  });
}
function renderDiagnosticSummary() {
  const target = qs('#diagnostic-summary');
  if (!target) return;
  if (!state.diagnostics.length) {
    target.innerHTML = '<p class="muted">Aún no hay diagnósticos registrados. Completa el formulario para visualizar resultados.</p>';
    return;
  }
  const latest = state.diagnostics[0];
  target.innerHTML = `
    <div class="chip-row">
      <span class="chip">Plantel: ${escapeHtml(latest.plantel || 'Sin dato')}</span>
      <span class="chip">Área: ${escapeHtml(latest.area || 'Sin dato')}</span>
      <span class="chip">Competencia digital: ${escapeHtml(latest.competencia || 'Sin dato')}</span>
      <span class="chip">Infraestructura: ${escapeHtml(latest.infraestructura || 'Sin dato')}</span>
    </div>
    <p class="section-intro"><strong>Necesidad prioritaria:</strong> ${escapeHtml(latest.necesidad || 'Sin dato')}.</p>
    <p class="section-intro"><strong>Meta de pilotaje:</strong> ${escapeHtml(latest.meta || 'Sin dato')}.</p>
  `;
}

function bindLessonPlanForm() {
  const form = qs('#lesson-plan-form');
  if (!form) return;
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const fd = new FormData(form);
    const entry = Object.fromEntries(fd.entries());
    entry.timestamp = new Date().toISOString();
    state.lessonPlans.unshift(entry);
    state.modules[4] = 'Completado';
    state.modules[5] = 'En curso';
    saveState(state);
    renderSharedBits();
    renderRoute();
    renderLessonPlans();
    showNotice(qs('#lesson-plan-notice'), 'success', 'Planeación guardada. Ya puedes usarla como actividad integradora del prototipo.');
    form.reset();
  });
}
function renderLessonPlans() {
  const target = qs('#lesson-plan-list');
  if (!target) return;
  if (!state.lessonPlans.length) {
    target.innerHTML = '<p class="muted">No has guardado secuencias todavía.</p>';
    return;
  }
  target.innerHTML = state.lessonPlans.slice(0, 5).map(item => `
    <article class="panel-card">
      <strong>${escapeHtml(item.titulo)}</strong>
      <p class="help-text">${escapeHtml(item.asignatura)} · ${escapeHtml(item.tecnologia)} · ${escapeHtml(item.semestre)}</p>
      <p class="section-intro">${escapeHtml(item.objetivo)}</p>
    </article>
  `).join('');
}

function bindWebinarForm() {
  const form = qs('#webinar-form');
  if (!form) return;
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const fd = new FormData(form);
    const entry = Object.fromEntries(fd.entries());
    entry.timestamp = new Date().toISOString();
    state.webinarRegistrations.unshift(entry);
    saveState(state);
    renderWebinarList();
    showNotice(qs('#webinar-notice'), 'success', 'Registro realizado. El webinar quedó agregado a tus actividades del pilotaje.');
    form.reset();
  });
}
function renderWebinarList() {
  const target = qs('#webinar-registrations');
  if (!target) return;
  if (!state.webinarRegistrations.length) {
    target.innerHTML = '<p class="muted">Aún no te has inscrito a webinars.</p>';
    return;
  }
  target.innerHTML = state.webinarRegistrations.map(item => `
    <article class="forum-card">
      <strong>${escapeHtml(item.webinar)}</strong>
      <span class="muted small">${escapeHtml(item.nombre)} · ${escapeHtml(item.correo)}</span>
      <span class="chip">Inscrito</span>
    </article>
  `).join('');
}

function bindEvidenceForm() {
  const form = qs('#evidence-form');
  if (!form) return;
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const fd = new FormData(form);
    const entry = Object.fromEntries(fd.entries());
    entry.timestamp = new Date().toISOString();
    state.evidence.unshift(entry);
    if (state.evidence.length >= 1) state.modules[5] = 'Completado';
    if (state.evidence.length >= 2) state.modules[6] = 'En curso';
    saveState(state);
    renderSharedBits();
    renderRoute();
    renderEvidenceList();
    renderAnalytics();
    showNotice(qs('#evidence-notice'), 'success', 'Evidencia guardada en el portafolio del pilotaje.');
    form.reset();
  });
}
function renderEvidenceList() {
  const target = qs('#evidence-list');
  if (!target) return;
  if (!state.evidence.length) {
    target.innerHTML = '<p class="muted">Todavía no hay evidencias registradas. Sube una evidencia para alimentar el pilotaje.</p>';
    return;
  }
  target.innerHTML = state.evidence.map((item, index) => `
    <article class="panel-card">
      <div class="chip-row">
        <span class="chip">${escapeHtml(item.modulo)}</span>
        <span class="chip">${escapeHtml(item.tipo)}</span>
        <span class="chip">${escapeHtml(item.nivelImpacto || 'Impacto por definir')}</span>
      </div>
      <h3>${escapeHtml(item.titulo)}</h3>
      <p class="section-intro">${escapeHtml(item.descripcion)}</p>
      <div class="toolbar">
        <button class="btn btn-light" type="button" data-delete-evidence="${index}">Eliminar</button>
      </div>
    </article>
  `).join('');
  qsa('[data-delete-evidence]').forEach(btn => btn.addEventListener('click', () => {
    state.evidence.splice(Number(btn.dataset.deleteEvidence), 1);
    saveState(state);
    renderSharedBits();
    renderEvidenceList();
    renderAnalytics();
  }));
}

function bindFeedbackForm() {
  const form = qs('#feedback-form');
  if (!form) return;
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const fd = new FormData(form);
    const entry = Object.fromEntries(fd.entries());
    entry.timestamp = new Date().toISOString();
    state.feedback.unshift(entry);
    saveState(state);
    renderFeedbackList();
    showNotice(qs('#feedback-notice'), 'success', 'Retroalimentación del pilotaje almacenada.');
    form.reset();
  });
}
function renderFeedbackList() {
  const target = qs('#feedback-list');
  if (!target) return;
  if (!state.feedback.length) {
    target.innerHTML = '<p class="muted">Todavía no hay comentarios de pilotaje registrados.</p>';
    return;
  }
  target.innerHTML = state.feedback.slice(0, 6).map(item => `
    <article class="forum-card">
      <strong>${escapeHtml(item.rol)} · ${escapeHtml(item.aspecto)}</strong>
      <span class="muted small">Valoración: ${escapeHtml(item.valoracion)}/5</span>
      <p class="section-intro">${escapeHtml(item.comentario)}</p>
    </article>
  `).join('');
}

function bindBookmarks() {
  qsa('[data-bookmark]').forEach(btn => {
    const value = btn.dataset.bookmark;
    if (state.bookmarks.includes(value)) btn.textContent = 'Guardado';
    btn.addEventListener('click', () => {
      if (!state.bookmarks.includes(value)) {
        state.bookmarks.push(value);
        saveState(state);
        btn.textContent = 'Guardado';
      }
    });
  });
}

function bindResourceFilters() {
  const search = qs('#resource-search');
  const type = qs('#resource-type');
  const category = qs('#resource-category');
  const level = qs('#resource-level');
  const cards = qsa('[data-resource-card]');
  if (!cards.length) return;
  const update = () => {
    const query = (search?.value || '').toLowerCase().trim();
    cards.forEach(card => {
      const haystack = card.dataset.resourceText.toLowerCase();
      const visible = (!query || haystack.includes(query))
        && (!type?.value || card.dataset.type === type.value)
        && (!category?.value || card.dataset.category === category.value)
        && (!level?.value || card.dataset.level === level.value);
      card.classList.toggle('hidden', !visible);
    });
  };
  [search, type, category, level].forEach(el => el?.addEventListener('input', update));
}

function bindTabs() {
  qsa('[data-tab-group]').forEach(group => {
    const buttons = qsa('[data-tab-btn]', group);
    const panes = qsa('[data-tab-pane]', group.parentElement);
    group.setAttribute('role', 'tablist');
    buttons.forEach((btn, idx) => {
      btn.setAttribute('role', 'tab');
      btn.setAttribute('aria-selected', btn.classList.contains('active') ? 'true' : 'false');
      btn.setAttribute('tabindex', btn.classList.contains('active') ? '0' : '-1');
      btn.addEventListener('click', () => activateTab(buttons, panes, btn));
      btn.addEventListener('keydown', (e) => {
        let next = null;
        if (e.key === 'ArrowRight') next = buttons[(idx + 1) % buttons.length];
        else if (e.key === 'ArrowLeft') next = buttons[(idx - 1 + buttons.length) % buttons.length];
        else if (e.key === 'Home') next = buttons[0];
        else if (e.key === 'End') next = buttons[buttons.length - 1];
        if (next) { e.preventDefault(); activateTab(buttons, panes, next); next.focus(); }
      });
    });
    panes.forEach(p => p.setAttribute('role', 'tabpanel'));
  });
}
function activateTab(buttons, panes, target) {
  buttons.forEach(b => {
    b.classList.remove('active');
    b.setAttribute('tabindex', '-1');
    b.setAttribute('aria-selected', 'false');
  });
  panes.forEach(p => p.classList.remove('active'));
  target.classList.add('active');
  target.setAttribute('tabindex', '0');
  target.setAttribute('aria-selected', 'true');
  const container = target.closest('.container') || document;
  qs(`[data-tab-pane="${target.dataset.tabBtn}"]`, container)?.classList.add('active');
}

function renderAnalytics() {
  qsa('[data-analytics-progress]').forEach(el => el.textContent = calculateProgress() + '%');
  qsa('[data-kpi-diagnostics]').forEach(el => el.textContent = state.diagnostics.length);
  qsa('[data-kpi-plans]').forEach(el => el.textContent = state.lessonPlans.length);
  qsa('[data-kpi-evidence]').forEach(el => el.textContent = state.evidence.length);
  qsa('[data-kpi-feedback]').forEach(el => el.textContent = state.feedback.length);
  const chart = qs('#pilotage-bars');
  if (chart) {
    const values = [
      { label: 'Diagnóstico', value: Math.min(state.diagnostics.length * 22, 100) },
      { label: 'Planeaciones', value: Math.min(state.lessonPlans.length * 28, 100) },
      { label: 'Evidencias', value: Math.min(state.evidence.length * 26, 100) },
      { label: 'Retro', value: Math.min(state.feedback.length * 20, 100) },
      { label: 'Ruta', value: calculateProgress() },
    ];
    chart.innerHTML = values.map(item => `
      <div class="bar" style="height:${Math.max(item.value, 10)}%">
        <span>${item.value}%</span>
        <label>${item.label}</label>
      </div>
    `).join('');
  }
  const summary = qs('#pilotage-summary');
  if (summary) {
    summary.innerHTML = `
      <li>Diagnósticos registrados: <strong>${state.diagnostics.length}</strong></li>
      <li>Planeaciones guardadas: <strong>${state.lessonPlans.length}</strong></li>
      <li>Evidencias en portafolio: <strong>${state.evidence.length}</strong></li>
      <li>Retroalimentaciones capturadas: <strong>${state.feedback.length}</strong></li>
    `;
  }
}

function bindProfileForm() {
  const form = qs('#profile-form');
  if (!form) return;
  ['nombre','correo','plantel','area','metas'].forEach(name => {
    const field = form.elements[name];
    if (!field) return;
    const map = { nombre: 'name', correo: 'email', plantel: 'plantel', area: 'area', metas: 'goals' };
    field.value = state.profile[map[name]] || '';
  });
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const fd = new FormData(form);
    state.profile.name = fd.get('nombre');
    state.profile.email = fd.get('correo');
    state.profile.plantel = fd.get('plantel');
    state.profile.area = fd.get('area');
    state.profile.goals = fd.get('metas');
    saveState(state);
    renderSharedBits();
    showNotice(qs('#profile-notice'), 'success', 'Perfil actualizado correctamente.');
  });
}

function bindProfilePhoto() {
  const input = qs('#profile-photo-input');
  const removeBtn = qs('#profile-photo-remove');
  if (input) {
    input.addEventListener('change', () => {
      const file = input.files?.[0];
      if (!file) return;
      if (!file.type.startsWith('image/')) {
        showNotice(qs('#profile-notice'), 'error', 'Selecciona un archivo de imagen válido.');
        input.value = '';
        return;
      }
      if (file.size > 1.5 * 1024 * 1024) {
        showNotice(qs('#profile-notice'), 'error', 'La imagen excede 1.5 MB. Usa una más ligera.');
        input.value = '';
        return;
      }
      const reader = new FileReader();
      reader.onload = (e) => {
        setProfilePhoto(e.target.result);
        showNotice(qs('#profile-notice'), 'success', 'Foto de perfil actualizada.');
      };
      reader.onerror = () => showNotice(qs('#profile-notice'), 'error', 'No se pudo leer la imagen.');
      reader.readAsDataURL(file);
      input.value = '';
    });
  }
  if (removeBtn) {
    removeBtn.addEventListener('click', () => {
      setProfilePhoto(null);
      showNotice(qs('#profile-notice'), 'success', 'Se restauró la foto predeterminada.');
    });
  }
}

function bindResetButton() {
  const btn = qs('#reset-state');
  if (!btn) return;
  btn.addEventListener('click', () => {
    if (!confirm('Se borrarán los datos guardados en este navegador. ¿Deseas continuar?')) return;
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(PHOTO_KEY);
    state = loadState();
    location.reload();
  });
}

function bindExportButton() {
  const btn = qs('#export-state');
  if (!btn) return;
  btn.addEventListener('click', () => {
    const payload = JSON.stringify(state, null, 2);
    const blob = new Blob([payload], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `docentes-disruptivos-datos-${new Date().toISOString().slice(0,10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  });
}

/* ===== Notificaciones ===== */
function renderNotifications() {
  const target = qs('#notifications-panel');
  if (!target) return;
  const items = (state.notifications || []).filter(n => !state.dismissedNotifications.includes(n));
  if (!items.length) {
    target.innerHTML = '<p class="section-intro" style="color:rgba(255,255,255,.7);margin:0;">No tienes avisos pendientes ahora mismo.</p>';
    return;
  }
  target.innerHTML = items.map(text => `
    <div class="notification-item">
      <div class="notif-icon" aria-hidden="true">🔔</div>
      <div>${escapeHtml(text)}</div>
      <button class="notif-dismiss" type="button" data-dismiss="${escapeHtml(text)}" aria-label="Descartar aviso">×</button>
    </div>
  `).join('');
  qsa('[data-dismiss]', target).forEach(btn => {
    btn.addEventListener('click', () => {
      const value = btn.dataset.dismiss;
      if (!state.dismissedNotifications.includes(value)) state.dismissedNotifications.push(value);
      saveState(state);
      renderNotifications();
    });
  });
}

/* ===== Búsqueda global ===== */
function bindGlobalSearch() {
  const input = qs('[data-global-search]');
  const results = qs('[data-search-results]');
  if (!input || !results) return;

  const buildIndex = () => {
    const idx = [];
    MODULES.forEach(m => idx.push({
      type: 'Módulo', label: m.title, sublabel: state.modules[m.id], href: 'modulos.html'
    }));
    state.evidence.forEach(ev => idx.push({
      type: 'Evidencia',
      label: ev.titulo || 'Evidencia sin título',
      sublabel: [ev.modulo, ev.tipo].filter(Boolean).join(' · '),
      href: 'evidencias.html'
    }));
    state.lessonPlans.forEach(plan => idx.push({
      type: 'Planeación',
      label: plan.titulo || 'Planeación sin título',
      sublabel: [plan.asignatura, plan.tecnologia].filter(Boolean).join(' · '),
      href: 'modulos.html'
    }));
    state.diagnostics.forEach((d, i) => idx.push({
      type: 'Diagnóstico',
      label: `Diagnóstico ${i + 1}`,
      sublabel: d.plantel || '',
      href: 'metodologia.html#diagnostico'
    }));
    [
      { label: 'Recursos y biblioteca', href: 'recursos.html' },
      { label: 'Comunidad y webinars', href: 'comunidad.html' },
      { label: 'Analítica de pilotaje', href: 'pilotaje.html' },
      { label: 'DGETI · Vinculación institucional', href: 'dgeti.html' },
    ].forEach(p => idx.push({ type: 'Página', label: p.label, sublabel: '', href: p.href }));
    return idx;
  };

  const render = (query) => {
    const q = query.trim().toLowerCase();
    if (!q) { results.classList.remove('show'); results.innerHTML = ''; return; }
    const idx = buildIndex();
    const matches = idx.filter(i =>
      (i.label || '').toLowerCase().includes(q) ||
      (i.sublabel || '').toLowerCase().includes(q) ||
      (i.type || '').toLowerCase().includes(q)
    ).slice(0, 8);
    results.classList.add('show');
    if (!matches.length) {
      results.innerHTML = '<div class="search-empty">No se encontraron coincidencias.</div>';
      return;
    }
    results.innerHTML = matches.map(m => `
      <a class="search-result-item" href="${m.href}">
        <span class="chip">${escapeHtml(m.type)}</span>
        <span><strong>${escapeHtml(m.label)}</strong>${m.sublabel ? `<br><small>${escapeHtml(m.sublabel)}</small>` : ''}</span>
        <span aria-hidden="true">→</span>
      </a>
    `).join('');
  };

  input.addEventListener('input', () => render(input.value));
  input.addEventListener('focus', () => { if (input.value.trim()) render(input.value); });
  document.addEventListener('click', (e) => {
    if (!results.contains(e.target) && e.target !== input) {
      results.classList.remove('show');
    }
  });
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { results.classList.remove('show'); input.blur(); }
  });
}

/* ===== Botón volver arriba ===== */
function bindBackToTop() {
  if (qs('.back-to-top')) return;
  const btn = document.createElement('button');
  btn.className = 'back-to-top';
  btn.type = 'button';
  btn.setAttribute('aria-label', 'Volver al inicio de la página');
  btn.textContent = '↑';
  document.body.appendChild(btn);
  btn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
  const onScroll = () => btn.classList.toggle('is-visible', window.scrollY > 320);
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
}

/* ===== Tablas con scroll horizontal en móvil ===== */
function wrapTablesForScroll() {
  qsa('.table-card table').forEach(table => {
    if (table.parentElement.classList.contains('table-scroll')) return;
    const wrap = document.createElement('div');
    wrap.className = 'table-scroll';
    table.parentNode.insertBefore(wrap, table);
    wrap.appendChild(table);
  });
}

/* ===== Cierra el menú móvil al elegir una opción ===== */
function closeMobileMenuOnNav() {
  qsa('[data-nav-links] a').forEach(link => {
    link.addEventListener('click', () => {
      const links = qs('[data-nav-links]');
      const toggle = qs('[data-mobile-toggle]');
      if (links?.classList.contains('show')) {
        links.classList.remove('show');
        toggle?.setAttribute('aria-expanded', 'false');
        toggle?.setAttribute('aria-label', 'Abrir menú');
      }
    });
  });
}

document.addEventListener('DOMContentLoaded', () => {
  renderSharedBits();
  renderRoute();
  renderDiagnosticSummary();
  renderLessonPlans();
  renderWebinarList();
  renderEvidenceList();
  renderFeedbackList();
  renderAnalytics();
  renderNotifications();
  bindDiagnosticsForm();
  bindLessonPlanForm();
  bindWebinarForm();
  bindEvidenceForm();
  bindFeedbackForm();
  bindBookmarks();
  bindResourceFilters();
  bindTabs();
  bindProfileForm();
  bindProfilePhoto();
  bindResetButton();
  bindExportButton();
  bindGlobalSearch();
  bindBackToTop();
  wrapTablesForScroll();
  closeMobileMenuOnNav();
});
