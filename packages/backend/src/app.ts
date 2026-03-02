import express from 'express';
import cors from 'cors';
import path from 'path';
import uploadRoutes from './routes/uploads';
import countryRoutes from './routes/countries';
import masterDataRoutes from './routes/masterData';
import statementRoutes from './routes/statement';
import exportRoutes from './routes/export';
import billingRunRoutes from './routes/billingRuns';
import planningRoutes from './routes/planning';
import feedbackRoutes from './routes/feedback';
import kpiRoutes from './routes/kpis';
import registryRoutes from './routes/registry';
import teamMembersRoutes from './routes/teamMembers';
import fixVarRoutes from './routes/fixVar';
import gdsDcfRoutes from './routes/gdsDcf';
import { errorHandler } from './middleware/errorHandler';

const app = express();

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

app.use('/api/uploads', uploadRoutes);
app.use('/api/countries', countryRoutes);
app.use('/api/master-data', masterDataRoutes);
app.use('/api/statement', statementRoutes);
app.use('/api/export', exportRoutes);
app.use('/api/billing-runs', billingRunRoutes);
app.use('/api/planning', planningRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/kpis', kpiRoutes);
app.use('/api/registry', registryRoutes);
app.use('/api/team-members', teamMembersRoutes);
app.use('/api/fix-var', fixVarRoutes);
app.use('/api/gds-dcf', gdsDcfRoutes);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use(errorHandler);

export default app;
