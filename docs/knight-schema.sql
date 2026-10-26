-- Isolated application tables; no changes to other apps' tables or Auth users.
create table public.knight_accounts (
 user_id uuid primary key references auth.users(id) on delete cascade,
 email text not null unique,
 active boolean not null default true,
 managed_by_knight boolean not null default false,
 session_valid_after bigint not null default 0,
 created_at timestamptz not null default now(),
 constraint knight_email_normalized check (email = lower(email))
);
alter table public.knight_accounts enable row level security;
revoke all on public.knight_accounts from anon, authenticated;
grant select on public.knight_accounts to authenticated;
create policy knight_account_self on public.knight_accounts for select to authenticated using ((select auth.uid()) = user_id);

create table public.knight_learning_data (
 user_id uuid primary key references public.knight_accounts(user_id) on delete cascade,
 data jsonb not null,
 revision integer not null default 1 check (revision > 0),
 updated_at timestamptz not null default now(),
 constraint knight_data_shape check (jsonb_typeof(data)='object' and jsonb_typeof(data->'items')='array' and jsonb_typeof(data->'logs')='array' and jsonb_typeof(data->'categories')='array')
);
alter table public.knight_learning_data enable row level security;
revoke all on public.knight_learning_data from anon, authenticated;
grant select, insert, update on public.knight_learning_data to authenticated;
create policy knight_data_self on public.knight_learning_data for all to authenticated
 using ((select auth.uid()) = user_id and exists(select 1 from public.knight_accounts a where a.user_id=(select auth.uid()) and a.active and a.session_valid_after <= coalesce((auth.jwt()->>'iat')::bigint,0)))
 with check ((select auth.uid()) = user_id and exists(select 1 from public.knight_accounts a where a.user_id=(select auth.uid()) and a.active and a.session_valid_after <= coalesce((auth.jwt()->>'iat')::bigint,0)));

-- Register only the already verified master account, preserving its credentials.
insert into public.knight_accounts(user_id,email,managed_by_knight)
 select id,lower(email),false from auth.users where lower(email)='hgf51805@gmail.com' and email_confirmed_at is not null
 on conflict(user_id) do nothing;
