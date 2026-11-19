/* Every exercise runs in its own disposable PostgreSQL WASM database. */
import { PGlite } from '@electric-sql/pglite';

function significantSQL(input) {
  let text = '', state = 'normal';
  for (let i = 0; i < input.length; i++) {
    const c = input[i], n = input[i + 1];
    if (state === 'line') { if (c === '\n') { state = 'normal'; text += '\n'; } else text += ' '; continue; }
    if (state === 'block') { if (c === '*' && n === '/') { state = 'normal'; text += '  '; i++; } else text += ' '; continue; }
    if (state === 'single' || state === 'double') {
      const end = state === 'single' ? "'" : '"';
      if (c === end && n === end) { text += '  '; i++; }
      else if (c === end) { state = 'normal'; text += ' '; }
      else text += ' ';
      continue;
    }
    if (c === '-' && n === '-') { state = 'line'; text += '  '; i++; }
    else if (c === "'") { state = 'single'; text += ' '; }
    else if (c === '"') { state = 'double'; text += ' '; }
    else text += c;
  }
  return text.trim();
}

function validate(query) {
  if (typeof query !== 'string' || !query.trim()) throw new Error('Введите SQL-запрос.');
  if (query.length > 20000) throw new Error('Запрос слишком длинный.');
  const sql = significantSQL(query);
  if (!/^(SELECT|WITH|EXPLAIN)\b/i.test(sql)) throw new Error('В тренажёре доступны запросы SELECT, WITH и EXPLAIN.');
  if (/;\s*\S/.test(sql) || (sql.match(/;/g) || []).length > 1) throw new Error('Можно выполнить только один запрос за раз.');
  if (/\b(INSERT|UPDATE|DELETE|CREATE|ALTER|DROP|TRUNCATE|COPY|GRANT|REVOKE|CALL|DO)\b/i.test(sql))
    throw new Error('Изменение учебной базы в этом задании недоступно.');
}

async function execute(db, query) {
  validate(query);
  const result = await db.query(query);
  const columns = result.fields?.map(field => field.name) || [];
  if (!columns.length) throw new Error('Запрос должен возвращать таблицу результатов.');
  if (result.rows.length > 1000) throw new Error('Результат содержит более 1000 строк. Уточните запрос.');
  return { columns, rows: result.rows.map(row => columns.map(name => row[name])) };
}

self.onmessage = async ({ data }) => {
  let db;
  try {
    db = new PGlite();
    await db.waitReady;
    await db.exec(data.schemaSql);
    const actual = await execute(db, data.query);
    const expected = data.solution == null ? null : await execute(db, data.solution);
    self.postMessage({ actual, expected });
  } catch (error) {
    self.postMessage({ error: error.message || 'Не удалось выполнить запрос.' });
  } finally { if (db) await db.close(); }
};
