-- migrate:up


insert into users (name, email, phone_number, is_admin, password_hash)
values
('Admin User', 'admin@gmail.com', '1234567890', true , '$2b$07$ld3otBu3bsxG7ICLIldQ8OYfFkhgYzt1vPXavb3tLbKRFg9fVtNOS');

-- migrate:down

delete from users where email = 'admin@gmail.com';
