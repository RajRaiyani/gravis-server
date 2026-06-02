-- migrate:up

alter table customers
add constraint uk_phone_number unique (phone_number);

-- migrate:down


alter table customers drop constraint uk_phone_number;
