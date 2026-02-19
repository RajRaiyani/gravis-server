-- migrate:up

create table filters (
  id uuid not null default uuidv7() constraint pk_filters primary key,
  category_id uuid not null constraint fk_filters_category_id references product_categories (id),
  name varchar(255) not null,
  constraint uk_filters_category_id_name unique (category_id, name)
);


create table filter_options (
  id uuid not null default uuidv7() constraint pk_filter_options primary key,
  filter_id uuid not null constraint fk_filter_options_filter_id references filters (id),
  value varchar(255) not null,
  constraint uk_filter_options_filter_id_value unique (filter_id, value)
);


create table product_filter_option_mappings (
  product_id uuid not null constraint fk_product_filter_option_mappings_product_id references products (id),
  filter_option_id uuid not null constraint fk_product_filter_option_mappings_filter_option_id references filter_options (id),
  constraint pk_product_filter_option_mappings primary key (product_id, filter_option_id)
);


-- migrate:down

drop table if exists product_filter_option_mappings;
drop table if exists filter_options;
drop table if exists filters;
