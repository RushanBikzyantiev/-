-- Course access is enforced by PostgreSQL RLS. Run in the Supabase SQL editor or CLI.
create table if not exists public.course_stages (
  id smallint primary key check (id between 1 and 10),
  slug text not null unique,
  title text not null,
  description text not null,
  outcome text not null,
  position smallint not null unique,
  is_free boolean not null default false
);

create table if not exists public.lesson_catalog (
  id text primary key,
  stage_id smallint not null references public.course_stages(id),
  position smallint not null,
  title text not null,
  topic text not null,
  description text not null,
  unique(stage_id, position)
);

-- Lesson bodies and solutions live only in PostgreSQL, never in the public site bundle.
create table if not exists public.lesson_content (
  lesson_id text primary key references public.lesson_catalog(id) on delete cascade,
  theory text not null,
  task text not null,
  hint text not null,
  starter text not null,
  solution text not null,
  schema_sql text not null
);

create table if not exists public.user_roles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'student' check (role in ('student', 'admin')),
  created_at timestamptz not null default now()
);

create table if not exists public.course_entitlements (
  user_id uuid primary key references auth.users(id) on delete cascade,
  granted_at timestamptz not null default now(),
  source text not null check (source in ('yookassa', 'manual')),
  payment_id uuid
);

create table if not exists public.course_payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  provider_payment_id text unique,
  status text not null default 'pending' check (status in ('pending', 'waiting_for_capture', 'succeeded', 'canceled', 'failed')),
  amount_kopecks integer not null check (amount_kopecks = 299000),
  currency text not null default 'RUB' check (currency = 'RUB'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'course_entitlements_payment_id_fkey') then
    alter table public.course_entitlements add constraint course_entitlements_payment_id_fkey
      foreign key (payment_id) references public.course_payments(id);
  end if;
end $$;

create table if not exists public.lesson_progress (
  user_id uuid not null references auth.users(id) on delete cascade,
  lesson_id text not null references public.lesson_catalog(id) on delete cascade,
  completed_at timestamptz not null default now(),
  primary key(user_id, lesson_id)
);

create index if not exists lesson_catalog_stage_idx on public.lesson_catalog(stage_id, position);
create index if not exists course_payments_user_idx on public.course_payments(user_id, created_at desc);
create index if not exists lesson_progress_user_idx on public.lesson_progress(user_id);

-- This function owns the access decision. No user-controlled metadata grants roles.
create or replace function public.is_course_admin()
returns boolean language sql stable security definer
set search_path = '' as $$
  select exists (
    select 1 from public.user_roles r
    where r.user_id = (select auth.uid()) and r.role = 'admin'
  );
$$;
revoke all on function public.is_course_admin() from public;
grant execute on function public.is_course_admin() to authenticated;

create or replace function public.has_full_course_access()
returns boolean language sql stable security definer
set search_path = '' as $$
  select public.is_course_admin() or exists (
    select 1 from public.course_entitlements e where e.user_id = (select auth.uid())
  );
$$;
revoke all on function public.has_full_course_access() from public;
grant execute on function public.has_full_course_access() to anon, authenticated;

-- Admin is assigned only after Supabase has verified control of this email address.
create or replace function public.sync_course_role()
returns trigger language plpgsql security definer
set search_path = '' as $$
begin
  if new.email_confirmed_at is not null then
    insert into public.user_roles(user_id, role)
    values (new.id, case when lower(new.email) = 'bikzyantiev@gmail.com' then 'admin' else 'student' end)
    on conflict (user_id) do update set role = excluded.role;
  end if;
  return new;
end;
$$;
drop trigger if exists sync_course_role_trigger on auth.users;
create trigger sync_course_role_trigger
  after insert or update of email_confirmed_at, email on auth.users
  for each row execute function public.sync_course_role();

insert into public.user_roles(user_id, role)
select id, case when lower(email) = 'bikzyantiev@gmail.com' then 'admin' else 'student' end
from auth.users where email_confirmed_at is not null
on conflict (user_id) do update set role = excluded.role;

alter table public.course_stages enable row level security;
alter table public.lesson_catalog enable row level security;
alter table public.lesson_content enable row level security;
alter table public.user_roles enable row level security;
alter table public.course_entitlements enable row level security;
alter table public.course_payments enable row level security;
alter table public.lesson_progress enable row level security;

create policy stages_public_read on public.course_stages for select to anon, authenticated using (true);
create policy catalog_public_read on public.lesson_catalog for select to anon, authenticated using (true);
create policy content_access_read on public.lesson_content for select to anon, authenticated
  using (
    exists (select 1 from public.lesson_catalog c where c.id = lesson_id and c.stage_id = 1)
    or (select public.has_full_course_access())
  );
create policy roles_self_read on public.user_roles for select to authenticated using (user_id = (select auth.uid()));
create policy entitlements_self_read on public.course_entitlements for select to authenticated using (user_id = (select auth.uid()));
create policy payments_self_read on public.course_payments for select to authenticated using (user_id = (select auth.uid()));
create policy progress_self_read on public.lesson_progress for select to authenticated using (user_id = (select auth.uid()));
create policy progress_self_insert on public.lesson_progress for insert to authenticated
  with check (
    user_id = (select auth.uid()) and
    exists (select 1 from public.lesson_catalog c where c.id = lesson_id and
      (c.stage_id = 1 or public.has_full_course_access()))
  );
create policy progress_self_delete on public.lesson_progress for delete to authenticated using (user_id = (select auth.uid()));

create policy stages_admin_write on public.course_stages for all to authenticated
  using ((select public.is_course_admin())) with check ((select public.is_course_admin()));
create policy catalog_admin_write on public.lesson_catalog for all to authenticated
  using ((select public.is_course_admin())) with check ((select public.is_course_admin()));
create policy content_admin_write on public.lesson_content for all to authenticated
  using ((select public.is_course_admin())) with check ((select public.is_course_admin()));
create policy roles_admin_read on public.user_roles for select to authenticated
  using ((select public.is_course_admin()));
create policy entitlements_admin_read on public.course_entitlements for select to authenticated
  using ((select public.is_course_admin()));
create policy payments_admin_read on public.course_payments for select to authenticated
  using ((select public.is_course_admin()));
create policy progress_admin_read on public.lesson_progress for select to authenticated
  using ((select public.is_course_admin()));

create or replace function public.admin_list_users()
returns table(user_id uuid, email text, role text, has_access boolean, access_source text)
language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_course_admin() then raise exception 'Access denied'; end if;
  return query
    select u.id, u.email::text, coalesce(r.role, 'student')::text,
      (coalesce(r.role = 'admin', false) or e.user_id is not null), e.source
    from auth.users u
    left join public.user_roles r on r.user_id = u.id
    left join public.course_entitlements e on e.user_id = u.id
    where u.email_confirmed_at is not null
    order by u.created_at desc;
end;
$$;
revoke all on function public.admin_list_users() from public;
grant execute on function public.admin_list_users() to authenticated;

create or replace function public.admin_set_manual_access(target_user uuid, enabled boolean)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_course_admin() then raise exception 'Access denied'; end if;
  if not exists (select 1 from auth.users u where u.id = target_user and u.email_confirmed_at is not null)
    then raise exception 'User not found or unconfirmed'; end if;
  if enabled then
    insert into public.course_entitlements(user_id, source) values(target_user, 'manual')
      on conflict (user_id) do nothing;
  else
    delete from public.course_entitlements where user_id = target_user and source = 'manual';
  end if;
end;
$$;
revoke all on function public.admin_set_manual_access(uuid, boolean) from public;
grant execute on function public.admin_set_manual_access(uuid, boolean) to authenticated;

grant select on public.course_stages, public.lesson_catalog, public.lesson_content to anon, authenticated;
grant select on public.user_roles, public.course_entitlements, public.course_payments to authenticated;
grant select, insert, delete on public.lesson_progress to authenticated;
grant insert, update, delete on public.course_stages, public.lesson_catalog, public.lesson_content to authenticated;
revoke all on public.course_payments, public.course_entitlements, public.user_roles from anon;
