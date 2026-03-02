import ExcelJS from 'exceljs';
import { FranchiseMandant } from '@sixt/shared';

export async function parseFranchiseMandantExcel(buffer: Buffer): Promise<FranchiseMandant[]> {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer);
  
  const worksheet = workbook.worksheets[0];
  if (!worksheet) {
    throw new Error('No worksheet found in Excel file');
  }

  const mandants: FranchiseMandant[] = [];
  
  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) {
      return;
    }

    const firValue = row.getCell(1).value;
    const isoValue = row.getCell(3).value;
    const countryNameValue = row.getCell(5).value;

    const fir = String(firValue || '').trim();
    if (!fir) return;

    mandants.push({
      fir,
      iso: isoValue ? String(isoValue).trim() : undefined,
      countryName: countryNameValue ? String(countryNameValue).trim() : undefined,
    });
  });

  return mandants;
}
