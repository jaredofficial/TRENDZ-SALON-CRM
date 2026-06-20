import * as XLSX from 'xlsx';

try {
  const myXLSX: any = (XLSX as any).default || XLSX;
  const workbook = myXLSX.readFile('Salon_Service_Price_List_FINAL.xlsx');
  const worksheet = workbook.Sheets['Service Price List'];
  const data: any[][] = myXLSX.utils.sheet_to_json(worksheet, { header: 1 });
  
  console.log(`All services in Service Price List:`);
  data.slice(1).forEach((row, idx) => {
    if (!row || row.length === 0) return;
    console.log(`${idx + 1}: Category = "${row[0]}", Service = "${row[1]}", Price = ${row[2]}, Notes = "${row[3] || ''}"`);
  });
} catch (error: any) {
  console.error('Error:', error.message);
}
