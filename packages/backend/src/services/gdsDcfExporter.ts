import PDFDocument from 'pdfkit';
import ExcelJS from 'exceljs';
import { GdsDcfValidationResult } from '@sixt/shared';

const USD_TO_EUR_RATE = 0.92;

interface ExportData {
  byCountry: Map<string, {
    byMonth: Map<string, {
      gds: GdsDcfValidationResult[];
      dcf: GdsDcfValidationResult[];
    }>;
  }>;
}

export class GdsDcfExporter {
  private results: GdsDcfValidationResult[];

  constructor(results: GdsDcfValidationResult[]) {
    this.results = results;
  }

  // Group results by country and month
  private groupData(): ExportData {
    const data: ExportData = { byCountry: new Map() };

    for (const result of this.results) {
      const country = result.reservation.posCountryCode || 'Unknown';
      const month = this.extractMonth(result.reservation.handoverDate);
      const isGDS = result.region === 'GDS';

      if (!data.byCountry.has(country)) {
        data.byCountry.set(country, { byMonth: new Map() });
      }

      const countryData = data.byCountry.get(country)!;
      
      if (!countryData.byMonth.has(month)) {
        countryData.byMonth.set(month, { gds: [], dcf: [] });
      }

      const monthData = countryData.byMonth.get(month)!;
      
      if (isGDS) {
        monthData.gds.push(result);
      } else {
        monthData.dcf.push(result);
      }
    }

    return data;
  }

  private extractMonth(handoverDate: string): string {
    if (!handoverDate) return 'Unknown';
    // "2025-06-30" -> "2025-06"
    return handoverDate.substring(0, 7);
  }

  private convertToEur(amount: number, currency: string): number {
    if (currency === 'USD') {
      return amount * USD_TO_EUR_RATE;
    }
    return amount;
  }

  // Generate Excel export
  async generateExcel(): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    const data = this.groupData();

    // Create a sheet for each country/month combination
    for (const [country, countryData] of data.byCountry) {
      for (const [month, monthData] of countryData.byMonth) {
        const sheetName = `${country}_${month}`.substring(0, 31); // Excel limit
        const worksheet = workbook.addWorksheet(sheetName);

        // Add title
        worksheet.addRow([`GDS & DCF Fees - ${country} - ${month}`]);
        worksheet.addRow([]);

        // GDS Section
        if (monthData.gds.length > 0) {
          this.addGDSSectionToExcel(worksheet, monthData.gds);
          worksheet.addRow([]);
        }

        // DCF Section
        if (monthData.dcf.length > 0) {
          this.addDCFSectionToExcel(worksheet, monthData.dcf);
        }

        // Format headers
        worksheet.getRow(3).font = { bold: true };
        worksheet.columns.forEach(column => {
          column.width = 15;
        });
      }
    }

    return await workbook.xlsx.writeBuffer() as Buffer;
  }

  private addGDSSectionToExcel(worksheet: ExcelJS.Worksheet, results: GdsDcfValidationResult[]) {
    worksheet.addRow(['=== GDS FEES ===']);
    
    // Headers
    const headers = [
      'Reservation #',
      'Source Ch2',
      'Source Ch3',
      'Mandant Code',
      'Status',
      'POS Country',
      'Voucher #',
      'Customer #',
      'Handover Date',
      'Partner',
      'Fee (EUR)',
      'Chargeable',
    ];
    worksheet.addRow(headers);

    // Data rows
    for (const result of results) {
      const r = result.reservation;
      worksheet.addRow([
        r.resNumber,
        r.sourceChannel2,
        r.sourceChannel3,
        r.mandantCode,
        r.statusExtended,
        r.posCountryCode,
        r.voucherNumber || '',
        r.customerParentNum || '',
        r.handoverDate,
        result.partner,
        result.isChargeable ? result.calculatedFee.toFixed(2) : '0.00',
        result.isChargeable ? 'Yes' : 'No',
      ]);
    }

    // Summary
    worksheet.addRow([]);
    const totalGDS = results
      .filter(r => r.isChargeable)
      .reduce((sum, r) => sum + r.calculatedFee, 0);
    worksheet.addRow(['Total GDS Fees (EUR):', '', '', '', '', '', '', '', '', '', totalGDS.toFixed(2)]);
  }

  private addDCFSectionToExcel(worksheet: ExcelJS.Worksheet, results: GdsDcfValidationResult[]) {
    worksheet.addRow(['=== DCF FEES ===']);
    
    // Headers
    const headers = [
      'Reservation #',
      'Source Ch2',
      'Source Ch3',
      'Mandant Code',
      'Status',
      'POS Country',
      'Customer #',
      'Handover Date',
      'Partner',
      'Fee (EUR)',
      'Chargeable',
    ];
    worksheet.addRow(headers);

    // Data rows
    for (const result of results) {
      const r = result.reservation;
      worksheet.addRow([
        r.resNumber,
        r.sourceChannel2,
        r.sourceChannel3,
        r.mandantCode,
        r.statusExtended,
        r.posCountryCode,
        r.customerParentNum || '',
        r.handoverDate,
        result.partner,
        result.isChargeable ? result.calculatedFee.toFixed(2) : '0.00',
        result.isChargeable ? 'Yes' : 'No',
      ]);
    }

    // Summary
    worksheet.addRow([]);
    const totalDCF = results
      .filter(r => r.isChargeable)
      .reduce((sum, r) => sum + r.calculatedFee, 0);
    worksheet.addRow(['Total DCF Fees (EUR):', '', '', '', '', '', '', '', '', totalDCF.toFixed(2)]);
  }

  // Generate PDF export
  async generatePDF(): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ size: 'A4', margin: 50 });
      const chunks: Buffer[] = [];

      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      const data = this.groupData();

      // For each country/month combination
      for (const [country, countryData] of data.byCountry) {
        for (const [month, monthData] of countryData.byMonth) {
          // Title page for each country/month
          doc.fontSize(20).text(`GDS & DCF Fees Report`, { align: 'center' });
          doc.fontSize(14).text(`${country} - ${month}`, { align: 'center' });
          doc.moveDown(2);

          // GDS Section
          if (monthData.gds.length > 0) {
            doc.fontSize(16).text('GDS FEES', { underline: true });
            doc.moveDown();
            this.addGDSSectionToPDF(doc, monthData.gds);
            doc.moveDown(2);
          }

          // DCF Section
          if (monthData.dcf.length > 0) {
            doc.fontSize(16).text('DCF FEES', { underline: true });
            doc.moveDown();
            this.addDCFSectionToPDF(doc, monthData.dcf);
          }

          // Add page break if more data
          doc.addPage();
        }
      }

      doc.end();
    });
  }

  private addGDSSectionToPDF(doc: PDFKit.PDFDocument, results: GdsDcfValidationResult[]) {
    doc.fontSize(10);

    // Table header
    const headerY = doc.y;
    doc.text('Res#', 50, headerY, { width: 70 });
    doc.text('Partner', 130, headerY, { width: 100 });
    doc.text('Fee (EUR)', 240, headerY, { width: 70 });
    doc.text('Status', 320, headerY, { width: 80 });
    doc.text('Date', 410, headerY, { width: 80 });
    
    doc.moveTo(50, doc.y + 5).lineTo(550, doc.y + 5).stroke();
    doc.moveDown();

    // Table rows
    for (const result of results.slice(0, 20)) { // Limit for PDF space
      const r = result.reservation;
      const y = doc.y;
      
      doc.text(r.resNumber.substring(0, 10), 50, y, { width: 70 });
      doc.text(result.partner.substring(0, 15), 130, y, { width: 100 });
      doc.text(result.isChargeable ? result.calculatedFee.toFixed(2) : '0.00', 240, y, { width: 70 });
      doc.text(result.isChargeable ? 'Charged' : 'Not Charged', 320, y, { width: 80 });
      doc.text(r.handoverDate.substring(0, 10), 410, y, { width: 80 });
      
      doc.moveDown();
    }

    // Summary
    const totalGDS = results
      .filter(r => r.isChargeable)
      .reduce((sum, r) => sum + r.calculatedFee, 0);
    
    doc.moveDown();
    doc.fontSize(12).text(`Total GDS Fees: EUR ${totalGDS.toFixed(2)}`, { align: 'right' });
    doc.fontSize(10);
  }

  private addDCFSectionToPDF(doc: PDFKit.PDFDocument, results: GdsDcfValidationResult[]) {
    doc.fontSize(10);

    // Table header
    const headerY = doc.y;
    doc.text('Res#', 50, headerY, { width: 70 });
    doc.text('Partner', 130, headerY, { width: 100 });
    doc.text('Fee (EUR)', 240, headerY, { width: 70 });
    doc.text('POS', 320, headerY, { width: 40 });
    doc.text('Date', 370, headerY, { width: 80 });
    
    doc.moveTo(50, doc.y + 5).lineTo(550, doc.y + 5).stroke();
    doc.moveDown();

    // Table rows
    for (const result of results.slice(0, 20)) { // Limit for PDF space
      const r = result.reservation;
      const y = doc.y;
      
      doc.text(r.resNumber.substring(0, 10), 50, y, { width: 70 });
      doc.text(result.partner.substring(0, 15), 130, y, { width: 100 });
      doc.text(result.isChargeable ? result.calculatedFee.toFixed(2) : '0.00', 240, y, { width: 70 });
      doc.text(r.posCountryCode, 320, y, { width: 40 });
      doc.text(r.handoverDate.substring(0, 10), 370, y, { width: 80 });
      
      doc.moveDown();
    }

    // Summary
    const totalDCF = results
      .filter(r => r.isChargeable)
      .reduce((sum, r) => sum + r.calculatedFee, 0);
    
    doc.moveDown();
    doc.fontSize(12).text(`Total DCF Fees: EUR ${totalDCF.toFixed(2)}`, { align: 'right' });
    doc.fontSize(10);
  }
}
