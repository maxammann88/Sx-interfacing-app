import { Router, Request, Response, NextFunction } from 'express';
import prisma from '../prismaClient';

const router = Router();

router.get('/', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const plans = await prisma.interfacingPlan.findMany({
      orderBy: { period: 'asc' },
    });
    res.json({ success: true, data: plans });
  } catch (err) {
    next(err);
  }
});

router.get('/assignments', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { period } = req.query;
    const where = period ? { period: period as string } : {};
    const assignments = await prisma.countryPlanAssignment.findMany({ where });
    res.json({ success: true, data: assignments });
  } catch (err) {
    next(err);
  }
});

router.put('/assignments/:period/:countryId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const period = req.params.period as string;
    const countryId = parseInt(req.params.countryId as string, 10);
    const { creator, reviewer } = req.body;

    const assignment = await prisma.countryPlanAssignment.upsert({
      where: { period_countryId: { period, countryId } },
      update: { creator: creator || null, reviewer: reviewer || null },
      create: { period, countryId, creator: creator || null, reviewer: reviewer || null },
    });

    res.json({ success: true, data: assignment });
  } catch (err) {
    next(err);
  }
});

router.get('/:period', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const plan = await prisma.interfacingPlan.findUnique({
      where: { period: req.params.period as string },
    });
    res.json({ success: true, data: plan });
  } catch (err) {
    next(err);
  }
});

router.put('/:period', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const period = req.params.period as string;
    const { releaseDate, creator, reviewer } = req.body;

    const plan = await prisma.interfacingPlan.upsert({
      where: { period },
      update: { releaseDate, creator, reviewer },
      create: { period, releaseDate, creator, reviewer },
    });

    res.json({ success: true, data: plan });
  } catch (err) {
    next(err);
  }
});

export default router;
