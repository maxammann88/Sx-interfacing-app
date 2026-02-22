import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from 'styled-components';
import { theme } from './styles/theme';
import GlobalStyles from './styles/GlobalStyles';
import Layout from './components/Layout';
import FsmLayout from './components/FsmLayout';
import ParameterMaintenanceLayout from './components/ParameterMaintenanceLayout';
import PortalHomePage from './pages/PortalHomePage';
import FeedbackPage from './pages/FeedbackPage';
import ImportPage from './pages/ImportPage';
import StammdatenViewPage from './pages/StammdatenViewPage';
import StatementPage from './pages/StatementPage';
import InterfacingPlanningPage from './pages/InterfacingPlanningPage';
import StatementOverviewPage from './pages/StatementOverviewPage';
import ExportPage from './pages/ExportPage';
import ApprovalFlowPage from './pages/ApprovalFlowPage';
import DataQualityCheckPage from './pages/DataQualityCheckPage';
import FsmFeatureRequestsPage from './pages/fsm/FsmFeatureRequestsPage';
import FsmBudgetPage from './pages/fsm/FsmBudgetPage';
import FsmParametersPage from './pages/fsm/FsmParametersPage';
import FsmCalculationPage from './pages/fsm/FsmCalculationPage';
import FsmBookingsPage from './pages/fsm/FsmBookingsPage';
import FsmReportingPage from './pages/fsm/FsmReportingPage';
import CountryParametersPage from './pages/parameter-maintenance/CountryParametersPage';
import AccountMappingPage from './pages/parameter-maintenance/AccountMappingPage';
import PaymentTermsPage from './pages/parameter-maintenance/PaymentTermsPage';
import AutomationControllingPage from './pages/AutomationControllingPage';
import ApiManagementPage from './pages/ApiManagementPage';
import CollaborationModelPage from './pages/CollaborationModelPage';
import GenericSubAppPage from './pages/GenericSubAppPage';

export default function App() {
  return (
    <ThemeProvider theme={theme}>
      <GlobalStyles />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<PortalHomePage />} />
          <Route path="/feedback" element={<FeedbackPage />} />
          <Route path="/automation-controlling" element={<AutomationControllingPage />} />
          <Route path="/api-management" element={<ApiManagementPage />} />
          <Route path="/collaboration-model" element={<CollaborationModelPage />} />

          <Route path="/parameter-maintenance" element={<ParameterMaintenanceLayout />}>
            <Route index element={<StammdatenViewPage />} />
            <Route path="mandant" element={<StammdatenViewPage />} />
            <Route path="countries" element={<CountryParametersPage />} />
            <Route path="accounts" element={<AccountMappingPage />} />
            <Route path="payment-terms" element={<PaymentTermsPage />} />
          </Route>

          <Route path="/interfacing" element={<Layout />}>
            <Route index element={<ImportPage />} />
            <Route path="import" element={<ImportPage />} />
            <Route path="statement" element={<StatementPage />} />
            <Route path="overview" element={<StatementOverviewPage />} />
            <Route path="planning" element={<InterfacingPlanningPage />} />
            <Route path="export" element={<ExportPage />} />
            <Route path="approval" element={<ApprovalFlowPage />} />
            <Route path="data-quality" element={<DataQualityCheckPage />} />
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
