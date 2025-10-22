-- Execute este SQL no Supabase SQL Editor para criar um admin

INSERT INTO admin_users (id, email, full_name, role)
SELECT id, email, 'Admin', 'super_admin'
FROM auth.users
WHERE email = 'nataliacsgoncalves21@gmail.com';
