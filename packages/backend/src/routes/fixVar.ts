import { Router, Request, Response, NextFunction } from 'express';
import prisma from '../prismaClient';
import { BILLING_BOOKING_PROGRAM } from '@sixt/shared';

const router = Router();

function getMonthRange(period: string): { start: Date; end: Date } {
  const year = parseInt(period.substring(0, 4), 10);
  const month = parseInt(period.substring(4, 6), 10);
  const start = new Date(Date.UTC(year, month - 1, 1));
  const end = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));
  return { start, end };
}

function normalizeBookingProgram(value: string | null): string {
  if (!value) return '';
  return value.replace(/\s+/g, '').toUpperCase();
}

function formatDateStr(date: Date): string {
  return date.toISOString().split('T')[0];
}

function classifyBillingRows(billingRows: any[]) {
  const variableLines: any[] = [];
  const fixLines: any[] = [];
  let variableUpload = 0;
  let fixUpload = 0;

  for (const row of billingRows) {
    const amount = row.amountLocalCurrency ?? 0;
    const norm = normalizeBookingProgram(row.bookingProgram);
    const line = {
      id: row.id,
      postingDate: row.postingDate ? formatDateStr(row.postingDate) : '',
      documentDate: row.documentDate ? formatDateStr(row.documentDate) : '',
      documentType: row.documentType || '',
      text: row.text || '',
      assignment: row.assignment || '',
      costCenter: row.costCenter || '',
      account: row.account || '',
      bookingProgram: row.bookingProgram || '',
      postingKey: row.postingKey || '',
      debitCreditInd: row.debitCreditInd || '',
      localCurrency: row.localCurrency || '',
      amount,
    };

    if (norm === BILLING_BOOKING_PROGRAM.VARIABLE) {
      variableLines.push(line);
      variableUpload += amount;
    } else if (norm === BILLING_BOOKING_PROGRAM.FIX) {
      fixLines.push(line);
      fixUpload += amount;
    }
  }

  variableLines.sort((a: any, b: any) => a.amount - b.amount);
  fixLines.sort((a: any, b: any) => a.amount - b.amount);

  return { variableLines, fixLines, variableUpload, fixUpload };
}

function classifySapRows(sapRows: any[]) {
  const inv = (v: number) => (typeof v === 'number' ? -v : 0);
  let variableSap = 0;
  let fixSap = 0;
  for (const row of sapRows) {
    const amount = inv(row.betragHauswaehrung ?? 0);
    const text = (row.text || '').toLowerCase();
    if (text.includes('operational costs billing')) {
      variableSap += amount;
    } else if (text.includes('contractual costs billing')) {
      fixSap += amount;
    }
  }
  return { variableSap, fixSap };
}

router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const period = req.query.period as string;
    const countryIdParam = req.query.countryId as string;

    if (!period || period.length !== 6) {
      return res.status(400).json({ success: false, error: 'Abrechnungsperiode (period, Format YYYYMM) fehlt' });
    }

    const countryId = countryIdParam ? parseInt(countryIdParam, 10) : null;
    if (!countryId || isNaN(countryId)) {
      return res.status(400).json({ success: false, error: 'Land (countryId) fehlt' });
    }

    const country = await prisma.country.findUnique({ where: { id: countryId } });
    if (!country) {
      return res.status(404).json({ success: false, error: `Land mit ID ${countryId} nicht gefunden` });
    }

    const { start: monthStart, end: monthEnd } = getMonthRange(period);
    const costCenterMatch = String(country.kst);
    const yearMonthMatch = `${period.substring(0, 4)}/${period.substring(4, 6)}`;

    const billingRows = await prisma.billingCostImport.findMany({
      where: { costCenter: costCenterMatch, yearMonth: yearMonthMatch },
    });

    const { variableLines, fixLines, variableUpload, fixUpload } = classifyBillingRows(billingRows);

    const sapRows = await prisma.sapImport.findMany({
      where: {
        konto: country.debitor1,
        buchungsdatum: { gte: monthStart, lte: monthEnd },
        type: { in: ['Invoice', 'Credit Note'] },
      },
    });

    const { variableSap, fixSap } = classifySapRows(sapRows);

    res.json({
      success: true,
      data: {
        country: { id: country.id, fir: country.fir, name: country.name, iso: country.iso },
        period,
        variableLines,
        variableUpload,
        fixLines,
        fixUpload,
        variableSap,
        fixSap,
        variableDeviation: variableUpload - variableSap,
        fixedDeviation: fixUpload - fixSap,
      },
    });
  } catch (err) {
    next(err);
  }
});

router.get('/overview', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const period = req.query.period as string;
    if (!period || period.length !== 6) {
      return res.status(400).json({ success: false, error: 'Abrechnungsperiode (period, Format YYYYMM) fehlt' });
    }

    const { start: monthStart, end: monthEnd } = getMonthRange(period);
    const yearMonthMatch = `${period.substring(0, 4)}/${period.substring(4, 6)}`;

    const countries = await prisma.country.findMany({
      where: { partnerStatus: 'aktiv', kst: { not: null } },
      orderBy: { name: 'asc' },
    });

    const allBilling = await prisma.billingCostImport.findMany({
      where: { yearMonth: yearMonthMatch },
      select: { costCenter: true, bookingProgram: true, amountLocalCurrency: true },
    });

    const billingByCostCenter = new Map<string, { variable: number; fix: number }>();
    for (const row of allBilling) {
      const cc = row.costCenter || '';
      if (!billingByCostCenter.has(cc)) billingByCostCenter.set(cc, { variable: 0, fix: 0 });
      const entry = billingByCostCenter.get(cc)!;
      const norm = normalizeBookingProgram(row.bookingProgram);
      const amount = row.amountLocalCurrency ?? 0;
      if (norm === BILLING_BOOKING_PROGRAM.VARIABLE) entry.variable += amount;
      else if (norm === BILLING_BOOKING_PROGRAM.FIX) entry.fix += amount;
    }

    const allSap = await prisma.sapImport.findMany({
      where: {
        buchungsdatum: { gte: monthStart, lte: monthEnd },
        type: { in: ['Invoice', 'Credit Note'] },
      },
      select: { konto: true, text: true, betragHauswaehrung: true },
    });

    const sapByDebitor = new Map<string, { variable: number; fix: number }>();
    const inv = (v: number) => (typeof v === 'number' ? -v : 0);
    for (const row of allSap) {
      const konto = row.konto || '';
      if (!sapByDebitor.has(konto)) sapByDebitor.set(konto, { variable: 0, fix: 0 });
      const entry = sapByDebitor.get(konto)!;
      const amount = inv(row.betragHauswaehrung ?? 0);
      const text = (row.text || '').toLowerCase();
      if (text.includes('operational costs billing')) entry.variable += amount;
      else if (text.includes('contractual costs billing')) entry.fix += amount;
    }

    const rows = countries.map((c) => {
      const billing = billingByCostCenter.get(String(c.kst)) || { variable: 0, fix: 0 };
      const sap = sapByDebitor.get(c.debitor1 || '') || { variable: 0, fix: 0 };
      const variableDeviation = billing.variable - sap.variable;
      const fixedDeviation = billing.fix - sap.fix;
      const totalDeviation = Math.abs(variableDeviation) + Math.abs(fixedDeviation);
      return {
        countryId: c.id,
        fir: c.fir,
        name: c.name,
        iso: c.iso,
        variableUpload: billing.variable,
        fixUpload: billing.fix,
        variableSap: sap.variable,
        fixSap: sap.fix,
        variableDeviation,
        fixedDeviation,
        totalDeviation,
      };
    }).filter((r) => r.variableUpload !== 0 || r.fixUpload !== 0 || r.variableSap !== 0 || r.fixSap !== 0);

    rows.sort((a, b) => b.totalDeviation - a.totalDeviation);

    res.json({ success: true, data: { period, rows } });
  } catch (err) {
    next(err);
  }
});

export default router;
