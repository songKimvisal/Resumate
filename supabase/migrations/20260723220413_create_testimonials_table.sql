create table public.testimonials (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  message text not null,
  approved boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.testimonials enable row level security;

create policy "Anyone can submit a testimonial"
  on public.testimonials for insert
  with check (true);

create policy "Anyone can view approved testimonials"
  on public.testimonials for select
  using (approved = true);
