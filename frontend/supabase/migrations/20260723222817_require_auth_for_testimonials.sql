drop policy "Anyone can submit a testimonial" on public.testimonials;

create policy "Logged in users can submit a testimonial"
  on public.testimonials for insert
  with check (auth.uid() is not null);
