import { Router, Request, Response, NextFunction } from 'express';
import multer from 'multer';
import prisma from '../prismaClient';
import { parseGdsDcfExcel, parseGdsDcfCsv } from '../services/gdsDcfParser';
import { GdsDcfValidator, getDefaultPartners } from '../services/gdsDcfValidator';
import { GdsDcfPartner, GdsDcfReservation, GdsDcfValidationResult } from '@sixt/shared';
import { serializePartner, deserializePartner, deserializeValidationResult } from '../utils/jsonHelpers';

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

    const uploadRecord = await (prisma as any).gdsDcfUpload.create({
      data: {
        filename,
        uploadedAt: new Date().toISOString(),
        recordCount: reservations.length,
        chargeableCount: 0,
        totalFees: 0,
      },
    });

    await (prisma as any).gdsDcfReservation.createMany({
      data: reservations.map((r: GdsDcfReservation) => ({
        uploadId: uploadRecord.id,
        ...r,
      })),
    });

    res.json({
      success: true,
      data: {
        uploadId: uploadRecord.id,
        filename,
        recordCount: reservations.length,
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
    
    const partners = await (prisma as any).gdsDcfPartner.findMany();
    const partnerConfigs = partners.length > 0 
      ? partners.map((p: any) => deserializePartner(p))
      : getDefaultPartners();
    
    const reservations = await (prisma as any).gdsDcfReservation.findMany({
      where: { uploadId },
    });

    if (reservations.length === 0) {
      return res.status(404).json({ success: false, error: 'Upload not found or no reservations' });
    }

    const mandants = await (prisma as any).franchiseMandant.findMany();
    const franchiseCodes = mandants.map((m: any) => m.fir);
    const validator = new GdsDcfValidator(partnerConfigs, franchiseCodes);

    const results: GdsDcfValidationResult[] = reservations.map((r: GdsDcfReservation) => 
      validator.validateReservation(r)
    );

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
    const partnerData: GdsDcfPartner = req.body;
    
    if (!partnerData.id || !partnerData.name) {
      return res.status(400).json({ success: false, error: 'Partner id and name are required' });
    }

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

export default router;
