import { Router, Request, Response, NextFunction } from 'express';
import multer from 'multer';
import prisma from '../prismaClient';
import { parseGdsDcfExcel, parseGdsDcfCsv } from '../services/gdsDcfParser';
import { GdsDcfValidator, getDefaultPartners } from '../services/gdsDcfValidator';
import { GdsDcfPartner, GdsDcfReservation, GdsDcfValidationResult } from '@sixt/shared';
import { serializePartner, deserializePartner, deserializeValidationResult } from '../utils/jsonHelpers';
import { validationRuleConfigService } from '../services/validationRuleConfigService';

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 50 * 1024 * 1024 } });

router.post('/upload', upload.single('file'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No file uploaded' });
    }

    const filename = req.file.originalname;
    const isExcel = filename.endsWith('.xlsx') || filename.endsWith('.xls');
    const isCsv = filename.endsWith('.csv');

    let parseResult: { reservations: GdsDcfReservation[], detectedColumns: string[], missingColumns: string[] };

    if (isExcel) {
      parseResult = await parseGdsDcfExcel(req.file.buffer);
    } else if (isCsv) {
      const content = req.file.buffer.toString('utf-8');
      parseResult = parseGdsDcfCsv(content);
    } else {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid file format. Please upload .xlsx, .xls, or .csv file' 
      });
    }

    const { reservations, detectedColumns, missingColumns } = parseResult;

    // Get current validation rule config for deduplication strategy
    const ruleConfig = await validationRuleConfigService.getCurrentConfig();
    
    // Apply deduplication based on config
    let uniqueReservations = reservations;
    
    if (ruleConfig.enableDuplicateCheck) {
      if (ruleConfig.duplicateStrategy === 'first') {
        // Deduplicate by reservation number - keep first occurrence
        uniqueReservations = reservations.reduce((acc, reservation) => {
          const existing = acc.find(r => r.resNumber === reservation.resNumber);
          if (!existing) {
            acc.push(reservation);
          }
          return acc;
        }, [] as GdsDcfReservation[]);
      } else if (ruleConfig.duplicateStrategy === 'latest') {
        // Keep latest occurrence (last in file)
        const resMap = new Map<string, GdsDcfReservation>();
        reservations.forEach(res => {
          resMap.set(res.resNumber, res);
        });
        uniqueReservations = Array.from(resMap.values());
      }
      // If strategy is 'all', keep all reservations (no deduplication)
    }

    const uploadRecord = await (prisma as any).gdsDcfUpload.create({
      data: {
        filename,
        uploadedAt: new Date().toISOString(),
        recordCount: uniqueReservations.length,
        chargeableCount: 0,
        totalFees: 0,
      },
    });

    await (prisma as any).gdsDcfReservation.createMany({
      data: uniqueReservations.map((r: GdsDcfReservation) => ({
        uploadId: uploadRecord.id,
        ...r,
      })),
    });

    res.json({
      success: true,
      data: {
        uploadId: uploadRecord.id,
        filename,
        recordCount: uniqueReservations.length,
        detectedColumns,
        missingColumns,
      },
    });
  } catch (err: any) {
    next(err);
  }
});

router.post('/validate/:uploadId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const uploadId = parseInt(req.params.uploadId, 10);
    
    // Delete any existing validation results for this upload to prevent duplicates
    await (prisma as any).gdsDcfValidationResult.deleteMany({
      where: { uploadId },
    });
    
    const reservations = await (prisma as any).gdsDcfReservation.findMany({
      where: { uploadId },
    });

    if (reservations.length === 0) {
      return res.status(404).json({ success: false, error: 'Upload not found or no reservations' });
    }

    const mandants = await (prisma as any).franchiseMandant.findMany();
    const franchiseCodes = mandants.map((m: any) => m.fir);

    // Import services
    const { partnerHistoryService } = await import('../services/partnerHistoryService');
    const { regionMappingService } = await import('../services/regionMappingService');
    
    const results: GdsDcfValidationResult[] = [];

    // Process each reservation with its temporal context
    for (const reservation of reservations) {
      const handoverDate = new Date(reservation.handoverDate);
      
      // Get partners, region mappings, and validation config valid at handoverDate
      const currentPartners = await partnerHistoryService.getCurrentPartners();
      const regionMappings = await regionMappingService.getRegionMappingAtDate(handoverDate);
      const ruleConfig = await validationRuleConfigService.getConfigAtDate(handoverDate);
      
      const validator = new GdsDcfValidator(currentPartners, franchiseCodes, regionMappings, ruleConfig);
      const result = validator.validateReservation(reservation);
      results.push(result);
    }

    // Only save chargeable reservations
    const chargeableResults = results.filter(r => r.isChargeable);

    await (prisma as any).gdsDcfValidationResult.createMany({
      data: chargeableResults.map((result: GdsDcfValidationResult) => ({
        uploadId,
        reservationData: JSON.stringify(result.reservation),
        isChargeable: result.isChargeable,
        calculatedFee: result.calculatedFee,
        currency: result.currency,
        partner: result.partner,
        region: result.region,
        feeType: result.feeType,
        validationSteps: JSON.stringify(result.validationSteps),
      })),
    });

    const chargeableCount = chargeableResults.length;
    const totalFees = chargeableResults.reduce((sum, r) => sum + r.calculatedFee, 0);

    await (prisma as any).gdsDcfUpload.update({
      where: { id: uploadId },
      data: { chargeableCount, totalFees },
    });

    res.json({
      success: true,
      data: {
        totalReservations: results.length,
        chargeableReservations: chargeableCount,
        totalFees,
        results,
      },
    });
  } catch (err) {
    next(err);
  }
});

router.get('/results/:uploadId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const uploadId = parseInt(req.params.uploadId, 10);
    
    const results = await (prisma as any).gdsDcfValidationResult.findMany({
      where: { uploadId },
    });

    const upload = await (prisma as any).gdsDcfUpload.findUnique({
      where: { id: uploadId },
    });

    if (!upload) {
      return res.status(404).json({ success: false, error: 'Upload not found' });
    }

    const deserializedResults = results.map((r: any) => deserializeValidationResult(r));

    res.json({
      success: true,
      data: {
        upload,
        results: deserializedResults,
      },
    });
  } catch (err) {
    next(err);
  }
});

router.get('/uploads', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const uploads = await (prisma as any).gdsDcfUpload.findMany({
      orderBy: { uploadedAt: 'desc' },
    });

    res.json({
      success: true,
      data: uploads,
    });
  } catch (err) {
    next(err);
  }
});

router.delete('/upload/:uploadId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const uploadId = parseInt(req.params.uploadId, 10);

    // Delete validation results first (cascade should handle this, but being explicit)
    await (prisma as any).gdsDcfValidationResult.deleteMany({
      where: { uploadId },
    });

    // Delete reservations
    await (prisma as any).gdsDcfReservation.deleteMany({
      where: { uploadId },
    });

    // Delete the upload record
    await (prisma as any).gdsDcfUpload.delete({
      where: { id: uploadId },
    });

    res.json({
      success: true,
      message: 'Upload deleted successfully',
    });
  } catch (err) {
    next(err);
  }
});

router.get('/partners', async (req: Request, res: Response, next: NextFunction) => {
  try {
    let partners = await (prisma as any).gdsDcfPartner.findMany();
    
    if (partners.length === 0) {
      const defaultPartners = getDefaultPartners();
      
      for (const partner of defaultPartners) {
        await (prisma as any).gdsDcfPartner.create({
          data: serializePartner(partner),
        });
      }
      
      partners = await (prisma as any).gdsDcfPartner.findMany();
    }

    const deserializedPartners = partners.map((p: any) => deserializePartner(p));

    res.json({
      success: true,
      data: deserializedPartners,
    });
  } catch (err) {
    next(err);
  }
});

router.post('/partners', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const partnerData: any = req.body;
    
    if (!partnerData.id || !partnerData.name) {
      return res.status(400).json({ success: false, error: 'Partner id and name are required' });
    }

    const validFrom = partnerData.validFrom ? new Date(partnerData.validFrom) : new Date();
    const validTo = partnerData.validTo ? new Date(partnerData.validTo) : null;

    // Import history service
    const { partnerHistoryService } = await import('../services/partnerHistoryService');
    
    // Save to history (which manages revisions automatically)
    await partnerHistoryService.saveRevision(
      partnerData,
      validFrom,
      validTo,
      'User',
      partnerData.notes
    );

    // Also update the main partner table for backwards compatibility
    const existing = await (prisma as any).gdsDcfPartner.findUnique({
      where: { id: partnerData.id },
    });

    const serializedData = serializePartner(partnerData);

    let partner;
    if (existing) {
      partner = await (prisma as any).gdsDcfPartner.update({
        where: { id: partnerData.id },
        data: serializedData,
      });
    } else {
      partner = await (prisma as any).gdsDcfPartner.create({
        data: serializedData,
      });
    }

    res.json({
      success: true,
      data: deserializePartner(partner),
    });
  } catch (err) {
    next(err);
  }
});

router.get('/partners/:id/history', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const partnerId = req.params.id;
    
    const { partnerHistoryService } = await import('../services/partnerHistoryService');
    const history = await partnerHistoryService.getPartnerHistory(partnerId);

    res.json({
      success: true,
      data: history,
    });
  } catch (err) {
    next(err);
  }
});

// Delete a future partner version
router.delete('/partners/:id/history/:revision', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id: partnerId, revision } = req.params;
    
    // Get the revision to check if it's in the future
    const revisionData = await (prisma as any).gdsDcfPartnerHistory.findUnique({
      where: {
        partnerId_revision: {
          partnerId,
          revision: parseInt(revision),
        },
      },
    });

    if (!revisionData) {
      return res.status(404).json({
        success: false,
        error: 'Revision not found',
      });
    }

    const now = new Date();
    if (new Date(revisionData.validFrom) <= now) {
      return res.status(400).json({
        success: false,
        error: 'Can only delete future versions (validFrom > today)',
      });
    }

    // Delete the future revision
    await (prisma as any).gdsDcfPartnerHistory.delete({
      where: {
        partnerId_revision: {
          partnerId,
          revision: parseInt(revision),
        },
      },
    });

    console.log(`Deleted future partner revision: ${partnerId} rev${revision}`);

    res.json({
      success: true,
      message: `Deleted future version (revision ${revision})`,
    });
  } catch (err) {
    next(err);
  }
});

router.delete('/partners/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id;
    
    await (prisma as any).gdsDcfPartner.delete({
      where: { id },
    });

    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

router.post('/mandants/upload', upload.single('file'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No file uploaded' });
    }

    const filename = req.file.originalname;
    const isExcel = filename.endsWith('.xlsx') || filename.endsWith('.xls');

    if (!isExcel) {
      return res.status(400).json({ 
        success: false, 
        error: 'Please upload an Excel file (.xlsx or .xls)' 
      });
    }

    const { parseFranchiseMandantExcel } = await import('../services/franchiseMandantParser');
    const mandants = await parseFranchiseMandantExcel(req.file.buffer);

    await (prisma as any).franchiseMandant.deleteMany();
    await (prisma as any).franchiseMandant.createMany({ data: mandants });

    res.json({
      success: true,
      data: {
        count: mandants.length,
        mandants,
      },
    });
  } catch (err) {
    next(err);
  }
});

router.get('/mandants', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const mandants = await (prisma as any).franchiseMandant.findMany();

    res.json({
      success: true,
      data: mandants,
    });
  } catch (err) {
    next(err);
  }
});

// Get aggregated report metadata for download page
router.get('/reports', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { period, country, feeType } = req.query;

    // Build where clause
    const where: any = {};
    
    // Filter by invoicing period (extracted from handoverDate)
    if (period && typeof period === 'string') {
      // period format: "2025-01"
      where.reservation = {
        handoverDate: {
          startsWith: period
        }
      };
    }

    // Get all validation results
    const allResults = await (prisma as any).gdsDcfValidationResult.findMany({
      where,
    });

    // Deserialize and filter in memory
    const results = allResults.map((r: any) => deserializeValidationResult(r));

    // Load franchise mandants for country mapping
    const mandants = await (prisma as any).franchiseMandant.findMany();
    const mandantMap = new Map(mandants.map((m: any) => [m.fir, m]));

    // Group results
    const reportGroups = new Map<string, {
      feeType: string;
      country: string;
      countryName: string;
      fir: string;
      invoicingPeriod: string;
      totalFees: number;
      count: number;
    }>();

    for (const result of results) {
      const handoverDate = result.reservation.handoverDate;
      const invoicingPeriod = handoverDate ? handoverDate.substring(0, 7) : 'Unknown';
      
      const mandantCode = result.reservation.mandantCode;
      const mandant = mandantMap.get(mandantCode);
      const countryCode = mandant?.iso || result.reservation.posCountryCode || 'Unknown';
      const countryName = mandant?.countryName || countryCode;
      const fir = mandant?.fir || mandantCode;

      // Group GDS and DCF together as "GDS & DCF"
      const reportFeeType = (result.feeType === 'GDS' || result.feeType === 'DCF') ? 'GDS & DCF' : result.feeType;

      // Apply filters
      if (country && countryCode !== country) continue;
      if (feeType && feeType !== 'all' && reportFeeType !== feeType) continue;

      const key = `${reportFeeType}|${countryCode}|${invoicingPeriod}`;
      
      if (!reportGroups.has(key)) {
        reportGroups.set(key, {
          feeType: reportFeeType,
          country: countryCode,
          countryName,
          fir,
          invoicingPeriod,
          totalFees: 0,
          count: 0,
        });
      }

      const group = reportGroups.get(key)!;
      group.totalFees += result.calculatedFee;
      group.count += 1;
    }

    // Convert to array and sort
    const reports = Array.from(reportGroups.values())
      .sort((a, b) => {
        // Sort by period desc, then country asc
        if (a.invoicingPeriod !== b.invoicingPeriod) {
          return b.invoicingPeriod.localeCompare(a.invoicingPeriod);
        }
        return a.country.localeCompare(b.country);
      });

    res.json({
      success: true,
      data: reports,
    });
  } catch (err) {
    next(err);
  }
});

router.delete('/mandants', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await (prisma as any).franchiseMandant.deleteMany();

    res.json({
      success: true,
      data: { count: result.count },
    });
  } catch (err) {
    next(err);
  }
});

// Calculation Rules API
router.get('/rules', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { asOfDate } = req.query;
    const effectiveDate = asOfDate ? new Date(asOfDate as string) : new Date();

    const { ruleGenerator } = await import('../services/ruleGenerator');
    const snapshot = await ruleGenerator.generateRuleSnapshot(effectiveDate);

    res.json({
      success: true,
      data: {
        rules: snapshot.rules,
        validFrom: snapshot.validFrom,
        validTo: snapshot.validTo,
        version: snapshot.rulesetVersion,
      },
    });
  } catch (err) {
    next(err);
  }
});

router.get('/rules/snapshot/:snapshotId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { snapshotId } = req.params;
    const snapshot = await (prisma as any).calculationRuleSnapshot.findUnique({
      where: { id: parseInt(snapshotId) },
    });

    if (!snapshot) {
      return res.status(404).json({ success: false, error: 'Snapshot not found' });
    }

    const ruleset = JSON.parse(snapshot.fullRulesetJson);

    res.json({
      success: true,
      data: {
        ...ruleset,
        snapshotDate: snapshot.snapshotDate,
        validFrom: snapshot.validFrom,
        validTo: snapshot.validTo,
        version: snapshot.rulesetVersion,
      },
    });
  } catch (err) {
    next(err);
  }
});

router.get('/rules/snapshots', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const snapshots = await (prisma as any).calculationRuleSnapshot.findMany({
      orderBy: { snapshotDate: 'desc' },
      select: {
        id: true,
        snapshotDate: true,
        validFrom: true,
        validTo: true,
        rulesetVersion: true,
        createdBy: true,
      },
    });

    res.json({
      success: true,
      data: snapshots,
    });
  } catch (err) {
    next(err);
  }
});

router.get('/rules/export/excel', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { asOfDate } = req.query;
    const effectiveDate = asOfDate ? new Date(asOfDate as string) : new Date();

    const { ruleGenerator } = await import('../services/ruleGenerator');
    const { ruleExporter } = await import('../services/ruleExporter');
    
    const snapshot = await ruleGenerator.generateRuleSnapshot(effectiveDate);
    const buffer = await ruleExporter.generateExcel(snapshot);

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=GDS_DCF_Rules_${effectiveDate.toISOString().split('T')[0]}.xlsx`);
    res.send(buffer);
  } catch (err) {
    next(err);
  }
});

router.get('/rules/export/pdf', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { asOfDate } = req.query;
    const effectiveDate = asOfDate ? new Date(asOfDate as string) : new Date();

    const { ruleGenerator } = await import('../services/ruleGenerator');
    const { ruleExporter } = await import('../services/ruleExporter');
    
    const snapshot = await ruleGenerator.generateRuleSnapshot(effectiveDate);
    const buffer = await ruleExporter.generatePDF(snapshot);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=GDS_DCF_Rules_${effectiveDate.toISOString().split('T')[0]}.pdf`);
    res.send(buffer);
  } catch (err) {
    next(err);
  }
});

// Region-Country Mapping API
router.get('/regions', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { asOfDate } = req.query;
    const effectiveDate = asOfDate ? new Date(asOfDate as string) : new Date();

    const { regionMappingService } = await import('../services/regionMappingService');
    const regions = await regionMappingService.getAllRegions(effectiveDate);

    res.json({
      success: true,
      data: regions,
    });
  } catch (err) {
    next(err);
  }
});

router.get('/regions/:regionName/countries', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { regionName } = req.params;
    const { asOfDate } = req.query;
    const effectiveDate = asOfDate ? new Date(asOfDate as string) : new Date();

    const { regionMappingService } = await import('../services/regionMappingService');
    const countries = await regionMappingService.getCountriesInRegion(regionName, effectiveDate);

    res.json({
      success: true,
      data: countries,
    });
  } catch (err) {
    next(err);
  }
});

router.get('/regions/:regionName/history', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { regionName } = req.params;

    const history = await (prisma as any).regionCountryMapping.findMany({
      where: { regionName },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    });

    // Group by createdAt (to the second) to show all countries for each distinct save operation
    const groupedHistory = new Map();
    
    for (const mapping of history) {
      // Use createdAt timestamp for grouping, not just validFrom
      const key = new Date(mapping.createdAt).toISOString();
      if (!groupedHistory.has(key)) {
        groupedHistory.set(key, {
          validFrom: mapping.validFrom,
          validTo: mapping.validTo,
          createdBy: mapping.createdBy,
          createdAt: mapping.createdAt,
          notes: mapping.notes,
          countries: [],
        });
      }
      groupedHistory.get(key).countries.push(mapping.countryCode);
    }

    const historyArray = Array.from(groupedHistory.values()).map(h => ({
      ...h,
      countries: h.countries.sort(),
    }));

    res.json({
      success: true,
      data: historyArray,
    });
  } catch (err) {
    next(err);
  }
});

router.post('/regions', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { regionName, countryCodes, validFrom, validTo, notes } = req.body;

    console.log('POST /regions received:', {
      regionName,
      countryCodes: countryCodes?.length,
      validFrom,
      validTo,
      notes: notes ? 'present' : 'none'
    });

    if (!regionName || !countryCodes || !Array.isArray(countryCodes) || countryCodes.length === 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'Region name and country codes array are required' 
      });
    }

    const parsedValidFrom = validFrom ? new Date(validFrom) : new Date();
    console.log('Parsed validFrom:', validFrom, '→', parsedValidFrom.toISOString());

    const { regionMappingService } = await import('../services/regionMappingService');
    await regionMappingService.saveMapping(
      regionName,
      countryCodes,
      parsedValidFrom,
      validTo ? new Date(validTo) : null,
      'User',
      notes
    );

    res.json({
      success: true,
      message: `Saved ${countryCodes.length} countries to region ${regionName}`,
    });
  } catch (err: any) {
    // Return validation errors with proper status code
    if (err.message && (err.message.includes('Invalid format') || err.message.includes('already assigned'))) {
      return res.status(400).json({
        success: false,
        error: err.message,
      });
    }
    next(err);
  }
});

// Validate country codes for a region
router.post('/regions/validate', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { regionName, countryCodes } = req.body;

    if (!regionName || !countryCodes || !Array.isArray(countryCodes)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Region name and country codes array are required' 
      });
    }

    const { regionMappingService } = await import('../services/regionMappingService');
    const validation = await regionMappingService.validateCountryCodes(regionName, countryCodes);

    res.json({
      success: true,
      ...validation,
    });
  } catch (err) {
    next(err);
  }
});

router.delete('/regions/:regionName', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { regionName } = req.params;

    const { regionMappingService } = await import('../services/regionMappingService');
    await regionMappingService.deleteRegionMapping(regionName);

    res.json({
      success: true,
      message: `Region ${regionName} mapping closed`,
    });
  } catch (err) {
    next(err);
  }
});

// Delete a future region version
router.delete('/regions/:regionName/future/:validFromDate', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { regionName, validFromDate } = req.params;
    
    const targetDate = new Date(validFromDate);
    const now = new Date();
    
    // Safety check: only allow deleting future versions
    if (targetDate <= now) {
      return res.status(400).json({
        success: false,
        error: 'Can only delete future versions (validFrom > today)',
      });
    }

    // Delete all mappings for this region with this validFrom
    const result = await (prisma as any).regionCountryMapping.deleteMany({
      where: {
        regionName,
        validFrom: targetDate,
      },
    });

    console.log(`Deleted ${result.count} future mappings for ${regionName} with validFrom ${targetDate.toISOString()}`);

    res.json({
      success: true,
      message: `Deleted future version of ${regionName} (${result.count} countries)`,
      deletedCount: result.count,
    });
  } catch (err) {
    next(err);
  }
});

// ==================== Validation Rule Configuration Routes ====================

// Get current validation rule configuration
router.get('/validation-config', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const config = await validationRuleConfigService.getCurrentConfig();
    
    res.json({
      success: true,
      data: config,
    });
  } catch (err) {
    next(err);
  }
});

// Get all validation rule configurations (history)
router.get('/validation-config/history', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const configs = await validationRuleConfigService.getAllConfigs();
    
    res.json({
      success: true,
      data: configs,
    });
  } catch (err) {
    next(err);
  }
});

// Save new validation rule configuration
router.post('/validation-config', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      enableDuplicateCheck,
      enableStatusCheck,
      enableMandantCheck,
      enableChannelCheck,
      validStatuses,
      duplicateStrategy,
      validFrom,
      notes,
    } = req.body;
    
    const validFromDate = new Date(validFrom);
    
    const config = await validationRuleConfigService.saveRevision(
      {
        configId: 'default',
        enableDuplicateCheck: enableDuplicateCheck ?? true,
        enableStatusCheck: enableStatusCheck ?? true,
        enableMandantCheck: enableMandantCheck ?? true,
        enableChannelCheck: enableChannelCheck ?? true,
        validStatuses: validStatuses || ['invoice', 'no show', 'open'],
        duplicateStrategy: duplicateStrategy || 'first',
        validFrom: validFromDate,
        validTo: null,
        createdBy: 'User', // TODO: Add actual user from auth
      },
      validFromDate,
      null,
      'User', // TODO: Add actual user from auth
      notes
    );
    
    res.json({
      success: true,
      data: config,
      message: 'Validation rule configuration saved successfully',
    });
  } catch (err) {
    next(err);
  }
});

// Delete future validation rule configuration
router.delete('/validation-config/:revision', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const revision = parseInt(req.params.revision, 10);
    
    await validationRuleConfigService.deleteFutureConfig('default', revision);
    
    res.json({
      success: true,
      message: 'Future validation rule configuration deleted successfully',
    });
  } catch (err) {
    next(err);
  }
});

export default router;
