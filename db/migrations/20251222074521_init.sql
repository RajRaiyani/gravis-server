-- migrate:up

create table files (
  id uuid not null default uuidv7() constraint pk_files primary key,
  key text not null constraint uk_files_key unique,
  size bigint,
  _status varchar(100) not null default 'pending',
  created_at timestamp with time zone default now() not null
);

create table users (
  id uuid not null default uuidv7() constraint pk_users primary key,
  name varchar(255) not null,
  email varchar(255) not null constraint uk_users_email unique,
  phone_number varchar(15) not null constraint uk_users_phone_number unique,
  is_admin boolean default false not null,
  password_hash text not null,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone
);

create table product_categories (
  id uuid not null default uuidv7() constraint pk_product_categories primary key,
  name varchar(255) not null constraint uk_product_categories_name unique,
  description text,
  image_id uuid constraint fk_product_categories_image_id references files (id),
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone
);

create table products (
  id uuid not null default uuidv7() constraint pk_products primary key,
  category_id uuid not null constraint fk_products_category_id references product_categories (id),
  name varchar(255) not null constraint uk_products_name unique,
  description text,
  tags text[] not null default '{}',
  points text[] not null default '{}',
  technical_details jsonb[] not null default '{}',
  metadata jsonb not null default '{}',
  sale_price_in_paisa integer not null,
  sale_price_in_rupee numeric(12,2) generated always as (round(sale_price_in_paisa / 100, 2)) stored,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone
);

create table product_images (
  product_id uuid not null constraint fk_product_images_product_id references products (id),
  image_id uuid not null constraint fk_product_images_image_id references files (id),
  is_primary boolean default false not null,
  constraint pk_product_images primary key (product_id, image_id)
);

create table inquiries (
  id uuid not null default uuidv7() constraint pk_inquiries primary key,
  name varchar(255) not null,
  phone_number varchar(15) not null,
  email varchar(255) not null,
  message text not null,
  status varchar(100) not null default 'pending',
  metadata jsonb not null default '{}',
  created_at timestamp with time zone default now() not null
);

-- migrate:down

drop table if exists files;
drop table if exists inquiries;
drop table if exists product_images;
drop table if exists products;
drop table if exists product_categories;
drop table if exists users;
