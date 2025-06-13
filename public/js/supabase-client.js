// Supabase client initialization
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

// Dynamically fetch config from backend
export const supabaseClientPromise = fetch('/api/1/config/supabase')
  .then(async (res) => {
    if (!res.ok) throw new Error('Failed to load Supabase config');
    const { supabaseUrl, supabaseAnonKey } = await res.json();
    if (!supabaseUrl || !supabaseAnonKey) throw new Error('Supabase config missing');
    return createClient(supabaseUrl, supabaseAnonKey);
  });
