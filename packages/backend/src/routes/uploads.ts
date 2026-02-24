import { Router, Request, Response, NextFunction } from 'express';
import multer from 'multer';
import prisma from '../prismaClient';
import { parseSapCsv, parseCountryCsv, parseBillingCostCsv } from '../services/csvParser';

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 50 * 1024 * 1024 } });

router.post('/sap', upload.single('file'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, error: 'Keine Datei hochgeladen' });

    const accountingPeriod = req.body.accountingPeriod;
    if (!accountingPeriod) return res.status(400).json({ success: false, error: 'Abrechnungsmonat fehlt' });

    const content = req.file.buffer.toString('utf-8');
    const rows = parseSapCsv(content);

    const uploadRecord = await prisma.upload.create({
      data: {
        filename: req.file.originalname,
        uploadType: 'sap',
        accountingPeriod,
        recordCount: rows.length,
      },
    });

    const BATCH_SIZE = 500;
    for (let i = 0; i < rows.length; i += BATCH_SIZE) {
      const batch = rows.slice(i, i + BATCH_SIZE);
      await prisma.sapImport.createMany({
        data: batch.map((row) => ({
          uploadId: uploadRecord.id,
          konto: row.konto,
          buchungsschluessel: row.buchungsschluessel,
          belegart: row.belegart,
          referenzschluessel3: row.referenzschluessel3,
          referenz: row.referenz,
          zuordnung: row.zuordnung,
          buchungsperiode: row.buchungsperiode,
          buchungsdatum: row.buchungsdatum,
          belegdatum: row.belegdatum,
          nettofaelligkeit: row.nettofaelligkeit,
          kontoGegenbuchung: row.kontoGegenbuchung,
          sollHabenKennz: row.sollHabenKennz,
          steuerkennzeichen: row.steuerkennzeichen,
          belegnummer: row.belegnummer,
          p: row.p,
          ausgleichsdatum: row.ausgleichsdatum,
          text: row.text,
          belegkopftext: row.belegkopftext,
          buchungsprogramm: row.buchungsprogramm,
          betragHauswaehrung: row.betragHauswaehrung,
          hauswaehrung: row.hauswaehrung,
          type: row.type,
        })),
      });
    }

    res.json({
      success: true,
      data: uploadRecord,
      message: `${rows.length} Datensätze importiert`,
    });
  } catch (err) {
    next(err);
  }
});

router.post('/countries', upload.single('file'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, error: 'Keine Datei hochgeladen' });

    const content = req.file.buffer.toString('utf-8');
    const rows = parseCountryCsv(content);

    await prisma.country.deleteMany();

    const uploadRecord = await prisma.upload.create({
      data: {
        filename: req.file.originalname,
        uploadType: 'countries',
        recordCount: rows.length,
      },
    });

    for (const row of rows) {
      await prisma.country.create({
        data: {
          fir: row.fir,
          debitor1: row.debitor1,
          iso: row.iso,
          kst: row.kst,
          name: row.name,
          comment: row.comment || null,
          verrkto: row.verrkto || null,
          kreditor: row.kreditor || null,
          revc: row.revc || null,
          debitor760: row.debitor760 || null,
          kreditor760: row.kreditor760 || null,
          stSchlLstRe: row.stSchlLstRe || null,
          stSchlLstGs: row.stSchlLstGs || null,
          revc2: row.revc2 || null,
          stSchlLiefRe: row.stSchlLiefRe || null,
          emails: row.emails || null,
          partnerStatus: row.partnerStatus || null,
          zusatz: row.zusatz || null,
          finalInterfacing: row.finalInterfacing || null,
          vertragsende: row.vertragsende,
          debitor10: row.debitor10 || null,
        },
      });
    }

    res.json({
      success: true,
      data: uploadRecord,
      message: `${rows.length} Länder importiert`,
    });
  } catch (err) {
    next(err);
  }
});

router.post('/master-data', upload.single('file'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, error: 'Keine Datei hochgeladen' });

    let content = req.file.buffer.toString('utf-8');
    if (content.charCodeAt(0) === 0xFEFF) content = content.slice(1);
    const { parse } = require('csv-parse/sync');
    const records = parse(content, {
      delimiter: ';',
      columns: true,
      skip_empty_lines: true,
      trim: true,
      relax_column_count: true,
    });

    await prisma.masterData.deleteMany();

    const uploadRecord = await prisma.upload.create({
      data: {
        filename: req.file.originalname,
        uploadType: 'master-data',
        recordCount: records.length,
      },
    });

    for (const row of records) {
      const ktod = row['ktod'] || '';
      if (!ktod) continue;

      await prisma.masterData.upsert({
        where: { ktod },
        update: {
          uid: (row['uid_'] || '').trim() || null,
          nam1: row['nam1'] || null,
          nam2: row['nam2'] || null,
          nam3: row['nam3'] || null,
          str: row['str'] || null,
          ort: row['ort'] || null,
          plz: row['plz'] || null,
          lanb: row['lanb'] || null,
          payt: row['payt'] ? parseInt(row['payt'], 10) : null,
        },
        create: {
          uid: (row['uid_'] || '').trim() || null,
          ktod,
          nam1: row['nam1'] || null,
          nam2: row['nam2'] || null,
          nam3: row['nam3'] || null,
          str: row['str'] || null,
          ort: row['ort'] || null,
          plz: row['plz'] || null,
          lanb: row['lanb'] || null,
          payt: row['payt'] ? parseInt(row['payt'], 10) : null,
        },
      });
    }

    res.json({
      success: true,
      data: uploadRecord,
      message: `${records.length} Stammdaten importiert`,
    });
  } catch (err) {
    next(err);
  }
});

router.post('/billing-costs', upload.single('file'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, error: 'Keine Datei hochgeladen' });

    const content = req.file.buffer.toString('utf-8');
    const rows = parseBillingCostCsv(content);

    const uploadRecord = await prisma.upload.create({
      data: {
        filename: req.file.originalname,
        uploadType: 'billing-costs',
        accountingPeriod: req.body.accountingPeriod || null,
        recordCount: rows.length,
      },
    });

    const BATCH_SIZE = 500;
    for (let i = 0; i < rows.length; i += BATCH_SIZE) {
      const batch = rows.slice(i, i + BATCH_SIZE);
      await prisma.billingCostImport.createMany({
        data: batch.map((row) => ({
          uploadId: uploadRecord.id,
          yearMonth: row.yearMonth || null,
          companyCode: row.companyCode,
          postingDate: row.postingDate,
          offsettingAcctNo: row.offsettingAcctNo || null,
          assignment: row.assignment || null,
          documentType: row.documentType || null,
          documentDate: row.documentDate,
          postingKey: row.postingKey || null,
          debitCreditInd: row.debitCreditInd || null,
          amountLocalCurrency: row.amountLocalCurrency,
          localCurrency: row.localCurrency || null,
          taxCode: row.taxCode || null,
          text: row.text || null,
          postingPeriod: row.postingPeriod || null,
          costCenter: row.costCenter || null,
          bookingProgram: row.bookingProgram || null,
          account: row.account || null,
          entryDate: row.entryDate,
        })),
      });
    }

    res.json({
      success: true,
      data: uploadRecord,
      message: `${rows.length} Datensätze importiert (Daten angehängt)`,
    });
  } catch (err) {
    next(err);
  }
});

router.post('/deposit', upload.single('file'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, error: 'No file uploaded' });

    let content = req.file.buffer.toString('utf-8');
    if (content.charCodeAt(0) === 0xFEFF) content = content.slice(1);
    const { parse } = require('csv-parse/sync');
    const records = parse(content, {
      delimiter: ';',
      columns: true,
      skip_empty_lines: true,
      trim: true,
      relax_column_count: true,
    });

    const uploadRecord = await prisma.upload.create({
      data: {
        filename: req.file.originalname,
        uploadType: 'deposit',
        recordCount: records.length,
      },
    });

    res.json({
      success: true,
      data: uploadRecord,
      message: `${records.length} deposit records imported`,
    });
  } catch (err) {
    next(err);
  }
});

router.get('/', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const uploads = await prisma.upload.findMany({
      orderBy: { uploadedAt: 'desc' },
    });
    res.json({ success: true, data: uploads });
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = parseInt(req.params.id as string, 10);
    await prisma.upload.delete({ where: { id } });
    res.json({ success: true, message: 'Upload gelöscht' });
  } catch (err) {
    next(err);
  }
});

export default router;
