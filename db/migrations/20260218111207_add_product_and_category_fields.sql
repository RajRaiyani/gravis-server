-- migrate:up

-- Add new fields to products table
alter table products add column product_label varchar(100);
alter table products add column warranty_label varchar(255);
alter table products add column is_featured boolean default false;

-- Add banner_image_id to product_categories table
alter table product_categories add column banner_image_id uuid constraint fk_product_categories_banner_image_id references files (id);

-- migrate:down

alter table products drop column product_label;
alter table products drop column warranty_label;
alter table products drop column is_featured;

alter table product_categories drop column banner_image_id;
