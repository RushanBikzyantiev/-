# Подключение курса к Supabase

Публичная версия сайта подключена к Supabase project URL и publishable key. Publishable key рассчитан на размещение в браузере; секретный `service_role` key хранить в `public/config.json` нельзя.

## 1. Создать таблицы и роли

В Supabase откройте **SQL Editor → New query**, вставьте содержимое `supabase/migrations/0001_course_access.sql` и нажмите **Run**. Миграция создаёт таблицы, включает RLS и назначает роль администратора только после подтверждения почты `bikzyantiev@gmail.com`.

После регистрации и подтверждения адреса администратора выполните приватный seed курса. В исходной рабочей копии он собирается командой:

```sh
npm install
node scripts/generate-seed.mjs ./private-course-seed.sql
```

Файл содержит полные тексты и решения платных заданий. Не добавляйте его в публичный GitHub репозиторий. Импортируйте SQL в Supabase SQL Editor или через PostgreSQL-клиент с учётными данными проекта.

## 2. Настроить вход по ссылке

В **Authentication → URL Configuration** добавьте адрес сайта в **Site URL** и в **Redirect URLs**:

```text
https://rushanbikzyantiev.github.io/-/
```

В **Authentication → Providers → Email** включите вход по email и подтверждение адреса. Пользователь входит по одноразовой ссылке из письма.

## 3. Настроить оплату

Установите Supabase CLI, выполните `supabase login`, затем из папки проекта привяжите проект и задайте секреты:

```sh
supabase link --project-ref mbnjdtjnjkoevncddtfz
supabase secrets set SUPABASE_SERVICE_ROLE_KEY='<service_role key>' YOOKASSA_SHOP_ID='<shopId>' YOOKASSA_SECRET_KEY='<secret key>' SITE_ORIGIN='https://rushanbikzyantiev.github.io'
supabase functions deploy start-payment
supabase functions deploy yookassa-webhook --no-verify-jwt
```

Значения вводите в терминале локально, не добавляйте их в файлы и не отправляйте в чат. В кабинете ЮKassa настройте HTTP-уведомление `payment.succeeded` на:

```text
https://mbnjdtjnjkoevncddtfz.supabase.co/functions/v1/yookassa-webhook
```

Webhook повторно проверяет платёж через API ЮKassa и открывает доступ только при подтверждённой оплате 2 990 ₽.

## 4. Включить функции в опубликованной версии

После успешного запуска миграции и обеих Edge Functions измените `databaseReady` и `paymentsReady` на `true` в `public/config.json`, соберите сайт (`npm run build`) и опубликуйте содержимое `dist/` в ветку GitHub Pages `gh-pages`.

Не включайте флаги раньше: регистрация, права и оплата зависят от миграции и работающих функций.
