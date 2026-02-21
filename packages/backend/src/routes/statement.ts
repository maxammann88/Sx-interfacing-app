import { Router, Request, Response, NextFunction } from 'express';
import prisma from '../prismaClient';
import { generateStatement } from '../services/statementService';
import type { OverviewRow } from '@sixt/shared';

const router = Router();

router.get('/overview', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const period = req.query.period as string;
    const releaseDate = (req.query.releaseDate as string) || new Date().toISOString().split('T')[0];
    const paymentTermDays = parseInt((req.query.paymentTermDays as string) || '30', 10);
    const status = req.query.status as string | undefined;

    if (!period) {
      return res.status(400).json({ success: false, error: 'Abrechnungsperiode (period) fehlt' });
    }

    const where: any = {};
    if (status && status !== 'alle') {
      where.partnerStatus = { contains: status, mode: 'insensitive' };
    }

    const countries = await prisma.country.findMany({ where, orderBy: { fir: 'asc' } });

    const rows: OverviewRow[] = [];
    for (const country of countries) {
      try {
        const st = await generateStatement(country.id, period, releaseDate, paymentTermDays);
        rows.push({
          countryId: country.id,
          fir: country.fir,
          iso: country.iso,
          name: country.name,
          status: country.partnerStatus,
          clearingSubtotal: st.clearingSubtotal,
          billingSubtotal: st.billingSubtotal,
          totalInterfacingDue: st.totalInterfacingDue,
          overdueBalance: st.accountStatement.overdueBalance,
          dueBalance: st.accountStatement.dueBalance,
          paymentBySixt: st.accountStatement.paymentBySixt,
          paymentByPartner: st.accountStatement.paymentByPartner,
          balanceOpenItems: st.accountStatement.balanceOpenItems,
        });
      } catch {
        rows.push({
          countryId: country.id,
          fir: country.fir,
          iso: country.iso,
          name: country.name,
          status: country.partnerStatus,
          clearingSubtotal: 0,
          billingSubtotal: 0,
          totalInterfacingDue: 0,
          overdueBalance: 0,
          dueBalance: 0,
          paymentBySixt: 0,
          paymentByPartner: 0,
          balanceOpenItems: 0,
        });
      }
    }

    res.json({ success: true, data: rows });
  } catch (err) {
    next(err);
  }
});

router.get('/:countryId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const countryId = parseInt(req.params.countryId as string, 10);
    const period = req.query.period as string;
    const releaseDate = (req.query.releaseDate as string) || new Date().toISOString().split('T')[0];
    const paymentTermDays = parseInt((req.query.paymentTermDays as string) || '30', 10);

    if (!period) {
      return res.status(400).json({ success: false, error: 'Abrechnungsperiode (period) fehlt' });
    }

    const statement = await generateStatement(countryId, period, releaseDate, paymentTermDays);
    res.json({ success: true, data: statement });
  } catch (err) {
    next(err);
  }
});

export default router;
