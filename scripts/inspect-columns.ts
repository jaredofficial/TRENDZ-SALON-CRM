import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || '';

async function testInsert() {
  if (!supabaseUrl || !supabaseAnonKey) {
    console.log("No credentials found");
    return;
  }
  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  
  const dummyClient = {
    id: `CL-TEST-${Date.now()}`,
    name: "Test Sync Customer",
    phone: "+919999999999",
    points: 120,
    visits: 3,
    totalSpent: 1500,
    lastVisit: "2026-06-20",
    last30DayReminderCycle: "pending",
    last60DayReminderCycle: "pending"
  };

  console.log("Attempting to insert test client with all fields...");
  const { data, error } = await supabase.from('clients').insert(dummyClient).select();
  if (error) {
    console.error("Insert failed:", error.message, error.details || "");
  } else {
    console.log("Insert succeeded! Succeeded Row:", data);
    // Cleanup
    await supabase.from('clients').delete().eq('id', dummyClient.id);
  }
}

testInsert();
