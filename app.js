import { schemaSql, lessons as freeLessons } from './content.js';
import { stages, lessonCatalog } from './catalog.js';
import { createEngine } from './engine.js';
import { backend, getIdentity, initializeBackend, sendLoginLink, startPayment } from './auth.js';

const $ = id => document.getElementById(id);
const storeKey = 'zapros-course-v2';
const freeById = new Map(freeLessons.map(lesson => [lesson.id, { ...lesson, schema_sql: schemaSql }]));
const catalogById = new Map(lessonCatalog.map(lesson => [lesson.id, lesson]));
const stageById = new Map(stages.map(stage => [stage.id, stage]));
let state = { completed: [], drafts: {}, current: freeLessons[0].id };
try { const saved = JSON.parse(localStorage.getItem(storeKey)); if (saved && typeof saved === 'object') state = { ...state, ...saved }; } catch (_) {}
if (!Array.isArray(state.completed)) state.completed = [];
if (!state.drafts || typeof state.drafts !== 'object') state.drafts = {};
let current = catalogById.has(state.current) ? state.current : freeLessons[0].id;
let identity = { user: null, role: 'guest', paid: false };
let backendReady = false;
let engine;
let selectedLesson;
let selectGeneration = 0;
let expandedStage = catalogById.get(current)?.stage || 1;

const node = (tag, text, className) => {
  const element = document.createElement(tag);
  if (text != null) element.textContent = text;
  if (className) element.className = className;
  return element;
};
const persist = () => { try { localStorage.setItem(storeKey, JSON.stringify({ ...state, current })); } catch (_) {} };
const hasFullAccess = () => identity.role === 'admin' || identity.paid;
const isUnlocked = lesson => lesson.stage === 1 || hasFullAccess();

function renderNavigation() {
  const list = $('lesson-list'); list.replaceChildren();
  for (const stage of stages) {
    const group = node('div', null, 'stage-group');
    const toggle = node('button', null, 'stage-toggle'); toggle.type = 'button';
    toggle.setAttribute('aria-expanded', String(expandedStage === stage.id));
    const title = node('span', null, 'stage-summary');
    title.append(node('strong', `${String(stage.id).padStart(2, '0')}  ${stage.title}`),
      node('small', stage.outcome));
    toggle.append(title, node('span', stage.free || hasFullAccess() ? '⌄' : '⌁', 'stage-lock'));
    toggle.addEventListener('click', () => { expandedStage = expandedStage === stage.id ? 0 : stage.id; renderNavigation(); });
    group.append(toggle);
    const children = node('div', null, 'stage-lessons'); children.hidden = expandedStage !== stage.id;
    for (const lesson of lessonCatalog.filter(item => item.stage === stage.id)) {
      const complete = state.completed.includes(lesson.id);
      const button = node('button', null, 'lesson-link' + (lesson.id === current ? ' active' : '') + (complete ? ' is-complete' : ''));
      button.type = 'button'; button.setAttribute('aria-current', lesson.id === current ? 'step' : 'false');
      const mark = node('span', complete ? '✓' : isUnlocked(lesson) ? String(lesson.position).padStart(2, '0') : '♢', 'lesson-number');
      const label = node('span', null, 'lesson-label'); label.append(node('strong', lesson.title), node('small', lesson.topic));
      button.append(mark, label); button.addEventListener('click', () => selectLesson(lesson.id)); children.append(button);
    }
    group.append(children); list.append(group);
  }
  const completed = lessonCatalog.filter(lesson => state.completed.includes(lesson.id)).length;
  $('progress-text').textContent = `${completed} из ${lessonCatalog.length} уроков`;
  const percent = Math.round(completed / lessonCatalog.length * 100);
  $('progress-bar').firstElementChild.style.width = `${percent}%`;
  $('progress-bar').setAttribute('aria-valuenow', String(percent));
}

function renderStageMap() {
  const map = $('stage-map'); map.replaceChildren();
  for (const stage of stages) {
    const card = node('button', null, 'stage-group' + (stage.id === expandedStage ? ' active' : ''));
    card.type = 'button';
    const badge = node('span', stage.free ? 'Бесплатно' : hasFullAccess() ? 'Открыто' : 'Полный доступ', 'stage-badge');
    const heading = node('strong', `${String(stage.id).padStart(2, '0')} · ${stage.title}`);
    const detail = node('span', stage.description);
    const lessonsCount = lessonCatalog.filter(item => item.stage === stage.id).length;
    const count = node('small', `${lessonsCount} заданий · ${stage.outcome}`);
    card.append(badge, heading, detail, count);
    card.addEventListener('click', () => {
      expandedStage = stage.id;
      const first = lessonCatalog.find(lesson => lesson.stage === stage.id);
      if (first) selectLesson(first.id);
      $('lesson-counter').scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
    map.append(card);
  }
}

function renderIdentity() {
  const signedIn = Boolean(identity.user);
  $('account-label').textContent = signedIn ? identity.role === 'admin' ? 'Администратор' : identity.paid ? 'Полный доступ' : identity.user.email : 'Гость';
  $('auth-button').hidden = signedIn;
  $('logout-button').hidden = !signedIn;
  $('pricing-card').hidden = hasFullAccess();
  $('admin-panel').hidden = identity.role !== 'admin';
  $('progress-note').textContent = signedIn ? 'Прогресс сохраняется в вашем аккаунте.' : 'Прогресс сохраняется в этом браузере. После входа он синхронизируется с аккаунтом.';
  renderNavigation(); renderStageMap();
}

function showLocked(lesson) {
  const stage = stageById.get(lesson.stage);
  $('learning-grid').hidden = true; $('access-notice').hidden = false;
  $('locked-title').textContent = lesson.title;
  $('locked-description').textContent = `${stage.title}. ${stage.description} Откройте полный курс, чтобы выполнить это задание.`;
  $('lesson-counter').textContent = `Этап ${stage.id} · урок ${lesson.position}`;
}

async function selectLesson(id) {
  const lesson = catalogById.get(id);
  if (!lesson) return;
  const generation = ++selectGeneration;
  current = id; state.current = id; expandedStage = lesson.stage; persist();
  renderNavigation(); renderStageMap();
  if (!isUnlocked(lesson)) { selectedLesson = null; showLocked(lesson); return; }

  $('access-notice').hidden = true; $('learning-grid').hidden = false;
  $('lesson-title').textContent = 'Загружаем урок…';
  let content = freeById.get(id);
  if (!content && backendReady && identity.user) {
    const { data, error } = await backend().from('lesson_content').select('*').eq('lesson_id', id).maybeSingle();
    if (generation !== selectGeneration) return;
    if (error || !data) { selectedLesson = null; $('lesson-title').textContent = 'Урок пока недоступен'; $('lesson-description').textContent = 'Обновите страницу или проверьте доступ к курсу.'; return; }
    content = { ...lesson, ...data };
  }
  if (!content) { selectedLesson = null; showLocked(lesson); return; }
  selectedLesson = content;
  $('lesson-topic').textContent = lesson.topic;
  $('lesson-title').textContent = lesson.title;
  $('lesson-description').textContent = lesson.description;
  $('lesson-level').textContent = lesson.stage === 1 ? 'Начальный уровень' : `Этап ${lesson.stage} · профессиональный уровень`;
  $('lesson-theory').textContent = content.theory;
  $('lesson-task').textContent = content.task;
  $('lesson-counter').textContent = `${String(lesson.position).padStart(2, '0')} / ${String(lessonCatalog.filter(item => item.stage === lesson.stage).length).padStart(2, '0')}`;
  $('sql-input').value = Object.hasOwn(state.drafts, id) ? state.drafts[id] : content.starter;
  $('hint-box').textContent = content.hint; $('hint-box').hidden = true;
  $('solution-box').textContent = content.solution; $('solution-box').hidden = true;
  $('hint-button').setAttribute('aria-expanded', 'false'); $('solution-button').setAttribute('aria-expanded', 'false');
  setStatus('', ''); $('result-table').replaceChildren(); $('result-table').hidden = true; $('result-empty').hidden = false;
  $('next-button').hidden = lessonCatalog.at(-1).id === id;
  engine = await createEngine(content.schema_sql || schemaSql);
}

function renderTable(result) {
  const container = $('result-table'); container.replaceChildren();
  const table = node('table'); const thead = node('thead'); const tr = node('tr');
  for (const column of result.columns) tr.append(node('th', column)); thead.append(tr); table.append(thead);
  const tbody = node('tbody');
  for (const row of result.rows) {
    const rowElement = node('tr');
    for (const value of row) rowElement.append(node('td', value === null ? 'NULL' : String(value)));
    tbody.append(rowElement);
  }
  table.append(tbody); container.append(table); container.hidden = false; $('result-empty').hidden = true;
}
function setStatus(message, kind) { const element = $('result-status'); element.textContent = message; element.className = `result-status ${kind || ''}`; }

async function runQuery() {
  if ($('run-button').disabled || !selectedLesson || !engine) return;
  const id = current, lesson = selectedLesson, query = $('sql-input').value;
  $('run-button').disabled = true; setStatus('Выполняем запрос…', '');
  try {
    const result = await engine.check(query, lesson.solution, { compareColumnNames: true });
    if (id !== current) return;
    if ($('sql-input').value !== query) { setStatus('Запрос изменился во время проверки. Запустите его ещё раз.', ''); return; }
    renderTable(result.actual);
    if (result.correct) {
      setStatus('Верно! Результат совпадает с ожидаемым.', 'success');
      if (!state.completed.includes(id)) state.completed.push(id);
      persist(); renderNavigation();
      if (identity.user && backendReady) {
        const { error } = await backend().from('lesson_progress').upsert({ user_id: identity.user.id, lesson_id: id });
        if (error) setStatus('Верно! Прогресс сохранён в этом браузере; синхронизация пока недоступна.', 'success');
      }
    } else setStatus('Запрос выполнен, но результат отличается от ожидаемого. Проверьте условие и названия столбцов.', 'error');
  } catch (error) { if (id === current) { $('result-table').hidden = true; $('result-empty').hidden = true; setStatus(error.message || 'Не удалось выполнить запрос.', 'error'); } }
  finally { $('run-button').disabled = false; }
}

async function refreshIdentity() {
  identity = await getIdentity();
  if (identity.user && backendReady) {
    const { data } = await backend().from('lesson_progress').select('lesson_id').eq('user_id', identity.user.id);
    if (data) state.completed = [...new Set([...state.completed, ...data.map(row => row.lesson_id)])];
    persist();
  }
  renderIdentity(); selectLesson(current);
  if (identity.role === 'admin') refreshAdmin();
}

async function refreshAdmin() {
  if (identity.role !== 'admin' || !backendReady) return;
  $('admin-status').textContent = 'Загружаем пользователей…';
  const { data, error } = await backend().rpc('admin_list_users');
  if (error) { $('admin-status').textContent = 'Не удалось получить список пользователей.'; return; }
  $('admin-status').textContent = `${data.length} подтверждённых пользователей`;
  const list = $('admin-users'); list.replaceChildren();
  for (const user of data) {
    const row = node('div', null, 'admin-user-row');
    const info = node('div'); info.append(node('strong', user.email),
      node('small', user.role === 'admin' ? 'Администратор' : user.has_access ? `Доступ: ${user.access_source === 'yookassa' ? 'оплачен' : 'выдан вручную'}` : 'Только первый этап'));
    row.append(info);
    if (user.role !== 'admin' && user.access_source !== 'yookassa') {
      const button = node('button', user.has_access ? 'Отозвать' : 'Открыть курс', 'admin-access-button'); button.type = 'button';
      button.addEventListener('click', async () => {
        button.disabled = true;
        const { error: changeError } = await backend().rpc('admin_set_manual_access', { target_user: user.user_id, enabled: !user.has_access });
        if (changeError) { $('admin-status').textContent = 'Не удалось изменить доступ.'; button.disabled = false; }
        else refreshAdmin();
      });
      row.append(button);
    }
    list.append(row);
  }
}

function openAuth() {
  if (!backendReady) { $('payment-status').textContent = 'Регистрация подключается. Попробуйте позже.'; return; }
  $('auth-message').textContent = '';
  $('auth-dialog').showModal();
}
async function pay() {
  if (!backendReady) { $('payment-status').textContent = 'Оплата пока не подключена.'; return; }
  if (!identity.user) { openAuth(); return; }
  const buttons = [$('pay-button'), $('locked-pay-button')]; buttons.forEach(button => { button.disabled = true; });
  $('payment-status').textContent = 'Создаём платёж…';
  try {
    const result = await startPayment();
    if (result.alreadyAccess) { await refreshIdentity(); return; }
    if (!/^https:\/\//.test(result.confirmationUrl || '')) throw new Error('Некорректная ссылка оплаты.');
    location.assign(result.confirmationUrl);
  } catch (error) { $('payment-status').textContent = error.message || 'Не удалось начать оплату.'; }
  finally { buttons.forEach(button => { button.disabled = false; }); }
}

$('run-button').addEventListener('click', runQuery);
$('sql-input').addEventListener('input', () => { state.drafts[current] = $('sql-input').value; persist(); });
$('sql-input').addEventListener('keydown', event => { if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') { event.preventDefault(); runQuery(); } });
$('hint-button').addEventListener('click', () => { const element = $('hint-box'); element.hidden = !element.hidden; $('hint-button').setAttribute('aria-expanded', String(!element.hidden)); });
$('solution-button').addEventListener('click', () => { const element = $('solution-box'); element.hidden = !element.hidden; $('solution-button').setAttribute('aria-expanded', String(!element.hidden)); });
$('reset-button').addEventListener('click', () => { if (!selectedLesson) return; $('sql-input').value = selectedLesson.starter; state.drafts[current] = selectedLesson.starter; persist(); $('sql-input').focus(); });
$('next-button').addEventListener('click', () => { const index = lessonCatalog.findIndex(lesson => lesson.id === current); if (index >= 0 && index < lessonCatalog.length - 1) selectLesson(lessonCatalog[index + 1].id); });
$('auth-button').addEventListener('click', openAuth);
$('auth-close').addEventListener('click', () => $('auth-dialog').close());
$('auth-dialog').addEventListener('click', event => { if (event.target === $('auth-dialog')) $('auth-dialog').close(); });
$('logout-button').addEventListener('click', async () => { await backend()?.auth.signOut(); identity = { user: null, role: 'guest', paid: false }; renderIdentity(); selectLesson(current); });
$('auth-form').addEventListener('submit', async event => {
  event.preventDefault(); const button = $('auth-form').querySelector('button'); button.disabled = true;
  try { await sendLoginLink($('auth-email').value.trim()); $('auth-message').textContent = 'Ссылка отправлена. Откройте письмо и вернитесь в курс.'; }
  catch (error) { $('auth-message').textContent = error.message || 'Не удалось отправить ссылку.'; }
  finally { button.disabled = false; }
});
$('pay-button').addEventListener('click', pay); $('locked-pay-button').addEventListener('click', pay);
$('admin-refresh').addEventListener('click', refreshAdmin);

const schema = [
  ['customers', 'id · name · city'], ['products', 'id · name · category · price'],
  ['orders', 'id · customer_id · order_date · status'],
  ['order_items', 'order_id · product_id · quantity · unit_price'],
];
$('schema-content').replaceChildren();
for (const [name, fields] of schema) { const item = node('div', null, 'schema-item'); item.append(node('strong', name), node('span', fields)); $('schema-content').append(item); }

renderIdentity(); selectLesson(current);
backendReady = await initializeBackend();
if (backendReady) {
  backend().auth.onAuthStateChange(() => { setTimeout(refreshIdentity, 0); });
  await refreshIdentity();
  if (new URLSearchParams(location.search).get('payment') === 'return') {
    $('payment-status').textContent = 'Проверяем оплату…';
    for (let attempt = 0; attempt < 6 && !hasFullAccess(); attempt++) {
      await new Promise(resolve => setTimeout(resolve, 5000));
      await refreshIdentity();
    }
    $('payment-status').textContent = hasFullAccess() ? 'Полный курс открыт.' : 'Оплата обрабатывается. Обновите страницу через минуту.';
    history.replaceState(null, '', location.pathname);
  }
}
