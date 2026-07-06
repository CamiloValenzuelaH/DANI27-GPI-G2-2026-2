import { ReactNode } from 'react';
import { IntlProvider } from 'react-intl';
import { translations, Language } from '../types';

interface I18nProviderProps {
  children: ReactNode;
  locale: Language;
}

export function I18nProvider({ children, locale }: I18nProviderProps) {
  const messages = translations[locale]
    ? { ...translations.en, ...translations[locale] }
    : translations.en;

  return (
    <IntlProvider
      key={locale}
      locale={locale}
      messages={messages}
      defaultLocale="en"
    >
      {children}
    </IntlProvider>
  );
}
