-- migrate:up

CREATE TABLE states (
    id uuid not null default uuidv7() constraint pk_states primary key,
    name varchar(255) not null,
    gst_code varchar(7) not null,
    is_union_territory boolean default false not null
);


create type address_type as enum ('billing', 'shipping');

CREATE TABLE addresses (
    id uuid not null default uuidv7() constraint pk_addresses primary key,
    type address_type NOT NULL,
    customer_id uuid NOT NULL constraint fk_addresses_customer_id references customers (id),
    address text NOT NULL,
    state_id uuid NOT NULL constraint fk_addresses_state_id references states (id),
    city varchar(255) NOT NULL,
    postal_code varchar(10) not null,
    created_at timestamp with time zone default now() not null,
    updated_at timestamp with time zone
);

create type order_payment_status as enum ('pending', 'paid', 'partially_paid', 'failed');

CREATE TABLE orders (
    id uuid not null default uuidv7() constraint pk_orders primary key,
    customer_id uuid NOT NULL constraint fk_orders_customer_id references customers (id),
    payment_status order_payment_status not null default 'pending',
    status varchar(50) not null default 'pending',
    created_at timestamp with time zone default now() not null,
    total_amount_in_paisa integer not null,
    paid_amount_in_paisa integer not null,
    is_paid boolean DEFAULT false NOT NULL,
    razorpay_payment_id varchar(255),
    razorpay_order_id varchar(255),
    razorpay_signature text,
    serial_number integer NOT NULL,
    billing_details jsonb not null,
    billing_address jsonb not null,
    shipping_address jsonb not null,
    serial varchar(50) GENERATED ALWAYS AS (('GRAVIS-ORD-'::text || serial_number)) STORED
);


CREATE TABLE order_items (
    id uuid not null default uuidv7() constraint pk_order_items primary key,
    order_id uuid NOT NULL,
    product_id uuid NOT NULL constraint fk_order_items_product_id references products (id),
    product_name varchar(255) not null,
    quantity integer not null default 1,
    price_in_paisa integer not null
);


insert into states (name, gst_code, is_union_territory) values
  ('Jammu and Kashmir', '01', true),
  ('Himachal Pradesh', '02', false),
  ('Punjab', '03', false),
  ('Chandigarh', '04', true),
  ('Uttarakhand', '05', false),
  ('Haryana', '06', false),
  ('Delhi', '07', true),
  ('Rajasthan', '08', false),
  ('Uttar Pradesh', '09', false),
  ('Bihar', '10', false),
  ('Sikkim', '11', false),
  ('Arunachal Pradesh', '12', false),
  ('Nagaland', '13', false),
  ('Manipur', '14', false),
  ('Mizoram', '15', false),
  ('Tripura', '16', false),
  ('Meghalaya', '17', false),
  ('Assam', '18', false),
  ('West Bengal', '19', false),
  ('Jharkhand', '20', false),
  ('Odisha', '21', false),
  ('Chhattisgarh', '22', false),
  ('Madhya Pradesh', '23', false),
  ('Gujarat', '24', false),
  ('Daman and Diu', '25', true),
  ('Dadra and Nagar Haveli', '26', true),
  ('Maharashtra', '27', false),
  ('Karnataka', '29', false),
  ('Goa', '30', false),
  ('Lakshadweep', '31', true),
  ('Kerala', '32', false),
  ('Tamil Nadu', '33', false),
  ('Puducherry', '34', true),
  ('Andaman and Nicobar', '35', true),
  ('Telangana', '36', false),
  ('Andhra Pradesh', '37', false),
  ('Ladakh', '38', true);



-- migrate:down

