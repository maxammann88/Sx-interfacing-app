import prisma from '../prismaClient';
import type { StatementData, StatementLine, AccountStatement } from '@sixt/shared';

function getMonthRange(period: string): { start: Date; end: Date } {
  const year = parseInt(period.substring(0, 4), 10);
  const month = parseInt(period.substring(4, 6), 10);
  const start = new Date(Date.UTC(year, month - 1, 1));
  const end = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));
  return { start, end };
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

export async function generateStatement(
  countryId: number,
  period: string,
  releaseDate: string,
  paymentTermDays: number = 30
): Promise<StatementData> {
  const country = await prisma.country.findUnique({ where: { id: countryId } });
  if (!country) throw new Error(`Land mit ID ${countryId} nicht gefunden`);

  const masterData = await prisma.masterData.findUnique({
    where: { ktod: country.debitor1 },
  });

  const { start: monthStart, end: monthEnd } = getMonthRange(period);
  const debitorKonto = country.debitor1;

  const releaseDateObj = new Date(releaseDate);
  const dueDate = addDays(releaseDateObj, paymentTermDays);

  const allSapData = await prisma.sapImport.findMany({
    where: { konto: debitorKonto },
    orderBy: { buchungsdatum: 'asc' },
  });

  const currentMonthData = allSapData.filter(row => {
    if (!row.buchungsdatum) return false;
    return row.buchungsdatum >= monthStart && row.buchungsdatum <= monthEnd;
  });

  const inv = (v: number) => v * -1;

  // --- CLEARING STATEMENT ---
  const clearingRows = currentMonthData.filter(
    row => row.type === 'Clearing'
  );
  const cleanText = (t: string) => t.startsWith('*') ? t.substring(1).trim() : t;
  const clearingLines: StatementLine[] = clearingRows
    .map(row => ({
      type: row.type || '',
      reference: row.referenz || '',
      documentType: row.belegart || '',
      description: cleanText(row.text || ''),
      amount: inv(row.betragHauswaehrung),
    }))
    .sort((a, b) => b.amount - a.amount);
  const clearingSubtotal = clearingLines.reduce((sum, r) => sum + r.amount, 0);

  // --- BILLING STATEMENT ---
  const billingRows = currentMonthData.filter(
    row => row.type === 'Invoice' || row.type === 'Credit Note'
  );
  const billingLines: StatementLine[] = billingRows
    .map(row => ({
      type: row.type || '',
      reference: `${row.referenzschluessel3 || ''}${row.referenz ? ' ' + row.referenz : ''}`.trim(),
      date: row.belegdatum ? formatDate(row.belegdatum) : '',
      description: cleanText(row.text || ''),
      amount: inv(row.betragHauswaehrung),
    }))
    .sort((a, b) => b.amount - a.amount);
  const billingSubtotal = billingLines.reduce((sum, r) => sum + r.amount, 0);

  const totalInterfacingDue = clearingSubtotal + billingSubtotal;

  // --- ACCOUNT STATEMENT ---
  const currentIds = new Set(currentMonthData.map(r => r.id));
  const previousMonthData = allSapData.filter(row => {
    if (currentIds.has(row.id)) return false;
    if (!row.buchungsdatum) return false;
    return row.buchungsdatum < monthEnd;
  });

  const releaseDateStart = new Date(Date.UTC(
    releaseDateObj.getFullYear(), releaseDateObj.getMonth(), releaseDateObj.getDate()
  ));

  const previousMonthItems = previousMonthData.map(row => ({
    nettofaelligkeit: row.nettofaelligkeit ? formatDate(row.nettofaelligkeit) : null,
    amount: inv(row.betragHauswaehrung),
  }));

  const overdueBalance = previousMonthItems
    .filter(item => item.nettofaelligkeit && item.nettofaelligkeit < releaseDate)
    .reduce((sum, item) => sum + item.amount, 0);

  const dueBalance = previousMonthItems
    .filter(item => item.nettofaelligkeit && item.nettofaelligkeit >= releaseDate)
    .reduce((sum, item) => sum + item.amount, 0);

  const paymentBySixtItems = currentMonthData
    .filter(row => row.type === 'Payment' && (row.text || '').toLowerCase().includes('sixt'))
    .map(row => ({
      date: row.buchungsdatum ? formatDate(row.buchungsdatum) : '',
      description: cleanText(row.text || ''),
      amount: inv(row.betragHauswaehrung),
    }));
  const paymentBySixt = paymentBySixtItems.reduce((sum, item) => sum + item.amount, 0);

  const paymentByPartnerItems = currentMonthData
    .filter(row => row.type === 'Payment' && !(row.text || '').toLowerCase().includes('sixt'))
    .map(row => ({
      date: row.buchungsdatum ? formatDate(row.buchungsdatum) : '',
      description: cleanText(row.text || ''),
      amount: inv(row.betragHauswaehrung),
    }));
  const paymentByPartner = paymentByPartnerItems.reduce((sum, item) => sum + item.amount, 0);

  const balanceOpenItems =
    overdueBalance + dueBalance + paymentBySixt + paymentByPartner + totalInterfacingDue;

  const accountStatement: AccountStatement = {
    overdueBalance,
    dueBalance,
    dueUntilDate: formatDate(dueDate),
    paymentBySixt,
    paymentByPartner,
    paymentBySixtItems,
    paymentByPartnerItems,
    totalInterfacingAmount: totalInterfacingDue,
    totalInterfacingDueDate: formatDate(dueDate),
    balanceOpenItems,
    previousMonthItems,
  };

  return {
    country: {
      ...country,
      vertragsende: country.vertragsende ? formatDate(country.vertragsende) : null,
    } as any,
    masterData: masterData as any,
    accountingPeriod: period,
    releaseDate,
    paymentTermDays,
    clearing: clearingLines,
    clearingSubtotal,
    billing: billingLines,
    billingSubtotal,
    totalInterfacingDue,
    accountStatement,
  };
}
