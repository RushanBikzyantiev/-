export const stages = [
  {
    "id": 1,
    "slug": "start",
    "title": "Основы SQL",
    "description": "От первого SELECT до JOIN и группировки.",
    "outcome": "Уверенно читать таблицы и составлять простые отчёты.",
    "free": true
  },
  {
    "id": 2,
    "slug": "expressions",
    "title": "Выражения и очистка",
    "description": "Условия, текст, NULL и вычисляемые поля.",
    "outcome": "Приводить сырые данные к пригодному для анализа виду.",
    "free": false
  },
  {
    "id": 3,
    "slug": "aggregations",
    "title": "Агрегации и отчёты",
    "description": "Условные метрики, HAVING и доли.",
    "outcome": "Собирать продуктовые и финансовые сводки.",
    "free": false
  },
  {
    "id": 4,
    "slug": "relationships",
    "title": "Связи и множества",
    "description": "Сложные JOIN, антисоединения и UNION.",
    "outcome": "Соединять данные без потерь и дублирования.",
    "free": false
  },
  {
    "id": 5,
    "slug": "subqueries",
    "title": "Подзапросы",
    "description": "EXISTS, корреляция и вложенные вычисления.",
    "outcome": "Решать задачи с зависимыми условиями.",
    "free": false
  },
  {
    "id": 6,
    "slug": "cte",
    "title": "CTE и рекурсия",
    "description": "Многошаговые запросы и иерархии.",
    "outcome": "Строить читаемые аналитические запросы.",
    "free": false
  },
  {
    "id": 7,
    "slug": "windows",
    "title": "Оконные функции",
    "description": "Ранги, предыдущие строки и накопительные суммы.",
    "outcome": "Сравнивать строки внутри групп без потери детализации.",
    "free": false
  },
  {
    "id": 8,
    "slug": "time",
    "title": "Даты и временные ряды",
    "description": "Интервалы, месяцы, когорты и динамика.",
    "outcome": "Анализировать изменения бизнеса во времени.",
    "free": false
  },
  {
    "id": 9,
    "slug": "product",
    "title": "Продуктовая аналитика",
    "description": "Воронка, конверсия, удержание и RFM.",
    "outcome": "Отвечать SQL-запросами на продуктовые вопросы.",
    "free": false
  },
  {
    "id": 10,
    "slug": "professional",
    "title": "Профессиональные кейсы",
    "description": "Качество данных, сверка денег и итоговые отчёты.",
    "outcome": "Проверять результаты и защищать решения перед командой.",
    "free": false
  }
];
export const lessonCatalog = [
  {
    "id": "select",
    "stage": 1,
    "title": "Знакомимся с клиентами",
    "topic": "SELECT",
    "description": "Первый запрос к базе магазина",
    "position": 1
  },
  {
    "id": "where",
    "stage": 1,
    "title": "Клиенты из Москвы",
    "topic": "WHERE",
    "description": "Отбираем нужные строки",
    "position": 2
  },
  {
    "id": "order-by",
    "stage": 1,
    "title": "Товары дороже тысячи",
    "topic": "ORDER BY",
    "description": "Фильтруем и сортируем цены",
    "position": 3
  },
  {
    "id": "and",
    "stage": 1,
    "title": "Успешные заказы за период",
    "topic": "AND",
    "description": "Объединяем условия",
    "position": 4
  },
  {
    "id": "count",
    "stage": 1,
    "title": "Считаем заказы",
    "topic": "COUNT",
    "description": "Получаем одно число из таблицы",
    "position": 5
  },
  {
    "id": "group-by",
    "stage": 1,
    "title": "Ассортимент по категориям",
    "topic": "GROUP BY",
    "description": "Считаем товары в каждой категории",
    "position": 6
  },
  {
    "id": "join",
    "stage": 1,
    "title": "Кто оформил заказ?",
    "topic": "JOIN",
    "description": "Связываем заказы с клиентами",
    "position": 7
  },
  {
    "id": "revenue",
    "stage": 1,
    "title": "Выручка по заказам",
    "topic": "SUM + JOIN",
    "description": "Рассчитываем стоимость каждого заказа",
    "position": 8
  },
  {
    "id": "left-join",
    "stage": 1,
    "title": "Клиенты без заказов",
    "topic": "LEFT JOIN + NULL",
    "description": "Находим отсутствующие связи",
    "position": 9
  },
  {
    "id": "case-region",
    "stage": 2,
    "title": "Регион клиента",
    "topic": "CASE",
    "description": "Добавляем понятный регион для CRM-отчёта.",
    "position": 1
  },
  {
    "id": "coalesce-source",
    "stage": 2,
    "title": "Источник без пропусков",
    "topic": "COALESCE",
    "description": "Приводим каналы привлечения к единому виду.",
    "position": 2
  },
  {
    "id": "ilike-name",
    "stage": 2,
    "title": "Поиск товара по названию",
    "topic": "ILIKE",
    "description": "Ищем позиции каталога по фрагменту имени.",
    "position": 3
  },
  {
    "id": "between-price",
    "stage": 2,
    "title": "Ценовой коридор",
    "topic": "BETWEEN",
    "description": "Подбираем товары для сезонной подборки.",
    "position": 4
  },
  {
    "id": "price-segment",
    "stage": 2,
    "title": "Ценовой сегмент",
    "topic": "CASE + арифметика",
    "description": "Размечаем ассортимент для коммерческой команды.",
    "position": 5
  },
  {
    "id": "unique-buyers",
    "stage": 3,
    "title": "Сколько было покупателей",
    "topic": "COUNT DISTINCT",
    "description": "Считаем аудиторию, совершившую покупки.",
    "position": 1
  },
  {
    "id": "category-average",
    "stage": 3,
    "title": "Средняя цена категории",
    "topic": "AVG + HAVING",
    "description": "Находим категории с дорогим ассортиментом.",
    "position": 2
  },
  {
    "id": "status-counts",
    "stage": 3,
    "title": "Статусы заказов по клиентам",
    "topic": "FILTER",
    "description": "Строим компактную сводку статусов.",
    "position": 3
  },
  {
    "id": "sales-per-category",
    "stage": 3,
    "title": "Продажи по категориям",
    "topic": "SUM + GROUP BY",
    "description": "Сравниваем денежный вклад категорий.",
    "position": 4
  },
  {
    "id": "orders-at-least-two",
    "stage": 3,
    "title": "Постоянные покупатели",
    "topic": "HAVING",
    "description": "Находим клиентов с повторными покупками.",
    "position": 5
  },
  {
    "id": "line-report",
    "stage": 4,
    "title": "Строки продаж",
    "topic": "JOIN × 3",
    "description": "Собираем детальный реестр выполненных продаж.",
    "position": 1
  },
  {
    "id": "all-customers-count",
    "stage": 4,
    "title": "Клиенты без покупок в отчёте",
    "topic": "LEFT JOIN",
    "description": "Готовим полный список клиентов для CRM.",
    "position": 2
  },
  {
    "id": "no-orders",
    "stage": 4,
    "title": "Без заказов: антисоединение",
    "topic": "LEFT JOIN + NULL",
    "description": "Выделяем клиентов, которые ещё не оформили заказ.",
    "position": 3
  },
  {
    "id": "employee-manager",
    "stage": 4,
    "title": "Кто у кого в команде",
    "topic": "SELF JOIN",
    "description": "Читаем оргструктуру компании.",
    "position": 4
  },
  {
    "id": "problem-orders",
    "stage": 4,
    "title": "Список заказов для проверки",
    "topic": "UNION",
    "description": "Собираем единый список ожидающих и возвращённых заказов.",
    "position": 5
  },
  {
    "id": "above-average-price",
    "stage": 5,
    "title": "Дороже среднего",
    "topic": "Скалярный подзапрос",
    "description": "Находим товары с ценой выше средней по каталогу.",
    "position": 1
  },
  {
    "id": "exists-buyer",
    "stage": 5,
    "title": "Клиенты с покупками",
    "topic": "EXISTS",
    "description": "Отбираем активных покупателей.",
    "position": 2
  },
  {
    "id": "not-purchased-by-one",
    "stage": 5,
    "title": "Что ещё не купила Анна",
    "topic": "NOT EXISTS",
    "description": "Подбираем товары для персональной рекомендации.",
    "position": 3
  },
  {
    "id": "latest-order",
    "stage": 5,
    "title": "Последний заказ клиента",
    "topic": "Коррелированный подзапрос",
    "description": "Находим наиболее свежую покупку каждого клиента.",
    "position": 4
  },
  {
    "id": "high-spenders",
    "stage": 5,
    "title": "Клиенты с крупными тратами",
    "topic": "Подзапрос в FROM",
    "description": "Выделяем покупателей с выручкой от 3000 рублей.",
    "position": 5
  },
  {
    "id": "cte-order-totals",
    "stage": 6,
    "title": "Читаемые суммы заказов",
    "topic": "WITH",
    "description": "Собираем реестр сумм выполненных заказов.",
    "position": 1
  },
  {
    "id": "cte-net-payments",
    "stage": 6,
    "title": "Нетто по платежам",
    "topic": "Несколько CTE",
    "description": "Сверяем поступления по каждому платежу.",
    "position": 2
  },
  {
    "id": "recursive-team",
    "stage": 6,
    "title": "Дерево подчинения",
    "topic": "WITH RECURSIVE",
    "description": "Строим иерархию сотрудников от руководителя.",
    "position": 3
  },
  {
    "id": "recursive-days",
    "stage": 6,
    "title": "Календарь без отдельной таблицы",
    "topic": "Рекурсивный CTE",
    "description": "Готовим ось дней для отчёта.",
    "position": 4
  },
  {
    "id": "cte-monthly-revenue",
    "stage": 6,
    "title": "Месячная выручка по шагам",
    "topic": "CTE + агрегат",
    "description": "Получаем понятный помесячный отчёт.",
    "position": 5
  },
  {
    "id": "row-number-orders",
    "stage": 7,
    "title": "Номер покупки клиента",
    "topic": "ROW_NUMBER",
    "description": "Определяем первую, вторую и следующие покупки.",
    "position": 1
  },
  {
    "id": "rank-category",
    "stage": 7,
    "title": "Ранг цены в категории",
    "topic": "DENSE_RANK",
    "description": "Сравниваем товары внутри собственного сегмента.",
    "position": 2
  },
  {
    "id": "lag-purchase",
    "stage": 7,
    "title": "Предыдущая покупка",
    "topic": "LAG",
    "description": "Измеряем расстояние между повторными заказами.",
    "position": 3
  },
  {
    "id": "running-revenue",
    "stage": 7,
    "title": "Накопленная выручка",
    "topic": "SUM OVER",
    "description": "Смотрим, как растёт выручка от заказа к заказу.",
    "position": 4
  },
  {
    "id": "category-share",
    "stage": 7,
    "title": "Доля товара в категории",
    "topic": "Оконный SUM",
    "description": "Оцениваем вес каждого товара в своём сегменте.",
    "position": 5
  },
  {
    "id": "orders-by-month",
    "stage": 8,
    "title": "Заказы по месяцам",
    "topic": "DATE_TRUNC",
    "description": "Смотрим динамику заказов.",
    "position": 1
  },
  {
    "id": "days-to-pay",
    "stage": 8,
    "title": "Скорость оплаты",
    "topic": "INTERVAL",
    "description": "Проверяем, как быстро оплачиваются заказы.",
    "position": 2
  },
  {
    "id": "quarter-revenue",
    "stage": 8,
    "title": "Выручка по кварталам",
    "topic": "EXTRACT",
    "description": "Собираем квартальный отчёт по выполненным продажам.",
    "position": 3
  },
  {
    "id": "daily-calendar",
    "stage": 8,
    "title": "Календарь с нулевыми днями",
    "topic": "GENERATE_SERIES",
    "description": "Готовим ежедневный ряд заказов за первую неделю марта.",
    "position": 4
  },
  {
    "id": "first-purchase-month",
    "stage": 8,
    "title": "Месяц первой покупки",
    "topic": "MIN + DATE_TRUNC",
    "description": "Назначаем покупателям месяц привлечения.",
    "position": 5
  },
  {
    "id": "event-funnel",
    "stage": 9,
    "title": "Воронка магазина",
    "topic": "Условные DISTINCT",
    "description": "Оцениваем охват ключевых шагов продукта.",
    "position": 1
  },
  {
    "id": "campaign-conversion",
    "stage": 9,
    "title": "Конверсия каналов",
    "topic": "FILTER + NULLIF",
    "description": "Сравниваем каналы привлечения.",
    "position": 2
  },
  {
    "id": "repeat-rate",
    "stage": 9,
    "title": "Доля повторных покупателей",
    "topic": "CTE + доля",
    "description": "Измеряем способность магазина возвращать покупателей.",
    "position": 3
  },
  {
    "id": "rfm-base",
    "stage": 9,
    "title": "Основа RFM-сегментации",
    "topic": "RFM",
    "description": "Подготавливаем признаки лояльности.",
    "position": 4
  },
  {
    "id": "monthly-retention",
    "stage": 9,
    "title": "Когортное удержание",
    "topic": "Когорты + JOIN",
    "description": "Смотрим повторные покупки по месяцам.",
    "position": 5
  },
  {
    "id": "missing-order-lines",
    "stage": 10,
    "title": "Заказы без позиций",
    "topic": "Проверка качества",
    "description": "Ищем выполненные заказы без товарных строк.",
    "position": 1
  },
  {
    "id": "payment-mismatch",
    "stage": 10,
    "title": "Расхождение оплаты",
    "topic": "Сверка данных",
    "description": "Находим оплаченные заказы с неверной суммой.",
    "position": 2
  },
  {
    "id": "duplicate-events",
    "stage": 10,
    "title": "Повторы событий",
    "topic": "GROUP BY + HAVING",
    "description": "Проверяем качество телеметрии.",
    "position": 3
  },
  {
    "id": "unpaid-completed",
    "stage": 10,
    "title": "Продажи без платежа",
    "topic": "Антисоединение",
    "description": "Готовим список для финансового расследования.",
    "position": 4
  },
  {
    "id": "capstone-customer-value",
    "stage": 10,
    "title": "Итог: ценность клиента",
    "topic": "Финальный кейс",
    "description": "Финальный отчёт объединяет клиентов, заказы и финансовые метрики.",
    "position": 5
  }
];
