import ExcelJS from 'exceljs';
import { GdsDcfReservation } from '@sixt/shared';

export interface ParseResult {
  reservations: GdsDcfReservation[];
  detectedColumns: string[];
  missingColumns: string[];
}

// Helper function to clean datetime values (remove time, keep only date)
function cleanDateValue(value: any): string {
  if (!value) return '';
  const strValue = String(value).trim();
  // Extract only the date part (YYYY-MM-DD or MM/DD/YYYY format)
  // Example: "2025-06-30 23:35:00.000" -> "2025-06-30"
  // Example: "6/30/2025 12:00:00 AM" -> "6/30/2025"
  const match = strValue.match(/^(\d{4}-\d{2}-\d{2}|\d{1,2}\/\d{1,2}\/\d{4})/);
  return match ? match[1] : strValue.split(' ')[0];
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
        headers.push(String(cell.value || '').trim());
      });
      return;
    }

    const values: any[] = [];
    row.eachCell({ includeEmpty: true }, (cell) => {
      values.push(cell.value);
    });

    const reservation = parseReservationRow(headers, values);
    if (reservation) {
      reservations.push(reservation);
    }
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

  // Parse CSV header with proper quote handling
  const headerLine = lines[0];
  const headers = parseCSVLine(headerLine);
  
  const reservations: GdsDcfReservation[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    const cells = parseCSVLine(line);

    const reservation = parseReservationRow(headers, cells);
    if (reservation) {
      reservations.push(reservation);
    }
  }

  const detectedColumns = headers;
  const missingColumns = detectMissingColumns(headers);

  return { reservations, detectedColumns, missingColumns };
}

// Parse CSV line with proper quote handling
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  
  return result;
}

function parseReservationRow(headers: string[], values: any[]): GdsDcfReservation | null {
  // Find column indices - flexible matching
  const getIndex = (patterns: string[]) => {
    return headers.findIndex(h => 
      patterns.some(p => h.toLowerCase().includes(p.toLowerCase()))
    );
  };

  const resNumberIdx = getIndex(['rsrv_resn']);
  const sourceChannel2Idx = getIndex(['rsrv_source_chl2']);
  const sourceChannel3Idx = getIndex(['rsrv_source_chl3']);
  const mandantCodeIdx = getIndex(['mndt_code']);
  const statusExtendedIdx = getIndex(['rsrv_status_extended']);
  const posCountryCodeIdx = getIndex(['rsrv_posl_country_code']);
  const voucherNumberIdx = getIndex(['rntl_voucher_number']);
  const customerParentNumIdx = getIndex(['cstm_parent_num']);
  const serialNumberIdx = getIndex(['rntl_mser']);
  const handoverDateIdx = getIndex(['rsrv_handover_datm']);

  // Reservation number is mandatory
  if (resNumberIdx === -1) return null;
  
  const resNumber = String(values[resNumberIdx] || '').trim();
  if (!resNumber || resNumber === '0') return null;

  // Build reservation object
  const reservation: GdsDcfReservation = {
    resNumber,
    sourceChannel2: sourceChannel2Idx >= 0 ? String(values[sourceChannel2Idx] || '').trim() : '',
    sourceChannel3: sourceChannel3Idx >= 0 ? String(values[sourceChannel3Idx] || '').trim() : '',
    mandantCode: mandantCodeIdx >= 0 ? String(values[mandantCodeIdx] || '').trim() : '',
    statusExtended: statusExtendedIdx >= 0 ? String(values[statusExtendedIdx] || '').trim() : '',
    posCountryCode: posCountryCodeIdx >= 0 ? String(values[posCountryCodeIdx] || '').trim() : '',
    handoverDate: handoverDateIdx >= 0 ? cleanDateValue(values[handoverDateIdx]) : '',
  };

  // Optional fields
  if (voucherNumberIdx >= 0 && values[voucherNumberIdx]) {
    const voucher = String(values[voucherNumberIdx]).trim();
    if (voucher && voucher !== '' && voucher !== ' ') {
      reservation.voucherNumber = voucher;
    }
  }

  if (customerParentNumIdx >= 0 && values[customerParentNumIdx]) {
    const parentNum = String(values[customerParentNumIdx]).trim();
    if (parentNum && parentNum !== '' && parentNum !== '0') {
      reservation.customerParentNum = parentNum;
    }
  }

  if (serialNumberIdx >= 0 && values[serialNumberIdx] !== null && values[serialNumberIdx] !== undefined && values[serialNumberIdx] !== '') {
    const mser = parseInt(String(values[serialNumberIdx]), 10);
    if (!isNaN(mser)) {
      reservation.serialNumber = mser;
    }
  }

  return reservation;
}

function detectMissingColumns(headers: string[]): string[] {
  const missing: string[] = [];
  
  const required = [
    { field: 'rsrv_resn', label: 'Reservation Number (rsrv_resn)' },
    { field: 'rsrv_source_chl2', label: 'Source Channel 2 (rsrv_source_chl2)' },
    { field: 'rsrv_source_chl3', label: 'Source Channel 3 (rsrv_source_chl3)' },
    { field: 'mndt_code', label: 'Mandant Code (mndt_code)' },
    { field: 'rsrv_status_extended', label: 'Status Extended (rsrv_status_extended)' },
    { field: 'rsrv_posl_country_code', label: 'POS Country Code (rsrv_posl_country_code)' },
    { field: 'rsrv_handover_datm', label: 'Handover Date (rsrv_handover_datm)' },
  ];

  for (const req of required) {
    const found = headers.some(h => h.toLowerCase().includes(req.field.toLowerCase()));
    if (!found) {
      missing.push(req.label);
    }
  }
  
  return missing;
}
