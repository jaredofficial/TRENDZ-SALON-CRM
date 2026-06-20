import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || '';

async function fetchSchema() {
  if (!supabaseUrl || !supabaseAnonKey) {
    console.log("No credentials found");
    return;
  }
  const url = `${supabaseUrl}/rest/v1/?apikey=${supabaseAnonKey}`;
  console.log(`Fetching schema from ${supabaseUrl}...`);
  try {
    const res = await fetch(url);
    const data = await res.json();
    console.log("Tables found:", Object.keys(data.definitions || {}));
    
    // Print fields for each table
    for (const tableName of Object.keys(data.definitions || {})) {
      console.log(`\nTable: ${tableName}`);
      const properties = data.definitions[tableName].properties || {};
      for (const propName of Object.keys(properties)) {
        console.log(`  - ${propName}: ${properties[propName].type}`);
      }
    }
  } catch (e: any) {
    console.error("Error:", e.message);
  }
}

fetchSchema();
