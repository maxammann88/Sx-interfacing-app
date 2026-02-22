import { Router, Request, Response, NextFunction } from 'express';
import prisma from '../prismaClient';

const router = Router();

router.get('/', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const countries = await prisma.country.findMany({
      orderBy: { fir: 'asc' },
    });

    const masterDataMap = new Map<string, any>();
    const allMasterData = await prisma.masterData.findMany();
    for (const md of allMasterData) {
      masterDataMap.set(md.ktod, md);
    }

    const combined = countries.map((country) => ({
      ...country,
      masterData:
        masterDataMap.get(country.debitor1) ||
        (country.kreditor ? masterDataMap.get(country.kreditor) : null) ||
        null,
    }));

    res.json({ success: true, data: combined });
  } catch (err) {
    next(err);
  }
});

router.patch('/:id/payment-block', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = parseInt(req.params.id as string, 10);
    const { paymentBlock } = req.body;
    const country = await prisma.country.update({
      where: { id },
      data: { paymentBlock: !!paymentBlock },
    });
    res.json({ success: true, data: country });
  } catch (err) {
    next(err);
  }
});

export default router;
