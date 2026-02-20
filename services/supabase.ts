import { createClient } from '@supabase/supabase-js';

// Tenta pegar as variáveis injetadas pelo Vite
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey && supabaseUrl.length > 5);

// Cria o cliente apenas se as chaves existirem, senão cria null
export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl!, supabaseAnonKey!)
  : null;
