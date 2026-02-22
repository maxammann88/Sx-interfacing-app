import { Router, Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const app = req.query.app as string | undefined;
    const where = app ? { app } : {};
    const items = await prisma.feedbackItem.findMany({
      where,
      include: { comments: { orderBy: { createdAt: 'asc' } } },
      orderBy: { createdAt: 'desc' },
    });
    res.json(items);
  } catch (err) { next(err); }
});

router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { app, author, type, title, description, deadlineWeek, assignee, deadlineDate, automationFTE, codingEffort, peakPercent } = req.body;
    if (!type || !title) {
      return res.status(400).json({ error: 'type and title are required' });
    }
    const item = await prisma.feedbackItem.create({
      data: {
        app: app || 'Interfacing',
        author: author || null,
        type,
        title,
        description: description || null,
        deadlineWeek: deadlineWeek || null,
        assignee: assignee || null,
        deadlineDate: deadlineDate ? new Date(deadlineDate) : null,
        automationFTE: typeof automationFTE === 'number' ? automationFTE : 0,
        codingEffort: typeof codingEffort === 'number' ? codingEffort : 0,
        peakPercent: typeof peakPercent === 'number' ? peakPercent : 0,
      },
      include: { comments: true },
    });
    res.status(201).json(item);
  } catch (err) { next(err); }
});

router.patch('/:id/app', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = parseInt(req.params.id as string, 10);
    const { app } = req.body;
    if (!app) return res.status(400).json({ error: 'app is required' });
    const item = await prisma.feedbackItem.update({
      where: { id },
      data: { app },
      include: { comments: { orderBy: { createdAt: 'asc' } } },
    });
    res.json(item);
  } catch (err) { next(err); }
});

router.patch('/:id/assignee', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = parseInt(req.params.id as string, 10);
    const { assignee } = req.body;
    const item = await prisma.feedbackItem.update({
      where: { id },
      data: { assignee: assignee || null },
      include: { comments: { orderBy: { createdAt: 'asc' } } },
    });
    res.json(item);
  } catch (err) { next(err); }
});

router.patch('/:id/status', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = parseInt(req.params.id as string, 10);
    const { status } = req.body;
    if (!status) return res.status(400).json({ error: 'status is required' });
    const item = await prisma.feedbackItem.update({
      where: { id },
      data: { status },
      include: { comments: { orderBy: { createdAt: 'asc' } } },
    });
    res.json(item);
  } catch (err) { next(err); }
});

router.patch('/:id/notes', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = parseInt(req.params.id as string, 10);
    const { notes } = req.body;
    const item = await prisma.feedbackItem.update({
      where: { id },
      data: { notes: notes ?? null },
      include: { comments: { orderBy: { createdAt: 'asc' } } },
    });
    res.json(item);
  } catch (err) { next(err); }
});

router.patch('/:id/links', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = parseInt(req.params.id as string, 10);
    const { jiraUrl, confluenceUrl } = req.body;
    const item = await prisma.feedbackItem.update({
      where: { id },
      data: {
        ...(jiraUrl !== undefined && { jiraUrl: jiraUrl || null }),
        ...(confluenceUrl !== undefined && { confluenceUrl: confluenceUrl || null }),
      },
      include: { comments: { orderBy: { createdAt: 'asc' } } },
    });
    res.json(item);
  } catch (err) { next(err); }
});

router.patch('/:id/deadline', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = parseInt(req.params.id as string, 10);
    const { deadlineWeek, deadlineDate } = req.body;

    const existing = await prisma.feedbackItem.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: 'not found' });

    const history: any[] = Array.isArray(existing.deadlineHistory) ? existing.deadlineHistory as any[] : [];

    const oldDate = existing.deadlineDate ? (existing.deadlineDate as Date).toISOString().split('T')[0] : null;
    const newDate = deadlineDate || null;
    if (oldDate !== newDate) {
      history.push({
        from: oldDate,
        to: newDate,
        changedAt: new Date().toISOString(),
      });
    }

    const item = await prisma.feedbackItem.update({
      where: { id },
      data: {
        deadlineWeek: deadlineWeek !== undefined ? (deadlineWeek || null) : undefined,
        deadlineDate: newDate ? new Date(newDate) : null,
        deadlineHistory: history,
      },
      include: { comments: { orderBy: { createdAt: 'asc' } } },
    });
    res.json(item);
  } catch (err) { next(err); }
});

router.patch('/:id/automation-fte', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = parseInt(req.params.id as string, 10);
    const { automationFTE } = req.body;
    const item = await prisma.feedbackItem.update({
      where: { id },
      data: { automationFTE: typeof automationFTE === 'number' ? automationFTE : 0 },
      include: { comments: { orderBy: { createdAt: 'asc' } } },
    });
    res.json(item);
  } catch (err) { next(err); }
});

router.patch('/:id/coding-effort', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = parseInt(req.params.id as string, 10);
    const { codingEffort } = req.body;
    const item = await prisma.feedbackItem.update({
      where: { id },
      data: { codingEffort: typeof codingEffort === 'number' ? codingEffort : 0 },
      include: { comments: { orderBy: { createdAt: 'asc' } } },
    });
    res.json(item);
  } catch (err) { next(err); }
});

router.patch('/:id/peak-percent', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = parseInt(req.params.id as string, 10);
    const { peakPercent } = req.body;
    const item = await prisma.feedbackItem.update({
      where: { id },
      data: { peakPercent: typeof peakPercent === 'number' ? peakPercent : 0 },
      include: { comments: { orderBy: { createdAt: 'asc' } } },
    });
    res.json(item);
  } catch (err) { next(err); }
});

router.get('/automation-summary', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const items = await prisma.feedbackItem.findMany({
      where: { type: 'feature' },
      select: { app: true, automationFTE: true, status: true },
    });
    const byApp: Record<string, { totalFTE: number; doneFTE: number; count: number }> = {};
    items.forEach(i => {
      const app = i.app || 'Interfacing';
      if (!byApp[app]) byApp[app] = { totalFTE: 0, doneFTE: 0, count: 0 };
      byApp[app].totalFTE += i.automationFTE;
      byApp[app].count++;
      if (i.status === 'done') byApp[app].doneFTE += i.automationFTE;
    });
    res.json(byApp);
  } catch (err) { next(err); }
});

router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = parseInt(req.params.id as string, 10);
    await prisma.feedbackItem.delete({ where: { id } });
    res.json({ success: true });
  } catch (err) { next(err); }
});

router.post('/:id/comments', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const feedbackId = parseInt(req.params.id as string, 10);
    const { text, author } = req.body;
    if (!text) return res.status(400).json({ error: 'text is required' });
    const comment = await prisma.feedbackComment.create({
      data: { feedbackId, text, author: author || 'User' },
    });
    res.status(201).json(comment);
  } catch (err) { next(err); }
});

export default router;
