-- Small, private thumbnails stay account-scoped alongside profile metadata.
alter table public.knight_accounts add column avatar_data text not null default ''
 check (octet_length(avatar_data)<=131072 and (avatar_data='' or avatar_data ~ '^data:image/(png|jpeg|webp);base64,[A-Za-z0-9+/]+={0,2}$'));
grant update(avatar_data) on public.knight_accounts to authenticated;
-- The existing self-profile policy requires own UID, active account and allowed app session.
