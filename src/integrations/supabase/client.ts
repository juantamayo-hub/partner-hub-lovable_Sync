import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

// Hardcoded values for Lovable Cloud (these are public/anon keys, safe to include)
const SUPABASE_URL = "https://ppguwpilcvqdmqjbesjl.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBwZ3V3cGlsY3ZxZG1xamJlc2psIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAwMTEzNDksImV4cCI6MjA4NTU4NzM0OX0.MVYmolzFAxLZr_0pcztcVYL-RubDBSq5U9cDdLC46qw";

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
