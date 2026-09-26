-- PayWay tran_ids go in external_transaction_id, so fulfil_khqr_payment grants them too.

alter table public.payments
  drop constraint if exists payments_provider_check;

alter table public.payments
  add constraint payments_provider_check
  check (provider in ('stripe', 'khqr', 'payway'));

create or replace function public.create_payway_intent(
  p_user_id uuid,
  p_pack_id text,
  p_pack_name text,
  p_amount_cents integer,
  p_currency text,
  p_tran_id text
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
    p_user_id, p_pack_id, p_pack_name, 'payway',
    greatest(coalesce(p_amount_cents, 0), 0),
    coalesce(p_currency, 'USD'), 'pending', p_tran_id
  )
  returning * into rec;

  return public.payment_json(rec);
end;
$$;

revoke all on function public.create_payway_intent(uuid, text, text, integer, text, text) from public, anon, authenticated;
grant execute on function public.create_payway_intent(uuid, text, text, integer, text, text) to service_role;
