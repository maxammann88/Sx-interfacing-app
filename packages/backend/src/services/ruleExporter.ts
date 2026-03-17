import ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';
import { RuleSnapshot } from './ruleGenerator';

export class RuleExporter {
  async generateExcel(snapshot: RuleSnapshot): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    
    workbook.creator = 'SIXT Franchise Controlling';
    workbook.created = new Date();
    
    this.addOverviewSheet(workbook, snapshot);
    this.addValidationRulesSheet(workbook, snapshot);
    this.addPartnerFeesSheet(workbook, snapshot);
    this.addRegionMappingSheet(workbook, snapshot);
    this.addExchangeRatesSheet(workbook);
    
    return await workbook.xlsx.writeBuffer() as Buffer;
  }

  private addOverviewSheet(workbook: ExcelJS.Workbook, snapshot: RuleSnapshot) {
    const sheet = workbook.addWorksheet('Overview');
    
    sheet.getColumn(1).width = 25;
    sheet.getColumn(2).width = 40;
    
    const titleRow = sheet.addRow(['GDS & DCF Fee Calculation Rules']);
    titleRow.font = { size: 16, bold: true };
    titleRow.height = 25;
    
    sheet.addRow([]);
    
    sheet.addRow(['Rule Set Version:', snapshot.rulesetVersion]);
    sheet.addRow(['Valid From:', snapshot.validFrom.toISOString().split('T')[0]]);
    sheet.addRow(['Valid To:', snapshot.validTo ? snapshot.validTo.toISOString().split('T')[0] : 'Indefinite']);
    sheet.addRow(['Generated:', new Date().toISOString()]);
    sheet.addRow(['Total Rules:', snapshot.rules.length]);
    sheet.addRow(['Total Partners:', snapshot.partners.length]);
    
    sheet.addRow([]);
    sheet.addRow(['Description:', 'This document contains the complete calculation logic for GDS and DCF fees']);
  }

  private addValidationRulesSheet(workbook: ExcelJS.Workbook, snapshot: RuleSnapshot) {
    const sheet = workbook.addWorksheet('Validation Rules');
    
    const headerRow = sheet.addRow(['Rule ID', 'Order', 'Title', 'Description', 'Condition', 'If True', 'If False']);
    headerRow.font = { bold: true };
    headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE3F2FD' } };
    
    const validationRules = snapshot.rules.filter(r => r.category === 'Validation');
    
    for (const rule of validationRules) {
      sheet.addRow([
        rule.ruleId,
        rule.ruleOrder,
        rule.title,
        rule.description,
        rule.logic.condition,
        rule.logic.ifTrue,
        rule.logic.ifFalse,
      ]);
    }
    
    sheet.columns.forEach(col => col.width = 20);
  }

  private addPartnerFeesSheet(workbook: ExcelJS.Workbook, snapshot: RuleSnapshot) {
    const sheet = workbook.addWorksheet('Partner Fees');
    
    const headerRow = sheet.addRow(['Partner', 'Category', 'Region / Type', 'Fee Amount', 'Currency', 'Conditions', 'Valid From', 'Valid To']);
    headerRow.font = { bold: true };
    headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFF3E0' } };
    
    for (const partner of snapshot.partners) {
      const feesByRegion = JSON.parse(partner.feesByRegion);
      const isGDS = partner.category === 'gds';
      const fillColor = isGDS ? 'FFE3F2FD' : 'FFFFF3E0';
      
      // Standard fees by region
      for (const fee of feesByRegion) {
        const row = sheet.addRow([
          partner.name,
          partner.category.toUpperCase(),
          fee.region,
          fee.amount,
          fee.currency,
          'Standard rate',
          partner.validFrom ? new Date(partner.validFrom).toISOString().split('T')[0] : '-',
          partner.validTo ? new Date(partner.validTo).toISOString().split('T')[0] : 'Indefinite',
        ]);
        row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: fillColor } };
      }
      
      // Amadeus special cases
      if (partner.partnerId === 'amadeus') {
        // Without eVoucher regional fees
        if (partner.feesByRegionWithoutEVoucher) {
          const feesWithoutEVoucher = JSON.parse(partner.feesByRegionWithoutEVoucher);
          for (const fee of feesWithoutEVoucher) {
            const row = sheet.addRow([
              partner.name,
              partner.category.toUpperCase(),
              `${fee.region} (without eVoucher)`,
              fee.amount,
              fee.currency,
              'Only when no eVoucher',
              partner.validFrom ? new Date(partner.validFrom).toISOString().split('T')[0] : '-',
              partner.validTo ? new Date(partner.validTo).toISOString().split('T')[0] : 'Indefinite',
            ]);
            row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF9E6CC' } };
          }
        }
        
        // DFR with eVoucher
        if (partner.dfrFeesWithEVoucher) {
          const dfrFeesWithEVoucher = JSON.parse(partner.dfrFeesWithEVoucher);
          for (const [dfr, fee] of Object.entries(dfrFeesWithEVoucher)) {
            const row = sheet.addRow([
              partner.name,
              partner.category.toUpperCase(),
              `DFR ${dfr} (with eVoucher)`,
              (fee as any).amount,
              (fee as any).currency,
              'Only when eVoucher present',
              partner.validFrom ? new Date(partner.validFrom).toISOString().split('T')[0] : '-',
              partner.validTo ? new Date(partner.validTo).toISOString().split('T')[0] : 'Indefinite',
            ]);
            row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF9E6CC' } };
          }
        }
        
        // DFR without eVoucher
        if (partner.dfrFeesWithoutEVoucher) {
          const dfrFeesWithoutEVoucher = JSON.parse(partner.dfrFeesWithoutEVoucher);
          for (const [dfr, fee] of Object.entries(dfrFeesWithoutEVoucher)) {
            const row = sheet.addRow([
              partner.name,
              partner.category.toUpperCase(),
              `DFR ${dfr} (without eVoucher)`,
              (fee as any).amount,
              (fee as any).currency,
              'Only when no eVoucher',
              partner.validFrom ? new Date(partner.validFrom).toISOString().split('T')[0] : '-',
              partner.validTo ? new Date(partner.validTo).toISOString().split('T')[0] : 'Indefinite',
            ]);
            row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF9E6CC' } };
          }
        }
      }
      
      // DCF partner DFR exceptions (e.g., Meili)
      if (partner.category === 'dcf' && partner.voucherRules) {
        const voucherRules = JSON.parse(partner.voucherRules);
        if (voucherRules.dfrFees) {
          for (const [dfr, fee] of Object.entries(voucherRules.dfrFees)) {
            const row = sheet.addRow([
              partner.name,
              partner.category.toUpperCase(),
              `DFR ${dfr}`,
              (fee as any).amount,
              (fee as any).currency,
              `Special rate for Customer Parent ${dfr}`,
              partner.validFrom ? new Date(partner.validFrom).toISOString().split('T')[0] : '-',
              partner.validTo ? new Date(partner.validTo).toISOString().split('T')[0] : 'Indefinite',
            ]);
            row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFEAA7' } };
          }
        }
      }
    }
    
    sheet.columns.forEach((col, idx) => {
      if (idx === 0) col.width = 30; // Partner name
      else if (idx === 2) col.width = 35; // Region/Type
      else if (idx === 5) col.width = 35; // Conditions
      else col.width = 15;
    });
  }

  private addRegionMappingSheet(workbook: ExcelJS.Workbook, snapshot: RuleSnapshot) {
    const sheet = workbook.addWorksheet('Region Mapping');
    
    const headerRow = sheet.addRow(['Region', 'Country Code', 'Valid From', 'Valid To']);
    headerRow.font = { bold: true };
    headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE8F5E9' } };
    
    const regionGroups = new Map<string, string[]>();
    
    for (const mapping of snapshot.regionMappings) {
      if (!regionGroups.has(mapping.regionName)) {
        regionGroups.set(mapping.regionName, []);
      }
      regionGroups.get(mapping.regionName)!.push(mapping.countryCode);
    }
    
    for (const [region, countries] of Array.from(regionGroups.entries())) {
      sheet.addRow([region, countries.join(', '), 
        snapshot.validFrom.toISOString().split('T')[0],
        snapshot.validTo ? snapshot.validTo.toISOString().split('T')[0] : 'Indefinite'
      ]);
    }
    
    sheet.columns.forEach((col, idx) => {
      if (idx === 1) col.width = 50;
      else col.width = 20;
    });
  }

  private addExchangeRatesSheet(workbook: ExcelJS.Workbook) {
    const sheet = workbook.addWorksheet('Exchange Rates');
    
    // Add info row
    const infoRow = sheet.addRow(['Exchange Rate Policy:']);
    infoRow.font = { bold: true, size: 12 };
    infoRow.height = 20;
    
    const descRow = sheet.addRow(['Always use the most recent end-of-month rate available for the booking\'s handover month. If the month is not yet available, use the default rate of 0.92.']);
    descRow.font = { italic: true };
    descRow.alignment = { wrapText: true };
    sheet.mergeCells(`A${descRow.number}:C${descRow.number}`);
    
    sheet.addRow([]);
    
    const headerRow = sheet.addRow(['Month', 'USD to EUR Rate', 'Notes']);
    headerRow.font = { bold: true };
    headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF3E5F5' } };
    
    const rates = [
      ['2025-01', 0.95, ''],
      ['2025-02', 0.94, ''],
      ['2025-03', 0.93, ''],
      ['2025-04', 0.92, ''],
      ['2025-05', 0.91, ''],
      ['2025-06', 0.90, ''],
      ['2025-07', 0.91, ''],
      ['2025-08', 0.92, ''],
      ['2025-09', 0.93, ''],
      ['2025-10', 0.92, ''],
      ['2025-11', 0.91, ''],
      ['2025-12', 0.90, ''],
      ['2026-01', 0.91, ''],
      ['2026-02', 0.92, ''],
      ['2026-03', 0.92, ''],
    ];
    
    for (const [month, rate, note] of rates) {
      sheet.addRow([month, rate, note]);
    }
    
    // Add default rate row
    sheet.addRow([]);
    const defaultRow = sheet.addRow(['Default', 0.92, 'Fallback rate when month not found']);
    defaultRow.font = { bold: true };
    defaultRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFF3CD' } };
    
    sheet.getColumn(1).width = 15;
    sheet.getColumn(2).width = 20;
    sheet.getColumn(3).width = 30;
  }

  async generatePDF(snapshot: RuleSnapshot): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ size: 'A4', margins: { top: 50, bottom: 50, left: 50, right: 50 } });
      const chunks: Buffer[] = [];
      
      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);
      
      this.addPDFTitlePage(doc, snapshot);
      doc.addPage();
      this.addPDFValidationSection(doc, snapshot);
      doc.addPage();
      this.addPDFPartnerSection(doc, snapshot);
      doc.addPage();
      this.addPDFRegionMappingSection(doc, snapshot);
      doc.addPage();
      this.addPDFExchangeRatesSection(doc);
      
      doc.end();
    });
  }

  private addPDFTitlePage(doc: PDFKit.PDFDocument, snapshot: RuleSnapshot) {
    doc.fontSize(24).font('Helvetica-Bold').text('GDS & DCF Fee Calculation', { align: 'center' });
    doc.moveDown();
    doc.fontSize(18).text('Ruleset Documentation', { align: 'center' });
    doc.moveDown(3);
    
    doc.fontSize(12).font('Helvetica');
    doc.text(`Version: ${snapshot.rulesetVersion}`);
    doc.text(`Valid From: ${snapshot.validFrom.toISOString().split('T')[0]}`);
    doc.text(`Valid To: ${snapshot.validTo ? snapshot.validTo.toISOString().split('T')[0] : 'Indefinite'}`);
    doc.text(`Generated: ${new Date().toISOString().split('T')[0]}`);
    doc.moveDown(2);
    
    doc.text('This document contains the complete calculation logic for GDS and DCF fees, including validation rules, partner configurations, and region mappings.');
    
    doc.fontSize(10).fillColor('gray').text(`Revision-Safe Document - Do Not Modify`, doc.page.width / 2, doc.page.height - 30, { align: 'center' });
  }

  private addPDFValidationSection(doc: PDFKit.PDFDocument, snapshot: RuleSnapshot) {
    doc.fontSize(16).font('Helvetica-Bold').fillColor('black').text('Validation Rules');
    doc.moveDown();
    
    const validationRules = snapshot.rules.filter(r => r.category === 'Validation');
    
    for (const rule of validationRules) {
      doc.fontSize(12).font('Helvetica-Bold').text(rule.title);
      doc.fontSize(10).font('Helvetica').text(rule.description);
      doc.fontSize(9).text(`Condition: ${rule.logic.condition}`);
      doc.text(`✓ If True: ${rule.logic.ifTrue}`);
      doc.text(`✗ If False: ${rule.logic.ifFalse}`);
      doc.moveDown();
    }
  }

  private addPDFPartnerSection(doc: PDFKit.PDFDocument, snapshot: RuleSnapshot) {
    doc.fontSize(16).font('Helvetica-Bold').text('Partner Fee Configuration');
    doc.moveDown();
    
    for (const partner of snapshot.partners) {
      doc.fontSize(12).font('Helvetica-Bold').text(partner.name);
      doc.fontSize(10).font('Helvetica').text(`Category: ${partner.category.toUpperCase()}`);
      
      const feesByRegion = JSON.parse(partner.feesByRegion);
      doc.fontSize(9);
      
      // Standard fees
      doc.font('Helvetica-Bold').text('Standard Rates:', { continued: false });
      doc.font('Helvetica');
      for (const fee of feesByRegion) {
        doc.text(`  ${fee.region}: ${fee.currency} ${fee.amount.toFixed(2)}`);
      }
      
      // Amadeus special cases
      if (partner.partnerId === 'amadeus') {
        if (partner.feesByRegionWithoutEVoucher) {
          const feesWithoutEVoucher = JSON.parse(partner.feesByRegionWithoutEVoucher);
          doc.moveDown(0.5);
          doc.font('Helvetica-Bold').text('Without eVoucher:', { continued: false });
          doc.font('Helvetica');
          for (const fee of feesWithoutEVoucher) {
            doc.text(`  ${fee.region}: ${fee.currency} ${fee.amount.toFixed(2)} (only when no eVoucher)`);
          }
        }
        
        if (partner.dfrFeesWithEVoucher) {
          const dfrFeesWithEVoucher = JSON.parse(partner.dfrFeesWithEVoucher);
          doc.moveDown(0.5);
          doc.font('Helvetica-Bold').text('DFR Exceptions (with eVoucher):', { continued: false });
          doc.font('Helvetica');
          for (const [dfr, fee] of Object.entries(dfrFeesWithEVoucher)) {
            doc.text(`  DFR ${dfr}: ${(fee as any).currency} ${(fee as any).amount.toFixed(2)}`);
          }
        }
      }
      
      // DCF DFR exceptions
      if (partner.category === 'dcf' && partner.voucherRules) {
        const voucherRules = JSON.parse(partner.voucherRules);
        if (voucherRules.dfrFees) {
          doc.moveDown(0.5);
          doc.font('Helvetica-Bold').text('DFR Exceptions:', { continued: false });
          doc.font('Helvetica');
          for (const [dfr, fee] of Object.entries(voucherRules.dfrFees)) {
            doc.text(`  DFR ${dfr}: ${(fee as any).currency} ${(fee as any).amount.toFixed(2)} (Customer Parent ${dfr})`);
          }
        }
      }
      
      doc.moveDown();
    }
  }

  private addPDFRegionMappingSection(doc: PDFKit.PDFDocument, snapshot: RuleSnapshot) {
    doc.fontSize(16).font('Helvetica-Bold').text('Region-Country Mapping');
    doc.moveDown();
    
    const regionGroups = new Map<string, string[]>();
    
    for (const mapping of snapshot.regionMappings) {
      if (!regionGroups.has(mapping.regionName)) {
        regionGroups.set(mapping.regionName, []);
      }
      regionGroups.get(mapping.regionName)!.push(mapping.countryCode.toUpperCase());
    }
    
    doc.fontSize(10).font('Helvetica');
    
    for (const [region, countries] of Array.from(regionGroups.entries())) {
      doc.fontSize(11).font('Helvetica-Bold').text(region + ':', { continued: false });
      doc.fontSize(9).font('Helvetica').text(countries.sort().join(', '), { 
        indent: 20,
        width: doc.page.width - 120 
      });
      doc.moveDown(0.5);
    }
    
    doc.moveDown(0.5);
    doc.fontSize(11).font('Helvetica-Bold').text('EMEA (Default):', { continued: false });
    doc.fontSize(9).font('Helvetica').fillColor('gray').text('All countries not explicitly assigned to Americas or Other', { 
      indent: 20,
      width: doc.page.width - 120 
    });
    doc.fillColor('black');
  }

  private addPDFExchangeRatesSection(doc: PDFKit.PDFDocument) {
    doc.fontSize(16).font('Helvetica-Bold').text('Currency Conversion Rules');
    doc.moveDown();
    
    doc.fontSize(10).font('Helvetica-Bold').text('Exchange Rate Policy:', { continued: false });
    doc.fontSize(9).font('Helvetica').text('Always use the most recent end-of-month rate available for the booking\'s handover month. If the month is not yet available, use the default rate of 0.92.', {
      width: doc.page.width - 100
    });
    doc.moveDown();
    
    doc.fontSize(11).font('Helvetica-Bold').text('USD to EUR Exchange Rates:', { continued: false });
    doc.moveDown(0.5);
    
    const rates = [
      ['2025-01', 0.95], ['2025-02', 0.94], ['2025-03', 0.93],
      ['2025-04', 0.92], ['2025-05', 0.91], ['2025-06', 0.90],
      ['2025-07', 0.91], ['2025-08', 0.92], ['2025-09', 0.93],
      ['2025-10', 0.92], ['2025-11', 0.91], ['2025-12', 0.90],
      ['2026-01', 0.91], ['2026-02', 0.92], ['2026-03', 0.92],
    ];
    
    doc.fontSize(9).font('Helvetica');
    let col = 0;
    const startX = 50;
    const colWidth = 120;
    
    for (const [month, rate] of rates) {
      const x = startX + (col * colWidth);
      doc.text(`${month}: ${rate.toFixed(4)}`, x, doc.y, { continued: col < 3 });
      col++;
      if (col >= 4) {
        col = 0;
        doc.moveDown(0.3);
      }
    }
    
    if (col > 0) doc.moveDown();
    
    doc.moveDown(0.5);
    doc.fontSize(10).font('Helvetica-Bold').fillColor('#CC6600').text('Default Rate: 0.9200', { continued: false });
    doc.fontSize(9).font('Helvetica').fillColor('black').text('(Fallback when month not found)');
  }
}

export const ruleExporter = new RuleExporter();
