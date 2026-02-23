ALTER TABLE public.users
ADD COLUMN allowed_sections text[] NOT NULL DEFAULT ARRAY['weather', 'cart'];
