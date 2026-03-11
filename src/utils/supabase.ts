import { createClient } from '@supabase/supabase-js';

// Usar variables de entorno para que el cambio en Netlify funcione automáticamente
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: Las variables de Supabase no están configuradas en Netlify.');
}

export const supabase = createClient(supabaseUrl, supabaseKey);
