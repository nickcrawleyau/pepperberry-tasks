-- Reload PostgREST schema cache after previous migration
NOTIFY pgrst, 'reload schema';
