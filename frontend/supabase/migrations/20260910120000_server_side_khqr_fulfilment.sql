
create unique index if not exists payments_external_transaction_id_key
  on public.payments (external_transaction_id)
  where external_transaction_id is not null;

create or replace function public.payment_json(rec public.payments)
returns json
language sql
immutable
as $$
  select json_build_object(
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
$$;

create or replace function public.create_khqr_intent(
  p_user_id uuid,
  p_pack_id text,
  p_pack_name text,
  p_amount_cents integer,
  p_currency text,
  p_md5 text
)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  rec public.payments%rowtype;
begin
  select * into rec
  from public.payments
  where external_transaction_id = p_md5;

  if rec.user_id is null then
    insert into public.payments (
      user_id, pack_id, pack_name, provider, amount_cents,
      currency, status, external_transaction_id
    )
    values (
      p_user_id, p_pack_id, p_pack_name, 'khqr',
      greatest(coalesce(p_amount_cents, 0), 0),
      coalesce(p_currency, 'USD'), 'pending', p_md5
    )
    returning * into rec;
  end if;

  return public.payment_json(rec);
end;
$$;

create or replace function public.claim_khqr_payment(
  p_user_id uuid,
  p_md5 text
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
      return json_build_object('claimed', false, 'known', false, 'payment', null);
    end if;

    return json_build_object(
      'claimed', false, 'known', true, 'payment', public.payment_json(rec)
    );
  end if;

  return json_build_object(
    'claimed', true, 'known', true, 'payment', public.payment_json(rec)
  );
end;
$$;

create or replace function public.release_khqr_payment(
  p_user_id uuid,
  p_md5 text
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
  set status = 'pending'
  where external_transaction_id = p_md5
    and user_id = p_user_id
    and status = 'succeeded'
  returning * into rec;

  return json_build_object('released', rec.user_id is not null);
end;
$$;

revoke all on function public.create_khqr_intent(uuid, text, text, integer, text, text) from public, anon, authenticated;
revoke all on function public.claim_khqr_payment(uuid, text) from public, anon, authenticated;
revoke all on function public.release_khqr_payment(uuid, text) from public, anon, authenticated;

grant execute on function public.create_khqr_intent(uuid, text, text, integer, text, text) to service_role;
grant execute on function public.claim_khqr_payment(uuid, text) to service_role;
grant execute on function public.release_khqr_payment(uuid, text) to service_role;
