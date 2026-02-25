import React, { useState } from 'react';
import styled from 'styled-components';
import { theme } from '../../styles/theme';

const Content = styled.div`
  max-width: 1400px;
  margin: 0 auto;
  padding: 32px;
`;

const SectionTitle = styled.h2`
  font-size: 20px;
  font-weight: 800;
  color: ${theme.colors.textPrimary};
  margin: 32px 0 16px;
`;

const Card = styled.div`
  background: ${theme.colors.surface};
  border-radius: 12px;
  box-shadow: ${theme.shadow};
  padding: 24px;
  margin-bottom: 24px;
`;

const ArchBlock = styled.div`
  background: #1a1a2e;
  border-radius: 12px;
  padding: 32px;
  margin-bottom: 32px;
  color: #e0e0e0;
  font-family: 'Courier New', monospace;
  font-size: 13px;
  line-height: 1.8;
  overflow-x: auto;
  white-space: pre;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  font-size: 13px;
  th, td {
    padding: 10px 14px;
    border-bottom: 1px solid ${theme.colors.border};
    text-align: left;
  }
  th {
    font-weight: 600;
    color: ${theme.colors.textSecondary};
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    background: #fafafa;
  }
  tbody tr:hover { background: #f8f9fa; }
`;

const Badge = styled.span<{ $color: string }>`
  font-size: 10px;
  font-weight: 700;
  padding: 2px 10px;
  border-radius: 10px;
  background: ${p => p.$color};
  color: white;
`;

const ModelCard = styled(Card)`
  border-left: 4px solid ${theme.colors.primary};
`;

const ModelTitle = styled.h3`
  font-size: 16px;
  font-weight: 700;
  color: ${theme.colors.textPrimary};
  margin-bottom: 4px;
  display: flex;
  align-items: center;
  gap: 10px;
`;

const ModelMeta = styled.div`
  font-size: 12px;
  color: ${theme.colors.textSecondary};
  margin-bottom: 16px;
  display: flex;
  gap: 20px;
`;

const ToggleBtn = styled.button<{ $active: boolean }>`
  padding: 6px 16px;
  border: 2px solid ${p => p.$active ? theme.colors.primary : theme.colors.border};
  background: ${p => p.$active ? theme.colors.primary : 'white'};
  color: ${p => p.$active ? 'white' : theme.colors.textSecondary};
  border-radius: 8px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  &:hover { border-color: ${theme.colors.primary}; }
`;

const InfoRow = styled.div`
  display: flex;
  gap: 32px;
  margin-bottom: 32px;
  flex-wrap: wrap;
`;

const InfoCard = styled.div<{ $color: string }>`
  flex: 1;
  min-width: 200px;
  background: ${theme.colors.surface};
  border-radius: 12px;
  box-shadow: ${theme.shadow};
  padding: 20px;
  border-top: 4px solid ${p => p.$color};
  text-align: center;
`;

const InfoValue = styled.div`
  font-size: 24px;
  font-weight: 800;
  color: ${theme.colors.textPrimary};
`;

const InfoLabel = styled.div`
  font-size: 11px;
  color: ${theme.colors.textSecondary};
  margin-top: 4px;
`;

interface DbField {
  name: string;
  type: string;
  nullable: boolean;
  description: string;
  constraints?: string;
}

interface DbModel {
  name: string;
  tableName: string;
  owner: string;
  app: string;
  description: string;
  fields: DbField[];
  indexes: string[];
  relations: string[];
}

const models: DbModel[] = [
  {
    name: 'Country',
    tableName: 'countries',
    owner: 'Interfacing Team',
    app: 'Interfacing',
    description: 'Stores franchise partner country data with financials, contacts and contract details. One-to-one mapping between FIR, Debitor and Country.',
    fields: [
      { name: 'id', type: 'Int', nullable: false, description: 'Primary key (auto-increment)', constraints: 'PK' },
      { name: 'fir', type: 'Int', nullable: false, description: 'FIR number (unique company identifier in SAP)' },
      { name: 'debitor1', type: 'String', nullable: false, description: 'Primary debitor account number' },
      { name: 'iso', type: 'String', nullable: false, description: 'ISO country code (2-letter)' },
      { name: 'kst', type: 'Int', nullable: true, description: 'Cost center number' },
      { name: 'name', type: 'String', nullable: false, description: 'Country/Partner name' },
      { name: 'comment', type: 'String', nullable: true, description: 'Free-text comment field' },
      { name: 'verrkto', type: 'String', nullable: true, description: 'Revenue account' },
      { name: 'kreditor', type: 'String', nullable: true, description: 'Creditor account number' },
      { name: 'debitor760', type: 'String', nullable: true, description: 'Debitor account (company code 760)' },
      { name: 'kreditor760', type: 'String', nullable: true, description: 'Creditor account (company code 760)' },
      { name: 'partnerStatus', type: 'String', nullable: true, description: 'Active/Inactive partner status' },
      { name: 'finalInterfacing', type: 'String', nullable: true, description: 'Final interfacing date/info' },
      { name: 'vertragsende', type: 'DateTime', nullable: true, description: 'Contract end date' },
      { name: 'debitor10', type: 'String', nullable: true, description: 'Debitor account (company code 10)' },
      { name: 'paymentBlock', type: 'Boolean', nullable: false, description: 'Whether payment is blocked for this partner', constraints: 'Default: false' },
    ],
    indexes: ['debitor1', 'fir', 'iso'],
    relations: [],
  },
  {
    name: 'MasterData',
    tableName: 'master_data',
    owner: 'Interfacing Team',
    app: 'Interfacing',
    description: 'SAP master data records linked to countries via KTOD = Debitor1. Uploaded via CSV.',
    fields: [
      { name: 'id', type: 'Int', nullable: false, description: 'Primary key', constraints: 'PK' },
      { name: 'uid', type: 'String', nullable: true, description: 'VAT/Tax ID' },
      { name: 'ktod', type: 'String', nullable: false, description: 'Account number (links to Country.debitor1)', constraints: 'Unique' },
      { name: 'nam1', type: 'String', nullable: true, description: 'Company name line 1' },
      { name: 'nam2', type: 'String', nullable: true, description: 'Company name line 2' },
      { name: 'nam3', type: 'String', nullable: true, description: 'Company name line 3' },
      { name: 'str', type: 'String', nullable: true, description: 'Street address' },
      { name: 'ort', type: 'String', nullable: true, description: 'City' },
      { name: 'plz', type: 'String', nullable: true, description: 'Postal code' },
      { name: 'lanb', type: 'String', nullable: true, description: 'Country code' },
      { name: 'payt', type: 'Int', nullable: true, description: 'Payment term in days' },
    ],
    indexes: ['ktod'],
    relations: ['Linked to Country via ktod = debitor1'],
  },
  {
    name: 'SapImport',
    tableName: 'sap_imports',
    owner: 'Interfacing Team',
    app: 'Interfacing',
    description: 'Individual SAP line items imported from monthly CSV exports. Each row represents one accounting entry (clearing, invoice, credit note, payment).',
    fields: [
      { name: 'id', type: 'Int', nullable: false, description: 'Primary key', constraints: 'PK' },
      { name: 'uploadId', type: 'Int', nullable: false, description: 'Reference to Upload batch', constraints: 'FK -> Upload' },
      { name: 'konto', type: 'String', nullable: false, description: 'Account number (maps to Country.debitor1)' },
      { name: 'belegart', type: 'String', nullable: true, description: 'Document type' },
      { name: 'referenz', type: 'String', nullable: true, description: 'Reference number' },
      { name: 'referenzschluessel3', type: 'String', nullable: true, description: 'Reference key 3' },
      { name: 'buchungsperiode', type: 'String', nullable: true, description: 'Posting period (MM/YYYY)' },
      { name: 'buchungsdatum', type: 'DateTime', nullable: true, description: 'Posting date' },
      { name: 'belegdatum', type: 'DateTime', nullable: true, description: 'Document date' },
      { name: 'nettofaelligkeit', type: 'DateTime', nullable: true, description: 'Net due date' },
      { name: 'betragHauswaehrung', type: 'Float', nullable: false, description: 'Amount in home currency (EUR)', constraints: 'Default: 0' },
      { name: 'type', type: 'String', nullable: true, description: 'Clearing | Invoice | Credit Note | Payment' },
      { name: 'text', type: 'String', nullable: true, description: 'Line item description text' },
    ],
    indexes: ['konto', 'buchungsdatum', 'type', 'uploadId'],
    relations: ['Upload (many-to-one, cascade delete)'],
  },
  {
    name: 'Upload',
    tableName: 'uploads',
    owner: 'Interfacing Team',
    app: 'Interfacing',
    description: 'Tracks each file upload batch (SAP, Countries, Master Data, Deposit) with metadata.',
    fields: [
      { name: 'id', type: 'Int', nullable: false, description: 'Primary key', constraints: 'PK' },
      { name: 'filename', type: 'String', nullable: false, description: 'Original uploaded filename' },
      { name: 'uploadType', type: 'String', nullable: false, description: 'sap | countries | master-data | deposit' },
      { name: 'accountingPeriod', type: 'String', nullable: true, description: 'YYYYMM period (SAP uploads)' },
      { name: 'uploadedAt', type: 'DateTime', nullable: false, description: 'Upload timestamp', constraints: 'Default: now()' },
      { name: 'recordCount', type: 'Int', nullable: false, description: 'Number of records imported', constraints: 'Default: 0' },
    ],
    indexes: [],
    relations: ['SapImport (one-to-many)'],
  },
  {
    name: 'BillingRun',
    tableName: 'billing_runs',
    owner: 'Interfacing Team',
    app: 'Interfacing',
    description: 'Stores billing run configuration per accounting period (release date, payment terms).',
    fields: [
      { name: 'id', type: 'Int', nullable: false, description: 'Primary key', constraints: 'PK' },
      { name: 'accountingPeriod', type: 'String', nullable: false, description: 'YYYYMM period' },
      { name: 'releaseDate', type: 'DateTime', nullable: false, description: 'Release date for the billing run' },
      { name: 'paymentTermDays', type: 'Int', nullable: false, description: 'Payment term in days', constraints: 'Default: 30' },
      { name: 'createdAt', type: 'DateTime', nullable: false, description: 'Created timestamp', constraints: 'Default: now()' },
    ],
    indexes: [],
    relations: [],
  },
  {
    name: 'InterfacingPlan',
    tableName: 'interfacing_plans',
    owner: 'Interfacing Team',
    app: 'Interfacing',
    description: 'Monthly interfacing planning data (release dates, global creator/reviewer assignments).',
    fields: [
      { name: 'id', type: 'Int', nullable: false, description: 'Primary key', constraints: 'PK' },
      { name: 'period', type: 'String', nullable: false, description: 'YYYYMM period', constraints: 'Unique' },
      { name: 'releaseDate', type: 'String', nullable: true, description: 'Planned release date (YYYY-MM-DD)' },
      { name: 'creator', type: 'String', nullable: true, description: 'Global creator name' },
      { name: 'reviewer', type: 'String', nullable: true, description: 'Global reviewer name' },
      { name: 'updatedAt', type: 'DateTime', nullable: false, description: 'Last update timestamp' },
    ],
    indexes: [],
    relations: [],
  },
  {
    name: 'CountryPlanAssignment',
    tableName: 'country_plan_assignments',
    owner: 'Interfacing Team',
    app: 'Interfacing',
    description: 'Per-country, per-period creator/reviewer assignments for interfacing planning.',
    fields: [
      { name: 'id', type: 'Int', nullable: false, description: 'Primary key', constraints: 'PK' },
      { name: 'period', type: 'String', nullable: false, description: 'YYYYMM period' },
      { name: 'countryId', type: 'Int', nullable: false, description: 'Reference to Country.id' },
      { name: 'creator', type: 'String', nullable: true, description: 'Assigned creator name' },
      { name: 'reviewer', type: 'String', nullable: true, description: 'Assigned reviewer name' },
    ],
    indexes: ['period', 'countryId'],
    relations: [],
  },
  {
    name: 'CorrectedStatement',
    tableName: 'corrected_statements',
    owner: 'Interfacing Team',
    app: 'Interfacing',
    description: 'Stores manually corrected statement versions as JSON. Multiple versions per country/period are supported.',
    fields: [
      { name: 'id', type: 'Int', nullable: false, description: 'Primary key', constraints: 'PK' },
      { name: 'countryId', type: 'Int', nullable: false, description: 'Reference to Country.id' },
      { name: 'period', type: 'String', nullable: false, description: 'YYYYMM period' },
      { name: 'data', type: 'Json', nullable: false, description: 'Full corrected statement data (JSON)' },
      { name: 'createdAt', type: 'DateTime', nullable: false, description: 'Created timestamp', constraints: 'Default: now()' },
    ],
    indexes: ['countryId + period', 'period'],
    relations: [],
  },
  {
    name: 'FeedbackItem',
    tableName: 'feedback_items',
    owner: 'Core / Portal Team',
    app: 'Core',
    description: 'Feature requests, bug reports and tickets across all applications. Supports status workflow, deadline tracking, FTE estimation and discussion.',
    fields: [
      { name: 'id', type: 'Int', nullable: false, description: 'Primary key', constraints: 'PK' },
      { name: 'app', type: 'String', nullable: false, description: 'Application (Interfacing, FSM, NEW)', constraints: 'Default: Interfacing' },
      { name: 'author', type: 'String', nullable: true, description: 'Ticket creator name' },
      { name: 'type', type: 'String', nullable: false, description: 'bug | feature' },
      { name: 'title', type: 'String', nullable: false, description: 'Ticket title' },
      { name: 'description', type: 'String', nullable: true, description: 'Detailed description' },
      { name: 'notes', type: 'String', nullable: true, description: 'Working notes / implementation plan' },
      { name: 'jiraUrl', type: 'String', nullable: true, description: 'Link to Jira ticket' },
      { name: 'confluenceUrl', type: 'String', nullable: true, description: 'Link to Confluence page' },
      { name: 'deadlineWeek', type: 'String', nullable: true, description: 'Deadline calendar week (KWXX YYYY)' },
      { name: 'deadlineDate', type: 'DateTime', nullable: true, description: 'Specific deadline date' },
      { name: 'deadlineHistory', type: 'Json', nullable: true, description: 'Array of {from, to, changedAt} deadline changes' },
      { name: 'automationFTE', type: 'Float', nullable: false, description: 'Estimated FTE savings from automation', constraints: 'Default: 0' },
      { name: 'status', type: 'String', nullable: false, description: 'open | in_progress | testing | done | rejected', constraints: 'Default: open' },
      { name: 'createdAt', type: 'DateTime', nullable: false, description: 'Created timestamp' },
      { name: 'updatedAt', type: 'DateTime', nullable: false, description: 'Last update timestamp' },
    ],
    indexes: ['status', 'type', 'app'],
    relations: ['FeedbackComment (one-to-many)'],
  },
  {
    name: 'FeedbackComment',
    tableName: 'feedback_comments',
    owner: 'Core / Portal Team',
    app: 'Core',
    description: 'Discussion comments on feedback items (tickets). Supports threaded discussion per ticket.',
    fields: [
      { name: 'id', type: 'Int', nullable: false, description: 'Primary key', constraints: 'PK' },
      { name: 'feedbackId', type: 'Int', nullable: false, description: 'Reference to FeedbackItem.id', constraints: 'FK -> FeedbackItem (cascade delete)' },
      { name: 'text', type: 'String', nullable: false, description: 'Comment text' },
      { name: 'author', type: 'String', nullable: false, description: 'Comment author name', constraints: 'Default: User' },
      { name: 'createdAt', type: 'DateTime', nullable: false, description: 'Created timestamp' },
    ],
    indexes: ['feedbackId'],
    relations: ['FeedbackItem (many-to-one)'],
  },
];

const appColors: Record<string, string> = {
  'Interfacing': theme.colors.success,
  'Core': theme.colors.info,
  'FSM': '#e05c00',
};

export default function DbDocumentationPage() {
  const [expandedModels, setExpandedModels] = useState<Set<string>>(new Set(['Country', 'FeedbackItem']));

  const toggleModel = (name: string) => {
    setExpandedModels(prev => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  return (
    <Content>
      <SectionTitle>Application Architecture</SectionTitle>

      <InfoRow>
        <InfoCard $color={theme.colors.primary}>
          <InfoValue>{models.length}</InfoValue>
          <InfoLabel>Database Tables</InfoLabel>
        </InfoCard>
        <InfoCard $color={theme.colors.success}>
          <InfoValue>{models.reduce((s, m) => s + m.fields.length, 0)}</InfoValue>
          <InfoLabel>Total Fields</InfoLabel>
        </InfoCard>
        <InfoCard $color={theme.colors.info}>
          <InfoValue>{models.reduce((s, m) => s + m.indexes.length, 0)}</InfoValue>
          <InfoLabel>Indexes</InfoLabel>
        </InfoCard>
        <InfoCard $color={theme.colors.warning}>
          <InfoValue>3</InfoValue>
          <InfoLabel>Application Domains</InfoLabel>
        </InfoCard>
      </InfoRow>

      <Card>
        <SectionTitle style={{ marginTop: 0 }}>Database Entity Relationship Diagram</SectionTitle>
        <ArchBlock>{`┌──────────────────────┐      ┌──────────────────────┐
│       Upload         │      │       Country         │
│  ──────────────────  │      │  ──────────────────   │
│  id (PK)             │      │  id (PK)              │
│  filename            │      │  fir                  │
│  uploadType          │──┐   │  debitor1  ───────────┼───┐
│  accountingPeriod    │  │   │  iso                  │   │
│  uploadedAt          │  │   │  name                 │   │
│  recordCount         │  │   │  paymentBlock         │   │
└──────────────────────┘  │   │  partnerStatus        │   │
                          │   │  vertragsende         │   │
                          │   └──────────────────────┘   │
                          │            │                  │
                    1:N   │            │ 1:1 (via ktod)   │
                          │            ▼                  │
┌──────────────────────┐  │   ┌──────────────────────┐   │
│     SapImport        │  │   │     MasterData        │   │
│  ──────────────────  │  │   │  ──────────────────   │   │
│  id (PK)             │  │   │  id (PK)              │   │
│  uploadId (FK)  ─────┼──┘   │  ktod (Unique)  ──────┼───┘
│  konto               │      │  nam1                 │
│  buchungsdatum       │      │  ort, plz, lanb       │
│  betragHauswaehrung  │      │  payt                 │
│  type                │      └──────────────────────┘
│  text                │
└──────────────────────┘

┌──────────────────────┐      ┌──────────────────────┐
│  InterfacingPlan     │      │ CountryPlanAssignment │
│  ──────────────────  │      │  ──────────────────   │
│  id (PK)             │      │  id (PK)              │
│  period (Unique)     │      │  period               │
│  releaseDate         │      │  countryId             │
│  creator             │      │  creator               │
│  reviewer            │      │  reviewer              │
└──────────────────────┘      └──────────────────────┘

┌──────────────────────┐      ┌──────────────────────┐
│  CorrectedStatement  │      │     BillingRun        │
│  ──────────────────  │      │  ──────────────────   │
│  id (PK)             │      │  id (PK)              │
│  countryId           │      │  accountingPeriod     │
│  period              │      │  releaseDate          │
│  data (JSON)         │      │  paymentTermDays      │
│  createdAt           │      │  createdAt            │
└──────────────────────┘      └──────────────────────┘

┌──────────────────────┐      ┌──────────────────────┐
│   FeedbackItem       │      │  FeedbackComment      │
│  ──────────────────  │      │  ──────────────────   │
│  id (PK)             │      │  id (PK)              │
│  app                 │      │  feedbackId (FK)  ────┼──→ FeedbackItem
│  type                │──┐   │  text                 │
│  title               │  │   │  author               │
│  status              │  │   │  createdAt            │
│  automationFTE       │  │   └──────────────────────┘
│  deadlineDate        │  │
│  deadlineHistory     │  │ 1:N
│  createdAt           │──┘
└──────────────────────┘`}</ArchBlock>
      </Card>

      <SectionTitle>Database Tables ({models.length})</SectionTitle>
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        <ToggleBtn $active={expandedModels.size === models.length}
          onClick={() => setExpandedModels(expandedModels.size === models.length ? new Set() : new Set(models.map(m => m.name)))}>
          {expandedModels.size === models.length ? 'Collapse All' : 'Expand All'}
        </ToggleBtn>
      </div>

      {models.map(model => (
        <ModelCard key={model.name}>
          <ModelTitle>
            <span style={{ cursor: 'pointer' }} onClick={() => toggleModel(model.name)}>
              {expandedModels.has(model.name) ? '▾' : '▸'}
            </span>
            <code style={{ fontSize: 14 }}>{model.name}</code>
            <Badge $color={appColors[model.app] || '#888'}>{model.app}</Badge>
            <code style={{ fontSize: 11, color: theme.colors.textLight, fontWeight: 400 }}>→ {model.tableName}</code>
          </ModelTitle>
          <ModelMeta>
            <span><strong>Owner:</strong> {model.owner}</span>
            <span><strong>Fields:</strong> {model.fields.length}</span>
            <span><strong>Indexes:</strong> {model.indexes.length > 0 ? model.indexes.join(', ') : 'none'}</span>
          </ModelMeta>
          <p style={{ fontSize: 13, color: theme.colors.textSecondary, marginBottom: 16 }}>{model.description}</p>

          {expandedModels.has(model.name) && (
            <>
              <Table>
                <thead>
                  <tr>
                    <th>Field</th>
                    <th>Type</th>
                    <th>Nullable</th>
                    <th>Description</th>
                    <th>Constraints</th>
                  </tr>
                </thead>
                <tbody>
                  {model.fields.map(f => (
                    <tr key={f.name}>
                      <td><code style={{ fontWeight: 600 }}>{f.name}</code></td>
                      <td><code style={{ color: theme.colors.info }}>{f.type}</code></td>
                      <td style={{ textAlign: 'center' }}>
                        {f.nullable
                          ? <span style={{ color: theme.colors.warning }}>Yes</span>
                          : <span style={{ color: theme.colors.success }}>No</span>}
                      </td>
                      <td style={{ fontSize: 12, color: theme.colors.textSecondary }}>{f.description}</td>
                      <td style={{ fontSize: 11 }}>{f.constraints || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </Table>

              {model.relations.length > 0 && (
                <div style={{ marginTop: 12, fontSize: 12, color: theme.colors.textSecondary }}>
                  <strong>Relations:</strong> {model.relations.join(' | ')}
                </div>
              )}
            </>
          )}
        </ModelCard>
      ))}

      <SectionTitle>Review Checklist for Engineers</SectionTitle>
      <Card>
        <Table>
          <thead>
            <tr>
              <th>#</th>
              <th>Area</th>
              <th>Question</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {[
              { area: 'Database', question: 'Are all foreign keys properly defined with cascade rules?' },
              { area: 'Database', question: 'Are indexes covering the most frequent query patterns?' },
              { area: 'Database', question: 'Is the JSON column (CorrectedStatement.data) schema-validated before storage?' },
              { area: 'Database', question: 'Are unique constraints preventing duplicate entries?' },
              { area: 'API', question: 'Do all endpoints validate input parameters?' },
              { area: 'API', question: 'Is error handling consistent across all routes?' },
              { area: 'API', question: 'Are bulk operations (PDF/XLSX export) properly rate-limited?' },
              { area: 'Security', question: 'Is authentication/authorization implemented for sensitive endpoints?' },
              { area: 'Security', question: 'Are file uploads validated (type, size, content)?' },
              { area: 'Performance', question: 'Can the SAP import handle 50k+ rows without timeout?' },
              { area: 'Performance', question: 'Is the statement overview query optimized for 100+ countries?' },
              { area: 'Frontend', question: 'Are loading states shown for all async operations?' },
              { area: 'Frontend', question: 'Is form validation present for all user inputs?' },
              { area: 'Data Integrity', question: 'Are cascading deletes correctly configured (Upload → SapImport)?' },
              { area: 'Data Integrity', question: 'Are deadline history changes immutable once recorded?' },
            ].map((item, i) => (
              <tr key={i}>
                <td>{i + 1}</td>
                <td><Badge $color={
                  item.area === 'Database' ? theme.colors.info :
                  item.area === 'API' ? theme.colors.success :
                  item.area === 'Security' ? theme.colors.danger :
                  item.area === 'Performance' ? theme.colors.warning :
                  item.area === 'Frontend' ? theme.colors.primary :
                  '#888'
                }>{item.area}</Badge></td>
                <td style={{ fontSize: 12 }}>{item.question}</td>
                <td><Badge $color={theme.colors.warning}>To Review</Badge></td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Card>
    </Content>
  );
}
