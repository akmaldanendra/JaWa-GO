import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Kita export variabel 'supabase' biar bisa dipake dimana aja
export const supabase = createClient(supabaseUrl, supabaseKey);