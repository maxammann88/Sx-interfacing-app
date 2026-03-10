import { Router, Request, Response, NextFunction } from 'express';
import prisma from '../prismaClient';
import { GdsDcfExporter } from '../services/gdsDcfExporter';
import { deserializeValidationResult } from '../utils/jsonHelpers';

const router = Router();

// Export results as PDF
router.get('/pdf/:uploadId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const uploadId = parseInt(req.params.uploadId, 10);
    
    const results = await (prisma as any).gdsDcfValidationResult.findMany({
      where: { uploadId },
    });

    if (results.length === 0) {
      return res.status(404).json({ success: false, error: 'No results found for this upload' });
    }

    const deserializedResults = results.map((r: any) => deserializeValidationResult(r));

    const exporter = new GdsDcfExporter(deserializedResults);
    const pdfBuffer = await exporter.generatePDF();

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="GDS_DCF_Report_${uploadId}.pdf"`);
    res.send(pdfBuffer);
  } catch (err) {
    next(err);
  }
});

// Export results as Excel
router.get('/excel/:uploadId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const uploadId = parseInt(req.params.uploadId, 10);
    
    const results = await (prisma as any).gdsDcfValidationResult.findMany({
      where: { uploadId },
    });

    if (results.length === 0) {
      return res.status(404).json({ success: false, error: 'No results found for this upload' });
    }

    const deserializedResults = results.map((r: any) => deserializeValidationResult(r));

    const exporter = new GdsDcfExporter(deserializedResults);
    const excelBuffer = await exporter.generateExcel();

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="GDS_DCF_Report_${uploadId}.xlsx"`);
    res.send(excelBuffer);
  } catch (err) {
    next(err);
  }
});

// Export filtered results as Excel (for download page)
router.get('/excel-filtered/:country/:period/:feeType', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { country, period, feeType } = req.params;

    // Get all validation results
    const allResults = await (prisma as any).gdsDcfValidationResult.findMany();
    const results = allResults.map((r: any) => deserializeValidationResult(r));

    // Load franchise mandants for country mapping
    const mandants = await (prisma as any).franchiseMandant.findMany();
    const mandantMap = new Map(mandants.map((m: any) => [m.fir, m]));

    // Filter results
    const filteredResults = results.filter((result: any) => {
      // Filter by period
      const handoverDate = result.reservation.handoverDate;
      const invoicingPeriod = handoverDate ? handoverDate.substring(0, 7) : '';
      if (invoicingPeriod !== period) return false;

      // Filter by country
      const mandantCode = result.reservation.mandantCode;
      const mandant = mandantMap.get(mandantCode);
      const countryCode = mandant?.iso || result.reservation.posCountryCode;
      if (countryCode !== country) return false;

      // Filter by fee type
      if (feeType === 'GDS & DCF') {
        return result.feeType === 'GDS' || result.feeType === 'DCF';
      }
      return result.feeType === feeType;
    });

    if (filteredResults.length === 0) {
      return res.status(404).json({ success: false, error: 'No results found for these filters' });
    }

    const exporter = new GdsDcfExporter(filteredResults, country);
    const excelBuffer = await exporter.generateExcel();

    const filename = `${feeType.replace(' & ', '_')}_${country}_${period}.xlsx`;
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(excelBuffer);
  } catch (err) {
    next(err);
  }
});

export default router;
