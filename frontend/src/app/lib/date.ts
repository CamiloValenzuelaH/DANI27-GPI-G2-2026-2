import type { DateFormat, Language } from '../types';

const LOCALE_MAP: Record<Language, string> = {
  en: 'en-US',
  es: 'es-ES',
  pt: 'pt-BR',
  de: 'de-DE',
  fr: 'fr-FR',
};

function pad(value: number) {
  return value.toString().padStart(2, '0');
}

function normalizeDate(value: Date | string | number) {
  return value instanceof Date ? value : new Date(value);
}

export function formatDate(value: Date | string | number, format: DateFormat): string {
  const date = normalizeDate(value);
  if (Number.isNaN(date.getTime())) return '';
  const day = pad(date.getDate());
  const month = pad(date.getMonth() + 1);
  const year = date.getFullYear();

  switch (format) {
    case 'mdy':
      return `${month}/${day}/${year}`;
    case 'ymd':
      return `${year}-${month}-${day}`;
    default:
      return `${day}/${month}/${year}`;
  }
}

export function formatTime(value: Date | string | number, language: Language = 'en') {
  const date = normalizeDate(value);
  if (Number.isNaN(date.getTime())) return '';

  return new Intl.DateTimeFormat(LOCALE_MAP[language] ?? 'en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).format(date);
}

export function formatDateTime(value: Date | string | number, format: DateFormat, language: Language = 'en') {
  const dateString = formatDate(value, format);
  const timeString = formatTime(value, language);
  return `${dateString} ${timeString}`;
}
