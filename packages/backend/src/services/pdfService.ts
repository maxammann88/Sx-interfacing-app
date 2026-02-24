import type { StatementData } from '@sixt/shared';
import fs from 'fs';
import path from 'path';

const logoPath = path.resolve(__dirname, '../../assets/sixt-logo.png');
const logoBase64 = fs.existsSync(logoPath)
  ? 'data:image/png;base64,' + fs.readFileSync(logoPath).toString('base64')
  : null;

function formatEur(amount: number): string {
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR',
  }).format(amount);
}

function formatDateDE(dateStr: string): string {
  if (!dateStr) return '-';
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  return `${parts[2]}.${parts[1]}.${parts[0]}`;
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function formatPeriod(period: string): string {
  const year = period.substring(0, 4);
  const month = parseInt(period.substring(4, 6), 10);
  return `${MONTH_NAMES[month - 1]} ${year}`;
}

function formatPeriodRange(period: string): string {
  const y = parseInt(period.substring(0, 4), 10);
  const m = parseInt(period.substring(4, 6), 10);
  const first = new Date(Date.UTC(y, m - 1, 1));
  const last = new Date(Date.UTC(y, m, 0));
  const fmt = (d: Date) => {
    const dd = String(d.getUTCDate()).padStart(2, '0');
    const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
    const yy = String(d.getUTCFullYear()).slice(-2);
    return `${dd}.${mm}.${yy}`;
  };
  return `${fmt(first)}-${fmt(last)}`;
}

function periodMonthName(period: string): string {
  return MONTH_NAMES[parseInt(period.substring(4, 6), 10) - 1] || '';
}

const SIXT_LOGO_BASE64 = 'data:image/png;base64,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';

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
        <td>${line.description}</td>
        <td class="col-ref">${line.reference}</td>
        <td></td>
        <td class="amount">${formatEur(line.amount)}</td>
      </tr>`
    )
    .join('');

  const breakdownMap = new Map<string, (typeof data.billingBreakdowns extends (infer U)[] | undefined ? U : never)>();
  if (data.billingBreakdowns) {
    for (const bd of data.billingBreakdowns) {
      breakdownMap.set(bd.sapDescription.toLowerCase(), bd);
    }
  }

  const billingRows = data.billing
    .map((line) => {
      const bd = breakdownMap.get(line.description.toLowerCase());
      let mainRow = `
      <tr${bd?.hasDeviation ? ' class="deviation-row"' : ''}>
        <td>${line.type}</td>
        <td>${line.description}</td>
        <td class="col-ref">${line.reference}</td>
        <td>${line.date || ''}</td>
        <td class="amount">${formatEur(line.amount)}${bd?.hasDeviation ? ' <span class="flag">⚠</span>' : ''}</td>
      </tr>`;

      if (bd && bd.lines.length > 0) {
        const subRows = bd.lines.map(sub => `
        <tr class="breakdown-row">
          <td></td>
          <td colspan="3" class="breakdown-desc">${sub.description}</td>
          <td class="amount breakdown-amount">${formatEur(sub.amount)}</td>
        </tr>`).join('');

        mainRow += subRows;
      }
      return mainRow;
    })
    .join('');

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 9px; color: #333; padding: 20px 25px; }
    .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; border-bottom: 3px solid #FF5F00; padding-bottom: 10px; }
    .header-left { display: flex; align-items: center; gap: 15px; }
    .logo img { height: 45px; }
    .country-name { font-size: 18px; font-weight: 700; color: #333; }
    .address { text-align: right; font-size: 8px; line-height: 1.4; }
    .title { background: #FF5F00; color: white; padding: 5px 12px; font-size: 12px; font-weight: 700; margin: 8px 0 3px; }
    .title-clearing { background: #4a4a4a; color: white; padding: 4px 12px; font-size: 10px; font-weight: 700; margin: 8px 0 2px; }
    .title-billing { background: #5a5a5a; color: white; padding: 4px 12px; font-size: 10px; font-weight: 700; margin: 8px 0 2px; }
    .title-account { background: #6a6a6a; color: white; padding: 4px 12px; font-size: 10px; font-weight: 700; margin: 8px 0 2px; }
    .title-deposit { background: #7a7a7a; color: white; padding: 4px 12px; font-size: 10px; font-weight: 700; margin: 8px 0 2px; }
    .main-title { display: flex; align-items: center; justify-content: space-between; }
    .main-title .period { font-size: 12px; font-weight: 700; }
    .meta { display: flex; gap: 25px; margin: 6px 0 10px; font-size: 8px; }
    .meta span { font-weight: 600; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 6px; font-size: 8px; }
    th { background: #333; color: white; padding: 3px 6px; text-align: left; font-weight: 600; }
    td { padding: 2px 6px; border-bottom: 1px solid #eee; }
    .col-type { width: 10%; }
    .col-desc { width: 42%; }
    .col-ref { width: 18%; text-align: center; }
    .col-date { width: 12%; }
    .col-amount { width: 18%; }
    th.col-ref, td.col-ref { text-align: center; }
    tr:nth-child(even) { background: #f9f9f9; }
    .amount { text-align: right; font-variant-numeric: tabular-nums; }
    .subtotal { background: #f0f0f0; font-weight: 700; }
    .balance-row { background: #f0c8a0 !important; font-weight: 700; }
    .balance-row-top td { border-bottom: 2px solid #333; }
    .balance-row-bottom td { border-top: 2px solid #333; }
    .footnote { margin-top: 10px; font-size: 7px; color: #777; font-style: italic; }
    .total-row { background: #333; color: white; font-weight: 700; font-size: 10px; }
    .section { margin: 8px 0; }
    .account-table td:first-child { width: 70%; }
    .breakdown-row td { border-bottom: 1px solid #f0f0f0; padding: 1px 6px; }
    .breakdown-desc { padding-left: 18px !important; font-size: 7px; color: #555; }
    .breakdown-amount { font-size: 7px; color: #555; }
    .deviation-row { background: #fff3e0 !important; }
    .flag { color: #c00; font-weight: 700; }
    .footer { margin-top: 15px; padding-top: 6px; border-top: 1px solid #ddd; font-size: 7px; color: #999; text-align: center; }
  </style>
</head>
<body>
  <div class="header">
    <div class="header-left">
      <div class="logo"><img src="${logoBase64 || SIXT_LOGO_BASE64}" alt="SIXT"/></div>
      <div class="country-name">${data.country.name} (${data.country.iso})</div>
    </div>
    <div class="address">${address}</div>
  </div>

  <div class="title main-title">
    <span>MONTHLY INTERFACING STATEMENT – ${formatPeriod(data.accountingPeriod)}</span>
    <span>${data.country.name}</span>
  </div>
  <div class="meta">
    <div>Accounting Period: <span>${formatPeriodRange(data.accountingPeriod)}</span></div>
    <div>Payment Term: <span>${data.paymentTermDays} days</span></div>
    <div>FIR: <span>${data.country.fir}</span></div>
    <div style="margin-left:auto;background:#FF5F00;color:white;padding:2px 10px;font-weight:700;border-radius:2px;">Release Date: ${formatDateDE(data.releaseDate)}</div>
  </div>

  <div class="section">
    <div class="title-clearing">CLEARING STATEMENT</div>
    <table>
      <thead><tr><th class="col-type">Type</th><th class="col-desc">Description</th><th class="col-ref">Reference</th><th class="col-date"></th><th class="amount col-amount">EUR Amount</th></tr></thead>
      <tbody>
        ${clearingRows || '<tr><td colspan="5" style="text-align:center;color:#999;">No clearing items</td></tr>'}
        <tr class="subtotal"><td colspan="4">SUBTOTAL</td><td class="amount">${formatEur(data.clearingSubtotal)}</td></tr>
      </tbody>
    </table>
  </div>

  <div class="section">
    <div class="title-billing">BILLING STATEMENT</div>
    <table>
      <thead><tr><th class="col-type">Type</th><th class="col-desc">Description</th><th class="col-ref">Reference</th><th class="col-date">Date</th><th class="amount col-amount">EUR Amount</th></tr></thead>
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
    <div class="title" style="font-size:10px;">ACCOUNT STATEMENT</div>
    <table class="account-table">
      <tbody>
        <tr class="balance-row balance-row-top"><td>Balance as of ${formatDateDE(data.accountStatement.lastSubmissionDate)}</td><td class="amount">${formatEur(data.accountStatement.previousPeriodBalance)}</td></tr>
        <tr><td style="padding-left:30px">Overdue</td><td class="amount">${formatEur(data.accountStatement.overdueBalance)}</td></tr>
        <tr><td style="padding-left:30px">Due until ${formatDateDE(data.accountStatement.dueUntilDate)}</td><td class="amount">${formatEur(data.accountStatement.dueBalance)}</td></tr>
        ${(data.accountStatement.paymentBySixtItems || []).length > 0
          ? data.accountStatement.paymentBySixtItems.map(item =>
              `<tr><td>Payment by Sixt – ${formatDateDE(item.date)}</td><td class="amount">${formatEur(item.amount)}</td></tr>`
            ).join('')
          : ''
        }
        ${(data.accountStatement.paymentByPartnerItems || []).length > 0
          ? data.accountStatement.paymentByPartnerItems.map(item =>
              `<tr><td>Payment by you – ${formatDateDE(item.date)}</td><td class="amount">${formatEur(item.amount)}</td></tr>`
            ).join('')
          : ''
        }
        <tr><td>Interfacing ${periodMonthName(data.accountingPeriod)} due until ${formatDateDE(data.accountStatement.totalInterfacingDueDate)}</td><td class="amount">${formatEur(data.accountStatement.totalInterfacingAmount)}</td></tr>
        <tr class="balance-row balance-row-bottom"><td>Balance as of ${formatDateDE(data.accountStatement.periodEndDate)} – ${(data as any).balanceLabel || (data.accountStatement.balanceOpenItems < 0 ? 'Payment is kindly requested' : 'Payment will be initiated by Sixt')}</td><td class="amount">${formatEur(data.accountStatement.balanceOpenItems)}</td></tr>
        <tr><td colspan="2" style="font-size:7px;color:#777;font-style:italic;padding-top:4px;border-bottom:none;">Payments that are received while processing the Interfacing (usually between 1st–15th per month) will be credited and listed in the following Interfacing.</td></tr>
      </tbody>
    </table>
  </div>

  <div class="section">
    <div class="title-deposit">DEPOSIT</div>
    <table class="account-table">
      <tbody>
        <tr><td>Deposit held</td><td class="amount">${formatEur(data.depositHeld)}</td></tr>
        <tr><td>Deposit due</td><td class="amount">XXX EUR</td></tr>
      </tbody>
    </table>
  </div>

  <div class="footer">
    Sixt GmbH &bull; International Franchise Controlling &bull; Generated ${new Date().toISOString().split('T')[0]}
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
    await page.setContent(html, { waitUntil: 'domcontentloaded', timeout: 10000 });
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
