import { Router, Request, Response, NextFunction } from 'express';
import prisma from '../prismaClient';

const router = Router();

router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status } = req.query;
    const where: any = {};

    if (status === 'aktiv') {
      where.partnerStatus = { contains: 'aktiv', mode: 'insensitive' };
    } else if (status === 'inaktiv') {
      where.partnerStatus = { contains: 'inaktiv', mode: 'insensitive' };
    }

    const countries = await prisma.country.findMany({
      where,
      orderBy: [{ fir: 'asc' }],
    });

    res.json({ success: true, data: countries });
  } catch (err) {
    next(err);
  }
});

router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = parseInt(req.params.id as string, 10);
    const country = await prisma.country.findUnique({ where: { id } });
    if (!country) return res.status(404).json({ success: false, error: 'Land nicht gefunden' });
    res.json({ success: true, data: country });
  } catch (err) {
    next(err);
  }
});

export default router;
