-- migrate:up

alter table products add column can_purchase boolean default true not null;

-- migrate:down

alter table products drop column can_purchase;
