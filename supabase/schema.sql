create table if not exists products (
  sku text primary key,
  name text not null,
  price numeric(10, 2) not null,
  package_size text,
  category text,
  store_code text not null,
  last_updated timestamptz not null
);

create index if not exists products_name_idx on products (name);
