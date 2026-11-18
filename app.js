import { schemaSql, lessons } from './content.js';
import { createEngine } from './engine.js';

const $ = id => document.getElementById(id);
const storeKey = 'sql-praktika-progress-v1';
let state = { completed: [], drafts: {}, current: 0 };
try { const saved = JSON.parse(localStorage.getItem(storeKey)); if (saved && typeof saved === 'object') state = { ...state, ...saved }; } catch (_) {}
if (!Array.isArray(state.completed)) state.completed = [];
if (!state.drafts || typeof state.drafts !== 'object') state.drafts = {};
let current = Math.max(0, Math.min(lessons.length - 1, Number(state.current) || 0));
let engine;
const persist = () => { try { localStorage.setItem(storeKey, JSON.stringify({ ...state, current })); } catch (_) {} };
const node = (tag, text, className) => { const el = document.createElement(tag); if (text != null) el.textContent = text; if (className) el.className = className; return el; };

function renderNavigation() {
  const list = $('lesson-list'); list.replaceChildren();
  lessons.forEach((lesson, i) => {
    const button = node('button', null, 'lesson-link' + (i === current ? ' active' : '') + (state.completed.includes(lesson.id) ? ' is-complete' : ''));
    button.type = 'button'; button.setAttribute('aria-current', i === current ? 'step' : 'false');
    const mark = node('span', state.completed.includes(lesson.id) ? '✓' : String(i + 1).padStart(2, '0'), 'lesson-number');
    const label = node('span', null, 'lesson-label'); label.append(node('strong', lesson.title), node('small', lesson.topic));
    button.append(mark, label); button.addEventListener('click', () => selectLesson(i)); list.append(button);
  });
  const completed = lessons.filter(l => state.completed.includes(l.id)).length;
  $('progress-text').textContent = `${completed} из ${lessons.length} уроков`;
  $('progress-bar').firstElementChild.style.width = `${completed / lessons.length * 100}%`;
  $('progress-bar').setAttribute('aria-valuenow', String(Math.round(completed / lessons.length * 100)));
}
function selectLesson(index) {
  current = index; state.current = index; const lesson = lessons[index];
  $('lesson-topic').textContent = lesson.topic;
  $('lesson-title').textContent = lesson.title;
  $('lesson-description').textContent = lesson.description;
  $('lesson-theory').textContent = lesson.theory;
  $('lesson-task').textContent = lesson.task;
  $('lesson-counter').textContent = `${String(index + 1).padStart(2, '0')} / ${String(lessons.length).padStart(2, '0')}`;
  $('sql-input').value = Object.hasOwn(state.drafts, lesson.id) ? state.drafts[lesson.id] : lesson.starter;
  $('hint-box').textContent = lesson.hint; $('hint-box').hidden = true;
  $('solution-box').textContent = lesson.solution; $('solution-box').hidden = true;
  $('hint-button').setAttribute('aria-expanded', 'false'); $('solution-button').setAttribute('aria-expanded', 'false');
  $('result-status').textContent = ''; $('result-status').className = 'result-status';
  $('result-table').replaceChildren(); $('result-table').hidden = true; $('result-empty').hidden = false;
  $('next-button').hidden = index === lessons.length - 1;
  renderNavigation(); persist();
}
function renderTable(result) {
  const container = $('result-table'); container.replaceChildren();
  const table = node('table'); const thead = node('thead'); const tr = node('tr');
  for (const column of result.columns) tr.append(node('th', column)); thead.append(tr); table.append(thead);
  const tbody = node('tbody');
  for (const row of result.rows) { const rowEl = node('tr'); for (const value of row) rowEl.append(node('td', value === null ? 'NULL' : String(value))); tbody.append(rowEl); }
  table.append(tbody); container.append(table); container.hidden = false;
  $('result-empty').hidden = true;
}
function setStatus(message, kind) { const el = $('result-status'); el.textContent = message; el.className = `result-status ${kind || ''}`; }
async function runQuery() {
  if ($('run-button').disabled) return;
  if (!engine) { setStatus('SQL-движок пока загружается. Попробуйте ещё раз.', 'error'); return; }
  const selected = current, lesson = lessons[selected], query = $('sql-input').value;
  $('run-button').disabled = true; setStatus('Выполняем запрос…', '');
  try {
    const result = await engine.check(query, lesson.solution, { compareColumnNames: true });
    if (selected !== current) return;
    if ($('sql-input').value !== query) { setStatus('Запрос изменился во время проверки. Запустите его ещё раз.', ''); return; }
    renderTable(result.actual);
    if (result.correct) {
      setStatus('Верно! Результат совпадает с ожидаемым.', 'success');
      if (!state.completed.includes(lesson.id)) state.completed.push(lesson.id);
      renderNavigation(); persist();
    } else setStatus('Запрос выполнен, но результат отличается от ожидаемого. Проверьте условие и названия столбцов.', 'error');
  } catch (error) { if (selected === current) { $('result-table').hidden = true; $('result-empty').hidden = true; setStatus(error.message || 'Не удалось выполнить запрос.', 'error'); } }
  finally { $('run-button').disabled = false; }
}
$('run-button').addEventListener('click', runQuery);
$('sql-input').addEventListener('input', () => { state.drafts[lessons[current].id] = $('sql-input').value; persist(); });
$('sql-input').addEventListener('keydown', e => { if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') { e.preventDefault(); runQuery(); } });
$('hint-button').addEventListener('click', () => { const el = $('hint-box'); el.hidden = !el.hidden; $('hint-button').setAttribute('aria-expanded', String(!el.hidden)); });
$('solution-button').addEventListener('click', () => { const el = $('solution-box'); el.hidden = !el.hidden; $('solution-button').setAttribute('aria-expanded', String(!el.hidden)); });
$('reset-button').addEventListener('click', () => { $('sql-input').value = lessons[current].starter; state.drafts[lessons[current].id] = lessons[current].starter; persist(); $('sql-input').focus(); });
$('next-button').addEventListener('click', () => { if (current < lessons.length - 1) selectLesson(current + 1); });
$('schema-content').replaceChildren();
const schema = [
  ['customers', 'id · name · city'],
  ['products', 'id · name · category · price'],
  ['orders', 'id · customer_id · order_date · status'],
  ['order_items', 'order_id · product_id · quantity · unit_price']
];
for (const [name, fields] of schema) { const item = node('div', null, 'schema-item'); item.append(node('strong', name), node('span', fields)); $('schema-content').append(item); }
selectLesson(current);
try { engine = await createEngine(schemaSql); } catch (_) { setStatus('Не удалось загрузить SQL-движок. Обновите страницу.', 'error'); }
