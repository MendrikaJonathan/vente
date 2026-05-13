import { createClient } from '@supabase/supabase-js'

const supabaseUrl  = import."https://bmmbqxafepnixnnajonm.supabase.co"
const supabaseKey  = import."sb_publishable_RTNMqL0_zKAb_xyV7l5f4Q__cyLO8yr"

if (!supabaseUrl || !supabaseKey) {
  console.warn(
    '⚠️  Variables Supabase manquantes.\n' +
    'Copiez .env.example en .env et remplissez VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY.'
  )
}

export const supabase = createClient(
  supabaseUrl  || '"https://bmmbqxafepnixnnajonm.supabase.co',
  supabaseKey  || 'sb_publishable_RTNMqL0_zKAb_xyV7l5f4Q__cyLO8yr',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true
    }
  }
)
