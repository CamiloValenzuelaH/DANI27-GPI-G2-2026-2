import { useIntl } from 'react-intl';
import { usePreferences } from '../AppShell';
import type { Language } from '../../types';

const languageNames: Record<Language, string> = {
  en: 'English',
  es: 'Español',
  pt: 'Português',
  de: 'Deutsch',
  fr: 'Français',
  it: 'Italiano',
};

export default function LanguageSection() {
  const intl = useIntl();
  const { language, setLanguage } = usePreferences();

  return (
    <section className="rounded-2xl border border-slate-200 bg-slate-50 p-6 dark:border-slate-700 dark:bg-[#111318]">
      <div className="space-y-3">
        <div>
          <p className="text-sm font-semibold text-slate-950 dark:text-white">{intl.formatMessage({ id: 'settings.languageRegion' })}</p>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {intl.formatMessage({ id: 'settings.controlsUI' })}
          </p>
        </div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">{intl.formatMessage({ id: 'settings.interfaceLanguage' })}</label>
        <select
          value={language}
          onChange={(e) => setLanguage(e.target.value as Language)}
          className="w-full max-w-xs rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-slate-200 dark:border-slate-700 dark:bg-[#0D111A] dark:text-white"
        >
          {Object.entries(languageNames).map(([code, name]) => (
            <option key={code} value={code}>
              {name}
            </option>
          ))}
        </select>
      </div>
    </section>
  );
}
