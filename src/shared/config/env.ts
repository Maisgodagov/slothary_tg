// Default to prod API so WebApp isn't broken when .env is missing.
// For local dev, override with VITE_API_URL in .env.
const FALLBACK_API_URL = 'https://api.slothary.ru/api';

export const env = {
  apiUrl: import.meta.env.VITE_API_URL ?? FALLBACK_API_URL,
  telegramBotName: import.meta.env.VITE_TELEGRAM_BOT_NAME ?? '',
};
