import { Router, Request, Response, NextFunction } from 'express';
import { generateStatement } from '../services/statementService';
import { generateStatementHtml, generatePdf } from '../services/pdfService';

const router = Router();

router.get('/:countryId/pdf', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const countryId = parseInt(req.params.countryId as string, 10);
    const period = req.query.period as string;
    const releaseDate = (req.query.releaseDate as string) || new Date().toISOString().split('T')[0];
    const paymentTermDays = parseInt((req.query.paymentTermDays as string) || '30', 10);

    if (!period) {
      return res.status(400).json({ success: false, error: 'Abrechnungsperiode (period) fehlt' });
    }

    const statement = await generateStatement(countryId, period, releaseDate, paymentTermDays);
    const html = generateStatementHtml(statement);
    const pdf = await generatePdf(html);

    const filename = `Interfacing_${statement.country.fir}_${statement.country.name}_${period}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(pdf);
  } catch (err) {
    next(err);
  }
});

export default router;
