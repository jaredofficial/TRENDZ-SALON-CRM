import * as XLSX from 'xlsx';
import * as fs from 'fs';
import * as path from 'path';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || '';

const months = [
  'JANUARY 2026',
  'FEBRUARY 2026',
  'MARCH 2026',
  'APRIL 2026',
  'MAY 2026',
  'JUNE 2026'
];

// Excel date conversion helper
function excelToJSDate(serial: number) {
  const utc_days  = serial - 25569;
  const utc_value = utc_days * 86400;
  return new Date(utc_value * 1000);
}

// Robust Excel date parsing with anomaly correction
function parseExcelDate(rawVal: any, sheetMonthIndex: number, sheetYear: number): string {
  if (typeof rawVal === 'number') {
    const date = excelToJSDate(rawVal);
    const parsedYear = date.getUTCFullYear();
    const parsedMonth = date.getUTCMonth(); // 0-based
    const parsedDay = date.getUTCDate(); // 1-based
    
    if (parsedYear === sheetYear) {
      if (parsedMonth === sheetMonthIndex) {
        const mm = String(parsedMonth + 1).padStart(2, '0');
        const dd = String(parsedDay).padStart(2, '0');
        return `${parsedYear}-${mm}-${dd}`;
      } else {
        // Excel swapped month and day
        const actualDay = parsedMonth + 1;
        const actualMonthIndex = parsedDay - 1; 
        
        const mm = String(actualMonthIndex + 1).padStart(2, '0');
        const dd = String(actualDay).padStart(2, '0');
        return `${sheetYear}-${mm}-${dd}`;
      }
    } else {
      const mm = String(sheetMonthIndex + 1).padStart(2, '0');
      const dd = String(parsedDay).padStart(2, '0');
      return `${sheetYear}-${mm}-${dd}`;
    }
  } else if (typeof rawVal === 'string') {
    const match = rawVal.match(/(\d+)[-/](\d+)[-/](\d+)/);
    if (match) {
      const d = parseInt(match[1], 10);
      const m = parseInt(match[2], 10);
      let y = parseInt(match[3], 10);
      if (y < 100) y += 2000;
      
      const mm = String(m).padStart(2, '0');
      const dd = String(d).padStart(2, '0');
      return `${y}-${mm}-${dd}`;
    }
  }
  return `${sheetYear}-${String(sheetMonthIndex + 1).padStart(2, '0')}-01`;
}

// 8 core staff members mapping
const initialStaff = [
  { id: 'ST-ADNAN', name: 'Adnan', role: 'junior hair stylist', phone: '+919999999901', email: 'adnan@trendzsalon.com', instagram: '@adnan' },
  { id: 'ST-RABIA', name: 'Rabia', role: 'Pedicurist', phone: '+919999999902', email: 'rabia@trendzsalon.com', instagram: '@rabia' },
  { id: 'ST-ANITA', name: 'Anita', role: 'beautician', phone: '+919999999903', email: 'anita@trendzsalon.com', instagram: '@anita' },
  { id: 'ST-VICKY', name: 'Vicky', role: 'Senior Stylist', phone: '+919999999904', email: 'vicky@trendzsalon.com', instagram: '@vicky' },
  { id: 'ST-WASIF', name: 'Wasif', role: 'hairstylist', phone: '+919999999905', email: 'wasif@trendzsalon.com', instagram: '@wasif' },
  { id: 'ST-JULIANA', name: 'Juliana', role: 'Pedicurist', phone: '+919999999906', email: 'juliana@trendzsalon.com', instagram: '@juliana' },
  { id: 'ST-ZOYA', name: 'Zoya', role: 'Stylist', phone: '+919999999907', email: 'zoya@trendzsalon.com', instagram: '@zoya' },
  { id: 'ST-TRENDZ', name: 'Trendz', role: 'Management', phone: '+919999999908', email: 'management@trendzsalon.com', instagram: '@trendz' },
  { id: 'ST-EJAZ', name: 'Ejaz', role: 'receptionist', phone: '+919999999909', email: 'ejaz@trendzsalon.com', instagram: '@ejaz' }
];

const staffMap: Record<string, typeof initialStaff[0]> = {};
initialStaff.forEach(s => {
  staffMap[s.name.toUpperCase()] = s;
});

async function runImport() {
  console.log('🚀 Starting Trendz Salon Excel Import...');
  
  const myXLSX: any = (XLSX as any).default || XLSX;
  const workbook = myXLSX.readFile('Trendz Salon Accounting 2k26.xlsx');
  
  const transactions: any[] = [];
  const customersMap: Record<string, any> = {};

  months.forEach((sheetName, monthIndex) => {
    const worksheet = workbook.Sheets[sheetName];
    if (!worksheet) {
      console.warn(`⚠️ Warning: Sheet ${sheetName} not found!`);
      return;
    }
    const data: any[][] = myXLSX.utils.sheet_to_json(worksheet, { header: 1 });
    
    let lastParsedDate = '';
    let sheetTxCount = 0;
    let sheetRevenueSum = 0;

    data.slice(1).forEach((row) => {
      if (!row || row.length === 0) return;
      
      const dateVal = row[0];
      const category = row[1];
      const nameVal = row[2];
      const phoneVal = row[3];
      const serviceVal = row[4];
      const amountVal = row[5];
      const paymentModeVal = row[6];
      const attendantVal = row[7];
      
      // 1. Skip grand total rows
      let isGrandTotal = false;
      row.forEach((cell) => {
        if (cell !== null && cell !== undefined) {
          const str = String(cell).toLowerCase();
          if (str.includes('grand total') || str.includes('grand_total')) {
            isGrandTotal = true;
          }
        }
      });
      if (isGrandTotal) return;
      
      // 2. Skip empty rows or rows without numeric amount
      if (amountVal === undefined || amountVal === null || amountVal === '') return;
      const amt = Number(amountVal);
      if (isNaN(amt)) return;
      
      // 3. Skip rows with no other metadata (Omitted to include split transactions like May row 118)
      
      // 4. Determine transaction date
      if (dateVal) {
        lastParsedDate = parseExcelDate(dateVal, monthIndex, 2026);
      }
      const txDate = lastParsedDate || `2026-${String(monthIndex + 1).padStart(2, '0')}-01`;

      // 5. Clean customer info
      let clientName = 'Walk-in Customer';
      if (nameVal && typeof nameVal === 'string') {
        const cleanName = nameVal.trim();
        if (cleanName.toLowerCase() !== 'unknown' && cleanName.toLowerCase() !== 'unknown ' && cleanName.length > 0) {
          clientName = cleanName;
        }
      }
      
      let phone = 'N/A';
      if (phoneVal !== undefined && phoneVal !== null && String(phoneVal).trim().length > 0) {
        const rawPhone = String(phoneVal).replace(/\D/g, '');
        if (rawPhone.length >= 10) {
          phone = rawPhone.length === 10 ? `+91${rawPhone}` : `+${rawPhone}`;
        }
      }

      // If we have a real customer, register/update them
      if (clientName !== 'Walk-in Customer' && phone !== 'N/A') {
        const key = `${clientName.toUpperCase()}-${phone}`;
        if (!customersMap[key]) {
          customersMap[key] = {
            id: `CL-${Math.random().toString(36).substring(2, 9).toUpperCase()}`,
            name: clientName,
            phone: phone,
            visits: 0,
            points: 0,
            totalSpent: 0,
            lastVisit: txDate
          };
        }
        
        const customer = customersMap[key];
        customer.visits += 1;
        customer.totalSpent += amt;
        customer.points += Math.round(amt * 0.1);
        if (txDate > customer.lastVisit) {
          customer.lastVisit = txDate;
        }
      }

      // 6. Map payment method
      let paymentMethod: 'Cash' | 'Card' | 'UPI' = 'Cash';
      if (paymentModeVal) {
        const modeStr = String(paymentModeVal).toUpperCase();
        if (modeStr.includes('ONLINE') || modeStr.includes('UPI')) {
          paymentMethod = 'UPI';
        } else if (modeStr.includes('CARD')) {
          paymentMethod = 'Card';
        }
      }

      // 7. Map attendant / staff
      let staffId = 'ST-TRENDZ';
      let staffName = 'Trendz';
      if (attendantVal) {
        const cleanAttVal = String(attendantVal).trim().toUpperCase();
        const foundStaff = staffMap[cleanAttVal];
        if (foundStaff) {
          staffId = foundStaff.id;
          staffName = foundStaff.name;
        }
      }

      // 8. Map transaction details
      const txId = `TX-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;
      const servicesText = serviceVal ? String(serviceVal).trim() : 'Salon Service';
      
      const incentiveAmt = Math.round(amt * 0.05);

      const staffIds = [staffId];
      let staffNames = staffName;
      const staffIncentives: Record<string, number> = { [staffId]: incentiveAmt };
      const staffRevenueShare: Record<string, number> = { [staffId]: amt };

      // Parse helper notes (e.g. "150+ WASIF") from column 8 (Notes)
      const notesVal = row[8];
      if (notesVal && typeof notesVal === 'string') {
        const helperMatch = notesVal.match(/(\d+)\s*\+\s*([a-zA-Z\s]+)/);
        if (helperMatch) {
          const extraAmt = Number(helperMatch[1]);
          const helperName = helperMatch[2].trim().toUpperCase();
          const foundHelper = staffMap[helperName];
          if (foundHelper) {
            if (foundHelper.id === staffId) {
              // Same staff: add extra amount directly to their incentive and revenue share
              staffIncentives[staffId] += extraAmt;
              staffRevenueShare[staffId] += extraAmt;
            } else {
              // Different staff helper: append to staffIds/names and set their share
              staffIds.push(foundHelper.id);
              staffNames = `${staffName}, ${foundHelper.name}`;
              staffIncentives[foundHelper.id] = extraAmt;
              staffRevenueShare[foundHelper.id] = extraAmt;
            }
          }
        }
      }

      const tx = {
        id: txId,
        date: txDate,
        timestamp: `${txDate}T12:00:00.000Z`,
        clientName: clientName,
        phone: phone,
        services: servicesText,
        total: amt,
        paymentMethod: paymentMethod,
        staffIds: staffIds,
        staffNames: staffNames,
        incentivePerStaff: incentiveAmt,
        staffIncentives: staffIncentives,
        staffRevenueShare: staffRevenueShare
      };

      transactions.push(tx);
      sheetTxCount++;
      sheetRevenueSum += amt;
    });

    console.log(`- Loaded Sheet ${sheetName}: parsed ${sheetTxCount} transactions, total revenue: ₹${sheetRevenueSum}`);
  });

  const customers = Object.values(customersMap);

  console.log(`\nTotals Extracted:`);
  console.log(`- Total Transactions: ${transactions.length}`);
  console.log(`- Total Unique Staff: ${initialStaff.length}`);
  console.log(`- Total Registered Clients: ${customers.length}`);

  // Save to src/data/mockData.ts
  const mockDataContent = `import { 
  Scissors, 
  Sparkles, 
  Droplets, 
  Wind,
} from 'lucide-react';

export const services = [
  { id: '1', name: 'Haircut & Styling', price: 500, category: 'Hair', icon: Scissors },
  { id: '2', name: 'Beard Trim', price: 200, category: 'Hair', icon: Scissors },
  { id: '3', name: 'Hair Coloring', price: 1500, category: 'Color', icon: Droplets },
  { id: '4', name: 'Facial Treatment', price: 1200, category: 'Skin', icon: Sparkles },
  { id: '5', name: 'Manicure', price: 400, category: 'Nails', icon: Wind },
  { id: '6', name: 'Pedicure', price: 600, category: 'Nails', icon: Wind },
  { 
    id: 'pkg-1', 
    name: 'Super Combo Package', 
    price: 1800, 
    category: 'Packages', 
    icon: Sparkles,
    isPackage: true,
    packageServices: [
      { name: 'Haircut', price: 1000 },
      { name: 'Nails (Pedicure)', price: 600 },
      { name: 'Manicure', price: 400 },
      { name: 'Facial', price: 1200 }
    ]
  }
];

export const staffMembers: any[] = ${JSON.stringify(initialStaff, null, 2)};

export const customers: any[] = ${JSON.stringify(customers, null, 2)};

export const transactions: any[] = ${JSON.stringify(transactions, null, 2)};
`;

  console.log(`\nWriting to src/data/mockData.ts...`);
  fs.writeFileSync(path.join('src', 'data', 'mockData.ts'), mockDataContent, 'utf-8');
  console.log('✅ Done writing mockData.ts');

  // Supabase remote seeding
  if (supabaseUrl && supabaseAnonKey && supabaseUrl !== 'https://placeholder.supabase.co') {
    console.log(`\n⚠️ Syncing with remote Supabase database: ${supabaseUrl}...`);
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: false }
    });
    
    try {
      console.log('⏳ Wiping remote appointments...');
      await supabase.from('appointments').delete().neq('id', '');
      
      console.log('⏳ Wiping remote transactions...');
      await supabase.from('transactions').delete().neq('id', '');
      
      console.log('⏳ Wiping remote clients...');
      await supabase.from('clients').delete().neq('id', '');
      
      console.log('⏳ Wiping remote staff...');
      await supabase.from('staff').delete().neq('id', '');
      
      // Map structures to fit Supabase Postgres schemas
      const dbStaff = initialStaff.map(s => ({
        id: s.id,
        name: s.name,
        role: s.role
      }));
      
      const dbClients = customers.map(c => ({
        id: c.id,
        name: c.name,
        phone: c.phone
      }));

      const dbTransactions = transactions.map(tx => ({
        id: tx.id,
        client_name: tx.clientName,
        phone: tx.phone,
        services: tx.services,
        total: tx.total,
        payment_method: tx.paymentMethod,
        created_at: tx.timestamp
      }));

      console.log('⏳ Uploading staff members...');
      const { error: staffErr } = await supabase.from('staff').insert(dbStaff);
      if (staffErr) throw new Error(`Staff Insert Error: ${staffErr.message}`);
      
      console.log('⏳ Uploading clients...');
      for (let i = 0; i < dbClients.length; i += 100) {
        const batch = dbClients.slice(i, i + 100);
        const { error: clientErr } = await supabase.from('clients').insert(batch);
        if (clientErr) throw new Error(`Clients Insert Error: ${clientErr.message}`);
      }
      
      console.log('⏳ Uploading transactions...');
      for (let i = 0; i < dbTransactions.length; i += 100) {
        const batch = dbTransactions.slice(i, i + 100);
        const { error: txErr } = await supabase.from('transactions').insert(batch);
        if (txErr) throw new Error(`Transactions Insert Error: ${txErr.message}`);
      }
      
      console.log('✅ Successfully completed remote Supabase seeding!');
    } catch (dbErr: any) {
      console.error('❌ Supabase Upload Failed:', dbErr.message);
    }
  } else {
    console.log('\nℹ️ Supabase credentials not set or placeholder. Skipping remote upload.');
  }
}

runImport();
