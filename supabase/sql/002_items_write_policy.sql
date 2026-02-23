-- Allow authenticated users to insert and update items
create policy items_authenticated_insert on public.items
for insert with check (auth.uid() is not null);

create policy items_authenticated_update on public.items
for update using (auth.uid() is not null) with check (auth.uid() is not null);
