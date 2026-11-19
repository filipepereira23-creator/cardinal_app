import { takeHome, yearlySavings } from '../src/domain/ukTax';
// Expected figures worked by hand from HMRC 2026/27 rates (gov.uk "Rates and thresholds for employers 2026 to 2027").
const cases: [string, Parameters<typeof takeHome>[0], { tax: number; ni: number; loan?: number; pension?: number; net: number }][] = [
  ['£30k England', { salary: 30000 }, { tax: 3486, ni: 1394.4, net: 25119.6 }],
  ['£65k England', { salary: 65000 }, { tax: 13432, ni: 3310.6, net: 48257.4 }],
  ['£110k England (PA tapered to £7,570)', { salary: 110000 }, { tax: 33432, ni: 4210.6, net: 72357.4 }],
  ['£150k England (no PA)', { salary: 150000 }, { tax: 53703, ni: 5010.6, net: 91286.4 }],
  // Scotland £50k: taxable 37,430 = 3,967@19% + 12,989@20% + 14,136@21% + 6,338@42%
  ['£50k Scotland', { salary: 50000, region: 'scotland' }, { tax: 753.73 + 2597.8 + 2968.56 + 2661.96, ni: 2994.4, net: 50000 - (753.73 + 2597.8 + 2968.56 + 2661.96) - 2994.4 }],
  // £30k Plan 2: 9% × (30,000 − 29,385) = 55.35
  ['£30k Plan 2', { salary: 30000, loan: 'plan2' }, { tax: 3486, ni: 1394.4, loan: 55.35, net: 25064.25 }],
  // £60k + 5% salary sacrifice: pay 57,000 → tax 7,540 + 6,730×40% = 10,232; NI 3,016 + 6,730×2% = 3,150.6
  ['£60k 5% sacrifice', { salary: 60000, pensionPct: 5, pensionMethod: 'sacrifice' }, { tax: 10232, ni: 3150.6, pension: 3000, net: 43617.4 }],
  // Same with net pay: NI on full £60k = 3,016 + 9,730×2% = 3,210.6
  ['£60k 5% net pay', { salary: 60000, pensionPct: 5, pensionMethod: 'netpay' }, { tax: 10232, ni: 3210.6, pension: 3000, net: 43557.4 }],
  // £100k + £20k bonus, Plan 2 + postgraduate: PA 2,570; taxable 117,430 → tax 7,540 + 79,730×40% = 39,432
  ['£100k + £20k bonus, Plan 2 + PG', { salary: 100000, bonus: 20000, loan: 'plan2', postgrad: true }, { tax: 39432, ni: 4410.6, loan: 8155.35 + 5940, net: 120000 - 39432 - 4410.6 - 14095.35 }],
];
let fail = 0;
const close = (a: number, b: number) => Math.abs(a - b) < 0.02;
for (const [name, p, e] of cases) {
  const r = takeHome(p);
  const ok = close(r.incomeTax, e.tax) && close(r.nationalInsurance, e.ni) && close(r.studentLoan, e.loan ?? 0) && close(r.pension, e.pension ?? 0) && close(r.takeHome, e.net);
  if (!ok) fail++;
  console.log(`${ok ? 'PASS' : 'FAIL'} ${name}: tax ${r.incomeTax} NI ${r.nationalInsurance} loan ${r.studentLoan} pension ${r.pension} take-home ${r.takeHome} (${r.monthly}/month)` + (ok ? '' : `  expected ${JSON.stringify(e)}`));
}
const s = yearlySavings({ salary: 30000, savingsRate: 20 });
console.log(`${close(s, 5023.92) ? 'PASS' : 'FAIL'} savings 20% of £30k take-home = ${s}`);
if (!close(s, 5023.92)) fail++;
if (fail) { console.log(fail + ' failed'); process.exit(1); }
console.log('All passed');
