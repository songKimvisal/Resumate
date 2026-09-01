-- Job-analysis quota (match + interview set + skill-gap report per run).
-- Owned by FastAPI (service role). Users can read their own row only.

create table public.job_analyses (
  user_id uuid primary key references auth.users(id) on delete cascade,
  analyses_total integer not null default 0 check (analyses_total >= 0),
  analyses_used integer not null default 0 check (analyses_used >= 0),
  updated_at timestamptz not null default now()
);

alter table public.job_analyses enable row level security;

create policy "Users can view their own job analyses"
  on public.job_analyses for select
  using (auth.uid() = user_id);

create or replace function public.get_job_analyses(p_user_id uuid)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  rec public.job_analyses%rowtype;
begin
  insert into public.job_analyses (user_id, analyses_total, analyses_used)
  values (p_user_id, 0, 0)
  on conflict (user_id) do nothing;

  select * into rec from public.job_analyses where user_id = p_user_id;

  return json_build_object(
    'analyses_total', rec.analyses_total,
    'analyses_used', rec.analyses_used
  );
end;
$$;

create or replace function public.grant_job_analyses(
  p_user_id uuid,
  p_amount integer
)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  rec public.job_analyses%rowtype;
  amount integer := greatest(coalesce(p_amount, 0), 0);
begin
  insert into public.job_analyses (user_id, analyses_total, analyses_used)
  values (p_user_id, amount, 0)
  on conflict (user_id) do update
    set analyses_total = public.job_analyses.analyses_total + excluded.analyses_total,
        updated_at = now()
  returning * into rec;

  return json_build_object(
    'analyses_total', rec.analyses_total,
    'analyses_used', rec.analyses_used
  );
end;
$$;

create or replace function public.consume_job_analysis(p_user_id uuid)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  rec public.job_analyses%rowtype;
begin
  insert into public.job_analyses (user_id, analyses_total, analyses_used)
  values (p_user_id, 0, 0)
  on conflict (user_id) do nothing;

  update public.job_analyses
  set analyses_used = analyses_used + 1,
      updated_at = now()
  where user_id = p_user_id
    and analyses_used < analyses_total
  returning * into rec;

  if rec.user_id is null then
    select * into rec from public.job_analyses where user_id = p_user_id;
    return json_build_object(
      'consumed', false,
      'analyses_total', coalesce(rec.analyses_total, 0),
      'analyses_used', coalesce(rec.analyses_used, 0)
    );
  end if;

  return json_build_object(
    'consumed', true,
    'analyses_total', rec.analyses_total,
    'analyses_used', rec.analyses_used
  );
end;
$$;

create or replace function public.refund_job_analysis(p_user_id uuid)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  rec public.job_analyses%rowtype;
begin
  update public.job_analyses
  set analyses_used = greatest(analyses_used - 1, 0),
      updated_at = now()
  where user_id = p_user_id
  returning * into rec;

  if rec.user_id is null then
    return json_build_object(
      'analyses_total', 0,
      'analyses_used', 0
    );
  end if;

  return json_build_object(
    'analyses_total', rec.analyses_total,
    'analyses_used', rec.analyses_used
  );
end;
$$;

revoke all on function public.get_job_analyses(uuid) from public, anon, authenticated;
revoke all on function public.grant_job_analyses(uuid, integer) from public, anon, authenticated;
revoke all on function public.consume_job_analysis(uuid) from public, anon, authenticated;
revoke all on function public.refund_job_analysis(uuid) from public, anon, authenticated;

grant execute on function public.get_job_analyses(uuid) to service_role;
grant execute on function public.grant_job_analyses(uuid, integer) to service_role;
grant execute on function public.consume_job_analysis(uuid) to service_role;
grant execute on function public.refund_job_analysis(uuid) to service_role;
