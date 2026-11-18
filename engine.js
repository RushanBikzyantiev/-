/** Real SQLite execution in a disposable worker. Nothing is sent to a server. */
export async function createEngine(schemaSql) {
  if (typeof schemaSql !== 'string' || !schemaSql.trim()) throw new Error('Учебная база не настроена.');

  function execute(query, solution = null) {
    return new Promise((resolve, reject) => {
      const worker = new Worker(new URL('./engine-worker.js', import.meta.url));
      const timer = setTimeout(() => {
        worker.terminate();
        reject(new Error('Запрос выполнялся слишком долго. Попробуйте упростить его.'));
      }, 5000);
      const finish = () => { clearTimeout(timer); worker.terminate(); };
      worker.onmessage = ({ data }) => {
        finish();
        if (data.error) reject(new Error(data.error));
        else resolve(data);
      };
      worker.onerror = () => {
        finish();
        reject(new Error('Не удалось запустить SQL-движок. Обновите страницу.'));
      };
      worker.postMessage({ schemaSql, query, solution });
    });
  }

  function rowKey(row) {
    return JSON.stringify(row.map(value => {
      if (value instanceof Uint8Array) return { blob: Array.from(value) };
      return value;
    }));
  }

  return {
    async run(query) {
      return (await execute(query)).actual;
    },
    async check(query, solution, options = {}) {
      const { actual, expected } = await execute(query, solution);
      const orderSensitive = options.orderSensitive ?? /\bORDER\s+BY\b/i.test(solution);
      const left = actual.rows.map(rowKey);
      const right = expected.rows.map(rowKey);
      if (!orderSensitive) { left.sort(); right.sort(); }
      const columnsMatch = actual.columns.length === expected.columns.length &&
        (!options.compareColumnNames || actual.columns.every((name, i) => name === expected.columns[i]));
      const correct = columnsMatch && left.length === right.length && left.every((row, i) => row === right[i]);
      return { correct, actual, expected };
    }
  };
}
