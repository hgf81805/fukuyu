-- Account labels and a service-only encrypted password copy for master management.
alter table public.knight_accounts add column display_name text not null default '' check (char_length(display_name) <= 80);
create schema knight_private;
revoke all on schema knight_private from public, anon, authenticated;
grant usage on schema knight_private to service_role;
create table knight_private.account_passwords (
 user_id uuid primary key references public.knight_accounts(user_id) on delete cascade,
 secret_id uuid not null unique references vault.secrets(id),
 credential_version text not null,
 updated_at timestamptz not null default now()
);
alter table knight_private.account_passwords enable row level security;
create policy deny_client_access on knight_private.account_passwords as restrictive for all to anon,authenticated using (false) with check (false);
revoke all on knight_private.account_passwords from public, anon, authenticated;
-- The definer is confined to a private schema. Only the service role may enter it.
create function knight_private.password_operation(operation text, target uuid default null, password_value text default null)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare saved_secret_id uuid; version text; auth_hash text; result jsonb;
begin
 if current_setting('role',true) not in ('service_role','postgres') then raise insufficient_privilege; end if;
 if operation = 'list' then
  select coalesce(jsonb_agg(jsonb_build_object('user_id',p.user_id,'password',v.decrypted_secret,'password_saved_at',p.updated_at)), '[]'::jsonb) into result
  from knight_private.account_passwords p join vault.decrypted_secrets v on v.id=p.secret_id
  join auth.users u on u.id=p.user_id where p.credential_version=md5(u.encrypted_password);
  return result;
 end if;
 -- Lock the membership so concurrent create/login/delete cannot orphan secrets.
 perform 1 from public.knight_accounts where user_id=target for update;
 if not found then raise exception 'Knight account missing'; end if;
 select secret_id into saved_secret_id from knight_private.account_passwords where user_id=target;
 if operation='delete' then
  delete from knight_private.account_passwords where user_id=target;
  if saved_secret_id is not null then delete from vault.secrets where id=saved_secret_id; end if;
 elsif operation='save' then
  if password_value is null or char_length(password_value) not between 1 and 256 then raise exception 'Invalid password'; end if;
  select encrypted_password into auth_hash from auth.users where id=target for share;
  if extensions.crypt(password_value,auth_hash) is distinct from auth_hash then raise exception 'Credential changed'; end if;
  version := md5(auth_hash);
  if saved_secret_id is null then
   saved_secret_id := vault.create_secret(password_value, 'knight-account-' || target::text, 'Encrypted Knight account credential');
   insert into knight_private.account_passwords(user_id,secret_id,credential_version) values(target,saved_secret_id,version);
  else
   perform vault.update_secret(saved_secret_id,password_value);
   update knight_private.account_passwords set credential_version=version,updated_at=now() where user_id=target;
  end if;
 else raise exception 'Invalid operation';
 end if;
 return '{}'::jsonb;
end $$;
revoke all on function knight_private.password_operation(text,uuid,text) from public,anon,authenticated;
grant execute on function knight_private.password_operation(text,uuid,text) to service_role;
create function public.knight_password_operation(operation text, target uuid default null, password_value text default null)
returns jsonb language sql security invoker set search_path = '' as $$ select knight_private.password_operation(operation,target,password_value) $$;
revoke all on function public.knight_password_operation(text,uuid,text) from public,anon,authenticated;
grant execute on function public.knight_password_operation(text,uuid,text) to service_role;
