import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useIntl } from 'react-intl';
import { AuthProvider } from './contexts/AuthContext';
import { ValidationJobProvider } from './contexts/ValidationJobContext';
import ProtectedRoute from './components/ProtectedRoute';
import AppShell from './components/AppShell';
import LoginPage from './pages/LoginPage';
import TwoFactorPage from './pages/TwoFactorPage';
import SetupMFAPage from './pages/SetupMFAPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import AssetsPage from './pages/AssetsPage';
import AuditPagePro from './pages/AuditPagePro';
import AssessmentPage from './components/assessment/AssessmentPage';
import RisksPage from './pages/RisksPage';
import UnderstandPage from './pages/UnderstandPage';
import SettingsPage from './pages/SettingsPage';
import DocumentGeneratorPage from './pages/DocumentGeneratorPage';
import EmployeePortalPage from './pages/EmployeePortalPage';
import EvidencePage from './pages/EvidencePage';
import FindingsPage from './pages/FindingsPage';
import ConnectorList from './components/integrations/ConnectorList';
import OAuthCallback from './components/integrations/OAuthCallback';

export default function AppPro() {
  const intl = useIntl();

  return (
    <BrowserRouter>
        <AuthProvider>
          <ValidationJobProvider>
            <Routes>
            {/* Public routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/two-factor" element={<TwoFactorPage />} />
            <Route path="/register" element={<RegisterPage />} />

            {/* Protected routes wrapped by ProtectedRoute and AppShell */}
            <Route element={<ProtectedRoute />}>
              <Route element={<AppShell />}>
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/portal" element={<EmployeePortalPage />} />
                <Route path="/understand" element={<UnderstandPage />} />
                <Route path="/documents" element={<DocumentGeneratorPage />} />
                <Route path="/risks" element={<RisksPage />} />
                <Route path="/evidence" element={<EvidencePage />} />
                <Route path="/findings" element={<FindingsPage />} />
                <Route path="/audit" element={<AuditPagePro />} />
                <Route path="/assessment" element={<AssessmentPage />} />
                <Route path="/integrity" element={<PlaceholderPage title={intl.formatMessage({ id: 'menu.integrity' })} />} />
                <Route path="/regfeed" element={<PlaceholderPage title={intl.formatMessage({ id: 'menu.regfeed' })} />} />
                <Route path="/dora" element={<PlaceholderPage title={intl.formatMessage({ id: 'menu.dora' })} />} />
                <Route path="/euai" element={<PlaceholderPage title={intl.formatMessage({ id: 'menu.euai' })} />} />
                <Route path="/escalation" element={<PlaceholderPage title={intl.formatMessage({ id: 'menu.escalation' })} />} />
                <Route path="/integrations" element={<ConnectorList />} />
                <Route path="/integrations/oauth/callback" element={<OAuthCallback />} />
                <Route path="/settings" element={<SettingsPage />} />
                <Route path="/setup-mfa" element={<SetupMFAPage />} />
                <Route path="/assets" element={<AssetsPage />} />
              </Route>
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </ValidationJobProvider>
        </AuthProvider>
      </BrowserRouter>
  );
}

function PlaceholderPage({ title }: { title: string }) {
  const intl = useIntl();

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="bg-[#1A1D28] rounded-xl p-12 border border-[#2A2E3D] text-center">
        <h1 className="text-2xl font-semibold text-white mb-2">{title}</h1>
        <p className="text-white/60">{intl.formatMessage({ id: 'app.placeholder.comingSoon', defaultMessage: 'This page is coming soon...' })}</p>
      </div>
    </div>
  );
}
