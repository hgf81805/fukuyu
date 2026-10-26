-- Users can update only their own display_name, using a currently allowed Knight session.
revoke update on public.knight_accounts from anon,authenticated;
grant update(display_name) on public.knight_accounts to authenticated;
create policy knight_account_name_self on public.knight_accounts for update to authenticated
 using (
  (select auth.uid())=user_id and active
  and not coalesce((select auth.jwt()->>'is_anonymous')::boolean,false)
  and session_valid_after<=coalesce((select auth.jwt()->>'iat')::bigint,0)
  and exists(select 1 from public.knight_sessions s where s.user_id=(select auth.uid()) and s.auth_session_id=((select auth.jwt()->>'session_id')::uuid))
 )
 with check (
  (select auth.uid())=user_id and active
  and not coalesce((select auth.jwt()->>'is_anonymous')::boolean,false)
  and session_valid_after<=coalesce((select auth.jwt()->>'iat')::bigint,0)
  and exists(select 1 from public.knight_sessions s where s.user_id=(select auth.uid()) and s.auth_session_id=((select auth.jwt()->>'session_id')::uuid))
 );
