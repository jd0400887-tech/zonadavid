import { createClient } from '@supabase/supabase-js';

// Intentar leer de variables de entorno, si no existen, usar las claves por defecto
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://jmoudpksvejuzmmkaccl.supabase.co';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imptb3VkcGtzdmVqdXptbWthY2NsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk3MDA3MzEsImV4cCI6MjA3NTI3NjczMX0.EDwv_xgNJmiUtVaKNDBCtyXlEGYvCo1PFMU_2WJG7f0';

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: Las variables de Supabase no están configuradas correctamente.');
}

export const supabase = createClient(supabaseUrl, supabaseKey);
