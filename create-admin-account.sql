-- Create admin account in users table
-- Email: aahmeddraaief@gmail.com
-- Password: 123456789

INSERT INTO public.users (
  id,
  email,
  password_hash,
  full_name,
  role,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'aahmeddraaief@gmail.com',
  '$2b$10$nllvcyRu.FSlDhZbaFs3ourJvw6xepXGqsUbgn5/Y8Uw/zK53k2nu',
  'Admin',
  'admin',
  NOW(),
  NOW()
)
ON CONFLICT (email) DO NOTHING;
