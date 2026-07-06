import { useIntl } from 'react-intl';
import { usePreferences } from '../AppShell';

export default function ThemeSection() {
  const intl = useIntl();
  const { darkMode, setDarkMode, compactView, setCompactView, sidebarLabels, setSidebarLabels } = usePreferences();

  return (
    <section className="rounded-2xl border border-slate-200 bg-slate-50 p-6 dark:border-slate-700 dark:bg-[#111318]">
      <div className="space-y-6">
        <div>
          <p className="text-sm font-semibold text-slate-950 dark:text-white">{intl.formatMessage({ id: 'settings.appearance' })}</p>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {intl.formatMessage({ id: 'settings.darkModeHelp' })}
          </p>
        </div>

        <div className="grid gap-4">
          <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-4 dark:border-slate-700 dark:bg-[#0D111A]">
            <div>
              <p className="text-sm font-medium text-slate-900 dark:text-white">{intl.formatMessage({ id: 'settings.darkMode' })}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">{intl.formatMessage({ id: 'settings.themeToggleHelp', defaultMessage: 'Toggle your app theme.' })}</p>
            </div>
            <button
              type="button"
              onClick={() => setDarkMode(!darkMode)}
              className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                darkMode ? 'bg-slate-800 text-white' : 'bg-slate-200 text-slate-900'
              }`}
            >
              {darkMode
                ? intl.formatMessage({ id: 'settings.theme.dark', defaultMessage: 'Dark' })
                : intl.formatMessage({ id: 'settings.theme.light', defaultMessage: 'Light' })}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
