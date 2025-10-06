import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://jmoudpksvejuzmmkaccl.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imptb3VkcGtzdmVqdXptbWthY2NsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk3MDA3MzEsImV4cCI6MjA3NTI3NjczMX0.EDwv_xgNJmiUtVaKNDBCtyXlEGYvCo1PFMU_2WJG7f0';

export const supabase = createClient(supabaseUrl, supabaseKey);
