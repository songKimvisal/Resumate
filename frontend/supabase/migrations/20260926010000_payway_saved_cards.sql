-- PayWay keeps the card; only the backend may read its token (pwt).

create table public.payment_cards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  -- Used to fetch the token if the callback is missed.
  request_id text not null unique,
  status text not null default 'pending'
    check (status in ('pending', 'active', 'removed')),
  pwt text,
  brand text,
  masked_number text,
  expires_at timestamptz,
  created_at timestamptz not null default now()
);

create index payment_cards_user_id_idx
  on public.payment_cards (user_id, created_at desc);

-- No policies: the browser never reads this table.
alter table public.payment_cards enable row level security;
