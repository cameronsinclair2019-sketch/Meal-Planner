create extension if not exists pg_trgm;
create extension if not exists "uuid-ossp";

create table if not exists ingredients (
  id uuid primary key default uuid_generate_v4(),
  name text not null unique,
  aliases text[] not null default '{}'
);

create table if not exists ingredient_products (
  ingredient_id uuid not null references ingredients(id) on delete cascade,
  product_sku text not null references products(sku) on delete cascade,
  package_yield numeric not null,
  yield_unit text not null,
  primary key (ingredient_id, product_sku)
);

create table if not exists recipes (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  servings integer not null,
  source_url text,
  instructions text,
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists recipe_ingredients (
  id uuid primary key default uuid_generate_v4(),
  recipe_id uuid not null references recipes(id) on delete cascade,
  ingredient_id uuid not null references ingredients(id),
  qty numeric not null,
  unit text not null
);

create index if not exists products_name_trgm_idx on products using gin (name gin_trgm_ops);
create index if not exists ingredients_name_trgm_idx on ingredients using gin (name gin_trgm_ops);
create index if not exists recipe_ingredients_recipe_idx on recipe_ingredients (recipe_id);

alter table ingredients enable row level security;
alter table ingredient_products enable row level security;
alter table recipes enable row level security;
alter table recipe_ingredients enable row level security;

create policy "Public read access" on ingredients for select to anon using (true);
create policy "Public read access" on ingredient_products for select to anon using (true);
create policy "Public read access" on recipes for select to anon using (true);
create policy "Public read access" on recipe_ingredients for select to anon using (true);

create or replace function search_products(search_query text)
returns setof products
language sql
stable
as $$
  select *
  from products
  order by similarity(name, search_query) desc
  limit 10;
$$;

grant execute on function search_products(text) to anon;
