import { Router, Request, Response, NextFunction } from 'express';
import multer from 'multer';
import prisma from '../prismaClient';
import { parseGdsDcfExcel, parseGdsDcfCsv } from '../services/gdsDcfParser';
import { GdsDcfValidator, getDefaultPartners } from '../services/gdsDcfValidator';
import { GdsDcfPartner, GdsDcfReservation, GdsDcfValidationResult } from '@sixt/shared';

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

    let reservations: GdsDcfReservation[];

    if (isExcel) {
      reservations = await parseGdsDcfExcel(req.file.buffer);
    } else if (isCsv) {
      const content = req.file.buffer.toString('utf-8');
      reservations = parseGdsDcfCsv(content);
    } else {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid file format. Please upload .xlsx, .xls, or .csv file' 
      });
    }

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
    const partnerConfigs = partners.length > 0 ? partners : getDefaultPartners();
    
    const reservations = await (prisma as any).gdsDcfReservation.findMany({
      where: { uploadId },
    });

    if (reservations.length === 0) {
      return res.status(404).json({ success: false, error: 'Upload not found or no reservations' });
    }

    const franchiseCodes = ['08234'];
    const validator = new GdsDcfValidator(partnerConfigs, franchiseCodes);

    const results: GdsDcfValidationResult[] = reservations.map((r: GdsDcfReservation) => 
      validator.validateReservation(r)
    );

    await (prisma as any).gdsDcfValidationResult.createMany({
      data: results.map((result: GdsDcfValidationResult) => ({
        uploadId,
        reservationData: result.reservation,
        isChargeable: result.isChargeable,
        calculatedFee: result.calculatedFee,
        currency: result.currency,
        partner: result.partner,
        region: result.region,
        validationSteps: result.validationSteps,
      })),
    });

    const chargeableCount = results.filter(r => r.isChargeable).length;
    const totalFees = results
      .filter(r => r.isChargeable)
      .reduce((sum, r) => sum + r.calculatedFee, 0);

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

    res.json({
      success: true,
      data: {
        upload,
        results,
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

router.get('/partners', async (req: Request, res: Response, next: NextFunction) => {
  try {
    let partners = await (prisma as any).gdsDcfPartner.findMany();
    
    if (partners.length === 0) {
      const defaultPartners = getDefaultPartners();
      
      for (const partner of defaultPartners) {
        await (prisma as any).gdsDcfPartner.create({
          data: partner,
        });
      }
      
      partners = await (prisma as any).gdsDcfPartner.findMany();
    }

    res.json({
      success: true,
      data: partners,
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

    let partner;
    if (existing) {
      partner = await (prisma as any).gdsDcfPartner.update({
        where: { id: partnerData.id },
        data: partnerData,
      });
    } else {
      partner = await (prisma as any).gdsDcfPartner.create({
        data: partnerData,
      });
    }

    res.json({
      success: true,
      data: partner,
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

export default router;
