import * as XLSX from 'xlsx';
import * as fs from 'fs';
import * as path from 'path';

const myXLSX: any = (XLSX as any).default || XLSX;
const workbook = myXLSX.readFile('Salon_Service_Price_List_FINAL.xlsx');
const sheet = workbook.Sheets['Service Price List'];
const data: any[][] = myXLSX.utils.sheet_to_json(sheet, { header: 1 });

interface ServiceItem {
  id: string;
  name: string;
  price: number;
  category: string;
  icon: string;
  notes?: string;
}

const rawServices: { category: string; name: string; price: number; notes?: string }[] = [];

// Start reading from row 1 (row 0 is header: Category, Service, Price (Rs.), Notes)
data.slice(1).forEach((row, idx) => {
  if (!row || row.length < 3) return;
  const category = String(row[0]).trim();
  const name = String(row[1]).trim();
  const priceVal = row[2];
  const notes = row[3] ? String(row[3]).trim() : undefined;

  if (!category || !name || priceVal === undefined || priceVal === null) return;
  const price = Number(priceVal);
  if (isNaN(price)) return;

  rawServices.push({ category, name, price, notes });
});

// Identify duplicate names
const nameCounts: Record<string, number> = {};
rawServices.forEach(s => {
  nameCounts[s.name.toLowerCase()] = (nameCounts[s.name.toLowerCase()] || 0) + 1;
});

// Build processed services list
const processedServices: ServiceItem[] = rawServices.map((s, idx) => {
  let displayName = s.name;
  if (nameCounts[s.name.toLowerCase()] > 1) {
    // Determine suffix based on category
    let suffix = s.category;
    if (s.category === 'Hair – Men') suffix = 'Men';
    else if (s.category === "Women's Hair") suffix = 'Women';
    else if (s.category === 'Massage') suffix = 'Massage';
    else if (s.category.includes('Spa')) suffix = 'Spa';
    
    displayName = `${s.name} (${suffix})`;
  }

  // Determine icon
  let icon = 'Sparkles';
  const catLower = s.category.toLowerCase();
  if (catLower.includes('hair') || catLower.includes('straight') || catLower.includes('smooth') || catLower.includes('treatment')) {
    if (catLower.includes('color')) {
      icon = 'Droplets';
    } else {
      icon = 'Scissors';
    }
  } else if (catLower.includes('color')) {
    icon = 'Droplets';
  } else if (catLower.includes('mani') || catLower.includes('pedi') || catLower.includes('nail')) {
    icon = 'Wind';
  }

  return {
    id: `SRV-${String(idx + 1).padStart(3, '0')}`,
    name: displayName,
    price: s.price,
    category: s.category,
    icon,
    notes: s.notes
  };
});

// Print summary of processed services
console.log(`Parsed ${processedServices.length} services from Excel.`);

// Read the current src/data/mockData.ts file content to extract staff, customers, transactions
const mockDataPath = path.join('src', 'data', 'mockData.ts');
let mockDataContent = fs.readFileSync(mockDataPath, 'utf8');

// We need to replace the services array while leaving the rest of the file intact.
// Let's generate the new services TS definition
let servicesTS = `export const services = [\n`;
processedServices.forEach(s => {
  const notesStr = s.notes ? `, notes: ${JSON.stringify(s.notes)}` : '';
  servicesTS += `  { id: ${JSON.stringify(s.id)}, name: ${JSON.stringify(s.name)}, price: ${s.price}, category: ${JSON.stringify(s.category)}, icon: ${s.icon}${notesStr} },\n`;
});

// Close the array
servicesTS += `\n];`;

// Replace services in mockDataContent
const servicesRegex = /export const services = \[\s*[\s\S]*?\n\];/;
if (servicesRegex.test(mockDataContent)) {
  mockDataContent = mockDataContent.replace(servicesRegex, servicesTS);
  fs.writeFileSync(mockDataPath, mockDataContent, 'utf8');
  console.log('✅ Successfully updated services in src/data/mockData.ts');
} else {
  console.error('❌ Failed to locate export const services in mockData.ts');
}
