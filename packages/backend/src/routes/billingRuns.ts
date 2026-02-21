import { Router, Request, Response, NextFunction } from 'express';
import prisma from '../prismaClient';

const router = Router();

router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { accountingPeriod, releaseDate, paymentTermDays = 30 } = req.body;

    if (!accountingPeriod || !releaseDate) {
      return res.status(400).json({
        success: false,
        error: 'accountingPeriod und releaseDate sind erforderlich',
      });
    }

    const billingRun = await prisma.billingRun.create({
      data: {
        accountingPeriod,
        releaseDate: new Date(releaseDate),
        paymentTermDays,
      },
    });

    res.json({ success: true, data: billingRun });
  } catch (err) {
    next(err);
  }
});

router.get('/', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const runs = await prisma.billingRun.findMany({
      orderBy: { createdAt: 'desc' },
    });
    res.json({ success: true, data: runs });
  } catch (err) {
    next(err);
  }
});

export default router;
