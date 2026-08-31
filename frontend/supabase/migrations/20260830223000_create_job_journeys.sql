create table public.job_journeys (
  resume_id uuid primary key references public.resumes(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create index job_journeys_user_id_idx on public.job_journeys (user_id);

alter table public.job_journeys enable row level security;

create policy "Users can view their own job journeys"
  on public.job_journeys for select
  using (auth.uid() = user_id);

create policy "Users can insert their own job journeys"
  on public.job_journeys for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own job journeys"
  on public.job_journeys for update
  using (auth.uid() = user_id);

create policy "Users can delete their own job journeys"
  on public.job_journeys for delete
  using (auth.uid() = user_id);
