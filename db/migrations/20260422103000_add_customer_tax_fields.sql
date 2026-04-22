-- migrate:up

ALTER TABLE customers
  ADD COLUMN gst_number varchar(15),
  ADD COLUMN pan_number varchar(10),
  ADD COLUMN organization_name varchar(255);


-- migrate:down

ALTER TABLE customers
  DROP COLUMN IF EXISTS organization_name,
  DROP COLUMN IF EXISTS pan_number,
  DROP COLUMN IF EXISTS gst_number;
