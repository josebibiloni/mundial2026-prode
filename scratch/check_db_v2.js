import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const envFile = fs.readFileSync('.env', 'utf8');
const supabaseUrl = envFile.match(/VITE_SUPABASE_URL=(.*)/)?.[1]?.trim();
const supabaseAnonKey = envFile.match(/VITE_SUPABASE_ANON_KEY=(.*)/)?.[1]?.trim();

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function run() {
  console.log("\n--- PARTICIPANTS ---");
  const { data: participants } = await supabase.from('participants').select('*');
  console.log(JSON.stringify(participants, null, 2));

  console.log("\n--- PREDICTIONS ---");
  const { data: predictions } = await supabase.from('predictions').select('*');
  console.log(JSON.stringify(predictions, null, 2));
}

run();
