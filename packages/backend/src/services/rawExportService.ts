import ExcelJS from 'exceljs';
import prisma from '../prismaClient';
import { generateStatement } from './statementService';
import type { StatementData } from '@sixt/shared';

const HEADER_BG = '333333';
const HEADER_FONT = 'FFFFFF';

interface RawRow {
  fir: number;
  country: string;
  iso: string;
  period: string;
  section: string;
  source: string;
  type: string;
  description: string;
  reference: string;
  date: string;
  amount: number;
}

function statementToRows(
  data: StatementData,
  source: string,
): RawRow[] {
  const base = {
    fir: data.country.fir,
    country: data.country.name,
    iso: data.country.iso,
    period: data.accountingPeriod,
    source,
  };

  const rows: RawRow[] = [];

  for (const line of data.clearing) {
    rows.push({
      ...base,
      section: 'Clearing',
      type: line.type,
      description: line.description,
      reference: line.reference,
      date: line.date || '',
      amount: line.amount,
    });
  }

  for (const line of data.billing) {
    rows.push({
      ...base,
      section: 'Billing',
      type: line.type,
      description: line.description,
      reference: line.reference,
      date: line.date || '',
      amount: line.amount,
    });
  }

  const acct = data.accountStatement;

  rows.push({ ...base, section: 'Account Statement', type: 'Subtotal', description: 'Clearing Subtotal', reference: '', date: '', amount: data.clearingSubtotal });
  rows.push({ ...base, section: 'Account Statement', type: 'Subtotal', description: 'Billing Subtotal', reference: '', date: '', amount: data.billingSubtotal });
  rows.push({ ...base, section: 'Account Statement', type: 'Total', description: 'Total Interfacing Due Amount', reference: '', date: '', amount: data.totalInterfacingDue });
  rows.push({ ...base, section: 'Account Statement', type: 'Balance', description: 'Overdue Balance (excl. Interest)', reference: '', date: '', amount: acct.overdueBalance });
  rows.push({ ...base, section: 'Account Statement', type: 'Balance', description: `Due Balance (until ${acct.dueUntilDate})`, reference: '', date: '', amount: acct.dueBalance });
  rows.push({ ...base, section: 'Account Statement', type: 'Payment', description: 'Payment by Sixt', reference: '', date: '', amount: acct.paymentBySixt });
  rows.push({ ...base, section: 'Account Statement', type: 'Payment', description: 'Payment by Partner', reference: '', date: '', amount: acct.paymentByPartner });
  rows.push({ ...base, section: 'Account Statement', type: 'Total', description: 'Total Interfacing Amount', reference: '', date: acct.totalInterfacingDueDate, amount: acct.totalInterfacingAmount });
  rows.push({ ...base, section: 'Account Statement', type: 'Balance', description: 'Balance (Open Items)', reference: '', date: '', amount: acct.balanceOpenItems });

  return rows;
}

export async function generateRawDataXlsx(
  period: string,
  releaseDate: string,
  paymentTermDays: number,
): Promise<Buffer> {
  const countries = await prisma.country.findMany({
    where: { partnerStatus: { contains: 'aktiv', mode: 'insensitive' } },
    orderBy: { fir: 'asc' },
  });

  const corrections = await prisma.correctedStatement.findMany({
    where: { period },
    orderBy: { createdAt: 'asc' },
  });

  const corrMap: Record<number, { id: number; data: any; createdAt: Date }[]> = {};
  for (const c of corrections) {
    if (!corrMap[c.countryId]) corrMap[c.countryId] = [];
    corrMap[c.countryId].push({ id: c.id, data: c.data, createdAt: c.createdAt });
  }

  const allRows: RawRow[] = [];

  for (const country of countries) {
    try {
      const statement = await generateStatement(country.id, period, releaseDate, paymentTermDays);
      allRows.push(...statementToRows(statement, 'Original'));

      const countryCorrs = corrMap[country.id];
      if (countryCorrs) {
        for (let i = 0; i < countryCorrs.length; i++) {
          const label = countryCorrs.length === 1 ? 'Corrected' : `Corrected v${i + 1}`;
          const corrData = countryCorrs[i].data as StatementData;
          allRows.push(...statementToRows(corrData, label));
        }
      }
    } catch (e) {
      console.error(`[Raw Export] Error for ${country.fir} ${country.name}:`, e);
    }
  }

  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet('Raw Data');

  const columns = [
    { header: 'FIR', key: 'fir', width: 8 },
    { header: 'Country', key: 'country', width: 22 },
    { header: 'ISO', key: 'iso', width: 6 },
    { header: 'Period', key: 'period', width: 10 },
    { header: 'Section', key: 'section', width: 18 },
    { header: 'Source', key: 'source', width: 16 },
    { header: 'Type', key: 'type', width: 14 },
    { header: 'Description', key: 'description', width: 35 },
    { header: 'Reference', key: 'reference', width: 22 },
    { header: 'Date', key: 'date', width: 12 },
    { header: 'EUR Amount', key: 'amount', width: 16 },
  ];
  ws.columns = columns;

  const headerRow = ws.getRow(1);
  headerRow.font = { bold: true, color: { argb: HEADER_FONT }, size: 11 };
  headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: HEADER_BG } };
  headerRow.alignment = { vertical: 'middle' };

  for (const row of allRows) {
    const r = ws.addRow([
      row.fir,
      row.country,
      row.iso,
      row.period,
      row.section,
      row.source,
      row.type,
      row.description,
      row.reference,
      row.date,
      Math.round(row.amount * 100) / 100,
    ]);
    const amountCell = r.getCell(11);
    amountCell.numFmt = '#,##0.00 €';
    amountCell.alignment = { horizontal: 'right' };
  }

  ws.autoFilter = {
    from: { row: 1, column: 1 },
    to: { row: allRows.length + 1, column: columns.length },
  };

  const buffer = await wb.xlsx.writeBuffer();
  return Buffer.from(buffer);
}
