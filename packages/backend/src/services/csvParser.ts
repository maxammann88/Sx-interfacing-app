import { parse } from 'csv-parse/sync';

function stripBom(content: string): string {
  return content.charCodeAt(0) === 0xFEFF ? content.slice(1) : content;
}

export interface ParsedSapRow {
  konto: string;
  buchungsschluessel: string;
  belegart: string;
  referenzschluessel3: string;
  referenz: string;
  zuordnung: string;
  buchungsperiode: string;
  buchungsdatum: Date | null;
  belegdatum: Date | null;
  nettofaelligkeit: Date | null;
  kontoGegenbuchung: string;
  sollHabenKennz: string;
  steuerkennzeichen: string;
  belegnummer: string;
  p: string;
  ausgleichsdatum: Date | null;
  text: string;
  belegkopftext: string;
  buchungsprogramm: string;
  betragHauswaehrung: number;
  hauswaehrung: string;
  type: string;
}

export interface ParsedCountryRow {
  fir: number;
  debitor1: string;
  iso: string;
  kst: number | null;
  name: string;
  comment: string;
  verrkto: string;
  kreditor: string;
  revc: string;
  debitor760: string;
  kreditor760: string;
  stSchlLstRe: string;
  stSchlLstGs: string;
  revc2: string;
  stSchlLiefRe: string;
  emails: string;
  partnerStatus: string;
  zusatz: string;
  finalInterfacing: string;
  vertragsende: Date | null;
  debitor10: string;
}

export interface ParsedBillingCostRow {
  yearMonth: string;
  companyCode: string;
  postingDate: Date | null;
  offsettingAcctNo: string;
  assignment: string;
  documentType: string;
  documentDate: Date | null;
  postingKey: string;
  debitCreditInd: string;
  amountLocalCurrency: number;
  localCurrency: string;
  taxCode: string;
  text: string;
  postingPeriod: string;
  costCenter: string;
  bookingProgram: string;
  account: string;
  entryDate: Date | null;
}

function parseGermanDate(dateStr: string): Date | null {
  if (!dateStr || dateStr.trim() === '') return null;
  const parts = dateStr.trim().split('.');
  if (parts.length === 3) {
    const [day, month, year] = parts;
    const fullYear = year.length === 2 ? `20${year}` : year;
    const d = new Date(`${fullYear}-${month.padStart(2, '0')}-${day.padStart(2, '0')}T00:00:00Z`);
    return isNaN(d.getTime()) ? null : d;
  }
  return null;
}

function parseGermanNumber(numStr: string): number {
  if (!numStr || numStr.trim() === '') return 0;
  const cleaned = numStr.trim().replace(/\./g, '').replace(',', '.');
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
}

export function parseSapCsv(content: string): ParsedSapRow[] {
  const records = parse(stripBom(content), {
    delimiter: ';',
    columns: true,
    skip_empty_lines: true,
    trim: true,
    relax_column_count: true,
  });

  return records.map((row: any) => ({
    konto: row['Konto'] || '',
    buchungsschluessel: row['Buchungsschlüssel'] || row['Buchungsschluessel'] || '',
    belegart: row['Belegart'] || '',
    referenzschluessel3: row['Referenzschlüssel 3'] || row['Referenzschluessel 3'] || '',
    referenz: row['Referenz'] || '',
    zuordnung: row['Zuordnung'] || '',
    buchungsperiode: row['Buchungsperiode'] || '',
    buchungsdatum: parseGermanDate(row['Buchungsdatum'] || ''),
    belegdatum: parseGermanDate(row['Belegdatum'] || ''),
    nettofaelligkeit: parseGermanDate(row['Nettofälligkeit'] || row['Nettofaelligkeit'] || ''),
    kontoGegenbuchung: row['Konto Gegenbuchung'] || '',
    sollHabenKennz: row['Soll/Haben-Kennz.'] || '',
    steuerkennzeichen: row['Steuerkennzeichen'] || '',
    belegnummer: row['Belegnummer'] || '',
    p: row['P'] || '',
    ausgleichsdatum: parseGermanDate(row['Ausgleichsdatum'] || ''),
    text: row['Text'] || '',
    belegkopftext: row['Belegkopftext'] || '',
    buchungsprogramm: row['Buchungsprogramm'] || '',
    betragHauswaehrung: parseGermanNumber(row['Betrag in Hauswährung'] || row['Betrag in Hauswaehrung'] || '0'),
    hauswaehrung: row['Hauswährung'] || row['Hauswaehrung'] || 'EUR',
    type: (row['Type'] || '').trim(),
  }));
}

export function parseCountryCsv(content: string): ParsedCountryRow[] {
  const records = parse(stripBom(content), {
    delimiter: ';',
    columns: true,
    skip_empty_lines: true,
    trim: true,
    relax_column_count: true,
  });

  return records.map((row: any) => ({
    fir: parseInt(row['FIR'] || '0', 10),
    debitor1: row['DEBITOR (1)'] || '',
    iso: (row['ISO'] || row['ISO '] || '').trim(),
    kst: row['KST'] ? parseInt(row['KST'], 10) : null,
    name: (row['Column1'] || '').trim(),
    comment: row['comment'] || '',
    verrkto: row['VERRKTO'] || '',
    kreditor: row['Kreditor'] || '',
    revc: row['revc'] || '',
    debitor760: row['DEBITOR (760)'] || '',
    kreditor760: row['KREDITOR (760)'] || '',
    stSchlLstRe: row['St Schl LST RE'] || '',
    stSchlLstGs: row['St Schl LST GS'] || '',
    revc2: row['revc2'] || '',
    stSchlLiefRe: row['St Schl LIEF RE'] || '',
    emails: row['E-Mails'] || '',
    partnerStatus: (row['Partner Status'] || '').trim(),
    zusatz: row['Zusatz'] || '',
    finalInterfacing: row['Final Interfacing'] || '',
    vertragsende: parseGermanDate(row['aktuelles Vertragsende'] || ''),
    debitor10: row['DEBITOR (10)'] || '',
  }));
}

export function parseBillingCostCsv(content: string): ParsedBillingCostRow[] {
  const records = parse(stripBom(content), {
    delimiter: ';',
    columns: true,
    skip_empty_lines: true,
    trim: true,
    relax_column_count: true,
  });

  return records.map((row: any) => ({
    yearMonth: (row['Year/month'] || row['Year/month '] || '').trim(),
    companyCode: (row['Company Code'] || row['Company code'] || '').trim(),
    postingDate: parseGermanDate(row['Posting Date'] || ''),
    offsettingAcctNo: (row['Offsetting acct no.'] || '').trim(),
    assignment: (row['Assignment'] || '').trim(),
    documentType: (row['Document Type'] || '').trim(),
    documentDate: parseGermanDate(row['Document Date'] || ''),
    postingKey: (row['Posting Key'] || '').trim(),
    debitCreditInd: (row['Debit/Credit Ind.'] || '').trim(),
    amountLocalCurrency: parseGermanNumber(row['Amount in local currency'] || '0'),
    localCurrency: (row['Local Currency'] || 'EUR').trim(),
    taxCode: (row['Tax Code'] || '').trim(),
    text: (row['Text'] || '').trim(),
    postingPeriod: (row['Posting Period'] || '').trim(),
    costCenter: (row['Cost Center'] || '').trim(),
    bookingProgram: (row['Booking program'] || '').trim(),
    account: (row['Account'] || '').trim(),
    entryDate: parseGermanDate(row['Entry Date'] || ''),
  }));
}
