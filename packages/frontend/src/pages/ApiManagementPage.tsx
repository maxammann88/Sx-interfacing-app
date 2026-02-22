import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import { theme } from '../styles/theme';
import DbDocumentationPage from './DbDocumentationPage';

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
  { method: 'GET', path: '/api/feedback', description: 'List all feedback items (optional ?app= filter)', app: 'Core', status: 'active', auth: false },
  { method: 'POST', path: '/api/feedback', description: 'Create new feedback item', app: 'Core', status: 'active', auth: false },
  { method: 'PATCH', path: '/api/feedback/:id/status', description: 'Update ticket status', app: 'Core', status: 'active', auth: false },
  { method: 'PATCH', path: '/api/feedback/:id/notes', description: 'Update working notes', app: 'Core', status: 'active', auth: false },
  { method: 'PATCH', path: '/api/feedback/:id/links', description: 'Update Jira/Confluence links', app: 'Core', status: 'active', auth: false },
  { method: 'PATCH', path: '/api/feedback/:id/deadline', description: 'Update deadline with history tracking', app: 'Core', status: 'active', auth: false },
  { method: 'PATCH', path: '/api/feedback/:id/automation-fte', description: 'Update automation FTE value', app: 'Core', status: 'active', auth: false },
  { method: 'GET', path: '/api/feedback/automation-summary', description: 'Aggregated FTE summary by app', app: 'Core', status: 'active', auth: false },
  { method: 'DELETE', path: '/api/feedback/:id', description: 'Delete feedback item', app: 'Core', status: 'active', auth: false },
  { method: 'POST', path: '/api/feedback/:id/comments', description: 'Add comment to feedback item', app: 'Core', status: 'active', auth: false },
  { method: 'GET', path: '/api/master-data', description: 'List all countries with master data', app: 'Interfacing', status: 'active', auth: false },
  { method: 'PATCH', path: '/api/master-data/:id/payment-block', description: 'Toggle payment block for country', app: 'Interfacing', status: 'active', auth: false },
  { method: 'POST', path: '/api/import/sap', description: 'Upload SAP CSV file', app: 'Interfacing', status: 'active', auth: false },
  { method: 'POST', path: '/api/import/countries', description: 'Upload Countries CSV file', app: 'Interfacing', status: 'active', auth: false },
  { method: 'POST', path: '/api/import/master-data', description: 'Upload Master Data CSV file', app: 'Interfacing', status: 'active', auth: false },
  { method: 'POST', path: '/api/import/deposit', description: 'Upload Deposit CSV file', app: 'Interfacing', status: 'active', auth: false },
  { method: 'GET', path: '/api/statement/:countryId', description: 'Generate statement for a country/period', app: 'Interfacing', status: 'active', auth: false },
  { method: 'GET', path: '/api/statement/overview', description: 'Statement overview for all countries', app: 'Interfacing', status: 'active', auth: false },
  { method: 'GET', path: '/api/export/pdf/:countryId', description: 'Generate PDF for a country statement', app: 'Interfacing', status: 'active', auth: false },
  { method: 'GET', path: '/api/export/xlsx/:countryId', description: 'Generate XLSX for a country statement', app: 'Interfacing', status: 'active', auth: false },
  { method: 'POST', path: '/api/export/corrections', description: 'Save corrected statement version', app: 'Interfacing', status: 'active', auth: false },
  { method: 'GET', path: '/api/export/corrections', description: 'List corrected statements', app: 'Interfacing', status: 'active', auth: false },
  { method: 'GET', path: '/api/export/bulk/raw-data', description: 'Export raw SAP data as XLSX', app: 'Interfacing', status: 'active', auth: false },
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
      <PageTitle>API Management</PageTitle>

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

export default function ApiManagementPage() {
  const [activeTab, setActiveTab] = useState<'api' | 'db'>('api');

  return (
    <Page>
      <Header>
        <Link to="/"><LogoImg src="/sixt-logo.png" alt="SIXT" /></Link>
        <BackLink to="/">&larr;</BackLink>
        <HeaderTitle>API, App, DB Management</HeaderTitle>
      </Header>

      <TabBar>
        <Tab $active={activeTab === 'api'} onClick={() => setActiveTab('api')}>API Management</Tab>
        <Tab $active={activeTab === 'db'} onClick={() => setActiveTab('db')}>App &amp; DB Documentation</Tab>
      </TabBar>

      {activeTab === 'api' ? <ApiRegistryTab /> : <DbDocumentationPage />}
    </Page>
  );
}
