-- ================================================================
-- STASHD — Full Database Schema
-- Paste this into: Supabase Dashboard → SQL Editor → Run
-- ================================================================

create extension if not exists "uuid-ossp";

-- ── COLLECTIONS ──────────────────────────────────────────────────
create table if not exists collections (
  id          uuid primary key default uuid_generate_v4(),
  slug        text unique not null,
  title       text not null,
  abbr        text not null,
  year        text not null,
  description text default '',
  cover_url   text default '',
  total       integer not null default 0,
  sort_order  integer not null default 0,
  published   boolean not null default true,
  created_at  timestamptz default now()
);

-- ── ITEMS ────────────────────────────────────────────────────────
create table if not exists items (
  id            uuid primary key default uuid_generate_v4(),
  collection_id uuid references collections(id) on delete cascade,
  number        integer not null,
  name          text not null,
  description   text default '',
  created_at    timestamptz default now(),
  unique(collection_id, number)
);

-- ── ITEM PHOTOS (multiple per item) ──────────────────────────────
create table if not exists item_photos (
  id        uuid primary key default uuid_generate_v4(),
  item_id   uuid references items(id) on delete cascade,
  url       text not null,
  side      text not null default 'front', -- 'front' | 'back' | 'extra'
  sort      integer not null default 0,
  created_at timestamptz default now()
);

-- ── PROFILES ─────────────────────────────────────────────────────
create table if not exists profiles (
  id             uuid primary key references auth.users(id) on delete cascade,
  handle         text unique,
  location       text default '',
  bio            text default '',
  collector_note text default '',
  interests      text[] default '{}',
  avatar_url     text default '',
  is_admin       boolean not null default false,
  onboarded      boolean not null default false,
  created_at     timestamptz default now()
);

-- ── USER ITEMS ───────────────────────────────────────────────────
create table if not exists user_items (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid references auth.users(id) on delete cascade,
  item_id     uuid references items(id) on delete cascade,
  owned       boolean not null default false,
  wishlisted  boolean not null default false,
  pinned      boolean not null default false,
  for_trade   boolean not null default false,
  duplicates  integer not null default 0,
  condition   text check (condition in ('Mint','Good','Fair','Worn')),
  updated_at  timestamptz default now(),
  unique(user_id, item_id)
);

-- ── USER ITEM PHOTOS (user's own scans) ──────────────────────────
create table if not exists user_item_photos (
  id        uuid primary key default uuid_generate_v4(),
  user_id   uuid references auth.users(id) on delete cascade,
  item_id   uuid references items(id) on delete cascade,
  url       text not null,
  side      text not null default 'front',
  sort      integer not null default 0,
  created_at timestamptz default now()
);

-- ── COMMUNITY POSTS ──────────────────────────────────────────────
create table if not exists community_posts (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid references auth.users(id) on delete cascade,
  body        text not null,
  likes       integer not null default 0,
  visible     boolean not null default true,
  created_at  timestamptz default now()
);

-- ── TRADE LISTINGS ───────────────────────────────────────────────
create table if not exists trade_listings (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid references auth.users(id) on delete cascade,
  item_id     uuid references items(id) on delete cascade,
  condition   text,
  note        text default '',
  active      boolean not null default true,
  created_at  timestamptz default now(),
  unique(user_id, item_id)
);

-- ── ROW LEVEL SECURITY ───────────────────────────────────────────
alter table collections       enable row level security;
alter table items             enable row level security;
alter table item_photos       enable row level security;
alter table profiles          enable row level security;
alter table user_items        enable row level security;
alter table user_item_photos  enable row level security;
alter table community_posts   enable row level security;
alter table trade_listings    enable row level security;

-- Public read on catalog
create policy "collections_public_read" on collections for select using (true);
create policy "items_public_read"       on items       for select using (true);
create policy "item_photos_public_read" on item_photos  for select using (true);
create policy "profiles_public_read"    on profiles    for select using (true);
create policy "posts_public_read"       on community_posts for select using (visible = true);
create policy "trades_public_read"      on trade_listings for select using (active = true);

-- Authenticated writes
create policy "users_own_profile"   on profiles       for all using (auth.uid() = id);
create policy "users_own_items"     on user_items      for all using (auth.uid() = user_id);
create policy "users_own_photos"    on user_item_photos for all using (auth.uid() = user_id);
create policy "users_post"          on community_posts for insert with check (auth.uid() = user_id);
create policy "users_own_posts"     on community_posts for update using (auth.uid() = user_id);
create policy "users_trade"         on trade_listings  for all using (auth.uid() = user_id);

-- Admin write on catalog (is_admin check via profiles)
create policy "admin_manage_collections" on collections for all
  using (exists (select 1 from profiles where id = auth.uid() and is_admin = true));
create policy "admin_manage_items" on items for all
  using (exists (select 1 from profiles where id = auth.uid() and is_admin = true));
create policy "admin_manage_photos" on item_photos for all
  using (exists (select 1 from profiles where id = auth.uid() and is_admin = true));
create policy "admin_moderate_posts" on community_posts for all
  using (exists (select 1 from profiles where id = auth.uid() and is_admin = true));

-- ── AUTO-CREATE PROFILE ──────────────────────────────────────────
create or replace function handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id) values (new.id) on conflict do nothing;
  return new;
end;
$$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- ── SEED COLLECTIONS ─────────────────────────────────────────────
insert into collections (slug, title, abbr, year, total, sort_order) values
  ('yugioh-metal-tazo',  'Yu-Gi-Oh! Metal Tazo',  'MT', '2000', 40, 1),
  ('yugioh-duel-tazo',   'Yu-Gi-Oh! Duel Tazo',   'DT', '1999', 30, 2),
  ('yugioh-shadow-tazo', 'Yu-Gi-Oh! Shadow Tazo', 'ST', '2001', 20, 3)
on conflict (slug) do nothing;

-- ── SEED ITEMS: Metal ────────────────────────────────────────────
do $$ declare c uuid; begin
  select id into c from collections where slug = 'yugioh-metal-tazo';
  for i in 1..40 loop
    insert into items (collection_id, number, name) values (c, i, 'Metal Tazo #' || i)
    on conflict (collection_id, number) do nothing;
  end loop;
end $$;

-- ── SEED ITEMS: Duel ─────────────────────────────────────────────
do $$ declare c uuid; begin
  select id into c from collections where slug = 'yugioh-duel-tazo';
  insert into items (collection_id, number, name) values
    (c,41,'Dark Magician'),(c,42,'Summoned Skull'),(c,43,'Giant Soldier of Stone'),
    (c,44,'Relinquished'),(c,45,'B. Skull Dragon'),(c,46,'Clown Zombie'),
    (c,47,'Black Luster Soldier'),(c,48,'Harpie''s Pet Dragon'),(c,49,'Swamp Battle Guard'),
    (c,50,'Exodia the Forbidden One'),(c,51,'Silver Fang'),(c,52,'Red-Eyes B. Dragon'),
    (c,53,'Beaver Warrior'),(c,54,'Red-Eyes Black Metal Dragon'),(c,55,'Battle Warrior'),
    (c,56,'Rude Kaiser'),(c,57,'Judge Man'),(c,58,'Gaia the Fierce Knight'),
    (c,59,'Hitotsu-Me Giant'),(c,60,'Horn Imp'),(c,61,'Kuriboh'),
    (c,62,'Rabid Horseman'),(c,63,'Insect Queen'),(c,64,'Doll of Demise'),
    (c,65,'Embodiment of Apophis'),(c,66,'Makyura the Destructor'),(c,67,'Strings'),
    (c,68,'Odion'),(c,69,'Arkana'),(c,70,'Kaiba')
  on conflict (collection_id, number) do nothing;
end $$;

-- ── SEED ITEMS: Shadow ───────────────────────────────────────────
do $$ declare c uuid; begin
  select id into c from collections where slug = 'yugioh-shadow-tazo';
  insert into items (collection_id, number, name) values
    (c,71,'Black Luster Soldier'),(c,72,'Dark Magician'),(c,73,'Feral Imp'),
    (c,74,'Summoned Skull'),(c,75,'Winged Dragon'),(c,76,'Beta the Magnet Warrior'),
    (c,77,'B. Skull Dragon'),(c,78,'Rocket Warrior'),(c,79,'Alligator''s Sword'),
    (c,80,'Red-Eyes Black Metal Dragon'),(c,81,'Swordstalker'),(c,82,'Rude Kaiser'),
    (c,83,'Saggi the Dark Clown'),(c,84,'Battle Ox'),(c,85,'Relinquished'),
    (c,86,'Dark Rabbit'),(c,87,'Parrot Dragon'),(c,88,'Reaper of the Cards'),
    (c,89,'King of Yamimakai'),(c,90,'Sword Arm of Dragon')
  on conflict (collection_id, number) do nothing;
end $$;

-- ── STORAGE BUCKETS (run separately in Storage UI or uncomment) ───
-- These must be created in Supabase Dashboard → Storage → New Bucket
-- Bucket 1: "item-photos"   (public: true)
-- Bucket 2: "user-photos"   (public: true)
-- Bucket 3: "collection-covers" (public: true)
