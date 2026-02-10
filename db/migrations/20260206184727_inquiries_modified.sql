-- migrate:up

alter table inquiries
  drop column if exists name,
  drop column if exists phone_number,
  drop column if exists email,
  add column if not exists customer_id uuid constraint fk_inquiries_customer_id references customers (id);

alter table inquiries rename column metadata to meta_data;

alter table inquiries add column if not exists updated_at timestamp with time zone;


-- migrate:down


alter table inquiries
  drop column if exists customer_id,
  drop column if exists updated_at,
  add column if not exists name varchar(255) not null default '',
  add column if not exists phone_number varchar(15) not null default '',
  add column if not exists email varchar(255);

alter table inquiries rename column meta_data to metadata;
