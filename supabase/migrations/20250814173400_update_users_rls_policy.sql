-- Drop existing RLS policies on users table if they exist
DROP POLICY IF EXISTS "Allow public read access" ON public.users;
DROP POLICY IF EXISTS "Allow authenticated insert" ON public.users;
DROP POLICY IF EXISTS "Allow authenticated update own" ON public.users;

-- Enable RLS on users table if not already enabled
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Create policies for users table
-- Allow anyone to read users (public profiles)
CREATE POLICY "Allow public read access" 
ON public.users 
FOR SELECT 
USING (true);

-- Allow anyone to insert users (for signup)
CREATE POLICY "Allow public insert" 
ON public.users 
FOR INSERT 
WITH CHECK (true);

-- Allow authenticated users to update their own record
CREATE POLICY "Allow authenticated update own" 
ON public.users 
FOR UPDATE 
USING (auth.uid() = id OR auth.uid() IS NULL)
WITH CHECK (auth.uid() = id OR auth.uid() IS NULL);

-- Allow service role to do everything
CREATE POLICY "Allow service role full access" 
ON public.users 
USING (auth.role() = 'service_role');

-- Grant permissions to authenticated and anon users
GRANT SELECT ON public.users TO authenticated, anon;
GRANT INSERT ON public.users TO authenticated, anon;
GRANT UPDATE (full_name, first_name, last_name, phone_number, phone_verified, updated_at) 
ON public.users TO authenticated, anon;
