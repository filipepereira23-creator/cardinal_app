import ExcelJS from 'exceljs';
const wb = new ExcelJS.Workbook();
const RED='FFDB0011';
function sheet(name, cols, rows, widths){
  const ws = wb.addWorksheet(name,{views:[{showGridLines:false}]});
  ws.columns = cols.map((c,i)=>({header:c,key:c,width:widths[i]}));
  const h=ws.getRow(1); h.font={bold:true,color:{argb:'FFFFFFFF'}}; h.fill={type:'pattern',pattern:'solid',fgColor:{argb:RED}}; h.height=22;
  rows.forEach(r=>ws.addRow(r));
  ws.eachRow((r,i)=>{ if(i>1) r.alignment={vertical:'top',wrapText:true}; });
  return ws;
}
// Assumptions
const a = sheet('Assumptions',['Item','Value','Note'],[
 ['Demo users',10,'As asked'],
 ['Demo length (months)',3,'Change this to see the total move'],
 ['GBP per USD',0.79,'Rough rate, prices are quoted in USD or GBP by each provider'],
 ['Contingency',0.15,'Added on top for things nobody has priced yet'],
],[28,14,60]);
// Running
const r = sheet('Monthly Running Costs',['Item','What it does','Cost per month (GBP)','Needed for the demo?'],[
 ['Database and sign-in (Supabase Pro)','Stores accounts and holdings, real sign-in, password reset, backups',20,'Yes (free tier works for 10 people but pauses after a week idle)'],
 ['Hosting (GitHub Pages)','Serves the app',0,'Already live, free'],
 ['Transactional email (Resend)','Confirmation and report emails',0,'Free up to 3,000 emails a month'],
 ['Business email (Zoho Mail free)','hello@ address on your own domain',0,'Optional, free for 1 user'],
 ['Error monitoring (Sentry)','Tells us when something breaks',0,'Free tier'],
 ['Open banking (Enable Banking)','Connect real bank accounts',0,'Restricted production is free for your own accounts. Connecting other people needs a commercial agreement, price on request'],
 ['Live prices (public APIs)','FX, gold, crypto, house price index',0,'Free public sources already in use'],
],[38,48,22,60]);
r.getColumn(3).numFmt='£#,##0.00';
// One off
const o = sheet('One Off Costs',['Item','What it covers','Low (GBP)','High (GBP)'],[
 ['Domain name (.com)','About $11 a year',9,12],
 ['Privacy Policy and Terms review by a solicitor','Needed before real users give financial data. Quote range for a short startup review',800,2500],
 ['Server build and testing','Sign-in, syncing across devices, encrypted data, friends and groups on a real server. Done by Hark, so no cash cost. Shown as a cost only if a freelancer did it instead',0,6000],
 ['Apple Developer account (optional)','Only if the demo needs a real iPhone app on TestFlight. The installable web app needs nothing',0,80],
 ['Penetration test (optional)','Independent security test, normally for launch rather than a 10 person demo',0,3000],
],[44,70,16,16]);
o.getColumn(3).numFmt='£#,##0'; o.getColumn(4).numFmt='£#,##0';
// Total
const t = wb.addWorksheet('Demo Total',{views:[{showGridLines:false}]});
t.columns=[{width:46},{width:18},{width:18}];
const hr=t.addRow(['Cost for a 10 person demo (3 months)','Low (GBP)','High (GBP)']);
hr.font={bold:true,color:{argb:'FFFFFFFF'}}; hr.fill={type:'pattern',pattern:'solid',fgColor:{argb:RED}};
t.addRow(['Running costs for the demo length',{formula:"SUM('Monthly Running Costs'!C2:C8)*Assumptions!B3",result:60},{formula:"SUM('Monthly Running Costs'!C2:C8)*Assumptions!B3",result:60}]);
t.addRow(['One off costs',{formula:"SUM('One Off Costs'!C2:C6)",result:809},{formula:"SUM('One Off Costs'!D2:D6)",result:11592}]);
t.addRow(['Contingency',{formula:'(B2+B3)*Assumptions!B5',result:130.35},{formula:'(C2+C3)*Assumptions!B5',result:1747.8}]);
const tot=t.addRow(['Total',{formula:'SUM(B2:B4)',result:999.35},{formula:'SUM(C2:C4)',result:13399.8}]); tot.font={bold:true};
[2,3,4,5].forEach(i=>{t.getRow(i).getCell(2).numFmt='£#,##0';t.getRow(i).getCell(3).numFmt='£#,##0';});
t.addRow([]);
t.addRow(['Cheapest realistic demo: about £60 running for 3 months, plus a domain and a solicitor review (about £1,000 in total with contingency). Highest: add a paid freelancer, an iPhone app and a security test.']);
t.addRow(['Prices are estimates from public price pages in November 2026 and will move. Enable Banking pricing for connecting other people is not public.']);
t.getRow(7).alignment={wrapText:true}; t.getRow(8).alignment={wrapText:true};
wb.views=[{activeTab:3}];
await wb.xlsx.writeFile('Cardinal_demo_cost_10_users.xlsx');
