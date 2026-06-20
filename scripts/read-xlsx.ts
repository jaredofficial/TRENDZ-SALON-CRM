import * as XLSX from 'xlsx';

const myXLSX: any = (XLSX as any).default || XLSX;
const workbook = myXLSX.readFile('Salon_Service_Price_List_FINAL.xlsx');
console.log('Sheets:', workbook.SheetNames);


const sheetName = 'Service Price List';
const sheet = workbook.Sheets[sheetName];
const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });
console.log(`\nSheet: ${sheetName}, total rows: ${data.length}`);
data.forEach((row: any, idx: number) => {
  console.log(`Row ${idx}:`, row);
});

