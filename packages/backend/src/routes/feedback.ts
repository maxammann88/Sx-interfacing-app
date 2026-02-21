import { Router, Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

router.get('/', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const items = await prisma.feedbackItem.findMany({
      include: { comments: { orderBy: { createdAt: 'asc' } } },
      orderBy: { createdAt: 'desc' },
    });
    res.json(items);
  } catch (err) { next(err); }
});

router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { type, title, description } = req.body;
    if (!type || !title) {
      return res.status(400).json({ error: 'type and title are required' });
    }
    const item = await prisma.feedbackItem.create({
      data: { type, title, description: description || null },
      include: { comments: true },
    });
    res.status(201).json(item);
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
