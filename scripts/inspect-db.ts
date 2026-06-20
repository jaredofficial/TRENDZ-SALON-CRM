import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || '';

async function inspect() {
  if (!supabaseUrl || !supabaseAnonKey) {
    console.log("No credentials found");
    return;
  }
  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  
  console.log("Fetching one row from clients...");
  const { data: clientData, error: clientErr } = await supabase.from('clients').select('*').limit(1);
  console.log("Client Row:", clientData, "Error:", clientErr);

  console.log("Fetching one row from transactions...");
  const { data: txData, error: txErr } = await supabase.from('transactions').select('*').limit(1);
  console.log("Transaction Row:", txData, "Error:", txErr);
  
  console.log("Fetching one row from staff...");
  const { data: staffData, error: staffErr } = await supabase.from('staff').select('*').limit(1);
  console.log("Staff Row:", staffData, "Error:", staffErr);

  console.log("Fetching one row from appointments...");
  const { data: apptData, error: apptErr } = await supabase.from('appointments').select('*').limit(1);
  console.log("Appointment Row:", apptData, "Error:", apptErr);
}

inspect();
