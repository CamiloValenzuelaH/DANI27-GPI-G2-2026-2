import { useIntl } from 'react-intl';
import { usePreferences } from '../components/AppShell';
import type { Language, Profile, DateFormat } from '../types';

const languageNames: Record<Language, string> = {
  en: 'English',
  es: 'Español',
  pt: 'Português',
  de: 'Deutsch',
  fr: 'Français',
};

const dateFormatNames: Record<DateFormat, string> = {
  dmy: 'DD/MM/YYYY',
  mdy: 'MM/DD/YYYY',
  ymd: 'YYYY-MM-DD',
};

const timezoneOptions = ['UTC', 'Europe/Madrid', 'America/New_York', 'America/Sao_Paulo', 'Europe/Berlin'];

const profileOptions: Array<{ id: Profile; icon: string }> = [
  { id: 'foundational', icon: '🌱' },
  { id: 'established', icon: '🏛️' },
  { id: 'advanced', icon: '🚀' },
  { id: 'mature', icon: '🛡️' },
];

export default function SettingsPage() {
  const intl = useIntl();
  const {
    darkMode,
    setDarkMode,
    language,
    setLanguage,
    profile,
    setProfile,
    dateFormat,
    setDateFormat,
    timezone,
    setTimezone,
    notifications,
    setNotifications,
    autoSave,
    setAutoSave,
    compactView,
    setCompactView,
    sidebarLabels,
    setSidebarLabels,
    capaReminders,
    setCapaReminders,
    regulatoryUpdates,
    setRegulatoryUpdates,
    auditDeadlines,
    setAuditDeadlines,
    autoRunAnalysis,
    setAutoRunAnalysis,
    scheduleFrequency,
    setScheduleFrequency,
  } = usePreferences();

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

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <Card title={intl.formatMessage({ id: 'settings.organizationProfile' })}>
          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {profileOptions.map((option) => (
                <button
                  key={option.id}
                  onClick={() => setProfile(option.id)}
                  className={`p-4 rounded-xl border-2 text-left transition-all ${
                    profile === option.id
                      ? 'border-[#4F6EF7] bg-[#4F6EF7]/5 dark:bg-[#4F6EF7]/10'
                      : 'border-[#E2E5EB] dark:border-[#2A2E3D] hover:border-[#4F6EF7]/50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{option.icon}</span>
                    <div>
                      <div className="text-sm font-semibold text-[#1A1D26] dark:text-[#E4E7EE] capitalize">
                        {intl.formatMessage({ id: `settings.profile.${option.id}` })}
                      </div>
                      <div className="text-xs text-[#5F6B7A] dark:text-[#9AA3B0]">
                        {intl.formatMessage({ id: `settings.profileDesc.${option.id}` })}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
            <div className="rounded-xl border border-[#E2E5EB] dark:border-[#2A2E3D] bg-[#F7F8FA] dark:bg-[#111318] p-4 text-sm text-[#1A1D26] dark:text-[#E4E7EE]">
              <strong>{intl.formatMessage({ id: 'settings.currentProfile' })}:</strong>{' '}
              {intl.formatMessage({ id: `settings.profile.${profile}` })}
            </div>
          </div>
        </Card>

        <Card title={intl.formatMessage({ id: 'settings.languageRegion' })}>
          <div className="space-y-4">
            <SettingRow
              label={intl.formatMessage({ id: 'settings.interfaceLanguage' })}
              sub={intl.formatMessage({ id: 'settings.controlsUI' })}
            >
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value as Language)}
                className="px-3 py-2 border border-[#E2E5EB] dark:border-[#2A2E3D] rounded-md text-sm bg-white dark:bg-[#111318] dark:text-[#E4E7EE] text-[#1A1D26] w-[170px] focus:outline-none focus:ring-2 focus:ring-[#4F6EF7] focus:border-[#4F6EF7] cursor-pointer"
              >
                {Object.entries(languageNames).map(([code, name]) => (
                  <option key={code} value={code}>
                    {name}
                  </option>
                ))}
              </select>
            </SettingRow>
            <SettingRow
              label={intl.formatMessage({ id: 'settings.dateFormat' })}
              sub={intl.formatMessage({ id: 'settings.dateFormatHelp' })}
            >
              <select
                value={dateFormat}
                onChange={(e) => setDateFormat(e.target.value as DateFormat)}
                className="px-3 py-2 border border-[#E2E5EB] dark:border-[#2A2E3D] rounded-md text-sm bg-white dark:bg-[#111318] dark:text-[#E4E7EE] text-[#1A1D26] w-[170px] focus:outline-none focus:ring-2 focus:ring-[#4F6EF7] focus:border-[#4F6EF7] cursor-pointer"
              >
                {Object.entries(dateFormatNames).map(([code, name]) => (
                  <option key={code} value={code}>
                    {name}
                  </option>
                ))}
              </select>
            </SettingRow>
            <SettingRow
              label={intl.formatMessage({ id: 'settings.timezone' })}
              sub={intl.formatMessage({ id: 'settings.timezoneHelp' })}
            >
              <select
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                className="px-3 py-2 border border-[#E2E5EB] dark:border-[#2A2E3D] rounded-md text-sm bg-white dark:bg-[#111318] dark:text-[#E4E7EE] text-[#1A1D26] w-[170px] focus:outline-none focus:ring-2 focus:ring-[#4F6EF7] focus:border-[#4F6EF7] cursor-pointer"
              >
                {timezoneOptions.map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
            </SettingRow>
          </div>
        </Card>

        <Card title={intl.formatMessage({ id: 'settings.appearance' })}>
          <div className="space-y-4">
            <SettingRow
              label={intl.formatMessage({ id: 'settings.darkMode' })}
              sub={intl.formatMessage({ id: 'settings.darkModeHelp' })}
            >
              <Toggle value={darkMode} onChange={setDarkMode} />
            </SettingRow>
            <SettingRow
              label={intl.formatMessage({ id: 'settings.compactView' })}
              sub={intl.formatMessage({ id: 'settings.compactViewHelp' })}
            >
              <Toggle value={compactView} onChange={setCompactView} />
            </SettingRow>
            <SettingRow
              label={intl.formatMessage({ id: 'settings.sidebarLabels' })}
              sub={intl.formatMessage({ id: 'settings.sidebarLabelsHelp' })}
            >
              <Toggle value={sidebarLabels} onChange={setSidebarLabels} />
            </SettingRow>
          </div>
        </Card>

        <Card title={intl.formatMessage({ id: 'settings.notifications' })}>
          <div className="space-y-4">
            <SettingRow
              label={intl.formatMessage({ id: 'settings.emailNotifications' })}
              sub={intl.formatMessage({ id: 'settings.emailNotificationsHelp' })}
            >
              <Toggle value={notifications} onChange={setNotifications} />
            </SettingRow>
            <SettingRow
              label={intl.formatMessage({ id: 'settings.capaReminders' })}
              sub={intl.formatMessage({ id: 'settings.capaRemindersHelp' })}
            >
              <Toggle value={capaReminders} onChange={setCapaReminders} />
            </SettingRow>
            <SettingRow
              label={intl.formatMessage({ id: 'settings.regulatoryUpdates' })}
              sub={intl.formatMessage({ id: 'settings.regulatoryUpdatesHelp' })}
            >
              <Toggle value={regulatoryUpdates} onChange={setRegulatoryUpdates} />
            </SettingRow>
            <SettingRow
              label={intl.formatMessage({ id: 'settings.auditDeadlines' })}
              sub={intl.formatMessage({ id: 'settings.auditDeadlinesHelp' })}
            >
              <Toggle value={auditDeadlines} onChange={setAuditDeadlines} />
            </SettingRow>
          </div>
        </Card>

        <Card title={intl.formatMessage({ id: 'settings.automationScheduling' })}>
          <div className="space-y-4">
            <SettingRow
              label={intl.formatMessage({ id: 'settings.autoSave' })}
              sub={intl.formatMessage({ id: 'settings.autoSaveHelp' })}
            >
              <Toggle value={autoSave} onChange={setAutoSave} />
            </SettingRow>
            <SettingRow
              label={intl.formatMessage({ id: 'settings.autoRunAnalysis' })}
              sub={intl.formatMessage({ id: 'settings.autoRunAnalysisHelp' })}
            >
              <Toggle value={autoRunAnalysis} onChange={setAutoRunAnalysis} />
            </SettingRow>
            <SettingRow
              label={intl.formatMessage({ id: 'settings.scheduleFrequency' })}
              sub={intl.formatMessage({ id: 'settings.scheduleFrequencyHelp' })}
            >
              <select
                value={scheduleFrequency}
                onChange={(e) => setScheduleFrequency(e.target.value)}
                className="px-3 py-2 border border-[#E2E5EB] dark:border-[#2A2E3D] rounded-md text-sm bg-white dark:bg-[#111318] dark:text-[#E4E7EE] text-[#1A1D26] w-[170px] focus:outline-none focus:ring-2 focus:ring-[#4F6EF7] focus:border-[#4F6EF7] cursor-pointer"
              >
                <option value="weekly">Weekly</option>
                <option value="biweekly">Biweekly</option>
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly</option>
              </select>
            </SettingRow>
          </div>
        </Card>

        <Card title={intl.formatMessage({ id: 'settings.userManagement' })}>
          <div className="space-y-4">
            <div className="rounded-xl border border-[#E2E5EB] dark:border-[#2A2E3D] bg-[#F7F8FA] dark:bg-[#111318] p-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="text-sm font-semibold text-[#1A1D26] dark:text-[#E4E7EE]">Max Kellner</div>
                  <div className="text-xs text-[#5F6B7A] dark:text-[#9AA3B0]">CISO · WellQ</div>
                </div>
                <div className="text-xs font-semibold px-2.5 py-1 rounded-full bg-[#4F6EF7]/10 text-[#4F6EF7]">
                  {intl.formatMessage({ id: 'settings.activeUser' })}
                </div>
              </div>
            </div>
            <button className="w-full rounded-lg bg-[#4F6EF7] text-white py-2.5 text-sm font-medium hover:bg-[#3D5BE0] transition-colors">
              {intl.formatMessage({ id: 'settings.inviteTeamMember' })}
            </button>
          </div>
        </Card>
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
