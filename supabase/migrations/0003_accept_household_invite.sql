-- Accept a household invite by token (invited user joins existing household).
create or replace function public.accept_household_invite(p_token text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_invite public.household_invites%rowtype;
  v_user_email text;
begin
  if v_uid is null then
    raise exception 'Not authenticated';
  end if;

  select * into v_invite
  from public.household_invites
  where token = p_token
    and accepted_at is null
    and expires_at > now()
  for update;

  if not found then
    raise exception 'Invalid or expired invite';
  end if;

  if v_invite.email is not null then
    select email into v_user_email from auth.users where id = v_uid;
    if lower(trim(coalesce(v_user_email, ''))) <> lower(trim(v_invite.email)) then
      raise exception 'This invite was sent to a different email address';
    end if;
  end if;

  if exists (
    select 1
    from public.household_members hm
    where hm.household_id = v_invite.household_id
      and hm.user_id = v_uid
      and hm.status = 'active'
  ) then
    update public.household_invites
    set accepted_at = coalesce(accepted_at, now())
    where id = v_invite.id;

    update public.profiles
    set default_household_id = v_invite.household_id
    where id = v_uid;

    return v_invite.household_id;
  end if;

  insert into public.household_members (household_id, user_id, role, status)
  values (v_invite.household_id, v_uid, v_invite.role, 'active');

  update public.household_invites
  set accepted_at = now()
  where id = v_invite.id;

  update public.profiles
  set default_household_id = v_invite.household_id
  where id = v_uid;

  return v_invite.household_id;
end;
$$;

revoke all on function public.accept_household_invite(text) from public;
grant execute on function public.accept_household_invite(text) to authenticated;
