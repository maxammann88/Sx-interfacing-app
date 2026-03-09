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

export default router;
