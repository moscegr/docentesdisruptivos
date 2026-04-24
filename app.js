
const STORAGE_KEY = 'ddRobustoState.v1';
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
  ]
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
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
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

function showNotice(el, kind, text) {
  if (!el) return;
  el.className = 'notice show ' + kind;
  el.textContent = text;
  setTimeout(() => el.classList.remove('show'), 3600);
}

function renderSharedBits() {
  qsa('[data-mobile-toggle]').forEach(btn => {
    btn.addEventListener('click', () => qs('[data-nav-links]')?.classList.toggle('show'));
  });
  qsa('[data-profile-name]').forEach(el => el.textContent = state.profile.name || 'Docente');
  qsa('[data-progress-text]').forEach(el => el.textContent = calculateProgress() + '%');
  qsa('[data-progress-bar]').forEach(el => el.style.width = calculateProgress() + '%');
  qsa('[data-completed-count]').forEach(el => el.textContent = `${completedCount()} de 6 módulos completados`);
  qsa('[data-evidence-count]').forEach(el => el.textContent = String(state.evidence.length));
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
      <span class="chip">Plantel: ${latest.plantel || 'Sin dato'}</span>
      <span class="chip">Área: ${latest.area || 'Sin dato'}</span>
      <span class="chip">Competencia digital: ${latest.competencia || 'Sin dato'}</span>
      <span class="chip">Infraestructura: ${latest.infraestructura || 'Sin dato'}</span>
    </div>
    <p class="section-intro"><strong>Necesidad prioritaria:</strong> ${latest.necesidad || 'Sin dato'}.</p>
    <p class="section-intro"><strong>Meta de pilotaje:</strong> ${latest.meta || 'Sin dato'}.</p>
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
      <strong>${item.titulo}</strong>
      <p class="help-text">${item.asignatura} · ${item.tecnologia} · ${item.semestre}</p>
      <p class="section-intro">${item.objetivo}</p>
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
      <strong>${item.webinar}</strong>
      <span class="muted small">${item.nombre} · ${item.correo}</span>
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
        <span class="chip">${item.modulo}</span>
        <span class="chip">${item.tipo}</span>
        <span class="chip">${item.nivelImpacto || 'Impacto por definir'}</span>
      </div>
      <h3>${item.titulo}</h3>
      <p class="section-intro">${item.descripcion}</p>
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
      <strong>${item.rol} · ${item.aspecto}</strong>
      <span class="muted small">Valoración: ${item.valoracion}/5</span>
      <p class="section-intro">${item.comentario}</p>
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
    buttons.forEach(btn => btn.addEventListener('click', () => {
      buttons.forEach(b => b.classList.remove('active'));
      panes.forEach(p => p.classList.remove('active'));
      btn.classList.add('active');
      qs(`[data-tab-pane="${btn.dataset.tabBtn}"]`, group.parentElement)?.classList.add('active');
    }));
  });
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
    showNotice(qs('#profile-notice'), 'success', 'Perfil actualizado.');
  });
}

function bindResetButton() {
  const btn = qs('#reset-state');
  if (!btn) return;
  btn.addEventListener('click', () => {
    if (!confirm('Se borrarán los datos guardados en este navegador. ¿Deseas continuar?')) return;
    localStorage.removeItem(STORAGE_KEY);
    state = loadState();
    location.reload();
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
  bindDiagnosticsForm();
  bindLessonPlanForm();
  bindWebinarForm();
  bindEvidenceForm();
  bindFeedbackForm();
  bindBookmarks();
  bindResourceFilters();
  bindTabs();
  bindProfileForm();
  bindResetButton();
});
