create table public.knight_sessions (
 auth_session_id uuid primary key,
 user_id uuid not null references public.knight_accounts(user_id) on delete cascade,
 created_at timestamptz not null default now()
);
create index knight_sessions_user_id_idx on public.knight_sessions(user_id);
alter table public.knight_sessions enable row level security;
revoke all on public.knight_sessions from anon, authenticated;
grant select on public.knight_sessions to authenticated;
create policy knight_sessions_self on public.knight_sessions for select to authenticated using ((select auth.uid()) = user_id and not coalesce((select auth.jwt()->>'is_anonymous')::boolean,false));
alter policy knight_account_self on public.knight_accounts using ((select auth.uid()) = user_id and not coalesce((select auth.jwt()->>'is_anonymous')::boolean,false));
alter policy knight_data_self on public.knight_learning_data
 using ((select auth.uid())=user_id and not coalesce((select auth.jwt()->>'is_anonymous')::boolean,false) and exists(select 1 from public.knight_accounts a where a.user_id=(select auth.uid()) and a.active and a.session_valid_after<=coalesce((select auth.jwt()->>'iat')::bigint,0)) and exists(select 1 from public.knight_sessions s where s.user_id=(select auth.uid()) and s.auth_session_id=((select auth.jwt()->>'session_id')::uuid)))
 with check ((select auth.uid())=user_id and not coalesce((select auth.jwt()->>'is_anonymous')::boolean,false) and exists(select 1 from public.knight_accounts a where a.user_id=(select auth.uid()) and a.active and a.session_valid_after<=coalesce((select auth.jwt()->>'iat')::bigint,0)) and exists(select 1 from public.knight_sessions s where s.user_id=(select auth.uid()) and s.auth_session_id=((select auth.jwt()->>'session_id')::uuid)));
