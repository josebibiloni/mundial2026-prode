import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Inicializar el cliente directamente
export const supabase = (supabaseUrl && supabaseUrl !== 'tu_supabase_url_aqui')
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

if (!supabase) {
  console.warn("⚠️ Supabase no está configurado. Por favor edita las variables de entorno en el archivo `.env` en la raíz de tu proyecto para conectar la base de datos.");
}
