# Supabase Migration Skill

## Rules

- Migration files go in `supabase/migrations/` with timestamp prefix format: `YYYYMMDDHHMMSS_description.sql`
- Always include both the UP migration and a rollback comment at the top
- Always update RLS policies when adding new tables
- Always update TypeScript types after schema changes
- Always update CLAUDE.md's schema section when tables change

## Migration Template
```sql
-- Migration: [description]
-- Created: [date]
-- Rollback: [describe how to reverse this migration]

-- UP MIGRATION

-- Create table
CREATE TABLE IF NOT EXISTS public.table_name (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.table_name ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "policy_name" ON public.table_name
  FOR SELECT USING (auth.uid() = user_id);
```

## After Every Migration

1. Run migration in Supabase SQL Editor
2. Update TypeScript types in `types/database.ts`
3. Update schema section in `CLAUDE.md`