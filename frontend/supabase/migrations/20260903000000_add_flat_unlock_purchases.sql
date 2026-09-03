
alter table public.user_template_slots
  add column customization_unlocked boolean not null default false;
update public.user_template_slots
  set customization_unlocked = true
  where template_slots <> 0;
create table public.user_owned_templates (
  user_id uuid not null references auth.users(id) on delete cascade,
  template_id text not null,
  purchased_at timestamptz not null default now(),
  primary key (user_id, template_id)
);

alter table public.user_owned_templates enable row level security;

create policy "Users can view their own owned templates"
  on public.user_owned_templates for select
  using (auth.uid() = user_id);

create or replace function public._template_entitlement_json(p_user_id uuid)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  slots_rec public.user_template_slots%rowtype;
  ids text[];
  owned_ids text[];
begin
  select * into slots_rec from public.user_template_slots where user_id = p_user_id;
  select coalesce(array_agg(template_id order by template_id), '{}')
    into ids
    from public.user_unlocked_templates
    where user_id = p_user_id;
  select coalesce(array_agg(template_id order by template_id), '{}')
    into owned_ids
    from public.user_owned_templates
    where user_id = p_user_id;

  return json_build_object(
    'pack_id', slots_rec.pack_id,
    'template_slots', coalesce(slots_rec.template_slots, 0),
    'unlocked_template_ids', to_json(ids),
    'customization_unlocked', coalesce(slots_rec.customization_unlocked, false),
    'premium_templates_owned', to_json(owned_ids)
  );
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
  insert into public.user_template_slots (user_id, pack_id, template_slots, customization_unlocked)
  values (p_user_id, p_pack_id, coalesce(p_slots, 0), coalesce(p_slots, 0) <> 0)
  on conflict (user_id) do update
    set pack_id = excluded.pack_id,
        template_slots = case
          when public.user_template_slots.template_slots < 0 or excluded.template_slots < 0 then -1
          else greatest(public.user_template_slots.template_slots, excluded.template_slots)
        end,
        customization_unlocked = public.user_template_slots.customization_unlocked or excluded.customization_unlocked,
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

create or replace function public.unlock_customization(p_user_id uuid)
returns json
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.user_template_slots (user_id, template_slots, customization_unlocked)
  values (p_user_id, 0, true)
  on conflict (user_id) do update
    set customization_unlocked = true,
        updated_at = now();

  return public._template_entitlement_json(p_user_id);
end;
$$;

create or replace function public.purchase_premium_template(
  p_user_id uuid,
  p_template_id text
)
returns json
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.user_owned_templates (user_id, template_id)
  values (p_user_id, p_template_id)
  on conflict do nothing;

  return public._template_entitlement_json(p_user_id);
end;
$$;

revoke all on function public._template_entitlement_json(uuid) from public, anon, authenticated;
revoke all on function public.grant_template_pack(uuid, text, integer, text[]) from public, anon, authenticated;
revoke all on function public.unlock_customization(uuid) from public, anon, authenticated;
revoke all on function public.purchase_premium_template(uuid, text) from public, anon, authenticated;

grant execute on function public._template_entitlement_json(uuid) to service_role;
grant execute on function public.grant_template_pack(uuid, text, integer, text[]) to service_role;
grant execute on function public.unlock_customization(uuid) to service_role;
grant execute on function public.purchase_premium_template(uuid, text) to service_role;
