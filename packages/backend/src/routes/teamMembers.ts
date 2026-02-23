import { Router, Request, Response, NextFunction } from 'express';
import prisma from '../prismaClient';

const router = Router();

router.get('/', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const list = await prisma.teamMember.findMany({
      orderBy: { name: 'asc' },
    });
    res.json(list.map((m) => ({ name: m.name, role: m.role || '', stream: m.stream || '' })));
  } catch (err) {
    next(err);
  }
});

router.put('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const body = req.body as { name?: string; role?: string; stream?: string }[];
    if (!Array.isArray(body)) {
      return res.status(400).json({ error: 'Array of { name, role?, stream? } required' });
    }
    await prisma.$transaction(async (tx) => {
      await tx.teamMember.deleteMany({});
      for (const row of body) {
        const name = String(row?.name ?? '').trim();
        if (!name) continue;
        await tx.teamMember.upsert({
          where: { name },
          update: { role: (row.role !== undefined && row.role !== '') ? row.role : null, stream: (row.stream !== undefined && row.stream !== '') ? row.stream : null },
          create: {
            name,
            role: (row.role !== undefined && row.role !== '') ? row.role : null,
            stream: (row.stream !== undefined && row.stream !== '') ? row.stream : null,
          },
        });
      }
    });
    const list = await prisma.teamMember.findMany({ orderBy: { name: 'asc' } });
    res.json(list.map((m) => ({ name: m.name, role: m.role || '', stream: m.stream || '' })));
  } catch (err) {
    console.error('[team-members PUT]', err);
    next(err);
  }
});

export default router;
