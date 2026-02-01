-- migrate:up

alter table files add column mimetype varchar(150);

-- migrate:down

alter table files drop column type;
