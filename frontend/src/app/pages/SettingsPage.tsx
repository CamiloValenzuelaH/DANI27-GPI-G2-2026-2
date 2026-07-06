import { useIntl } from 'react-intl';
import { usePreferences } from '../components/AppShell';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import PasswordSection from '../components/settings/PasswordSection';
import TwoFactorSection from '../components/settings/TwoFactorSection';
import AuditCycleSection from '../components/settings/AuditCycleSection';
import LanguageSection from '../components/settings/LanguageSection';
import ThemeSection from '../components/settings/ThemeSection';

export default function SettingsPage() {
  const intl = useIntl();
  const { auditCycle, setAuditCycle } = usePreferences();

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-[#1A1D26] dark:text-[#E4E7EE]">
          {intl.formatMessage({ id: 'settings.title' })}
        </h1>
        <p className="text-sm text-[#5F6B7A] dark:text-[#9AA3B0] mt-1">
          {intl.formatMessage({ id: 'settings.subtitle' })}
        </p>
      </div>

      <div className="rounded-3xl border border-[#E2E5EB] bg-[#F8FAFC] shadow-sm dark:border-[#2A2E3D] dark:bg-[#0D1118]">
        <Tabs defaultValue="security" className="space-y-4">
          <TabsList className="grid grid-cols-2 md:grid-cols-4 gap-2 p-2">
            <TabsTrigger value="security">{intl.formatMessage({ id: 'settings.tab.security', defaultMessage: 'Security' })}</TabsTrigger>
            <TabsTrigger value="preferences">{intl.formatMessage({ id: 'settings.tab.preferences', defaultMessage: 'Preferences' })}</TabsTrigger>
            <TabsTrigger value="appearance">{intl.formatMessage({ id: 'settings.tab.appearance', defaultMessage: 'Appearance' })}</TabsTrigger>
            <TabsTrigger value="audit">{intl.formatMessage({ id: 'settings.tab.auditCycle', defaultMessage: 'Audit Cycle' })}</TabsTrigger>
          </TabsList>

          <div className="space-y-6 rounded-b-3xl border-t border-[#E2E5EB] bg-white p-6 dark:border-[#2A2E3D] dark:bg-[#111318]">
            <TabsContent value="security">
              <div className="space-y-6">
                <PasswordSection />
                <TwoFactorSection />
              </div>
            </TabsContent>

            <TabsContent value="preferences">
              <div className="space-y-6">
                <LanguageSection />
              </div>
            </TabsContent>

            <TabsContent value="appearance">
              <div className="space-y-6">
                <ThemeSection />
              </div>
            </TabsContent>

            <TabsContent value="audit">
              <AuditCycleSection />
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="bg-white dark:bg-[#1A1D28] border border-[#E2E5EB] dark:border-[#2A2E3D] rounded-xl shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-[#E2E5EB] dark:border-[#2A2E3D]">
        <h2 className="text-sm font-semibold text-[#1A1D26] dark:text-[#E4E7EE]">{title}</h2>
      </div>
      <div className="p-5">{children}</div>
    </section>
  );
}

function SettingRow({
  label,
  sub,
  children,
}: {
  label: string;
  sub: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-[#F3F4F6] dark:border-[#2A2E3D] pb-4 last:border-b-0 last:pb-0">
      <div>
        <div className="text-sm font-medium text-[#1A1D26] dark:text-[#E4E7EE]">{label}</div>
        <div className="text-xs text-[#5F6B7A] dark:text-[#9AA3B0] mt-1">{sub}</div>
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

function Toggle({ value, onChange }: { value: boolean; onChange: (value: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!value)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
        value ? 'bg-[#4F6EF7]' : 'bg-[#CBD5E1] dark:bg-[#3A3F52]'
      }`}
      aria-pressed={value}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
          value ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  );
}
