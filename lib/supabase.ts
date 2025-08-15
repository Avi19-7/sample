import { createClient } from '@supabase/supabase-js';
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseKey);

export type Message = {
  id: string;
  user_id: string;
  content: string;
  role: 'user' | 'assistant';
  image_url?: string;
  created_at: string;
};