import { transactions } from '../src/data/mockData';

const monthlySums: Record<string, { count: number; total: number }> = {};

transactions.forEach((tx) => {
  const month = tx.date.substring(0, 7); // YYYY-MM
  if (!monthlySums[month]) {
    monthlySums[month] = { count: 0, total: 0 };
  }
  monthlySums[month].count += 1;
  monthlySums[month].total += tx.total;
});

console.log('Monthly summary of transactions in mockData.ts:');
Object.keys(monthlySums).sort().forEach((month) => {
  const stats = monthlySums[month];
  console.log(`- ${month}: count = ${stats.count}, total revenue = ₹${stats.total}`);
});
