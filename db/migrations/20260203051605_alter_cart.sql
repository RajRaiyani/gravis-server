-- migrate:up


alter table carts add column guest_id uuid;
alter table cart_items add constraint uk_cart_id_product_id unique (cart_id, product_id);

-- migrate:down


alter table carts drop column guest_id;
alter table cart_items drop constraint uk_cart_id_product_id;
