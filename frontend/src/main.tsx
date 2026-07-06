
import { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './styles/index.css';
import './app/styles/tutorial.css';
import AppPro from './app/AppPro.tsx';
import { I18nProvider } from './app/i18n';
import ErrorBoundary from './app/components/ErrorBoundary';
import type { Language } from './app/types';

const PREFERENCES_KEY = 'dani_preferences_v1';
const LANGUAGE_CHANGE_EVENT = 'dani:language-change';

function readInitialLanguage(): Language {
  if (typeof window === 'undefined') {
    return 'es';
  }

  try {
    const raw = window.localStorage.getItem(PREFERENCES_KEY);
    if (!raw) {
      return 'es';
    }

    const parsed = JSON.parse(raw) as { language?: string };
    return ['en', 'es', 'pt', 'de', 'fr', 'it'].includes(parsed.language || '') ? (parsed.language as Language) : 'es';
  } catch {
    return 'es';
  }
}

function RootApp() {
  const [language, setLanguage] = useState<Language>(readInitialLanguage());

  useEffect(() => {
    const handleLanguageChange = (event: Event) => {
      const customEvent = event as CustomEvent<{ language?: Language }>;
      const nextLanguage = customEvent.detail?.language;
      if (nextLanguage && ['en', 'es', 'pt', 'de', 'fr', 'it'].includes(nextLanguage)) {
        setLanguage(nextLanguage);
      }
    };

    const handleStorageChange = (event: StorageEvent) => {
      if (event.key !== PREFERENCES_KEY || !event.newValue) {
        return;
      }

      try {
        const parsed = JSON.parse(event.newValue) as { language?: string };
        if (parsed.language && ['en', 'es', 'pt', 'de', 'fr', 'it'].includes(parsed.language)) {
          setLanguage(parsed.language as Language);
        }
      } catch {
        // ignore malformed storage updates
      }
    };

    window.addEventListener(LANGUAGE_CHANGE_EVENT, handleLanguageChange as EventListener);
    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener(LANGUAGE_CHANGE_EVENT, handleLanguageChange as EventListener);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  return (
    <I18nProvider locale={language}>
      <ErrorBoundary>
        <AppPro />
      </ErrorBoundary>
    </I18nProvider>
  );
}

createRoot(document.getElementById('root')!).render(
  <RootApp />
)
  