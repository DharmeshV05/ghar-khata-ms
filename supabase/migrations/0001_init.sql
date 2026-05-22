-- GharKhata initial schema: households, vendors, categories, purchases, payments, RLS, triggers

-- Extensions
create extension if not exists "pgcrypto";

-- Enums
create type public.member_role as enum ('owner', 'admin', 'member', 'viewer');
create type public.member_status as enum ('active', 'invited');
create type public.payment_status as enum ('unpaid', 'partial', 'paid');
create type public.unit_type as enum (
  'KG', 'GRAM', 'LITER', 'ML', 'PIECE', 'DOZEN', 'PACKET', 'BOTTLE'
);
create type public.payment_method as enum ('CASH', 'UPI', 'CARD', 'OTHER');

-- Profiles (1:1 auth.users)
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  avatar_url text,
  default_household_id uuid,
  notification_preferences jsonb default '{"due_reminders": true, "monthly_summary": true}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Households
create table public.households (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  timezone text not null default 'Asia/Kolkata',
  currency_code text not null default 'INR',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles
  add constraint profiles_default_household_fk
  foreign key (default_household_id) references public.households (id) on delete set null;

create table public.household_members (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role public.member_role not null default 'member',
  status public.member_status not null default 'active',
  created_at timestamptz not null default now(),
  unique (household_id, user_id)
);

create index household_members_user_idx on public.household_members (user_id);

create table public.household_invites (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households (id) on delete cascade,
  email text,
  token text not null unique default encode(gen_random_bytes(16), 'hex'),
  role public.member_role not null default 'member',
  expires_at timestamptz not null default (now() + interval '7 days'),
  accepted_at timestamptz,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);

create index household_invites_household_idx on public.household_invites (household_id);

-- Categories
create table public.categories (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households (id) on delete cascade,
  name text not null,
  color text,
  icon text,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  unique (household_id, name)
);

create index categories_household_idx on public.categories (household_id);

-- Vendors
create table public.vendors (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households (id) on delete cascade,
  name text not null,
  phone text,
  address text,
  notes text,
  archived boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index vendors_household_idx on public.vendors (household_id);

-- Purchases
create table public.purchases (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households (id) on delete cascade,
  category_id uuid references public.categories (id) on delete set null,
  vendor_id uuid references public.vendors (id) on delete set null,
  item_name text not null,
  quantity numeric(14,4) not null default 1,
  unit public.unit_type not null default 'PIECE',
  unit_price numeric(12,2) not null default 0,
  line_total numeric(12,2) not null default 0,
  tax_rate numeric(6,3),
  tax_amount numeric(12,2),
  total_with_tax numeric(12,2),
  purchase_date date not null default (timezone('utc', now()))::date,
  payment_status public.payment_status not null default 'unpaid',
  amount_paid numeric(12,2) not null default 0,
  balance_due numeric(12,2) not null default 0,
  notes text,
  is_archived boolean not null default false,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index purchases_household_date_idx on public.purchases (household_id, purchase_date desc);
create index purchases_household_vendor_idx on public.purchases (household_id, vendor_id);
create index purchases_household_category_idx on public.purchases (household_id, category_id);
create index purchases_household_payment_idx on public.purchases (household_id, payment_status);
create index purchases_item_search_idx on public.purchases using gin (to_tsvector('simple', coalesce(item_name, '')));

-- Payments (line item history for purchases)
create table public.payments (
  id uuid primary key default gen_random_uuid(),
  purchase_id uuid not null references public.purchases (id) on delete cascade,
  amount numeric(12,2) not null check (amount > 0),
  paid_at timestamptz not null default now(),
  method public.payment_method not null default 'CASH',
  note text,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);

create index payments_purchase_idx on public.payments (purchase_id);

-- Monthly summaries (aggregated)
create table public.monthly_summaries (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households (id) on delete cascade,
  year int not null check (year >= 2000 and year <= 2100),
  month int not null check (month >= 1 and month <= 12),
  total_expense numeric(14,2) not null default 0,
  total_paid numeric(14,2) not null default 0,
  total_pending numeric(14,2) not null default 0,
  by_category jsonb,
  computed_at timestamptz not null default now(),
  version int not null default 1,
  unique (household_id, year, month)
);

create index monthly_summaries_household_idx on public.monthly_summaries (household_id, year desc, month desc);

-- Activity logs
create table public.activity_logs (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households (id) on delete cascade,
  user_id uuid references auth.users (id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  metadata jsonb,
  created_at timestamptz not null default now()
);

create index activity_logs_household_idx on public.activity_logs (household_id, created_at desc);

-- Recurring templates
create table public.recurring_purchase_templates (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households (id) on delete cascade,
  item_name text not null,
  category_id uuid references public.categories (id) on delete set null,
  vendor_id uuid references public.vendors (id) on delete set null,
  default_quantity numeric(14,4) not null default 1,
  unit public.unit_type not null default 'PIECE',
  typical_unit_price numeric(12,2),
  last_used_at timestamptz,
  use_count int not null default 0,
  created_at timestamptz not null default now()
);

create index recurring_templates_household_idx on public.recurring_purchase_templates (household_id);

-- Helpers: membership & roles (security definer for RLS)
create or replace function public.is_household_member(p_household uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.household_members hm
    where hm.household_id = p_household
      and hm.user_id = auth.uid()
      and hm.status = 'active'
  );
$$;

create or replace function public.household_role(p_household uuid)
returns public.member_role
language sql
stable
security definer
set search_path = public
as $$
  select hm.role from public.household_members hm
  where hm.household_id = p_household
    and hm.user_id = auth.uid()
    and hm.status = 'active'
  limit 1;
$$;

create or replace function public.can_write_ledger(p_household uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.household_members hm
    where hm.household_id = p_household
      and hm.user_id = auth.uid()
      and hm.status = 'active'
      and hm.role in ('owner', 'admin', 'member')
  );
$$;

create or replace function public.can_manage_household(p_household uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.household_members hm
    where hm.household_id = p_household
      and hm.user_id = auth.uid()
      and hm.status = 'active'
      and hm.role in ('owner', 'admin')
  );
$$;

-- Payment recalculation
create or replace function public.recalc_purchase_payment(p_purchase_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_sum numeric(12,2);
  v_due numeric(12,2);
begin
  select coalesce(sum(amount), 0) into v_sum from public.payments where purchase_id = p_purchase_id;
  select coalesce(total_with_tax, line_total) into v_due from public.purchases where id = p_purchase_id;
  if v_due is null then
    return;
  end if;
  update public.purchases
  set
    amount_paid = v_sum,
    balance_due = greatest(round(v_due::numeric - v_sum::numeric, 2), 0),
    payment_status = case
      when v_sum <= 0 then 'unpaid'::public.payment_status
      when v_sum >= v_due then 'paid'::public.payment_status
      else 'partial'::public.payment_status
    end,
    updated_at = now()
  where id = p_purchase_id;
end;
$$;

create or replace function public.payments_after_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'DELETE' then
    perform public.recalc_purchase_payment(old.purchase_id);
    return old;
  end if;
  perform public.recalc_purchase_payment(new.purchase_id);
  if tg_op = 'UPDATE' and old.purchase_id is distinct from new.purchase_id then
    perform public.recalc_purchase_payment(old.purchase_id);
  end if;
  return new;
end;
$$;

create trigger payments_after_ins_upd_del
after insert or update or delete on public.payments
for each row execute function public.payments_after_change();

-- Recalc from payments only (no AFTER trigger on purchases — avoids recursion)

create or replace function public.purchases_set_line_total()
returns trigger
language plpgsql
as $$
begin
  new.line_total := round(new.quantity * new.unit_price, 2);
  if new.tax_rate is not null and new.tax_rate > 0 then
    new.tax_amount := round(new.line_total * (new.tax_rate / 100.0), 2);
    new.total_with_tax := new.line_total + coalesce(new.tax_amount, 0);
  else
    new.tax_amount := null;
    new.total_with_tax := new.line_total;
  end if;
  new.balance_due := greatest(
    round(coalesce(new.total_with_tax, new.line_total) - coalesce(new.amount_paid, 0), 2),
    0
  );
  new.payment_status := case
    when coalesce(new.amount_paid, 0) <= 0 then 'unpaid'::public.payment_status
    when coalesce(new.amount_paid, 0) >= coalesce(new.total_with_tax, new.line_total) then 'paid'::public.payment_status
    else 'partial'::public.payment_status
  end;
  new.updated_at := now();
  return new;
end;
$$;

create trigger purchases_before_ins_upd
before insert or update on public.purchases
for each row execute function public.purchases_set_line_total();

-- New user -> profile
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1))
  );
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- updated_at helper
create or replace function public.touch_updated_at()
returns trigger as $$
begin
  new.updated_at := now();
  return new;
end;
$$ language plpgsql;

create trigger profiles_touch before update on public.profiles for each row execute function public.touch_updated_at();
create trigger households_touch before update on public.households for each row execute function public.touch_updated_at();
create trigger vendors_touch before update on public.vendors for each row execute function public.touch_updated_at();

-- RLS
alter table public.profiles enable row level security;
alter table public.households enable row level security;
alter table public.household_members enable row level security;
alter table public.household_invites enable row level security;
alter table public.categories enable row level security;
alter table public.vendors enable row level security;
alter table public.purchases enable row level security;
alter table public.payments enable row level security;
alter table public.monthly_summaries enable row level security;
alter table public.activity_logs enable row level security;
alter table public.recurring_purchase_templates enable row level security;

-- Profiles: user sees own
create policy "profiles_select_own" on public.profiles for select using (id = auth.uid());
create policy "profiles_update_own" on public.profiles for update using (id = auth.uid());

-- Households
create policy "households_select_member" on public.households for select
  using (public.is_household_member(id));
create policy "households_insert_authenticated" on public.households for insert
  with check (auth.uid() is not null);
create policy "households_update_admin" on public.households for update
  using (public.can_manage_household(id));

-- Household members
create policy "members_select" on public.household_members for select
  using (public.is_household_member(household_id));
-- First member: creator becomes owner when the household has no members yet
create policy "members_insert_bootstrap_owner" on public.household_members for insert
  with check (
    user_id = auth.uid()
    and role = 'owner'::public.member_role
    and status = 'active'::public.member_status
    and not exists (
      select 1 from public.household_members x where x.household_id = household_members.household_id
    )
  );
create policy "members_insert_admin" on public.household_members for insert
  with check (public.can_manage_household(household_id));
create policy "members_update_admin" on public.household_members for update
  using (public.can_manage_household(household_id));

-- Invites
create policy "invites_select" on public.household_invites for select
  using (public.can_manage_household(household_id));
create policy "invites_insert" on public.household_invites for insert
  with check (public.can_manage_household(household_id));
create policy "invites_update" on public.household_invites for update
  using (public.can_manage_household(household_id));

-- Categories
create policy "categories_select" on public.categories for select
  using (public.is_household_member(household_id));
create policy "categories_write" on public.categories for all
  using (public.can_manage_household(household_id))
  with check (public.can_manage_household(household_id));

-- Vendors
create policy "vendors_select" on public.vendors for select
  using (public.is_household_member(household_id));
create policy "vendors_write" on public.vendors for insert
  with check (public.can_write_ledger(household_id));
create policy "vendors_update" on public.vendors for update
  using (public.can_write_ledger(household_id));
create policy "vendors_delete" on public.vendors for delete
  using (public.can_manage_household(household_id));

-- Purchases
create policy "purchases_select" on public.purchases for select
  using (public.is_household_member(household_id));
create policy "purchases_insert" on public.purchases for insert
  with check (public.can_write_ledger(household_id));
create policy "purchases_update" on public.purchases for update
  using (public.can_write_ledger(household_id));
create policy "purchases_delete" on public.purchases for delete
  using (public.can_write_ledger(household_id));

-- Payments
create policy "payments_select" on public.payments for select
  using (
    exists (
      select 1 from public.purchases p
      where p.id = purchase_id and public.is_household_member(p.household_id)
    )
  );
create policy "payments_write" on public.payments for insert
  with check (
    exists (
      select 1 from public.purchases p
      where p.id = purchase_id and public.can_write_ledger(p.household_id)
    )
  );
create policy "payments_update" on public.payments for update
  using (
    exists (
      select 1 from public.purchases p
      where p.id = purchase_id and public.can_write_ledger(p.household_id)
    )
  );
create policy "payments_delete" on public.payments for delete
  using (
    exists (
      select 1 from public.purchases p
      where p.id = purchase_id and public.can_manage_household(p.household_id)
    )
  );

-- Monthly summaries
create policy "summaries_select" on public.monthly_summaries for select
  using (public.is_household_member(household_id));
create policy "summaries_insert_admin" on public.monthly_summaries for insert
  with check (public.can_manage_household(household_id));
create policy "summaries_update_admin" on public.monthly_summaries for update
  using (public.can_manage_household(household_id));
create policy "summaries_delete_admin" on public.monthly_summaries for delete
  using (public.can_manage_household(household_id));

-- Activity logs
create policy "logs_select" on public.activity_logs for select
  using (public.is_household_member(household_id));
create policy "logs_insert" on public.activity_logs for insert
  with check (public.can_write_ledger(household_id));

-- Recurring templates
create policy "recurring_select" on public.recurring_purchase_templates for select
  using (public.is_household_member(household_id));
create policy "recurring_write" on public.recurring_purchase_templates for all
  using (public.can_write_ledger(household_id))
  with check (public.can_write_ledger(household_id));
