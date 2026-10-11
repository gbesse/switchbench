import { message } from './i18n.js';
export function requireValue(condition, locale = 'fr', code = 'invalidInput') {
  if (!condition) throw new Error(message(code, locale));
}
export const finite = (v) => typeof v === 'number' && Number.isFinite(v);
export const positive = (v) => finite(v) && v > 0;
export const nonnegative = (v) => finite(v) && v >= 0;
export const object = (v) => !!v && typeof v === 'object' && !Array.isArray(v);
