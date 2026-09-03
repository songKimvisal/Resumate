create table public.payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  pack_id text not null,
  pack_name text not null,
  provider text not null check (provider in ('stripe', 'khqr')),
  amount_cents integer not null check (amount_cents >= 0),
  currency text not null default 'USD',
  status text not null default 'succeeded' check (status in ('pending', 'succeeded', 'failed')),
  external_transaction_id text,
  created_at timestamptz not null default now()
);

create index payments_user_id_created_at_idx
  on public.payments (user_id, created_at desc);

alter table public.payments enable row level security;

create policy "Users can view their own payments"
  on public.payments for select
  using (auth.uid() = user_id);

create or replace function public.record_payment(
  p_user_id uuid,
  p_pack_id text,
  p_pack_name text,
  p_provider text,
  p_amount_cents integer,
  p_currency text,
  p_external_transaction_id text
)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  rec public.payments%rowtype;
begin
  insert into public.payments (
    user_id, pack_id, pack_name, provider, amount_cents,
    currency, status, external_transaction_id
  )
  values (
    p_user_id, p_pack_id, p_pack_name, p_provider, greatest(coalesce(p_amount_cents, 0), 0),
    coalesce(p_currency, 'USD'), 'succeeded', p_external_transaction_id
  )
  returning * into rec;

  return json_build_object(
    'id', rec.id,
    'pack_id', rec.pack_id,
    'pack_name', rec.pack_name,
    'provider', rec.provider,
    'amount_cents', rec.amount_cents,
    'currency', rec.currency,
    'status', rec.status,
    'external_transaction_id', rec.external_transaction_id,
    'created_at', rec.created_at
  );
end;
$$;

revoke all on function public.record_payment(uuid, text, text, text, integer, text, text) from public, anon, authenticated;
grant execute on function public.record_payment(uuid, text, text, text, integer, text, text) to service_role;create table public.payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  pack_id text not null,
  pack_name text not null,
  provider text not null check (provider in ('stripe', 'khqr')),
  amount_cents integer not null check (amount_cents >= 0),
  currency text not null default 'USD',
  status text not null default 'succeeded' check (status in ('pending', 'succeeded', 'failed')),
  external_transaction_id text,
  created_at timestamptz not null default now()
);

create index payments_user_id_created_at_idx
  on public.payments (user_id, created_at desc);

alter table public.payments enable row level security;

create policy "Users can view their own payments"
  on public.payments for select
  using (auth.uid() = user_id);

create or replace function public.record_payment(
  p_user_id uuid,
  p_pack_id text,
  p_pack_name text,
  p_provider text,
  p_amount_cents integer,
  p_currency text,
  p_external_transaction_id text
)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  rec public.payments%rowtype;
begin
  insert into public.payments (
    user_id, pack_id, pack_name, provider, amount_cents,
    currency, status, external_transaction_id
  )
  values (
    p_user_id, p_pack_id, p_pack_name, p_provider, greatest(coalesce(p_amount_cents, 0), 0),
    coalesce(p_currency, 'USD'), 'succeeded', p_external_transaction_id
  )
  returning * into rec;

  return json_build_object(
    'id', rec.id,
    'pack_id', rec.pack_id,
    'pack_name', rec.pack_name,
    'provider', rec.provider,
    'amount_cents', rec.amount_cents,
    'currency', rec.currency,
    'status', rec.status,
    'external_transaction_id', rec.external_transaction_id,
    'created_at', rec.created_at
  );
end;
$$;

revoke all on function public.record_payment(uuid, text, text, text, integer, text, text) from public, anon, authenticated;
grant execute on function public.record_payment(uuid, text, text, text, integer, text, text) to service_role;