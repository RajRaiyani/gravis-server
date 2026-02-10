-- migrate:up

create table inquiries (
  id uuid not null default uuidv7() constraint pk_inquiries primary key,
  type varchar(100) not null default 'general',
  name varchar(255) not null,
  phone_number varchar(15) not null,
  email varchar(255),
  message text,
  product_id uuid constraint fk_inquiries_product_id references products (id),
  status varchar(100) not null default 'pending',
  metadata jsonb not null default '{}',
  created_at timestamp with time zone default now() not null
)


-- migrate:down

drop table if exists inquiries;
