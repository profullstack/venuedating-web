-- Migration to clean out existing users and set up proper auth integration

-- First, clean out existing data from tables that depend on users
TRUNCATE TABLE api_keys CASCADE;
TRUNCATE TABLE document_generations CASCADE;

-- Clean out existing users
TRUNCATE TABLE users CASCADE;

-- Identify and drop foreign key constraints that reference users.id
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT
            tc.constraint_name,
            tc.table_name
        FROM
            information_schema.table_constraints tc
            JOIN information_schema.constraint_column_usage ccu ON tc.constraint_name = ccu.constraint_name
        WHERE
            tc.constraint_type = 'FOREIGN KEY'
            AND ccu.table_name = 'users'
            AND ccu.column_name = 'id'
    ) LOOP
        EXECUTE format('ALTER TABLE %I DROP CONSTRAINT %I CASCADE', r.table_name, r.constraint_name);
        RAISE NOTICE 'Dropped foreign key constraint: % on table: %', r.constraint_name, r.table_name;
    END LOOP;
END $$;

-- Now we can safely modify the users table
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_pkey;
ALTER TABLE users ADD CONSTRAINT users_pkey PRIMARY KEY (id);

-- Create a function to automatically create a user record when a new auth user is created
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, is_admin, created_at, updated_at)
  VALUES (new.id, new.email, false, now(), now())
  ON CONFLICT (email) 
  DO UPDATE SET
    id = EXCLUDED.id,
    updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a trigger to call the function when a new auth user is created
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Add a comment explaining the auth integration
COMMENT ON TABLE public.users IS 'Custom users table that integrates with auth.users. The id column should match the id in auth.users.';

-- Re-create foreign key constraints for api_keys
ALTER TABLE api_keys 
  ADD CONSTRAINT api_keys_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- Re-create foreign key constraints for document_generations (if it has one)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'document_generations' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE document_generations 
      ADD CONSTRAINT document_generations_user_id_fkey 
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
  END IF;
END $$;