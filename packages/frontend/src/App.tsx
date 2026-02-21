import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from 'styled-components';
import { theme } from './styles/theme';
import GlobalStyles from './styles/GlobalStyles';
import Layout from './components/Layout';
import PortalHomePage from './pages/PortalHomePage';
import FeedbackPage from './pages/FeedbackPage';
import HomePage from './pages/HomePage';
import ImportPage from './pages/ImportPage';
import StammdatenViewPage from './pages/StammdatenViewPage';
import StatementPage from './pages/StatementPage';
import InterfacingPlanningPage from './pages/InterfacingPlanningPage';
import StatementOverviewPage from './pages/StatementOverviewPage';
import ExportPage from './pages/ExportPage';

export default function App() {
  return (
    <ThemeProvider theme={theme}>
      <GlobalStyles />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<PortalHomePage />} />
          <Route path="/feedback" element={<FeedbackPage />} />

          <Route path="/interfacing" element={<Layout />}>
            <Route index element={<HomePage />} />
            <Route path="import" element={<ImportPage />} />
            <Route path="stammdaten/view" element={<StammdatenViewPage />} />
            <Route path="statement" element={<StatementPage />} />
            <Route path="overview" element={<StatementOverviewPage />} />
            <Route path="planning" element={<InterfacingPlanningPage />} />
            <Route path="export" element={<ExportPage />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}
