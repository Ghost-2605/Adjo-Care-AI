import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = (supabaseUrl && supabaseKey) 
  ? createClient(supabaseUrl, supabaseKey) 
  : null;

/**
 * Note to USER:
 * To use Supabase, you must create a project at https://supabase.com
 * and add these variables to your .env file:
 * 
 * VITE_SUPABASE_URL=your_project_url
 * VITE_SUPABASE_ANON_KEY=your_anon_key
 */
