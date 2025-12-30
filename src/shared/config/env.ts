const FALLBACK_API_URL = 'http://localhost:3001/api';

export const env = {
  apiUrl: import.meta.env.VITE_API_URL ?? FALLBACK_API_URL,
  telegramBotName: import.meta.env.VITE_TELEGRAM_BOT_NAME ?? '',
};
