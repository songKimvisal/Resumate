create table public.pdf_unlocked_resumes (
  user_id uuid not null references auth.users(id) on delete cascade,
  resume_id uuid not null references public.resumes(id) on delete cascade,
  unlocked_at timestamptz not null default now(),
  primary key (user_id, resume_id)
);

alter table public.pdf_unlocked_resumes enable row level security;

create policy "Users can view their own unlocked resumes"
  on public.pdf_unlocked_resumes for select
  using (auth.uid() = user_id);

create or replace function public.unlock_resume_pdf(
  p_user_id uuid,
  p_resume_id uuid
)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  rec public.pdf_saves%rowtype;
  inserted integer;
begin
  if not exists (
    select 1 from public.resumes
    where id = p_resume_id and user_id = p_user_id
  ) then
    return json_build_object('known', false);
  end if;

  if exists (
    select 1 from public.pdf_unlocked_resumes
    where user_id = p_user_id and resume_id = p_resume_id
  ) then
    select * into rec from public.pdf_saves where user_id = p_user_id;
    return json_build_object(
      'known', true,
      'consumed', true,
      'charged', false,
      'pdfs_total', coalesce(rec.pdfs_total, 1),
      'pdfs_used', coalesce(rec.pdfs_used, 0)
    );
  end if;

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
      'known', true,
      'consumed', false,
      'charged', false,
      'pdfs_total', coalesce(rec.pdfs_total, 1),
      'pdfs_used', coalesce(rec.pdfs_used, 0)
    );
  end if;

  insert into public.pdf_unlocked_resumes (user_id, resume_id)
  values (p_user_id, p_resume_id)
  on conflict do nothing;
  get diagnostics inserted = row_count;

  -- Another request unlocked it first: hand this charge back.
  if inserted = 0 then
    update public.pdf_saves
    set pdfs_used = greatest(pdfs_used - 1, 0),
        updated_at = now()
    where user_id = p_user_id
    returning * into rec;
    return json_build_object(
      'known', true,
      'consumed', true,
      'charged', false,
      'pdfs_total', rec.pdfs_total,
      'pdfs_used', rec.pdfs_used
    );
  end if;

  return json_build_object(
    'known', true,
    'consumed', true,
    'charged', true,
    'pdfs_total', rec.pdfs_total,
    'pdfs_used', rec.pdfs_used
  );
end;
$$;

-- Undo an unlock whose download failed.
create or replace function public.relock_resume_pdf(
  p_user_id uuid,
  p_resume_id uuid
)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  rec public.pdf_saves%rowtype;
begin
  delete from public.pdf_unlocked_resumes
  where user_id = p_user_id and resume_id = p_resume_id;

  if found then
    update public.pdf_saves
    set pdfs_used = greatest(pdfs_used - 1, 0),
        updated_at = now()
    where user_id = p_user_id
    returning * into rec;
  else
    select * into rec from public.pdf_saves where user_id = p_user_id;
  end if;

  return json_build_object(
    'pdfs_total', coalesce(rec.pdfs_total, 1),
    'pdfs_used', coalesce(rec.pdfs_used, 0)
  );
end;
$$;

revoke all on function public.unlock_resume_pdf(uuid, uuid) from public, anon, authenticated;
revoke all on function public.relock_resume_pdf(uuid, uuid) from public, anon, authenticated;
grant execute on function public.unlock_resume_pdf(uuid, uuid) to service_role;
grant execute on function public.relock_resume_pdf(uuid, uuid) to service_role;
