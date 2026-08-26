-- AI writing credits, owned by the FastAPI backend (service role).
-- Authenticated users can read their own balance; they cannot grant or spend
-- credits directly from the client.

create table public.ai_credits (
  user_id uuid primary key references auth.users(id) on delete cascade,
  credits_total integer not null default 0 check (credits_total >= 0),
  credits_used integer not null default 0 check (credits_used >= 0),
  updated_at timestamptz not null default now()
);

alter table public.ai_credits enable row level security;

create policy "Users can view their own AI credits"
  on public.ai_credits for select
  using (auth.uid() = user_id);

create or replace function public.grant_ai_credits(
  p_user_id uuid,
  p_amount integer
)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  rec public.ai_credits%rowtype;
  amount integer := greatest(coalesce(p_amount, 0), 0);
begin
  insert into public.ai_credits (user_id, credits_total, credits_used)
  values (p_user_id, amount, 0)
  on conflict (user_id) do update
    set credits_total = public.ai_credits.credits_total + excluded.credits_total,
        updated_at = now()
  returning * into rec;

  return json_build_object(
    'credits_total', rec.credits_total,
    'credits_used', rec.credits_used
  );
end;
$$;

create or replace function public.consume_ai_credit(p_user_id uuid)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  rec public.ai_credits%rowtype;
begin
  update public.ai_credits
  set credits_used = credits_used + 1,
      updated_at = now()
  where user_id = p_user_id
    and credits_used < credits_total
  returning * into rec;

  if rec.user_id is null then
    select * into rec from public.ai_credits where user_id = p_user_id;
    return json_build_object(
      'consumed', false,
      'credits_total', coalesce(rec.credits_total, 0),
      'credits_used', coalesce(rec.credits_used, 0)
    );
  end if;

  return json_build_object(
    'consumed', true,
    'credits_total', rec.credits_total,
    'credits_used', rec.credits_used
  );
end;
$$;

create or replace function public.refund_ai_credit(p_user_id uuid)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  rec public.ai_credits%rowtype;
begin
  update public.ai_credits
  set credits_used = greatest(credits_used - 1, 0),
      updated_at = now()
  where user_id = p_user_id
  returning * into rec;

  if rec.user_id is null then
    return json_build_object(
      'credits_total', 0,
      'credits_used', 0
    );
  end if;

  return json_build_object(
    'credits_total', rec.credits_total,
    'credits_used', rec.credits_used
  );
end;
$$;

revoke all on function public.grant_ai_credits(uuid, integer) from public, anon, authenticated;
revoke all on function public.consume_ai_credit(uuid) from public, anon, authenticated;
revoke all on function public.refund_ai_credit(uuid) from public, anon, authenticated;

grant execute on function public.grant_ai_credits(uuid, integer) to service_role;
grant execute on function public.consume_ai_credit(uuid) to service_role;
grant execute on function public.refund_ai_credit(uuid) to service_role;
