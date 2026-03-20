import ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';
import { RuleSnapshot, CalculationRule } from './ruleGenerator';
import prisma from '../prismaClient';

interface ValidationConditions {
  resNumber: string;
  channel: string;
  mandant: string;
  status: string;
  duplicates: string;
}

export class RuleExporter {
  async generateExcel(snapshot: RuleSnapshot): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    
    workbook.creator = 'SIXT Franchise Controlling';
    workbook.created = new Date();
    
    this.addOverviewSheet(workbook, snapshot);
    this.addCombinedCalculationRulesSheet(workbook, snapshot);
    await this.addFranchiseMandantsSheet(workbook);  // ASYNC!
    this.addChannelDetectionSheet(workbook, snapshot);
    this.addRegionMappingSheet(workbook, snapshot);
    this.addExchangeRatesSheet(workbook);
    
    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
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

  private addCombinedCalculationRulesSheet(workbook: ExcelJS.Workbook, snapshot: RuleSnapshot) {
    const sheet = workbook.addWorksheet('Calculation Rules');
    
    // NEUE Header mit DFR und eVoucher Spalten, ohne Notes, mit Created By und Updated At
    const headerRow = sheet.addRow([
      'Rule ID', 'Partner', 'Category', 'Region/Type', 'Fee Amount', 'Currency',
      'DFR', 'eVoucher',
      'Res. Number', 'Channel Detection', 'Mandant', 'Reservation Status', 'Duplicates',
      'Valid From', 'Valid To', 'Created By', 'Updated At'
    ]);
    headerRow.font = { bold: true };
    headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF424242' } };
    headerRow.eachCell((cell) => {
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    });
    
    // Build validation conditions once (same for all rows)
    const validationRules = this.buildValidationConditions(snapshot);
    
    // SORTIERUNG: Zuerst GDS, dann DCF
    const gdsPartners = snapshot.partners.filter(p => p.category === 'gds');
    const dcfPartners = snapshot.partners.filter(p => p.category === 'dcf');
    const sortedPartners = [...gdsPartners, ...dcfPartners];
    
    // Für jeden Partner und jede Fee-Variante eine Zeile erstellen
    for (const partner of sortedPartners) {
      const feesByRegion = JSON.parse(partner.feesByRegion);
      const isGDS = partner.category === 'gds';
      const fillColor = isGDS ? 'FFE3F2FD' : 'FFFFF3E0';
      
      // Für Expedia: Skip erste EMEA Zeile, für Priceline: Skip erste Americas
      const feesToProcess = partner.partnerId === 'expedia' 
        ? feesByRegion.filter((f: any, idx: number) => !(idx === 0 && f.region === 'EMEA'))
        : partner.partnerId === 'priceline'
        ? feesByRegion.filter((f: any, idx: number) => !(idx === 0 && f.region === 'Americas'))
        : feesByRegion;
      
      // Standard fees by region
      for (const fee of feesToProcess) {
        // Rule ID: Einfaches Format ohne EVOUCHER/STD Suffixe
        const ruleId = `FEE-${partner.partnerId.toUpperCase()}-${fee.region.toUpperCase()}`;
        
        const row = sheet.addRow([
          ruleId,
          partner.name,
          partner.category.toUpperCase(),
          fee.region,
          fee.amount,
          fee.currency,
          partner.partnerId === 'meili' ? 'All but 10897' : 'N/A',  // DFR
          partner.partnerId === 'amadeus' ? 'Must be present' : 'N/A',  // eVoucher
          validationRules.resNumber,
          validationRules.channel,
          validationRules.mandant,
          validationRules.status,
          validationRules.duplicates,
          partner.validFrom ? new Date(partner.validFrom).toISOString().split('T')[0] : '-',
          partner.validTo ? new Date(partner.validTo).toISOString().split('T')[0] : 'Indefinite',
          partner.createdBy || 'System',
          partner.updatedAt ? new Date(partner.updatedAt).toISOString().replace('T', ' ').split('.')[0] : '-'
        ]);
        row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: fillColor } };
      }
      
      // Amadeus special cases
      if (partner.partnerId === 'amadeus') {
        // Without eVoucher regional fees
        if (partner.feesByRegionWithoutEVoucher) {
          const feesWithoutEVoucher = JSON.parse(partner.feesByRegionWithoutEVoucher);
          for (const fee of feesWithoutEVoucher) {
            const ruleId = `FEE-AMADEUS-${fee.region.toUpperCase()}`;
            const row = sheet.addRow([
              ruleId,
              partner.name,
              partner.category.toUpperCase(),
              fee.region,  // Entferne "(without eVoucher)" Text
              fee.amount,
              fee.currency,
              'N/A',  // DFR
              'Must not be present',  // eVoucher
              validationRules.resNumber,
              validationRules.channel,
              validationRules.mandant,
              validationRules.status,
              validationRules.duplicates,
              partner.validFrom ? new Date(partner.validFrom).toISOString().split('T')[0] : '-',
              partner.validTo ? new Date(partner.validTo).toISOString().split('T')[0] : 'Indefinite',
              partner.createdBy || 'System',
              partner.updatedAt ? new Date(partner.updatedAt).toISOString().replace('T', ' ').split('.')[0] : '-'
            ]);
            row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF9E6CC' } };
          }
        }
        
        // DFR with eVoucher
        if (partner.dfrFeesWithEVoucher) {
          const dfrFeesWithEVoucher = JSON.parse(partner.dfrFeesWithEVoucher);
          for (const [dfr, fee] of Object.entries(dfrFeesWithEVoucher)) {
            const ruleId = `FEE-AMADEUS-DFR${dfr}`;
            const dfrCondition = this.getDfrCondition(partner, dfr);
            const row = sheet.addRow([
              ruleId,
              partner.name,
              partner.category.toUpperCase(),
              `DFR ${dfr}`,  // Entferne "(with eVoucher)" Text
              (fee as any).amount,
              (fee as any).currency,
              dfrCondition,  // DFR Bedingung
              'Must be present',  // eVoucher
              validationRules.resNumber,
              validationRules.channel,
              validationRules.mandant,
              validationRules.status,
              validationRules.duplicates,
              partner.validFrom ? new Date(partner.validFrom).toISOString().split('T')[0] : '-',
              partner.validTo ? new Date(partner.validTo).toISOString().split('T')[0] : 'Indefinite',
              partner.createdBy || 'System',
              partner.updatedAt ? new Date(partner.updatedAt).toISOString().replace('T', ' ').split('.')[0] : '-'
            ]);
            row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF9E6CC' } };
          }
        }
        
        // DFR without eVoucher
        if (partner.dfrFeesWithoutEVoucher) {
          const dfrFeesWithoutEVoucher = JSON.parse(partner.dfrFeesWithoutEVoucher);
          for (const [dfr, fee] of Object.entries(dfrFeesWithoutEVoucher)) {
            const ruleId = `FEE-AMADEUS-DFR${dfr}`;
            const dfrCondition = this.getDfrCondition(partner, dfr);
            const row = sheet.addRow([
              ruleId,
              partner.name,
              partner.category.toUpperCase(),
              `DFR ${dfr}`,  // Entferne "(without eVoucher)" Text
              (fee as any).amount,
              (fee as any).currency,
              dfrCondition,  // DFR Bedingung
              'Must not be present',  // eVoucher
              validationRules.resNumber,
              validationRules.channel,
              validationRules.mandant,
              validationRules.status,
              validationRules.duplicates,
              partner.validFrom ? new Date(partner.validFrom).toISOString().split('T')[0] : '-',
              partner.validTo ? new Date(partner.validTo).toISOString().split('T')[0] : 'Indefinite',
              partner.createdBy || 'System',
              partner.updatedAt ? new Date(partner.updatedAt).toISOString().replace('T', ' ').split('.')[0] : '-'
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
            const ruleId = `FEE-${partner.partnerId.toUpperCase()}-DFR${dfr}`;
            const dfrCondition = this.getDfrCondition(partner, dfr);
            const row = sheet.addRow([
              ruleId,
              partner.name,
              partner.category.toUpperCase(),
              `DFR ${dfr}`,
              (fee as any).amount,
              (fee as any).currency,
              dfrCondition,  // DFR Bedingung
              'N/A',  // eVoucher
              validationRules.resNumber,
              validationRules.channel,
              validationRules.mandant,
              validationRules.status,
              validationRules.duplicates,
              partner.validFrom ? new Date(partner.validFrom).toISOString().split('T')[0] : '-',
              partner.validTo ? new Date(partner.validTo).toISOString().split('T')[0] : 'Indefinite',
              partner.createdBy || 'System',
              partner.updatedAt ? new Date(partner.updatedAt).toISOString().replace('T', ' ').split('.')[0] : '-'
            ]);
            row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFEAA7' } };
          }
        }
      }
    }
    
    // Spaltenbreiten optimieren (mit neuen DFR/eVoucher Spalten + Created By + Updated At)
    sheet.getColumn(1).width = 35; // Rule ID
    sheet.getColumn(2).width = 25; // Partner
    sheet.getColumn(3).width = 12; // Category
    sheet.getColumn(4).width = 30; // Region/Type
    sheet.getColumn(5).width = 12; // Fee Amount
    sheet.getColumn(6).width = 10; // Currency
    sheet.getColumn(7).width = 25; // DFR
    sheet.getColumn(8).width = 25; // eVoucher
    sheet.getColumn(9).width = 15; // Res. Number
    sheet.getColumn(10).width = 30; // Channel Detection
    sheet.getColumn(11).width = 30; // Mandant
    sheet.getColumn(12).width = 35; // Reservation Status
    sheet.getColumn(13).width = 25; // Duplicates
    sheet.getColumn(14).width = 15; // Valid From
    sheet.getColumn(15).width = 15; // Valid To
    sheet.getColumn(16).width = 20; // Created By
    sheet.getColumn(17).width = 22; // Updated At
  }

  private getDfrCondition(partner: any, dfr: string): string {
    // For Amadeus, check if DFR is 10335
    if (partner.partnerId === 'amadeus' && dfr === '10335') {
      return 'Must be 10335';
    }
    
    // For Meili, check if DFR is 10897
    if (partner.partnerId === 'meili' && dfr === '10897') {
      return 'Must be 10897';
    }
    
    // Fallback (should not happen with current data)
    return 'N/A';
  }

  private addChannelDetectionSheet(workbook: ExcelJS.Workbook, snapshot: RuleSnapshot) {
    const sheet = workbook.addWorksheet('Channel Detection');
    
    // Title
    const titleRow = sheet.addRow(['Channel Detection Rules']);
    titleRow.font = { size: 14, bold: true };
    titleRow.height = 25;
    sheet.addRow([]);
    
    // GDS Section
    const gdsTitle = sheet.addRow(['GDS Partners']);
    gdsTitle.font = { bold: true, size: 12 };
    const logicRow1 = sheet.addRow(['Detection Logic:', 'sourceChannel2 OR sourceChannel3 contains GDS keywords']);
    logicRow1.getCell(1).font = { bold: true };
    sheet.addRow([]);
    
    const gdsHeaderRow = sheet.addRow(['Partner', 'Keywords', 'Example Channels']);
    gdsHeaderRow.font = { bold: true };
    gdsHeaderRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE3F2FD' } };
    
    sheet.addRow(['Amadeus', 'amadeus', 'Amadeus API, amadeus.com']);
    sheet.addRow(['Sabre', 'sabre', 'Sabre GDS, sabre.com']);
    sheet.addRow(['Travelport', 'galileo, worldspan', 'Galileo, Worldspan']);
    
    sheet.addRow([]);
    sheet.addRow([]);
    
    // DCF Section
    const dcfTitle = sheet.addRow(['DCF Partners']);
    dcfTitle.font = { bold: true, size: 12 };
    const logicRow2 = sheet.addRow(['Detection Logic:', 'sourceChannel2 contains SOAP or TPRA AND sourceChannel3 contains DCF keywords']);
    logicRow2.getCell(1).font = { bold: true };
    sheet.addRow([]);
    
    const dcfHeaderRow = sheet.addRow(['Partner', 'Channel2 Prefix', 'Channel3 Keywords', 'Example']);
    dcfHeaderRow.font = { bold: true };
    dcfHeaderRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFF3E0' } };
    
    sheet.addRow(['Expedia', 'SOAP, TPRA', 'expedia', 'SOAP API + expedia.com']);
    sheet.addRow(['Priceline', 'SOAP, TPRA', 'priceline', 'TPRA + priceline.com']);
    sheet.addRow(['Meili', 'SOAP, TPRA', 'meili', 'SOAP + meili']);
    
    // Spaltenbreiten
    sheet.getColumn(1).width = 20;
    sheet.getColumn(2).width = 30;
    sheet.getColumn(3).width = 30;
    sheet.getColumn(4).width = 40;
  }

  private async addFranchiseMandantsSheet(workbook: ExcelJS.Workbook) {
    const sheet = workbook.addWorksheet('Franchise Mandants');
    
    // Dynamisch aus DB laden
    const franchiseMandants = await (prisma as any).franchiseMandant.findMany({
      orderBy: { fir: 'asc' }
    });
    
    const titleRow = sheet.addRow(['Franchise Mandant Codes']);
    titleRow.font = { size: 14, bold: true };
    titleRow.height = 25;
    
    const descRow = sheet.addRow(['These are the valid franchise mandant codes. Only reservations with these codes are processed.']);
    descRow.font = { italic: true };
    descRow.alignment = { wrapText: true };
    sheet.mergeCells(`A${descRow.number}:B${descRow.number}`);
    sheet.addRow([]);
    
    const headerRow = sheet.addRow(['Mandant Code (FIR)', 'Country']);
    headerRow.font = { bold: true };
    headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE8F5E9' } };
    
    for (const mandant of franchiseMandants) {
      sheet.addRow([
        mandant.fir,
        mandant.countryName || mandant.iso || '-'
      ]);
    }
    
    sheet.getColumn(1).width = 20;
    sheet.getColumn(2).width = 40;
  }

  private buildValidationConditions(snapshot: RuleSnapshot): ValidationConditions {
    const config = snapshot.validationConfig;
    
    // If no config, fall back to old rule-based logic
    if (!config) {
      const validationRules = snapshot.rules.filter(r => r.category === 'Validation');
      
      const resNumberRule = 'Must exist';
      const channelRule = validationRules.find(r => r.ruleId === 'VAL-002')
        ? 'Must match GDS/DCF keywords'
        : 'Not applicable (check disabled)';
      const mandantRule = validationRules.find(r => r.ruleId === 'VAL-003')
        ? 'Must be franchise mandant'
        : 'Not applicable (check disabled)';
      const statusRule = validationRules.find(r => r.ruleId === 'VAL-004');
      const statusCondition = statusRule
        ? `All except: ${this.getNegativeStatusList(statusRule)}`
        : 'Not applicable (check disabled)';
      const dupRule = validationRules.find(r => r.ruleId === 'VAL-005');
      const dupCondition = dupRule
        ? this.formatDuplicateStrategy(dupRule)
        : 'Not checked';
      
      return { 
        resNumber: resNumberRule, 
        channel: channelRule, 
        mandant: mandantRule,
        status: statusCondition,
        duplicates: dupCondition
      };
    }
    
    // NEW: Use config-driven approach
    const resNumberRule = 'Must exist';
    
    const channelRule = config.enableChannelCheck
      ? 'Must match GDS/DCF keywords'
      : 'Not applicable (check disabled)';
    
    const mandantRule = config.enableMandantCheck
      ? 'Must be franchise mandant'
      : 'Not applicable (check disabled)';
    
    // Use validReservationStatuses for dynamic status list
    const validStatuses = config.validReservationStatuses || config.validStatuses || [];
    const allStatuses = ['invoice', 'no show', 'open', 'cancelled', 'storno', 'voided', 'booking error'];
    const invalidStatuses = allStatuses.filter(s => !validStatuses.map((v: string) => v.toLowerCase()).includes(s.toLowerCase()));
    
    const statusCondition = config.enableStatusCheck
      ? (invalidStatuses.length > 0 
          ? `All except: ${invalidStatuses.join(', ')}`
          : `Must be: ${validStatuses.join(', ')}`)
      : 'Not applicable (check disabled)';
    
    const dupCondition = config.enableDuplicateCheck
      ? this.formatDuplicateStrategyFromConfig(config.duplicateStrategy)
      : 'Not checked';
    
    return { 
      resNumber: resNumberRule, 
      channel: channelRule, 
      mandant: mandantRule,
      status: statusCondition,
      duplicates: dupCondition
    };
  }

  private getNegativeStatusList(statusRule: CalculationRule): string {
    // Alle bekannten Status
    const allStatuses = [
      'Invoice', 'No show', 'Open', 'Cancelled', 
      'Booking error', 'Customer cancellation', 'Cancellation by Sixt'
    ];
    
    // Extrahiere valide Status aus der Regel
    const validStatuses = statusRule.logic.condition
      .match(/"([^"]+)"/g)
      ?.map(s => s.replace(/"/g, '').toLowerCase());
    
    if (!validStatuses || validStatuses.length === 0) {
      return 'All statuses';
    }
    
    // Erstelle Negativliste
    const invalidStatuses = allStatuses.filter(s => 
      !validStatuses.some(v => s.toLowerCase().includes(v))
    );
    
    return invalidStatuses.length > 0 ? invalidStatuses.join(', ') : 'None';
  }

  private formatDuplicateStrategy(dupRule: CalculationRule): string {
    const strategyText = dupRule.logic.ifTrue.toLowerCase();
    if (strategyText.includes('first')) {
      return 'First occurrence only';
    } else if (strategyText.includes('latest')) {
      return 'Latest occurrence only';
    } else if (strategyText.includes('all')) {
      return 'All occurrences';
    }
    return dupRule.logic.ifTrue;
  }

  private formatDuplicateStrategyFromConfig(strategy: string): string {
    switch (strategy) {
      case 'first':
        return 'First occurrence only';
      case 'latest':
        return 'Latest occurrence only';
      case 'all':
        return 'All occurrences';
      default:
        return 'Unknown strategy';
    }
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
      doc.text(`${month}: ${(rate as number).toFixed(4)}`, x, doc.y, { continued: col < 3 });
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
