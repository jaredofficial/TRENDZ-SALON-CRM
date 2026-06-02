import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

async function wipeDatabase() {
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('❌ Error: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY must be set in your .env file.');
    process.exit(1);
  }

  console.log(`⚠️ Wiping remote Supabase database: ${supabaseUrl}`);
  console.log('This will delete all appointments, transactions, clients, and staff members from the live database.');
  
  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false
    }
  });

  try {
    console.log('⏳ Wiping appointments...');
    const { error: err1 } = await supabase.from('appointments').delete().neq('id', '');
    if (err1) console.warn('⚠️ Warning wiping appointments:', err1.message);

    console.log('⏳ Wiping transactions...');
    const { error: err2 } = await supabase.from('transactions').delete().neq('id', '');
    if (err2) console.warn('⚠️ Warning wiping transactions:', err2.message);

    console.log('⏳ Wiping clients...');
    const { error: err3 } = await supabase.from('clients').delete().neq('id', '');
    if (err3) console.warn('⚠️ Warning wiping clients:', err3.message);

    console.log('⏳ Wiping staff...');
    const { error: err4 } = await supabase.from('staff').delete().neq('id', '');
    if (err4) console.warn('⚠️ Warning wiping staff:', err4.message);

    if (err1 || err2 || err3 || err4) {
      console.log('\n⚠️ Done with warnings. If no rows were deleted, check your Supabase Row Level Security (RLS) policies to ensure deletes are permitted for the anon/authenticated key.');
    } else {
      console.log('\n✅ Successfully wiped all remote tables on Supabase!');
    }
  } catch (error: any) {
    console.error('❌ An error occurred during database wipe:', error.message);
  }
}

wipeDatabase();
