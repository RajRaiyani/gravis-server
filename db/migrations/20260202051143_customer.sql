-- migrate:up

create table tokens (
  token text not null constraint pk_tokens primary key,
  meta_data jsonb not null default '{}',
  created_at timestamp with time zone default now() not null,
  expires_at timestamp with time zone not null
);

create table customers (
  id uuid not null default uuidv7() constraint pk_customers primary key,
  first_name varchar(255) not null,
  last_name varchar(255) not null,
  full_name varchar(255) generated always as (first_name || ' ' || last_name) stored,
  email varchar(255) not null constraint uk_customers_email unique,
  is_email_verified boolean default false not null,
  phone_number varchar(15),
  is_phone_number_verified boolean default false not null,
  password_hash text not null,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone
);

create table carts (
  id uuid not null default uuidv7() constraint pk_customer_carts primary key,
  customer_id uuid constraint fk_customer_carts_customer_id references customers (id),
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone
);

create table cart_items (
  id uuid not null default uuidv7() constraint pk_cart_items primary key,
  cart_id uuid not null constraint fk_cart_items_cart_id references carts (id),
  product_id uuid not null constraint fk_cart_items_product_id references products (id),
  quantity integer not null default 1,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone
);




-- migrate:down

drop table if exists tokens;
drop table if exists customers;
drop table if exists carts;
drop table if exists cart_items;
