-- Force PostgREST schema cache reload via DDL comment
COMMENT ON TABLE public.tasks IS 'Property tasks';

NOTIFY pgrst, 'reload schema';
