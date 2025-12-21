-- Fix the resolved_by foreign key to point to public.users instead of auth.users
-- This allows Supabase request to join the public.users table (aliased as 'resolver')

BEGIN;

-- 1. Drop the existing constraint if it exists (it was referencing auth.users)
ALTER TABLE "public"."complaints" 
DROP CONSTRAINT IF EXISTS "complaints_resolved_by_fkey";

-- 2. Add the new constraint referencing public.users
ALTER TABLE "public"."complaints" 
ADD CONSTRAINT "complaints_resolved_by_fkey" 
FOREIGN KEY ("resolved_by") 
REFERENCES "public"."users" ("id");

COMMIT;
