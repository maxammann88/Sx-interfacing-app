import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { ThemeProvider } from 'styled-components';
import styled, { keyframes } from 'styled-components';
import { theme } from './styles/theme';
import GlobalStyles from './styles/GlobalStyles';

const pulse = keyframes`
  0%, 100% { box-shadow: 0 4px 20px rgba(255,95,0,0.25); }
  50% { box-shadow: 0 4px 28px rgba(255,95,0,0.45); }
`;

const FloatingBtn = styled.button`
  position: fixed;
  bottom: 28px;
  right: 28px;
  z-index: 9999;
  background: ${theme.colors.primary};
  color: white;
  border: none;
  border-radius: 16px;
  padding: 14px 22px;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  box-shadow: 0 4px 20px rgba(255,95,0,0.25);
  transition: all 0.2s;
  animation: ${pulse} 3s ease-in-out infinite;
  &:hover {
    transform: translateY(-2px) scale(1.04);
    box-shadow: 0 6px 28px rgba(255,95,0,0.45);
    background: #e05500;
  }
  &:active { transform: translateY(0) scale(0.98); }
`;

function FloatingFeedbackButton() {
  const location = useLocation();
  const navigate = useNavigate();
  if (location.pathname === '/feedback') return null;
  return (
    <FloatingBtn onClick={() => navigate('/feedback')}>
      <span style={{ fontSize: 18 }}>✦</span> Features &amp; Bugs
    </FloatingBtn>
  );
}
import Layout from './components/Layout';
import FsmLayout from './components/FsmLayout';
import ParameterMaintenanceLayout from './components/ParameterMaintenanceLayout';
import PortalHomePage from './pages/PortalHomePage';
import GenericSubAppPage from './pages/GenericSubAppPage';

import AutomationControllingPage from './pages/core/AutomationControllingPage';
import CodingTeamManagementPage from './pages/core/CodingTeamManagementPage';
import ApiManagementPage from './pages/core/ApiManagementPage';
import CollaborationModelPage from './pages/core/CollaborationModelPage';
import FeedbackPage from './pages/core/FeedbackPage';
import { fetchRegistry } from './pages/core/ApiManagementPage';
import { fetchTeamMembers } from './pages/core/CodingTeamManagementPage';

import DataQualityCheckPage from './pages/interfacing/DataQualityCheckPage';
import FixVarPage from './pages/interfacing/data-checks/FixVarPage';
import ImportPage from './pages/interfacing/ImportPage';
import StatementPage from './pages/interfacing/StatementPage';
import StatementOverviewPage from './pages/interfacing/StatementOverviewPage';
import InterfacingPlanningPage from './pages/interfacing/InterfacingPlanningPage';
import ExportPage from './pages/interfacing/ExportPage';
import ApprovalFlowPage from './pages/interfacing/ApprovalFlowPage';

import MandantManagementPage from './pages/parameter-maintenance/MandantManagementPage';
import CountryParametersPage from './pages/parameter-maintenance/CountryParametersPage';
import AccountMappingPage from './pages/parameter-maintenance/AccountMappingPage';
import PaymentTermsPage from './pages/parameter-maintenance/PaymentTermsPage';

import FsmFeatureRequestsPage from './pages/fsm-calculation/FsmFeatureRequestsPage';
import FsmBudgetPage from './pages/fsm-calculation/FsmBudgetPage';
import FsmParametersPage from './pages/fsm-calculation/FsmParametersPage';
import FsmCalculationPage from './pages/fsm-calculation/FsmCalculationPage';
import FsmBookingsPage from './pages/fsm-calculation/FsmBookingsPage';
import FsmReportingPage from './pages/fsm-calculation/FsmReportingPage';

export default function App() {
  const [, setRegistryReady] = useState(0);
  useEffect(() => {
    Promise.all([fetchRegistry(), fetchTeamMembers()]).then(() => setRegistryReady((r) => r + 1));
  }, []);

  // Beim Zurückwechseln ins Tab (z. B. anderer Browser) Registry + Team neu laden
  useEffect(() => {
    const onFocus = () => {
      Promise.all([fetchRegistry(), fetchTeamMembers()]).then(() => setRegistryReady((r) => r + 1));
    };
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, []);

  return (
    <ThemeProvider theme={theme}>
      <GlobalStyles />
      <BrowserRouter>
        <FloatingFeedbackButton />
        <Routes>
          <Route path="/" element={<PortalHomePage />} />
          <Route path="/feedback" element={<FeedbackPage />} />
          <Route path="/automation-controlling" element={<AutomationControllingPage />} />
          <Route path="/api-management" element={<ApiManagementPage />} />
          <Route path="/collaboration-model" element={<CollaborationModelPage />} />
          <Route path="/coding-team" element={<CodingTeamManagementPage />} />

          <Route path="/parameter-maintenance" element={<ParameterMaintenanceLayout />}>
            <Route index element={<MandantManagementPage />} />
            <Route path="mandant" element={<MandantManagementPage />} />
            <Route path="countries" element={<CountryParametersPage />} />
            <Route path="accounts" element={<AccountMappingPage />} />
            <Route path="payment-terms" element={<PaymentTermsPage />} />
          </Route>

          <Route path="/interfacing" element={<Layout />}>
            <Route index element={<Navigate to="/interfacing/overview" replace />} />
            <Route path="import" element={<ImportPage />} />
            <Route path="statement" element={<StatementPage />} />
            <Route path="overview" element={<StatementOverviewPage />} />
            <Route path="planning" element={<InterfacingPlanningPage />} />
            <Route path="export" element={<ExportPage />} />
            <Route path="approval" element={<ApprovalFlowPage />} />
            <Route path="data-quality" element={<DataQualityCheckPage />} />
            <Route path="fix-var" element={<FixVarPage />} />
          </Route>

          <Route path="/fsm" element={<FsmLayout />}>
            <Route index element={<FsmFeatureRequestsPage />} />
            <Route path="feature-requests" element={<FsmFeatureRequestsPage />} />
            <Route path="budget" element={<FsmBudgetPage />} />
            <Route path="parameters" element={<FsmParametersPage />} />
            <Route path="calculation" element={<FsmCalculationPage />} />
            <Route path="bookings" element={<FsmBookingsPage />} />
            <Route path="reporting" element={<FsmReportingPage />} />
          </Route>

          <Route path="/sub-app/:slug/*" element={<GenericSubAppPage />} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}
