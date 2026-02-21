import { Router, Request, Response, NextFunction } from 'express';
import archiver from 'archiver';
import prisma from '../prismaClient';
import { generateStatement } from '../services/statementService';
import { generateStatementHtml, generatePdf } from '../services/pdfService';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function buildFilename(fir: number, iso: string, period: string): string {
  const year = period.substring(0, 4);
  const month = parseInt(period.substring(4, 6), 10);
  return `INT_${period}_${fir}_${iso}_Interfacing ${MONTH_NAMES[month - 1]} ${year}.pdf`;
}

const router = Router();

router.get('/bulk/pdf', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const period = req.query.period as string;
    const releaseDate = (req.query.releaseDate as string) || new Date().toISOString().split('T')[0];
    const paymentTermDays = parseInt((req.query.paymentTermDays as string) || '30', 10);

    if (!period) {
      return res.status(400).json({ success: false, error: 'Abrechnungsperiode (period) fehlt' });
    }

    const countries = await prisma.country.findMany({
      where: { partnerStatus: { contains: 'aktiv', mode: 'insensitive' } },
      orderBy: { fir: 'asc' },
    });

    const year = period.substring(0, 4);
    const month = parseInt(period.substring(4, 6), 10);
    const zipFilename = `Interfacing_${MONTH_NAMES[month - 1]}_${year}.zip`;

    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="${zipFilename}"`);

    const archive = archiver('zip', { zlib: { level: 5 } });
    archive.pipe(res);

    const puppeteer = require('puppeteer');
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu'],
    });

    try {
      const page = await browser.newPage();

      for (let i = 0; i < countries.length; i++) {
        const country = countries[i];
        try {
          console.log(`[Bulk PDF] ${i + 1}/${countries.length}: ${country.fir} ${country.name}`);
          const statement = await generateStatement(country.id, period, releaseDate, paymentTermDays);
          const html = generateStatementHtml(statement);
          await page.setContent(html, { waitUntil: 'domcontentloaded', timeout: 10000 });
          const pdfBuffer = await page.pdf({
            format: 'A4',
            printBackground: true,
            margin: { top: '15mm', bottom: '15mm', left: '10mm', right: '10mm' },
          });
          const filename = buildFilename(country.fir, country.iso, period);
          archive.append(Buffer.from(pdfBuffer), { name: filename });
        } catch (e) {
          console.error(`[Bulk PDF] Fehler bei ${country.fir} ${country.name}:`, e);
        }
      }
      console.log(`[Bulk PDF] Fertig: ${countries.length} Länder verarbeitet`);
    } finally {
      await browser.close();
    }

    await archive.finalize();
  } catch (err) {
    next(err);
  }
});

router.get('/:countryId/preview', async (req: Request, res: Response, next: NextFunction) => {
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
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(html);
  } catch (err) {
    next(err);
  }
});

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

    const filename = buildFilename(statement.country.fir, statement.country.iso, period);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(pdf);
  } catch (err) {
    next(err);
  }
});

export default router;
