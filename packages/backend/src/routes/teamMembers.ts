import { Router, Request, Response, NextFunction } from 'express';
import prisma from '../prismaClient';

const router = Router();

router.get('/', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const list = await prisma.teamMember.findMany({
      orderBy: { name: 'asc' },
    });
    res.json(list.map((m) => ({
      name: m.name,
      role: m.role || '',
      stream: m.stream || '',
      hasDeletePassword: !!m.deletePassword,
    })));
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

    const existingPasswords: Record<string, string> = {};
    const existing = await prisma.teamMember.findMany();
    existing.forEach((m) => { if (m.deletePassword) existingPasswords[m.name] = m.deletePassword; });

    await prisma.$transaction(async (tx) => {
      await tx.teamMember.deleteMany({});
      for (const row of body) {
        const name = String(row?.name ?? '').trim();
        if (!name) continue;
        await tx.teamMember.upsert({
          where: { name },
          update: {
            role: (row.role !== undefined && row.role !== '') ? row.role : null,
            stream: (row.stream !== undefined && row.stream !== '') ? row.stream : null,
          },
          create: {
            name,
            role: (row.role !== undefined && row.role !== '') ? row.role : null,
            stream: (row.stream !== undefined && row.stream !== '') ? row.stream : null,
            deletePassword: existingPasswords[name] || null,
          },
        });
      }
    });
    const list = await prisma.teamMember.findMany({ orderBy: { name: 'asc' } });
    res.json(list.map((m) => ({
      name: m.name,
      role: m.role || '',
      stream: m.stream || '',
      hasDeletePassword: !!m.deletePassword,
    })));
  } catch (err) {
    console.error('[team-members PUT]', err);
    next(err);
  }
});

router.patch('/:name/delete-password', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const name = decodeURIComponent(req.params.name);
    const { password } = req.body;
    if (password === undefined) {
      return res.status(400).json({ error: 'password is required' });
    }
    await prisma.teamMember.update({
      where: { name },
      data: { deletePassword: password || null },
    });
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

router.post('/verify-delete', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, password } = req.body;
    if (!name || !password) {
      return res.json({ success: false, error: 'Name und Passwort erforderlich' });
    }
    const member = await prisma.teamMember.findUnique({ where: { name } });
    if (!member || !member.deletePassword) {
      return res.json({ success: false, error: 'Kein Delete-Passwort hinterlegt' });
    }
    if (member.deletePassword !== password) {
      return res.json({ success: false, error: 'Falsches Passwort' });
    }
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

export default router;
