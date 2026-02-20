import type { StatementData } from '@sixt/shared';

function formatEur(amount: number): string {
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR',
  }).format(amount);
}

function formatPeriod(period: string): string {
  const year = period.substring(0, 4);
  const month = parseInt(period.substring(4, 6), 10);
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];
  return `${months[month - 1]} ${year}`;
}

export function generateStatementHtml(data: StatementData): string {
  const address = data.masterData
    ? `${data.masterData.nam1 || ''}<br/>
       ${data.masterData.nam2 || ''}<br/>
       ${data.masterData.str || ''}<br/>
       ${data.masterData.plz || ''} ${data.masterData.ort || ''}<br/>
       ${data.masterData.lanb || ''}`
    : `FIR ${data.country.fir} - ${data.country.name}`;

  const clearingRows = data.clearing
    .map(
      (line) => `
      <tr>
        <td>${line.type}</td>
        <td>${line.reference}</td>
        <td>${line.documentType || ''}</td>
        <td>${line.description}</td>
        <td class="amount">${formatEur(line.amount)}</td>
      </tr>`
    )
    .join('');

  const billingRows = data.billing
    .map(
      (line) => `
      <tr>
        <td>${line.type}</td>
        <td>${line.reference}</td>
        <td>${line.date || ''}</td>
        <td>${line.description}</td>
        <td class="amount">${formatEur(line.amount)}</td>
      </tr>`
    )
    .join('');

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 10px; color: #333; padding: 30px; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; border-bottom: 3px solid #FF5F00; padding-bottom: 15px; }
    .logo { font-size: 28px; font-weight: 900; color: #FF5F00; letter-spacing: 2px; }
    .address { text-align: right; font-size: 9px; line-height: 1.5; }
    .title { background: #FF5F00; color: white; padding: 8px 15px; font-size: 14px; font-weight: 700; margin: 15px 0 5px; }
    .meta { display: flex; gap: 30px; margin: 10px 0 15px; font-size: 9px; }
    .meta span { font-weight: 600; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 10px; font-size: 9px; }
    th { background: #333; color: white; padding: 5px 8px; text-align: left; font-weight: 600; }
    td { padding: 4px 8px; border-bottom: 1px solid #eee; }
    tr:nth-child(even) { background: #f9f9f9; }
    .amount { text-align: right; font-variant-numeric: tabular-nums; }
    .subtotal { background: #f0f0f0; font-weight: 700; }
    .total-row { background: #FF5F00; color: white; font-weight: 700; font-size: 11px; }
    .section { margin: 15px 0; }
    .account-table td:first-child { width: 70%; }
    .footer { margin-top: 30px; padding-top: 10px; border-top: 1px solid #ddd; font-size: 8px; color: #999; text-align: center; }
  </style>
</head>
<body>
  <div class="header">
    <div class="logo">SIXT</div>
    <div class="address">${address}</div>
  </div>

  <div class="title">MONTHLY INTERFACING STATEMENT</div>
  <div class="meta">
    <div>Accounting Period: <span>${formatPeriod(data.accountingPeriod)}</span></div>
    <div>Release Date: <span>${data.releaseDate}</span></div>
    <div>Payment Term: <span>${data.paymentTermDays} days</span></div>
    <div>FIR: <span>${data.country.fir}</span></div>
    <div>Country: <span>${data.country.name} (${data.country.iso})</span></div>
  </div>

  <div class="section">
    <div class="title" style="font-size:11px;">CLEARING STATEMENT</div>
    <table>
      <thead><tr><th>Type</th><th>Reference</th><th>Document Type</th><th>Description</th><th class="amount">EUR Amount</th></tr></thead>
      <tbody>
        ${clearingRows || '<tr><td colspan="5" style="text-align:center;color:#999;">No clearing items</td></tr>'}
        <tr class="subtotal"><td colspan="4">SUBTOTAL</td><td class="amount">${formatEur(data.clearingSubtotal)}</td></tr>
      </tbody>
    </table>
  </div>

  <div class="section">
    <div class="title" style="font-size:11px;">BILLING STATEMENT</div>
    <table>
      <thead><tr><th>Type</th><th>Reference</th><th>Date</th><th>Description</th><th class="amount">EUR Amount</th></tr></thead>
      <tbody>
        ${billingRows || '<tr><td colspan="5" style="text-align:center;color:#999;">No billing items</td></tr>'}
        <tr class="subtotal"><td colspan="4">SUBTOTAL</td><td class="amount">${formatEur(data.billingSubtotal)}</td></tr>
      </tbody>
    </table>
  </div>

  <div class="section">
    <table>
      <tbody>
        <tr class="total-row"><td colspan="4">TOTAL INTERFACING DUE AMOUNT</td><td class="amount">${formatEur(data.totalInterfacingDue)}</td></tr>
      </tbody>
    </table>
  </div>

  <div class="section">
    <div class="title" style="font-size:11px;">ACCOUNT STATEMENT</div>
    <table class="account-table">
      <tbody>
        <tr><td>Account Balance Previous Month - Overdue</td><td class="amount">${formatEur(data.accountStatement.overdueBalance)}</td></tr>
        <tr><td>Account Balance Previous Month - due until ${data.accountStatement.dueUntilDate}</td><td class="amount">${formatEur(data.accountStatement.dueBalance)}</td></tr>
        <tr><td>Payment by Sixt</td><td class="amount">${formatEur(data.accountStatement.paymentBySixt)}</td></tr>
        <tr><td>Payment by you</td><td class="amount">${formatEur(data.accountStatement.paymentByPartner)}</td></tr>
        <tr><td>Total Interfacing Amount</td><td class="amount">${formatEur(data.accountStatement.totalInterfacingAmount)}</td></tr>
        <tr class="subtotal"><td>Balance (Open Items)</td><td class="amount">${formatEur(data.accountStatement.balanceOpenItems)}</td></tr>
      </tbody>
    </table>
  </div>

  <div class="footer">
    Sixt GmbH & Co. Autovermietung KG &bull; International Franchise Controlling &bull; Generated ${new Date().toISOString().split('T')[0]}
  </div>
</body>
</html>`;
}

export async function generatePdf(html: string): Promise<Buffer> {
  const puppeteer = require('puppeteer');
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '15mm', bottom: '15mm', left: '10mm', right: '10mm' },
    });
    return Buffer.from(pdf);
  } finally {
    await browser.close();
  }
}
