import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { I18nProvider } from './i18n';
import { AuthProvider } from './contexts/AuthContext';
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
import SettingsPage from './pages/SettingsPage';
import DocumentGeneratorPage from './pages/DocumentGeneratorPage';

export default function AppPro() {
  return (
    <I18nProvider locale="en">
      <BrowserRouter>
        <AuthProvider>
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
                <Route path="/understand" element={<PlaceholderPage title="Understand My Situation" />} />
                <Route path="/documents" element={<DocumentGeneratorPage />} />
                <Route path="/risks" element={<RisksPage />} />
                <Route path="/evidence" element={<PlaceholderPage title="Collect Evidence" />} />
                <Route path="/findings" element={<PlaceholderPage title="Manage Findings" />} />
                <Route path="/audit" element={<AuditPagePro />} />
                <Route path="/assessment" element={<AssessmentPage />} />
                <Route path="/integrity" element={<PlaceholderPage title="Compliance Integrity" />} />
                <Route path="/regfeed" element={<PlaceholderPage title="Regulatory Feed" />} />
                <Route path="/dora" element={<PlaceholderPage title="DORA" />} />
                <Route path="/euai" element={<PlaceholderPage title="EU AI Act" />} />
                <Route path="/escalation" element={<PlaceholderPage title="Escalation Rules" />} />
                <Route path="/integrations" element={<PlaceholderPage title="Integrations" />} />
                <Route path="/settings" element={<SettingsPage />} />
                <Route path="/setup-mfa" element={<SetupMFAPage />} />
                <Route path="/assets" element={<AssetsPage />} />
              </Route>
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </I18nProvider>
  );
}

function PlaceholderPage({ title }: { title: string }) {
  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="bg-[#1A1D28] rounded-xl p-12 border border-[#2A2E3D] text-center">
        <h1 className="text-2xl font-semibold text-white mb-2">{title}</h1>
        <p className="text-white/60">This page is coming soon...</p>
      </div>
    </div>
  );
}
