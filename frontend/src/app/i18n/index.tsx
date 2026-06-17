<<<<<<< HEAD
import { ReactNode } from 'react';
import { IntlProvider } from 'react-intl';
import { translations, Language } from '../types';

interface I18nProviderProps {
  children: ReactNode;
  locale: Language;
}

export function I18nProvider({ children, locale }: I18nProviderProps) {
  return (
    <IntlProvider
      key={locale}
      locale={locale}
      messages={translations[locale]}
      defaultLocale="en"
    >
      {children}
    </IntlProvider>
  );
}
=======
import { ReactNode } from 'react';
import { IntlProvider } from 'react-intl';
import { translations, Language } from '../types';

interface I18nProviderProps {
  children: ReactNode;
  locale: Language;
}

export function I18nProvider({ children, locale }: I18nProviderProps) {
  return (
    <IntlProvider
      key={locale}
      locale={locale}
      messages={translations[locale]}
      defaultLocale="en"
    >
      {children}
    </IntlProvider>
  );
}
>>>>>>> Chat-bot
