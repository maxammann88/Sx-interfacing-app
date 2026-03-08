import { Router, Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

const EXPORT_VERSION = 1;

router.get('/export', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const [
      countries,
      masterData,
      uploads,
      sapImports,
      billingCostImports,
      depositImports,
      billingRuns,
      interfacingPlans,
      countryPlanAssignments,
      correctedStatements,
      feedbackItems,
      feedbackComments,
      streams,
      subApps,
      bankGuarantees,
      teamMembers,
    ] = await Promise.all([
      prisma.country.findMany({ orderBy: { id: 'asc' } }),
      prisma.masterData.findMany({ orderBy: { id: 'asc' } }),
      prisma.upload.findMany({ orderBy: { id: 'asc' } }),
      prisma.sapImport.findMany({ orderBy: { id: 'asc' } }),
      prisma.billingCostImport.findMany({ orderBy: { id: 'asc' } }),
      prisma.depositImport.findMany({ orderBy: { id: 'asc' } }),
      prisma.billingRun.findMany({ orderBy: { id: 'asc' } }),
      prisma.interfacingPlan.findMany({ orderBy: { id: 'asc' } }),
      prisma.countryPlanAssignment.findMany({ orderBy: { id: 'asc' } }),
      prisma.correctedStatement.findMany({ orderBy: { id: 'asc' } }),
      prisma.feedbackItem.findMany({ orderBy: { id: 'asc' } }),
      prisma.feedbackComment.findMany({ orderBy: { id: 'asc' } }),
      prisma.stream.findMany({ orderBy: { id: 'asc' } }),
      prisma.subApp.findMany({ orderBy: { id: 'asc' } }),
      prisma.bankGuarantee.findMany({ orderBy: { id: 'asc' } }),
      prisma.teamMember.findMany({ orderBy: { id: 'asc' } }),
    ]);

    const dump = {
      _meta: {
        version: EXPORT_VERSION,
        exportedAt: new Date().toISOString(),
        tables: {
          countries: countries.length,
          masterData: masterData.length,
          uploads: uploads.length,
          sapImports: sapImports.length,
          billingCostImports: billingCostImports.length,
          depositImports: depositImports.length,
          billingRuns: billingRuns.length,
          interfacingPlans: interfacingPlans.length,
          countryPlanAssignments: countryPlanAssignments.length,
          correctedStatements: correctedStatements.length,
          feedbackItems: feedbackItems.length,
          feedbackComments: feedbackComments.length,
          streams: streams.length,
          subApps: subApps.length,
          bankGuarantees: bankGuarantees.length,
          teamMembers: teamMembers.length,
        },
      },
      countries,
      masterData,
      uploads,
      sapImports,
      billingCostImports,
      depositImports,
      billingRuns,
      interfacingPlans,
      countryPlanAssignments,
      correctedStatements,
      feedbackItems,
      feedbackComments,
      streams,
      subApps,
      bankGuarantees,
      teamMembers,
    };

    const filename = `sixt-db-export-${new Date().toISOString().slice(0, 10)}.json`;
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Type', 'application/json');
    res.json(dump);
  } catch (err) {
    next(err);
  }
});

router.get('/stats', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const [
      countries, masterData, uploads, sapImports, billingCostImports,
      depositImports, billingRuns, interfacingPlans, countryPlanAssignments,
      correctedStatements, feedbackItems, feedbackComments, streams,
      subApps, bankGuarantees, teamMembers,
    ] = await Promise.all([
      prisma.country.count(),
      prisma.masterData.count(),
      prisma.upload.count(),
      prisma.sapImport.count(),
      prisma.billingCostImport.count(),
      prisma.depositImport.count(),
      prisma.billingRun.count(),
      prisma.interfacingPlan.count(),
      prisma.countryPlanAssignment.count(),
      prisma.correctedStatement.count(),
      prisma.feedbackItem.count(),
      prisma.feedbackComment.count(),
      prisma.stream.count(),
      prisma.subApp.count(),
      prisma.bankGuarantee.count(),
      prisma.teamMember.count(),
    ]);

    res.json({
      countries, masterData, uploads, sapImports, billingCostImports,
      depositImports, billingRuns, interfacingPlans, countryPlanAssignments,
      correctedStatements, feedbackItems, feedbackComments, streams,
      subApps, bankGuarantees, teamMembers,
      total: countries + masterData + uploads + sapImports + billingCostImports +
        depositImports + billingRuns + interfacingPlans + countryPlanAssignments +
        correctedStatements + feedbackItems + feedbackComments + streams +
        subApps + bankGuarantees + teamMembers,
    });
  } catch (err) {
    next(err);
  }
});

// Delete order respects foreign key constraints
const TRUNCATE_ORDER = [
  'feedbackComment', 'feedbackItem', 'subApp', 'stream',
  'countryPlanAssignment', 'correctedStatement', 'interfacingPlan',
  'sapImport', 'billingCostImport', 'depositImport', 'upload',
  'billingRun', 'bankGuarantee', 'teamMember', 'masterData', 'country',
] as const;

router.post('/import', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const dump = req.body;

    if (!dump?._meta?.version) {
      return res.status(400).json({ error: 'Ungültiges Dateiformat – kein gültiger DB-Export.' });
    }

    // 1. Clear all tables (respecting FK order)
    for (const model of TRUNCATE_ORDER) {
      await (prisma[model] as any).deleteMany();
    }

    // 2. Re-insert in dependency order + reset sequences
    const insertOrder: { key: string; model: any }[] = [
      { key: 'countries', model: prisma.country },
      { key: 'masterData', model: prisma.masterData },
      { key: 'uploads', model: prisma.upload },
      { key: 'sapImports', model: prisma.sapImport },
      { key: 'billingCostImports', model: prisma.billingCostImport },
      { key: 'depositImports', model: prisma.depositImport },
      { key: 'billingRuns', model: prisma.billingRun },
      { key: 'interfacingPlans', model: prisma.interfacingPlan },
      { key: 'countryPlanAssignments', model: prisma.countryPlanAssignment },
      { key: 'correctedStatements', model: prisma.correctedStatement },
      { key: 'feedbackItems', model: prisma.feedbackItem },
      { key: 'feedbackComments', model: prisma.feedbackComment },
      { key: 'streams', model: prisma.stream },
      { key: 'subApps', model: prisma.subApp },
      { key: 'bankGuarantees', model: prisma.bankGuarantee },
      { key: 'teamMembers', model: prisma.teamMember },
    ];

    const counts: Record<string, number> = {};

    for (const { key, model } of insertOrder) {
      const rows = dump[key];
      if (!rows || !Array.isArray(rows) || rows.length === 0) {
        counts[key] = 0;
        continue;
      }
      await model.createMany({ data: rows });
      counts[key] = rows.length;
    }

    // 3. Reset auto-increment sequences to max(id)+1
    const sequenceMap: Record<string, string> = {
      countries: 'countries_id_seq',
      masterData: 'master_data_id_seq',
      uploads: 'uploads_id_seq',
      sapImports: 'sap_imports_id_seq',
      billingCostImports: 'billing_cost_imports_id_seq',
      depositImports: 'deposit_imports_id_seq',
      billingRuns: 'billing_runs_id_seq',
      interfacingPlans: 'interfacing_plans_id_seq',
      countryPlanAssignments: 'country_plan_assignments_id_seq',
      correctedStatements: 'corrected_statements_id_seq',
      feedbackItems: 'feedback_items_id_seq',
      feedbackComments: 'feedback_comments_id_seq',
      streams: 'streams_id_seq',
      subApps: 'sub_apps_id_seq',
      bankGuarantees: 'bank_guarantees_id_seq',
      teamMembers: 'team_members_id_seq',
    };

    const tableNameMap: Record<string, string> = {
      countries: 'countries',
      masterData: 'master_data',
      uploads: 'uploads',
      sapImports: 'sap_imports',
      billingCostImports: 'billing_cost_imports',
      depositImports: 'deposit_imports',
      billingRuns: 'billing_runs',
      interfacingPlans: 'interfacing_plans',
      countryPlanAssignments: 'country_plan_assignments',
      correctedStatements: 'corrected_statements',
      feedbackItems: 'feedback_items',
      feedbackComments: 'feedback_comments',
      streams: 'streams',
      subApps: 'sub_apps',
      bankGuarantees: 'bank_guarantees',
      teamMembers: 'team_members',
    };

    for (const [key, seqName] of Object.entries(sequenceMap)) {
      if (counts[key] > 0) {
        const tableName = tableNameMap[key];
        await prisma.$executeRawUnsafe(
          `SELECT setval('"${seqName}"', COALESCE((SELECT MAX(id) FROM "${tableName}"), 0) + 1, false)`
        );
      }
    }

    res.json({
      success: true,
      message: 'Datenbank erfolgreich importiert.',
      counts,
    });
  } catch (err) {
    next(err);
  }
});

export default router;
