-- Allow reading a household that has no members yet (onboarding INSERT ... RETURNING).
-- Safe window: only before the first household_members row is inserted.
create policy "households_select_bootstrap" on public.households for select
  using (
    auth.uid() is not null
    and not exists (
      select 1
      from public.household_members hm
      where hm.household_id = households.id
    )
  );
