import { Router, Request, Response, NextFunction } from 'express';
import prisma from '../prismaClient';

const router = Router();

export type SubAppOwnerEntry = {
  stream: string;
  streamOwner: string;
  app: string;
  owner: string;
  status: string;
  description: string;
  deadlineTarget?: string;
  budgetHours?: number;
};

// GET: full registry + stream order (for frontend)
router.get('/', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const streams = await prisma.stream.findMany({
      orderBy: { sortOrder: 'asc' },
      include: { subApps: true },
    });
    const streamOrder = streams.map((s) => s.name);
    const registry: SubAppOwnerEntry[] = streams.flatMap((s) =>
      s.subApps.map((a) => ({
        stream: s.name,
        streamOwner: s.streamOwner || '',
        app: a.app,
        owner: a.owner || '',
        status: a.status,
        description: a.description || '',
        deadlineTarget: a.deadlineTarget || undefined,
        budgetHours: a.budgetHours ?? undefined,
      }))
    );
    res.json({ streamOrder, registry });
  } catch (err) {
    next(err);
  }
});

// PUT: replace full registry + stream order
router.put('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { streamOrder, registry: rawRegistry } = req.body as {
      streamOrder?: string[];
      registry: SubAppOwnerEntry[];
    };
    if (!Array.isArray(rawRegistry)) {
      return res.status(400).json({ error: 'registry array required' });
    }
    const registry = rawRegistry.map((r: SubAppOwnerEntry) => ({
      ...r,
      status: (r.status === 'Planned' ? 'Planning' : r.status) || 'Planning',
    }));

    await prisma.$transaction(async (tx) => {
      await tx.subApp.deleteMany({});
      await tx.stream.deleteMany({});

      const order = Array.isArray(streamOrder) && streamOrder.length > 0
        ? streamOrder
        : [...new Set(registry.map((r: SubAppOwnerEntry) => r.stream))];

      const streamNames = [...new Set(registry.map((r: SubAppOwnerEntry) => r.stream))];
      const sortedStreams = order.filter((s) => streamNames.includes(s));
      streamNames.forEach((s) => {
        if (!sortedStreams.includes(s)) sortedStreams.push(s);
      });

      for (let i = 0; i < sortedStreams.length; i++) {
        const name = sortedStreams[i];
        const entries = registry.filter((r: SubAppOwnerEntry) => r.stream === name);
        const streamOwner = entries[0]?.streamOwner || '';
        const stream = await tx.stream.create({
          data: {
            name,
            sortOrder: i,
            streamOwner: streamOwner || null,
          },
        });
        for (const e of entries) {
          await tx.subApp.create({
            data: {
              streamId: stream.id,
              app: e.app,
              owner: e.owner || null,
              status: e.status || 'Planning',
              description: e.description || null,
              deadlineTarget: e.deadlineTarget || null,
              budgetHours: typeof e.budgetHours === 'number' ? e.budgetHours : null,
            },
          });
        }
      }
    });

    const streams = await prisma.stream.findMany({
      orderBy: { sortOrder: 'asc' },
      include: { subApps: true },
    });
    const newOrder = streams.map((s) => s.name);
    const newRegistry: SubAppOwnerEntry[] = streams.flatMap((s) =>
      s.subApps.map((a) => ({
        stream: s.name,
        streamOwner: s.streamOwner || '',
        app: a.app,
        owner: a.owner || '',
        status: a.status,
        description: a.description || '',
        deadlineTarget: a.deadlineTarget || undefined,
        budgetHours: a.budgetHours ?? undefined,
      }))
    );
    res.json({ streamOrder: newOrder, registry: newRegistry });
  } catch (err) {
    next(err);
  }
});

export default router;
