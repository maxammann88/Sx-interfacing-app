import ExcelJS from 'exceljs';
import { GdsDcfReservation } from '@sixt/shared';

export async function parseGdsDcfExcel(buffer: Buffer): Promise<GdsDcfReservation[]> {
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

    const resNumber = String(values[resNumberIdx] || '').trim();
    if (!resNumber) return;

    reservations.push({
      resNumber,
      source: sourceIdx >= 0 ? String(values[sourceIdx] || '').trim() : '',
      pos: posIdx >= 0 ? String(values[posIdx] || '').trim() : '',
      pci: pciIdx >= 0 ? String(values[pciIdx] || '').trim() : '',
      pickupDate: pickupIdx >= 0 ? String(values[pickupIdx] || '').trim() : '',
      rateCode: rateCodeIdx >= 0 ? String(values[rateCodeIdx] || '').trim() : '',
      agency: agencyIdx >= 0 ? String(values[agencyIdx] || '').trim() : '',
      iata: iataIdx >= 0 ? String(values[iataIdx] || '').trim() : '',
      fee: feeIdx >= 0 ? parseFloat(String(values[feeIdx] || '0').replace(',', '.')) : 0,
    });
  });

  return reservations;
}

export function parseGdsDcfCsv(content: string): GdsDcfReservation[] {
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

  if (resNumberIdx === -1) {
    throw new Error('Required column RES-NUMBER not found in CSV');
  }

  const reservations: GdsDcfReservation[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    const cells = line.split(/[,;\t]/).map(c => c.trim());

    const resNumber = cells[resNumberIdx] || '';
    if (!resNumber) continue;

    reservations.push({
      resNumber,
      source: sourceIdx >= 0 ? cells[sourceIdx] || '' : '',
      pos: posIdx >= 0 ? cells[posIdx] || '' : '',
      pci: pciIdx >= 0 ? cells[pciIdx] || '' : '',
      pickupDate: pickupIdx >= 0 ? cells[pickupIdx] || '' : '',
      rateCode: rateCodeIdx >= 0 ? cells[rateCodeIdx] || '' : '',
      agency: agencyIdx >= 0 ? cells[agencyIdx] || '' : '',
      iata: iataIdx >= 0 ? cells[iataIdx] || '' : '',
      fee: feeIdx >= 0 ? parseFloat(cells[feeIdx]?.replace(',', '.') || '0') : 0,
    });
  }

  return reservations;
}
