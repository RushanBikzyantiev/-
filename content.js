// Учебные данные и задания SQL-тренажёра. Все запросы совместимы с SQLite.
export const schemaSql = `
CREATE TABLE customers (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  city TEXT NOT NULL
);
CREATE TABLE products (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  price INTEGER NOT NULL
);
CREATE TABLE orders (
  id INTEGER PRIMARY KEY,
  customer_id INTEGER NOT NULL REFERENCES customers(id),
  order_date TEXT NOT NULL,
  status TEXT NOT NULL
);
CREATE TABLE order_items (
  order_id INTEGER NOT NULL REFERENCES orders(id),
  product_id INTEGER NOT NULL REFERENCES products(id),
  quantity INTEGER NOT NULL,
  unit_price INTEGER NOT NULL,
  PRIMARY KEY (order_id, product_id)
);

INSERT INTO customers (id, name, city) VALUES
  (1, 'Анна', 'Москва'),
  (2, 'Борис', 'Казань'),
  (3, 'Вера', 'Москва'),
  (4, 'Денис', 'Пермь'),
  (5, 'Елена', 'Самара');
INSERT INTO products (id, name, category, price) VALUES
  (1, 'Кружка', 'Посуда', 500),
  (2, 'Термос', 'Посуда', 1500),
  (3, 'Блокнот', 'Канцелярия', 300),
  (4, 'Рюкзак', 'Аксессуары', 2500),
  (5, 'Бутылка', 'Аксессуары', 900);
INSERT INTO orders (id, customer_id, order_date, status) VALUES
  (101, 1, '2025-03-01', 'completed'),
  (102, 2, '2025-03-02', 'completed'),
  (103, 1, '2025-03-03', 'cancelled'),
  (104, 3, '2025-03-03', 'completed'),
  (105, 4, '2025-03-05', 'completed'),
  (106, 2, '2025-03-06', 'completed'),
  (107, 1, '2025-03-07', 'pending');
INSERT INTO order_items (order_id, product_id, quantity, unit_price) VALUES
  (101, 1, 2, 500),
  (101, 3, 1, 300),
  (102, 2, 1, 1500),
  (103, 4, 1, 2500),
  (104, 4, 1, 2500),
  (104, 5, 2, 900),
  (105, 3, 3, 300),
  (106, 1, 1, 500),
  (106, 2, 1, 1400),
  (107, 5, 1, 900);
`;

export const lessons = [
  {
    id: 'select',
    title: 'Знакомимся с клиентами',
    topic: 'SELECT',
    description: 'Первый запрос к базе магазина',
    theory: 'SELECT выбирает столбцы, а FROM указывает таблицу. Имена столбцов перечисляют через запятую. ORDER BY сортирует результат по указанному столбцу по возрастанию. Например: SELECT name, price FROM products ORDER BY id;',
    task: 'Покажите имена и города всех клиентов. Верните столбцы name и city в этом порядке. Отсортируйте строки по id клиента по возрастанию.',
    hint: 'Начните с SELECT name, city FROM customers и добавьте ORDER BY id.',
    starter: 'SELECT\n  \nFROM customers; ',
    solution: 'SELECT name, city FROM customers ORDER BY id;'
  },
  {
    id: 'where',
    title: 'Клиенты из Москвы',
    topic: 'WHERE',
    description: 'Отбираем нужные строки',
    theory: "WHERE оставляет строки, которые соответствуют условию. Текстовые значения в SQL записывают в одинарных кавычках: WHERE city = 'Москва'.",
    task: 'Найдите клиентов из Москвы. Выведите их id и name. Отсортируйте результат по id по возрастанию.',
    hint: "После FROM customers добавьте WHERE city = 'Москва', а затем ORDER BY id.",
    starter: 'SELECT id, name\nFROM customers\nWHERE ;',
    solution: "SELECT id, name FROM customers WHERE city = 'Москва' ORDER BY id;"
  },
  {
    id: 'order-by',
    title: 'Товары дороже тысячи',
    topic: 'ORDER BY',
    description: 'Фильтруем и сортируем цены',
    theory: 'Операторы >= и <= сравнивают числа. ORDER BY сортирует результат; DESC означает от большего к меньшему, ASC — от меньшего к большему.',
    task: 'Покажите name и price товаров с ценой не меньше 1000 рублей. Отсортируйте их по цене от большей к меньшей.',
    hint: 'Используйте WHERE price >= 1000 и ORDER BY price DESC.',
    starter: 'SELECT name, price\nFROM products\nWHERE \nORDER BY ;',
    solution: 'SELECT name, price FROM products WHERE price >= 1000 ORDER BY price DESC;'
  },
  {
    id: 'and',
    title: 'Успешные заказы за период',
    topic: 'AND',
    description: 'Объединяем условия',
    theory: "AND требует выполнения обоих условий. В учебной базе даты хранятся в формате YYYY-MM-DD, поэтому их можно сравнивать как текст. Статус completed означает выполненный заказ.",
    task: "Найдите выполненные заказы с 3 марта 2025 года включительно. Выведите id и order_date. Отсортируйте по id по возрастанию.",
    hint: "В WHERE объедините status = 'completed' и order_date >= '2025-03-03' с помощью AND.",
    starter: 'SELECT id, order_date\nFROM orders\nWHERE \nORDER BY id;',
    solution: "SELECT id, order_date FROM orders WHERE status = 'completed' AND order_date >= '2025-03-03' ORDER BY id;"
  },
  {
    id: 'count',
    title: 'Считаем заказы',
    topic: 'COUNT',
    description: 'Получаем одно число из таблицы',
    theory: 'COUNT(*) считает количество строк, попавших в результат. AS задаёт понятное имя вычисленному столбцу: SELECT COUNT(*) AS total FROM products;',
    task: "Посчитайте количество выполненных заказов. Верните один столбец с именем completed_count.",
    hint: "Используйте COUNT(*) AS completed_count и условие status = 'completed'.",
    starter: 'SELECT \nFROM orders\nWHERE ;',
    solution: "SELECT COUNT(*) AS completed_count FROM orders WHERE status = 'completed';"
  },
  {
    id: 'group-by',
    title: 'Ассортимент по категориям',
    topic: 'GROUP BY',
    description: 'Считаем товары в каждой категории',
    theory: 'GROUP BY объединяет строки с одинаковым значением. Агрегатная функция, например COUNT(*), затем считается отдельно для каждой группы.',
    task: 'Для каждой категории товаров выведите category и количество товаров в столбце product_count. Отсортируйте по category по возрастанию.',
    hint: 'Выберите category, COUNT(*) AS product_count, затем сгруппируйте по category и отсортируйте по нему же.',
    starter: 'SELECT category, COUNT(*) AS product_count\nFROM products\nGROUP BY \nORDER BY ;',
    solution: 'SELECT category, COUNT(*) AS product_count FROM products GROUP BY category ORDER BY category;'
  },
  {
    id: 'join',
    title: 'Кто оформил заказ?',
    topic: 'JOIN',
    description: 'Связываем заказы с клиентами',
    theory: 'JOIN соединяет строки двух таблиц по общему признаку. Здесь orders.customer_id ссылается на customers.id. Короткие имена o и c помогают отличать одинаковые названия столбцов.',
    task: 'Для каждого выполненного заказа покажите его id в столбце order_id и имя клиента в столбце name. Отсортируйте по order_id по возрастанию.',
    hint: 'Соедините orders AS o с customers AS c по o.customer_id = c.id и отфильтруйте o.status.',
    starter: 'SELECT o.id AS order_id, c.name\nFROM orders AS o\nJOIN customers AS c ON \nWHERE \nORDER BY order_id;',
    solution: "SELECT o.id AS order_id, c.name FROM orders AS o JOIN customers AS c ON o.customer_id = c.id WHERE o.status = 'completed' ORDER BY order_id;"
  },
  {
    id: 'revenue',
    title: 'Выручка по заказам',
    topic: 'SUM + JOIN',
    description: 'Рассчитываем стоимость каждого заказа',
    theory: 'В order_items quantity — количество, а unit_price — цена за единицу именно в этом заказе. SUM(quantity * unit_price) складывает стоимость всех строк. Цена продажи может отличаться от текущей цены товара.',
    task: 'Для каждого выполненного заказа выведите его id в столбце order_id и сумму его позиций в столбце revenue. Отсортируйте по order_id по возрастанию.',
    hint: "Соедините orders AS o и order_items AS i по o.id = i.order_id. Отберите status = 'completed' и сгруппируйте по o.id.",
    starter: 'SELECT o.id AS order_id, SUM(i.quantity * i.unit_price) AS revenue\nFROM orders AS o\nJOIN order_items AS i ON \nWHERE \nGROUP BY \nORDER BY order_id;',
    solution: "SELECT o.id AS order_id, SUM(i.quantity * i.unit_price) AS revenue FROM orders AS o JOIN order_items AS i ON o.id = i.order_id WHERE o.status = 'completed' GROUP BY o.id ORDER BY order_id;"
  },
  {
    id: 'left-join',
    title: 'Клиенты без заказов',
    topic: 'LEFT JOIN + NULL',
    description: 'Находим отсутствующие связи',
    theory: 'LEFT JOIN сохраняет все строки левой таблицы, даже если соответствия справа нет. Для таких строк поля правой таблицы будут NULL. Проверять отсутствие значения нужно через IS NULL.',
    task: 'Найдите клиентов, у которых нет ни одного заказа любого статуса. Выведите их id и name, отсортировав по id по возрастанию.',
    hint: 'Соедините customers AS c с orders AS o через LEFT JOIN и отберите строки, где o.id IS NULL.',
    starter: 'SELECT c.id, c.name\nFROM customers AS c\nLEFT JOIN orders AS o ON \nWHERE \nORDER BY c.id;',
    solution: 'SELECT c.id, c.name FROM customers AS c LEFT JOIN orders AS o ON c.id = o.customer_id WHERE o.id IS NULL ORDER BY c.id;'
  }
];
