import ExcelJS from 'exceljs';
import type { StatementData } from '@sixt/shared';

const ORANGE = 'FF5F00';
const DARK_GRAY = '4A4A4A';
const MID_GRAY = '5A5A5A';
const TOTAL_GRAY = '333333';
const ACCOUNT_ORANGE = 'FF5F00';
const DEPOSIT_GRAY = '7A7A7A';
const HEADER_BG = '333333';
const SUBTOTAL_BG = 'F0F0F0';

function eurFormat(v: number): number {
  return Math.round(v * 100) / 100;
}

function formatDateDE(dateStr: string): string {
  if (!dateStr) return '-';
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  return `${parts[2]}.${parts[1]}.${parts[0]}`;
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

function whiteFont(): Partial<ExcelJS.Font> {
  return { color: { argb: 'FFFFFFFF' }, bold: true };
}

function sectionHeader(ws: ExcelJS.Worksheet, text: string, bgColor: string, colCount: number) {
  const row = ws.addRow([text]);
  ws.mergeCells(row.number, 1, row.number, colCount);
  const cell = row.getCell(1);
  cell.font = { ...whiteFont(), size: 11 };
  cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgColor } };
  cell.alignment = { vertical: 'middle' };
  row.height = 22;
}

function tableHeader(ws: ExcelJS.Worksheet, headers: string[]) {
  const row = ws.addRow(headers);
  row.eachCell((cell) => {
    cell.font = { ...whiteFont(), size: 9 };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: HEADER_BG } };
    cell.alignment = { vertical: 'middle' };
  });
  row.height = 18;
}

function amountCell(cell: ExcelJS.Cell) {
  cell.numFmt = '#,##0.00 €';
  cell.alignment = { horizontal: 'right' };
}

function subtotalRow(ws: ExcelJS.Worksheet, label: string, value: number, colCount: number) {
  const cols: any[] = new Array(colCount).fill('');
  cols[0] = label;
  cols[colCount - 1] = eurFormat(value);
  const row = ws.addRow(cols);
  row.eachCell((cell) => {
    cell.font = { bold: true, size: 9 };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: SUBTOTAL_BG } };
  });
  amountCell(row.getCell(colCount));
  row.height = 18;
}

export async function generateStatementXlsx(data: StatementData): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet(`Statement ${formatPeriod(data.accountingPeriod)}`);

  ws.columns = [
    { width: 14 },
    { width: 30 },
    { width: 24 },
    { width: 14 },
    { width: 18 },
  ];

  // --- Title ---
  const titleRow = ws.addRow([`MONTHLY INTERFACING STATEMENT – ${formatPeriod(data.accountingPeriod)}`, '', '', '', data.country.name]);
  ws.mergeCells(titleRow.number, 1, titleRow.number, 4);
  const titleCell = titleRow.getCell(1);
  titleCell.font = { ...whiteFont(), size: 14 };
  titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: ORANGE } };
  titleCell.alignment = { vertical: 'middle' };
  const titleCountryCell = titleRow.getCell(5);
  titleCountryCell.font = { ...whiteFont(), size: 14 };
  titleCountryCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: ORANGE } };
  titleCountryCell.alignment = { vertical: 'middle', horizontal: 'right' };
  titleRow.height = 28;

  // --- Meta ---
  const metaRow = ws.addRow([
    `Accounting Period: ${formatPeriod(data.accountingPeriod)}`,
    `Release Date: ${data.releaseDate}`,
    `Payment Term: ${data.paymentTermDays} days`,
    `FIR: ${data.country.fir}`,
    `Country: ${data.country.name} (${data.country.iso})`,
  ]);
  metaRow.eachCell((cell) => { cell.font = { size: 9 }; });
  ws.addRow([]);

  // --- CLEARING STATEMENT ---
  sectionHeader(ws, 'CLEARING STATEMENT', DARK_GRAY, 4);
  tableHeader(ws, ['Type', 'Description', 'Reference', 'EUR Amount']);
  for (const line of data.clearing) {
    const row = ws.addRow([line.type, line.description, line.reference, eurFormat(line.amount)]);
    row.eachCell((c) => { c.font = { size: 9 }; });
    amountCell(row.getCell(4));
  }
  if (data.clearing.length === 0) {
    const row = ws.addRow(['No clearing items']);
    ws.mergeCells(row.number, 1, row.number, 4);
    row.getCell(1).font = { size: 9, color: { argb: '999999' } };
    row.getCell(1).alignment = { horizontal: 'center' };
  }
  subtotalRow(ws, 'SUBTOTAL', data.clearingSubtotal, 4);
  ws.addRow([]);

  // --- BILLING STATEMENT ---
  sectionHeader(ws, 'BILLING STATEMENT', MID_GRAY, 5);
  tableHeader(ws, ['Type', 'Description', 'Reference', 'Date', 'EUR Amount']);
  for (const line of data.billing) {
    const row = ws.addRow([line.type, line.description, line.reference, line.date || '', eurFormat(line.amount)]);
    row.eachCell((c) => { c.font = { size: 9 }; });
    amountCell(row.getCell(5));
  }
  if (data.billing.length === 0) {
    const row = ws.addRow(['No billing items']);
    ws.mergeCells(row.number, 1, row.number, 5);
    row.getCell(1).font = { size: 9, color: { argb: '999999' } };
    row.getCell(1).alignment = { horizontal: 'center' };
  }
  subtotalRow(ws, 'SUBTOTAL', data.billingSubtotal, 5);
  ws.addRow([]);

  // --- TOTAL INTERFACING DUE AMOUNT ---
  const totalCols: any[] = ['TOTAL INTERFACING DUE AMOUNT', '', '', '', eurFormat(data.totalInterfacingDue)];
  const totalRow = ws.addRow(totalCols);
  ws.mergeCells(totalRow.number, 1, totalRow.number, 4);
  totalRow.eachCell((cell) => {
    cell.font = { ...whiteFont(), size: 11 };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: TOTAL_GRAY } };
  });
  amountCell(totalRow.getCell(5));
  totalRow.getCell(5).font = { ...whiteFont(), size: 11 };
  totalRow.height = 22;
  ws.addRow([]);

  // --- ACCOUNT STATEMENT ---
  sectionHeader(ws, 'ACCOUNT STATEMENT', ACCOUNT_ORANGE, 5);

  const acct = data.accountStatement;
  const addAccountRow = (label: string, value: number) => {
    const row = ws.addRow([label, '', '', '', eurFormat(value)]);
    ws.mergeCells(row.number, 1, row.number, 4);
    row.eachCell((c) => { c.font = { size: 9 }; });
    amountCell(row.getCell(5));
  };

  addAccountRow('Account Balance Previous Month - Overdue (excl. Interest Amount)', acct.overdueBalance);
  addAccountRow(`Account Balance Previous Month - due until ${formatDateDE(acct.dueUntilDate)}`, acct.dueBalance);

  if ((acct.paymentBySixtItems || []).length > 0) {
    for (const item of acct.paymentBySixtItems) {
      addAccountRow(`Payment by Sixt – ${item.date}`, item.amount);
    }
  } else {
    addAccountRow('Payment by Sixt', 0);
  }

  if ((acct.paymentByPartnerItems || []).length > 0) {
    for (const item of acct.paymentByPartnerItems) {
      addAccountRow(`Payment by you – ${item.date}`, item.amount);
    }
  } else {
    addAccountRow('Payment by you', 0);
  }

  addAccountRow(`Total Interfacing Amount – due ${formatDateDE(acct.totalInterfacingDueDate)}`, acct.totalInterfacingAmount);
  const balanceSuffix = (data as any).balanceLabel
    || (acct.balanceOpenItems < 0 ? 'Payment is kindly requested' : 'Payment will be initiated by Sixt');
  subtotalRow(ws, `Balance (Open Items) – ${balanceSuffix}`, acct.balanceOpenItems, 5);
  ws.addRow([]);

  // --- DEPOSIT ---
  sectionHeader(ws, 'DEPOSIT', DEPOSIT_GRAY, 5);
  const addDepositRow = (label: string, value: string) => {
    const row = ws.addRow([label, '', '', '', value]);
    ws.mergeCells(row.number, 1, row.number, 4);
    row.eachCell((c) => { c.font = { size: 9 }; });
    row.getCell(5).alignment = { horizontal: 'right' };
  };
  addDepositRow('Deposit held', 'XXX EUR');
  addDepositRow('Deposit due', 'XXX EUR');

  const buffer = await wb.xlsx.writeBuffer();
  return Buffer.from(buffer);
}
