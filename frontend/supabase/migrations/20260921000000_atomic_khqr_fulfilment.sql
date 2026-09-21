alter table public.payments
  add column if not exists fulfilled_at timestamptz;

update public.payments
set fulfilled_at = created_at
where status = 'succeeded'
  and fulfilled_at is null;

create or replace function public.fulfil_khqr_payment(
  p_user_id uuid,
  p_md5 text,
  p_credits integer default 0,
  p_analyses integer default 0,
  p_pdfs integer default 0,
  p_slots integer default null,
  p_all_ids text[] default '{}',
  p_template_id text default null,
  p_unlock_customization boolean default false
)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  rec public.payments%rowtype;
begin
  update public.payments
  set status = 'succeeded'
  where external_transaction_id = p_md5
    and user_id = p_user_id
    and status = 'pending'
  returning * into rec;

  if rec.user_id is null then
    select * into rec
    from public.payments
    where external_transaction_id = p_md5
      and user_id = p_user_id;

    if rec.user_id is null then
      return json_build_object('known', false, 'fulfilled', false, 'pack_id', null);
    end if;

    return json_build_object(
      'known', true,
      'fulfilled', rec.fulfilled_at is not null,
      'pack_id', rec.pack_id
    );
  end if;

  if coalesce(p_credits, 0) > 0 then
    perform public.grant_ai_credits(p_user_id, p_credits);
  end if;

  if coalesce(p_analyses, 0) > 0 then
    perform public.grant_job_analyses(p_user_id, p_analyses);
  end if;

  if coalesce(p_pdfs, 0) > 0 then
    perform public.grant_pdf_saves(p_user_id, p_pdfs);
  end if;

  if p_slots is not null then
    perform public.grant_template_pack(
      p_user_id, rec.pack_id, p_slots, coalesce(p_all_ids, '{}')
    );
  end if;

  if coalesce(p_unlock_customization, false) then
    perform public.unlock_customization(p_user_id);
  end if;

  if p_template_id is not null then
    perform public.purchase_premium_template(p_user_id, p_template_id);
  end if;

  update public.payments
  set fulfilled_at = now()
  where id = rec.id;

  return json_build_object('known', true, 'fulfilled', true, 'pack_id', rec.pack_id);
end;
$$;

revoke all on function public.fulfil_khqr_payment(
  uuid, text, integer, integer, integer, integer, text[], text, boolean
) from public, anon, authenticated;

grant execute on function public.fulfil_khqr_payment(
  uuid, text, integer, integer, integer, integer, text[], text, boolean
) to service_role;
