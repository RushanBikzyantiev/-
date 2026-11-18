/* Isolated execution of one SQL exercise. A new database is created for each run. */
importScripts('./vendor/sql-wasm.js');

const sqlReady = initSqlJs({ locateFile: file => `./vendor/${file}` });

// Ignore quoted strings, quoted identifiers and comments while validating the statement.
function significantSQL(input) {
  let text = '', state = 'normal';
  for (let i = 0; i < input.length; i++) {
    const c = input[i], n = input[i + 1];
    if (state === 'line') { if (c === '\n') { state = 'normal'; text += '\n'; } else text += ' '; continue; }
    if (state === 'block') { if (c === '*' && n === '/') { state = 'normal'; text += '  '; i++; } else text += ' '; continue; }
    if (state === 'single' || state === 'double' || state === 'backtick') {
      const end = state === 'single' ? "'" : state === 'double' ? '"' : '`';
      if (c === end && n === end) { text += '  '; i++; }
      else if (c === end) { state = 'normal'; text += ' '; }
      else text += ' ';
      continue;
    }
    if (state === 'bracket') { if (c === ']') state = 'normal'; text += ' '; continue; }
    if (c === '-' && n === '-') { state = 'line'; text += '  '; i++; }
    else if (c === '/' && n === '*') { state = 'block'; text += '  '; i++; }
    else if (c === "'") { state = 'single'; text += ' '; }
    else if (c === '"') { state = 'double'; text += ' '; }
    else if (c === '`') { state = 'backtick'; text += ' '; }
    else if (c === '[') { state = 'bracket'; text += ' '; }
    else text += c;
  }
  return text.trim();
}

function validate(query) {
  if (typeof query !== 'string' || !query.trim()) throw new Error('Введите SQL-запрос.');
  if (query.length > 20000) throw new Error('Запрос слишком длинный.');
  const sql = significantSQL(query);
  if (!/^(SELECT|WITH)\b/i.test(sql)) throw new Error('В тренажёре доступны запросы SELECT и WITH.');
  if (/;\s*\S/.test(sql) || (sql.match(/;/g) || []).length > 1) throw new Error('Можно выполнить только один запрос за раз.');
}

function execute(db, query) {
  validate(query);
  const stmt = db.prepare(query);
  try {
    const columns = stmt.getColumnNames();
    if (!columns.length) throw new Error('Запрос должен возвращать таблицу результатов.');
    const rows = [];
    while (stmt.step()) {
      if (rows.length >= 1000) throw new Error('Результат содержит более 1000 строк. Уточните запрос.');
      rows.push(stmt.get());
    }
    return { columns, rows };
  } finally { stmt.free(); }
}

self.onmessage = async ({ data }) => {
  let db;
  try {
    const SQL = await sqlReady;
    db = new SQL.Database();
    db.exec(data.schemaSql);
    db.run('PRAGMA query_only = ON');
    const actual = execute(db, data.query);
    const expected = data.solution == null ? null : execute(db, data.solution);
    self.postMessage({ actual, expected });
  } catch (error) {
    self.postMessage({ error: error.message || 'Не удалось выполнить запрос.' });
  } finally { if (db) db.close(); }
};
