-- migrate:up

alter table products
drop column sale_price_in_rupee;

alter table products
add column sale_price_in_rupee numeric(12,2) generated always as (round(sale_price_in_paisa / 100.00, 2)) stored;

alter table products
add column sale_price numeric(12,2) generated always as (round(sale_price_in_paisa / 100.00, 2)) stored;

-- migrate:down

