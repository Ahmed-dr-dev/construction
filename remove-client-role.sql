-- Remove 'client' role from users table constraint
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_role_check;

ALTER TABLE public.users ADD CONSTRAINT users_role_check CHECK (
  (role = ANY (ARRAY['admin'::text, 'employee'::text]))
);

-- Optional: Update any existing users with 'client' role to 'employee'
-- UPDATE public.users SET role = 'employee' WHERE role = 'client';
