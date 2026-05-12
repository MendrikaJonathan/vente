-- ============================================================
-- ShopHub — Schéma Supabase complet
-- Exécuter dans : Supabase Dashboard > SQL Editor
-- ============================================================

-- Extensions
create extension if not exists "uuid-ossp";

-- ── 1. PROFILES ──────────────────────────────────────────────
create table if not exists public.profiles (
  id          uuid references auth.users on delete cascade primary key,
  email       text not null,
  full_name   text,
  avatar_url  text,
  role        text not null default 'client'
              check (role in ('client','vendor','admin')),
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);
alter table public.profiles enable row level security;

create policy "Profiles lisibles par tous"          on public.profiles for select using (true);
create policy "Utilisateur modifie son profil"      on public.profiles for update using (auth.uid() = id);
create policy "Insert profil propre"                on public.profiles for insert with check (auth.uid() = id);
create policy "Admin modifie tous les profils"      on public.profiles for update using (
  (select role from public.profiles where id = auth.uid()) = 'admin'
);

-- Trigger: créer profil automatiquement à l'inscription
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email,'@',1)),
    coalesce(new.raw_user_meta_data->>'role', 'client')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- updated_at helper
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

create trigger profiles_updated_at before update on public.profiles
  for each row execute procedure public.set_updated_at();

-- ── 2. CATEGORIES ─────────────────────────────────────────────
create table if not exists public.categories (
  id         uuid default uuid_generate_v4() primary key,
  name       text not null,
  slug       text not null unique,
  icon       text default '📦',
  parent_id  uuid references public.categories(id),
  created_at timestamptz default now()
);
alter table public.categories enable row level security;
create policy "Catégories publiques"    on public.categories for select using (true);
create policy "Admin gère catégories"   on public.categories for all
  using ((select role from public.profiles where id = auth.uid()) = 'admin');

insert into public.categories (name, slug, icon) values
  ('Électronique',  'electronique',  '📱'),
  ('Mode',          'mode',          '👗'),
  ('Maison',        'maison',        '🏠'),
  ('Livres',        'livres',        '📚'),
  ('Sport',         'sport',         '⚽'),
  ('Gaming',        'gaming',        '🎮'),
  ('Beauté',        'beaute',        '💄'),
  ('Alimentation',  'alimentation',  '🥗')
on conflict (slug) do nothing;

-- ── 3. VENDORS ────────────────────────────────────────────────
create table if not exists public.vendors (
  id           uuid default uuid_generate_v4() primary key,
  user_id      uuid references public.profiles(id) on delete cascade unique not null,
  shop_name    text not null,
  description  text,
  logo_url     text,
  banner_url   text,
  status       text not null default 'active'
               check (status in ('pending','active','suspended')),
  rating       numeric(3,2) default 0,
  total_sales  integer default 0,
  created_at   timestamptz default now(),
  updated_at   timestamptz default now()
);
alter table public.vendors enable row level security;
create policy "Vendors lisibles par tous"      on public.vendors for select using (true);
create policy "Vendeur crée sa boutique"       on public.vendors for insert with check (user_id = auth.uid());
create policy "Vendeur modifie sa boutique"    on public.vendors for update using (user_id = auth.uid());
create policy "Admin gère tous les vendors"    on public.vendors for all
  using ((select role from public.profiles where id = auth.uid()) = 'admin');

create trigger vendors_updated_at before update on public.vendors
  for each row execute procedure public.set_updated_at();

-- ── 4. PRODUCTS ───────────────────────────────────────────────
create table if not exists public.products (
  id             uuid default uuid_generate_v4() primary key,
  vendor_id      uuid references public.vendors(id) on delete cascade not null,
  category_id    uuid references public.categories(id),
  name           text not null,
  description    text,
  price          numeric(12,2) not null check (price > 0),
  compare_price  numeric(12,2),
  stock          integer not null default 0 check (stock >= 0),
  sku            text,
  status         text not null default 'draft'
                 check (status in ('draft','published','archived')),
  image_url      text,
  images         text[] default '{}',
  total_sold     integer default 0,
  rating         numeric(3,2) default 0,
  review_count   integer default 0,
  created_at     timestamptz default now(),
  updated_at     timestamptz default now()
);
alter table public.products enable row level security;

create policy "Produits publiés visibles par tous" on public.products
  for select using (
    status = 'published'
    or vendor_id in (select id from public.vendors where user_id = auth.uid())
    or (select role from public.profiles where id = auth.uid()) = 'admin'
  );
create policy "Vendeur gère ses produits"  on public.products for all
  using (vendor_id in (select id from public.vendors where user_id = auth.uid()));
create policy "Admin gère tous les produits" on public.products for all
  using ((select role from public.profiles where id = auth.uid()) = 'admin');

create trigger products_updated_at before update on public.products
  for each row execute procedure public.set_updated_at();

-- ── 5. CART ITEMS ─────────────────────────────────────────────
create table if not exists public.cart_items (
  id         uuid default uuid_generate_v4() primary key,
  user_id    uuid references public.profiles(id) on delete cascade not null,
  product_id uuid references public.products(id) on delete cascade not null,
  quantity   integer not null default 1 check (quantity > 0),
  created_at timestamptz default now(),
  unique(user_id, product_id)
);
alter table public.cart_items enable row level security;
create policy "Panier privé" on public.cart_items for all using (user_id = auth.uid());

-- ── 6. ADDRESSES ──────────────────────────────────────────────
create table if not exists public.addresses (
  id         uuid default uuid_generate_v4() primary key,
  user_id    uuid references public.profiles(id) on delete cascade not null,
  full_name  text not null,
  street     text not null,
  city       text not null,
  zip        text,
  country    text not null default 'Madagascar',
  phone      text,
  is_default boolean default false,
  created_at timestamptz default now()
);
alter table public.addresses enable row level security;
create policy "Adresses privées" on public.addresses for all using (user_id = auth.uid());

-- ── 7. ORDERS ─────────────────────────────────────────────────
create table if not exists public.orders (
  id               uuid default uuid_generate_v4() primary key,
  user_id          uuid references public.profiles(id) not null,
  address_id       uuid references public.addresses(id),
  subtotal         numeric(12,2) not null,
  shipping         numeric(12,2) default 0,
  discount         numeric(12,2) default 0,
  total            numeric(12,2) not null,
  status           text not null default 'pending'
                   check (status in ('pending','confirmed','processing','shipped','delivered','cancelled','refunded')),
  payment_status   text not null default 'pending'
                   check (payment_status in ('pending','paid','failed','refunded')),
  payment_method   text default 'simulation',
  delivery_method  text default 'standard',
  stripe_session_id text,
  notes            text,
  created_at       timestamptz default now(),
  updated_at       timestamptz default now()
);
alter table public.orders enable row level security;
create policy "Client voit ses commandes" on public.orders for select
  using (user_id = auth.uid() or (select role from public.profiles where id = auth.uid()) = 'admin');
create policy "Client crée une commande"  on public.orders for insert with check (user_id = auth.uid());
create policy "Admin/vendeur met à jour"  on public.orders for update
  using (
    user_id = auth.uid()
    or (select role from public.profiles where id = auth.uid()) in ('admin','vendor')
  );

create trigger orders_updated_at before update on public.orders
  for each row execute procedure public.set_updated_at();

-- ── 8. ORDER ITEMS ────────────────────────────────────────────
create table if not exists public.order_items (
  id             uuid default uuid_generate_v4() primary key,
  order_id       uuid references public.orders(id) on delete cascade not null,
  product_id     uuid references public.products(id) not null,
  vendor_id      uuid references public.vendors(id),
  product_name   text not null,
  product_image  text,
  quantity       integer not null check (quantity > 0),
  unit_price     numeric(12,2) not null,
  total_price    numeric(12,2) not null,
  created_at     timestamptz default now()
);
alter table public.order_items enable row level security;
create policy "Voir ses order_items" on public.order_items for select
  using (
    order_id in (select id from public.orders where user_id = auth.uid())
    or vendor_id in (select id from public.vendors where user_id = auth.uid())
    or (select role from public.profiles where id = auth.uid()) = 'admin'
  );
create policy "Client crée ses order_items" on public.order_items for insert
  with check (order_id in (select id from public.orders where user_id = auth.uid()));

-- Trigger: décrémente le stock après achat
create or replace function public.decrement_stock()
returns trigger language plpgsql security definer as $$
begin
  update public.products
  set stock = greatest(0, stock - new.quantity),
      total_sold = total_sold + new.quantity
  where id = new.product_id;
  return new;
end;
$$;
create trigger after_order_item_insert
  after insert on public.order_items
  for each row execute procedure public.decrement_stock();

-- ── 9. REVIEWS ────────────────────────────────────────────────
create table if not exists public.reviews (
  id         uuid default uuid_generate_v4() primary key,
  user_id    uuid references public.profiles(id) not null,
  product_id uuid references public.products(id) on delete cascade not null,
  rating     integer not null check (rating between 1 and 5),
  comment    text,
  created_at timestamptz default now(),
  unique(user_id, product_id)
);
alter table public.reviews enable row level security;
create policy "Avis publics"          on public.reviews for select using (true);
create policy "Client écrit un avis"  on public.reviews for insert with check (user_id = auth.uid());
create policy "Client modifie son avis" on public.reviews for update using (user_id = auth.uid());

-- Trigger: met à jour la note du produit
create or replace function public.update_product_rating()
returns trigger language plpgsql security definer as $$
declare
  pid uuid;
begin
  pid := coalesce(new.product_id, old.product_id);
  update public.products
  set
    rating       = (select coalesce(avg(rating), 0) from public.reviews where product_id = pid),
    review_count = (select count(*) from public.reviews where product_id = pid)
  where id = pid;
  return coalesce(new, old);
end;
$$;
create trigger after_review_change
  after insert or update or delete on public.reviews
  for each row execute procedure public.update_product_rating();

-- ── 10. STORAGE BUCKET ────────────────────────────────────────
insert into storage.buckets (id, name, public)
  values ('products', 'products', true)
  on conflict (id) do nothing;

drop policy if exists "Images publiques lecture" on storage.objects;
drop policy if exists "Utilisateur upload images" on storage.objects;
drop policy if exists "Utilisateur supprime ses images" on storage.objects;

create policy "Images publiques lecture" on storage.objects
  for select using (bucket_id = 'products');

create policy "Utilisateur upload images" on storage.objects
  for insert with check (
    bucket_id = 'products' and auth.role() = 'authenticated'
  );

create policy "Utilisateur supprime ses images" on storage.objects
  for delete using (
    bucket_id = 'products' and auth.uid()::text = (storage.foldername(name))[1]
  );

-- ── FIN MIGRATION ─────────────────────────────────────────────
