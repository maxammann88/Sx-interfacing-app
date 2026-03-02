import ExcelJS from 'exceljs';
import { GdsDcfReservation } from '@sixt/shared';

export interface ParseResult {
  reservations: GdsDcfReservation[];
  detectedColumns: string[];
  missingColumns: string[];
}

export async function parseGdsDcfExcel(buffer: Buffer): Promise<ParseResult> {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer);
  
  const worksheet = workbook.worksheets[0];
  if (!worksheet) {
    throw new Error('No worksheet found in Excel file');
  }

  const reservations: GdsDcfReservation[] = [];
  const headers: string[] = [];
  
  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) {
      row.eachCell((cell) => {
        headers.push(String(cell.value || '').toUpperCase().trim());
      });
      return;
    }

    const values: any[] = [];
    row.eachCell({ includeEmpty: true }, (cell) => {
      values.push(cell.value);
    });

    const resNumberIdx = headers.findIndex(h => h.includes('RES') && (h.includes('NUMBER') || h.includes('NUM')));
    const sourceIdx = headers.indexOf('SOURCE');
    const posIdx = headers.indexOf('POS');
    const pciIdx = headers.indexOf('PCI');
    const pickupIdx = headers.findIndex(h => h.includes('PICK'));
    const rateCodeIdx = headers.findIndex(h => h.includes('RATE'));
    const agencyIdx = headers.indexOf('AGENCY');
    const iataIdx = headers.indexOf('IATA');
    const feeIdx = headers.indexOf('FEE');
    
    // Additional columns for validation
    const mandantIdx = headers.findIndex(h => h.includes('MANDANT') || h.includes('FIR'));
    const statusIdx = headers.indexOf('STATUS');
    const invoiceTypeIdx = headers.findIndex(h => (h.includes('INVOICE') && h.includes('TYPE')) || h === 'INVOICETYPE');
    const serialNumberIdx = headers.findIndex(h => (h.includes('SERIAL') && h.includes('NUMBER')) || h === 'MSER');
    const voucherIdx = headers.findIndex(h => h.includes('VOUCHER') || h.includes('EVOUCHER'));
    const dfrIdx = headers.findIndex(h => h === 'DFR' || (h.includes('AGENCY') && h.includes('CODE')));

    const resNumber = String(values[resNumberIdx] || '').trim();
    if (!resNumber) return;

    const reservation: GdsDcfReservation = {
      resNumber,
      source: sourceIdx >= 0 ? String(values[sourceIdx] || '').trim() : '',
      pos: posIdx >= 0 ? String(values[posIdx] || '').trim() : '',
      pci: pciIdx >= 0 ? String(values[pciIdx] || '').trim() : '',
      pickupDate: pickupIdx >= 0 ? String(values[pickupIdx] || '').trim() : '',
      rateCode: rateCodeIdx >= 0 ? String(values[rateCodeIdx] || '').trim() : '',
      agency: agencyIdx >= 0 ? String(values[agencyIdx] || '').trim() : '',
      iata: iataIdx >= 0 ? String(values[iataIdx] || '').trim() : '',
      fee: feeIdx >= 0 ? parseFloat(String(values[feeIdx] || '0').replace(',', '.')) : 0,
    };

    // Add optional fields if columns exist
    if (mandantIdx >= 0 && values[mandantIdx]) {
      reservation.mandantCode = String(values[mandantIdx]).trim();
    }
    if (statusIdx >= 0 && values[statusIdx]) {
      reservation.status = String(values[statusIdx]).trim();
    }
    if (invoiceTypeIdx >= 0 && values[invoiceTypeIdx]) {
      reservation.invoiceType = String(values[invoiceTypeIdx]).trim();
    }
    if (serialNumberIdx >= 0 && values[serialNumberIdx] !== null && values[serialNumberIdx] !== undefined) {
      reservation.serialNumber = parseInt(String(values[serialNumberIdx]), 10);
    }
    if (voucherIdx >= 0 && values[voucherIdx]) {
      reservation.voucherNumber = String(values[voucherIdx]).trim();
    }
    if (dfrIdx >= 0 && values[dfrIdx]) {
      reservation.dfr = String(values[dfrIdx]).trim();
    }

    reservations.push(reservation);
  });

  const detectedColumns = headers;
  const missingColumns = detectMissingColumns(headers);

  return { reservations, detectedColumns, missingColumns };
}

export function parseGdsDcfCsv(content: string): ParseResult {
  const lines = content.split('\n').map(l => l.trim()).filter(l => l);
  
  if (lines.length === 0) {
    throw new Error('CSV file is empty');
  }

  const headerLine = lines[0];
  const headers = headerLine.split(/[,;\t]/).map(h => h.trim().toUpperCase());
  
  const resNumberIdx = headers.findIndex(h => h.includes('RES') && h.includes('NUMBER'));
  const sourceIdx = headers.indexOf('SOURCE');
  const posIdx = headers.indexOf('POS');
  const pciIdx = headers.indexOf('PCI');
  const pickupIdx = headers.findIndex(h => h.includes('PICK'));
  const rateCodeIdx = headers.findIndex(h => h.includes('RATE'));
  const agencyIdx = headers.indexOf('AGENCY');
  const iataIdx = headers.indexOf('IATA');
  const feeIdx = headers.indexOf('FEE');
  
  // Additional columns for validation
  const mandantIdx = headers.findIndex(h => h.includes('MANDANT') || h.includes('FIR'));
  const statusIdx = headers.indexOf('STATUS');
  const invoiceTypeIdx = headers.findIndex(h => (h.includes('INVOICE') && h.includes('TYPE')) || h === 'INVOICETYPE');
  const serialNumberIdx = headers.findIndex(h => (h.includes('SERIAL') && h.includes('NUMBER')) || h === 'MSER');
  const voucherIdx = headers.findIndex(h => h.includes('VOUCHER') || h.includes('EVOUCHER'));
  const dfrIdx = headers.findIndex(h => h === 'DFR' || (h.includes('AGENCY') && h.includes('CODE')));

  if (resNumberIdx === -1) {
    throw new Error('Required column RES-NUMBER not found in CSV');
  }

  const reservations: GdsDcfReservation[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    const cells = line.split(/[,;\t]/).map(c => c.trim());

    const resNumber = cells[resNumberIdx] || '';
    if (!resNumber) continue;

    const reservation: GdsDcfReservation = {
      resNumber,
      source: sourceIdx >= 0 ? cells[sourceIdx] || '' : '',
      pos: posIdx >= 0 ? cells[posIdx] || '' : '',
      pci: pciIdx >= 0 ? cells[pciIdx] || '' : '',
      pickupDate: pickupIdx >= 0 ? cells[pickupIdx] || '' : '',
      rateCode: rateCodeIdx >= 0 ? cells[rateCodeIdx] || '' : '',
      agency: agencyIdx >= 0 ? cells[agencyIdx] || '' : '',
      iata: iataIdx >= 0 ? cells[iataIdx] || '' : '',
      fee: feeIdx >= 0 ? parseFloat(cells[feeIdx]?.replace(',', '.') || '0') : 0,
    };

    // Add optional fields if columns exist
    if (mandantIdx >= 0 && cells[mandantIdx]) {
      reservation.mandantCode = cells[mandantIdx];
    }
    if (statusIdx >= 0 && cells[statusIdx]) {
      reservation.status = cells[statusIdx];
    }
    if (invoiceTypeIdx >= 0 && cells[invoiceTypeIdx]) {
      reservation.invoiceType = cells[invoiceTypeIdx];
    }
    if (serialNumberIdx >= 0 && cells[serialNumberIdx]) {
      reservation.serialNumber = parseInt(cells[serialNumberIdx], 10);
    }
    if (voucherIdx >= 0 && cells[voucherIdx]) {
      reservation.voucherNumber = cells[voucherIdx];
    }
    if (dfrIdx >= 0 && cells[dfrIdx]) {
      reservation.dfr = cells[dfrIdx];
    }

    reservations.push(reservation);
  }

  const detectedColumns = headers;
  const missingColumns = detectMissingColumns(headers);

  return { reservations, detectedColumns, missingColumns };
}

function detectMissingColumns(headers: string[]): string[] {
  const missing: string[] = [];
  
  const hasMandant = headers.some(h => h.includes('MANDANT') || h.includes('FIR'));
  const hasStatus = headers.includes('STATUS');
  const hasInvoiceType = headers.some(h => (h.includes('INVOICE') && h.includes('TYPE')) || h === 'INVOICETYPE');
  const hasSerialNumber = headers.some(h => (h.includes('SERIAL') && h.includes('NUMBER')) || h === 'MSER');
  const hasVoucher = headers.some(h => h.includes('VOUCHER') || h.includes('EVOUCHER'));
  const hasDfr = headers.some(h => h === 'DFR' || (h.includes('AGENCY') && h.includes('CODE')));
  
  if (!hasMandant) missing.push('Mandant Code (FIR)');
  if (!hasStatus) missing.push('Status');
  if (!hasInvoiceType) missing.push('Invoice Type');
  if (!hasSerialNumber) missing.push('Serial Number (MSER)');
  if (!hasVoucher) missing.push('Voucher Number');
  if (!hasDfr) missing.push('DFR Code');
  
  return missing;
}
