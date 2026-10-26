create or replace function knight_private.password_operation(operation text, target uuid default null, password_value text default null)
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
