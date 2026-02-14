export { en } from './en';
export { zh } from './zh';

export type Language = 'en' | 'zh';

export const locales = { en, zh } as const;
export type Translations = typeof locales.en;
