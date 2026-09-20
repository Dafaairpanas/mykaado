import { createClient } from '@supabase/supabase-js';

// Gunakan placeholder saat build time agar Next.js tidak crash (karena env variables mungkin belum diset saat prerender)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key';

export const supabase = createClient(supabaseUrl, supabaseKey);
