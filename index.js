import { createClient } from '@supabase/supabase-js';

// Supabase bağlantısı
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Basit test
(async () => {
  const { data, error } = await supabase.from('profiles').select('*');
  if (error) {
    console.error('Error:', error);
  } else {
    console.log('Profiles:', data);
  }
})();
