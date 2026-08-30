-- PDF saves and premium template entitlements, owned by the FastAPI backend
-- (service role). Same pattern as ai_credits: users can read their own rows;
-- they cannot grant, consume, or unlock from the client.

create table public.pdf_saves (
  user_id uuid primary key references auth.users(id) on delete cascade,
  pdfs_total integer not null default 1 check (pdfs_total >= 0),
  pdfs_used integer not null default 0 check (pdfs_used >= 0),
  updated_at timestamptz not null default now()
);

alter table public.pdf_saves enable row level security;

create policy "Users can view their own PDF saves"
  on public.pdf_saves for select
  using (auth.uid() = user_id);

create table public.user_template_slots (
  user_id uuid primary key references auth.users(id) on delete cascade,
  pack_id text,
  template_slots integer not null default 0,
  updated_at timestamptz not null default now()
);

alter table public.user_template_slots enable row level security;

create policy "Users can view their own template slots"
  on public.user_template_slots for select
  using (auth.uid() = user_id);

create table public.user_unlocked_templates (
  user_id uuid not null references auth.users(id) on delete cascade,
  template_id text not null,
  unlocked_at timestamptz not null default now(),
  primary key (user_id, template_id)
);

alter table public.user_unlocked_templates enable row level security;

create policy "Users can view their own unlocked templates"
  on public.user_unlocked_templates for select
  using (auth.uid() = user_id);

-- ---------- PDF RPCs ----------

create or replace function public.get_pdf_saves(p_user_id uuid)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  rec public.pdf_saves%rowtype;
begin
  insert into public.pdf_saves (user_id, pdfs_total, pdfs_used)
  values (p_user_id, 1, 0)
  on conflict (user_id) do nothing;

  select * into rec from public.pdf_saves where user_id = p_user_id;

  return json_build_object(
    'pdfs_total', rec.pdfs_total,
    'pdfs_used', rec.pdfs_used
  );
end;
$$;

create or replace function public.grant_pdf_saves(
  p_user_id uuid,
  p_amount integer
)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  rec public.pdf_saves%rowtype;
  amount integer := greatest(coalesce(p_amount, 0), 0);
begin
  insert into public.pdf_saves (user_id, pdfs_total, pdfs_used)
  values (p_user_id, 1 + amount, 0)
  on conflict (user_id) do update
    set pdfs_total = public.pdf_saves.pdfs_total + excluded.pdfs_total - 1,
        updated_at = now()
  returning * into rec;

  return json_build_object(
    'pdfs_total', rec.pdfs_total,
    'pdfs_used', rec.pdfs_used
  );
end;
$$;

create or replace function public.consume_pdf_save(p_user_id uuid)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  rec public.pdf_saves%rowtype;
begin
  insert into public.pdf_saves (user_id, pdfs_total, pdfs_used)
  values (p_user_id, 1, 0)
  on conflict (user_id) do nothing;

  update public.pdf_saves
  set pdfs_used = pdfs_used + 1,
      updated_at = now()
  where user_id = p_user_id
    and pdfs_used < pdfs_total
  returning * into rec;

  if rec.user_id is null then
    select * into rec from public.pdf_saves where user_id = p_user_id;
    return json_build_object(
      'consumed', false,
      'pdfs_total', coalesce(rec.pdfs_total, 1),
      'pdfs_used', coalesce(rec.pdfs_used, 0)
    );
  end if;

  return json_build_object(
    'consumed', true,
    'pdfs_total', rec.pdfs_total,
    'pdfs_used', rec.pdfs_used
  );
end;
$$;

create or replace function public.refund_pdf_save(p_user_id uuid)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  rec public.pdf_saves%rowtype;
begin
  update public.pdf_saves
  set pdfs_used = greatest(pdfs_used - 1, 0),
      updated_at = now()
  where user_id = p_user_id
  returning * into rec;

  if rec.user_id is null then
    return json_build_object(
      'pdfs_total', 1,
      'pdfs_used', 0
    );
  end if;

  return json_build_object(
    'pdfs_total', rec.pdfs_total,
    'pdfs_used', rec.pdfs_used
  );
end;
$$;

-- ---------- template RPCs ----------

create or replace function public._template_entitlement_json(p_user_id uuid)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  slots_rec public.user_template_slots%rowtype;
  ids text[];
begin
  select * into slots_rec from public.user_template_slots where user_id = p_user_id;
  select coalesce(array_agg(template_id order by template_id), '{}')
    into ids
    from public.user_unlocked_templates
    where user_id = p_user_id;

  return json_build_object(
    'pack_id', slots_rec.pack_id,
    'template_slots', coalesce(slots_rec.template_slots, 0),
    'unlocked_template_ids', to_json(ids)
  );
end;
$$;

create or replace function public.get_template_entitlements(p_user_id uuid)
returns json
language plpgsql
security definer
set search_path = public
as $$
begin
  return public._template_entitlement_json(p_user_id);
end;
$$;

create or replace function public.grant_template_pack(
  p_user_id uuid,
  p_pack_id text,
  p_slots integer,
  p_all_ids text[] default '{}'
)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  next_slots integer;
  tid text;
begin
  insert into public.user_template_slots (user_id, pack_id, template_slots)
  values (p_user_id, p_pack_id, coalesce(p_slots, 0))
  on conflict (user_id) do update
    set pack_id = excluded.pack_id,
        template_slots = case
          when public.user_template_slots.template_slots < 0 or excluded.template_slots < 0 then -1
          else greatest(public.user_template_slots.template_slots, excluded.template_slots)
        end,
        updated_at = now();

  select template_slots into next_slots
  from public.user_template_slots
  where user_id = p_user_id;

  if next_slots < 0 then
    foreach tid in array coalesce(p_all_ids, '{}') loop
      insert into public.user_unlocked_templates (user_id, template_id)
      values (p_user_id, tid)
      on conflict do nothing;
    end loop;
  end if;

  return public._template_entitlement_json(p_user_id);
end;
$$;

create or replace function public.unlock_premium_template(
  p_user_id uuid,
  p_template_id text
)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  slots_rec public.user_template_slots%rowtype;
  used_count integer;
  already boolean;
begin
  select exists(
    select 1 from public.user_unlocked_templates
    where user_id = p_user_id and template_id = p_template_id
  ) into already;

  if already then
    return (
      public._template_entitlement_json(p_user_id)::jsonb
      || jsonb_build_object('unlocked', true)
    )::json;
  end if;

  select * into slots_rec from public.user_template_slots where user_id = p_user_id;
  if slots_rec.user_id is null then
    return (
      public._template_entitlement_json(p_user_id)::jsonb
      || jsonb_build_object('unlocked', false)
    )::json;
  end if;

  select count(*)::integer into used_count
  from public.user_unlocked_templates
  where user_id = p_user_id;

  if slots_rec.template_slots < 0 or used_count < slots_rec.template_slots then
    insert into public.user_unlocked_templates (user_id, template_id)
    values (p_user_id, p_template_id)
    on conflict do nothing;
    return (
      public._template_entitlement_json(p_user_id)::jsonb
      || jsonb_build_object('unlocked', true)
    )::json;
  end if;

  return (
    public._template_entitlement_json(p_user_id)::jsonb
    || jsonb_build_object('unlocked', false)
  )::json;
end;
$$;

revoke all on function public.get_pdf_saves(uuid) from public, anon, authenticated;
revoke all on function public.grant_pdf_saves(uuid, integer) from public, anon, authenticated;
revoke all on function public.consume_pdf_save(uuid) from public, anon, authenticated;
revoke all on function public.refund_pdf_save(uuid) from public, anon, authenticated;
revoke all on function public._template_entitlement_json(uuid) from public, anon, authenticated;
revoke all on function public.get_template_entitlements(uuid) from public, anon, authenticated;
revoke all on function public.grant_template_pack(uuid, text, integer, text[]) from public, anon, authenticated;
revoke all on function public.unlock_premium_template(uuid, text) from public, anon, authenticated;

grant execute on function public.get_pdf_saves(uuid) to service_role;
grant execute on function public.grant_pdf_saves(uuid, integer) to service_role;
grant execute on function public.consume_pdf_save(uuid) to service_role;
grant execute on function public.refund_pdf_save(uuid) to service_role;
grant execute on function public._template_entitlement_json(uuid) to service_role;
grant execute on function public.get_template_entitlements(uuid) to service_role;
grant execute on function public.grant_template_pack(uuid, text, integer, text[]) to service_role;
grant execute on function public.unlock_premium_template(uuid, text) to service_role;
