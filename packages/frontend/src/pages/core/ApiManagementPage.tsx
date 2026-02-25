import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import { theme } from '../../styles/theme';
import api from '../../utils/api';
import DbDocumentationPage from './DbDocumentationPage';
import { getTeamMemberNames } from './CodingTeamManagementPage';

// DB-backed registry cache (set by fetchRegistry() on app load and after PUT)
let registryCache: { streamOrder: string[]; registry: SubAppOwnerEntry[] } | null = null;

export async function fetchRegistry(): Promise<void> {
  try {
    const res = await api.get<{ streamOrder: string[]; registry: SubAppOwnerEntry[] }>('/registry');
    if (res.data && Array.isArray(res.data.registry)) {
      let streamOrder = res.data.streamOrder || [];
      let registry = [...res.data.registry];

      // Lokale Einträge (localStorage), die noch nicht in der API sind, in die DB übernehmen
      try {
        const raw = localStorage.getItem('subAppOwners_v2');
        if (raw && raw.length > 2) {
          const localList = JSON.parse(raw) as SubAppOwnerEntry[];
          const key = (r: SubAppOwnerEntry) => `${r.stream}\t${r.app}`;
          const apiKeys = new Set(registry.map(key));
          let merged = false;
          localList.forEach((e) => {
            const normalized = { ...e, status: (e.status === 'Planned' ? 'Planning' : e.status) || 'Planning', isStarted: e.isStarted ?? false };
            if (!apiKeys.has(key(normalized))) {
              registry.push(normalized);
              apiKeys.add(key(normalized));
              merged = true;
            }
          });
          if (merged) {
            const localOrder = (() => { try { const o = localStorage.getItem('streamOrder_v1'); return o ? JSON.parse(o) as string[] : null; } catch { return null; } })();
            const orderSet = new Set(streamOrder);
            if (Array.isArray(localOrder)) localOrder.forEach((s) => { if (!orderSet.has(s)) { streamOrder = [...streamOrder, s]; orderSet.add(s); } });
            await api.put('/registry', { registry, streamOrder });
            const r2 = await api.get<{ streamOrder: string[]; registry: SubAppOwnerEntry[] }>('/registry');
            streamOrder = r2.data.streamOrder || [];
            registry = r2.data.registry || [];
            localStorage.removeItem('subAppOwners_v2');
            localStorage.removeItem('streamOrder_v1');
          }
        }
      } catch (_) { /* ignore */ }

      registryCache = { streamOrder, registry };

      // Einmal-Migration: gestartete Sub-Apps aus localStorage in DB übernehmen
      try {
        const startedRaw = localStorage.getItem('startedSubApps_v1');
        if (startedRaw && registryCache!.registry.length > 0) {
          const slugs: string[] = JSON.parse(startedRaw);
          if (Array.isArray(slugs) && slugs.length > 0) {
            const toSlug = (n: string) => n.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
            const updated = registryCache!.registry.map((r) => ({ ...r, isStarted: r.isStarted || slugs.includes(toSlug(r.app)) }));
            await api.put('/registry', { registry: updated, streamOrder: registryCache!.streamOrder });
            const r2 = await api.get<{ streamOrder: string[]; registry: SubAppOwnerEntry[] }>('/registry');
            registryCache = r2.data;
            localStorage.removeItem('startedSubApps_v1');
          }
        }
      } catch (_) { /* ignore */ }
      return;
    }
  } catch (_) { /* ignore */ }
  // If API returns empty or fails, migrate from localStorage once
  try {
    const raw = localStorage.getItem('subAppOwners_v2');
    if (raw && raw.length > 2) {
      const registry = JSON.parse(raw) as SubAppOwnerEntry[];
      registry.forEach((d: SubAppOwnerEntry) => { if ((d.status as string) === 'Planned') d.status = 'Planning'; });
      const streamOrder = (() => { try { const o = localStorage.getItem('streamOrder_v1'); return o ? JSON.parse(o) : null; } catch { return null; } })();
      await api.put('/registry', { registry, streamOrder: streamOrder || [...new Set(registry.map(r => r.stream))] });
      const res = await api.get<{ streamOrder: string[]; registry: SubAppOwnerEntry[] }>('/registry');
      registryCache = res.data;
    }
  } catch (_) { /* ignore */ }
}

const Page = styled.div`
  min-height: 100vh;
  background: ${theme.colors.background};
`;

const Header = styled.header`
  background: ${theme.colors.secondary};
  color: ${theme.colors.white};
  padding: 0 32px;
  height: 64px;
  display: flex;
  align-items: center;
  gap: 16px;
`;

const LogoImg = styled.img`
  height: 36px;
  border-radius: 6px;
`;

const BackLink = styled(Link)`
  color: ${theme.colors.white};
  font-size: 15px;
  padding: 6px 10px;
  border-radius: ${theme.borderRadius};
  &:hover { color: ${theme.colors.primary}; background: rgba(255,95,0,0.08); }
`;

const HeaderTitle = styled.span`
  font-size: 15px;
  font-weight: 700;
  color: ${theme.colors.white};
`;

const TabBar = styled.div`
  display: flex;
  gap: 0;
  background: ${theme.colors.surface};
  border-bottom: 2px solid ${theme.colors.border};
  padding: 0 32px;
`;

const Tab = styled.button<{ $active: boolean }>`
  padding: 14px 28px;
  border: none;
  background: none;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  color: ${p => p.$active ? theme.colors.primary : theme.colors.textSecondary};
  border-bottom: 3px solid ${p => p.$active ? theme.colors.primary : 'transparent'};
  margin-bottom: -2px;
  transition: all 0.15s;
  &:hover { color: ${theme.colors.primary}; }
`;

const Content = styled.div`
  max-width: 1400px;
  margin: 0 auto;
  padding: 32px;
`;

const PageTitle = styled.h1`
  font-size: 24px;
  font-weight: 800;
  color: ${theme.colors.textPrimary};
  margin-bottom: 24px;
`;

const SummaryRow = styled.div`
  display: flex;
  gap: 20px;
  margin-bottom: 28px;
`;

const SummaryCard = styled.div<{ $color: string }>`
  flex: 1;
  background: ${theme.colors.surface};
  border-radius: 12px;
  box-shadow: ${theme.shadow};
  padding: 20px 24px;
  border-top: 4px solid ${p => p.$color};
  text-align: center;
`;

const SummaryValue = styled.div`
  font-size: 28px;
  font-weight: 800;
  color: ${theme.colors.textPrimary};
`;

const SummaryLabel = styled.div`
  font-size: 12px;
  color: ${theme.colors.textSecondary};
  margin-top: 4px;
`;

const SectionGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
  margin-bottom: 32px;
`;

const Card = styled.div`
  background: ${theme.colors.surface};
  border-radius: 12px;
  box-shadow: ${theme.shadow};
  padding: 24px;
`;

const FullWidthCard = styled(Card)`
  grid-column: 1 / -1;
`;

const CardTitle = styled.h2`
  font-size: 16px;
  font-weight: 700;
  color: ${theme.colors.textPrimary};
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  font-size: 13px;

  th, td {
    padding: 10px 12px;
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

  tbody tr:hover {
    background: #f8f9fa;
  }
`;

const Badge = styled.span<{ $color: string }>`
  font-size: 10px;
  font-weight: 700;
  padding: 2px 10px;
  border-radius: 10px;
  background: ${p => p.$color};
  color: white;
`;

const MethodBadge = styled.span<{ $method: string }>`
  font-size: 10px;
  font-weight: 800;
  padding: 2px 8px;
  border-radius: 4px;
  font-family: monospace;
  color: white;
  background: ${p =>
    p.$method === 'GET' ? theme.colors.success :
    p.$method === 'POST' ? theme.colors.info :
    p.$method === 'PATCH' ? theme.colors.warning :
    p.$method === 'DELETE' ? theme.colors.danger : '#888'};
`;

const EndpointPath = styled.code`
  font-size: 12px;
  font-weight: 600;
  color: ${theme.colors.textPrimary};
`;

const FilterRow = styled.div`
  display: flex;
  gap: 6px;
  margin-bottom: 16px;
`;

const FilterChip = styled.button<{ $active: boolean }>`
  padding: 4px 12px;
  border: 1px solid ${p => p.$active ? theme.colors.primary : theme.colors.border};
  background: ${p => p.$active ? theme.colors.primary : 'white'};
  color: ${p => p.$active ? 'white' : theme.colors.textSecondary};
  border-radius: 16px;
  font-size: 11px;
  font-weight: 600;
  cursor: pointer;
  &:hover { border-color: ${theme.colors.primary}; }
`;

interface ApiEndpoint {
  method: string;
  path: string;
  description: string;
  app: string;
  status: 'active' | 'planned' | 'deprecated';
  auth: boolean;
}

const endpoints: ApiEndpoint[] = [
  // --- Uploads (Data Import) ---
  { method: 'POST', path: '/api/uploads/sap', description: 'Upload SAP CSV (appends data)', app: 'Interfacing', status: 'active', auth: false },
  { method: 'POST', path: '/api/uploads/countries', description: 'Upload Countries CSV (replaces all)', app: 'Interfacing', status: 'active', auth: false },
  { method: 'POST', path: '/api/uploads/master-data', description: 'Upload Master Data CSV (upsert)', app: 'Interfacing', status: 'active', auth: false },
  { method: 'POST', path: '/api/uploads/billing-costs', description: 'Upload BU88/BU89 Billing Costs CSV (appends)', app: 'Interfacing', status: 'active', auth: false },
  { method: 'POST', path: '/api/uploads/deposit', description: 'Upload Deposit CSV (replaces all)', app: 'Interfacing', status: 'active', auth: false },
  { method: 'GET', path: '/api/uploads/deposit-summary', description: 'Deposit held sums by offsettingAcctNo (*-1)', app: 'Interfacing', status: 'active', auth: false },
  { method: 'GET', path: '/api/uploads/bank-guarantees', description: 'Bank guarantee amounts by debitor1', app: 'Interfacing', status: 'active', auth: false },
  { method: 'PUT', path: '/api/uploads/bank-guarantees', description: 'Upsert bank guarantee for a debitor1', app: 'Interfacing', status: 'active', auth: false },
  { method: 'GET', path: '/api/uploads', description: 'List all upload records', app: 'Interfacing', status: 'active', auth: false },
  { method: 'DELETE', path: '/api/uploads/:id', description: 'Delete upload and cascaded imports', app: 'Interfacing', status: 'active', auth: false },
  // --- Countries ---
  { method: 'GET', path: '/api/countries', description: 'List countries (optional ?status= filter)', app: 'Interfacing', status: 'active', auth: false },
  { method: 'GET', path: '/api/countries/:id', description: 'Get single country by ID', app: 'Interfacing', status: 'active', auth: false },
  // --- Master Data ---
  { method: 'GET', path: '/api/master-data', description: 'Countries with joined master data', app: 'Interfacing', status: 'active', auth: false },
  { method: 'PATCH', path: '/api/master-data/:id/payment-block', description: 'Toggle payment block for country', app: 'Interfacing', status: 'active', auth: false },
  // --- Statement ---
  { method: 'GET', path: '/api/statement/overview', description: 'Statement overview for all countries', app: 'Interfacing', status: 'active', auth: false },
  { method: 'GET', path: '/api/statement/:countryId', description: 'Generate full statement for country/period', app: 'Interfacing', status: 'active', auth: false },
  // --- Fix/Var ---
  { method: 'GET', path: '/api/fix-var', description: 'Fix/Var breakdown for country/period', app: 'Interfacing', status: 'active', auth: false },
  { method: 'GET', path: '/api/fix-var/overview', description: 'Fix/Var overview all countries', app: 'Interfacing', status: 'active', auth: false },
  // --- Export ---
  { method: 'POST', path: '/api/export/render/pdf', description: 'Render statement as PDF from JSON data', app: 'Interfacing', status: 'active', auth: false },
  { method: 'POST', path: '/api/export/render/xlsx', description: 'Render statement as XLSX from JSON data', app: 'Interfacing', status: 'active', auth: false },
  { method: 'GET', path: '/api/export/:countryId/pdf', description: 'Generate PDF for country statement', app: 'Interfacing', status: 'active', auth: false },
  { method: 'GET', path: '/api/export/:countryId/xlsx', description: 'Generate XLSX for country statement', app: 'Interfacing', status: 'active', auth: false },
  { method: 'GET', path: '/api/export/:countryId/preview', description: 'HTML preview of statement', app: 'Interfacing', status: 'active', auth: false },
  { method: 'GET', path: '/api/export/bulk/pdf', description: 'Bulk PDF export for all countries', app: 'Interfacing', status: 'active', auth: false },
  { method: 'GET', path: '/api/export/bulk/xlsx', description: 'Bulk XLSX export for all countries', app: 'Interfacing', status: 'active', auth: false },
  { method: 'GET', path: '/api/export/bulk/raw-data', description: 'Export raw SAP data as XLSX', app: 'Interfacing', status: 'active', auth: false },
  { method: 'POST', path: '/api/export/corrections', description: 'Save corrected statement version', app: 'Interfacing', status: 'active', auth: false },
  { method: 'GET', path: '/api/export/corrections', description: 'List corrected statements', app: 'Interfacing', status: 'active', auth: false },
  { method: 'DELETE', path: '/api/export/corrections/:countryId', description: 'Delete corrected statement', app: 'Interfacing', status: 'active', auth: false },
  // --- Planning ---
  { method: 'GET', path: '/api/planning', description: 'List all interfacing plans', app: 'Interfacing', status: 'active', auth: false },
  { method: 'GET', path: '/api/planning/:period', description: 'Get plan for period (releaseDate etc.)', app: 'Interfacing', status: 'active', auth: false },
  { method: 'PUT', path: '/api/planning/:period', description: 'Upsert plan for period', app: 'Interfacing', status: 'active', auth: false },
  { method: 'GET', path: '/api/planning/assignments', description: 'Country-plan assignments for period', app: 'Interfacing', status: 'active', auth: false },
  { method: 'PUT', path: '/api/planning/assignments/:period/:countryId', description: 'Upsert country assignment', app: 'Interfacing', status: 'active', auth: false },
  // --- Billing Runs ---
  { method: 'GET', path: '/api/billing-runs', description: 'List billing runs', app: 'Interfacing', status: 'active', auth: false },
  { method: 'POST', path: '/api/billing-runs', description: 'Create billing run', app: 'Interfacing', status: 'active', auth: false },
  // --- Feedback / Tickets ---
  { method: 'GET', path: '/api/feedback', description: 'List feedback items (?app= filter)', app: 'Core', status: 'active', auth: false },
  { method: 'POST', path: '/api/feedback', description: 'Create new feedback/ticket', app: 'Core', status: 'active', auth: false },
  { method: 'DELETE', path: '/api/feedback/:id', description: 'Delete feedback item', app: 'Core', status: 'active', auth: false },
  { method: 'PATCH', path: '/api/feedback/:id/status', description: 'Update ticket status', app: 'Core', status: 'active', auth: false },
  { method: 'PATCH', path: '/api/feedback/:id/notes', description: 'Update working notes', app: 'Core', status: 'active', auth: false },
  { method: 'PATCH', path: '/api/feedback/:id/links', description: 'Update Jira/Confluence links', app: 'Core', status: 'active', auth: false },
  { method: 'PATCH', path: '/api/feedback/:id/deadline', description: 'Update deadline with history', app: 'Core', status: 'active', auth: false },
  { method: 'PATCH', path: '/api/feedback/:id/app', description: 'Reassign ticket to another app', app: 'Core', status: 'active', auth: false },
  { method: 'PATCH', path: '/api/feedback/:id/assignee', description: 'Update ticket assignee', app: 'Core', status: 'active', auth: false },
  { method: 'PATCH', path: '/api/feedback/:id/automation-fte', description: 'Update hours saved value', app: 'Core', status: 'active', auth: false },
  { method: 'PATCH', path: '/api/feedback/:id/coding-effort', description: 'Update coding effort hours', app: 'Core', status: 'active', auth: false },
  { method: 'PATCH', path: '/api/feedback/:id/peak-percent', description: 'Update peak time percentage', app: 'Core', status: 'active', auth: false },
  { method: 'PATCH', path: '/api/feedback/:id/priority', description: 'Update ticket priority', app: 'Core', status: 'active', auth: false },
  { method: 'PATCH', path: '/api/feedback/bulk/priority', description: 'Bulk update ticket priorities', app: 'Core', status: 'active', auth: false },
  { method: 'PATCH', path: '/api/feedback/bulk/assignee', description: 'Bulk update ticket assignees', app: 'Core', status: 'active', auth: false },
  { method: 'GET', path: '/api/feedback/automation-summary', description: 'Aggregated FTE summary by app', app: 'Core', status: 'active', auth: false },
  { method: 'POST', path: '/api/feedback/:id/comments', description: 'Add comment to ticket', app: 'Core', status: 'active', auth: false },
  // --- Registry (Streams & Sub-Apps) ---
  { method: 'GET', path: '/api/registry', description: 'Get stream order + sub-app registry', app: 'Core', status: 'active', auth: false },
  { method: 'PUT', path: '/api/registry', description: 'Save stream order + sub-app registry', app: 'Core', status: 'active', auth: false },
  // --- Team Members ---
  { method: 'GET', path: '/api/team-members', description: 'List all team members', app: 'Core', status: 'active', auth: false },
  { method: 'PUT', path: '/api/team-members', description: 'Replace full team member list', app: 'Core', status: 'active', auth: false },
  // --- KPIs ---
  { method: 'GET', path: '/api/kpis', description: 'Home page KPIs (hours, LOC, etc.)', app: 'Core', status: 'active', auth: false },
  // --- FSM (planned) ---
  { method: 'GET', path: '/api/fsm/parameters', description: 'Get calculation parameters', app: 'FSM', status: 'planned', auth: true },
  { method: 'POST', path: '/api/fsm/calculate', description: 'Run FSM calculation', app: 'FSM', status: 'planned', auth: true },
  { method: 'GET', path: '/api/fsm/results', description: 'Get calculation results', app: 'FSM', status: 'planned', auth: true },
];

function ApiRegistryTab() {
  const [appFilter, setAppFilter] = useState<string>('all');
  const [methodFilter, setMethodFilter] = useState<string>('all');

  const filtered = endpoints.filter(e => {
    if (appFilter !== 'all' && e.app !== appFilter) return false;
    if (methodFilter !== 'all' && e.method !== methodFilter) return false;
    return true;
  });

  const apps = [...new Set(endpoints.map(e => e.app))];
  const methods = [...new Set(endpoints.map(e => e.method))];
  const activeCount = endpoints.filter(e => e.status === 'active').length;
  const plannedCount = endpoints.filter(e => e.status === 'planned').length;

  return (
    <Content>
      <PageTitle>API Documentation</PageTitle>

      <SummaryRow>
        <SummaryCard $color={theme.colors.primary}>
          <SummaryValue>{endpoints.length}</SummaryValue>
          <SummaryLabel>Total Endpoints</SummaryLabel>
        </SummaryCard>
        <SummaryCard $color={theme.colors.success}>
          <SummaryValue>{activeCount}</SummaryValue>
          <SummaryLabel>Active</SummaryLabel>
        </SummaryCard>
        <SummaryCard $color={theme.colors.warning}>
          <SummaryValue>{plannedCount}</SummaryValue>
          <SummaryLabel>Planned</SummaryLabel>
        </SummaryCard>
        <SummaryCard $color={theme.colors.info}>
          <SummaryValue>{apps.length}</SummaryValue>
          <SummaryLabel>Services</SummaryLabel>
        </SummaryCard>
      </SummaryRow>

      <SectionGrid>
        <FullWidthCard>
          <CardTitle>API Endpoints Registry</CardTitle>

          <FilterRow>
            <FilterChip $active={appFilter === 'all'} onClick={() => setAppFilter('all')}>All Apps</FilterChip>
            {apps.map(a => (
              <FilterChip key={a} $active={appFilter === a} onClick={() => setAppFilter(a)}>{a}</FilterChip>
            ))}
            <span style={{ borderLeft: `1px solid ${theme.colors.border}`, margin: '0 4px' }} />
            <FilterChip $active={methodFilter === 'all'} onClick={() => setMethodFilter('all')}>All Methods</FilterChip>
            {methods.map(m => (
              <FilterChip key={m} $active={methodFilter === m} onClick={() => setMethodFilter(m)}>
                {m}
              </FilterChip>
            ))}
          </FilterRow>

          <Table>
            <thead>
              <tr>
                <th style={{ width: 70 }}>Method</th>
                <th>Endpoint</th>
                <th>Description</th>
                <th style={{ width: 90 }}>App</th>
                <th style={{ width: 80 }}>Status</th>
                <th style={{ width: 50 }}>Auth</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((e, i) => (
                <tr key={i}>
                  <td><MethodBadge $method={e.method}>{e.method}</MethodBadge></td>
                  <td><EndpointPath>{e.path}</EndpointPath></td>
                  <td style={{ color: theme.colors.textSecondary, fontSize: 12 }}>{e.description}</td>
                  <td><Badge $color={e.app === 'Core' ? theme.colors.info : e.app === 'FSM' ? '#e05c00' : theme.colors.success}>{e.app}</Badge></td>
                  <td>
                    <Badge $color={e.status === 'active' ? theme.colors.success : e.status === 'planned' ? theme.colors.warning : theme.colors.danger}>
                      {e.status}
                    </Badge>
                  </td>
                  <td style={{ textAlign: 'center', fontSize: 12 }}>
                    {e.auth ? <span style={{ color: theme.colors.danger, fontWeight: 700 }}>Yes</span> : <span style={{ color: theme.colors.textLight }}>No</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </FullWidthCard>
      </SectionGrid>
    </Content>
  );
}

interface SubAppOwnerEntry {
  stream: string;
  streamOwner: string;
  app: string;
  owner: string;
  status: 'Live & IT Approved' | 'Live' | 'Dev' | 'Planning' | 'Blocked' | 'Testing' | 'Backlog';
  description: string;
  deadlineTarget?: string;
  budgetHours?: number;
  isStarted?: boolean;
}

const DEFAULT_OWNERS: SubAppOwnerEntry[] = [
  { stream: 'Franchise Controlling', streamOwner: 'Inês Boavida Couto', app: 'Partner Requests', owner: '', status: 'Planning', description: 'Partner onboarding and request handling' },
  { stream: 'Franchise Controlling', streamOwner: 'Inês Boavida Couto', app: 'Parameter Maintenance', owner: 'Herbert Krenn', status: 'Live', description: 'Country parameters, account mapping, payment terms' },
  { stream: 'Franchise Controlling', streamOwner: 'Inês Boavida Couto', app: 'FSM-Calculation', owner: 'Max Ammann', status: 'Dev', description: 'Franchise Statement Modernization calculation engine' },
  { stream: 'Franchise Controlling', streamOwner: 'Inês Boavida Couto', app: 'Bookings & Invoicing', owner: '', status: 'Planning', description: 'Booking data and invoicing workflows' },
  { stream: 'Franchise Controlling', streamOwner: 'Inês Boavida Couto', app: 'Interfacing', owner: 'Henning Seidel', status: 'Live', description: 'Monthly interfacing statements, SAP imports, exports' },
  { stream: 'Franchise Controlling', streamOwner: 'Inês Boavida Couto', app: 'Controlling', owner: '', status: 'Planning', description: 'Franchise controlling dashboards & reporting' },
  { stream: 'B2P Controlling', streamOwner: '', app: 'Partner Requests & Reconciliation', owner: '', status: 'Planning', description: 'Partner inquiries and reconciliation workflows' },
  { stream: 'B2P Controlling', streamOwner: '', app: 'Parameter Maintenance', owner: '', status: 'Planning', description: 'B2P-specific parameter management' },
  { stream: 'B2P Controlling', streamOwner: '', app: 'VPF', owner: '', status: 'Planning', description: 'Variable Performance Fee calculation' },
  { stream: 'B2P Controlling', streamOwner: '', app: 'Bonus & Accruals', owner: '', status: 'Planning', description: 'Bonus tracking and accrual management' },
  { stream: 'B2P Controlling', streamOwner: '', app: 'Month End Processes', owner: '', status: 'Planning', description: 'Month-end closing activities' },
  { stream: 'B2P Controlling', streamOwner: '', app: 'Reporting & Controlling', owner: '', status: 'Planning', description: 'B2P dashboards and KPIs' },
];

const STATUS_OPTIONS: SubAppOwnerEntry['status'][] = ['Live & IT Approved', 'Live', 'Dev', 'Testing', 'Planning', 'Backlog', 'Blocked'];

const STATUS_COLORS: Record<string, string> = {
  'Live & IT Approved': '#1a7f37',
  Live: '#28a745',
  Dev: '#ff5f00',
  Testing: '#fd7e14',
  Planning: '#999',
  Backlog: '#6c757d',
  Blocked: '#dc3545',
};

function loadOwners(): SubAppOwnerEntry[] {
  if (registryCache && registryCache.registry.length > 0) return registryCache.registry;
  try {
    const raw = localStorage.getItem('subAppOwners_v2');
    if (raw) {
      const data: SubAppOwnerEntry[] = JSON.parse(raw);
      data.forEach(d => { if ((d.status as string) === 'Planned') d.status = 'Planning'; });
      return data;
    }
  } catch {}
  return DEFAULT_OWNERS;
}

async function saveOwnersToApi(owners: SubAppOwnerEntry[], streamOrder: string[]): Promise<void> {
  const res = await api.put<{ streamOrder: string[]; registry: SubAppOwnerEntry[] }>('/registry', { registry: owners, streamOrder });
  registryCache = res.data;
}

function saveOwners(owners: SubAppOwnerEntry[]) {
  const order = getStreamOrder();
  saveOwnersToApi(owners, order).catch(() => {});
}

/** Saves full registry to DB (for use by Home page when syncing streams/sub-apps). */
export function saveRegistry(registry: SubAppOwnerEntry[]) {
  const order = getStreamOrder();
  api.put('/registry', { registry, streamOrder: order }).then((res) => { registryCache = res.data; }).catch(() => {});
}

export function getSubAppRegistry(): SubAppOwnerEntry[] {
  return loadOwners();
}

const STREAM_ORDER_KEY = 'streamOrder_v1';
const DEFAULT_STREAM_ORDER = ['Franchise Controlling', 'B2P Controlling', 'Business Development'];

export function getStreamOrder(): string[] {
  if (registryCache && registryCache.streamOrder.length > 0) return registryCache.streamOrder;
  try {
    const raw = localStorage.getItem(STREAM_ORDER_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return DEFAULT_STREAM_ORDER;
}

export function saveStreamOrder(order: string[]): void {
  const registry = loadOwners();
  api.put('/registry', { registry, streamOrder: order }).then((res) => { registryCache = res.data; }).catch(() => {});
}

export function getSortedStreams(): string[] {
  const registry = loadOwners();
  const allStreams = Array.from(new Set(registry.map(r => r.stream)));
  const saved = getStreamOrder();
  const ordered = saved.filter(s => allStreams.includes(s));
  allStreams.forEach(s => { if (!ordered.includes(s)) ordered.push(s); });
  return ordered;
}

export function getRegistrySortedByStream(): SubAppOwnerEntry[] {
  const registry = loadOwners();
  const order = getSortedStreams();
  return [...registry].sort((a, b) => {
    const ia = order.indexOf(a.stream);
    const ib = order.indexOf(b.stream);
    return (ia === -1 ? 999 : ia) - (ib === -1 ? 999 : ib);
  });
}

export function slugify(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

const BUILTIN_ROUTES: Record<string, string> = {
  'fsm-calculation': '/fsm',
  'interfacing': '/interfacing',
  'parameter-maintenance': '/parameter-maintenance',
};

export function getSubAppPath(appName: string): string | null {
  const slug = slugify(appName);
  if (BUILTIN_ROUTES[slug]) return BUILTIN_ROUTES[slug];
  const started = getStartedApps();
  if (started.includes(slug)) return `/sub-app/${slug}`;
  return null;
}

/** Slugs der Sub-Apps, die „gestartet“ sind (aus DB/Registry). */
export function getStartedApps(): string[] {
  const reg = registryCache?.registry ?? loadOwners();
  return reg.filter((r) => r.isStarted).map((r) => slugify(r.app));
}

/** Sub-App als gestartet in DB speichern; optional callback nach dem Speichern. */
export function startSubApp(slug: string, onDone?: () => void) {
  const reg = loadOwners();
  const updated = reg.map((r) => (slugify(r.app) === slug ? { ...r, isStarted: true } : r));
  api
    .put('/registry', { registry: updated, streamOrder: getStreamOrder() })
    .then((res) => {
      registryCache = res.data;
      onDone?.();
    })
    .catch(() => {});
}

export function isSubAppStarted(appName: string): boolean {
  const slug = slugify(appName);
  if (BUILTIN_ROUTES[slug]) return true;
  return getStartedApps().includes(slug);
}

const OwnerContent = styled.div`
  max-width: 1100px;
  margin: 0 auto;
  padding: 32px;
`;

const OwnerTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  th, td {
    padding: 10px 14px;
    text-align: left;
    border-bottom: 1px solid ${theme.colors.border};
    font-size: 13px;
  }
  th {
    background: ${theme.colors.secondary};
    color: white;
    font-weight: 700;
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
  tr:hover td { background: #f8f8f8; }
`;

const OwnerInput = styled.input`
  width: 100%;
  padding: 6px 10px;
  border: 1px solid ${theme.colors.border};
  border-radius: 6px;
  font-size: 13px;
  &:focus { outline: none; border-color: ${theme.colors.primary}; }
`;

const AddRowBtn = styled.button`
  margin-top: 16px;
  padding: 8px 18px;
  background: ${theme.colors.primary};
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  &:hover { filter: brightness(1.1); }
`;

const DeleteRowBtn = styled.button`
  background: none;
  border: none;
  color: ${theme.colors.danger};
  cursor: pointer;
  font-size: 14px;
  font-weight: 700;
  padding: 2px 6px;
  border-radius: 4px;
  &:hover { background: rgba(220,53,69,0.08); }
`;

const StatusBadge = styled.span<{ $color: string }>`
  display: inline-block;
  padding: 2px 10px;
  border-radius: 10px;
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.3px;
  color: white;
  background: ${p => p.$color};
`;

const StartAppBtn = styled.button`
  padding: 4px 12px;
  background: ${theme.colors.success};
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 10px;
  font-weight: 700;
  cursor: pointer;
  &:hover { filter: brightness(1.1); }
`;

const OpenAppLink = styled(Link)`
  padding: 4px 12px;
  background: ${theme.colors.info};
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 10px;
  font-weight: 700;
  text-decoration: none;
  &:hover { filter: brightness(1.1); }
`;

const StatusSelect = styled.select`
  padding: 4px 8px;
  border: 1px solid ${theme.colors.border};
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
  background: white;
  &:focus { outline: none; border-color: ${theme.colors.primary}; }
`;

const StreamHeader = styled.tr`
  td {
    background: ${theme.colors.secondary} !important;
    color: white !important;
    font-weight: 700 !important;
    font-size: 13px !important;
    padding: 12px 14px !important;
  }
`;

export function SubAppOwnersTab() {
  const [owners, setOwners] = useState<SubAppOwnerEntry[]>(loadOwners);
  const [ticketDeadlines, setTicketDeadlines] = useState<Record<string, string>>({});
  const teamNames = useMemo(() => getTeamMemberNames(), []);
  const [startedApps, setStartedApps] = useState<string[]>(getStartedApps());

  useEffect(() => {
    api.get<{ streamOrder: string[]; registry: SubAppOwnerEntry[] }>('/registry')
      .then((res) => { if (res.data?.registry?.length) setOwners(res.data.registry); })
      .catch(() => {});
  }, []);

  useEffect(() => {
    api.get('/feedback')
      .then(res => {
        const items: any[] = res.data || [];
        const byApp: Record<string, string[]> = {};
        items.forEach(it => {
          if (!it.app || !it.deadlineDate) return;
          const key = (it.app as string).toLowerCase();
          if (!byApp[key]) byApp[key] = [];
          byApp[key].push(it.deadlineDate);
        });
        const latest: Record<string, string> = {};
        Object.entries(byApp).forEach(([app, dates]) => {
          dates.sort();
          latest[app] = dates[dates.length - 1].slice(0, 10);
        });
        setTicketDeadlines(latest);
      })
      .catch(() => {});
  }, []);

  const getTicketDeadline = (appName: string): string => {
    const norm = (s: string) => s.toLowerCase().replace(/[-–—\s]+/g, '');
    const direct = ticketDeadlines[appName.toLowerCase()];
    if (direct) return direct;
    for (const [key, val] of Object.entries(ticketDeadlines)) {
      if (norm(key) === norm(appName)) return val;
      if (norm(key).includes(norm(appName)) || norm(appName).includes(norm(key))) return val;
    }
    return '';
  };

  const update = (idx: number, field: keyof SubAppOwnerEntry, value: string) => {
    setOwners(prev => {
      const next = prev.map((o, i) => i === idx ? { ...o, [field]: value } : o);
      saveOwners(next);
      return next;
    });
  };

  const addRow = (stream: string, streamOwner: string) => {
    setOwners(prev => {
      const next = [...prev, { stream, streamOwner, app: '', owner: '', status: 'Planning' as const, description: '', deadlineTarget: '' }];
      saveOwners(next);
      return next;
    });
  };

  const removeRow = (idx: number) => {
    setOwners(prev => {
      const next = prev.filter((_, i) => i !== idx);
      saveOwners(next);
      return next;
    });
  };

  const streams = (() => {
    const all = Array.from(new Set(owners.map(o => o.stream)));
    const order = getStreamOrder();
    const ordered = order.filter(s => all.includes(s));
    all.forEach(s => { if (!ordered.includes(s)) ordered.push(s); });
    return ordered;
  })();

  return (
    <OwnerContent>
      <h2 style={{ fontSize: 18, fontWeight: 800, marginBottom: 6, color: theme.colors.textPrimary }}>Stream &amp; Sub-App Registry</h2>
      <p style={{ fontSize: 12, color: theme.colors.textSecondary, marginBottom: 20 }}>
        Each Stream (e.g. Franchise Controlling) has a Stream Owner and contains multiple Sub-Apps. Each Sub-App has its own Owner and Status.
      </p>
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        {STATUS_OPTIONS.map(s => (
          <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <StatusBadge $color={STATUS_COLORS[s]}>{s}</StatusBadge>
            <span style={{ fontSize: 11, color: theme.colors.textSecondary }}>
              {owners.filter(o => o.status === s).length}
            </span>
          </div>
        ))}
      </div>
      <OwnerTable>
        <thead>
          <tr>
            <th style={{ width: '16%' }}>Sub-App</th>
            <th style={{ width: '12%' }}>Owner</th>
            <th style={{ width: '8%' }}>Status</th>
            <th style={{ width: '12%' }}>Deadline Target</th>
            <th>Description</th>
            <th style={{ width: 100 }}>Actions</th>
            <th style={{ width: 30 }}></th>
          </tr>
        </thead>
        <tbody>
          {streams.map(stream => {
            const streamEntries = owners.map((o, origIdx) => ({ ...o, origIdx })).filter(o => o.stream === stream);
            const streamOwner = streamEntries[0]?.streamOwner || '';
            return (
              <React.Fragment key={stream}>
                <StreamHeader>
                  <td colSpan={2}>
                    Stream: {stream || '(unnamed)'}
                  </td>
                  <td colSpan={4}>
                    <span style={{ fontSize: 11, opacity: 0.8 }}>Stream Owner: </span>
                    <select
                      value={streamOwner}
                      onChange={e => {
                        const val = e.target.value;
                        setOwners(prev => {
                          const next = prev.map(o => o.stream === stream ? { ...o, streamOwner: val } : o);
                          saveOwners(next);
                          return next;
                        });
                      }}
                      style={{ width: 180, background: 'rgba(255,255,255,0.15)', color: 'white', border: '1px solid rgba(255,255,255,0.3)', padding: '4px 8px', borderRadius: 4, fontSize: 12 }}
                    >
                      <option value="">– Select –</option>
                      {teamNames.map(n => <option key={n} value={n}>{n}</option>)}
                    </select>
                  </td>
                  <td>
                    <AddRowBtn
                      onClick={() => addRow(stream, streamOwner)}
                      style={{ margin: 0, padding: '4px 10px', fontSize: 10 }}
                    >+</AddRowBtn>
                  </td>
                </StreamHeader>
                {streamEntries.map(o => {
                  const ticketDl = getTicketDeadline(o.app);
                  const appSlug = slugify(o.app);
                  const appPath = getSubAppPath(o.app);
                  const hasBuiltin = !!BUILTIN_ROUTES[appSlug];
                  const isStarted = isSubAppStarted(o.app);
                  return (
                    <tr key={o.origIdx}>
                      <td><OwnerInput value={o.app} onChange={e => update(o.origIdx, 'app', e.target.value)} placeholder="Sub-App name..." /></td>
                      <td>
                        <select
                          value={o.owner}
                          onChange={e => update(o.origIdx, 'owner', e.target.value)}
                          style={{ width: '100%', padding: '4px 8px', borderRadius: 4, border: `1px solid ${theme.colors.border}`, fontSize: 12 }}
                        >
                          <option value="">– Select –</option>
                          {teamNames.map(n => <option key={n} value={n}>{n}</option>)}
                        </select>
                      </td>
                      <td>
                        <StatusSelect value={o.status} onChange={e => update(o.origIdx, 'status', e.target.value)}>
                          {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                        </StatusSelect>
                      </td>
                      <td>
                        <OwnerInput
                          type="date"
                          value={o.deadlineTarget || ''}
                          onChange={e => update(o.origIdx, 'deadlineTarget', e.target.value)}
                          style={{ width: '100%' }}
                        />
                        {!o.deadlineTarget && ticketDl && (
                          <span style={{ fontSize: 9, color: theme.colors.textLight, display: 'block', marginTop: 2 }}>
                            from tickets: {ticketDl}
                          </span>
                        )}
                      </td>
                      <td><OwnerInput value={o.description} onChange={e => update(o.origIdx, 'description', e.target.value)} placeholder="Description..." /></td>
                      <td>
                        {o.app && !isStarted && !hasBuiltin && (
                          <StartAppBtn onClick={() => startSubApp(appSlug, () => setStartedApps(getStartedApps()))}>
                            ▶ Start Sub-App
                          </StartAppBtn>
                        )}
                        {o.app && appPath && (
                          <OpenAppLink to={appPath + (hasBuiltin ? '' : '/feature-requests')}>
                            Open →
                          </OpenAppLink>
                        )}
                      </td>
                      <td><DeleteRowBtn onClick={() => removeRow(o.origIdx)} title="Remove">&times;</DeleteRowBtn></td>
                    </tr>
                  );
                })}
              </React.Fragment>
            );
          })}
        </tbody>
      </OwnerTable>
      <AddRowBtn onClick={() => addRow('New Stream', '')} style={{ marginTop: 16 }}>+ Add Stream &amp; Sub-App</AddRowBtn>
    </OwnerContent>
  );
}

export default function ApiManagementPage() {
  const [activeTab, setActiveTab] = useState<'api' | 'db'>('api');

  return (
    <Page>
      <Header>
        <Link to="/"><LogoImg src="/sixt-logo.png" alt="SIXT" /></Link>
        <BackLink to="/">&larr;</BackLink>
        <HeaderTitle>API &amp; DB Docu</HeaderTitle>
      </Header>

      <TabBar>
        <Tab $active={activeTab === 'api'} onClick={() => setActiveTab('api')}>API Documentation</Tab>
        <Tab $active={activeTab === 'db'} onClick={() => setActiveTab('db')}>DB Documentation</Tab>
      </TabBar>

      {activeTab === 'api' && <ApiRegistryTab />}
      {activeTab === 'db' && <DbDocumentationPage />}
    </Page>
  );
}
