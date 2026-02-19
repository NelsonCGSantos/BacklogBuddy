-- Extensions
create extension if not exists "pgcrypto";

-- Profiles
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  onboarding_complete boolean not null default false,
  last_ratings_sync_at timestamptz,
  created_at timestamptz not null default now()
);

-- Items
create table if not exists public.items (
  id text primary key,
  media_type text not null check (media_type in ('game', 'movie', 'tv', 'anime')),
  title text not null,
  poster_url text,
  genres text[] not null default '{}',
  external_ids jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- User items
create table if not exists public.user_items (
  user_id uuid not null references auth.users (id) on delete cascade,
  item_id text not null references public.items (id) on delete cascade,
  status text not null check (status in ('planned', 'focusing', 'completed', 'dropped')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, item_id)
);

-- Categories
create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

-- Category items
create table if not exists public.category_items (
  category_id uuid not null references public.categories (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  item_id text not null references public.items (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (category_id, item_id)
);

-- User ratings
create table if not exists public.user_ratings (
  user_id uuid not null references auth.users (id) on delete cascade,
  item_id text not null references public.items (id) on delete cascade,
  rating_value numeric,
  rating_scale_max numeric not null default 10,
  notes text,
  updated_at timestamptz not null default now(),
  primary key (user_id, item_id)
);

-- External ratings
create table if not exists public.external_ratings (
  id uuid primary key default gen_random_uuid(),
  item_id text not null references public.items (id) on delete cascade,
  source text not null,
  rating_value numeric,
  rating_scale_max numeric,
  normalized_100 numeric,
  rating_count int,
  last_updated_at timestamptz not null default now()
);

-- Leaderboard entries
create table if not exists public.leaderboard_entries (
  user_id uuid not null references auth.users (id) on delete cascade,
  item_id text not null references public.items (id) on delete cascade,
  tier text not null check (tier in ('S', 'A', 'B', 'C')),
  rank int,
  updated_at timestamptz not null default now(),
  primary key (user_id, item_id)
);

-- Indexes
create index if not exists idx_items_media_type on public.items (media_type);
create index if not exists idx_items_genres on public.items using gin (genres);
create index if not exists idx_items_external_ids on public.items using gin (external_ids);

create index if not exists idx_user_items_item_id on public.user_items (item_id);
create index if not exists idx_user_items_status on public.user_items (status);

create index if not exists idx_categories_user_id on public.categories (user_id);
create index if not exists idx_category_items_user_id on public.category_items (user_id);
create index if not exists idx_category_items_item_id on public.category_items (item_id);

create index if not exists idx_user_ratings_item_id on public.user_ratings (item_id);
create index if not exists idx_external_ratings_item_id on public.external_ratings (item_id);
create index if not exists idx_leaderboard_entries_item_id on public.leaderboard_entries (item_id);

-- Updated at trigger
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger user_items_set_updated_at
before update on public.user_items
for each row
execute function public.set_updated_at();

create trigger user_ratings_set_updated_at
before update on public.user_ratings
for each row
execute function public.set_updated_at();

create trigger leaderboard_entries_set_updated_at
before update on public.leaderboard_entries
for each row
execute function public.set_updated_at();

-- RLS
alter table public.profiles enable row level security;
alter table public.items enable row level security;
alter table public.user_items enable row level security;
alter table public.categories enable row level security;
alter table public.category_items enable row level security;
alter table public.user_ratings enable row level security;
alter table public.external_ratings enable row level security;
alter table public.leaderboard_entries enable row level security;

-- Owner-only policies
create policy profiles_owner_select on public.profiles
for select using (id = auth.uid());

create policy profiles_owner_insert on public.profiles
for insert with check (id = auth.uid());

create policy profiles_owner_update on public.profiles
for update using (id = auth.uid()) with check (id = auth.uid());

create policy profiles_owner_delete on public.profiles
for delete using (id = auth.uid());

create policy user_items_owner_select on public.user_items
for select using (user_id = auth.uid());

create policy user_items_owner_insert on public.user_items
for insert with check (user_id = auth.uid());

create policy user_items_owner_update on public.user_items
for update using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy user_items_owner_delete on public.user_items
for delete using (user_id = auth.uid());

create policy categories_owner_select on public.categories
for select using (user_id = auth.uid());

create policy categories_owner_insert on public.categories
for insert with check (user_id = auth.uid());

create policy categories_owner_update on public.categories
for update using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy categories_owner_delete on public.categories
for delete using (user_id = auth.uid());

create policy category_items_owner_select on public.category_items
for select using (user_id = auth.uid());

create policy category_items_owner_insert on public.category_items
for insert with check (user_id = auth.uid());

create policy category_items_owner_update on public.category_items
for update using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy category_items_owner_delete on public.category_items
for delete using (user_id = auth.uid());

create policy user_ratings_owner_select on public.user_ratings
for select using (user_id = auth.uid());

create policy user_ratings_owner_insert on public.user_ratings
for insert with check (user_id = auth.uid());

create policy user_ratings_owner_update on public.user_ratings
for update using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy user_ratings_owner_delete on public.user_ratings
for delete using (user_id = auth.uid());

create policy leaderboard_entries_owner_select on public.leaderboard_entries
for select using (user_id = auth.uid());

create policy leaderboard_entries_owner_insert on public.leaderboard_entries
for insert with check (user_id = auth.uid());

create policy leaderboard_entries_owner_update on public.leaderboard_entries
for update using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy leaderboard_entries_owner_delete on public.leaderboard_entries
for delete using (user_id = auth.uid());

-- Authenticated read policies for items + external_ratings
create policy items_authenticated_select on public.items
for select using (auth.uid() is not null);

create policy external_ratings_authenticated_select on public.external_ratings
for select using (auth.uid() is not null);

-- Block client inserts/updates on external_ratings by omission (no insert/update policies)
